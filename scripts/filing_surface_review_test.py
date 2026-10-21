"""Read actual file/cutting-arc pixels and independently owned fixed furniture."""
import json
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

from gait_calibration import binding, digest

ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / 'docs/art-review/motion56/blacksmith-filing'


class FilingSurfaceReviewTest(unittest.TestCase):
    def test_fixed_prop_is_one_complete_uniformly_normalized_generated_object(self):
        folder = ROOT / 'public/sprites/workstations/vise-bench'
        generation = json.loads((folder / 'generation.json').read_text())
        self.assertEqual(digest(folder / 'source.png'), generation['sourceSha256'])
        self.assertEqual(digest(folder / 'sprite.png'), generation['spriteSha256'])
        with Image.open(folder / 'source.png') as raw:
            self.assertEqual(raw.size, (1254, 1254))
            normalized = raw.convert('RGBA').resize((640, 640), Image.LANCZOS)
        expected = Image.new('RGBA', (640, 640))
        expected.paste(normalized, (0, -7))
        with Image.open(folder / 'sprite.png') as actual:
            self.assertTrue(np.array_equal(np.asarray(expected), np.asarray(actual.convert('RGBA'))))
        # Fixed native ownership is separate from every character pose.
        for point in [(350, 218), (365, 220), (380, 218), (393, 217), (405, 215), (416, 211), (425, 210)]:
            self.assertGreaterEqual(expected.getpixel(point)[3], 128)

    def test_visible_working_stroke_and_lift_return_use_real_source_material(self):
        record = json.loads((REVIEW / 'file-cutting-edge-contact56.json').read_text())
        folder = ROOT / record['actor']
        manifest = json.loads((folder / 'manifest.json').read_text())
        settings = json.loads((folder / 'motion-polish.json').read_text())
        self.assertEqual(record['binding'], binding(folder, manifest))
        self.assertEqual(record['propSha256'], digest(ROOT / record['prop']))
        self.assertEqual(record['activeContactFrames'], list(range(5)))
        self.assertEqual(record['recoveryFrames'], [5, 6, 7])
        arc = np.asarray(record['registeredCuttingArc'])
        edges = np.diff(arc, axis=0)
        for row in record['observedFileSamples']:
            i = row['frame']
            source = ROOT / f'public/sprites/Blacksmith/motion/file-tool-edge/reference/{i:02}.png'
            with Image.open(source) as image:
                original = image.convert('RGBA').getpixel(tuple(row['rawSourcePoint']))
            with Image.open(folder / manifest['frames'][i]['file']) as image:
                point = np.asarray(row['registeredFilePoint'])
                observed = image.convert('RGBA').getpixel(tuple(int(v) for v in point))
            self.assertGreaterEqual(original[3], 128)
            self.assertEqual(list(original), row['sourceRGBA'])
            self.assertEqual(original, observed, 'Neither a guide point nor edited target can stand in for the file')
            self.assertTrue(np.array_equal(point, np.asarray(row['rawSourcePoint']) + settings['offsetsPx'][i]))
            relative = point - arc[:-1]
            t = np.clip(np.sum(relative * edges, axis=1) / np.sum(edges * edges, axis=1), 0, 1)
            distance = float(np.linalg.norm(point - (arc[:-1] + t[:, None] * edges), axis=1).min())
            self.assertAlmostEqual(distance, row['closestVisibleArcDistancePx'])
            if i <= 4:
                self.assertLessEqual(distance, 6)
            else:
                self.assertIsNone(row['contactPassed'], 'Deliberate lift/return is not continuous pressure')
        self.assertFalse(record['approval'], 'Projected geometry does not automatically approve art or a loop')


if __name__ == '__main__':
    unittest.main()
