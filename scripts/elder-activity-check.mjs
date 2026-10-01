import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const output='work/expanded-cycles/motion35/elder-live';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:process.env.HEADED!=='1',args:['--no-sandbox','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],assets=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('response',r=>{if(r.url().includes('/Elder/motion/')){assets.push({url:r.url(),status:r.status()});if(r.status()>=400)errors.push(r.url());}});
 await page.goto('http://localhost:8081/Dwarf-Lord/');await page.getByRole('button',{name:'Walk the road'}).click();
 await page.waitForFunction(()=>window.__controlsTest?.teleportDwarf);await page.waitForTimeout(5000);
 const home=await page.evaluate(()=>{const d=JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='elder');return {x:d.x,z:d.z};});
 await page.evaluate(()=>window.__controlsTest.teleportDwarf('elder',20,10));
 await page.waitForFunction(()=>!JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='elder').workMotion);
 await page.evaluate(({x,z})=>{window.__controlsTest.teleport(x+1,z+2);window.__controlsTest.teleportDwarf('elder',x,z);},home);
 const expected=['eat-stew','eat-bread','laugh-seated','laugh-and-gesture','inspect-pickaxe-in-lap','examine-pickaxe-crack'];
 await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='elder')?.workMotion?.action==='eat-stew');
 await page.evaluate(()=>{window.__elderFrames=[];window.__elderRecording=true;const tick=()=>{if(!window.__elderRecording)return;const d=JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='elder');window.__elderFrames.push(d?.workMotion??null);requestAnimationFrame(tick);};tick();});
 const seen=[];
 for(const action of expected){
  await page.waitForFunction(a=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='elder')?.workMotion?.action===a,action,{timeout:45000});
  const samples=await page.evaluate(a=>new Promise(resolve=>{
   const result=[];function tick(){const d=JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='elder');if(d?.workMotion?.action!==a||d.workMotion.completed){if(d?.workMotion?.action===a)result.push(d);resolve(result);return;}result.push(d);requestAnimationFrame(tick);}tick();
  }),action);
  assert.ok(samples.length>0);const last=samples.at(-1);assert.equal(last.workMotion.completed,true);assert.equal(last.workMotion.completions,1);assert.equal(last.workMotion.frame,7);
  await page.screenshot({path:`${output}/${action}.png`});seen.push({action,frames:[...new Set(samples.map(s=>s.workMotion.frame))],samples,completed:last.workMotion});
 }
 for(const action of ['laugh-seated','laugh-and-gesture'])assert.equal(seen.find(s=>s.action===action).frames.length,8,'final seated review needs every live frame');
 const handoffs=await page.evaluate(()=>{window.__elderRecording=false;return window.__elderFrames;});assert.ok(handoffs.length>30);assert.ok(handoffs.every(Boolean),'preloaded handoffs never flash idle');
 await page.waitForTimeout(2500);const final=await page.evaluate(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='elder'));
 assert.equal(final.workMotion.action,expected.at(-1));assert.equal(final.workMotion.completions,1);
 await page.evaluate(()=>window.__controlsTest.teleportDwarf('elder',20,10));await page.waitForFunction(()=>!JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='elder').workMotion);
 await page.evaluate(({x,z})=>window.__controlsTest.teleportDwarf('elder',x,z),home);await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='elder')?.workMotion?.action==='eat-stew');
 assert.deepEqual(errors,[]);
 await writeFile(`${output}/results.json`,JSON.stringify({seen,home,assets,errors,final,handoffs,scope:'Live six-action activation, completion, terminal hold and departure/return reset. Anatomical walking contact and seamless action handoffs are separate reviews.'},null,2));console.log('PASS all six Elder activities, once-hold completion, finite terminal state and departure reset');
} finally {await browser.close();}
