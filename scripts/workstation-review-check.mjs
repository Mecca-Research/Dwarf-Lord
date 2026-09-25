import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const output='work/expanded-cycles/station-layer-browser';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1060,height:1150}}),errors=[],results=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(process.env.REVIEW_URL??'http://localhost:8081/Dwarf-Lord/workstation-review.html');
 const ready=()=>page.waitForFunction(()=>window.render_game_to_text&&!JSON.parse(window.render_game_to_text()).loading);
 await ready();const count=await page.locator('#station option').count();assert.equal(count,3);
 const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
 const pixels=()=>page.evaluate(()=>document.querySelector('canvas').toDataURL());
 for(let i=0;i<count;i++) {
  await page.selectOption('#station',String(i));await ready();const before=await state();
  assert.equal(before.frame,0);assert.equal(before.approved,before.character==='Blacksmith');
  for(let frame=0;frame<8;frame++) {
   await page.locator('#frame').evaluate((e,n)=>{e.value=n;e.dispatchEvent(new Event('input'))},frame);
   assert.equal((await state()).frame,frame);
  }
  const combined=await pixels();await page.uncheck('#foreground');assert.notEqual(await pixels(),combined,'foreground changes actual pixels');
  await page.check('#foreground');await page.uncheck('#actor');const propOnly=await pixels();
  await page.locator('#frame').evaluate(e=>{e.value=2;e.dispatchEvent(new Event('input'))});
  assert.equal(await pixels(),propOnly,'station pixels remain fixed as frame changes');
  await page.screenshot({path:`${output}/${before.character}-station.png`});
  await page.check('#actor');await page.click('#restart');await page.click('#play');await page.evaluate(()=>window.advanceTime(2000));
  const completed=await state();assert.equal(completed.frame,7);assert.equal(completed.completed,true);assert.equal(completed.completions,1);assert.equal(completed.playing,false);
  await page.evaluate(()=>window.advanceTime(5000));assert.equal((await state()).completions,1);
  await page.screenshot({path:`${output}/${before.character}-layered.png`});
  await page.click('#restart');await page.check('#repeat');await page.click('#play');await page.evaluate(()=>window.advanceTime(2200));
  assert.equal((await state()).completed,false);assert.equal((await state()).playing,true);
  await page.click('#play');await page.uncheck('#repeat');results.push(completed);
 }
 assert.deepEqual(errors,[]);await writeFile(`${output}/results.json`,JSON.stringify({results,errors},null,2));
 console.log('PASS eight-frame Cook/Blacksmith/Ginger layered review, fixed props, tool occlusion, once-hold and repeat playback');
} finally {await browser.close()}
