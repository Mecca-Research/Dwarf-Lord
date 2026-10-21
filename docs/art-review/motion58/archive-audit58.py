"""Retain literal source evidence and verify the narrow standing integration."""
import hashlib,json,shutil,subprocess
from pathlib import Path
root=Path('.').resolve();base='374698f1fd20167a4cb202e82b91857ea799bafe'
work=root/'work/expanded-cycles/motion58';out=root/'docs/art-review/motion58';native=out/'borrin-standing';native.mkdir(parents=True,exist_ok=True)
load=lambda p:json.loads(p.read_text())
write=lambda p,j:p.write_text(json.dumps(j,indent=2)+'\n')
old=lambda p:subprocess.check_output(['git','show',f'{base}:{p}'])
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=work/'borrin-standing'
for name in ['source-pixel-identity58.json','stationary-boots58.json','source-body-basis58.json','layer-config58.json','layered-native58.jpg','isolated-native58.jpg','original-arm-grid58.jpg','source-crotch58.png','source-coat-edge58.png']+[f'layer-{i}.png'for i in range(8)]:
 shutil.copy2(source/name,native/name)
for name in ['prepare-standing58.py','measure-standing-support58.py','install-standing58.py']:
 shutil.copy2(source/name,native/name)
blobs={}
for line in subprocess.check_output(['git','ls-tree','-r',base],text=True).splitlines():
 metadata,path=line.split('\t',1);blobs[path]=metadata.split()[-1]
def unchanged(path):
 data=(root/path).read_bytes();assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==blobs[path],path
 return {'file':path,'sha256':hashlib.sha256(data).hexdigest()}
scope=json.loads(old('docs/motion-completion-scope.json'));destinations=[]
for p in scope['mainDestinations']+scope['actorDestinations']:
 m=json.loads(old(p+'/manifest.json'))
 if m['playback'].get('loopApproved')or m['playback'].get('taskApproved'):destinations.append(p)
destinations += [e['destination']for e in json.loads(old('docs/runtime-motion-additions.json'))['entries']]
assert len(destinations)==71
selected=[]
for folder in destinations:
 before=json.loads(old(folder+'/manifest.json'));after=load(root/folder/'manifest.json')
 for key in ['sourceSha256','frames','sourceFrameOrder','sharedScale','registration']:assert before.get(key)==after.get(key),(folder,key)
 for key in ['mode','order','endBehavior','durationMs']:assert before['playback'].get(key)==after['playback'].get(key),(folder,key)
 for name in ['source-sheet.png','atlas.png','motion-polish.json']+[f['file']for f in before['frames']]:
  path=folder+'/'+name
  if path in blobs:selected.append(unchanged(path))
props=[unchanged(path)for path in blobs if path.startswith('public/sprites/workstations/')]
calpath='public/sprites/Borrin/motion/render-calibration.json';prior=json.loads(old(calpath));now=load(root/calpath)
assert set(now['actions'])-set(prior['actions'])=={'explain-closed-ledger/actor'}
for key,value in prior['actions'].items():assert now['actions'][key]==value,key
before=old('src/game/world/work-activities.ts').decode();after=(root/'src/game/world/work-activities.ts').read_text()
expected=before.replace('The consultant performs one finite desk activity for the entire day.\n * Writing, coin inspection, entry review, explanation and sealing remain cosmetic.', 'The consultant performs one finite administrative activity for the day.\n * Desk work and a standing explanation with his held ledger remain cosmetic.')
expected=expected.replace('["desk-writing", "count-coins", "review-open-ledger", "explain-at-desk", "stamp-paperwork"]','["desk-writing", "count-coins", "review-open-ledger", "explain-at-desk", "stamp-paperwork", "explain-closed-ledger"]')
assert after==expected
before=old('src/game/world/environment.tsx').decode();after=(root/'src/game/world/environment.tsx').read_text()
assert after==before.replace('      <Crate x={10} z={10} s={0.8} />','      {/* Keep Borrin\'s desk position clear for seated and standing consultation. */}\n      <Crate x={12} z={10.5} s={0.8} />')
runtime=[]
for path in [p for p in blobs if p.startswith('src/')]:
 changed=hashlib.sha256(old(path)).hexdigest()!=sha(root/path) if path in ['src/game/world/work-activities.ts','src/game/world/environment.tsx'] else False
 if not changed:unchanged(path)
 runtime.append({'file':path,'sha256':sha(root/path),'changed':changed})
frozen=load(root/'docs/motion-completion-scope.json')
for key in ['mainDestinations','actorDestinations','directionFamilies','familyReviews']:assert frozen[key]==scope[key],key
for path in [p for p in scope['mainDestinations'] if p not in destinations]:
 for name in ['source-sheet.png','atlas.png','motion-polish.json']:
  if path+'/'+name in blobs:unchanged(path+'/'+name)
library_before=json.loads(old('public/workstation-library.json'));library_now=load(root/'public/workstation-library.json')
assert library_now[:-1]==library_before and len(library_now)==22
additions_before=json.loads(old('docs/runtime-motion-additions.json'))['entries'];additions_now=load(root/'docs/runtime-motion-additions.json')['entries']
assert additions_now[:-1]==additions_before and len(additions_now)==15
write(out/'retained-assets-audit58.json',{'checkpoint':'motion58','baseline':base,'unchangedAcceptedCycles':destinations,'unchangedSelectedAssets':selected,'unchangedExistingPropFiles':props,
 'unchangedPriorBorrinCalibrationEntries':list(prior['actions']),'runtime':runtime,
 'changes':{'work-activities':'Append one finite standing closed-ledger explanation after the five unchanged desk activities. All non-consultant lists/functions exact. Day7 restores writing.',
 'environment':'Move only the crate formerly at Borrin10/10 to12/10.5 beside the desk. It obstructed his standing boots in actual renderer. All independent station transforms, controller, roots, economy, rewards and other environment objects remain exact.',
 'calibration':'Append534/[320,616] source-only standing registration. All five existing Borrin actor actions unchanged; all other characters exact.'},
 'scope':'71 earlier scoped source/frame/atlas/registration/timing sets, every existing prop and all103 open selected sources exact. Historical native gait/cane and other actual gameplay dates/scopes retained. New standing finite action requires actual/native inspection; no walking/direction/seamless-loop approval.'})
print('Archived literal standing evidence;71 earlier scoped sources,103 open sources and all props unchanged.')
