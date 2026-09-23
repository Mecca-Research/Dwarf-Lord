import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const output='work/expanded-cycles/workstation-browser';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1280,height:800}}), errors=[];
 page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')console.log(m.type(),m.text());});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().includes('/motion/')&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(process.env.REVIEW_URL??'http://localhost:8080/');
 await page.getByRole('button',{name:'Walk the road'}).waitFor();
 await page.waitForTimeout(1500);
 await page.getByRole('button',{name:'Walk the road'}).click();
 await page.waitForTimeout(3000);
 if(await page.getByRole('button',{name:'Walk the road'}).isVisible())await page.getByRole('button',{name:'Walk the road'}).click();
 await page.waitForFunction(()=>window.__controlsTest?.assignJob);
 await page.waitForTimeout(10000);
 await page.evaluate(()=>{const t=window.__controlsTest;t.teleport(0,3);t.teleportDwarf('kori',-2,4.5);t.assignJob('kori','meals');});
 try { await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='kori')?.workMotion?.completed,null,{timeout:30000}); } catch(e) { console.log(await page.evaluate(()=>window.render_game_to_text())); await page.screenshot({path:`${output}/failure.png`}); throw e; }
 const sample=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='kori'));
 const completed=await sample();
 assert.equal(completed.workMotion.frame,7);assert.equal(completed.workMotion.completions,1);
 await page.screenshot({path:`${output}/cooking.png`});
 await page.waitForTimeout(500);assert.equal((await sample()).workMotion.completions,1);
 await page.evaluate(()=>window.__controlsTest.assignJob('kori',null));
 await page.waitForFunction(()=>!JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='kori')?.workMotion);
 await page.evaluate(()=>window.__controlsTest.assignJob('kori','meals'));
 await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='kori')?.workMotion?.completed);
 await page.evaluate(()=>window.__controlsTest.resolveDay());
 await page.waitForFunction(()=>!JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='kori')?.workMotion);
 await page.screenshot({path:`${output}/completed-day.png`});
 await page.evaluate(()=>{const t=window.__controlsTest;t.nextMorning();t.teleport(8,-35);t.teleportDwarf('nessa',8,-37);t.assignJob('nessa','limestone');});
 await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='nessa')?.workMotion?.completed);
 const miner = await page.evaluate(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='nessa'));
 assert.equal(miner.workMotion.action,'pickaxe-swing');
 await page.screenshot({path:`${output}/mining.png`});
 await page.keyboard.down('q');
 await page.waitForFunction(old=>{const m=JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='nessa')?.workMotion;return m&&m.direction!==old;},miner.workMotion.direction,{timeout:60000});
 await page.keyboard.up('q');
 const turned = await page.evaluate(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='nessa').workMotion);
 assert.equal(turned.completed,true);assert.equal(turned.completions,1);
 const addedWorkers=[];
 for(const [id,job,action,x,z] of [['tam','storage','stack-crates',12,8],['brokk','timber','fell-tree',-42,18]]) {
  await page.evaluate(({id,job,x,z})=>{const t=window.__controlsTest;t.teleport(x,z+3);t.teleportDwarf(id,x-2,z);t.assignJob(id,job);},{id,job,x,z});
  await page.waitForFunction(id=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id===id)?.workMotion?.completed,id,{timeout:60000});
  const worker=await page.evaluate(id=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id===id),id);
  assert.equal(worker.workMotion.action,action);assert.equal(worker.workMotion.completions,1);
  await page.screenshot({path:`${output}/${action}.png`});
  addedWorkers.push(worker);
  await page.evaluate(id=>window.__controlsTest.assignJob(id,null),id);
  await page.waitForFunction(id=>!JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id===id)?.workMotion,id);
 }
 assert.deepEqual(errors,[]);
 await writeFile(`${output}/results.json`,JSON.stringify({completed,miner,turned,addedWorkers,errors},null,2));
 console.log('PASS Cook workstation lifecycle and Female Miner directional tool playback with completed-state camera turn; Laborer and Ginger work/cancellation');
} finally {await browser.close();}
