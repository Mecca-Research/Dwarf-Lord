"""Approve the inspected finite explanation; keep all gait/family gates frozen."""
import json,os,shutil,sys
from pathlib import Path
root=Path('.').resolve();sys.path.insert(0,str(root/'scripts'))
from gait_calibration import binding as material_binding
from motion_loop_approval import apply,binding,digest
load=lambda p:json.loads(p.read_text());write=lambda p,j:p.write_text(json.dumps(j,indent=2)+'\n')
work=root/'work/expanded-cycles/motion58';out=root/'docs/art-review/motion58';native=out/'borrin-standing'
folder=root/'public/sprites/Borrin/motion/explain-closed-ledger/actor';prop=root/'public/sprites/workstations/ledger-desk';cal=root/'public/sprites/Borrin/motion/render-calibration.json'
scope_path=root/'docs/motion-completion-scope.json';frozen=load(scope_path);new={'character':'Borrin','action':'explain-closed-ledger'}
assert new not in frozen['mappedReferenceActions'],'Do not replay acceptance'
m=load(folder/'manifest.json');execution=load(work/'consultant-gameplay-exit.json');assert execution['exitCode']==0 and execution['started']>'2026-10-06T14:25:00'
live=load(work/'consultant-gameplay/results.json');assert not live['errors']
assert [r['action']for r in live['seen']]==['desk-writing','count-coins','review-open-ledger','explain-at-desk','stamp-paperwork','explain-closed-ledger']
for row in live['seen']:
 actor=root/f"public/sprites/Borrin/motion/{row['action']}/actor"
 assert row['sourceSha256']==digest(actor/'source-sheet.png') and row['atlasSha256']==digest(actor/'atlas.png')
 assert row['calibrationSha256']==digest(cal) and row['propSha256']==digest(prop/'sprite.png')
 assert [s['frame']for s in row['samples']]==list(range(8)) and row['completed']['completed'] and row['completed']['completions']==1
 assert row['desk']['persistent']
layers=load(work/'station-layers-pending/results.json');assert not layers['errors'] and len(layers['results'])==22
assert all(r['identicalLegacyFrames']==list(range(8))for r in layers['results'][:17])
boots=load(native/'stationary-boots58.json');assert boots['measurementPassed'] and boots['binding']==material_binding(folder,m)
identity=load(native/'source-pixel-identity58.json');assert not identity['geometryEdited'] and identity['originalFrameOrder']==list(range(8))
assert all(s['sameOpaqueOriginalPixels']and s['stencilAlphaExact']for s in identity['samples'])
assets=load(out/'retained-assets-audit58.json');assert len(assets['unchangedAcceptedCycles'])==71
for item in assets['unchangedSelectedAssets']+assets['unchangedExistingPropFiles']:assert digest(root/item['file'])==item['sha256'],item['file']
visual=load(work/'visual-review58.json');assert visual['nativeAndActualEightFramesInspected'] and visual['crateClearedAfterRerun']
for target,source in [('consultant-gameplay58.json','consultant-gameplay/results.json'),('station-layer-authoring58.json','station-layers-pending/results.json')]:shutil.copy2(work/source,out/target)
for name in ['consultant-gameplay','station-layers-pending']:shutil.copy2(work/(name+'-exit.json'),out/(name+'-execution58.json'))
for i in range(8):shutil.copy2(work/'consultant-gameplay'/f'explain-closed-ledger-{i}.png',native/f'game-{i}.png')
for name in ['rotated','departed']:shutil.copy2(work/'consultant-gameplay'/f'explain-closed-ledger-{name}.png',native/f'game-{name}.png')
shutil.copy2(work/'borrin-standing/game-eight-diagnostic58.jpg',native/'game-eight-diagnostic58.jpg');shutil.copy2(work/'visual-review58.json',native/'visual-review58.json')
source_tests=work/'source-pixel-tests58.txt';assert source_tests.read_text().rstrip().endswith('OK');shutil.copy2(source_tests,out/source_tests.name)
g=load(folder/'generation.json');g['candidate']=False;write(folder/'generation.json',g)
additions=load(root/'docs/runtime-motion-additions.json');additions['entries'][-1]['notes']='Eight literal original standing Borrin poses, one observed534/[320,616] basis and zero whole-pose offsets. Source body/closed ledger/free hand/visible boot material exact. Unchanged independent650/[320,616] desk owns separate open ledger/ink/receipt/stacks. All8 native/game compositions and six actual consultant days approved only as a finite explanation. No pickup/put-down, seat-to-stand, accounting output, moving gait, direction family or seamless repeat.';write(root/'docs/runtime-motion-additions.json',additions)
proof=[out/'consultant-gameplay58.json',out/'station-layer-authoring58.json'];audit=out/'runtime-revalidation58.json'
prior_forge=root/'docs/art-review/motion56/smith-gameplay56.json';prior_meals=root/'docs/art-review/motion55/cooking-gameplay55.json';prior_roles=root/'docs/art-review/motion55/npc-gameplay55.json'
assert not load(prior_forge)['errors'] and len(load(prior_forge)['seen'])==7
assert not load(prior_meals)['errors'] and len(load(prior_meals)['seen'])==6
write(audit,{'version':1,'checkpoint':'motion58','baseline':assets['baseline'],
 'assetAudit':{'file':str((out/'retained-assets-audit58.json').relative_to(root)),'sha256':digest(out/'retained-assets-audit58.json')},
 'currentEvidence':[{'file':str(p.relative_to(root)),'sha256':digest(p)}for p in proof+[out/'source-pixel-tests58.txt']],
 'retainedEarlierEvidence':[{'file':str(p.relative_to(root)),'sha256':digest(p),'originalCheckpoint':'motion56'if p==prior_forge else'motion55'}for p in [prior_forge,prior_meals,prior_roles]],
 'checks':{'assets':'All71 earlier scoped source/frames/atlas/registration/timing sets and existing prop layers exact. Prior five Borrin calibration actions exact. All103 unresolved selected sources and frozen bindings exact.',
 'runtime':'Only append standing closed-ledger explanation to consultant day6; day7 restores writing. All6 actual days pass every authored frame, one completion/5s hold, ordinary camera control, rejected production assignment, cancellation/persistent desk/departure, return0, resolution and morning. One camp crate moved from10/10 to12/10.5 to expose standing boots; no other environment change.',
 'preview':'22 independent variants pass,136 earlier common-basis frame comparisons. Same physical14 station sites and transforms. New standing actor uses original534/[320,616] physical basis beside unchanged650/[320,616] desk.',
 'nonConsultant':'Forge, cooking, worker/job/movement/root/camera/task/economy code, all earlier art/props and station transforms exact. Earlier actual forge56 and meal/role55 observations retain original dates/scopes; local crate clearance at consultant site is covered by fresh consultant/preview checks.',
 'tests':'Source-pixel helper replays exact solid native material, unchanged common basis and bounded whole-pose offsets for all seven stencil actors, including new standing Borrin. Fixture additions do not change prior helper semantics.'},
 'scope':'Finite already-held closed ledger explanation. Original source body/hands/book/boots exact; no hidden reconstruction, pickup/put-down or seated-standing transfer, economic output, moving gait, cross-direction geometry or seamless repeat.'})
near,far=boots['regions']
checks={
 'identity-and-scale':'Borrin retains his grey bound beard, spectacles, swept hair, cravat, vest and key ring. Eight distinct original poses0-7 are extracted with literal positive/negative furniture stencils. One actual opaque534px crown-to-visible near-boot-rim basis and common[320,616] source datum; no per-pose scale/offset, body warp, painted repair, mirror, duplicate pose or synthetic tween. No hidden sole/root/body reconstruction.',
 'station-and-foot-contact':f"Both inspected visible boot cap/rim regions pass unchanged.94/6/6 stationary limits. Near minimum correlation{min(v['correlation']for v in near['results']):.6f}, max drift{max(v['driftPx']for v in near['results']):.6f}px, adjacent{max(near['adjacentDriftPx']):.6f}px; far minimum correlation{min(v['correlation']for v in far['results']):.6f}, drift{max(v['driftPx']for v in far['results']):.6f}px, adjacent{max(far['adjacentDriftPx']):.6f}px. Original source furniture removed; unchanged independent desk normalized650-to534 at the same root. Blocking crate moved aside and actual0-7 boots inspected. No moving sole/material tracking, ground force or direction-height approval.",
 'hand-and-tool-contact':'The same closed ledger stays under the left arm and supported in its original hand through all8 poses. Free right hand changes from relaxed to palm-up extension, curled emphasis, outward gesture, chest gesture and nod, then lowers. Original fingers/wrist and cover/page-block relationships inspected; no book-opening, pressure, handwriting or hidden joint certification.',
 'prop-continuity':'Actor owns the held closed ledger, complete body and free gesture. Independent desk owns a separate open ledger, ink/paper/receipt and book stacks; all prior desk sprite layers and fixed placement exact. There is one held closed book and one separate desk book, no duplicate furniture or in-cycle transfer. Desk persists after departure. Original kneegap furniture fragments removed with source-only negative stencil; no new body material painted.',
 'completion-and-reset':'Six actual consultant days verify all8 authored125ms poses. New explanation completes once at7 and holds unchanged5 seconds; ordinary camera rotation preserves state. Forbidden forge assignment has no production effect. Departure releases actor and desk persists. Explicit return resets0; day resolution retains cosmetic consultant work; next morning advances and day7 restores writing. No seamless loop, seat-to-stand, pickup/put-down or spontaneous book refill approved.'}
scope='Finite original-pixel standing explanation with an already held closed ledger beside the independently owned desk. Visible stationary boots and book/hand continuity only; no seamless repeat, moving gait, hidden anatomy, seated-standing transfer, pickup/put-down or economic production.'
deps=[audit,out/'retained-assets-audit58.json',out/'source-pixel-tests58.txt']+proof+[native/name for name in ['source-pixel-identity58.json','stationary-boots58.json','source-body-basis58.json','layer-config58.json','visual-review58.json','layered-native58.jpg','game-eight-diagnostic58.jpg']]
deps += [native/f'game-{i}.png'for i in range(8)]+[native/'game-rotated.png',native/'game-departed.png']
deps += [cal,prop/'generation.json',prop/'sprite.png',root/'public/workstation-registration.mjs']
deps += [root/p for p in ['src/game/world/work-activities.ts','src/game/world/environment.tsx','src/game/world/workstation-sites.ts','src/game/world/workstations.tsx','src/game/world/npc-motion.ts','src/game/motion-playback.ts','scripts/consultant-work-check.mjs','scripts/source_pixel_actor_test.py','public/workstation-review.html']]
deps += [root/item['file']for item in g['originalFrames']]
write(folder/'task-approval.json',{'version':1,'binding':binding(folder,m),'playback':{'mode':'once-hold','endFrame':7},'scope':scope,'checks':checks,'dependencies':[{'file':os.path.relpath(p,folder),'sha256':digest(p)}for p in dict.fromkeys(deps)]})
apply(folder,m);assert m['playback']['taskApproved'] and not m['playback']['loopApproved'];write(folder/'manifest.json',m)
allowed={root/p for p in ['src/game/world/work-activities.ts','src/game/world/environment.tsx','public/sprites/Borrin/motion/render-calibration.json','scripts/consultant-work-check.mjs','scripts/work-activities.test.mjs','scripts/character-roles.test.mjs','scripts/character-motion.test.mjs','scripts/source_pixel_actor_test.py','scripts/motion_completion_test.py']}
changed_records=[];approval_paths=[]
for destination in assets['unchangedAcceptedCycles']:
 f=root/destination;prior=load(f/'manifest.json')
 for name in ['task-approval.json','loop-approval.json']:
  path=f/name
  if not path.exists():continue
  approval_paths.append(path);record=load(path);assert record['binding']==binding(f,prior);changes=[]
  for d in record['dependencies']:
   target=(f/d['file']).resolve()
   if digest(target)==d['sha256']:continue
   assert target in allowed,f'Unreviewed previous dependency:{target}'
   d['sha256']=digest(target);changes.append(str(target.relative_to(root)))
  if changes:
   record['runtimeRevalidation']={'checkpoint':'motion58','files':changes,'audit':os.path.relpath(audit,f),'scope':'Earlier selected art/timing and action calibration entries exact. Six actual consultant days and22 variants verify additive standing explanation/one local crate clearance only. Other gameplay/native observation dates and limited scopes retained. Source-pixel test addition replays all prior actors without changing helper semantics.'}
   for target in [audit,out/'retained-assets-audit58.json',out/'source-pixel-tests58.txt']+proof:
    relative=os.path.relpath(target,f);assert not any(d['file']==relative for d in record['dependencies']);record['dependencies'].append({'file':relative,'sha256':digest(target)})
   write(path,record);changed_records.append(str(path.relative_to(root)))
 apply(f,prior);assert prior['playback']['loopApproved']or prior['playback'].get('taskApproved'),destination;write(f/'manifest.json',prior)
allowed |= set(approval_paths)|{root/'docs/runtime-motion-additions.json',root/'public/workstation-library.json'}
changes=[]
for d in frozen['runtimeCoverageDependencies']:
 target=root/d['file']
 if digest(target)!=d['sha256']:
  assert target in allowed,f'Unreviewed coverage dependency:{target}'
  changes.append({'file':d['file'],'beforeSha256':d['sha256'],'sha256':digest(target)})
coverage=out/'runtime-coverage-audit58.json';write(coverage,{'version':1,'checkpoint':'motion58','baseline':assets['baseline'],'addedMappings':[new],'revalidatedDependencyChanges':changes,'revalidatedEarlierApprovals':changed_records,'runtimeAudit':{'file':str(audit.relative_to(root)),'sha256':digest(audit)},'scope':'One finite standing closed-book activation at the unchanged independent desk. Frozen160/50main+7original acceptances unchanged;15 derived actors outside denominator.26 live/39 inactive.103 individual and11 direction-family gates remain open.'})
frozen['mappedReferenceActions'].append(new);frozen['runtimeCoverageBinding']['sha256']=digest(root/frozen['runtimeCoverageBinding']['file'])
coverage_deps=[root/d['file']for d in frozen['runtimeCoverageDependencies']]+[coverage,audit,out/'retained-assets-audit58.json',out/'source-pixel-tests58.txt',root/'src/game/world/environment.tsx']+proof
coverage_deps += [p for p in folder.iterdir()if p.is_file()]+[p for p in prop.rglob('*')if p.is_file()]
frozen['runtimeCoverageDependencies']=[{'file':str(p.relative_to(root)),'sha256':digest(p)}for p in dict.fromkeys(coverage_deps)if str(p.relative_to(root))!=frozen['runtimeCoverageBinding']['file']]
frozen['runtimeCoverageNote']='Motion58 finite original standing closed-ledger explanation at unchanged independent desk. Six actual consultant days and22 variants validate all8 frames, completion hold, camera, cancellation/persistent desk/departure, return0, resolution/morning and day7 restoration. One crate moved beside desk to reveal standing boots.71 earlier scoped source/registration/timing sets, every old prop/site and prior Borrin calibration actions exact. Non-consultant actual gameplay keeps56/55 provenance and exact code/art/sites. Native gait/cane dates/scopes unchanged.15 derived actors outside frozen160;50main+7original accepted.26 live/39 inactive;103 cycles/11 families remain open. No economic production, hidden force, walking/direction or repeat approval.'
assert len(frozen['mappedReferenceActions'])==26;write(scope_path,frozen)
print('Accepted finite standing explanation; revalidated',len(changed_records),'affected approvals.26/65 live;39 inactive; no gait or family gates closed.')
