import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const output=process.env.REVIEW_OUTPUT??'work/expanded-cycles/workstation-browser';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1000,height:700}}), errors=[];
 const now=new Date();await page.clock.install({time:now});await page.clock.pauseAt(now);
 const tick=async(ms=50)=>{await page.clock.fastForward(ms);await new Promise(r=>setTimeout(r,25));};
 const waitFor=async(predicate,arg)=>{
  for(let attempt=0;attempt<500;attempt++) {
   if(await page.evaluate(predicate,arg))return;
   await tick();
  }
  await page.screenshot({path:`${output}/failure.png`});
  console.log(await page.evaluate(()=>window.render_game_to_text?.()));
  throw Error(`Live motion condition was not reached: ${predicate}`);
 };
 page.setDefaultTimeout(90000); // Initial software-WebGL shader compilation can exceed 30 seconds.
 page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')console.log(m.type(),m.text());});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().includes('/motion/')&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(process.env.REVIEW_URL??'http://localhost:8080/');
 await waitFor(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Walk the road'));
 await page.getByRole('button',{name:'Walk the road'}).click({force:true});
 await waitFor(()=>Boolean(window.__controlsTest?.assignJob));
 await waitFor(()=>{
  const dwarves=JSON.parse(window.render_game_to_text()).dwarves;
  return ['borrin','fenn'].every(id=>dwarves.find(d=>d.id===id)?.workMotion?.completed);
 });
 const passive=await page.evaluate(()=>JSON.parse(window.render_game_to_text()).dwarves.filter(d=>['borrin','fenn'].includes(d.id)));
 for(const [id,action] of [['borrin','desk-writing'],['fenn','check-weights']]) {
  const dwarf=passive.find(d=>d.id===id);
  assert.equal(dwarf.workMotion.action,action);assert.equal(dwarf.workMotion.direction,'actor');
  assert.equal(dwarf.workMotion.completed,true);assert.equal(dwarf.workMotion.completions,1);
 }
 await page.evaluate(()=>{const t=window.__controlsTest;t.teleport(0,3);t.teleportDwarf('kori',-2,4.5);t.assignJob('kori','meals');});
 try { await waitFor(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='kori')?.workMotion?.completed,null,{timeout:90000}); } catch(e) { console.log(await page.evaluate(()=>window.render_game_to_text())); await page.screenshot({path:`${output}/failure.png`}); throw e; }
 const sample=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='kori'));
 const completed=await sample();
 assert.equal(completed.workMotion.frame,7);assert.equal(completed.workMotion.completions,1);
 await page.screenshot({path:`${output}/cooking.png`});
 await tick(500);assert.equal((await sample()).workMotion.completions,1);
 await page.evaluate(()=>window.__controlsTest.assignJob('kori',null));
 await waitFor(()=>!JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='kori')?.workMotion);
 const stationAfterCancel=await page.evaluate(()=>JSON.parse(window.render_game_to_text()).workstations);
 assert.equal(stationAfterCancel.some(s=>s.id==='cutting-block'&&s.persistent),true);
 await page.evaluate(()=>window.__controlsTest.teleportDwarf('kori',-5,4.5));
 await page.screenshot({path:`${output}/empty-cutting-block.png`});
 await page.evaluate(()=>window.__controlsTest.teleportDwarf('kori',-2,4.5));
 await page.evaluate(()=>window.__controlsTest.assignJob('kori','meals'));
 await waitFor(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='kori')?.workMotion?.completed);
 await page.evaluate(()=>window.__controlsTest.resolveDay());
 await waitFor(()=>!JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='kori')?.workMotion);
 await page.screenshot({path:`${output}/completed-day.png`});
 await page.evaluate(()=>{const t=window.__controlsTest;t.nextMorning();t.teleport(8,-35);t.teleportDwarf('nessa',8,-37);t.assignJob('nessa','limestone');});
 await waitFor(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='nessa')?.workMotion?.completed);
 const miner = await page.evaluate(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='nessa'));
 assert.equal(miner.workMotion.action,'pickaxe-swing');
 await page.screenshot({path:`${output}/mining.png`});
 await page.keyboard.down('q');
 await waitFor(old=>{const m=JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='nessa')?.workMotion;return m&&m.direction!==old;},miner.workMotion.direction,{timeout:60000});
 await page.keyboard.up('q');
 const turned = await page.evaluate(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='nessa').workMotion);
 assert.equal(turned.completed,true);assert.equal(turned.completions,1);
 await page.evaluate(()=>{const t=window.__controlsTest;t.assignJob("nessa",null);t.teleportDwarf("nessa",12,-35);});
 await waitFor(()=>!JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==="nessa")?.workMotion);
 const addedWorkers=[];
 for(const [id,job,action,x,z] of [['stig','limestone','chisel-contact',8,-38],['grit','forge','inspect-tool',6,-7],['nessa','shaft2','shovel-cycle',14,-32],['tam','storage','stack-crates',8,8],['brokk','timber','fell-tree',-42,18]]) {
  await page.evaluate(({id,job,x,z})=>{const t=window.__controlsTest;t.teleport(x,z+3);t.teleportDwarf(id,x-2,z);t.assignJob(id,job);},{id,job,x,z});
  await waitFor(id=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id===id)?.workMotion?.completed,id,{timeout:60000});
  const worker=await page.evaluate(id=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id===id),id);
  assert.equal(worker.workMotion.action,action);assert.equal(worker.workMotion.completions,1);
  await page.screenshot({path:`${output}/${action}.png`});
  if(action==='chisel-contact'||job==='forge'||job==='timber'||job==='storage')assert.equal(worker.workMotion.direction,'actor');
  addedWorkers.push(worker);
  await page.evaluate(id=>window.__controlsTest.assignJob(id,null),id);
  await waitFor(id=>!JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id===id)?.workMotion,id);
  if(job==='storage') {
   await waitFor(()=>JSON.parse(window.render_game_to_text()).workstations.some(s=>s.id==='storage-pallet'&&s.persistent&&s.completedProp));
   await page.evaluate(()=>window.__controlsTest.teleportDwarf('tam',4,8));
   await page.screenshot({path:`${output}/completed-storage-pallet.png`});
  }
  if(job==='timber') {
   assert.ok(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).workstations.some(s=>s.id==='forestry-trunk'&&s.persistent)));
   await page.evaluate(()=>window.__controlsTest.teleportDwarf('brokk',-46,18));
   await tick(300);
   await page.screenshot({path:`${output}/empty-forestry-trunk.png`});
  }
  if(action==='chisel-contact') {
   assert.ok(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).workstations.some(s=>s.id==='masonry-bench'&&s.persistent)));
   await page.evaluate(()=>window.__controlsTest.teleportDwarf('stig',4,-38));
   await tick(700);
   await page.screenshot({path:`${output}/empty-masonry-bench.png`});
  }
  if(job==='forge') {
   assert.ok(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).workstations.some(s=>s.id==='anvil'&&s.persistent)));
   await page.evaluate(()=>window.__controlsTest.teleportDwarf('grit',2,-7));
   await tick(300);
   await page.screenshot({path:`${output}/empty-anvil.png`});
  }
 }
 assert.deepEqual(errors,[]);
 await writeFile(`${output}/results.json`,JSON.stringify({method:'Controlled clock with actual renderer, job/day lifecycle and passive workstation diagnostics',passive,completed,miner,turned,stationAfterCancel,addedWorkers,errors},null,2));
 console.log('PASS persistent Cook station, directional mining and shoveling, Blacksmith forging, Laborer/Ginger/Stoneworker work lifecycle');
} finally {await browser.close();}
