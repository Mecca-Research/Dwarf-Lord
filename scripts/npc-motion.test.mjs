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
const { NpcWalkMotion, setMotionUv, npcMotionDiagnostics } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

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
    body.facing = 3; a.update(body, 2, .5); await ready(a);
    assert.equal(npcMotionDiagnostics.get('a').phase, phase, 'turn does not restart gait');
    body.x = 100; a.update(body, 2, .5); assert.equal(npcMotionDiagnostics.get('a').phase, phase, 'teleport is not a stride');
    body.anim = 'idle'; assert.equal(a.update(body, 2, .5), null); assert.equal(npcMotionDiagnostics.has('a'), false);
    body.anim = 'walk'; a.update(body, 2, .5); assert.equal(npcMotionDiagnostics.get('a').phase, 0, 'new walk starts at contact');
    const cancelled = new NpcWalkMotion('cancelled', 'laborer'); cancelled.update(body, 2); cancelled.dispose();
    await new Promise(r => setTimeout(r, 0)); assert.equal(npcMotionDiagnostics.has('cancelled'), false);
  } finally {
    a.dispose(); b.dispose();
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
});
