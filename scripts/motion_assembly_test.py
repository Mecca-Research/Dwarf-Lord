"""Raised tools must not displace the body during whole-pose assembly."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


class AuthoredAssemblyTests(unittest.TestCase):
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
