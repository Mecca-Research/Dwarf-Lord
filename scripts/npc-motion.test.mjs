import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';
const source = readFileSync(new URL('../src/game/world/npc-motion.ts', import.meta.url), 'utf8');
const moduleUrl = new URL('../public/motion-playback.mjs', import.meta.url).href;
let { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
outputText = outputText.replace('from "../motion-playback"', `from ${JSON.stringify(moduleUrl)}`).replace('from "three"', `from ${JSON.stringify(import.meta.resolve('three'))}`)
  .replace('import { asset } from "@/lib/asset";', `const asset = p => p === '/motion-playback.mjs' ? ${JSON.stringify(moduleUrl)} : 'https://motion.test'+p;`);
const { NpcWalkMotion, NpcWorkMotion, setMotionUv, npcMotionDiagnostics, npcWorkDiagnostics } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

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
    const phase = npcMotionDiagnostics.get('a').phase; assert.equal(phase, 2);
    a.update(body, 2, .5); assert.equal(npcMotionDiagnostics.get('a').phase, phase, 'blocked feet freeze');
    body.facing = 3; a.update(body, 2, .5);
    body.x += .15; a.update(body, 2, .5);
    assert.ok(Math.abs(npcMotionDiagnostics.get('a').phase - (phase + 1)) < 1e-10, 'travel continues during atlas load');
    await ready(a);
    const turnedPhase = npcMotionDiagnostics.get('a').phase;
    assert.ok(Math.abs(turnedPhase - (phase + 1)) < 1e-10, 'loaded direction retains travel phase');
    body.x = 100; a.update(body, 2, .5); assert.equal(npcMotionDiagnostics.get('a').phase, turnedPhase, 'teleport is not a stride');
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
  const manifest = JSON.parse(readFileSync('public/sprites/Cook/motion/chop-vegetables/reference/manifest.json', 'utf8'));
  const calibration = JSON.parse(readFileSync('public/sprites/Cook/motion/render-calibration.json', 'utf8'));
  assert.equal(calibration.actions['chop-vegetables'].sourceSha256, manifest.sourceSha256);
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
    assert.ok(Math.abs(first.placement.height - 1.95*640/540) < 1e-10);
    update(0); assert.equal(npcWorkDiagnostics.get('cook-test').frame,0,'pause freezes work');
    for(let i=0;i<40;i++)update();
    assert.deepEqual(npcWorkDiagnostics.get('cook-test'), {action:'chop-vegetables',direction:'reference',frame:7,completed:true,completions:1});
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
    async function toolReady() {
      for(let i=0;i<50;i++) { const r=miner.update(minerBody,'limestone',1,false,0,1.95); if(r)return r; await new Promise(r=>setTimeout(r,1)); }
      throw new Error('tool atlas failed to load');
    }
    try {
      const tool=await toolReady();assert.ok(Math.abs(tool.placement.height-1.95*640/340)<1e-10);
      miner.update(minerBody,'limestone',1,false,100,1.95);
      assert.equal(npcWorkDiagnostics.get('miner-test').completed,true);
      minerBody.facing=4;await toolReady();
      assert.equal(npcWorkDiagnostics.get('miner-test').completed,true,'camera turn preserves completed tool state');
      assert.equal(npcWorkDiagnostics.get('miner-test').completions,1);
    } finally {miner.dispose();}
    for (const [appearance,character,action,job,height] of [
      ['laborer','Laborer','stack-crates','storage',510], ['ginger','Ginger','fell-tree','timber',380],
    ]) {
      const work = JSON.parse(readFileSync(`public/sprites/${character}/motion/${action}/reference/manifest.json`,'utf8'));
      const placement = JSON.parse(readFileSync(`public/sprites/${character}/motion/render-calibration.json`,'utf8'));
      assert.equal(placement.actions[action].sourceSha256,work.sourceSha256);
      globalThis.fetch = async url => ({ok:true,json:async()=>String(url).endsWith('render-calibration.json')?placement:work,blob:async()=>new Blob()});
      const worker=new NpcWorkMotion(character,appearance), workerBody={...body,anim:'work'};
      try {
        let result;
        for(let i=0;i<50&&!result;i++){result=worker.update(workerBody,job,1,false,0,1.95);await new Promise(r=>setTimeout(r,1));}
        assert.ok(result,`${character} workstation loaded`);
        assert.ok(Math.abs(result.placement.height-1.95*640/height)<1e-10);
        worker.update(workerBody,job,1,false,100,1.95);
        assert.equal(npcWorkDiagnostics.get(character).completions,1);
        assert.equal(worker.update(workerBody,null,1,false,1,1.95),null);
        assert.equal(npcWorkDiagnostics.has(character),false);
      } finally {worker.dispose();}
    }
  } finally {
    driver.dispose();
    for (const [key,value] of Object.entries(saved)) { if(value===undefined)delete globalThis[key];else globalThis[key]=value; }
  }
});
