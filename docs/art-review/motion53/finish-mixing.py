"""Accept only verified finite mixing; retain every frozen review obligation."""
import json
import os
import shutil
import sys
from pathlib import Path

root=Path('.').resolve()
sys.path.insert(0,str(root/'scripts'))
from gait_calibration import binding as contact_binding
from motion_loop_approval import apply,binding,digest
load=lambda p:json.loads(p.read_text())
write=lambda p,j:p.write_text(json.dumps(j,indent=2)+'\n')
work=root/'work/expanded-cycles/motion53'
out=root/'docs/art-review/motion53'
native=out/'cook-mixing'
folder=root/'public/sprites/Cook/motion/mix-ingredients/actor'
prop=root/'public/sprites/workstations/mixing-block'
cal=root/'public/sprites/Cook/motion/render-calibration.json'
scope_path=root/'docs/motion-completion-scope.json'
frozen=load(scope_path)
new={'character':'Cook','action':'mix-ingredients'}
assert new not in frozen['mappedReferenceActions'],'Do not replay acceptance'
manifest=load(folder/'manifest.json')
for name in ['cooking-gameplay','smith-gameplay','npc-gameplay','station-layers-pending']:
    assert load(work/(name+'-exit.json'))['exitCode']==0,name
live=load(work/'cooking-gameplay/results.json')
assert not live['errors']
assert [r['action']for r in live['seen']]==['chop-vegetables','peel-potatoes','knead-dough','stir-cauldron','mix-ingredients','chop-vegetables']
for row in live['seen']:
    actor=root/f"public/sprites/Cook/motion/{row['action']}/actor"
    assert row['sourceSha256']==digest(actor/'source-sheet.png')
    assert row['atlasSha256']==digest(actor/'atlas.png')
    assert row['calibrationSha256']==digest(cal)
    assert [s['frame']for s in row['samples']]==list(range(8))
    assert row['completed']['completed'] and row['completed']['completions']==1
selected=live['seen'][4]
assert selected['naturalArrival'] and selected['propSha256']==digest(prop/'sprite.png')
assert any(s['id']=='mixing-block' and s['persistent'] and s['completedProp'] for s in selected['stations'])
smith=load(work/'smith-gameplay/results.json')
assert not smith['errors'] and len(smith['seen'])==5
npc=load(work/'npc-gameplay/results.json')
assert not npc['errors'] and len(npc['addedWorkers'])==5
layers=load(work/'station-layers-pending/results.json')
assert not layers['errors'] and len(layers['results'])==19
assert all(r['identicalLegacyFrames']==list(range(8))for r in layers['results'][:17])
assert layers['results'][17]['identicalLegacyFrames']==[]
boots=load(native/'stationary-boots53.json')
assert boots['measurementPassed'] and boots['binding']==contact_binding(folder,manifest)
contact=load(work/'bowl-surface-contact53.json')
assert contact['config']['binding']==boots['binding'] and contact['maxOutsideWorkingFacePx']==0
identity=load(native/'source-pixel-identity53.json')
assert not identity['geometryEdited'] and identity['originalFrameOrder']==list(range(8))
assert all(s['sameOpaqueOriginalPixels'] and s['registrationOffsetPx']==[0,0] for s in identity['samples'])
assets=load(out/'retained-assets-audit53.json')
assert len(assets['unchangedAcceptedCycles'])==68
for item in assets['unchangedSelectedAssets']+assets['unchangedExistingPropFiles']:
    assert digest(root/item['file'])==item['sha256'],item['file']
for destination in assets['unchangedAcceptedCycles']:
    f=root/destination;m=load(f/'manifest.json')
    for name in ['task-approval.json','loop-approval.json']:
        p=f/name
        if p.exists():assert load(p)['binding']==binding(f,m),destination

# No acceptance or dependency update occurs before every actual check above.
for target,source in [('cooking-gameplay53.json','cooking-gameplay/results.json'),
                      ('smith-gameplay53.json','smith-gameplay/results.json'),
                      ('npc-gameplay53.json','npc-gameplay/results.json'),
                      ('station-layer-authoring53.json','station-layers-pending/results.json')]:
    shutil.copy2(work/source,out/target)
for name in ['cooking-gameplay','smith-gameplay','npc-gameplay','station-layers-pending']:
    shutil.copy2(work/(name+'-exit.json'),out/(name+'-execution53.json'))
for i in range(8):
    shutil.copy2(work/'cooking-gameplay'/f'day5-mix-ingredients-{i}.png',native/f'game-{i}.png')
for name in ['departed','rotated']:
    shutil.copy2(work/'cooking-gameplay'/f'mix-ingredients-{name}.png',native/f'game-{name}.png')
generation=load(folder/'generation.json');generation['candidate']=False
write(folder/'generation.json',generation)
g=load(prop/'generation.json');g['candidate']=False
g['placementReview']='One uniformly normalized independent table and completed bowl. Native all-eight actor/table compositions and actual task lifecycle reviewed. Visible material contacts only; no hidden far sole or force certification.'
write(prop/'generation.json',g)
contact['config']['actor']=str(folder.relative_to(root))
contact['config']['dependencies']=[{'file':str(p.relative_to(root)),'sha256':digest(p)}for p in
    [prop/'sprite.png',prop/'generation.json',prop/'completion-source.png',prop/'completed-mixture.png',cal]]
write(native/'bowl-surface-contact53.json',contact)
write(native/'source-body-basis53.json',{'source':'public/sprites/Cook/motion/mix-ingredients/reference/00.png',
    'sourceSha256':digest(root/'public/sprites/Cook/motion/mix-ingredients/reference/00.png'),
    'visibleCrownY':25,'visibleNearBootRimY':545,'inclusiveBodyBasisPx':521,
    'actorAndStationTargetAnchor':[320,616],'actorAndStationBodyBasisPx':521,
    'scope':'One shared visible pose0 body basis. Original coordinates retained without scaling or offsets. Registration root estimates the occluded far foot; no hidden-foot or cross-direction height certification.'})
proof=[out/'cooking-gameplay53.json',out/'smith-gameplay53.json',out/'npc-gameplay53.json',out/'station-layer-authoring53.json']
audit=out/'runtime-revalidation53.json'
write(audit,{'version':1,'checkpoint':'motion53','baseline':assets['baseline'],
    'assetAudit':{'file':str((out/'retained-assets-audit53.json').relative_to(root)),'sha256':digest(out/'retained-assets-audit53.json')},
    'currentEvidence':[{'file':str(p.relative_to(root)),'sha256':digest(p)}for p in proof],
    'checks':{'assets':'All68 earlier accepted source/registration/timing sets, every prior Cook calibration action and every existing prop file are exact.',
              'runtime':'Additive fifth meal operation and independent flour table. Six actual meal days, all8 mixing frames, camera-preserved hold, cancellation, persistent completed bowl, explicit return and morning reset pass. Five forge days and original NPC/passive jobs pass. Every non-meal activity list and earlier physical station descriptor remain exact.',
              'preview':'19 independent variants pass. Earlier17 shared-basis variants remain pixel-identical over136 comparisons; the preceding physical anvil-ready transform is unchanged. New mixing actor/table and completed bowl display at the common521/[320,616] basis.',
              'olderObservations':'Unchanged native walking, cane, Cook and consultant observations retain their earlier dates and scopes. This is not new stride, direction-family or whole-library motion approval.'},
    'scope':'Bounded additive finite cosmetic mixing and completed-bowl ownership; no moving gait/cane, tool-direction family, material transfer or economic acceptance.'})
r=boots['regions'][0]
checks={
    'identity-and-scale':'Literal original bald brown-haired Cook, full brown beard, maroon sleeves, cream flour-stained apron and stocky body. Original0-7 order, all opaque source pixels retained on one521/[320,616] visible pose0 body basis. No local painting, warp, mirror, per-pose scaling, offsets, duplicate poses or synthetic in-betweens. Only visible near leg/boot retained; far leg stays unobserved.',
    'station-and-foot-contact':f"Visible stationary boot minimum correlation{min(v['correlation']for v in r['results']):.6f}, maximum travel{max(v['driftPx']for v in r['results']):.6f}px and adjacent{max(r['adjacentDriftPx']):.6f}px pass unchanged.94/6/6 bounds. Hidden sole, moving gait and family-scale continuity are excluded.",
    'hand-and-tool-contact':'One wooden spoon stays connected to the mixing hand as it moves across the bowl. The other hand steadies the same wooden rim. The actual opaque lower bowl point lies on the independent projected tabletop in all8 poses, maximum outside0px. Hidden spoon tip, bowl underside, ingredient/force tracks and anatomical hidden contacts are not certified.',
    'prop-continuity':'Actor owns body, visible boot, bowl, mixture, spoon and hands. Independent table owns flour sack, loose scoop/flour, eggs and small cup. A separately authored lower-angle bowl persists after finite completion/departure and resets for explicit new work. First overly overhead bowl is preserved as unselected. Uniform source normalization only; no utensil or body fragment remains in the completed prop. No reward, ingredient transfer, serving or baking added.',
    'completion-and-reset':'Six actual meal days display every authored-duration mixing frame, complete once at7 and hold5seconds. Ordinary camera turn preserves finish. Cancel releases actor; independent table and completed bowl persist after departure. Explicit return resets0 and hides old mixture; cancellation before completion leaves no completed bowl. Day resolution releases motion and next morning restores recipe selection. No seamless7-to0 repeat approval.'}
scope='Finite stationary original-pixel Cook mixing over an independent flour table, visible near-boot/lower-bowl contact and persistent cosmetic completion reviewed. Hidden far sole, traveling motion, forces, ingredient transfer, direction continuity and seamless repeat excluded.'
write(native/'actor-review53.json',{'version':1,'reviewedAt':'2026-10-06','verdict':'accepted','acceptance':'finite-task','binding':binding(folder,manifest),'scope':scope,'checks':checks})
deps=[p for p in native.rglob('*')if p.is_file()]+proof+[audit,out/'retained-assets-audit53.json',cal,folder/'generation.json',folder/'motion-polish.json']
deps += [p for p in prop.rglob('*')if p.is_file()]
deps += [root/p for p in ['src/game/store.ts','src/game/world/npc-motion.ts','src/game/world/workstation-sites.ts',
    'src/game/world/work-activities.ts','src/game/world/scene.tsx','src/game/world/sprites.tsx',
    'src/game/world/workstations.tsx','src/game/world/workstation-completion.ts','src/game/motion-playback.ts',
    'scripts/cooking-work-check.mjs','scripts/workstation-review-check.mjs','public/workstation-review.html','public/workstation-registration.mjs']]
for source in generation['originalFrames']:
    assert digest(root/source['file'])==source['sha256'];deps.append(root/source['file'])
write(folder/'task-approval.json',{'version':1,'binding':binding(folder,manifest),
    'playback':{'mode':'once-hold','endFrame':7},'scope':scope,'checks':checks,
    'dependencies':[{'file':os.path.relpath(p,folder),'sha256':digest(p)}for p in dict.fromkeys(deps)]})
apply(folder,manifest)
assert manifest['playback']['taskApproved'] and not manifest['playback']['loopApproved']
write(folder/'manifest.json',manifest)

allowed={root/p for p in ['src/game/world/work-activities.ts','src/game/world/workstation-sites.ts',
    'public/sprites/Cook/motion/render-calibration.json','scripts/cooking-work-check.mjs',
    'scripts/work-assignment.test.mjs','scripts/work-activities.test.mjs','scripts/workstation-review-check.mjs']}
changed_records=[];approval_paths=[]
for destination in assets['unchangedAcceptedCycles']:
    f=root/destination;m=load(f/'manifest.json')
    for name in ['task-approval.json','loop-approval.json']:
        path=f/name
        if not path.exists():continue
        approval_paths.append(path);record=load(path)
        assert record['binding']==binding(f,m)
        changes=[]
        for d in record['dependencies']:
            target=(f/d['file']).resolve()
            if digest(target)==d['sha256']:continue
            assert target in allowed,f'Unreviewed previous dependency:{target}'
            d['sha256']=digest(target);changes.append(str(target.relative_to(root)))
        if changes:
            record['runtimeRevalidation']={'checkpoint':'motion53','files':changes,'audit':os.path.relpath(audit,f),
                'scope':'Exact earlier selected art/calibration entries and limited native acceptance retained. Additive meal mapping and completed-bowl ownership verified; all prior layers, forge and original jobs pass. Earlier numerical observations keep their dates. No new gait/cane, family or global motion approval.'}
            for target in [audit,out/'retained-assets-audit53.json']+proof:
                relative=os.path.relpath(target,f)
                existing=next((d for d in record['dependencies']if d['file']==relative),None)
                if existing:assert existing['sha256']==digest(target)
                else:record['dependencies'].append({'file':relative,'sha256':digest(target)})
            write(path,record);changed_records.append(str(path.relative_to(root)))
    apply(f,m)
    assert m['playback']['loopApproved']or m['playback'].get('taskApproved'),destination
    write(f/'manifest.json',m)
allowed |= set(approval_paths)|{root/'docs/runtime-motion-additions.json',root/'public/workstation-library.json'}
changes=[]
for d in frozen['runtimeCoverageDependencies']:
    target=root/d['file']
    if digest(target)!=d['sha256']:
        assert target in allowed,f'Unreviewed coverage dependency:{target}'
        changes.append({'file':d['file'],'beforeSha256':d['sha256'],'sha256':digest(target)})
coverage=out/'runtime-coverage-audit53.json'
write(coverage,{'version':1,'checkpoint':'motion53','baseline':assets['baseline'],'addedMappings':[new],
    'revalidatedDependencyChanges':changes,'revalidatedEarlierApprovals':changed_records,
    'runtimeAudit':{'file':str(audit.relative_to(root)),'sha256':digest(audit)},
    'scope':'One finite cosmetic mixing activation and one independent flour table/completed bowl. Frozen160 unchanged:50 main+7 original accepted,12 derived actors outside denominator.23 live/42 inactive references.103 individual cycle reviews and11 family gates remain open.'})
frozen['mappedReferenceActions'].append(new)
frozen['runtimeCoverageBinding']['sha256']=digest(root/frozen['runtimeCoverageBinding']['file'])
coverage_deps=[root/d['file']for d in frozen['runtimeCoverageDependencies']]+[coverage,audit,out/'retained-assets-audit53.json']+proof
coverage_deps += [p for p in folder.iterdir()if p.is_file()]+[p for p in prop.rglob('*')if p.is_file()]
frozen['runtimeCoverageDependencies']=[{'file':str(p.relative_to(root)),'sha256':digest(p)}for p in dict.fromkeys(coverage_deps)if str(p.relative_to(root))!=frozen['runtimeCoverageBinding']['file']]
frozen['runtimeCoverageNote']='Motion53 finite original-pixel mixing at an independent flour table, with persistent completed bowl. Six actual meal days,5 forge days, original jobs/passive stations and19 layered variants pass. All8 poses, exact source/atlas/calibration/prop hashes, natural arrival, hold, camera turn, cancellation/departure/return and day reset exercised.68 earlier accepted art/registration/timing sets, all existing props and prior Cook calibration entries exact. Older numerical gait/cane/contact observations keep dates/scope.12 derived actors outside frozen160;50 main/7 original and11 open direction families unchanged.23 live reference actions,42 inactive. Economic ownership remains in existing day resolution.'
assert len(frozen['mappedReferenceActions'])==23
write(scope_path,frozen)
print('Accepted finite Cook mixing; revalidated',len(changed_records),'affected approvals.23/65 live;42 inactive. PR9 motion/family gates remain open.')
