import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root=resolve('public/sprites');
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const png=p=>{const b=readFileSync(p);assert.equal(b.toString('hex',0,8),'89504e470d0a1a0a');return [b.readUInt32BE(16),b.readUInt32BE(20),b[25]]};
test('work animation library covers every static action with four authored frames',()=>{
 const references=json(resolve(root,'work-reference-library.json'));
 const library=json(resolve(root,'work-animation-library.json'));
 assert.equal(library.length,references.length);
 let total=0;
 for(const reference of references){
  const entry=library.find(e=>e.name===reference.name);assert.ok(entry,reference.name);
  const catalogPath=resolve(root,entry.manifest),catalog=json(catalogPath);
  const original=json(resolve(root,reference.manifest));
  assert.deepEqual(catalog.actions.map(a=>a.id),original.frames.map(a=>a.id));
  for(const action of catalog.actions){
   const p=resolve(dirname(catalogPath),action.manifest),m=json(p),folder=dirname(p);
   assert.equal(m.character,reference.name);assert.equal(m.action,action.id);
   assert.equal(m.frames.length,4);assert.equal(m.frameCount,4);
   assert.equal(m.productionReady,false);assert.equal(m.status,'authored-keyframe-variations');
   assert.deepEqual(m.playback.order,[0,1,2,3]);assert.ok(m.sharedScale>0);
   assert.equal(hash(resolve(folder,m.source)),m.sourceSha256);
   assert.ok(existsSync(resolve(folder,m.reference)));
   assert.deepEqual(png(resolve(folder,m.atlas.file)),[2560,640,6]);
   assert.ok(readFileSync(resolve(folder,m.preview)).includes(Buffer.from('acTL')),'animated PNG');
   const hashes=new Set();
   for(const f of m.frames){assert.deepEqual(png(resolve(folder,f.file)),[640,640,6]);assert.ok(f.description);assert.deepEqual(f.groundAnchor,[320,616]);hashes.add(hash(resolve(folder,f.file)));total++;}
   assert.equal(hashes.size,4,`${reference.name}/${action.id}: distinct authored images`);
  }
 }
 assert.equal(total,336);
});
