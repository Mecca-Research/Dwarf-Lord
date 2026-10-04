import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const output=process.env.REVIEW_OUTPUT??'work/expanded-cycles/motion40/cooking-gameplay';
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
 const worker=async()=>(await state()).dwarves.find(d=>d.id==='kori');
 const until=async(predicate,label)=>{for(let n=0;n<300;n++){if(await page.evaluate(predicate))return;await tick();}throw Error(`Timed out: ${label}`);};
 await until(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Walk the road'),'start');
 await page.getByRole('button',{name:'Walk the road'}).click({force:true});
 await until(()=>Boolean(window.__controlsTest?.assignJob),'scene');
 const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
 for(const [day,action,x,station] of [[1,'chop-vegetables',-.5,'cutting-block'],[2,'peel-potatoes',-3.5,'potato-block']]) {
  const manifest=JSON.parse(readFileSync(`public/sprites/Cook/motion/${action}/actor/manifest.json`));
  await page.evaluate(({x,day})=>{const t=window.__controlsTest;t.teleport(-1,2);t.teleportDwarf('kori',x,day===2?6:4.5);t.assignJob('kori','meals');},{x,day});
  await until(()=>Boolean(JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='kori')?.workMotion),'loaded meal operation');
  const served=await (await page.request.get(new URL(`sprites/Cook/motion/${action}/actor/manifest.json`,page.url()).href)).json();
  assert.equal(served.sourceSha256,manifest.sourceSha256,'selected meal art is served');
  const atlas=await (await page.request.get(new URL(`sprites/Cook/motion/${action}/actor/atlas.png`,page.url()).href)).body();
  assert.equal(hash(atlas),hash(readFileSync(`public/sprites/Cook/motion/${action}/actor/atlas.png`)));
  const servedCalibration=await (await page.request.get(new URL('sprites/Cook/motion/render-calibration.json',page.url()).href)).body();
  assert.equal(hash(servedCalibration),hash(readFileSync('public/sprites/Cook/motion/render-calibration.json')),'current foreground contours are served');
  const prop=await (await page.request.get(new URL(`sprites/workstations/${station}/sprite.png`,page.url()).href)).body();
  assert.equal(hash(prop),hash(readFileSync(`public/sprites/workstations/${station}/sprite.png`)));
  const arrival=await worker();assert.ok(Math.hypot(arrival.x-x,arrival.z-4.5)<=.51,'arrival at the operation target');
  const samples=[];
  for(let frame=0;frame<8;frame++) {
   const d=await worker();assert.equal(d.workMotion.action,action);assert.equal(d.workMotion.frame,frame);
   assert.equal(d.workMotion.direction,'actor');samples.push(d.workMotion);
   if([0,2,4,7].includes(frame))await page.screenshot({path:`${output}/${action}-${frame}.png`});
   await tick(manifest.frames[frame].durationMs);
  }
  const completed=(await worker()).workMotion;
  assert.equal(completed.completed,true);assert.equal(completed.completions,1);
  await tick(5000);assert.deepEqual((await worker()).workMotion,completed,'terminal does not start another meal operation');
  await page.evaluate(()=>window.__controlsTest.assignJob('kori',null));await tick();
  assert.equal((await worker()).workMotion,undefined,'cancel releases actor');
  await page.evaluate(()=>window.__controlsTest.teleportDwarf('kori',-1,8));await tick();
  const stations=(await state()).workstations;
  assert.ok(stations.some(s=>s.id==='cutting-block'&&s.persistent));
  assert.ok(stations.some(s=>s.id==='potato-block'&&s.persistent&&s.x===-3.5&&s.z===4.5));
  await page.screenshot({path:`${output}/${action}-departed.png`});
  await page.evaluate(({x})=>{const t=window.__controlsTest;t.teleportDwarf('kori',x,4.5);t.assignJob('kori','meals');},{x});
  await until(()=>Boolean(JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='kori')?.workMotion),'reassigned meal operation');
  assert.equal((await worker()).workMotion.frame,0,'reassignment starts at0');
  await page.evaluate(()=>window.__controlsTest.resolveDay());await tick();
  assert.equal((await worker()).workMotion,undefined,'resolved day releases motion');
  seen.push({day,action,x,station,sourceSha256:served.sourceSha256,atlasSha256:hash(atlas),
   calibrationSha256:hash(servedCalibration),propSha256:hash(prop),naturalArrival:day===2,arrival,samples,completed,stations});
  await page.evaluate(()=>window.__controlsTest.nextMorning());await tick();
  console.log(`PASS meal day${day}: ${action}, live0-7, finite hold, cancellation, persistent props and reassignment/day reset`);
 }
 assert.deepEqual(errors,[]);
 await writeFile(`${output}/results.json`,JSON.stringify({method:'Controlled clock and actual Three renderer; job/day controls, with no direct animation frame mutation.',seen,errors,
  scope:'Two daily cosmetic meal preparation operations, source/atlas/calibration/prop hashes and natural potato-block arrival. Economic output remains in existing day resolution.'},null,2)+'\n');
}finally{await browser.close();}
