import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const png=p=>{const b=readFileSync(p);assert.equal(b.toString('hex',0,8),'89504e470d0a1a0a');return [b.readUInt32BE(16),b.readUInt32BE(20),b[25]]};
test('station residual evidence matches the current sources and calibration',()=>{
 const report=json('docs/motion-station-followup-results.json');
 assert.equal(report.sequences.length,36);
 for(const result of report.sequences){
  const m=json(`public/sprites/${result.character}/motion/${result.action}/reference/manifest.json`);
  assert.equal(result.sourceSha256,m.sourceSha256);
  assert.equal(result.settingsSha256,m.registration.settingsSha256);
  assert.ok(result.after.maxTranslationPx<=.71,`${result.character}/${result.action}`);
  if(!result.baselineComparable)assert.equal(result.before,null,'changed art cannot be compared to old pixels');
 }
});
test('targeted motion redraws retain their exact edit references and prompts',()=>{
 for(const folder of ['Ginger/motion/fell-tree/reference','Elder/motion/walk/back','Helga/motion/carry-mine-timber/left']){
  const root=resolve('public/sprites',folder),g=json(resolve(root,'generation.json'));
  const inputs=g.editHistory??[{...g.editInput,input:g.editInput.file,prompt:g.prompt}];
  for(const input of inputs){assert.equal(hash(resolve(root,input.input)),input.sha256);assert.ok(input.prompt.length>100)}
 }
});
test('directional authoring templates resolve every view to the correct eight-frame family',()=>{
 const templates=json('public/sprites/directional-motion-templates.json').templates;
 assert.equal(templates.length,3);
 for(const template of templates){
  assert.equal(template.productionReady,false);assert.equal(template.intendedPhases.length,8);
  assert.deepEqual(template.directions.map(d=>d.angleFromFrontDegrees),[0,45,90,135,180,225,270,315]);
  for(const direction of template.directions){
   const m=json(resolve('public/sprites',direction.manifest));
   assert.equal(m.character,template.sourceCharacter);assert.equal(m.action,template.action);
   assert.equal(m.direction,direction.id);assert.equal(m.frameCount,8);
  }
 }
});
test('expanded motion plan preserves the requested character and directional coverage',()=>{
 const p=json('docs/expanded-animation-plan.json');
 assert.equal(p.entries.length,153);
 assert.equal(new Set(p.entries.map(e=>e.destination)).size,153);
 for(const name of ['Blacksmith','Borrin','Cook','Elder','Female Miner','Ginger','Helga','Laborer']) {
  const walks=p.entries.filter(e=>e.character===name&&e.kind==='walk');
  assert.equal(walks.length,8);assert.equal(new Set(walks.map(e=>e.direction)).size,8);
 }
 for(const e of p.entries){assert.equal(e.beats.length,8);assert.ok(existsSync(e.reference),e.reference)}
});
test('every exported motion has eight transparent frames, atlas, source and animated preview',()=>{
 const library=json('public/sprites/motion-library.json');assert.ok(library.length>0);
 for(const character of library){
  const path=resolve('public/sprites',character.manifest),catalog=json(path);let total=0;
  for(const action of catalog.actions){
   const mp=resolve(dirname(path),action.manifest),m=json(mp),folder=dirname(mp);
   assert.equal(m.character,character.name);assert.equal(m.direction,action.direction);
   assert.equal(m.frames.length,8);assert.equal(m.frameCount,8);assert.equal(m.productionReady,false);
   assert.deepEqual(m.playback.order,[0,1,2,3,4,5,6,7]);
   assert.equal(hash(resolve(folder,m.source)),m.sourceSha256,'stale export after source replacement');
   assert.deepEqual(m.sourceFrameOrder??[0,1,2,3,4,5,6,7],json(resolve(folder,'generation.json')).frameOrder??[0,1,2,3,4,5,6,7]);
   assert.ok(existsSync(resolve(folder,m.reference)));assert.deepEqual(png(resolve(folder,m.atlas.file)),[5120,640,6]);
   const apng=readFileSync(resolve(folder,m.preview));const offset=apng.indexOf(Buffer.from('acTL'));assert.ok(offset>0);assert.equal(apng.readUInt32BE(offset+4),8);
   const hashes=new Set();for(const frame of m.frames){assert.deepEqual(png(resolve(folder,frame.file)),[640,640,6]);hashes.add(hash(resolve(folder,frame.file)));total++;}
   assert.equal(hashes.size,8,mp);
  }
  assert.equal(total,character.frameCount);assert.equal(catalog.actions.length,character.actionCount);
 }
});
test('new task references resolve to their exported initial pose without duplicate files',()=>{
 const plan=json('docs/expanded-animation-plan.json');
 for(const e of plan.entries.filter(e=>e.kind==='new-work'&&e.status==='exported')){
  const refs=resolve('public/sprites',e.character,'work-references/manifest.json');
  const item=json(refs).supplementalReferences.find(r=>r.id===e.action&&r.origin==='expanded-motion');
  assert.ok(item,e.destination);assert.equal(item.staticReference,true);assert.equal(item.productionReady,false);
  assert.equal(resolve(dirname(refs),item.file),resolve(e.destination,'00.png'));
 }
});

test('registered motion stays inside its canvas and preserves authored timing in APNG',()=>{
 const plan=json('docs/expanded-animation-plan.json');
 for(const entry of plan.entries){
  const folder=resolve(entry.destination),m=json(resolve(folder,'manifest.json'));
  assert.equal(m.registration.exportVersion,2,entry.destination);
  const reviewed = (entry.character==='Elder' && ['eat-stew','eat-bread','laugh-seated','laugh-and-gesture'].includes(entry.action) && entry.direction==='reference') ||
    (entry.character==='Blacksmith' && entry.action==='walk' && entry.direction==='right') ||
    (entry.direction==='reference' && ((entry.character==='Blacksmith' && ['hammer-raised','hammer-contact'].includes(entry.action)) ||
      (entry.character==='Ginger' && entry.action==='fell-tree')));
  assert.equal(m.playback.loopApproved,reviewed,entry.destination);
  if(reviewed){assert.ok(existsSync(resolve(folder,'loop-approval.json')));assert.equal(m.loopReview.status,'approved');}
  const finiteActions = {
   Elder:['inspect-pickaxe-in-lap','examine-pickaxe-crack'],
   Blacksmith:['anvil-ready','inspect-tool','file-tool-edge','repair-pickaxe-handle','fix-wheelbarrow'],
   Borrin:['desk-writing','review-open-ledger','turn-ledger-page','explain-at-desk','stamp-paperwork','explain-closed-ledger','explain-open-ledger','count-coins'],
   Cook:['chop-vegetables','peel-potatoes','knead-dough','stir-cauldron','mix-ingredients','serve-stew','cut-boar-meat','fillet-fish'],
   'Female Miner':['examine-sample','repair-pickaxe','pickaxe-ready'],
   Helga:['inspect-mineral','bind-tool-handle','pickaxe-ready','pickaxe-contact'],
   Ginger:['sharpen-hatchet','sharpen-axe','saw-timber','build-timber-crate','chop-downed-log','build-barrel'],
   Laborer:['build-crate','stack-crates','shovel-rubble','sweep-wood-chips','lift-crate'],
  };
  const finiteReviewed = entry.direction==='reference' && Boolean(finiteActions[entry.character]?.includes(entry.action));
  assert.equal(Boolean(m.playback.taskApproved),finiteReviewed,entry.destination);
  if(finiteReviewed){assert.equal(m.playback.mode,'once-hold');assert.equal(m.taskReview.status,'approved');}
  assert.equal(m.productionReady,false,'a scoped seated review cannot approve all production motion');
  assert.equal(m.playback.durationMs,m.frames.reduce((n,f)=>n+f.durationMs,0));
  const configPath=resolve(folder,'motion-polish.json');
  if(existsSync(configPath)){
   const config=json(configPath);
   assert.equal(config.sourceSha256,m.sourceSha256,'recalibrate changed source');
   if(config.bodyHeight)assert.ok(Math.abs(m.sharedScale*config.bodyHeight-config.targetBodyHeight)<.001);
  }
  for(const f of m.frames){
   const [x,y]=f.placement,[x0,y0,x1,y1]=f.sourceBounds;
   assert.ok(x>=0&&y>=0&&x+Math.round((x1-x0)*m.sharedScale)<=640&&y+Math.round((y1-y0)*m.sharedScale)<=640,entry.destination);
   assert.ok(Math.abs(x+f.sourceAnchor[0]*m.sharedScale-f.groundAnchor[0])<=.501);
   assert.ok(Math.abs(y+f.sourceAnchor[1]*m.sharedScale-f.groundAnchor[1])<=.501);
  }
  const bytes=readFileSync(resolve(folder,m.preview)),durations=[];let repeats;
  for(let pos=8;pos<bytes.length;){
   const len=bytes.readUInt32BE(pos),type=bytes.toString('ascii',pos+4,pos+8),data=pos+8;
   if(type==='acTL')repeats=bytes.readUInt32BE(data+4);
   if(type==='fcTL')durations.push(bytes.readUInt16BE(data+20)*1000/(bytes.readUInt16BE(data+22)||100));
   pos+=len+12;
  }
  assert.deepEqual(durations,m.frames.map(f=>f.durationMs));
  assert.equal(repeats,m.playback.mode==='once-hold'?1:0);
 }
});

test('direction families use a common body target instead of independently fitting tool reach',()=>{
 const entries=json('docs/expanded-animation-plan.json').entries,groups=new Map();
 for(const e of entries.filter(e=>e.kind==='walk'||e.direction!=='reference')){
  const m=json(resolve(e.destination,'manifest.json')),key=e.character+'/'+e.action;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);
 }
 for(const [key,views] of groups){
  assert.equal(views.length,8,key);
  assert.equal(new Set(views.map(m=>m.registration.targetBodyHeight)).size,1,key);
  assert.ok(views.every(m=>m.registration.targetBodyHeight>0&&m.registration.scaleScope==='directional-body-height'),key);
 }
});

test('reviewed gait assemblies preserve traceable, distinct authored source poses',()=>{
 for(const [name,direction] of [...['Borrin','Cook','Elder','Ginger','Helga'].map(name=>[name,'front']),['Blacksmith','right'],['Blacksmith','back-right'],['Ginger','back-right'],['Laborer','back-left'],['Elder','back']]){
  const folder=resolve('public/sprites',name,'motion/walk',direction),path=resolve(folder,'assembly.json');
  const assembly=json(path),settings=json(resolve(folder,'motion-polish.json'));
  assert.equal(settings.assemblySha256,hash(path),'rebuild sheet after changing selected poses');
  assert.equal(assembly.poses.length,8);
  assert.equal(new Set(assembly.poses.map(p=>`${p.input}:${p.pose}`)).size,8);
  for(const source of assembly.inputs){
   assert.equal(source.sha256,hash(resolve(folder,source.file)));
   if(source.reference)assert.equal(source.referenceSha256,hash(resolve(folder,source.reference)));
   for(const field of ['originalPoseReference','secondaryReference'])if(source[field])assert.equal(source[`${field}Sha256`],hash(resolve(folder,source[field])));
  }
  for(const pose of assembly.poses){
   const source=assembly.inputs.find(s=>s.id===pose.input);assert.ok(source);
   assert.ok(Number.isInteger(pose.pose)&&pose.pose>=0&&pose.pose<source.poseCount);
  }
 }
});

test('runtime actor layers and persistent stations retain source provenance and calibration',()=>{
 for(const entry of json('docs/runtime-motion-layers.json').entries){
  const root=resolve(entry.destination),m=json(resolve(root,'manifest.json')),assembly=json(resolve(root,'assembly.json'));
  assert.equal(hash(resolve(root,'source-sheet.png')),m.sourceSha256);
  assert.equal(json(resolve(root,'motion-polish.json')).assemblySha256,hash(resolve(root,'assembly.json')));
  for(const input of assembly.inputs){assert.equal(hash(resolve(root,input.file)),input.sha256);assert.equal(hash(resolve(root,input.reference)),input.referenceSha256);}
  const placement=json(`public/sprites/${entry.character}/motion/render-calibration.json`).actions[`${entry.action}/${entry.direction}`];
  assert.equal(placement.sourceSha256,m.sourceSha256);assert.equal(placement.foregroundPolygons.length,8);
  assert.equal(m.frames.length,8);assert.equal(m.playback.loopApproved,entry.character!=='Laborer');
  assert.equal(Boolean(m.playback.taskApproved),entry.character==='Laborer');
  if(m.playback.loopApproved){const approval=json(resolve(root,'loop-approval.json'));assert.equal(approval.binding.sourceSha256,m.sourceSha256);for(const dependency of approval.dependencies)assert.equal(hash(resolve(root,dependency.file)),dependency.sha256);}
  if(m.playback.taskApproved){const approval=json(resolve(root,'task-approval.json'));assert.equal(approval.binding.sourceSha256,m.sourceSha256);assert.equal(m.playback.mode,'once-hold');for(const dependency of approval.dependencies)assert.equal(hash(resolve(root,dependency.file)),dependency.sha256);}
  for(const f of m.frames)assert.deepEqual(png(resolve(root,f.file)),[640,640,6]);
 }
 for(const id of ['cutting-block','anvil','forestry-trunk','storage-pallet','ledger-desk','masonry-bench','weighing-table']) {
 const root=resolve('public/sprites/workstations',id),g=json(resolve(root,'generation.json'));
 assert.equal(hash(resolve(root,'source.png')),g.sourceSha256);assert.equal(hash(resolve(root,'sprite.png')),g.spriteSha256);
 assert.equal(hash(resolve(root,g.reference)),g.referenceSha256);assert.deepEqual(png(resolve(root,'sprite.png')),[640,640,6]);
 if(g.completionLayer){assert.equal(hash(resolve(root,g.completionLayer.source)),g.completionLayer.sourceSha256);assert.equal(hash(resolve(root,g.completionLayer.file)),g.completionLayer.sha256);}
 }
});

test('additional work actions require exact actor, station and finite task evidence',()=>{
 const additions=json('docs/runtime-motion-additions.json').entries;
 assert.deepEqual(additions.map(e=>e.action),['inspect-tool','repair-pickaxe-handle','peel-potatoes','count-coins','build-barrel']);
 for(const entry of additions){
  const root=resolve(entry.destination),m=json(resolve(root,'manifest.json'));
  assert.equal(m.playback.mode,'once-hold');assert.equal(m.playback.taskApproved,true);
  assert.equal(m.playback.loopApproved,false);assert.equal(m.productionReady,false);
  const a=json(resolve(root,'task-approval.json'));
  assert.equal(a.binding.sourceSha256,hash(resolve(root,'source-sheet.png')));
  assert.deepEqual(a.binding.frameSha256,m.frames.map(f=>hash(resolve(root,f.file))));
  assert.equal(a.binding.atlasSha256,hash(resolve(root,m.atlas.file)));
  for(const dependency of a.dependencies)assert.equal(hash(resolve(root,dependency.file)),dependency.sha256);
  const assembly=json(resolve(root,'assembly.json'));
  assert.equal(json(resolve(root,'motion-polish.json')).assemblySha256,hash(resolve(root,'assembly.json')));
  for(const input of assembly.inputs){
   assert.equal(hash(resolve(root,input.file)),input.sha256);
   if(input.reference)assert.equal(hash(resolve(root,input.reference)),input.referenceSha256);
  }
  assert.equal(new Set(m.frames.map(f=>hash(resolve(root,f.file)))).size,8);
  const placement=json(`public/sprites/${entry.character}/motion/render-calibration.json`).actions[entry.action+'/actor'];
  assert.equal(placement.sourceSha256,m.sourceSha256);assert.equal(placement.foregroundPolygons.length,8);
  const stationRoot=resolve('public/sprites/workstations',entry.station),station=json(resolve(stationRoot,'generation.json'));
  assert.equal(hash(resolve(stationRoot,'source.png')),station.sourceSha256);
  assert.equal(hash(resolve(stationRoot,'sprite.png')),station.spriteSha256);
 }
});

test('log contact review binds all views and accepts only visible rear occlusion',()=>{
 const review=json('docs/helga-log-contact-review.json');assert.equal(review.entries.length,8);assert.equal(review.loopApproved,false);
 for(const entry of review.entries){
  const root=resolve(entry.folder),m=json(resolve(root,'manifest.json'));
  assert.deepEqual(entry.binding,{sourceSha256:hash(resolve(root,'source-sheet.png')),settingsSha256:m.registration.settingsSha256,frameSha256:m.frames.map(f=>hash(resolve(root,f.file))),durationsMs:m.frames.map(f=>f.durationMs)});
  assert.deepEqual(entry.reviewedFrames,[0,1,2,3,4,5,6,7]);
 }
 const rear=review.entries.find(e=>e.direction==='back-left');assert.equal(rear.visibleContact,'accepted-visible-occlusion');
 assert.match(review.occlusionReview.scope,/No hidden-anatomy/);
});

test('Borrin foreground contours keep his vest off the open ledger',()=>{
 const c=json('public/sprites/Borrin/motion/render-calibration.json').actions['desk-writing/actor'];
 function contains(poly,[x,y]) {
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
   const [a,b]=poly[i],[d,e]=poly[j];
   if(((b>y)!==(e>y))&&x<(d-a)*(y-b)/(e-b)+a)inside=!inside;
  }
  return inside;
 }
 for(const polygons of c.foregroundPolygons){
  assert.equal(polygons.some(p=>contains(p,[260,330])),false,'vest behind quill must not cover paper');
  assert.equal(polygons.some(p=>contains(p,[360,370])),false,'pants below hand stay behind desk');
  assert.equal(polygons.some(p=>contains(p,[430,340])),true,'resting hand remains above paper');
 }
});
