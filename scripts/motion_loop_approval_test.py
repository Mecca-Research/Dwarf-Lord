import copy
import json
from pathlib import Path
import unittest
from unittest.mock import patch
import motion_loop_approval
from motion_loop_approval import apply


class LoopApprovalTests(unittest.TestCase):
    def setUp(self):
        self.folder = Path('public/sprites/Blacksmith/motion/hammer-contact/actor')
        self.manifest = json.loads((self.folder / 'manifest.json').read_text())

    def test_fixed_view_forge_review_preserves_task_completion_behavior(self):
        apply(self.folder, self.manifest)
        self.assertTrue(self.manifest['playback']['loopApproved'])
        self.assertEqual(self.manifest['playback']['mode'], 'once-hold')
        self.assertEqual(self.manifest['playback']['endBehavior'], 'hold-last')
        self.assertFalse(self.manifest['productionReady'])

    def test_changed_source_registration_or_timing_revokes_review(self):
        for mutate in [lambda m: m.update(sourceSha256='changed'),
                       lambda m: m['registration'].update(settingsSha256='changed'),
                       lambda m: m['frames'][0].update(durationMs=999)]:
            stale = copy.deepcopy(self.manifest)
            mutate(stale)
            apply(self.folder, stale)
            self.assertFalse(stale['playback']['loopApproved'])
            self.assertEqual(stale['loopReview']['status'], 'stale-or-incomplete')

    def test_absent_review_cannot_inherit_an_approval(self):
        other = Path('public/sprites/Cook/motion/chop-vegetables/actor')
        manifest = json.loads((other / 'manifest.json').read_text())
        manifest['playback']['loopApproved'] = True
        apply(other, manifest)
        self.assertFalse(manifest['playback']['loopApproved'])

    def test_changed_frame_or_station_revokes_review(self):
        original = motion_loop_approval.digest
        for changed in [self.folder / '00.png', self.folder / '../../../../workstations/anvil/sprite.png']:
            with patch('motion_loop_approval.digest', side_effect=lambda p: 'changed' if p.resolve() == changed.resolve() else original(p)):
                manifest = copy.deepcopy(self.manifest)
                apply(self.folder, manifest)
                self.assertFalse(manifest['playback']['loopApproved'])
