import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const output = process.env.REVIEW_OUTPUT || 'work/animation/browser';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
 const page=await browser.newPage({viewport:{width:1280,height:1050}});const errors=[];
 page.on('pageerror', e=>errors.push(e.message));
 await page.goto(process.env.REVIEW_URL || 'http://localhost:8081/Dwarf-Lord/character-animation-review.html');
 await page.waitForFunction(()=>window.render_game_to_text && JSON.parse(window.render_game_to_text()).frameCount===12);
 const options=await page.locator('#character option').allTextContents();assert.equal(options.length,14);
 const results=[];
 for (const name of options) {
  await page.selectOption('#character',{label:name});
  await page.waitForFunction(n=>JSON.parse(window.render_game_to_text()).character===n,name);
  const r=await page.evaluate(async()=>{
   const images=[...document.querySelectorAll('#frames img')];await Promise.all(images.map(i=>i.decode()));await document.querySelector('#canonical').decode();
   return images.map(img=>{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const p=ctx.getImageData(0,0,c.width,c.height).data;let clear=0,solid=0;for(let i=3;i<p.length;i+=4){if(p[i]===0)clear++;if(p[i]>240)solid++}return {width:c.width,height:c.height,clear,solid}})
  });
  assert.equal(r.length,12);for(const img of r){assert.equal(img.width,384);assert.equal(img.height,640);assert.ok(img.clear>1000&&img.solid>1000)}
  await page.click('#next');assert.equal(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).index),1);
  await page.click('#previous');assert.equal(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).index),0);
  results.push({name,frames:r.length,imagesLoaded:true});
 }
 await page.selectOption('#character',{label:'Helga'});await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).character==='Helga');
 await page.click('#play');await page.evaluate(()=>window.advanceTime(1100));
 assert.ok((await page.evaluate(()=>JSON.parse(window.render_game_to_text()).index))>0);
 await page.click('#play');await page.locator('#frames button').nth(7).click();await page.locator('#active').evaluate(i=>i.decode());
 await page.screenshot({path:`${output}/helga-review.png`,fullPage:true});
 await page.selectOption('#character',{label:'Borrin'});await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).character==='Borrin');
 await page.locator('#frames button').nth(9).click();await page.locator('#active').evaluate(i=>i.decode());await page.screenshot({path:`${output}/borrin-review.png`,fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:`${output}/mobile-review.png`,fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);writeFileSync(`${output}/results.json`,JSON.stringify({characters:results,frames:168,controls:'selection, previous, next, playback, mobile layout',errors},null,2));
 console.log('PASS 14 characters / 168 transparent frames, comparison, controls, playback and mobile layout');
} finally { await browser.close(); }
