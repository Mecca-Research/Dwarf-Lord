import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createStore } from 'zustand/vanilla';
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

const appearances = load('src/game/world/dwarf-appearances.ts');
const catalog = load('src/game/data/catalog.ts', {
  '../world/dwarf-appearances': appearances, '@/lib/asset': { asset: p => p },
});
const activities = load('src/game/world/work-activities.ts', { '../data/catalog': catalog });
const stations = load('src/game/world/workstation-sites.ts', {
  '../data/catalog': catalog, './work-activities': activities,
});
const runtimeModule = load('src/game/runtime.ts');
const sim = load('src/game/sim.ts', { './data/catalog': catalog });
const { useGame } = load('src/game/store.ts', {
  zustand: { create: createStore }, './data/catalog': catalog,
  './data/dialogue': { DIALOGUE: {} }, './runtime': runtimeModule,
  './world/dwarf-appearances': appearances, './world/workstation-sites': stations,
  './save': { clearSave() {}, readSave: () => null, writeSave() {}, reconcileCharacterIdentities: v => v },
  './sim': sim, './audio': { sting() {} },
});

test('job assignment immediately routes to the selected daily physical workstation', () => {
  const { runtime } = runtimeModule;
  for (const [id, day, job, station] of [
    ['kori', 1, 'meals', 'cutting-block'], ['kori', 2, 'meals', 'potato-block'],
    ['kori', 3, 'meals', 'dough-block'], ['kori', 4, 'meals', 'cutting-block'],
    ['grit', 3, 'forge', 'repair-bench'], ['brokk', 2, 'timber', 'cooper-barrel'],
  ]) {
    useGame.setState({ day, dayResolved: false, dwarves: catalog.STARTING_DWARVES.map(d => ({ ...d, assignedJobId: null })) });
    const body = { x: -20, z: 4, dest: null, speed: 2, anim: 'walk' };
    runtime.dwarves.set(id, body);
    useGame.getState().assignJob(id, job);
    const target = stations.workstationSites.find(site => site.id === station).target;
    assert.deepEqual(body.dest, { x: target.targetX, z: target.targetZ }, `${id}/day${day} must approach its rendered station`);
    assert.equal(useGame.getState().dwarves.find(d => d.id === id).assignedJobId, job);
    assert.equal(body.anim, catalog.STARTING_DWARVES.find(d => d.id === id).sitOnStart ? 'sit' : 'idle');
    assert.equal(body.speed, 0);
    useGame.getState().assignJob(id, null);
    assert.equal(body.dest, null, 'cancellation releases the route');
  }
});

test('station routing preserves invalid-job, completed-day and consultant assignment guards', () => {
  const { runtime } = runtimeModule;
  useGame.setState({ day: 3, dayResolved: false, dwarves: catalog.STARTING_DWARVES.map(d => ({ ...d, assignedJobId: null })) });
  for (const [id, job, resolved] of [['kori', 'missing', false], ['kori', 'meals', true], ['borrin', 'meals', false], ['elder', 'forge', false]]) {
    useGame.setState({ dayResolved: resolved });
    const body = { dest: { x: 21, z: 22 }, speed: 1, anim: 'walk' };
    runtime.dwarves.set(id, body);
    useGame.getState().assignJob(id, job);
    assert.deepEqual(body, { dest: { x: 21, z: 22 }, speed: 1, anim: 'walk' });
    assert.equal(useGame.getState().dwarves.find(d => d.id === id).assignedJobId, null);
  }
});
