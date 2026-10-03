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
