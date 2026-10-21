"""Install reviewed native candidates; final task acceptance awaits gameplay."""
import hashlib
import json
import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[3]
work = Path(__file__).parent
load = lambda p: json.loads(p.read_text())
save = lambda p,j: p.write_text(json.dumps(j,indent=2)+'\n')
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
actor = root / 'public/sprites/Cook/motion/mix-ingredients/actor'
station = root / 'public/sprites/workstations/mixing-block'
assert not actor.exists() and not station.exists(), 'Do not replay candidate installation'
assert load(work / 'stationary-boots53.json')['measurementPassed']
assert load(work / 'bowl-surface-contact53.json')['maxOutsideWorkingFacePx']==0
shutil.copytree(work / 'actor-candidate', actor)
shutil.copytree(work / 'mixing-block-candidate', station)
generation = load(station / 'generation.json')
generation['reference'] = '../../Cook/motion/mix-ingredients/reference/00.png'
request = load(station / 'request53.json')
generation['prompt'] = request['prompt']
save(station / 'generation.json',generation)
entry = load(work / 'entry-candidate53.json')
entry['destination'] = str(actor.relative_to(root))
entry['notes'] = 'Literal original body, visible near boot, spoon and held mixing bowl. One521/[320,616] shared body basis; no local editing or reconstructed far leg. Fixed flour table is independently owned. Finite task; no serving, material handoff, economic output or seamless-repeat approval.'
p = root / 'docs/runtime-motion-additions.json'
j = load(p)
j['entries'].append(entry)
save(p,j)
p = root / 'public/sprites/Cook/motion/render-calibration.json'
j = load(p)
j['actions']['mix-ingredients/actor'] = {
    'sourceSha256':sha(actor / 'source-sheet.png'), 'targetBodyHeight':521,
    'targetAnchor':[320,616], 'method':'original-source-pixel-stencils',
    'foregroundPolygons':load(work / 'layer-config53.json')['foregroundPolygons'],
    'review':'Original stationary visible Cook source material, shared pose0 body basis. Actor retains bowl, spoon and hands; independent table owns flour sack, loose scoop, flour, eggs and cup. Native visible boot/bowl checks pass; actual lifecycle and finite task approval pending. Far sole, contents transfer and repeat remain unobserved.',
}
save(p,j)
p = root / 'public/workstation-library.json'
j = load(p)
j.append({'character':'Cook','action':'mix-ingredients',
          'actor':'sprites/Cook/motion/mix-ingredients/actor/manifest.json',
          'calibration':'sprites/Cook/motion/render-calibration.json',
          'station':'sprites/workstations/mixing-block/generation.json'})
save(p,j)
print('Installed measured mixing actor and independent table; final acceptance pending.')
