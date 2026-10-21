import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const { outputText } = ts.transpileModule(readFileSync('src/game/world/workstation-completion.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const exports = {};
new Function('exports', outputText)(exports);
const { WorkstationTaskStates } = exports;

test('completion subscriptions publish new actor ownership before another frame is needed', () => {
  const states = new WorkstationTaskStates(), visible = [];
  const stop = states.subscribe('dough', state => visible.push(Boolean(state?.completed && !state.active)));
  states.set('dough', { owner: 'cook', task: '3', active: true, completed: false });
  states.set('dough', { owner: 'cook', task: '3', active: true, completed: true });
  states.set('dough', { owner: 'cook', task: '3', active: false, completed: true });
  assert.equal(visible.at(-1), true, 'departure immediately exposes finished workpiece');
  states.set('dough', { owner: 'new-cook', task: '4', active: true, completed: false });
  assert.equal(visible.at(-1), false, 'a later-mounted actor hides it immediately');
  assert.deepEqual(visible, [false, false, false, true, false]);
  stop();
});

test('a later-mounted prop receives the current finish and releases its subscription', () => {
  const states = new WorkstationTaskStates(), seen = [];
  states.set('pallet', { owner: 'laborer', task: '1', active: false, completed: true });
  const stop = states.subscribe('pallet', state => seen.push(state));
  assert.equal(seen[0].completed, true);
  stop();
  states.delete('pallet');
  assert.equal(seen.length, 1, 'unmounted prop receives no stale update');
});

test('station subscriptions stay separate and world cleanup hides every retained workpiece', () => {
  const states = new WorkstationTaskStates(), dough = [], crates = [];
  states.subscribe('dough', state => dough.push(state));
  states.subscribe('pallet', state => crates.push(state));
  states.set('dough', { owner: 'cook', task: '3', active: false, completed: true });
  assert.equal(crates.length, 1, 'another station receives no ownership event');
  states.set('pallet', { owner: 'laborer', task: '1', active: false, completed: true });
  states.clear();
  assert.equal(states.size, 0);
  assert.equal(dough.at(-1), undefined);
  assert.equal(crates.at(-1), undefined);
});
