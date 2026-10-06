import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const output=process.env.REVIEW_OUTPUT??'work/expanded-cycles/motion39/smith-gameplay';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1000,height:700}}),errors=[],seen=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const now=new Date();await page.clock.install({time:now});await page.clock.pauseAt(now);
 await page.goto(process.env.REVIEW_URL??'http://localhost:8081/Dwarf-Lord/');
 const tick=async(ms=16)=>{await page.clock.fastForward(ms);await new Promise(r=>setTimeout(r,25));};
 const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
 const worker=async()=>(await state()).dwarves.find(d=>d.id==='grit');
 const until=async(predicate,label)=>{for(let n=0;n<200;n++){if(await page.evaluate(predicate))return;await tick();}throw Error(`Timed out: ${label}`);};
 await until(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Walk the road'),'start');
 await page.getByRole('button',{name:'Walk the road'}).click({force:true});
 await until(()=>Boolean(window.__controlsTest?.assignJob),'scene');
 for(const [day,action,x] of [[1,'hammer-contact',6],[2,'inspect-tool',6],[3,'repair-pickaxe-handle',3],[4,'anvil-ready',6],[5,'hammer-contact',6]]) {
  const manifest=JSON.parse(readFileSync(`public/sprites/Blacksmith/motion/${action}/actor/manifest.json`));
  await page.evaluate(({x})=>{const t=window.__controlsTest;t.teleport(x+1,-4);t.teleportDwarf('grit',x-2,-7);t.assignJob('grit','forge');},{x});
  await until(()=>Boolean(JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='grit')?.workMotion),'loaded operation');
  const served=await (await page.request.get(new URL(`sprites/Blacksmith/motion/${action}/actor/manifest.json`,page.url()).href)).json();
  assert.equal(served.sourceSha256,manifest.sourceSha256,'renderer must use the selected art');
  const atlas=await (await page.request.get(new URL(`sprites/Blacksmith/motion/${action}/actor/atlas.png`,page.url()).href)).body();
  const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash(atlas),hash(readFileSync(`public/sprites/Blacksmith/motion/${action}/actor/atlas.png`)));
  const calibration=await (await page.request.get(new URL('sprites/Blacksmith/motion/render-calibration.json',page.url()).href)).body();
  assert.equal(hash(calibration),hash(readFileSync('public/sprites/Blacksmith/motion/render-calibration.json')));
  const station=action==='repair-pickaxe-handle'?'repair-bench':'anvil';
  const prop=await (await page.request.get(new URL(`sprites/workstations/${station}/sprite.png`,page.url()).href)).body();
  assert.equal(hash(prop),hash(readFileSync(`public/sprites/workstations/${station}/sprite.png`)));
  // The game stops within0.5 world units; its text probe rounds coordinates.
  const arrival=await worker();assert.ok(Math.hypot(arrival.x-x,arrival.z+7)<=.51,`natural arrival at the selected station: ${JSON.stringify({x:arrival.x,z:arrival.z,targetX:x,targetZ:-7})}`);
  const samples=[];
  for(let frame=0;frame<8;frame++) {
   const d=await worker();assert.equal(d.workMotion.action,action);assert.equal(d.workMotion.frame,frame);
   assert.equal(d.workMotion.direction,'actor');samples.push(d.workMotion);
   if(action==='anvil-ready'||[0,2,4,7].includes(frame))await page.screenshot({path:`${output}/day${day}-${action}-${frame}.png`});
   await tick(manifest.frames[frame].durationMs);
  }
  const completed=(await worker()).workMotion;
  assert.equal(completed.completed,true);assert.equal(completed.completions,1);
  await tick(5000);assert.deepEqual((await worker()).workMotion,completed,'terminal holds without a second operation');
  if(action==='anvil-ready'){
   const heading=(await page.evaluate(()=>window.__controlsTest.getCameraAngles())).azimuth;
   await page.keyboard.down('q');await tick(400);await page.keyboard.up('q');
   assert.notEqual((await page.evaluate(()=>window.__controlsTest.getCameraAngles())).azimuth,heading,'ordinary camera turn');
   assert.deepEqual((await worker()).workMotion,completed,'fixed actor completion survives camera rotation');
   await page.screenshot({path:`${output}/day${day}-${action}-rotated.png`});
  }
  await page.evaluate(()=>window.__controlsTest.assignJob('grit',null));await tick();
  assert.equal((await worker()).workMotion,undefined,'cancellation releases the actor');
  await page.evaluate(()=>window.__controlsTest.teleportDwarf('grit',-1,-7));await tick();
  const stations=(await state()).workstations;
  assert.ok(stations.some(s=>s.id==='anvil'&&s.persistent));
  assert.ok(stations.some(s=>s.id==='repair-bench'&&s.persistent&&s.x===3&&s.z===-7));
  await page.screenshot({path:`${output}/day${day}-${action}-departed.png`});
  await page.evaluate(({x})=>{const t=window.__controlsTest;t.teleportDwarf('grit',x,-7);t.assignJob('grit','forge');},{x});
  await until(()=>Boolean(JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='grit')?.workMotion),'reassigned operation');
  assert.equal((await worker()).workMotion.frame,0,'explicit reassignment resets');
  await page.evaluate(()=>window.__controlsTest.resolveDay());await tick();
  assert.equal((await worker()).workMotion,undefined,'day completion releases motion');
  seen.push({day,action,x,sourceSha256:served.sourceSha256,atlasSha256:hash(atlas),calibrationSha256:hash(calibration),station,propSha256:hash(prop),naturalArrival:true,arrival,samples,completed,stations});
  await page.evaluate(()=>window.__controlsTest.nextMorning());await tick();
  console.log(`PASS forge day${day}: ${action}, live0-7, finite hold, cancellation, persistent stations, reassignment/day reset`);
 }
 assert.deepEqual(errors,[]);
 await writeFile(`${output}/results.json`,JSON.stringify({method:'Controlled clock, actual Three renderer and job/day controls. No direct animation frame mutation.',seen,errors,scope:'Four daily cosmetic forge operations over five days, including preparation and restoration of day1 forging. Resource and building rewards remain in existing day resolution, outside the animation controller.'},null,2)+'\n');
}finally{await browser.close();}
