"""Raised tools must not displace the body during whole-pose assembly."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import importlib.util
from PIL import Image, ImageDraw


class AuthoredAssemblyTests(unittest.TestCase):
    def make_registered_fixture(self, folder):
        image=Image.new('RGBA',(2560,1280));draw=ImageDraw.Draw(image)
        cells=[]
        for i in range(8):
            x,y=i%4*640,i//4*640
            draw.rectangle((x+300,y+50,x+340,y+70),fill='red')
            draw.rectangle((x+295,y+71,x+345,y+180),fill='brown')
            draw.rectangle((x+305,y+181,x+335,y+250-(i%2)*40),fill='blue')
            cells.append([x,y,x+640,y+640])
        path=folder/'authored.png';image.save(path)
        source={'id':'original','file':'authored.png','poseCount':8,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                'cells':cells,'rootXs':[i%4*640+320 for i in range(8)],
                'rootYs':[i//4*640+260 for i in range(8)],'bodyHeights':[240]*8}
        assembly={'normalizedHeight':240,'inputs':[source],'poses':[{'input':'original','pose':i} for i in range(8)]}
        return assembly

    def test_raised_foot_preserves_physical_scale_and_body_root(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder=Path(temporary);assembly=self.make_registered_fixture(folder)
            (folder/'assembly.json').write_text(json.dumps(assembly))
            subprocess.run(['python3','scripts/assemble-reviewed-motion.py',str(folder)],check=True)
            sheet=Image.open(folder/'source-sheet.png').convert('RGBA')
            for i in range(8):
                x,y=i%4*640,i//4*640
                self.assertEqual(sheet.getpixel((x+320,y+390)),(255,0,0,255),'lifted feet cannot move or resize the head')
                self.assertEqual(sheet.getpixel((x+320,y+580))[3],0 if i%2 else 255,'authored foot lift remains visible')
            self.assertEqual([m['bodyHeight'] for m in json.loads((folder/'motion-polish.json').read_text())['landmarks']],[240]*8)

    def test_incomplete_nonfinite_or_invalid_physical_landmarks_are_rejected(self):
        for field,value in [('rootYs',None),('bodyHeights',[0]*8),('rootXs',[float('nan')]*8),('rootYs',[2000]*8)]:
            with self.subTest(field=field,value=value),tempfile.TemporaryDirectory() as temporary:
                folder=Path(temporary);assembly=self.make_registered_fixture(folder);source=assembly['inputs'][0]
                if value is None:source.pop(field)
                else:source[field]=value
                (folder/'assembly.json').write_text(json.dumps(assembly))
                result=subprocess.run(['python3','scripts/assemble-reviewed-motion.py',str(folder)],capture_output=True)
                self.assertNotEqual(result.returncode,0)

    def test_detached_crate_stays_with_its_authored_cell(self):
        spec=importlib.util.spec_from_file_location('assembly',Path('scripts/assemble-reviewed-motion.py'))
        assembler=importlib.util.module_from_spec(spec);spec.loader.exec_module(assembler)
        folder=Path('public/sprites/Laborer/motion/stack-crates/actor')
        assembly=json.loads((folder/'assembly.json').read_text());source=assembly['inputs'][0]
        poses,_,_=assembler.extract(folder/source['file'],8,source['cells'])
        # Previously nearest-component ownership assigned part of the final
        # detached crate to the actor above it, extending pose 3 into row 2.
        self.assertLess(poses[3][1][3],source['cells'][3][3])
        self.assertGreater(poses[7][1][2],source['rootXs'][7]+250)
        bad=list(source['cells']);bad[1]=bad[0]
        with self.assertRaisesRegex(ValueError,'overlap'):
            assembler.extract(folder/source['file'],8,bad)

    def test_forestry_rebuild_preserves_reviewed_body_registration(self):
        original = Path('public/sprites/Ginger/motion/fell-tree/actor')
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            shutil.copy2(original / 'assembly.json', folder / 'assembly.json')
            shutil.copytree(original / 'authoring-inputs', folder / 'authoring-inputs')
            subprocess.run(['python3', 'scripts/assemble-reviewed-motion.py', str(folder)], check=True)
            self.assertEqual(hashlib.sha256((folder / 'source-sheet.png').read_bytes()).hexdigest(),
                             hashlib.sha256((original / 'source-sheet.png').read_bytes()).hexdigest())
            rebuilt = json.loads((folder / 'motion-polish.json').read_text())
            reviewed = json.loads((original / 'motion-polish.json').read_text())
            self.assertEqual(rebuilt, reviewed)
            self.assertEqual(rebuilt['targetAnchor'], [240, 616])
            self.assertEqual(rebuilt['targetBodyHeight'], 420)


if __name__ == '__main__':
    unittest.main()
