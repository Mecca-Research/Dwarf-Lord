import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync,readFileSync,writeFileSync } from 'node:fs';
import {dirname,resolve} from 'node:path';
const library=JSON.parse(readFileSync('public/sprites/work-reference-library.json'));
const out=process.env.REVIEW_OUTPUT||'work/work-references/browser';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1400,height:1100}});const errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url())});
 await page.goto(process.env.REVIEW_URL||'http://localhost:8081/Dwarf-Lord/character-animation-review.html');
 await page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).frameCount>0);
 const names=await page.locator('#character option').allTextContents();assert.equal(names.length,14);const verified=[];
 for(const name of names){
  await page.selectOption('#character',{label:name});await page.waitForFunction(n=>JSON.parse(window.render_game_to_text()).character===n,name);
  const results=await page.evaluate(async()=>{const images=[...document.querySelectorAll('#frames img')];await Promise.all(images.map(i=>i.decode()));await document.querySelector('#canonical').decode();return images.map(img=>{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const a=ctx.getImageData(0,0,c.width,c.height).data;let clear=0,solid=0;for(let i=3;i<a.length;i+=4){if(a[i]===0)clear++;if(a[i]>240)solid++}return {width:c.width,height:c.height,clear,solid}})});
  const entry=library.find(e=>e.name===name);assert.ok(entry);
  const path=resolve('public/sprites',entry.manifest),manifest=JSON.parse(readFileSync(path));
  const expected=[...manifest.frames,...(manifest.supplementalReferences??[])];
  assert.equal(results.length,expected.length);
  for(const [i,r]of results.entries()){
   const png=readFileSync(resolve(dirname(path),expected[i].file));
   assert.equal(r.width,png.readUInt32BE(16));assert.equal(r.height,png.readUInt32BE(20));
   assert.ok(r.clear>1000&&r.solid>1000);
  }
  await page.click('#next');assert.equal(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).index),1);await page.click('#previous');assert.equal(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).index),0);
  assert.ok(await page.locator('#play').isHidden());await page.keyboard.press('Space');await page.evaluate(()=>window.advanceTime(2000));assert.equal(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).playing),false);
  verified.push({name,frames:results.length,static:true});
 }
 for(const name of ['Blacksmith','Borrin','Cook','Elder']){await page.selectOption('#character',{label:name});await page.waitForFunction(n=>JSON.parse(window.render_game_to_text()).character===n,name);await page.locator('#active').evaluate(i=>i.decode());await page.screenshot({path:`${out}/${name.toLowerCase()}.png`,fullPage:true})}
 await page.selectOption('#library','poses');await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).frameCount===12);assert.ok(await page.locator('#play').isVisible());
 const selectedName=await page.locator('#character option:checked').textContent();
 const workEntry=library.find(e=>e.name===selectedName);assert.ok(workEntry);
 const workManifest=JSON.parse(readFileSync(resolve('public/sprites',workEntry.manifest)));
 const workCount=workManifest.frames.length+(workManifest.supplementalReferences?.length??0);
 await page.selectOption('#library','work');await page.waitForFunction(n=>JSON.parse(window.render_game_to_text()).frameCount===n,workCount);assert.ok(await page.locator('#play').isHidden());
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${out}/mobile.png`,fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 const frames=verified.reduce((total,r)=>total+r.frames,0);assert.equal(frames,103);
 writeFileSync(`${out}/results.json`,JSON.stringify({characters:verified,frames,errors,missing},null,2));console.log(`PASS ${frames} static references, 14 characters, alpha, navigation, static mode, library switching and mobile layout`);
}finally{await browser.close()}
