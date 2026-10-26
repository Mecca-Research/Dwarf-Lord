import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function load(path, dependencies = {}) {
  const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  new Function('exports', 'require', outputText)(exports, id => {
    assert.ok(id in dependencies, `Unexpected dependency ${id}`);
    return dependencies[id];
  });
  return exports;
}
const landscape = load('src/game/world/landscape.ts');
const { resolveMove, groundHeight, zoneAt } = load('src/game/runtime.ts', {
  './world/landscape': landscape,
});

function travel(start, destination) {
  let p = { ...start };
  const trace = [p];
  for (let step = 0; step < 14000; step++) {
    if (Math.hypot(p.x - destination.x, p.z - destination.z) < 0.35) return trace;
    const target = landscape.navigationTarget(p.x, p.z, destination);
    const dx = target.x - p.x, dz = target.z - p.z;
    const length = Math.hypot(dx, dz);
    p = resolveMove(p.x, p.z, dx / length * 0.045, dz / length * 0.045, 0.45);
    assert.ok(Number.isFinite(groundHeight(p.x, p.z)));
    if (step % 10 === 0) trace.push(p);
  }
  assert.fail(`Route stuck at ${JSON.stringify(p)} toward ${JSON.stringify(destination)}`);
}
const camp = { x: -5, z: 4 };
const jobs = [{ x: 8, z: -38 }, { x: 10, z: -46 }, { x: 14, z: -32 }];

test('existing mining jobs sit on the first chamber floor', () => {
  for (const p of jobs) {
    assert.equal(zoneAt(p.x, p.z), 'mine');
    assert.equal(groundHeight(p.x, p.z), 0);
    assert.equal(landscape.walkable(p.x, p.z, 0.55), true);
  }
});

test('camp routes reach each mining job through the physical mouth and return', () => {
  for (const job of jobs) {
    for (const route of [travel(camp, job), travel(job, camp)]) {
      assert.ok(route.some(p => p.z < -24 && p.z > -27 && Math.abs(p.x - 8) < 1.4));
    }
  }
});

test('forestry routes cross the creek on the timber bridge in both directions', () => {
  const forest = { x: -42, z: 18 };
  for (const route of [travel(camp, forest), travel(forest, camp)]) {
    const crossing = route.find(p => Math.abs(p.x - landscape.creekX(p.z)) < 0.5);
    assert.ok(crossing);
    assert.ok(Math.abs(crossing.z - 11) < 1.8);
    assert.equal(groundHeight(crossing.x, crossing.z), 0);
    assert.ok(landscape.surfaceHeight(crossing.x, crossing.z) < -0.5);
  }
});

test('cliffs, creek banks and unexcavated rock bound the playable area', () => {
  for (const [x, z] of [[40, -42], [-30, -55], [0, -100], [-63, 12], [32, 10], [landscape.creekX(20), 20]]) {
    assert.equal(landscape.walkable(x, z, 0.45), false);
  }
  assert.equal(landscape.walkable(NaN, 0), false);
  assert.equal(landscape.walkable(4, -27, 0.45), false, 'the cliff is solid beside the real mouth');
  assert.deepEqual(resolveMove(5, -91.15, 0, -0.8), { x: 5, z: -91.15 });
});

test('workstation foundations stay level while the landscape rises into alpine peaks', () => {
  for (const [x, z] of [[-11, -5], [10, -7], [12.5, 1.5], [17, 8], [10, 10], [-0.5, 4.5], [6, -7], [-42, 18], [-36, 18]]) {
    assert.equal(groundHeight(x, z), 0, `${x},${z}`);
  }
  for (let x = -110; x <= 110; x += 5) {
    for (let z = -140; z <= 80; z += 5) assert.ok(Number.isFinite(landscape.surfaceHeight(x, z)));
  }
  assert.ok(landscape.surfaceHeight(7, -91) > 70);
});

test('the larger first mine has reachable deep working space and a mountain-scale crest', () => {
  const deep = {x:5,z:-82};travel(camp,deep);travel(deep,camp);
  assert.ok(landscape.surfaceHeight(13,-114)>130);
  assert.ok(landscape.cliffHeight(8)>12);
});
