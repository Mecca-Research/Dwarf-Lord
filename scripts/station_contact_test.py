import copy
import json
import unittest
from pathlib import Path
from station_contact import measure


class StationContactTest(unittest.TestCase):
    def test_borrin_visible_finger_measurements_reproduce_current_ledger_contacts(self):
        records = json.loads(Path('docs/art-review/motion44/Borrin-ledger-contact.json').read_text())
        self.assertEqual(len(records), 2)
        for record in records:
            result = measure(record['config'])
            self.assertEqual(result, record)
            self.assertLessEqual(result['maxOutsideWorkingFacePx'], 6)
            self.assertFalse(result['approval'], 'projected placement is not a final motion approval')

    def test_borrin_changed_authored_finger_frame_requires_contact_review(self):
        records = json.loads(Path('docs/art-review/motion44/Borrin-ledger-contact.json').read_text())
        for record in records:
            changed = copy.deepcopy(record['config'])
            changed['binding']['frameSha256'][7] = 'changed'
            with self.assertRaises(ValueError):
                measure(changed)

    def test_masonry_landmarks_reproduce_the_reviewed_visible_face(self):
        config=json.loads(Path('docs/masonry-contact-observations.json').read_text())
        result=measure(config)
        self.assertEqual(result,json.loads(Path('docs/masonry-contact-measurement.json').read_text()))
        self.assertEqual(result['maxOutsideWorkingFacePx'],0)
        self.assertFalse(result['approval'])

    def test_changed_prop_or_missing_frame_invalidates_review(self):
        config=json.loads(Path('docs/masonry-contact-observations.json').read_text())
        changed=copy.deepcopy(config);changed['dependencies'][0]['sha256']='stale'
        with self.assertRaises(ValueError):measure(changed)
        changed=copy.deepcopy(config);changed['points'].pop()
        with self.assertRaises(ValueError):measure(changed)
