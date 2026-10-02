import copy
import json
from pathlib import Path
import unittest
from joint_support import measure


class JointSupportTest(unittest.TestCase):
    def setUp(self):
        self.input = json.loads(Path('docs/elder-back-contact-measurement.json').read_text())

    def test_bound_joint_evidence_reproduces_without_approval(self):
        result = measure(self.input)
        self.assertEqual(result, json.loads(Path('docs/elder-back-joint-contact-measurement.json').read_text()))
        # Local pose corrections may improve the diagnostic without satisfying
        # the six-pixel contact tolerance or proving material correspondence.
        self.assertGreater(result['maxRequiredRootDisagreementPx'], 6)
        self.assertFalse(result['jointContactApproved'])

    def test_changed_source_timing_or_runtime_invalidates_support_claim(self):
        for field in ['sourceSha256', 'settingsSha256', 'frameSha256', 'durationsMs']:
            stale = copy.deepcopy(self.input);stale['binding'][field] = 'changed'
            with self.assertRaisesRegex(ValueError, 'Stale'): measure(stale)
        stale = copy.deepcopy(self.input);stale['runtimeSha256'] = 'changed'
        with self.assertRaisesRegex(ValueError, 'Stale'): measure(stale)
