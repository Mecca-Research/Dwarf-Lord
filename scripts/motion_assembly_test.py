"""Raised tools must not displace the body during whole-pose assembly."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import importlib.util


class AuthoredAssemblyTests(unittest.TestCase):
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
