import hashlib,json,subprocess
from pathlib import Path
root=Path('.').resolve();base='ee5e7604136268e79772eae044cba486def9a40a';out=root/'docs/art-review/motion53';out.mkdir(exist_ok=True)
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
destinations += [e['destination']for e in additions];assert len(destinations)==68,len(destinations)
files=[]
for folder in destinations:
 manifest=json.loads(old(folder+'/manifest.json'));now=json.loads((root/folder/'manifest.json').read_text())
 for key in ['sourceSha256','frames','sourceFrameOrder','sharedScale','registration','playback']:assert manifest[key]==now[key],(folder,key)
 for name in ['source-sheet.png','atlas.png','motion-polish.json']+[f['file']for f in manifest['frames']]:
  path=folder+'/'+name
  if path in blobs:files.append(unchanged(path))
props=[unchanged(path)for path in blobs if path.startswith('public/sprites/workstations/')]
calpath='public/sprites/Cook/motion/render-calibration.json';prior=json.loads(old(calpath));now=json.loads((root/calpath).read_text())
for k,v in prior['actions'].items():assert now['actions'][k]==v,k
runtime=[]
for p in ['src/game/store.ts','src/game/world/npc-motion.ts','src/game/world/workstation-sites.ts','src/game/world/work-activities.ts','src/game/world/workstations.tsx','src/game/world/workstation-completion.ts','src/game/world/scene.tsx','src/game/world/sprites.tsx','src/game/world/environment.tsx','src/game/motion-playback.ts','src/game/sim.ts']:
 before=hashlib.sha256(old(p)).hexdigest();runtime.append({'file':p,'sha256':sha(root/p),'changed':sha(root/p)!=before})
 if p not in ['src/game/world/workstation-sites.ts','src/game/world/work-activities.ts']:assert sha(root/p)==before,p
before=(old('src/game/world/work-activities.ts')).decode();after=(root/'src/game/world/work-activities.ts').read_text()
assert after==before.replace('[\"chop-vegetables\", \"peel-potatoes\", \"knead-dough\", \"stir-cauldron\"]','[\"chop-vegetables\", \"peel-potatoes\", \"knead-dough\", \"stir-cauldron\", \"mix-ingredients\"]')
before=old('src/game/world/workstation-sites.ts').decode();after=(root/'src/game/world/workstation-sites.ts').read_text()
added='  { id: \"mixing-block\", appearance: \"cook\", job: \"meals\", bodyHeight: 521, anchor: [320, 616], actions: [\"mix-ingredients\"], offsetX: -12, completionLayer: \"completed-mixture.png\" },\n'
assert after.replace(added,'')==before
for p in ['mainDestinations','actorDestinations','directionFamilies','familyReviews']:
 assert json.loads((root/'docs/motion-completion-scope.json').read_text())[p]==scope[p],p
(out/'retained-assets-audit53.json').write_text(json.dumps({'checkpoint':'motion53','baseline':base,'unchangedAcceptedCycles':destinations,'unchangedSelectedAssets':files,
 'unchangedExistingPropFiles':props,'unchangedPriorCookCalibrationEntries':list(prior['actions']),'runtime':runtime,
 'changes':{'work-activities':'Mixing is added as fifth daily meal operation. First four days unchanged, day6 returns chopping. Every non-meal list unchanged.',
 'workstation-sites':'One independent flour-mixing block at-12.5/4.5 with521/[320,616] prop basis and completed bowl. Every earlier station descriptor remains unchanged.',
 'workstation-review':'Physical preview helper and HTML are unchanged. The layer checker adds finite completed-bowl ownership assertions for the new variant; all earlier18 variants require fresh validation.'},
 'scope':'68 earlier accepted art/registration/timing sets, every prior Cook calibration action and every prop file unchanged. Walking/root/phase/camera/task/economic code exact. Native observations and dates retain their earlier scope; actual evidence needed for affected dependency revalidation.'},indent=2)+'\n')
print('68 previously accepted asset sets, every existing prop and frozen review obligations unchanged.')
