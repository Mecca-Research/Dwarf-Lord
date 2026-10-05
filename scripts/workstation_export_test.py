"""Check actual retained layers and reject corrupt sources before overwriting art."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from workstation_export import export_station, verified_bytes

ROOT = Path(__file__).resolve().parents[1]


class WorkstationExportTests(unittest.TestCase):
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
