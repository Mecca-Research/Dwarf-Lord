import copy
import json
from pathlib import Path
import tempfile
import unittest
from PIL import Image

from gait_calibration import digest
from motion_registration import settings_hash
from whole_stride import measure, propose_calibration, stride_binding, travel_calibration


class WholeStrideTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        settings = {'durationsMs': [125] * 8}
        (self.folder / 'motion-polish.json').write_text(json.dumps(settings))
        Image.new('RGBA', (640, 640), (80, 80, 80, 255)).save(self.folder / 'source-sheet.png')
        Image.new('RGBA', (640, 640), (80, 80, 80, 255)).save(self.folder / 'atlas.png')
        frames = []
        for i in range(8):
            Image.new('RGBA', (640, 640), (80, 80, 80, 255)).save(self.folder / f'{i:02}.png')
            frames.append({'file': f'{i:02}.png', 'durationMs': 125})
        self.manifest = {'direction': 'right', 'sourceSha256': digest(self.folder / 'source-sheet.png'),
                         'frames': frames, 'atlas': {'file': 'atlas.png'},
                         'sourceFrameOrder': list(range(8)),
                         'playback': {'durationsMs': [125] * 8},
                         'registration': {'settingsSha256': settings_hash(settings),
                                          'targetBodyHeight': 520, 'targetAnchor': [320, 616]}}
        self.save_manifest()
        self.obs = {'folder': str(self.folder), 'binding': stride_binding(self.folder, self.manifest),
                    'runtimeSha256': digest('src/game/world/npc-motion.ts'),
                    'cameraElevationRadians': .6, 'strideBodyRatio': 160 / 520,
                    'transitions': [{'from': i, 'to': (i + 1) % 8,
                                     'foot': 'left' if i < 4 else 'right',
                                     'landmark': 'heel' if i in (0, 4) else 'toe',
                                     'fromPoint': [350, 600], 'toPoint': [330, 600],
                                     'correspondenceReviewed': True} for i in range(8)]}

    def save_manifest(self):
        (self.folder / 'manifest.json').write_text(json.dumps(self.manifest))

    def test_all_boundaries_pass_without_automatic_art_approval(self):
        result = measure(self.obs)
        self.assertTrue(result['measurementPassed'])
        self.assertEqual(result['coveredBoundaries'], 8)
        self.assertTrue(result['returnBoundaryCovered'])
        self.assertLess(result['maxContactJumpPx'], .001)
        self.assertFalse(result['wholeStrideApproved'])
        self.assertFalse(result['loopApproved'])

    def test_return_boundary_cannot_be_omitted_or_duplicated(self):
        for transitions in [self.obs['transitions'][:7], self.obs['transitions'][:7] + [self.obs['transitions'][0]]]:
            bad = copy.deepcopy(self.obs); bad['transitions'] = transitions
            with self.assertRaisesRegex(ValueError, 'eight ordered'):
                measure(bad)

    def test_bad_return_is_visible_even_when_other_seven_fit(self):
        bad = copy.deepcopy(self.obs)
        bad['transitions'][7]['toPoint'] = [350, 600]
        result = measure(bad)
        self.assertFalse(result['measurementPassed'])
        self.assertEqual(result['transitions'][7]['contactJumpPx'], 20)
        self.assertGreater(result['fittedMaxContactJumpPx'], 6)

    def test_unreviewed_material_point_is_not_approved(self):
        bad = copy.deepcopy(self.obs)
        bad['transitions'][4]['correspondenceReviewed'] = False
        result = measure(bad)
        self.assertFalse(result['measurementPassed'])
        self.assertFalse(result['materialCorrespondenceReviewed'])

    def test_stale_export_runtime_and_registration_are_rejected(self):
        for field in self.obs['binding']:
            bad = copy.deepcopy(self.obs); bad['binding'][field] = 'changed'
            with self.assertRaisesRegex(ValueError, 'Stale'): measure(bad)
        bad = copy.deepcopy(self.obs); bad['runtimeSha256'] = 'changed'
        with self.assertRaisesRegex(ValueError, 'runtime'): measure(bad)
        self.manifest['registration']['targetBodyHeight'] = 530; self.save_manifest()
        with self.assertRaisesRegex(ValueError, 'Stale'): measure(self.obs)

    def test_actual_settings_change_is_not_hidden_by_cached_hash(self):
        (self.folder / 'motion-polish.json').write_text('{"durationsMs":[140,140,140,140,140,140,140,140]}')
        with self.assertRaisesRegex(ValueError, 'Stale'): measure(self.obs)

    def test_changed_atlas_and_exported_frame_are_rejected(self):
        for name in ['atlas.png', '03.png']:
            path = self.folder / name; saved = path.read_bytes()
            Image.new('RGBA', (640, 640), (40, 40, 40, 255)).save(path)
            with self.assertRaisesRegex(ValueError, 'Stale'): measure(self.obs)
            path.write_bytes(saved)

    def test_transparent_or_out_of_canvas_point_is_rejected(self):
        Image.new('RGBA', (640, 640), (0, 0, 0, 0)).save(self.folder / '00.png')
        self.obs['binding'] = stride_binding(self.folder, self.manifest)
        with self.assertRaisesRegex(ValueError, 'opaque'): measure(self.obs)
        bad = copy.deepcopy(self.obs); bad['transitions'][0]['fromPoint'] = [640, 600]
        with self.assertRaisesRegex(ValueError, 'coordinates'): measure(bad)

    def test_bounded_candidate_never_adopts_or_approves_itself(self):
        candidate = propose_calibration(measure(self.obs))
        self.assertTrue(candidate['candidateAvailable'])
        self.assertEqual(candidate['proposedDurationsMs'], [125] * 8)
        self.assertLess(candidate['predictedMaxContactJumpPx'], .001)
        self.assertFalse(candidate['adoptedByRuntime'])
        self.assertFalse(candidate['wholeStrideApproved'])

    def test_reverse_stance_cannot_be_hidden_by_retiming(self):
        bad = copy.deepcopy(self.obs); bad['transitions'][2]['toPoint'] = [380, 600]
        candidate = propose_calibration(measure(bad))
        self.assertFalse(candidate['candidateAvailable'])
        self.assertEqual(candidate['reversedBoundaries'], [2])

    def test_tiny_phase_cannot_get_below_minimum_hold_time(self):
        bad = copy.deepcopy(self.obs); bad['transitions'][7]['toPoint'] = [349, 600]
        candidate = propose_calibration(measure(bad))
        self.assertFalse(candidate['candidateAvailable'])
        self.assertIn('hold bounds', candidate['reason'])

    def test_large_registration_cannot_mask_bad_ground_geometry(self):
        bad = copy.deepcopy(self.obs); bad['transitions'][0]['toPoint'] = [330, 520]
        candidate = propose_calibration(measure(bad))
        self.assertFalse(candidate['candidateAvailable'])
        self.assertIn('exceeds 12px', candidate['reason'])

    def test_current_pilot_diagnostics_reproduce_without_approval(self):
        for name in ['laborer-back-left', 'blacksmith-right']:
            observations = json.loads(Path(f'docs/{name}-whole-stride-observations.json').read_text())
            measured = measure(observations)
            self.assertEqual(measured, json.loads(Path(f'docs/{name}-whole-stride-measurement.json').read_text()))
            self.assertEqual(propose_calibration(measured), json.loads(Path(f'docs/{name}-whole-stride-candidate.json').read_text()))
            self.assertFalse(measured['wholeStrideApproved'])
            self.assertEqual(measured['materialCorrespondenceReviewed'], name == 'blacksmith-right')
            self.assertEqual(measured['coveredBoundaries'], 8)

    def test_runtime_export_recomputes_contacts_instead_of_trusting_pass_flags(self):
        record = measure(self.obs)
        path = self.folder / 'travel-calibration.json'
        path.write_text(json.dumps(record))
        calibration = travel_calibration(self.folder, self.manifest)
        self.assertEqual(calibration['strideBodyRatio'], self.obs['strideBodyRatio'])
        self.assertEqual(calibration['durationsMs'], [125] * 8)
        for mutation in ['point', 'unreviewed', 'runtime', 'binding']:
            bad = copy.deepcopy(record)
            if mutation == 'point': bad['transitions'][0]['toPoint'][0] = 310
            if mutation == 'unreviewed': bad['transitions'][0]['correspondenceReviewed'] = False
            if mutation == 'runtime': bad['runtimeSha256'] = 'changed'
            if mutation == 'binding': bad['binding']['atlasSha256'] = 'changed'
            path.write_text(json.dumps(bad))
            with self.assertRaises(ValueError): travel_calibration(self.folder, self.manifest)


if __name__ == '__main__':
    unittest.main()
