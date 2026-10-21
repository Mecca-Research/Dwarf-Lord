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

    def test_fixed_view_forestry_approval_keeps_tree_fall_out_of_scope(self):
        folder = Path('public/sprites/Ginger/motion/fell-tree/actor')
        manifest = json.loads((folder / 'manifest.json').read_text())
        apply(folder, manifest)
        self.assertTrue(manifest['playback']['loopApproved'])
        self.assertEqual(manifest['playback']['mode'], 'once-hold')
        self.assertFalse(manifest['productionReady'])
        self.assertIn('not a tree-fall', manifest['loopReview']['scope'])

    def test_weight_inspection_review_does_not_approve_weighing_or_walking(self):
        folder = Path('public/sprites/Quartermaster/motion/check-weights/actor')
        manifest = json.loads((folder / 'manifest.json').read_text())
        apply(folder, manifest)
        self.assertTrue(manifest['playback']['loopApproved'])
        self.assertEqual(manifest['playback']['mode'], 'once-hold')
        self.assertFalse(manifest['productionReady'])
        self.assertIn('not weight placement', manifest['loopReview']['scope'])

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
        other = Path('public/sprites/Elder/motion/walk/front')
        manifest = json.loads((other / 'manifest.json').read_text())
        manifest['playback']['loopApproved'] = True
        manifest['loopReview'] = {'status': 'approved'}
        apply(other, manifest)
        self.assertFalse(manifest['playback']['loopApproved'])
        self.assertNotIn('loopReview', manifest)

    def test_changed_registration_and_unexported_settings_revoke_review(self):
        for field, value in [('targetAnchor', [0, 0]), ('targetBodyHeight', 420)]:
            stale = copy.deepcopy(self.manifest)
            stale['registration'][field] = value
            apply(self.folder, stale)
            self.assertFalse(stale['playback']['loopApproved'])
        with patch('motion_loop_approval.polish_settings', return_value={'changed': True}):
            apply(self.folder, self.manifest)
            self.assertFalse(self.manifest['playback']['loopApproved'])

    def test_changed_frame_or_station_revokes_review(self):
        original = motion_loop_approval.digest
        for changed in [self.folder / '00.png', self.folder / 'atlas.png', self.folder / '../../../../workstations/anvil/sprite.png']:
            with patch('motion_loop_approval.digest', side_effect=lambda p: 'changed' if p.resolve() == changed.resolve() else original(p)):
                manifest = copy.deepcopy(self.manifest)
                apply(self.folder, manifest)
                self.assertFalse(manifest['playback']['loopApproved'])

    def test_finite_placement_is_approved_without_a_continuous_loop(self):
        folder=Path('public/sprites/Laborer/motion/stack-crates/actor')
        manifest=json.loads((folder/'manifest.json').read_text())
        apply(folder,manifest)
        self.assertTrue(manifest['playback']['taskApproved'])
        self.assertFalse(manifest['playback']['loopApproved'])
        self.assertEqual(manifest['playback']['mode'],'once-hold')
        self.assertFalse(manifest['productionReady'])

    def test_task_review_rejects_repeat_mode_changed_contacts_or_release_layer(self):
        folder=Path('public/sprites/Laborer/motion/stack-crates/actor')
        original=json.loads((folder/'manifest.json').read_text())
        for mutate in [lambda m:m['playback'].update(mode='loop'),lambda m:m['playback'].update(endBehavior='restart'),lambda m:m['frames'][0].update(durationMs=999),lambda m:m['registration'].update(targetAnchor=[0,0])]:
            manifest=copy.deepcopy(original);mutate(manifest);apply(folder,manifest)
            self.assertFalse(manifest['playback']['taskApproved'])
        old_digest=motion_loop_approval.digest
        changed=Path('public/sprites/workstations/storage-pallet/completed-crate.png').resolve()
        with patch('motion_loop_approval.digest',side_effect=lambda p:'changed' if p.resolve()==changed else old_digest(p)):
            manifest=copy.deepcopy(original);apply(folder,manifest)
            self.assertFalse(manifest['playback']['taskApproved'])
