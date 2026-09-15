import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync,writeFileSync } from 'node:fs';
const out=process.env.REVIEW_OUTPUT||'work/work-references/browser';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1400,height:1100}});const errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url())});
 await page.goto(process.env.REVIEW_URL||'http://localhost:8081/Dwarf-Lord/character-animation-review.html');
 await page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).frameCount===6);
 const names=await page.locator('#character option').allTextContents();assert.equal(names.length,14);const verified=[];
 for(const name of names){
  await page.selectOption('#character',{label:name});await page.waitForFunction(n=>JSON.parse(window.render_game_to_text()).character===n,name);
  const results=await page.evaluate(async()=>{const images=[...document.querySelectorAll('#frames img')];await Promise.all(images.map(i=>i.decode()));await document.querySelector('#canonical').decode();return images.map(img=>{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const a=ctx.getImageData(0,0,c.width,c.height).data;let clear=0,solid=0;for(let i=3;i<a.length;i+=4){if(a[i]===0)clear++;if(a[i]>240)solid++}return {width:c.width,height:c.height,clear,solid}})});
  assert.equal(results.length,6);for(const r of results){assert.equal(r.width,640);assert.equal(r.height,640);assert.ok(r.clear>1000&&r.solid>1000)}
  await page.click('#next');assert.equal(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).index),1);await page.click('#previous');assert.equal(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).index),0);
  assert.ok(await page.locator('#play').isHidden());await page.keyboard.press('Space');await page.evaluate(()=>window.advanceTime(2000));assert.equal(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).playing),false);
  verified.push({name,frames:6,static:true});
 }
 for(const name of ['Blacksmith','Borrin','Cook','Elder']){await page.selectOption('#character',{label:name});await page.waitForFunction(n=>JSON.parse(window.render_game_to_text()).character===n,name);await page.locator('#active').evaluate(i=>i.decode());await page.screenshot({path:`${out}/${name.toLowerCase()}.png`,fullPage:true})}
 await page.selectOption('#library','poses');await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).frameCount===12);assert.ok(await page.locator('#play').isVisible());
 await page.selectOption('#library','work');await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).frameCount===6);assert.ok(await page.locator('#play').isHidden());
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${out}/mobile.png`,fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);writeFileSync(`${out}/results.json`,JSON.stringify({characters:verified,frames:84,errors,missing},null,2));console.log('PASS 84 static references, 14 characters, alpha, navigation, static mode, library switching and mobile layout');
}finally{await browser.close()}
