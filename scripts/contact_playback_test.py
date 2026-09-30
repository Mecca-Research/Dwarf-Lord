import unittest
from contact_playback import evaluate


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
