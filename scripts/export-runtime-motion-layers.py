"""Re-export actor-only runtime variants and independent workstation props.
Run whole-pose assembly first after changing actor inputs. Calibration remains
source-bound and must be reviewed separately when the source changes.
"""
import hashlib
import importlib.util
import json
import argparse
from pathlib import Path
from PIL import Image

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
    folder=metadata.parent;config=json.loads(metadata.read_text());source=folder/'source.png'
    if hashlib.sha256(source.read_bytes()).hexdigest()!=config['sourceSha256']:
        raise ValueError('Workstation source changed; review placement first')
    p=config['placement'];im=Image.open(source).convert('RGBA')
    bounds=im.getchannel('A').point(lambda a: 255 if a>=p['alphaThreshold'] else 0).getbbox() if 'alphaThreshold' in p else im.getbbox()
    if bounds is None: raise ValueError('Workstation has no opaque pixels')
    im=im.crop(bounds)
    im=im.resize((p['width'],round(im.height*p['width']/im.width)),Image.LANCZOS)
    if p['x']<0 or p['y']<0 or p['x']+im.width>p['canvas'][0] or p['y']+im.height>p['canvas'][1]:
        raise ValueError('Workstation placement clips source pixels')
    out=Image.new('RGBA',tuple(p['canvas']));out.alpha_composite(im,(p['x'],p['y']));out.save(folder/'sprite.png')
    if hashlib.sha256((folder/'sprite.png').read_bytes()).hexdigest()!=config['spriteSha256']:
        raise ValueError('Workstation export differs from reviewed output')
    completion=config.get('completionLayer')
    if completion:
        source=folder/completion['source']
        if hashlib.sha256(source.read_bytes()).hexdigest()!=completion['sourceSha256']:
            raise ValueError('Completion prop needs review after final actor changes')
        bounds=completion['bounds'];im=Image.open(source).convert('RGBA')
        if len(bounds)!=4 or not 0<=bounds[0]<bounds[2]<=im.width or not 0<=bounds[1]<bounds[3]<=im.height:
            raise ValueError('Invalid completion prop bounds')
        out=Image.new('RGBA',im.size);out.alpha_composite(im.crop(bounds),tuple(bounds[:2]));out.save(folder/completion['file'])
        if hashlib.sha256((folder/completion['file']).read_bytes()).hexdigest()!=completion['sha256']:
            raise ValueError('Completion prop export differs from reviewed output')
Path('public/workstation-library.json').write_text(json.dumps([{'character':e['character'],'action':e['action'],'actor':str(Path(e['destination']).relative_to('public')/'manifest.json'),'calibration':f"sprites/{e['character']}/motion/render-calibration.json",'station':f"sprites/workstations/{e['station']}/generation.json"} for e in original+additions],indent=2)+'\n')
print('Exported runtime actor layers and independent workstation props')
