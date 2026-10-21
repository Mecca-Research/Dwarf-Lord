"""Recheck unchanged ledger observations under an additive calibration dependency."""
import json,os,sys
from pathlib import Path
root=Path('.').resolve();sys.path.insert(0,str(root/'scripts'))
from station_contact import measure
from motion_loop_approval import apply,binding,digest
load=lambda p:json.loads(p.read_text());write=lambda p,j:p.write_text(json.dumps(j,indent=2)+'\n')
out=root/'docs/art-review/motion58';old=root/'docs/art-review/motion46/Borrin-retained-ledger-contact.json'
records=load(old);cal=root/'public/sprites/Borrin/motion/render-calibration.json';fresh=[]
asset_audit=load(out/'retained-assets-audit58.json');assert len(asset_audit['unchangedPriorBorrinCalibrationEntries'])==5
for previous in records:
 cfg=previous['config'];changes=[]
 for d in cfg['dependencies']:
  p=root/d['file']
  if digest(p)==d['sha256']:continue
  assert p==cal,p
  changes.append({'file':d['file'],'beforeSha256':d['sha256'],'sha256':digest(p)});d['sha256']=digest(p)
 assert changes and len(changes)==1
 cfg['scope']='Fresh58 recheck of exact motion46 retained motion44 visible finger/ledger geometry. Only append closed-book standing calibration; original two seated actions, actual points/polygon and native dates/scopes unchanged. No new hidden tip, force, gait or loop review.'
 result=measure(cfg);assert result['samples']==previous['samples'] and result['maxOutsideWorkingFacePx']==previous['maxOutsideWorkingFacePx'] and result['maxOutsideWorkingFacePx']<=6
 fresh.append(result)
target=out/'Borrin-retained-ledger-contact58.json';write(target,fresh)
pointer=root/'docs/borrin-ledger-current-observations.json';write(pointer,{'checkpoint':'motion58','reviewFile':str(target.relative_to(root)),'previousObservation':{'file':str(old.relative_to(root)),'sha256':digest(old)},'scope':'Fresh numerical dependency recheck of exact old points and unchanged seated contact geometry. Historical44/46 observations and dates retained.'})
audit=out/'ledger-contact-revalidation58.json';write(audit,{'checkpoint':'motion58','previous':{'file':str(old.relative_to(root)),'sha256':digest(old)},'fresh':{'file':str(target.relative_to(root)),'sha256':digest(target)},
 'currentCalibrationSha256':digest(cal),'assetAudit':{'file':'docs/art-review/motion58/retained-assets-audit58.json','sha256':digest(out/'retained-assets-audit58.json')},
 'tests':{'controller':'Extend unchanged mocked consultant lifecycle to actual sixth standing operation,534px basis and day7 return. Earlier finite semantics preserved.','contact':'Select current immutable observation file rather than the older calibration-bound46 record. Same opaque original finger points and projected ledger face still2.657px/0px outside, within6px; changing frame binding still rejected.'},
 'scope':'Only regression fixtures and additive calibration dependency recheck. No runtime/art/geometry/timing change; original native dates/scopes retained.'})
allowed={root/'scripts/npc-motion.test.mjs',root/'scripts/station_contact_test.py'};changed=[]
scope=root/'docs/motion-completion-scope.json';s=load(scope)
folders=s['mainDestinations']+s['actorDestinations']+[e['destination']for e in load(root/'docs/runtime-motion-additions.json')['entries']]
for destination in folders:
 f=root/destination;m=load(f/'manifest.json')
 for name in ['task-approval.json','loop-approval.json']:
  path=f/name
  if not path.exists():continue
  a=load(path);assert a['binding']==binding(f,m);changes=[]
  for d in a['dependencies']:
   p=(f/d['file']).resolve()
   if digest(p)==d['sha256']:continue
   assert p in allowed,p
   changes.append(str(p.relative_to(root)));d['sha256']=digest(p)
  if changes:
   a['ledgerFixtureRevalidation']={'checkpoint':'motion58','files':changes,'audit':os.path.relpath(audit,f),'scope':'Same opaque seated finger observations2.657px/0px outside, within6px and all original source geometry/timing unchanged. Extend mocked controller coverage to day6 standing/day7 writing only. Historical native review dates/scopes retained.'}
   a['dependencies'] += [{'file':os.path.relpath(p,f),'sha256':digest(p)}for p in [audit,target,pointer]]
   write(path,a);allowed.add(path);changed.append(str(path.relative_to(root)))
 if m['playback'].get('loopApproved')or m['playback'].get('taskApproved'):
  apply(f,m);assert m['playback'].get('loopApproved')or m['playback'].get('taskApproved'),destination;write(f/'manifest.json',m)
coverage=out/'ledger-coverage-revalidation58.json';changes=[]
for d in s['runtimeCoverageDependencies']:
 p=root/d['file']
 if digest(p)==d['sha256']:continue
 assert p in allowed,p
 changes.append({'file':d['file'],'beforeSha256':d['sha256'],'sha256':digest(p)});d['sha256']=digest(p)
write(coverage,{'checkpoint':'motion58','audit':{'file':str(audit.relative_to(root)),'sha256':digest(audit)},'changedFixturesAndApprovals':changes,'scope':'Seated ledger numerical recheck and controller fixture correction. No mapping/source/geometry count changes.'})
for p in [audit,target,pointer,coverage,*allowed]:
 relative=str(p.relative_to(root))
 if not any(d['file']==relative for d in s['runtimeCoverageDependencies']):s['runtimeCoverageDependencies'].append({'file':relative,'sha256':digest(p)})
write(scope,s);print('Fresh unchanged seated contact rechecks pass2.657px/0px outside, within6px;',len(changed),'fixture-bound approvals revalidated.')
