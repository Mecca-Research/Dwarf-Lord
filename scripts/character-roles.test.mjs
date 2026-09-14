import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
function compile(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  new Function('exports', 'require', outputText)(exports, (id) => {
    assert.ok(id in dependencies, `Unexpected dependency ${id}`);
    return dependencies[id];
  });
  return exports;
}
const appearances = compile('../src/game/world/dwarf-appearances.ts');
const catalog = compile('../src/game/data/catalog.ts', { '@/lib/asset': { asset: (p) => p }, '../world/dwarf-appearances': appearances });
const sim = compile('../src/game/sim.ts', { './data/catalog': catalog });
test('Elder and Borrin have separate roles without increasing worker payroll or capability', () => {
  const { STARTING_DWARVES: dwarves, TOTAL_CAPABILITY } = catalog;
  assert.equal(dwarves.filter(d => d.id === 'elder').length, 1);
  assert.equal(sim.workers(dwarves).length, 16);
  assert.equal(TOTAL_CAPABILITY, 82);
  assert.ok(!sim.workers(dwarves).some(d => ['borrin', 'elder'].includes(d.id)));
  assert.equal(dwarves.find(d => d.id === 'elder').talkKey, 'elder');
  assert.equal(dwarves.find(d => d.id === 'borrin').title, 'Senior Manager & Consultant');
});
test('direct job resolution rejects narrative and steward assignments', () => {
  const crew = catalog.STARTING_DWARVES.filter(d => ['elder', 'borrin'].includes(d.id));
  const job = catalog.JOBS[0].id;
  const result = sim.resolveJobs(crew, { elder: job, borrin: job }, 1);
  assert.ok(result.dwarves.every(d => d.assignedJobId === null));
  assert.equal(sim.assignedCap(crew.map(d => ({ ...d, assignedJobId: job }))), 0);
});

const saves = compile('../src/game/save.ts', { './data/catalog': catalog });
test('legacy character upgrade is repeatable and preserves worker progression', () => {
  const legacy = catalog.STARTING_DWARVES.filter(d => d.id !== 'elder').map(d => ({ ...d, experience: 321, energy: .23 }));
  const once = saves.reconcileCharacterIdentities(legacy);
  const twice = saves.reconcileCharacterIdentities(once);
  assert.deepEqual(twice, once);
  assert.equal(twice.filter(d => d.id === 'elder').length, 1);
  assert.equal(twice.find(d => d.id === 'helga').experience, 321);
  assert.equal(twice.find(d => d.id === 'helga').energy, .23);
  assert.deepEqual(legacy.map(d => d.id), once.filter(d => d.id !== 'elder').map(d => d.id));
});
