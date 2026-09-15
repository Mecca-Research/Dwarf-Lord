import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out='work/work-animations/browser';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:1050}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const ready=()=>page.waitForFunction(()=>window.render_game_to_text&&!JSON.parse(window.render_game_to_text()).loading&&document.querySelectorAll('#frames button').length===4);
await page.goto(process.env.REVIEW_URL??'http://localhost:8082/work-animation-review.html');await ready();
const characters=await page.locator('#character option').allTextContents();const report=[];
for(let c=0;c<characters.length;c++){
 await page.selectOption('#character',String(c));await ready();
 const actions=await page.locator('#action option').allTextContents();
 for(let a=0;a<actions.length;a++){
  await page.selectOption('#action',String(a));await ready();
  const before=await state();assert.equal(before.index,0);assert.equal(before.playing,false);
  await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('img')].map(i=>i.decode()))});
  await page.click('#next');assert.equal((await state()).index,1);await page.click('#previous');assert.equal((await state()).index,0);
  await page.click('#play');await page.evaluate(()=>window.advanceTime(2000));assert.equal((await state()).index,3);assert.equal((await state()).playing,false);
  await page.click('#restart');await page.check('#repeat');await page.click('#play');await page.evaluate(()=>window.advanceTime(1000));assert.equal((await state()).playing,true);
  await page.click('#play');assert.equal((await state()).playing,false);await page.uncheck('#repeat');
  if(a===0&&['Blacksmith','Borrin','Cook','Elder'].includes(characters[c]))await page.screenshot({path:`${out}/${characters[c].toLowerCase()}.png`,fullPage:true});
  report.push({character:characters[c],action:before.action,frames:4});
 }
}
await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:`${out}/mobile.png`,fullPage:true});
await page.setViewportSize({width:1280,height:1050});
// Rapid character changes must not display an older response or stale action list.
await page.evaluate(()=>{const s=document.querySelector('#character');s.value='0';s.dispatchEvent(new Event('change'));s.value=String(s.options.length-1);s.dispatchEvent(new Event('change'))});await ready();assert.equal((await state()).character,characters.at(-1));
await page.evaluate(()=>{document.activeElement.blur()});await page.keyboard.press('ArrowRight');const stepped=(await state()).index;assert.equal(stepped,1);await page.keyboard.press('Space');assert.equal((await state()).playing,true);await page.keyboard.press('Space');assert.equal((await state()).playing,false);
assert.deepEqual(errors,[]);await writeFile(`${out}/results.json`,JSON.stringify({characters:characters.length,actions:report.length,frames:report.length*4,errors,report},null,2));console.log(`PASS: ${report.length} action sequences; ${report.length*4} images; controls, race handling and mobile layout`);await browser.close();
