import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const png=p=>{const b=readFileSync(p);assert.equal(b.toString('hex',0,8),'89504e470d0a1a0a');return [b.readUInt32BE(16),b.readUInt32BE(20),b[25]]};
test('expanded motion plan preserves the requested character and directional coverage',()=>{
 const p=json('docs/expanded-animation-plan.json');
 assert.equal(p.entries.length,153);
 assert.equal(new Set(p.entries.map(e=>e.destination)).size,153);
 for(const name of ['Blacksmith','Borrin','Cook','Elder','Female Miner','Ginger','Helga','Laborer']) {
  const walks=p.entries.filter(e=>e.character===name&&e.kind==='walk');
  assert.equal(walks.length,8);assert.equal(new Set(walks.map(e=>e.direction)).size,8);
 }
 for(const e of p.entries){assert.equal(e.beats.length,8);assert.ok(existsSync(e.reference),e.reference)}
});
test('every exported motion has eight transparent frames, atlas, source and animated preview',()=>{
 const library=json('public/sprites/motion-library.json');assert.ok(library.length>0);
 for(const character of library){
  const path=resolve('public/sprites',character.manifest),catalog=json(path);let total=0;
  for(const action of catalog.actions){
   const mp=resolve(dirname(path),action.manifest),m=json(mp),folder=dirname(mp);
   assert.equal(m.character,character.name);assert.equal(m.direction,action.direction);
   assert.equal(m.frames.length,8);assert.equal(m.frameCount,8);assert.equal(m.productionReady,false);
   assert.deepEqual(m.playback.order,[0,1,2,3,4,5,6,7]);
   assert.equal(hash(resolve(folder,m.source)),m.sourceSha256,'stale export after source replacement');
   assert.ok(existsSync(resolve(folder,m.reference)));assert.deepEqual(png(resolve(folder,m.atlas.file)),[5120,640,6]);
   const apng=readFileSync(resolve(folder,m.preview));const offset=apng.indexOf(Buffer.from('acTL'));assert.ok(offset>0);assert.equal(apng.readUInt32BE(offset+4),8);
   const hashes=new Set();for(const frame of m.frames){assert.deepEqual(png(resolve(folder,frame.file)),[640,640,6]);hashes.add(hash(resolve(folder,frame.file)));total++;}
   assert.equal(hashes.size,8,mp);
  }
  assert.equal(total,character.frameCount);assert.equal(catalog.actions.length,character.actionCount);
 }
});
test('new task references resolve to their exported initial pose without duplicate files',()=>{
 const plan=json('docs/expanded-animation-plan.json');
 for(const e of plan.entries.filter(e=>e.kind==='new-work'&&e.status==='exported')){
  const refs=resolve('public/sprites',e.character,'work-references/manifest.json');
  const item=json(refs).supplementalReferences.find(r=>r.id===e.action&&r.origin==='expanded-motion');
  assert.ok(item,e.destination);assert.equal(item.staticReference,true);assert.equal(item.productionReady,false);
  assert.equal(resolve(dirname(refs),item.file),resolve(e.destination,'00.png'));
 }
});
