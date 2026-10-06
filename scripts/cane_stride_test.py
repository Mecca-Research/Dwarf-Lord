import copy
import json
from pathlib import Path
import tempfile
import unittest

from PIL import Image

from cane_stride import measure, observation_digest, REVIEW_FIELDS
from gait_calibration import digest
from motion_registration import settings_hash
from whole_stride import stride_binding, travel_calibration


class CaneStrideTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        settings = {'durationsMs': [125] * 8}
        (self.folder / 'motion-polish.json').write_text(json.dumps(settings))
        for name in ['source-sheet.png', 'atlas.png'] + [f'{i:02}.png' for i in range(8)]:
            Image.new('RGBA', (640, 640), (80, 80, 80, 255)).save(self.folder / name)
        self.manifest = {'character': 'Elder', 'direction': 'right',
            'sourceSha256': digest(self.folder / 'source-sheet.png'),
            'frames': [{'file': f'{i:02}.png', 'durationMs': 125} for i in range(8)],
            'atlas': {'file': 'atlas.png'}, 'sourceFrameOrder': list(range(8)),
            'playback': {'durationsMs': [125] * 8},
            'registration': {'settingsSha256': settings_hash(settings),
                             'targetBodyHeight': 520, 'targetAnchor': [320, 616]}}
        (self.folder / 'manifest.json').write_text(json.dumps(self.manifest))
        self.feet = {'folder': str(self.folder), 'binding': stride_binding(self.folder, self.manifest),
            'runtimeSha256': digest('src/game/world/npc-motion.ts'),
            'cameraElevationRadians': .6, 'strideBodyRatio': 160 / 520,
            'transitions': [{'from': i, 'to': (i + 1) % 8,
                'foot': 'left' if i < 4 else 'right', 'landmark': 'heel' if i in (0, 4) else 'toe',
                'fromPoint': [350, 600], 'toPoint': [330, 600],
                'correspondenceReviewed': True} for i in range(8)]}
        tips = [[460, 600], [440, 600], [420, 600], [400, 600],
                [420, 550], [470, 540], [510, 550], [480, 590]]
        self.cane = {'binding': self.feet['binding'], 'runtimeSha256': self.feet['runtimeSha256'],
            'footObservationsSha256': observation_digest(self.feet),
            'cane': {'tipPoints': tips, 'collarPoints': [[x, y - 240] for x, y in tips],
                'plantFrames': [0, 1, 2, 3], 'recoveryFrames': [4, 5, 6, 7],
                **{field: True for field in REVIEW_FIELDS}}}

    def test_same_root_pass_is_not_automatic_motion_approval(self):
        result = measure(self.feet, self.cane)
        self.assertTrue(result['soleMeasurementPassed'])
        self.assertTrue(result['measurementPassed'])
        self.assertEqual(result['canePlant']['maxBoundaryContactDriftPx'], 0)
        self.assertEqual(result['maxRequiredRootDisagreementPx'], 0)
        self.assertFalse(result['jointContactApproved'])
        self.assertFalse(result['wholeStrideApproved'])
        self.assertFalse(result['loopApproved'])

    def test_good_soles_cannot_hide_a_cane_requiring_a_different_stride(self):
        changed = copy.deepcopy(self.cane)
        changed['cane']['tipPoints'][:4] = [[460, 600], [450, 600], [440, 600], [430, 600]]
        result = measure(self.feet, changed)
        self.assertTrue(result['soleMeasurementPassed'])
        self.assertEqual(result['maxRequiredRootDisagreementPx'], 10)
        self.assertEqual(result['canePlant']['maxBoundaryContactDriftPx'], 30)
        self.assertFalse(result['measurementPassed'])

    def test_support_window_measures_next_cycle_return(self):
        changed = copy.deepcopy(self.cane)
        changed['cane']['tipPoints'] = [[440, 600], [420, 600], [500, 550], [520, 540],
                                       [520, 550], [500, 590], [480, 600], [460, 600]]
        changed['cane']['plantFrames'] = [6, 7, 0, 1]
        changed['cane']['recoveryFrames'] = [2, 3, 4, 5]
        result = measure(self.feet, changed)
        self.assertTrue(result['measurementPassed'])
        self.assertIn((7, 0), [(x['from'], x['to']) for x in result['simultaneousBoundaries']])
        self.assertEqual(result['canePlant']['projectedContacts'], [[600, 600]] * 4)

    def test_recovery_cannot_be_skipped_duplicated_or_claimed_without_review(self):
        for field in ['plantFrames', 'recoveryFrames']:
            changed = copy.deepcopy(self.cane); del changed['cane'][field]
            with self.assertRaisesRegex(ValueError, 'Complete ordered'):
                measure(self.feet, changed)
        for recovered in [[4, 5, 7], [4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7], [4, 6, 5, 7]]:
            changed = copy.deepcopy(self.cane); changed['cane']['recoveryFrames'] = recovered
            with self.assertRaisesRegex(ValueError, 'Complete ordered'):
                measure(self.feet, changed)
        for field in REVIEW_FIELDS:
            changed = copy.deepcopy(self.cane); changed['cane'][field] = False
            self.assertFalse(measure(self.feet, changed)['measurementPassed'])

    def test_hidden_or_missing_tip_and_collar_cannot_supply_evidence(self):
        for field in ['tipPoints', 'collarPoints']:
            changed = copy.deepcopy(self.cane); changed['cane'][field] = changed['cane'][field][:7]
            with self.assertRaisesRegex(ValueError, 'All eight'):
                measure(self.feet, changed)
            changed = copy.deepcopy(self.cane); changed['cane'][field][4] = [640, 600]
            with self.assertRaisesRegex(ValueError, 'outside sprite'):
                measure(self.feet, changed)
        path = self.folder / '04.png'
        with Image.open(path) as im:
            image = im.convert('RGBA'); image.putpixel((420, 550), (0, 0, 0, 0)); image.save(path)
        self.feet['binding'] = stride_binding(self.folder, self.manifest)
        self.cane['binding'] = self.feet['binding']
        self.cane['footObservationsSha256'] = observation_digest(self.feet)
        with self.assertRaisesRegex(ValueError, 'opaque observed'):
            measure(self.feet, self.cane)

    def test_changing_actual_sole_observations_invalidates_joint_record(self):
        changed = copy.deepcopy(self.feet)
        changed['transitions'][0]['fromPoint'][0] += 1
        with self.assertRaisesRegex(ValueError, 'Stale coordinated'):
            measure(changed, self.cane)
        changed = copy.deepcopy(self.cane); changed['runtimeSha256'] = 'old-runtime'
        with self.assertRaisesRegex(ValueError, 'Stale coordinated'):
            measure(self.feet, changed)

    def test_elder_export_recomputes_joint_contacts_and_rejects_cached_pass(self):
        (self.folder / 'travel-calibration.json').write_text(json.dumps(self.feet))
        with self.assertRaisesRegex(ValueError, 'requires current coordinated'):
            travel_calibration(self.folder, self.manifest)
        path = self.folder / 'coordinated-support.json'
        path.write_text(json.dumps(self.cane))
        result = travel_calibration(self.folder, self.manifest)
        self.assertEqual(result['coordinatedSupport']['sha256'], digest(path))
        self.assertEqual(result['coordinatedSupport']['plantFrames'], [0, 1, 2, 3])
        changed = copy.deepcopy(self.cane)
        changed['measurementPassed'] = True
        changed['cane']['tipPoints'][2][0] += 20
        path.write_text(json.dumps(changed))
        with self.assertRaisesRegex(ValueError, 'do not pass the same'):
            travel_calibration(self.folder, self.manifest)
        self.manifest['character'] = 'Blacksmith'
        self.assertNotIn('coordinatedSupport', travel_calibration(self.folder, self.manifest))


if __name__ == '__main__':
    unittest.main()
