import copy
import json
from pathlib import Path
import unittest
from gait_calibration import measure


class GaitCalibrationTests(unittest.TestCase):
    def setUp(self):
        self.observations = json.loads(Path('docs/blacksmith-right-gait-observations.json').read_text())
        self.folder = Path(self.observations['folder'])
        self.manifest = json.loads((self.folder / 'manifest.json').read_text())

    def test_reviewed_sample_fit_reproduces_without_whole_stride_approval(self):
        report = measure(self.folder, self.manifest, self.observations)
        self.assertEqual(report, json.loads(Path('docs/blacksmith-right-gait-measurement.json').read_text()))
        self.assertLess(report['maxResidualPx'], 3)
        self.assertTrue(report['measurementPassed'])
        self.assertFalse(report['strideApproved'])
        self.assertFalse(report['loopApproved'])

    def test_changed_timing_and_frames_invalidate_observations(self):
        for field in ['sourceSha256', 'settingsSha256', 'frameSha256', 'durationsMs']:
            stale = copy.deepcopy(self.observations)
            stale['binding'][field] = 'changed'
            with self.assertRaisesRegex(ValueError, 'Stale'):
                measure(self.folder, self.manifest, stale)

    def test_bad_foot_spacing_fails_instead_of_becoming_approved(self):
        bad = copy.deepcopy(self.observations)
        bad['tracks'][0]['samples'][1]['point'][0] -= 60
        report = measure(self.folder, self.manifest, bad)
        self.assertFalse(report['measurementPassed'])
        self.assertFalse(report['strideApproved'])

    def test_transparent_landmark_is_not_contact_evidence(self):
        bad = copy.deepcopy(self.observations)
        bad['tracks'][0]['samples'][1]['point'] = [0, 0]
        with self.assertRaisesRegex(ValueError, 'opaque'):
            measure(self.folder, self.manifest, bad)

    def test_duplicate_frames_and_single_foot_cannot_fit(self):
        bad = copy.deepcopy(self.observations)
        bad['tracks'][0]['samples'][1]['frame'] = bad['tracks'][0]['samples'][0]['frame']
        with self.assertRaises(ValueError): measure(self.folder, self.manifest, bad)
        bad['tracks'] = bad['tracks'][:1]
        with self.assertRaises(ValueError): measure(self.folder, self.manifest, bad)
