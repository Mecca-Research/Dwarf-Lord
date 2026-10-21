"""Install measured original-source layers; finite approval awaits real gameplay."""
import hashlib,json,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[4];work=Path(__file__).parent
load=lambda p:json.loads(p.read_text());save=lambda p,j:p.write_text(json.dumps(j,indent=2)+'\n')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
actor=root/'public/sprites/Blacksmith/motion/anvil-ready/actor';assert not actor.exists()
assert load(work/'stationary-boots52.json')['measurementPassed']
assert load(work/'billet-surface-contact52.json')['maxOutsideWorkingFacePx']==0
shutil.copytree(work/'actor-candidate',actor)
entry=load(work/'entry-candidate52.json');entry['destination']=str(actor.relative_to(root))
entry['notes']='Original visible body, near boot, hammer, tongs and billet over the unchanged independent anvil. Integer whole-pose contact registration on one509/[280,592] physical basis. Hidden far leg remains unobserved. Finite preparation, no strike/reward or repeat approval.'
p=root/'docs/runtime-motion-additions.json';j=load(p);j['entries'].append(entry);save(p,j)
layer=load(work/'layer-config52.json');p=root/'public/sprites/Blacksmith/motion/render-calibration.json';j=load(p)
j['actions']['anvil-ready/actor']={'sourceSha256':sha(actor/'source-sheet.png'),'targetBodyHeight':509,'targetAnchor':[280,592],
 'method':'original-source-pixel-stencils-and-bounded-whole-pose-registration',
 'foregroundPolygons':layer['foregroundPolygons'],
 'review':'Shared measured pose0 visible crown73 through near-boot rim581 gives509px inclusive basis. Same world station root as existing520/[320,616] anvil; neither layer is resized per frame. Near boot/visible billet pass native checks; gameplay and finite approval pending. Hidden far foot and jaw underside remain unobserved.'};save(p,j)
p=root/'public/workstation-library.json';j=load(p);j.append({'character':'Blacksmith','action':'anvil-ready',
 'actor':'sprites/Blacksmith/motion/anvil-ready/actor/manifest.json','calibration':'sprites/Blacksmith/motion/render-calibration.json',
 'station':'sprites/workstations/anvil/generation.json'});save(p,j)
print('Installed native preparation layers; pending actual task proof.')
