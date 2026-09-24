"""Re-export actor-only runtime variants and independent workstation props.
Run whole-pose assembly first after changing actor inputs. Calibration remains
source-bound and must be reviewed separately when the source changes.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
from PIL import Image

spec=importlib.util.spec_from_file_location('motion_export',Path(__file__).with_name('export-character-motion.py'))
exporter=importlib.util.module_from_spec(spec);spec.loader.exec_module(exporter)
for entry in json.loads(Path('docs/runtime-motion-layers.json').read_text())['entries']:
    exporter.export(entry)
for metadata in Path('public/sprites/workstations').glob('*/generation.json'):
    folder=metadata.parent;config=json.loads(metadata.read_text());source=folder/'source.png'
    if hashlib.sha256(source.read_bytes()).hexdigest()!=config['sourceSha256']:
        raise ValueError('Workstation source changed; review placement first')
    p=config['placement'];im=Image.open(source).convert('RGBA');im=im.crop(im.getbbox())
    im=im.resize((p['width'],round(im.height*p['width']/im.width)),Image.LANCZOS)
    if p['x']<0 or p['y']<0 or p['x']+im.width>p['canvas'][0] or p['y']+im.height>p['canvas'][1]:
        raise ValueError('Workstation placement clips source pixels')
    out=Image.new('RGBA',tuple(p['canvas']));out.alpha_composite(im,(p['x'],p['y']));out.save(folder/'sprite.png')
    if hashlib.sha256((folder/'sprite.png').read_bytes()).hexdigest()!=config['spriteSha256']:
        raise ValueError('Workstation export differs from reviewed output')
print('Exported runtime actor layers and independent workstation props')
