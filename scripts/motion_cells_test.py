import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from PIL import Image, ImageDraw


class AuthoredCellExportTests(unittest.TestCase):
    def fixture(self, folder):
        source = Image.new('RGBA', (1024, 512))
        draw = ImageDraw.Draw(source)
        cells, landmarks = [], []
        for i in range(8):
            x, y = i % 4 * 256, i // 4 * 256
            draw.rectangle((x+100, y+80, x+124, y+160), fill=(20+i, 180, 20, 255))
            cells.append([x, y, x+256, y+256])
            landmarks.append({'root': [x+128, y+240], 'bodyHeight': 200})
        # This prop is inside the final authored cell, but closer to the actor
        # above it than its owner. Component proximity gives it to the wrong row.
        draw.rectangle((3*256+240, 265, 3*256+246, 271), fill=(255, 0, 0, 255))
        source.save(folder/'source-sheet.png'); source.save(folder/'reference.png')
        (folder/'generation.json').write_text(json.dumps({'frameOrder': list(range(8)), 'prompt': 'Fixture with eight authored cells and a detached delivered prop.'}))
        settings = {'sourceCells': cells, 'landmarks': landmarks, 'targetBodyHeight': 200}
        entry = {'character': 'Fixture', 'action': 'delivery', 'direction': 'reference',
                 'kind': 'work', 'beats': [str(i) for i in range(8)], 'title': 'Delivery',
                 'reference': str(folder/'reference.png'), 'destination': str(folder)}
        return settings, entry

    def exporter(self):
        spec=importlib.util.spec_from_file_location('cell_exporter',Path('scripts/export-character-motion.py'))
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        return module

    def test_detached_prop_stays_in_its_cell_without_granting_approval(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder=Path(temporary);settings,entry=self.fixture(folder)
            (folder/'motion-polish.json').write_text(json.dumps(settings))
            self.exporter().export(entry)
            manifest=json.loads((folder/'manifest.json').read_text())
            for i in range(8):
                im=Image.open(folder/f'{i:02}.png').convert('RGBA')
                red=sum(pixel==(255,0,0,255) for pixel in im.getdata())
                self.assertEqual(red,49 if i==7 else 0)
            self.assertFalse(manifest['playback']['loopApproved'])
            self.assertFalse(manifest['playback']['taskApproved'])
            self.assertFalse(manifest['productionReady'])

    def test_invalid_or_overlapping_cells_cannot_change_pose_ownership(self):
        for change in ['overlap','outside','fraction','missing']:
            with self.subTest(change=change),tempfile.TemporaryDirectory() as temporary:
                folder=Path(temporary);settings,entry=self.fixture(folder)
                cells=settings['sourceCells']
                if change=='overlap':cells[1]=cells[0]
                elif change=='outside':cells[7][2]=1025
                elif change=='fraction':cells[0][0]=.5
                else:cells.pop()
                (folder/'motion-polish.json').write_text(json.dumps(settings))
                with self.assertRaises(ValueError):self.exporter().export(entry)


if __name__=='__main__':
    unittest.main()
