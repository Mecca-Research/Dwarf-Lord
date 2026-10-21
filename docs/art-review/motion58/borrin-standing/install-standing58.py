"""Install a measured candidate for actual finite gameplay; no approval yet."""
import hashlib,json,shutil
from pathlib import Path
root=Path('.').resolve();w=root/'work/expanded-cycles/motion58/borrin-standing'
load=lambda p:json.loads(p.read_text());write=lambda p,j:p.write_text(json.dumps(j,indent=2)+'\n')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
folder=root/'public/sprites/Borrin/motion/explain-closed-ledger/actor'
assert not folder.exists(),'Do not replay installation'
assert load(w/'stationary-boots58.json')['measurementPassed']
assert all(r['sameOpaqueOriginalPixels']for r in load(w/'source-pixel-identity58.json')['samples'])
shutil.copytree(w/'actor-candidate',folder)
entry=load(w/'entry-candidate58.json');entry['destination']=str(folder.relative_to(root))
entry['notes']='Literal original standing Borrin body, spectacles, cravat, keys, closed ledger and free explanatory hand. One observed534/[320,616] source basis; no per-pose offsets or local edits. Unchanged independent650/[320,616] desk owns open ledger/ink/receipt/stacks; actor owns held closed ledger. Actual finite gameplay/contact approval pending; no book pickup/put-down, seat-to-stand transition, accounting output, moving gait or seamless repeat.'
p=root/'docs/runtime-motion-additions.json';data=load(p);data['entries'].append(entry);write(p,data)
p=root/'public/sprites/Borrin/motion/render-calibration.json';data=load(p);layer=load(w/'layer-config58.json')
data['actions']['explain-closed-ledger/actor']={'sourceSha256':sha(folder/'source-sheet.png'),
 'targetBodyHeight':534,'targetAnchor':[320,616],'method':'original-source-pixel-standing-body-registration',
 'foregroundPolygons':layer['foregroundPolygons'],
 'review':'Actual opaque pose0 crown[300,81]/near-boot-rim[220,614] inclusive534 basis, original source canvas datum[320,616] throughout. No offsets, local edits or per-pose scale. Both visible stationary boot regions pass unchanged.94/6/6. Actor owns original body, closed held ledger, keys and free gesture; existing650/[320,616] desk keeps furniture/open book/ink/receipt/stacks. Finite task approval separate; hidden sole, pickup/put-down, seated transition, accounting output, moving gait, directions and repeat excluded.'}
write(p,data)
p=root/'public/workstation-library.json';data=load(p);data.append({'character':'Borrin','action':'explain-closed-ledger',
 'actor':'sprites/Borrin/motion/explain-closed-ledger/actor/manifest.json','calibration':'sprites/Borrin/motion/render-calibration.json',
 'station':'sprites/workstations/ledger-desk/generation.json'});write(p,data)
print('Installed literal standing candidate using the unchanged independent desk; task acceptance remains pending.')
