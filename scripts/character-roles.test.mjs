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

test('forge assignment repairs the existing building through daily resolution', () => {
  const smith=catalog.STARTING_DWARVES.find(d=>d.id==='grit');
  const job=catalog.JOBS.find(j=>j.id==='forge');
  assert.equal(job.buildingId,'forge');assert.equal(job.skill,'craft');
  assert.ok(Math.hypot(job.targetX-10,job.targetZ+7)>3.55,'approach clears forge collision');
  const idle=sim.resolveJobs([smith],{},1),worked=sim.resolveJobs([smith],{grit:'forge'},1);
  assert.equal(idle.buildingRepair.forge,undefined);
  assert.ok(worked.buildingRepair.forge>0);
  assert.deepEqual(worked.inventoryDelta,{},'repair animation does not mint resource output');
});

const activities = compile('../src/game/world/work-activities.ts', { '../data/catalog': catalog });
const stations = compile('../src/game/world/workstation-sites.ts', { '../data/catalog': catalog, './work-activities': activities });
test('passive weighing requires Fenn at his home table without a job',()=>{
 const fenn=catalog.STARTING_DWARVES.find(d=>d.id==='fenn');
 const body={x:fenn.x,z:fenn.z,anim:'idle'};
 const site=stations.passiveWorkstation('quartermaster',null,body);
 assert.equal(site.id,'weighing-table');assert.equal(site.action,'check-weights');
 assert.deepEqual(site.target,{targetX:fenn.x,targetZ:fenn.z});
 assert.equal(stations.passiveWorkstation('quartermaster','storage',body),undefined);
 for(const anim of ['walk','work','talk','sleep','sit'])assert.equal(stations.passiveWorkstation('quartermaster',null,{...body,anim}),undefined);
 assert.equal(stations.passiveWorkstation('quartermaster',null,{...body,x:body.x+2}),undefined);
});
test('persistent workstation registration only captures its assigned working actor', () => {
  for(const [appearance,job,id] of [['cook','meals','cutting-block'],['blacksmith','forge','anvil'],['stoneworker','limestone','masonry-bench']]) {
    const station=stations.activeWorkstation(appearance,job,true,false);
    assert.equal(station.id,id);
    assert.equal(station.target,catalog.JOBS.find(j=>j.id===job));
    assert.equal(stations.activeWorkstation(appearance,job,false,false),undefined,'walking root stays mobile');
    assert.equal(stations.activeWorkstation(appearance,job,true,true),undefined,'resolved day releases root');
    assert.equal(stations.activeWorkstation(appearance,null,true,false),undefined,'cancel releases root');
    assert.equal(stations.activeWorkstation('laborer',job,true,false),undefined,'other characters are not snapped to station');
  }
});

test('Borrin has a persistent consultation desk without becoming a production worker',()=>{
 const site=stations.activeWorkstation('borrin',null,true,true);
 assert.equal(site.id,'ledger-desk');assert.equal(site.passive,true);
 const borrin=catalog.STARTING_DWARVES.find(d=>d.id==='borrin');
 assert.deepEqual(site.target,{targetX:borrin.x,targetZ:borrin.z});
 assert.equal(stations.activeWorkstation('borrin',null,false,false),undefined);
  assert.equal(stations.activeWorkstation('borrin','forge',true,false),undefined);
  for(const [day,action] of [[1,'desk-writing'],[2,'count-coins'],[3,'review-open-ledger'],[4,'explain-at-desk'],[5,'stamp-paperwork'],[6,'desk-writing']]) {
    assert.equal(activities.consultantWorkAction(day),action);
    assert.equal(stations.activeWorkstation('borrin',null,true,true,day).id,'ledger-desk');
  }
  for(const day of [0,-1,NaN,1.5,Infinity])assert.throws(()=>activities.consultantWorkAction(day));
});

test('forge operations route to their own station and retain completion boundaries',()=>{
 for(const [day,id,action] of [[1,'anvil','hammer-contact'],[2,'anvil','inspect-tool'],[3,'repair-bench','repair-pickaxe-handle'],[4,'anvil','anvil-ready'],[5,'anvil','hammer-raised'],[6,'anvil','hammer-contact']]) {
  assert.equal(activities.forgeWorkAction(day),action);
  const site=stations.activeWorkstation('blacksmith','forge',true,false,day);
  assert.equal(site.id,id);assert.ok(site.actions.includes(action));
  assert.equal(stations.workAssignmentTarget('blacksmith','forge',day),site.target,'routing and rendering share the task root');
  assert.ok(Math.hypot(site.target.targetX-10,site.target.targetZ+7)>3.55,'station clears forge collision');
  assert.equal(stations.activeWorkstation('blacksmith','forge',true,true,day),undefined);
  assert.equal(stations.activeWorkstation('blacksmith','forge',false,false,day),undefined);
 }
 assert.equal(stations.workAssignmentTarget('laborer','storage',3),catalog.JOBS.find(job=>job.id==='storage'));
 assert.equal(stations.workAssignmentTarget('laborer','missing-job',3),undefined);
});

test('meal operations share the task target with distinct persistent preparation blocks',()=>{
 for(const [day,id,action] of [[1,'cutting-block','chop-vegetables'],[2,'potato-block','peel-potatoes'],[3,'dough-block','knead-dough'],[4,'stew-cauldron','stir-cauldron'],[5,'mixing-block','mix-ingredients'],[6,'cutting-block','chop-vegetables']]) {
  assert.equal(activities.cookingWorkAction(day),action);
  const site=stations.activeWorkstation('cook','meals',true,false,day);
  assert.equal(site.id,id);assert.ok(site.actions.includes(action));
  assert.equal(stations.workAssignmentTarget('cook','meals',day),site.target);
  assert.equal(stations.activeWorkstation('cook','meals',false,false,day),undefined);
  assert.equal(stations.activeWorkstation('cook','meals',true,true,day),undefined);
 }
 const vegetable=stations.activeWorkstation('cook','meals',true,false,1);
 const potato=stations.activeWorkstation('cook','meals',true,false,2);
 assert.ok(Math.hypot(vegetable.target.targetX-potato.target.targetX,vegetable.target.targetZ-potato.target.targetZ)>=3);
 const dough=stations.activeWorkstation('cook','meals',true,false,3);
 assert.ok(Math.hypot(potato.target.targetX-dough.target.targetX,potato.target.targetZ-dough.target.targetZ)>=3);
 assert.equal(dough.completionLayer,'completed-dough.png');
 const mixture=stations.activeWorkstation('cook','meals',true,false,5);
 assert.equal(mixture.completionLayer,'completed-mixture.png');
 assert.ok(Math.hypot(mixture.target.targetX-dough.target.targetX,mixture.target.targetZ-dough.target.targetZ)>=3);
 for(const day of [0,-1,NaN,1.5,Infinity])assert.throws(()=>activities.cookingWorkAction(day));
});
