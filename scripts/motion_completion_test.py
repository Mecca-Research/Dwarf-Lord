import copy
import json
from pathlib import Path
import unittest
from unittest.mock import patch

import motion_completion
import motion_loop_approval


class CompletionTests(unittest.TestCase):
    def test_frozen_inventory_keeps_scoped_and_main_reviews_separate(self):
        report = motion_completion.inventory()
        self.assertEqual(report['counts']['mainCycles'], 153)
        self.assertEqual(report['counts']['nonFrontWalkCycles'], 56)
        self.assertEqual(report['counts']['fixedWorkCycles'], 65)
        self.assertEqual(report['counts']['actorCycles'], 7)
        self.assertEqual(report['counts']['mainScopedReviewsApproved'], 50)
        self.assertEqual(report['counts']['actorScopedReviewsApproved'], 7)
        self.assertEqual(report['counts']['cycleReviewsRemaining'], 103)
        self.assertIsNone(report['remainingRedrawCount'])
        self.assertFalse(report['productionReady'])
        self.assertFalse(report['reviewGatesComplete'])
        self.assertEqual({b['gate']: b['remaining'] for b in report['mergeBlockers']}, {'final-cycle-reviews':103,'direction-continuity':11,'runtime-action-activation':45})

    def rejected_entry(self):
        return next(e for e in json.loads(Path('docs/expanded-animation-plan.json').read_text())['entries']
                    if e['character'] == 'Female Miner' and e['action'] == 'pickaxe-contact')

    def test_recorded_rejection_remains_a_merge_blocker(self):
        result = motion_completion.cycle(self.rejected_entry(), Path('.'))
        self.assertEqual(result['reviewStatus'], 'reviewed-changes-required')
        self.assertIsNone(result['approvalType'])
        self.assertTrue(result['issues'])
        report = motion_completion.inventory()
        self.assertEqual(sum(r['reviewStatus'] == 'reviewed-changes-required' for r in report['cycles']), 13)
        self.assertFalse(report['reviewGatesComplete'])

    def test_changed_rejected_frame_needs_a_new_review(self):
        entry = self.rejected_entry()
        changed = (Path(entry['destination']) / '06.png').resolve()
        original = motion_loop_approval.digest
        with patch('motion_loop_approval.digest', side_effect=lambda p: 'changed' if p.resolve() == changed else original(p)):
            result = motion_completion.cycle(entry, Path('.'))
        self.assertEqual(result['reviewStatus'], 'stale-or-incomplete')
        self.assertNotIn('issues', result, 'old defects must not be asserted against new art')

    def test_changed_rejection_evidence_revokes_current_status(self):
        original = motion_completion.digest
        with patch('motion_completion.digest', side_effect=lambda p: 'changed' if p.name.endswith('-review.json') else original(p)):
            result = motion_completion.cycle(self.rejected_entry(), Path('.'))
        self.assertEqual(result['reviewStatus'], 'stale-or-incomplete')

    def test_positive_verdict_in_rejection_file_cannot_approve_a_cycle(self):
        original = motion_completion.load
        def fake_load(path):
            value = original(path)
            if path.name == 'cycle-review.json':
                value['verdict'] = 'approved'
            return value
        with patch('motion_completion.load', side_effect=fake_load):
            result = motion_completion.cycle(self.rejected_entry(), Path('.'))
        self.assertEqual(result['reviewStatus'], 'stale-or-incomplete')
        self.assertIsNone(result['approvalType'])

    def test_finite_task_is_counted_without_claiming_seamless_repeat(self):
        entry=next(e for e in json.loads(Path('docs/runtime-motion-layers.json').read_text())['entries'] if e['character']=='Laborer')
        record=motion_completion.cycle(entry,Path('.'))
        self.assertEqual(record['reviewStatus'],'scoped-review-approved')
        self.assertEqual(record['approvalType'],'once-hold-task')

    def test_add_remove_and_duplicate_cannot_silently_change_scope(self):
        for entries in [[{'destination': 'a'}, {'destination': 'b'}], [],
                        [{'destination': 'a'}, {'destination': 'a'}]]:
            with self.assertRaises(ValueError):
                motion_completion.exact_scope(['a'], entries, 'test')

    def test_changed_actor_frame_revokes_counted_approval(self):
        entry = next(e for e in json.loads(Path('docs/runtime-motion-layers.json').read_text())['entries']
                     if e['character'] == 'Blacksmith')
        changed = Path(entry['destination']) / '00.png'
        original = motion_loop_approval.digest
        with patch('motion_loop_approval.digest', side_effect=lambda p: 'changed' if p.resolve() == changed.resolve() else original(p)):
            result = motion_completion.cycle(entry, Path('.'))
        self.assertEqual(result['reviewStatus'], 'stale-or-incomplete')

    def test_cached_manifest_flag_does_not_approve_missing_review(self):
        entry = json.loads(Path('docs/expanded-animation-plan.json').read_text())['entries'][0]
        original = motion_completion.load
        def fake_load(path):
            value = original(path)
            if str(path).endswith('manifest.json'):
                value['playback']['loopApproved'] = True
            return value
        with patch('motion_completion.load', side_effect=fake_load):
            result = motion_completion.cycle(entry, Path('.'))
        self.assertEqual(result['reviewStatus'], 'not-reviewed')

    def test_unexported_registration_change_is_reported_as_stale(self):
        entry = json.loads(Path('docs/expanded-animation-plan.json').read_text())['entries'][0]
        with patch('motion_completion.polish_settings', return_value={'changed': True}):
            result = motion_completion.cycle(entry, Path('.'))
        self.assertEqual(result['reviewStatus'], 'stale-export')

    def test_runtime_edit_makes_mapping_count_unknown(self):
        original = motion_completion.digest
        with patch('motion_completion.digest', side_effect=lambda p: 'changed' if str(p).endswith('npc-motion.ts') else original(p)):
            report = motion_completion.inventory()
        self.assertFalse(report['runtimeCoverageBindingCurrent'])
        self.assertIsNone(report['counts']['referenceActionsWithoutMapping'])
        self.assertEqual(report['referenceActionsWithoutMapping'], [])

    def test_activity_dispatch_or_calibration_edit_invalidates_mapping_audit(self):
        original = motion_completion.digest
        for changed in ['work-activities.ts', 'render-calibration.json']:
            with patch('motion_completion.digest', side_effect=lambda p: 'changed' if str(p).endswith(changed) else original(p)):
                self.assertIsNone(motion_completion.inventory()['counts']['referenceActionsMapped'])

    def test_new_forge_actor_or_station_edit_invalidates_coverage(self):
        original = motion_completion.digest
        for changed in [
            'Blacksmith/motion/inspect-tool/actor/03.png',
            'Blacksmith/motion/repair-pickaxe-handle/actor/task-approval.json',
            'workstations/repair-bench/sprite.png',
            'world/workstation-sites.ts',
        ]:
            with patch('motion_completion.digest', side_effect=lambda p: 'changed' if str(p).endswith(changed) else original(p)):
                report = motion_completion.inventory()
                self.assertFalse(report['runtimeCoverageBindingCurrent'])
                self.assertIsNone(report['counts']['referenceActionsMapped'])

    def test_direction_review_cannot_survive_changed_family_binding(self):
        family = {'id': 'test/walk', 'destinations': [str(i) for i in range(8)]}
        cycles = {str(i): {'destination': str(i), 'binding': {'sourceSha256': str(i)}, 'reviewStatus': 'not-reviewed'} for i in range(8)}
        record = {'id': family['id'], 'verdict': 'approved', 'checks': {k: 'Reviewed' for k in
                  ['phase-agreement', 'body-scale', 'direction-transitions', 'equipment-geometry']},
                  'bindings': {d: r['binding'] for d, r in cycles.items()}}
        self.assertEqual(motion_completion.family_status(family, cycles, [record]), 'review-recorded')
        record['verdict'] = 'changes-required'
        self.assertEqual(motion_completion.family_status(family, cycles, [record]), 'reviewed-changes-required')
        record['verdict'] = 'approved'
        changed = copy.deepcopy(cycles)
        changed['0']['binding']['sourceSha256'] = 'changed'
        self.assertEqual(motion_completion.family_status(family, changed, [record]), 'stale-or-incomplete')
        missing = copy.deepcopy(cycles)
        missing['0']['binding'] = None
        record['bindings']['0'] = None
        self.assertEqual(motion_completion.family_status(family, missing, [record]), 'stale-or-incomplete')


if __name__ == '__main__':
    unittest.main()
