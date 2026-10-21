import unittest
from contact_playback import evaluate, joint_constraints


class PlaybackContactTest(unittest.TestCase):
    def test_held_frames_cannot_hide_a_boundary_slide(self):
        result = evaluate([125]*8, [[10, 20]]*8, [0, 1, 2, 3], [1, 0], 80)
        self.assertEqual(result['heldPoseWithinFrameDriftPx'], 0)
        self.assertEqual(result['maxBoundaryContactDriftPx'], 30)
        self.assertEqual([t['contactJumpPx'] for t in result['transitions']], [10]*3)
        self.assertFalse(result['contactApproved'])

    def test_matching_local_travel_keeps_boundary_contact_fixed(self):
        result = evaluate([125]*8, [[80-i*10, 20] for i in range(8)], [0, 1, 2, 3], [1, 0], 80)
        self.assertEqual(result['maxBoundaryContactDriftPx'], 0)
        self.assertFalse(result['materialCorrespondenceReviewed'])
        self.assertFalse(result['contactApproved'])

    def test_missing_contact_transition_and_invalid_timings_are_rejected(self):
        for frames in [[0, 2, 3], [2, 1], [0, 0], [8, 9]]:
            with self.assertRaises(ValueError): evaluate([125]*8, [[10, 20]]*8, frames, [1, 0], 80)
        with self.assertRaises(ValueError): evaluate([0]+[125]*7, [[10, 20]]*8, [0, 1], [1, 0], 80)

    def test_return_support_includes_next_cycle_root_travel(self):
        points = [[70, 20]]*8
        points[6], points[7], points[0], points[1] = [100, 20], [90, 20], [80, 20], [70, 20]
        result = evaluate([125]*8, points, [6, 7, 0, 1], [1, 0], 80)
        self.assertEqual(result['maxBoundaryContactDriftPx'], 0)
        self.assertEqual(result['transitions'][1], {'from': 7, 'to': 0, 'contactJumpPx': 0})
        points[0] = [90, 20]
        self.assertEqual(evaluate([125]*8, points, [6, 7, 0, 1], [1, 0], 80)['transitions'][1]['contactJumpPx'], 10)

    def test_cane_only_root_correction_cannot_approve_conflicting_foot(self):
        points = [[80-i*10, 20] for i in range(8)]
        tracks = [{'name': 'cane', 'points': points, 'supportFrames': [0, 1, 2]},
                  {'name': 'foot', 'points': [[80, 20]]*8, 'supportFrames': [0, 1, 2]}]
        report = joint_constraints([125]*8, tracks, [1, 0], 80)
        self.assertEqual(report['maxRequiredRootDisagreementPx'], 10)
        self.assertFalse(report['jointContactApproved'])
        tracks[1]['points'] = points
        self.assertEqual(joint_constraints([125]*8, tracks, [1, 0], 80)['maxRequiredRootDisagreementPx'], 0)

    def test_no_overlap_is_missing_evidence_not_zero_conflict(self):
        tracks = [{'name': 'cane', 'points': [[80,20]]*8, 'supportFrames': [0,1]},
                  {'name': 'foot', 'points': [[80,20]]*8, 'supportFrames': [4,5]}]
        report = joint_constraints([125]*8, tracks, [1,0], 80)
        self.assertIsNone(report['maxRequiredRootDisagreementPx'])
        self.assertFalse(report['jointContactApproved'])
