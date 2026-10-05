import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const catalog = {STARTING_DWARVES:[{id:'elder',x:4,z:5}]};
const source=readFileSync('src/game/world/work-activities.ts','utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}});
const actions={};new Function('exports','require',outputText)(actions,id=>{assert.equal(id,'../data/catalog');return catalog;});
const {elderCampActivity,elderCampActions,WorkActivitySequence}=actions;
test('consultant keeps one cosmetic operation for each valid day and returns to writing',()=>{
 assert.deepEqual(actions.consultantWorkActions,['desk-writing','count-coins','review-open-ledger','explain-at-desk','stamp-paperwork']);
 assert.deepEqual([1,2,3,4,5,6,7,8,9,10,11].map(actions.consultantWorkAction),['desk-writing','count-coins','review-open-ledger','explain-at-desk','stamp-paperwork','desk-writing','count-coins','review-open-ledger','explain-at-desk','stamp-paperwork','desk-writing']);
 for(const day of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>actions.consultantWorkAction(day));
});
test('timber activity selects one finite operation per valid day and restores forestry',()=>{
 assert.deepEqual(actions.timberWorkActions,['fell-tree','build-barrel']);
 assert.deepEqual([1,2,3,4].map(actions.timberWorkAction),['fell-tree','build-barrel','fell-tree','build-barrel']);
 for(const day of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>actions.timberWorkAction(day));
});
test('timber routing uses the same operation and physical station as playback',()=>{
 const sitesSource=readFileSync('src/game/world/workstation-sites.ts','utf8');
 const compiled=ts.transpileModule(sitesSource,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const sites={};new Function('exports','require',compiled)(sites,id=>{
  if(id==='./work-activities')return actions;
  assert.equal(id,'../data/catalog');return {STARTING_DWARVES:[{id:'borrin',x:10,z:10},{id:'fenn',x:2,z:8}],JOBS:[
   {id:'timber',targetX:-42,targetZ:18},...['meals','forge','storage','limestone'].map(id=>({id,targetX:0,targetZ:0}))]};
 });
 for(const [day,id,x]of [[1,'forestry-trunk',-42],[2,'cooper-barrel',-36],[3,'forestry-trunk',-42]]){
  const site=sites.activeWorkstation('ginger','timber',true,false,day);
  assert.equal(site.id,id);assert.deepEqual(site.target,{id:'timber',targetX:x,targetZ:18});
  assert.deepEqual(sites.workAssignmentTarget('ginger','timber',day),site.target);
  assert.equal(sites.activeWorkstation('ginger','timber',false,false,day),undefined);
  assert.equal(sites.activeWorkstation('ginger','timber',true,true,day),undefined);
 }
});
test('all six Elder camp activities have eight frames and source-bound body placement',()=>{
 const c=JSON.parse(readFileSync('public/sprites/Elder/motion/render-calibration.json'));
 assert.equal(elderCampActions.length,6);
 for(const action of elderCampActions){
  const base=`public/sprites/Elder/motion/${action}/reference/`;
  const m=JSON.parse(readFileSync(base+'manifest.json')),p=c.actions[action+'/reference'];
  assert.equal(m.frames.length,8);assert.equal(m.playback.mode,'once-hold');
  assert.equal(p.sourceSha256,createHash('sha256').update(readFileSync(base+'source-sheet.png')).digest('hex'));
  assert.ok(p.targetBodyHeight>0);assert.equal(p.targetAnchor.length,2);
 }
});
test('camp activities never claim production work, walking, dialogue, sleep or a moved Elder',()=>{
 const b={x:4,z:5,anim:'sit'};
 assert.equal(elderCampActivity('elder',null,b),true);
 for(const anim of ['walk','work','talk','sleep','idle'])assert.equal(elderCampActivity('elder',null,{...b,anim}),false);
 assert.equal(elderCampActivity('elder','meals',b),false);
 assert.equal(elderCampActivity('borrin',null,b),false);
 assert.equal(elderCampActivity('elder',null,{...b,x:6}),false);
});
test('finite sequence holds completed actions, pauses, and never skips or loops the last action',()=>{
 const s=new WorkActivitySequence(elderCampActions);
 assert.equal(s.update(9000,false),false,'loading or an unfinished action cannot finish a task');
 assert.equal(s.update(1900,true),false);assert.equal(s.update(0,true),false,'pause');
 assert.equal(s.update(100,true),true);assert.equal(s.action,'eat-bread');
 for(let i=2;i<6;i++){assert.equal(s.update(10000,true),true);assert.equal(s.index,i);}
 assert.equal(s.update(100000,true),false);assert.equal(s.index,5);
 assert.throws(()=>s.update(NaN,true));assert.throws(()=>new WorkActivitySequence([]));
 const reset=new WorkActivitySequence(elderCampActions);assert.equal(reset.index,0);
});
