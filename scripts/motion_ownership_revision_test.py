"""Prevent ownership improvements from silently approving failed contacts."""
import hashlib
import json
from pathlib import Path
import unittest

import numpy as np
from PIL import Image

import motion_completion
import motion_loop_approval


def read(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class OwnershipRevisionTests(unittest.TestCase):
    def test_selected_boardwalk_preserves_authored_actor_over_one_fixed_prop(self):
        folder = Path('public/sprites/Laborer/motion/repair-boardwalk/reference')
        inputs = folder / 'authoring-inputs'
        prop = Image.open(inputs / 'boardwalk-station-native.png').convert('RGBA')
        for index in range(8):
            with self.subTest(frame=index):
                composed = prop.copy()
                composed.alpha_composite(Image.open(inputs / f'actor-{index:02}.png').convert('RGBA'))
                expected = np.asarray(composed)
                actual = np.asarray(Image.open(folder / f'{index:02}.png').convert('RGBA'))
                # Exporter trims low-alpha outer fringe. Every solid source
                # pixel must retain its authored RGBA, with no foot/limb warp.
                np.testing.assert_array_equal(actual[expected[:, :, 3] > 128],
                                              expected[expected[:, :, 3] > 128])

    def test_remaining_failures_bind_to_the_selected_references(self):
        plan = read(Path('docs/expanded-animation-plan.json'))
        for character, action in [('Laborer', 'repair-boardwalk'), ('Ginger', 'stack-firewood')]:
            with self.subTest(character=character):
                entry = next(e for e in plan['entries']
                             if e['character'] == character and e['action'] == action)
                folder = Path(entry['destination'])
                manifest = read(folder / 'manifest.json')
                rejection = read(folder / 'cycle-review.json')
                self.assertEqual(rejection['binding'], motion_loop_approval.binding(folder, manifest))
                self.assertNotEqual(manifest['sourceSha256'],
                                    read(folder / 'authoring-inputs/previous-manifest.json')['sourceSha256'])
                result = motion_completion.cycle(entry, Path('.'))
                self.assertEqual(result['reviewStatus'], 'reviewed-changes-required')
                self.assertIsNone(result['approvalType'])
                self.assertTrue(result['issues'])
                self.assertFalse(manifest['playback']['taskApproved'])
                self.assertFalse(manifest['playback']['loopApproved'])
                self.assertFalse(manifest['productionReady'])

    def test_observed_boot_failures_are_retained_with_their_exact_source_pixels(self):
        folder = Path('public/sprites/Laborer/motion/repair-boardwalk/reference/authoring-inputs')
        observations = read(Path('docs/art-review/motion45/support-material-measurement.json'))
        self.assertEqual(observations['sourceSha256'], digest(folder / 'actor-source-sheet.png'))
        self.assertEqual(observations['frameSha256'],
                         [digest(folder / f'actor-{i:02}.png') for i in range(8)])
        self.assertEqual(observations['settingsSha256'],
                         read(folder / 'actor-manifest.json')['registration']['settingsSha256'])
        self.assertFalse(observations['approval'])
        bound = observations['bounds']
        failed = []
        for region in observations['regions'][:2]:
            rows = region['results']
            material_valid = all(row['correlation'] is not None and
                                 row['correlation'] >= bound['minimumCorrelation'] for row in rows)
            adjacent = max(np.linalg.norm(np.asarray(rows[i]['translation']) -
                                          np.asarray(rows[i - 1]['translation'])) for i in range(1, 8))
            failed.append(not material_valid or adjacent > bound['maxAdjacentChangePx'] or
                          max(row['driftPx'] for row in rows) > bound['maxMaterialTravelPx'])
        self.assertTrue(all(failed), 'Neither support region has earned contact approval')


if __name__ == '__main__':
    unittest.main()
