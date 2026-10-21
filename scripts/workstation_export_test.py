"""Check actual retained layers and reject corrupt sources before overwriting art."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from PIL import Image
from workstation_export import export_station, normalized, verified_bytes

ROOT = Path(__file__).resolve().parents[1]


class WorkstationExportTests(unittest.TestCase):
    def test_whole_canvas_normalization_rejects_changed_raw_geometry_and_anisotropic_scale(self):
        source = Image.new('RGBA', (8, 8))
        source.putpixel((4, 4), (100, 80, 60, 255))
        config = {'method':'whole-canvas-uniform-normalization-and-fixed-integer-placement',
                  'rawCanvas':[8,8], 'canvas':[4,4], 'scale':0.5, 'offsetPx':[0,0]}
        for fields in [{'rawCanvas':[9,8]}, {'canvas':[4,5]}, {'scale':0.6}, {'scale':float('nan')}]:
            with self.subTest(fields=fields), self.assertRaises(ValueError):
                normalized(source, {**config, **fields})

    def test_whole_canvas_placement_rejects_fractional_and_unbounded_offsets(self):
        source = Image.new('RGBA', (8, 8))
        source.putpixel((4, 4), (100, 80, 60, 255))
        config = {'method':'whole-canvas-uniform-normalization-and-fixed-integer-placement',
                  'rawCanvas':[8,8], 'canvas':[4,4], 'scale':0.5, 'offsetPx':[0,0]}
        for offset in [[0.5,0], [True,0], [13,0], [0,-13]]:
            with self.subTest(offset=offset), self.assertRaises(ValueError):
                normalized(source, {**config, 'offsetPx':offset})

    def test_whole_canvas_placement_cannot_clip_visible_workstation_material(self):
        source = Image.new('RGBA', (8, 8))
        source.putpixel((0, 0), (100, 80, 60, 255))
        config = {'method':'whole-canvas-uniform-normalization-and-fixed-integer-placement',
                  'rawCanvas':[8,8], 'canvas':[8,8], 'scale':1, 'offsetPx':[-1,0]}
        with self.assertRaises(ValueError):
            normalized(source, config)

    def test_all_authored_stations_reproduce_every_layer_exactly(self):
        for metadata in (ROOT / 'public/sprites/workstations').glob('*/generation.json'):
            with self.subTest(station=metadata.parent.name):
                outputs = verified_bytes(metadata.parent, json.loads(metadata.read_text()))
                for name, data in outputs.items():
                    self.assertEqual(data, (metadata.parent / name).read_bytes())

    def test_completion_and_paper_sources_are_checked_before_any_write(self):
        for name, field in [('ledger-desk', 'composition46'), ('dough-block', 'completionLayer')]:
            folder = ROOT / 'public/sprites/workstations' / name
            config = copy.deepcopy(json.loads((folder / 'generation.json').read_text()))
            config[field]['sourceSha256'] = 'changed'
            original = (folder / 'sprite.png').read_bytes()
            with self.assertRaises(ValueError):
                export_station(folder, config)
            self.assertEqual(original, (folder / 'sprite.png').read_bytes())

    def test_expected_output_mismatch_preserves_the_previous_file(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            source = ROOT / 'public/sprites/workstations/dough-block'
            (folder / 'source.png').write_bytes((source / 'source.png').read_bytes())
            (folder / 'sprite.png').write_bytes(b'previous reviewed sprite')
            config = json.loads((source / 'generation.json').read_text())
            config.pop('completionLayer')
            config['spriteSha256'] = 'changed'
            with self.assertRaises(ValueError):
                export_station(folder, config)
            self.assertEqual((folder / 'sprite.png').read_bytes(), b'previous reviewed sprite')


if __name__ == '__main__':
    unittest.main()
