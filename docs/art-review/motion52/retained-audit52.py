import hashlib,json,subprocess
from pathlib import Path
root=Path('.').resolve();base='096ce97da44c6c8b12c35fd19ae200be3e383055';out=root/'docs/art-review/motion52';out.mkdir(exist_ok=True)
old=lambda p:subprocess.check_output(['git','show',f'{base}:{p}'])
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
blobs={}
for line in subprocess.check_output(['git','ls-tree','-r',base],text=True).splitlines():
 metadata,path=line.split('\t',1);blobs[path]=metadata.split()[-1]
def unchanged(path):
 data=(root/path).read_bytes();gitsha=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
 assert gitsha==blobs[path],path
 return {'file':path,'sha256':hashlib.sha256(data).hexdigest()}
scope=json.loads(old('docs/motion-completion-scope.json'))
original=scope['mainDestinations']+scope['actorDestinations'];additions=json.loads(old('docs/runtime-motion-additions.json'))['entries']
destinations=[]
for p in original:
 m=json.loads(old(p+'/manifest.json'))
 if m['playback'].get('loopApproved')or m['playback'].get('taskApproved'):destinations.append(p)
destinations += [e['destination']for e in additions];assert len(destinations)==67,len(destinations)
files=[]
for folder in destinations:
 manifest=json.loads(old(folder+'/manifest.json'));now=json.loads((root/folder/'manifest.json').read_text())
 for key in ['sourceSha256','frames','sourceFrameOrder','sharedScale','registration','playback']:assert manifest[key]==now[key],(folder,key)
 for name in ['source-sheet.png','atlas.png','motion-polish.json']+[f['file']for f in manifest['frames']]:
  path=folder+'/'+name
  if path in blobs:files.append(unchanged(path))
props=[unchanged(str(p.relative_to(root)))for p in (root/'public/sprites/workstations').rglob('*')if p.is_file()]
calpath='public/sprites/Blacksmith/motion/render-calibration.json';prior=json.loads(old(calpath));now=json.loads((root/calpath).read_text())
for k,v in prior['actions'].items():assert now['actions'][k]==v,k
runtime=[]
for p in ['src/game/store.ts','src/game/world/npc-motion.ts','src/game/world/workstation-sites.ts','src/game/world/work-activities.ts','src/game/world/workstations.tsx','src/game/world/workstation-completion.ts','src/game/world/scene.tsx','src/game/world/sprites.tsx','src/game/world/environment.tsx','src/game/motion-playback.ts','src/game/sim.ts']:
 before=hashlib.sha256(old(p)).hexdigest();runtime.append({'file':p,'sha256':sha(root/p),'changed':sha(root/p)!=before})
 if p not in ['src/game/world/workstation-sites.ts','src/game/world/work-activities.ts']:assert sha(root/p)==before,p
for p in ['mainDestinations','actorDestinations','directionFamilies','familyReviews']:
 assert json.loads((root/'docs/motion-completion-scope.json').read_text())[p]==scope[p],p
(out/'retained-assets-audit52.json').write_text(json.dumps({'checkpoint':'motion52','baseline':base,'unchangedAcceptedCycles':destinations,'unchangedSelectedAssets':files,
 'unchangedExistingPropFiles':props,'unchangedPriorBlacksmithCalibrationEntries':list(prior['actions']),'runtime':runtime,
 'changes':{'work-activities':'Anvil preparation is added as fourth daily forge operation. First three days unchanged, day5 returns forging. Every non-forge list unchanged.',
 'workstation-sites':'Existing anvil also hosts preparation, retaining exact520/[320,616] prop basis and6/-7 physical root. No new station or decoration change.',
 'workstation-review':'A fixed prop is now mapped uniformly into the actor native canvas by their separately measured physical body bases and common world root. The old17 identity cases must be pixel-identical across all8 frames.'},
 'scope':'67 earlier accepted art/registration/timing sets, every prior Blacksmith calibration action and every prop file unchanged. Walking/root/phase/camera/task/economic code exact. Native observations and dates retain their earlier scope; actual evidence needed for affected dependency revalidation.'},indent=2)+'\n')
print('67 previously accepted asset sets, every existing prop and frozen review obligations unchanged.')
