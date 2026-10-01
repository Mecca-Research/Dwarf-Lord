import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';
const source = readFileSync(new URL('../src/game/world/npc-motion.ts', import.meta.url), 'utf8');
const moduleUrl = new URL('../public/motion-playback.mjs', import.meta.url).href;
function loadCommonJs(path, dependencies = {}) {
  const {outputText} = ts.transpileModule(readFileSync(path,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}});
  const exports={};new Function('exports','require',outputText)(exports,id=>{assert.ok(id in dependencies,id);return dependencies[id]});return exports;
}
const appearances=loadCommonJs('src/game/world/dwarf-appearances.ts');
const catalog=loadCommonJs('src/game/data/catalog.ts', {'../world/dwarf-appearances':appearances,'@/lib/asset':{asset:p=>p}});
let stationSource=ts.transpileModule(readFileSync('src/game/world/workstation-sites.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
stationSource=stationSource.replace('import { JOBS, STARTING_DWARVES } from "../data/catalog";',`const JOBS=${JSON.stringify(catalog.JOBS)},STARTING_DWARVES=${JSON.stringify(catalog.STARTING_DWARVES)};`);
const stationUrl=`data:text/javascript;base64,${Buffer.from(stationSource).toString('base64')}`;
let activitySource=ts.transpileModule(readFileSync('src/game/world/work-activities.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
activitySource=activitySource.replace('import { STARTING_DWARVES } from "../data/catalog";', `const STARTING_DWARVES=${JSON.stringify(catalog.STARTING_DWARVES)};`);
const activityUrl=`data:text/javascript;base64,${Buffer.from(activitySource).toString('base64')}`;
let { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
outputText = outputText.replace('from "./work-activities"', `from ${JSON.stringify(activityUrl)}`).replace('from "./workstation-sites"', `from ${JSON.stringify(stationUrl)}`).replace('from "../motion-playback"', `from ${JSON.stringify(moduleUrl)}`).replace('from "three"', `from ${JSON.stringify(import.meta.resolve('three'))}`)
  .replace('import { asset } from "@/lib/asset";', `const asset = p => p === '/motion-playback.mjs' ? ${JSON.stringify(moduleUrl)} : 'https://motion.test'+p;`);
const { NpcWalkMotion, NpcWorkMotion, setMotionUv, motionForegroundGeometry, motionRootTranslation, npcMotionDiagnostics, npcWorkDiagnostics, workstationTaskStates } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('atlas UVs select one cell per actor and restore canonical full-image UVs', () => {
  const a = new THREE.PlaneGeometry(), b = new THREE.PlaneGeometry();
  setMotionUv(a, 5);
  assert.deepEqual([...a.getAttribute('uv').array], [.25, .5, .5, .5, .25, 0, .5, 0]);
  assert.deepEqual([...b.getAttribute('uv').array], [0, 1, 1, 1, 0, 0, 1, 0]);
  setMotionUv(a, null); assert.deepEqual([...a.getAttribute('uv').array], [...b.getAttribute('uv').array]);
  a.dispose(); b.dispose();
});

test('NPC driver shares atlases, preserves turns, freezes collisions and respects world scale', async () => {
  const saved = { fetch: globalThis.fetch, location: globalThis.location, document: globalThis.document, createImageBitmap: globalThis.createImageBitmap };
  const requests = [], draws = []; let closed = 0;
  const manifest = { character: 'Laborer', kind: 'walk', action: 'walk', frames: Array.from({ length: 8 }, () => ({ durationMs: 125 })),
    frameSize: [640, 640], registration: { targetBodyHeight: 520, targetAnchor: [320, 616] }, atlas: { file: 'atlas.png' } };
  globalThis.location = { href: 'https://motion.test/' };
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage: (...args) => draws.push(args) }) }) };
  globalThis.createImageBitmap = async () => ({ width: 5120, height: 640, close: () => closed++ });
  globalThis.fetch = async url => { requests.push(String(url)); return { ok: true, json: async () => manifest, blob: async () => new Blob() }; };
  const a = new NpcWalkMotion('a', 'laborer'), b = new NpcWalkMotion('b', 'laborer');
  const body = { x: 0, z: 0, facing: 0, anim: 'walk', speed: 2.4 };
  async function ready(driver) {
    for (let i = 0; i < 50; i++) { const result = driver.update(body, 2, .5); if (result) return result; await new Promise(r => setTimeout(r, 5)); }
    throw new Error('atlas did not load');
  }
  try {
    a.update(body, 2, .5); b.update(body, 2, .5);
    const first = await ready(a), second = await ready(b);
    assert.equal(first.texture, second.texture); assert.equal(requests.length, 2);
    assert.equal(first.texture.image.width, 1280); assert.equal(first.texture.image.height, 640);
    assert.equal(draws.length, 8); assert.equal(closed, 1);
    body.x = .3; a.update(body, 2, .5);
    let phase = npcMotionDiagnostics.get('a').phase; assert.equal(phase, 2);
    const planted = npcMotionDiagnostics.get('a').visualRoot;
    for (let step = 0; step < 3; step++) {
      body.x += .01;
      const pose = a.update(body, 2, .5);
      assert.equal(pose.frame, 2);
      assert.deepEqual(npcMotionDiagnostics.get('a').visualRoot, planted, 'held pose does not slide with the physical root');
      assert.ok(Math.abs(body.x + pose.rootOffset[0] - planted[0]) < 1e-10);
    }
    phase = npcMotionDiagnostics.get('a').phase;
    a.update(body, 2, .5); assert.equal(npcMotionDiagnostics.get('a').phase, phase, 'blocked feet freeze');
    body.facing = 3; a.update(body, 2, .5);
    body.x += .15; a.update(body, 2, .5);
    assert.ok(Math.abs(npcMotionDiagnostics.get('a').phase - (phase + 1)) < 1e-10, 'travel continues during atlas load');
    await ready(a);
    const turnedPhase = npcMotionDiagnostics.get('a').phase;
    assert.ok(Math.abs(turnedPhase - (phase + 1)) < 1e-10, 'loaded direction retains travel phase');
    body.x = 100; const teleported = a.update(body, 2, .5); assert.equal(npcMotionDiagnostics.get('a').phase, turnedPhase, 'teleport is not a stride');
    assert.deepEqual(teleported.rootOffset,[0,0],'teleport releases the old visual plant');
    body.anim = 'idle'; assert.equal(a.update(body, 2, .5), null); assert.equal(npcMotionDiagnostics.has('a'), false);
    body.anim = 'walk'; a.update(body, 2, .5); assert.equal(npcMotionDiagnostics.get('a').phase, 0, 'new walk starts at contact');
    const cancelled = new NpcWalkMotion('cancelled', 'laborer'); cancelled.update(body, 2); cancelled.dispose();
    await new Promise(r => setTimeout(r, 0)); assert.equal(npcMotionDiagnostics.has('cancelled'), false);
  } finally {
    a.dispose(); b.dispose();
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
});


test('workstations hold one completion and reset only on task lifecycle changes', async () => {
  const saved = { fetch: globalThis.fetch, location: globalThis.location, document: globalThis.document, createImageBitmap: globalThis.createImageBitmap };
  const manifest = JSON.parse(readFileSync('public/sprites/Cook/motion/chop-vegetables/actor/manifest.json', 'utf8'));
  const calibration = JSON.parse(readFileSync('public/sprites/Cook/motion/render-calibration.json', 'utf8'));
  assert.equal(calibration.actions['chop-vegetables/actor'].sourceSha256, manifest.sourceSha256);
  globalThis.location = { href: 'https://motion.test/' };
  globalThis.document = { createElement: () => ({ getContext: () => ({ drawImage() {} }) }) };
  globalThis.createImageBitmap = async () => ({ width: 5120, height: 640, close() {} });
  globalThis.fetch = async url => ({ ok: true, json: async () => String(url).endsWith('render-calibration.json') ? calibration : manifest, blob: async () => new Blob() });
  const driver = new NpcWorkMotion('cook-test', 'cook');
  const body = { x: 0, z: 0, facing: 0, anim: 'work' };
  const update = (dt = .1, job = 'meals', day = 1, resolved = false) => driver.update(body, job, day, resolved, dt, 1.95);
  const ready = async (day = 1) => {
    for (let i=0; i<50; i++) { const r=update(0,'meals',day); if(r)return r; await new Promise(r=>setTimeout(r,1)); }
    throw new Error('work atlas failed to load');
  };
  try {
    const first = await ready();
    assert.ok(Math.abs(first.placement.height - 1.95*640/520) < 1e-10);
    assert.equal(first.foregroundPolygons.length,2);
    update(0); assert.equal(npcWorkDiagnostics.get('cook-test').frame,0,'pause freezes work');
    for(let i=0;i<40;i++)update();
    assert.deepEqual(npcWorkDiagnostics.get('cook-test'), {action:'chop-vegetables',direction:'actor',frame:7,completed:true,completions:1});
    for(let i=0;i<40;i++)update();
    assert.equal(npcWorkDiagnostics.get('cook-test').completions,1,'holding never repeats');
    assert.equal(update(0,null),null); assert.equal(npcWorkDiagnostics.has('cook-test'),false);
    await ready(); assert.equal(npcWorkDiagnostics.get('cook-test').frame,0,'reassignment restarts');
    update(.1,'meals',1,true); assert.equal(npcWorkDiagnostics.has('cook-test'),false);
    await ready(2); assert.equal(npcWorkDiagnostics.get('cook-test').frame,0,'new day restarts');
    body.anim='walk'; assert.equal(update(),null,'travel releases workstation');
    const toolManifest = JSON.parse(readFileSync('public/sprites/Female Miner/motion/pickaxe-swing/front/manifest.json', 'utf8'));
    globalThis.fetch = async () => ({ ok:true, json:async()=>toolManifest, blob:async()=>new Blob() });
    const miner = new NpcWorkMotion('miner-test','femaleMiner');
    const minerBody = {...body,anim:'work'};
    async function toolReady(job = "limestone") {
      for(let i=0;i<50;i++) { const r=miner.update(minerBody,job,1,false,0,1.95); if(r)return r; await new Promise(r=>setTimeout(r,1)); }
      throw new Error('tool atlas failed to load');
    }
    try {
      const tool=await toolReady();assert.ok(Math.abs(tool.placement.height-1.95*640/340)<1e-10);
      miner.update(minerBody,'limestone',1,false,100,1.95);
      assert.equal(npcWorkDiagnostics.get('miner-test').completed,true);
      minerBody.facing=4;await toolReady();
      assert.equal(npcWorkDiagnostics.get('miner-test').completed,true,'camera turn preserves completed tool state');
      assert.equal(npcWorkDiagnostics.get('miner-test').completions,1);
      const shovel=JSON.parse(readFileSync('public/sprites/Female Miner/motion/shovel-cycle/back/manifest.json','utf8'));
      globalThis.fetch=async()=>({ok:true,json:async()=>shovel,blob:async()=>new Blob()});
      await toolReady('shaft2');
      assert.equal(npcWorkDiagnostics.get('miner-test').action,'shovel-cycle');
      assert.equal(npcWorkDiagnostics.get('miner-test').completed,false,'new task restarts tool work');
      miner.update(minerBody,'shaft2',1,false,100,1.95);
      assert.equal(npcWorkDiagnostics.get('miner-test').completions,1);

    } finally {miner.dispose();}
    for (const [appearance,character,action,job,height] of [
      ['blacksmith','Blacksmith','hammer-contact','forge',520],
      ['stoneworker','Stoneworker','chisel-contact','limestone',520],
      ['laborer','Laborer','stack-crates','storage',370], ['ginger','Ginger','fell-tree','timber',376],
    ]) {
      const direction = 'actor';
      const work = JSON.parse(readFileSync(`public/sprites/${character}/motion/${action}/${direction}/manifest.json`,'utf8'));
      const placement = JSON.parse(readFileSync(`public/sprites/${character}/motion/render-calibration.json`,'utf8'));
      assert.equal(placement.actions[direction==='actor'?`${action}/actor`:action].sourceSha256,work.sourceSha256);
      globalThis.fetch = async url => ({ok:true,json:async()=>String(url).endsWith('render-calibration.json')?placement:work,blob:async()=>new Blob()});
      const worker=new NpcWorkMotion(character,appearance), workerBody={...body,anim:'work'};
      try {
        let result;
        for(let i=0;i<50&&!result;i++){result=worker.update(workerBody,job,1,false,0,1.95);await new Promise(r=>setTimeout(r,1));}
        assert.ok(result,`${character} workstation loaded`);
        assert.equal(npcWorkDiagnostics.get(character).direction,direction);
        if(direction === 'actor') assert.deepEqual(result.foregroundPolygons,placement.actions[`${action}/actor`].foregroundPolygons[0]);
        assert.ok(Math.abs(result.placement.height-1.95*640/height)<1e-10);
        worker.update(workerBody,job,1,false,100,1.95);
        assert.equal(npcWorkDiagnostics.get(character).completions,1);
        assert.equal(worker.update(workerBody,null,1,false,1,1.95),null);
        assert.equal(npcWorkDiagnostics.has(character),false);
        if (appearance === 'laborer') {
          assert.equal(workstationTaskStates.get('storage-pallet').completed,true,'released crate survives actor departure');
          assert.equal(workstationTaskStates.get('storage-pallet').active,false);
          for(let i=0;i<50;i++) {
            if(worker.update(workerBody,job,2,false,0,1.95))break;
            await new Promise(r=>setTimeout(r,1));
          }
          assert.equal(workstationTaskStates.get('storage-pallet').completed,false,'explicit new task starts a fresh visual cycle');
          worker.update(workerBody,null,2,false,0,1.95);
          assert.equal(workstationTaskStates.get('storage-pallet').completed,false,'cancel before release does not create a crate');
          assert.equal(workstationTaskStates.get('storage-pallet').active,false);
        }
      } finally {worker.dispose();}
    }
  } finally {
    driver.dispose();
    for (const [key,value] of Object.entries(saved)) { if(value===undefined)delete globalThis[key];else globalThis[key]=value; }
  }
});

test('foreground contours preserve source pixels within the selected atlas frame', () => {
  for(const [character,action] of [['Cook','chop-vegetables'],['Blacksmith','hammer-contact']]) {
  const contours=JSON.parse(readFileSync(`public/sprites/${character}/motion/render-calibration.json`,'utf8')).actions[`${action}/actor`].foregroundPolygons;
  for(let frame=0;frame<8;frame++) {
    const geometry=motionForegroundGeometry(contours[frame],frame),position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
    assert.ok(geometry.index.count>0);
    for(let i=0;i<position.count;i++) {
      assert.ok(Math.abs(uv.getX(i)*4-frame%4-(position.getX(i)+.5))<1e-6);
      assert.ok(Math.abs((1-uv.getY(i))*2-Math.floor(frame/4)-(.5-position.getY(i)))<1e-6);
    }
    geometry.dispose();
  }
  }
});

test('Borrin reviews the ledger as a seated consultant without a production assignment', async () => {
  const saved={fetch:globalThis.fetch,location:globalThis.location,document:globalThis.document,createImageBitmap:globalThis.createImageBitmap};
  const manifest=JSON.parse(readFileSync('public/sprites/Borrin/motion/desk-writing/actor/manifest.json','utf8'));
  const calibration=JSON.parse(readFileSync('public/sprites/Borrin/motion/render-calibration.json','utf8'));
  globalThis.location={href:'https://motion.test/'};
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({drawImage(){}})})};
  globalThis.createImageBitmap=async()=>({width:5120,height:640,close(){}});
  globalThis.fetch=async url=>({ok:true,json:async()=>String(url).endsWith('render-calibration.json')?calibration:manifest,blob:async()=>new Blob()});
  const worker=new NpcWorkMotion('borrin-consultant-test','borrin'),body={x:10,z:10,facing:3,anim:'sit',speed:0};
  const update=(dt=0,day=1)=>worker.update(body,null,day,true,dt,1.95);
  async function ready(day=1){for(let i=0;i<50;i++){const pose=update(0,day);if(pose)return pose;await new Promise(r=>setTimeout(r,1));}throw new Error('consultant desk did not load');}
  try{
    const pose=await ready();assert.ok(Math.abs(pose.placement.height-1.95*640/650)<1e-10);
    update(0);assert.equal(npcWorkDiagnostics.get('borrin-consultant-test').frame,0,'dialogue pause keeps writing pose');
    update(10);update(10);assert.equal(npcWorkDiagnostics.get('borrin-consultant-test').completions,1,'completed desk action holds even after day resolution');
    body.anim='walk';assert.equal(update(),null,'walking releases the seated desk action');
    body.anim='sit';body.x=20;assert.equal(update(),null,'a seated consultant away from the desk cannot write at it');
    body.x=10;await ready(2);assert.equal(npcWorkDiagnostics.get('borrin-consultant-test').frame,0,'next day restarts the review');
    assert.equal(worker.update(body,'forge',2,false,0,1.95),null,'production assignment cannot activate consultant motion');
  }finally{worker.dispose();for(const[k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});

test('Quartermaster inspects weights once at his table and releases for travel or a job', async () => {
 const saved={fetch:globalThis.fetch,location:globalThis.location,document:globalThis.document,createImageBitmap:globalThis.createImageBitmap};
 const manifest=JSON.parse(readFileSync('public/sprites/Quartermaster/motion/check-weights/actor/manifest.json','utf8'));
 const calibration=JSON.parse(readFileSync('public/sprites/Quartermaster/motion/render-calibration.json','utf8'));
 globalThis.location={href:'https://motion.test/'};
 globalThis.document={createElement:()=>({getContext:()=>({drawImage(){}})})};
 globalThis.createImageBitmap=async()=>({width:5120,height:640,close(){}});
 globalThis.fetch=async url=>({ok:true,json:async()=>String(url).endsWith('render-calibration.json')?calibration:manifest,blob:async()=>new Blob()});
 const worker=new NpcWorkMotion('quartermaster-test','quartermaster'),body={x:-28,z:12,anim:'idle',facing:0,speed:0};
 const update=(dt=0,day=1,job=null)=>worker.update(body,job,day,true,dt,1.95);
 async function ready(day=1){for(let i=0;i<50;i++){const pose=update(0,day);if(pose)return pose;await new Promise(r=>setTimeout(r,1));}throw new Error('weighing actor did not load');}
 try {
  await ready();update(.14);const paused=npcWorkDiagnostics.get('quartermaster-test').frame;
  update(0);assert.equal(npcWorkDiagnostics.get('quartermaster-test').frame,paused);
  update(10);update(10);assert.equal(npcWorkDiagnostics.get('quartermaster-test').completions,1);
  assert.equal(update(0,1,'storage'),null,'production assignment releases passive action');
  await ready(2);assert.equal(npcWorkDiagnostics.get('quartermaster-test').frame,0);
  body.anim='walk';assert.equal(update(),null);
  body.anim='idle';body.x=-24;assert.equal(update(),null,'table work requires physical proximity');
 } finally {worker.dispose();for(const[k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v}}
});

test('visual ground correction survives every direction, parent scale and terrain height',()=>{
 for(let direction=0;direction<8;direction++)for(const scalar of [.5,1,2.3]){
  const yaw=direction*Math.PI/4,scale=new THREE.Vector3(scalar,scalar,scalar);
  const offset=[-.14,.09],heightDelta=.08;
  const local=new THREE.Vector3(...motionRootTranslation(offset,yaw,scale,heightDelta));
  const matrix=new THREE.Matrix4().compose(new THREE.Vector3(),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),scale);
  const world=local.applyMatrix4(matrix);
  assert.ok(world.distanceTo(new THREE.Vector3(offset[0],heightDelta,offset[1]))<1e-10,'parent rotation cannot turn foot lock into sideways drift');
 }
});

test('work-only specialists keep static walking fallback without requesting absent atlases',()=>{
 for(const appearance of ['stoneworker','quartermaster']){
 const id=`${appearance}-fallback`,driver=new NpcWalkMotion(id,appearance);
 try {
  assert.equal(driver.update({x:0,z:0,anim:'walk',facing:3,speed:2.4},1.95),null);
  assert.equal(npcMotionDiagnostics.has(id),false);
 } finally {driver.dispose();}
 }
});

test('Elder activity preloading holds the completed pose until the next action is ready and installs without an idle flash', async()=>{
 const saved={fetch:globalThis.fetch,location:globalThis.location,document:globalThis.document,createImageBitmap:globalThis.createImageBitmap};
 const calibration=JSON.parse(readFileSync('public/sprites/Elder/motion/render-calibration.json'));
 const home=catalog.STARTING_DWARVES.find(d=>d.id==='elder'),body={x:home.x,z:home.z,anim:'sit',facing:0,speed:0};
 let releaseNext;const nextGate=new Promise(resolve=>{releaseNext=resolve});
 globalThis.location={href:'https://motion.test/'};globalThis.document={createElement:()=>({getContext:()=>({drawImage(){}})})};
 globalThis.createImageBitmap=async()=>({width:5120,height:640,close(){}});
 globalThis.fetch=async url=>{
  const path=decodeURIComponent(new URL(url).pathname);
  if(path.endsWith('/eat-bread/reference/manifest.json'))await nextGate;
  return {ok:true,json:async()=>path.endsWith('/render-calibration.json')?calibration:JSON.parse(readFileSync('public'+path)),blob:async()=>new Blob()};
 };
 const worker=new NpcWorkMotion('elder-activity-test','elder');
 const update=(dt=0,day=1)=>worker.update(body,null,day,true,dt,1.95);
 try {
  let first;for(let i=0;i<50;i++){first=update();if(first)break;await new Promise(r=>setTimeout(r,1));}assert.ok(first);
  update(2);const last=update(10);assert.equal(last.frame,7);assert.equal(npcWorkDiagnostics.get('elder-activity-test').action,'eat-stew','a delayed next atlas cannot advance activity');
  assert.equal(update(0).texture,last.texture,'pause keeps displayed pose');
  releaseNext();await new Promise(r=>setTimeout(r,10));
  update(2);const next=update(0);assert.ok(next,'preloaded handoff cannot return an idle fallback');assert.equal(next.frame,0);
  assert.equal(npcWorkDiagnostics.get('elder-activity-test').action,'eat-bread');
  assert.equal(update(0,2).frame,0);assert.equal(npcWorkDiagnostics.get('elder-activity-test').action,'eat-stew','new day resets finite sequence');
  body.anim='walk';assert.equal(update(),null);assert.equal(npcWorkDiagnostics.has('elder-activity-test'),false);
 }finally{releaseNext();worker.dispose();await new Promise(r=>setTimeout(r,1));for(const[k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v}}
});
