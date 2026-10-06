import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const output=process.env.REVIEW_OUTPUT??'work/expanded-cycles/motion41/consultant-gameplay';
await mkdir(output,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
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
 const actor=async()=>(await state()).dwarves.find(d=>d.id==='borrin');
 const until=async(predicate,label)=>{for(let n=0;n<300;n++){if(await page.evaluate(predicate))return;await tick();}throw Error(`Timed out: ${label}`);};
 await until(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Walk the road'),'start');
 await page.getByRole('button',{name:'Walk the road'}).click({force:true});
 await until(()=>Boolean(window.__controlsTest?.teleportDwarf),'scene');
 for(const [day,action] of [[1,'desk-writing'],[2,'count-coins'],[3,'review-open-ledger'],[4,'explain-at-desk'],[5,'stamp-paperwork'],[6,'explain-closed-ledger']]) {
  const manifest=JSON.parse(readFileSync(`public/sprites/Borrin/motion/${action}/actor/manifest.json`));
  // Leaving and returning uses ordinary seated eligibility, never a frame setter.
  await page.evaluate(()=>{const t=window.__controlsTest;t.teleport(10,13);t.setZoomBias(12);t.teleportDwarf('borrin',20,10);});await tick();
  assert.equal((await actor()).workMotion,undefined);
  await page.evaluate(()=>window.__controlsTest.teleportDwarf('borrin',10,10));
  await until(()=>Boolean(JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='borrin')?.workMotion),'seated consultant');
  const served=await (await page.request.get(new URL(`sprites/Borrin/motion/${action}/actor/manifest.json`,page.url()).href)).json();
  assert.equal(served.sourceSha256,manifest.sourceSha256);
  const atlas=await (await page.request.get(new URL(`sprites/Borrin/motion/${action}/actor/atlas.png`,page.url()).href)).body();
  assert.equal(hash(atlas),hash(readFileSync(`public/sprites/Borrin/motion/${action}/actor/atlas.png`)));
  const calibration=await (await page.request.get(new URL('sprites/Borrin/motion/render-calibration.json',page.url()).href)).body();
  assert.equal(hash(calibration),hash(readFileSync('public/sprites/Borrin/motion/render-calibration.json')));
  const prop=await (await page.request.get(new URL('sprites/workstations/ledger-desk/sprite.png',page.url()).href)).body();
  assert.equal(hash(prop),hash(readFileSync('public/sprites/workstations/ledger-desk/sprite.png')));
  const samples=[];
  for(let frame=0;frame<8;frame++) {
   const d=await actor();assert.equal(d.anim,'sit');assert.equal(d.workMotion.action,action);assert.equal(d.workMotion.frame,frame);
   assert.equal(d.workMotion.direction,'actor');samples.push(d.workMotion);
   await page.screenshot({path:`${output}/${action}-${frame}.png`});
   await tick(manifest.frames[frame].durationMs);
  }
  const completed=(await actor()).workMotion;assert.equal(completed.completed,true);assert.equal(completed.completions,1);
  await tick(5000);assert.deepEqual((await actor()).workMotion,completed,'finished activity stays held');
  const cameraBefore=await page.evaluate(()=>window.__controlsTest.getCameraAngles());
  await page.keyboard.down('q');await tick(400);await page.keyboard.up('q');
  const cameraAfter=await page.evaluate(()=>window.__controlsTest.getCameraAngles());
  assert.notEqual(cameraAfter.azimuth,cameraBefore.azimuth,'camera turns through the ordinary control');
  assert.deepEqual((await actor()).workMotion,completed,'camera turn preserves completed fixed-view actor');
  await page.screenshot({path:`${output}/${action}-rotated.png`});
  // A forbidden production assignment cannot create worker capability or change his activity.
  await page.evaluate(()=>window.__controlsTest.assignJob('borrin','forge'));await tick();
  assert.deepEqual((await actor()).workMotion,completed,'consultant stays outside production assignments');
  await page.evaluate(()=>window.__controlsTest.teleportDwarf('borrin',20,10));await tick();
  assert.equal((await actor()).workMotion,undefined,'departure releases the seated actor');
  const desk=(await state()).workstations.find(s=>s.id==='ledger-desk');assert.equal(desk.persistent,true);
  await page.screenshot({path:`${output}/${action}-departed.png`});
  await page.evaluate(()=>window.__controlsTest.teleportDwarf('borrin',10,10));
  await until(()=>Boolean(JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='borrin')?.workMotion),'return');
  assert.equal((await actor()).workMotion.frame,0,'explicit return restarts0');
  await tick(2000);const beforeResolution=(await actor()).workMotion;
  await page.evaluate(()=>window.__controlsTest.resolveDay());await tick();
  assert.deepEqual((await actor()).workMotion,beforeResolution,'cosmetic consultant remains available after production day resolution');
  seen.push({day,action,sourceSha256:served.sourceSha256,atlasSha256:hash(atlas),calibrationSha256:hash(calibration),propSha256:hash(prop),samples,completed,desk,cameraBefore,cameraAfter});
  await page.evaluate(()=>window.__controlsTest.nextMorning());await tick();
  console.log(`PASS consultant day${day}: ${action}, eight poses, completion hold, departure/return, persistent desk, no production assignment and morning selection`);
 }
 await until(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='borrin')?.workMotion?.action==='desk-writing','day7 writing');
 assert.deepEqual(errors,[]);
 await writeFile(`${output}/results.json`,JSON.stringify({method:'Controlled clock and actual Three renderer; home eligibility/day controls, without direct frame mutation.',seen,errors,scope:'Six finite cosmetic consultant activities, including standing explanation with an already held closed ledger. Coin, stamp and closed book remain actor-owned; open desk book/stacks/ink/receipt remain independently persistent. No pickup/put-down, seat-to-stand transition, coin deposit, minting, ink-mark state, economic transaction, seamless loop or moving sole certification.'},null,2)+'\n');
} finally {await browser.close();}
