import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root=new URL('../public/sprites/',import.meta.url);
const library=JSON.parse(readFileSync(new URL('work-reference-library.json',root)));
test('14 characters have six static work references with complete provenance and transparent PNG format',()=>{
 assert.equal(library.length,14);
 assert.equal(new Set(library.map(c=>c.name)).size,14);
 for(const c of library){
  const url=new URL(c.manifest,root),m=JSON.parse(readFileSync(url));
  assert.equal(m.character,c.name);assert.equal(m.status,'static-work-reference');assert.equal(m.playback,false);assert.equal(m.frames.length,6);
  assert.equal(createHash('sha256').update(readFileSync(new URL(m.source,url))).digest('hex'),m.sourceSha256);
  assert.ok(existsSync(new URL(m.canonical,url)));
  const hashes=new Set();
  for(const f of m.frames){const png=readFileSync(new URL(f.file,url));assert.equal(png.readUInt32BE(16),640);assert.equal(png.readUInt32BE(20),640);assert.equal(png[25],6);assert.equal(f.staticReference,true);assert.ok(f.title&&f.description);hashes.add(createHash('sha256').update(png).digest('hex'))}
  assert.equal(hashes.size,6);
  const profile=JSON.parse(readFileSync(new URL('../profile.json',url)));
  assert.equal(profile.workReferences.count,6);assert.equal(profile.workReferences.animationVariationsComplete,true);assert.equal(profile.workAnimations.actionCount,6);assert.equal(profile.workAnimations.frameCount,24);assert.equal(profile.workAnimations.productionReady,false);
 }
});
test('Borrin legacy writing now references the open-ledger desk composition',()=>{
 const url=new URL('Borrin/animation/manifest.json',root);const m=JSON.parse(readFileSync(url));
 assert.equal(m.frames[8].id,'seated-ledger');assert.equal(m.frames[8].sourceOverride,'../work-references/00-desk-writing.png');assert.match(m.frames[8].description,/open ledger/);
 assert.ok(existsSync(new URL(m.frames[8].sourceOverride,url)));
});
