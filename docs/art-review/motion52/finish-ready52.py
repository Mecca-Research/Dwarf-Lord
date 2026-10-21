"""Close one verified finite task; preserve the frozen scope and old reviews."""
import json,os,shutil,sys
from pathlib import Path
root=Path('.').resolve();sys.path.insert(0,str(root/'scripts'))
from motion_loop_approval import apply,binding,digest
from gait_calibration import binding as contact_binding
load=lambda p:json.loads(p.read_text())
write=lambda p,j:p.write_text(json.dumps(j,indent=2)+'\n')
work=root/'work/expanded-cycles/motion52';out=root/'docs/art-review/motion52';native=out/'blacksmith-ready';native.mkdir(exist_ok=True)
folder=root/'public/sprites/Blacksmith/motion/anvil-ready/actor';manifest=load(folder/'manifest.json')
cal=root/'public/sprites/Blacksmith/motion/render-calibration.json';prop=root/'public/sprites/workstations/anvil'
assert load(work/'smith-gameplay-exit.json')['exitCode']==0
assert load(work/'npc-gameplay-exit.json')['exitCode']==0
live=load(work/'smith-gameplay/results.json')
assert not live['errors']and [r['action']for r in live['seen']]==['hammer-contact','inspect-tool','repair-pickaxe-handle','anvil-ready','hammer-contact']
for row in live['seen']:
 f=root/f"public/sprites/Blacksmith/motion/{row['action']}/actor"
 assert row['sourceSha256']==digest(f/'source-sheet.png')and row['atlasSha256']==digest(f/'atlas.png')
 assert row['calibrationSha256']==digest(cal)and row['naturalArrival']
 assert [s['frame']for s in row['samples']]==list(range(8))
 assert row['completed']['completed']and row['completed']['completions']==1
selected=live['seen'][3];assert selected['propSha256']==digest(prop/'sprite.png')
boots=load(work/'blacksmith-ready/stationary-boots52.json');assert boots['measurementPassed']
assert boots['binding']==contact_binding(folder,manifest)
contact=load(work/'blacksmith-ready/billet-surface-contact52.json')
assert contact['config']['binding']==boots['binding']and contact['maxOutsideWorkingFacePx']==0
identity=load(work/'blacksmith-ready/source-pixel-identity52.json')
assert not identity['geometryEdited']and identity['originalFrameOrder']==list(range(8))
assert len(identity['samples'])==8 and all(s['sameOpaqueOriginalPixels']for s in identity['samples'])
assert all(max(abs(v)for v in s['registrationOffsetPx'])<=12 for s in identity['samples'])
layers=load(work/'station-layers-pending/results.json');assert len(layers['results'])==18 and not layers['errors']
assert all(row['identicalLegacyFrames']==list(range(8))for row in layers['results'][:17])
assert layers['results'][17]['identicalLegacyFrames']==[]
npc=load(work/'npc-gameplay/results.json');assert not npc['errors']and len(npc['addedWorkers'])==5
assets=load(out/'retained-assets-audit52.json');assert len(assets['unchangedAcceptedCycles'])==67
for item in assets['unchangedSelectedAssets']+assets['unchangedExistingPropFiles']:assert digest(root/item['file'])==item['sha256']
# Reject source changes before changing any acceptance record.
for destination in assets['unchangedAcceptedCycles']:
 f=root/destination;m=load(f/'manifest.json')
 for name in ['task-approval.json','loop-approval.json']:
  p=f/name
  if p.exists():assert load(p)['binding']==binding(f,m),destination

for name in ['source-pixel-identity52.json','stationary-boots52.json','layered-native52.jpg','native-material-contact52.jpg',
             'layer-config52.json','registered-prop52.png','prepare-ready.py','install-ready.py','measure-ready.py',
             'layered-once-preview52.png','layered-once-preview52.txt']:
 shutil.copy2(work/'blacksmith-ready'/name,native/name)
shutil.copytree(work/'blacksmith-ready/before-registration',native/'before-registration')
contact['config']['actor']=str(folder.relative_to(root))
contact['config']['dependencies']=[{'file':str(p.relative_to(root)),'sha256':digest(p)}for p in
 [native/'registered-prop52.png',prop/'sprite.png',prop/'generation.json',cal,root/'public/workstation-registration.mjs']]
write(native/'billet-surface-contact52.json',contact)
for i in range(8):
 shutil.copy2(work/'blacksmith-ready'/f'layer-{i}.png',native/f'native-{i}.png')
 shutil.copy2(work/'smith-gameplay'/f'day4-anvil-ready-{i}.png',native/f'game-{i}.png')
for name in ['departed','rotated']:
 shutil.copy2(work/'smith-gameplay'/f'day4-anvil-ready-{name}.png',native/f'game-{name}.png')
for target,source in [('smith-gameplay52.json','smith-gameplay/results.json'),('npc-gameplay52.json','npc-gameplay/results.json'),
                      ('station-layer-authoring52.json','station-layers-pending/results.json'),
                      ('smith-check52.log','smith-gameplay.log'),('npc-check52.log','npc-gameplay.log')]:
 shutil.copy2(work/source,out/target)
for name in ['smith-gameplay','npc-gameplay']:
 shutil.copy2(work/(name+'-exit.json'),out/(name+'-execution52.json'))
write(native/'source-body-basis52.json',{'source':'public/sprites/Blacksmith/motion/anvil-ready/reference/00.png',
 'sourceSha256':digest(root/'public/sprites/Blacksmith/motion/anvil-ready/reference/00.png'),
 'referenceVisibleCrownY':73,'referenceVisibleNearBootRimY':581,'inclusiveBodyBasisPx':509,
 'actorTargetAnchor':[280,592],'stationBodyBasisPx':520,'stationTargetAnchor':[320,616],
 'uniformPropScaleInActorCanvas':509/520,'scope':'Shared visible pose0 body basis, excluding held hammer height and anvil. The source registration root retains an estimate for the occluded far foot; no anatomical hidden-foot or cross-direction height certification.'})
generation=load(folder/'generation.json');generation['candidate']=False
write(folder/'generation.json',generation)
proof=[out/'smith-gameplay52.json',out/'npc-gameplay52.json',out/'station-layer-authoring52.json']
audit=out/'runtime-revalidation52.json'
write(audit,{'version':1,'checkpoint':'motion52','baseline':assets['baseline'],
 'assetAudit':{'file':str((out/'retained-assets-audit52.json').relative_to(root)),'sha256':digest(out/'retained-assets-audit52.json')},
 'currentEvidence':[{'file':str(p.relative_to(root)),'sha256':digest(p)}for p in proof],
 'checks':{'assets':'All67 earlier accepted art/registration/timing sets, prior Blacksmith calibration actions and all prop files are exact.',
 'runtime':'Fourth forge preparation operation at the existing anvil added. Five actual forge days, all8 preparation poses, finite hold, cancellation, camera turn, departure, explicit return and morning reset pass. Original camp jobs/passive stations pass. Every other activity list, physical site, movement/root/phase/camera/ownership/economic implementation is unchanged.',
 'preview':'18 independent layer variants pass. The earlier17 draw exactly the prior renderer pixels in every0-7 pose,136 comparisons. The new preparation prop is mapped uniformly from520/[320,616] into509/[280,592], preserving the common world root. No per-pose scale or source-pixel distortion.',
 'olderObservations':'Unchanged numerical walking, cane, Cook and consultant evidence retains its earlier dates and scope. This audit is not a new whole-stride observation, direction-family review or blanket all-green approval.'},
 'scope':'Bounded additive finite forge activation and equivalent physical workstation preview. No new walking/cane/directional/contact-family acceptance.'})
r=boots['regions'][0];values=r['results']
checks={
 'identity-and-scale':'Original bald Blacksmith with two brass-bound black beard braids, cream sleeves, brown leather apron, olive trousers and capped boots. Exact source-material stencils preserve all8 whole poses in0-7 order. One509px visible pose0 body basis and[280,592] root; only bounded whole-pose integer offsets up to12px. No local limb/gear editing, interpolation, mirror, per-pose scale or duplicate frame.',
 'station-and-foot-contact':f"Original unregistered near-boot maximum12.087818px drift/11.917376px adjacent change fails and is archived. Whole-pose integer registration within the original12px component bound gives visible boot minimum correlation{min(v['correlation']for v in values):.6f}, maximum travel{max(v['driftPx']for v in values):.6f}px and adjacent{max(r['adjacentDriftPx']):.6f}px, within unchanged.94/6/6 bounds. Occluded far foot and anatomical traveling sole remain unobserved.",
 'hand-and-tool-contact':'One visibly connected hammer head/handle is retained in the near hand; the opposite hand retains the same pincer silhouette and orange billet through0-7. Native lower billet points stay on the unchanged independent projected anvil face, maximum outside0px. Pincer open spaces are excluded from the source stencils. Hidden jaw underside, rigid material/force tracks and hammer impact are not certified.',
 'prop-continuity':'The existing anvil/stump sprite and520/[320,616] physical registration remain byte-identical. Actor owns body, hands, hammer, tongs and hot billet; persistent prop owns anvil/stump. One uniform registration transform places the prop in the actor review canvas; actual gameplay already uses each measured body basis at one world root. No second anvil, furniture painted into the actor, finished forging or economic output is added.',
 'completion-and-reset':'Actual Three renderer exercises forging/inspection/repair/preparation/forging over5 days. All8 preparation durations display at the naturally reached6/-7 site, complete once at7 and hold5seconds. Camera turn preserves the finish. Cancellation releases actor; departure leaves anvil independent. Explicit return resets0; day resolution releases animation and next morning restores selection. Preparation ends with a held chest/shoulder-height hammer; no seamless7-to0 repeat is approved.'}
scope='Finite stationary original-pixel Blacksmith anvil preparation over the unchanged independent anvil. Visible stationary near-boot region and projected lower billet face reviewed. No hidden far sole, traveling stride, concealed jaw/contact force, impact, completed forging, family continuity or seamless repeat certification.'
write(native/'actor-review52.json',{'version':1,'reviewedAt':'2026-10-06','verdict':'accepted','acceptance':'finite-task','binding':binding(folder,manifest),'scope':scope,'checks':checks})
deps=[p for p in native.rglob('*')if p.is_file()]+proof+[audit,out/'retained-assets-audit52.json',cal,folder/'generation.json',folder/'motion-polish.json']+[p for p in prop.rglob('*')if p.is_file()]
deps += [root/p for p in ['src/game/store.ts','src/game/world/npc-motion.ts','src/game/world/workstation-sites.ts','src/game/world/work-activities.ts',
 'src/game/world/scene.tsx','src/game/world/sprites.tsx','src/game/world/workstations.tsx','src/game/motion-playback.ts',
 'scripts/smith-work-check.mjs','scripts/workstation-review-check.mjs','public/workstation-review.html','public/workstation-registration.mjs']]
for source in generation['originalFrames']:
 assert digest(root/source['file'])==source['sha256'];deps.append(root/source['file'])
write(folder/'task-approval.json',{'version':1,'binding':binding(folder,manifest),'playback':{'mode':'once-hold','endFrame':7},
 'scope':scope,'checks':checks,'dependencies':[{'file':os.path.relpath(p,folder),'sha256':digest(p)}for p in dict.fromkeys(deps)]})
apply(folder,manifest);assert manifest['playback']['taskApproved']and not manifest['playback']['loopApproved'];write(folder/'manifest.json',manifest)
allowed={root/p for p in ['src/game/world/work-activities.ts','src/game/world/workstation-sites.ts',
 'public/sprites/Blacksmith/motion/render-calibration.json','scripts/smith-work-check.mjs','scripts/work-assignment.test.mjs','scripts/work-activities.test.mjs',
 'scripts/workstation-review-check.mjs','public/workstation-review.html']}
changed_records=[];approval_paths=[]
for destination in assets['unchangedAcceptedCycles']:
 f=root/destination;m=load(f/'manifest.json')
 for name in ['task-approval.json','loop-approval.json']:
  path=f/name
  if not path.exists():continue
  approval_paths.append(path);record=load(path);assert record['binding']==binding(f,m);changes=[]
  for d in record['dependencies']:
   target=(f/d['file']).resolve()
   if digest(target)==d['sha256']:continue
   assert target in allowed,f'Unreviewed previous dependency:{target}'
   d['sha256']=digest(target);changes.append(str(target.relative_to(root)))
  if changes:
   record['runtimeRevalidation']={'checkpoint':'motion52','files':changes,'audit':os.path.relpath(audit,f),
    'scope':'Exact prior selected sources and limited native acceptance retained. Additive forge mapping and pixel-equivalent prior preview layers verified. Earlier numerical stride/cane observations retain their dates; no new native gait, family or global motion approval.'}
   additions=[audit,out/'retained-assets-audit52.json']+proof
   if any((f/d['file']).resolve()==root/'public/workstation-review.html'for d in record['dependencies']):additions.append(root/'public/workstation-registration.mjs')
   for target in additions:
    relative=os.path.relpath(target,f)
    existing=next((d for d in record['dependencies']if d['file']==relative),None)
    if existing:assert existing['sha256']==digest(target)
    else:record['dependencies'].append({'file':relative,'sha256':digest(target)})
   write(path,record);changed_records.append(str(path.relative_to(root)))
 apply(f,m);assert m['playback']['loopApproved']or m['playback'].get('taskApproved'),destination;write(f/'manifest.json',m)
path=root/'docs/motion-completion-scope.json';frozen=load(path);new={'character':'Blacksmith','action':'anvil-ready'};assert new not in frozen['mappedReferenceActions']
allowed |= set(approval_paths)|{root/'docs/runtime-motion-additions.json',root/'public/workstation-library.json'}
changes=[]
for d in frozen['runtimeCoverageDependencies']:
 target=root/d['file']
 if digest(target)!=d['sha256']:
  assert target in allowed,f'Unreviewed coverage dependency:{target}'
  changes.append({'file':d['file'],'beforeSha256':d['sha256'],'sha256':digest(target)})
coverage=out/'runtime-coverage-audit52.json'
write(coverage,{'version':1,'checkpoint':'motion52','baseline':assets['baseline'],'addedMappings':[new],
 'revalidatedDependencyChanges':changes,'revalidatedEarlierApprovals':changed_records,
 'runtimeAudit':{'file':str(audit.relative_to(root)),'sha256':digest(audit)},
 'scope':'One finite cosmetic forge preparation activation, on the existing physical anvil. Frozen160 obligations unchanged;50 main and7 original accepted,11 derived actors outside denominator.22 live references/43 inactive;103 individual reviews and11 family gates remain open.'})
frozen['mappedReferenceActions'].append(new);frozen['runtimeCoverageBinding']['sha256']=digest(root/frozen['runtimeCoverageBinding']['file'])
coverage_deps=[root/d['file']for d in frozen['runtimeCoverageDependencies']]+[coverage,audit,out/'retained-assets-audit52.json',root/'public/workstation-registration.mjs']+proof
coverage_deps += [p for p in folder.iterdir()if p.is_file()]
frozen['runtimeCoverageDependencies']=[{'file':str(p.relative_to(root)),'sha256':digest(p)}for p in dict.fromkeys(coverage_deps)if str(p.relative_to(root))!=frozen['runtimeCoverageBinding']['file']]
frozen['runtimeCoverageNote']='Motion52 verified finite Blacksmith preparation at the unchanged independent anvil, with four forge operations over five days and return to forging. All8 source poses, exact source/atlas/calibration/prop hashes, natural arrival, hold, camera turn, cancellation/departure/return and day reset exercised. Earlier67 accepted art/registration/timing sets and all props exact. Old17 preview layers pixel-identical over136 frames;18 current independent variants verified. Older unchanged stride/cane/Cook/consultant measurements retain dates and scope.11 derived actors outside frozen160;50 main/7 original and11 open direction families unchanged.22 live reference actions,43 inactive. Economic output remains under existing day resolution.'
assert len(frozen['mappedReferenceActions'])==22;write(path,frozen)
print('Accepted finite Blacksmith preparation; revalidated',len(changed_records),'affected approvals.22/65 live actions,43 inactive; full PR9 remains blocked.')
