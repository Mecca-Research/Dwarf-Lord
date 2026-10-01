import json
import math
import subprocess
import unittest
from pathlib import Path

class HeldStanceTests(unittest.TestCase):
    def test_report_reproduces_runtime_hold_travel_without_approval(self):
        path=Path('docs/blacksmith-right-held-stance-measurement.json')
        reviewed=path.read_bytes()
        subprocess.run(['python3','scripts/measure-held-stance.py'],check=True,capture_output=True)
        self.assertEqual(path.read_bytes(),reviewed)
        report=json.loads(reviewed)
        self.assertFalse(report['wholeStrideApproved'])
        self.assertFalse(report['loopApproved'])
        # The narrowed return invalidates the old sampled fit. Neither sampled
        # fitting nor the held-root model can approve anatomical contacts.
        keyfit=json.loads(Path('docs/blacksmith-right-gait-measurement.json').read_text())
        self.assertFalse(keyfit['measurementPassed'])
        for measurement in report['measurements']:
            self.assertGreater(measurement['maxWithinHoldDriftPx'], 0)
            if measurement['calibration'] == 'runtime-estimate':
                self.assertGreater(measurement['maxWithinHoldDriftPx'], 100)
            self.assertEqual({t['foot'] for t in measurement['tracks']},{'left','right'})
            for track in measurement['tracks']:
                for hold in track['holds']:
                    self.assertAlmostEqual(hold['withinHoldDriftPx'],math.hypot(*hold['projectedTravelPx']),places=2)
