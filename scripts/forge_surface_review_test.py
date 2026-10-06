"""Re-read real material pixels and physical transforms in the forge review."""
import json
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

from gait_calibration import digest
from station_contact import measure

ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / 'docs/art-review/motion55'


class ForgeSurfaceReviewTest(unittest.TestCase):
    def test_raised_body_basis_uses_visible_head_and_boot_material(self):
        review = json.loads((REVIEW / 'blacksmith-raised/source-body-basis55.json').read_text())
        source = ROOT / review['source']
        self.assertEqual(digest(source), review['sourceSha256'])
        with Image.open(source) as image:
            pixels = np.asarray(image.convert('RGBA'))
        for field in ['visibleCrown', 'visibleNearBootRim']:
            x, y = review[field]
            self.assertGreaterEqual(int(pixels[y, x, 3]), 128)
            self.assertEqual(pixels[y, x].tolist(), review[field + 'RGBA'])
        # Restricted body regions exclude the raised hammer and painted anvil.
        head_y = np.where(pixels[95:130, 310:370, 3] >= 128)[0].min() + 95
        boot_y = np.where(pixels[530:610, 150:235, 3] >= 128)[0].max() + 530
        self.assertEqual(review['visibleCrown'][1], int(head_y))
        self.assertEqual(review['visibleNearBootRim'][1], int(boot_y))
        self.assertEqual(review['inclusiveBodyBasisPx'], int(boot_y - head_y + 1))
        # The discarded guessed endpoints were translucent, not material markers.
        self.assertLess(int(pixels[97, 325, 3]), 128)
        self.assertLess(int(pixels[595, 195, 3]), 128)

    def test_preparation_and_edge_tap_rest_on_actual_independent_steel(self):
        prop_path = ROOT / 'public/sprites/workstations/anvil/sprite.png'
        with Image.open(prop_path) as image:
            prop = image.convert('RGBA')
        for old_vertex in [(246, 361), (425, 340)]:
            self.assertLess(prop.getpixel(old_vertex)[3], 128)
        for path in [REVIEW / 'ready-real-surface-recheck55.json',
                     REVIEW / 'blacksmith-raised/billet-real-surface-contact55.json']:
            with self.subTest(review=path.name):
                record = json.loads(path.read_text())
                config = record['config']
                result = measure(config)
                self.assertEqual(result['samples'], record['samples'])
                self.assertEqual(result['maxOutsideWorkingFacePx'], 0)
                folder = ROOT / config['actor']
                settings = json.loads((folder / 'motion-polish.json').read_text())
                scale = settings['targetBodyHeight'] / 520
                anchor = np.asarray(settings['targetAnchor'])
                for projected in config['workingFacePolygon']:
                    source_point = (np.asarray(projected) - anchor) / scale + [320, 616]
                    self.assertTrue(np.allclose(source_point, np.round(source_point)))
                    self.assertGreaterEqual(prop.getpixel(tuple(np.round(source_point).astype(int)))[3], 128)
                for point in config['points']:
                    source_point = (np.asarray(point) - anchor) / scale + [320, 616]
                    self.assertGreaterEqual(prop.getpixel(tuple(np.round(source_point).astype(int)))[3], 128)
                self.assertFalse(record['approval'], 'Numerical placement alone cannot approve a task or loop')


if __name__ == '__main__':
    unittest.main()
