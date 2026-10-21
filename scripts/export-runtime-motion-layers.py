"""Re-export actor-only runtime variants and independent workstation props.
Run whole-pose assembly first after changing actor inputs. Calibration remains
source-bound and must be reviewed separately when the source changes.
"""
import hashlib
import importlib.util
import json
import argparse
from pathlib import Path
from workstation_export import export_station

spec=importlib.util.spec_from_file_location('motion_export',Path(__file__).with_name('export-character-motion.py'))
exporter=importlib.util.module_from_spec(spec);spec.loader.exec_module(exporter)
parser=argparse.ArgumentParser()
parser.add_argument('--additions-only', action='store_true', help='Export newly activated reference-action variants while preserving the frozen original actor scope')
args=parser.parse_args()
original=json.loads(Path('docs/runtime-motion-layers.json').read_text())['entries']
additional=Path('docs/runtime-motion-additions.json')
additions=json.loads(additional.read_text())['entries'] if additional.exists() else []
entries=additions if args.additions_only else original+additions
for entry in entries:
    exporter.export(entry)
for metadata in Path('public/sprites/workstations').glob('*/generation.json'):
    export_station(metadata.parent,json.loads(metadata.read_text()))
Path('public/workstation-library.json').write_text(json.dumps([{'character':e['character'],'action':e['action'],'actor':str(Path(e['destination']).relative_to('public')/'manifest.json'),'calibration':f"sprites/{e['character']}/motion/render-calibration.json",'station':f"sprites/workstations/{e['station']}/generation.json"} for e in original+additions],indent=2)+'\n')
print('Exported runtime actor layers and independent workstation props')
