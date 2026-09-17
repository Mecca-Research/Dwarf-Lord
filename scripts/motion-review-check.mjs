import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out='work/expanded-cycles/browser';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:1050}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const ready=()=>page.waitForFunction(()=>window.render_game_to_text&&!JSON.parse(window.render_game_to_text()).loading&&document.querySelectorAll('#frames button').length===8);
await page.goto(process.env.REVIEW_URL??'http://localhost:8082/motion-review.html');await ready();
const characters=await page.locator('#character option').allTextContents();const report=[];
for(let c=0;c<characters.length;c++){
 await page.selectOption('#character',String(c));await ready();
 const actions=await page.locator('#action option').allTextContents();
 for(let a=0;a<actions.length;a++){
  await page.selectOption('#action',String(a));await ready();
  const before=await state();assert.equal(before.index,0);assert.equal(before.playing,false);
  await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('img')].map(i=>i.decode()))});
  await page.click('#next');assert.equal((await state()).index,1);await page.click('#previous');assert.equal((await state()).index,0);
  await page.click('#play');await page.evaluate(()=>window.advanceTime(2000));assert.equal((await state()).index,7);assert.equal((await state()).playing,false);
  await page.click('#restart');await page.check('#repeat');await page.click('#play');await page.evaluate(()=>window.advanceTime(1000));assert.equal((await state()).playing,true);
  await page.click('#play');assert.equal((await state()).playing,false);await page.uncheck('#repeat');
  if(a===0&&['Blacksmith','Borrin','Cook','Elder'].includes(characters[c]))await page.screenshot({path:`${out}/${characters[c].toLowerCase()}.png`,fullPage:true});
  report.push({character:characters[c],action:before.action,frames:8});
 }
}
// Contact timing, synchronized views, overlays and last-to-first seam inspection.
await page.selectOption('#character','0');await ready();
const timing=await page.evaluate(()=>{document.querySelector('#restart').click();document.querySelector('#play').click();window.advanceTime(139);const a=JSON.parse(window.render_game_to_text()).index;window.advanceTime(1);const b=JSON.parse(window.render_game_to_text()).index;document.querySelector('#play').click();return [a,b]});assert.deepEqual(timing,[0,1]);
// Ground travel freezes at zero speed and changing directions keeps the fractional beat.
await page.check('#travel');
const frozen=await page.evaluate(()=>{document.querySelector('#travel-speed').value='0';document.querySelector('#play').click();const before=JSON.parse(window.render_game_to_text()).phase;window.advanceTime(5000);const after=JSON.parse(window.render_game_to_text()).phase;document.querySelector('#play').click();return [before,after]});assert.equal(frozen[0],frozen[1]);
const phase=await page.evaluate(()=>{document.querySelector('#travel-speed').value='0.8';document.querySelector('#restart').click();document.querySelector('#play').click();window.advanceTime(500);document.querySelector('#play').click();document.querySelector('#travel-speed').value='0';document.querySelector('#travel-speed').dispatchEvent(new Event('input'));return JSON.parse(window.render_game_to_text()).phase});assert.ok(phase>2&&phase<3);
await page.selectOption('#action','1');await ready();assert.ok(Math.abs((await state()).phase-phase)<1e-8);
const resumed=await page.evaluate(()=>{document.querySelector('#play').click();window.advanceTime(1000);document.querySelector('#play').click();return JSON.parse(window.render_game_to_text()).phase});assert.ok(Math.abs(resumed-phase)<1e-8);
await page.screenshot({path:`${out}/travel-ground.png`,fullPage:true});
await page.uncheck('#travel');await page.uncheck('#physical');await page.selectOption('#action','0');await ready();
const comparisonValue=await page.locator('#compare option').nth(1).getAttribute('value');await page.selectOption('#compare',comparisonValue);await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).comparison!==null);
await page.check('#onion');await page.check('#guides');await page.check('#seam');
const seam=await page.evaluate(()=>{document.querySelector('#play').click();const seen=[];for(let i=0;i<8;i++){window.advanceTime(160);seen.push(JSON.parse(window.render_game_to_text()).index)}document.querySelector('#play').click();return seen});assert.ok(seam.includes(0)&&seam.includes(7)&&seam.every(i=>i===0||i===7));
await page.screenshot({path:`${out}/polish-comparison.png`,fullPage:true});
await page.uncheck('#seam');await page.uncheck('#onion');await page.uncheck('#guides');
await page.selectOption('#compare','');assert.equal((await state()).comparison,null);
await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:`${out}/mobile.png`,fullPage:true});
await page.setViewportSize({width:1280,height:1050});
// Rapid character changes must not display an older response or stale action list.
await page.evaluate(()=>{const s=document.querySelector('#character');s.value='0';s.dispatchEvent(new Event('change'));s.value=String(s.options.length-1);s.dispatchEvent(new Event('change'))});await ready();assert.equal((await state()).character,characters.at(-1));
await page.evaluate(()=>{document.activeElement.blur()});await page.keyboard.press('ArrowRight');const stepped=(await state()).index;assert.equal(stepped,1);await page.keyboard.press('Space');assert.equal((await state()).playing,true);await page.keyboard.press('Space');assert.equal((await state()).playing,false);
assert.deepEqual(errors,[]);await writeFile(`${out}/results.json`,JSON.stringify({characters:characters.length,actions:report.length,frames:report.length*8,errors,report},null,2));console.log(`PASS: ${report.length} action sequences; ${report.length*8} images; controls, race handling and mobile layout`);await browser.close();
