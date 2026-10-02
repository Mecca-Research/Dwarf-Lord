import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const output = 'work/expanded-cycles/runtime-browser';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [], assets = [];
  page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.log(m.type(), m.text()); if(m.type()==='error')errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.url().includes('/motion/walk/')) assets.push({ url: r.url(), status: r.status() }); if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(process.env.REVIEW_URL ?? 'http://localhost:8080/');
  await page.getByRole('button', { name: 'Walk the road' }).waitFor();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Walk the road' }).click();
  await page.waitForFunction(() => window.__controlsTest?.teleportDwarf);
  await page.waitForTimeout(10000);
  await page.evaluate(() => {
    const t = window.__controlsTest;
    t.teleport(0, 3); t.teleportDwarf('tam', -8, 3); t.setDwarfDest('tam', 8, 3);
    // Software WebGL can finish the first route before its asynchronous atlas
    // decode returns. Keep a route available while warming that same view.
    window.__motionWarmRoute=setInterval(()=>{
      const dwarf=JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='tam');
      if(dwarf?.motion?.loaded){clearInterval(window.__motionWarmRoute);return;}
      if(dwarf?.anim==='idle'){t.teleportDwarf('tam',-8,3);t.setDwarfDest('tam',8,3);}
    },1000);
  });
  try { await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === 'tam')?.motion?.loaded, null, { timeout: 90000 }); } catch(e) { console.log(await page.evaluate(() => window.render_game_to_text())); await page.screenshot({path: `${output}/failure.png`}); throw e; }
  const sample = () => page.evaluate(() => JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === 'tam'));
  const before = await sample(); await page.waitForTimeout(450); const after = await sample();
  assert.ok(after.motion.distance > before.motion.distance); assert.notEqual(after.motion.phase, before.motion.phase);
  // Start the measurement with a fresh full-length route after warming the atlas.
  // Otherwise a slow first decode can leave too little travel for 32 samples.
  await page.evaluate(()=>{const t=window.__controlsTest;t.teleportDwarf('tam',-8,3);t.setDwarfDest('tam',8,3);});
  await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='tam')?.motion?.loaded);
  const plantSamples = await page.evaluate(() => new Promise(resolve => {
    const samples=[];
    let routePass=0,finished=false;
    const finish=()=>{finished=true;clearTimeout(timeout);resolve(samples);};
    const timeout=setTimeout(finish,60000);
    function sample() {
      if(finished)return;
      const dwarf=JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='tam');
      if(dwarf?.motion?.loaded)samples.push({routePass,x:dwarf.x,z:dwarf.z,...dwarf.motion});
      // A slow software renderer can finish sixteen units of travel in fewer
      // than32 rendered frames. Repeat the same warmed route to finish the
      // sample window; never compare planted roots across a teleport.
      if(dwarf?.anim==='idle'){
        routePass++;
        const t=window.__controlsTest;t.teleportDwarf('tam',-8,3);t.setDwarfDest('tam',8,3);
      }
      if(samples.length>=32)finish();else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }));
  assert.equal(plantSamples.length,32,'held-pose review needs a full sample window');
  let movingHolds=0;
  for(let i=1;i<plantSamples.length;i++){
    const previous=plantSamples[i-1],current=plantSamples[i];
    if(previous.routePass===current.routePass&&previous.frame===current.frame&&previous.direction===current.direction){
      assert.deepEqual(current.visualRoot,previous.visualRoot,'visible walking pose stays planted during a held frame');
      if(Math.hypot(current.x-previous.x,current.z-previous.z)>1e-6)movingHolds++;
    }
  }
  assert.ok(movingHolds>0,'probe covers actual physical movement inside a held frame');
  await page.screenshot({ path: `${output}/walking.png` });
  await page.evaluate(() => window.__controlsTest.setDwarfDest('tam', -10, 3));
  await page.waitForFunction(old => { const m = JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === 'tam')?.motion; return m?.loaded && m.direction !== old; }, before.motion.direction);
  const turned = await sample(); assert.notEqual(turned.facing, before.facing);
  // Walk into the known solid hall at (-11,-5); blocked actors must stop cycling.
  await page.evaluate(() => { const t = window.__controlsTest; t.teleportDwarf('tam', -6, -5); t.setDwarfDest('tam', -11, -5); });
  await page.waitForFunction(() => { const d = JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === 'tam'); return d?.motion?.loaded && d.anim === 'walk' && d.speed < .001; }, null, { timeout: 15000 });
  const blocked = await sample(); await page.waitForTimeout(500); const held = await sample();
  assert.equal(held.motion.phase, blocked.motion.phase); assert.equal(held.motion.distance, blocked.motion.distance);
  await page.evaluate(() => { const t = window.__controlsTest; t.teleportDwarf('tam', -8, 3); t.setDwarfDest('tam', -7, 3); });
  await page.waitForFunction(() => { const d = JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === 'tam'); return d && d.anim !== 'walk' && !d.motion; });
  await page.screenshot({ path: `${output}/arrived.png` });
  // A work assignment must release its route and visual state on cancellation/completion.
  await page.evaluate(() => {
    const t = window.__controlsTest; t.teleportDwarf('tam', -40, 18); t.assignJob('tam', 'timber');
  });
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === 'tam')?.anim === 'work');
  await page.evaluate(() => window.__controlsTest.assignJob('tam', null));
  await page.waitForFunction(() => { const d = JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === 'tam'); return d?.anim === 'idle' && !d.dest; });
  await page.evaluate(() => window.__controlsTest.assignJob('tam', 'timber'));
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === 'tam')?.anim === 'work');
  await page.evaluate(() => window.__controlsTest.resolveDay());
  await page.waitForFunction(() => { const d = JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === 'tam'); return d?.anim === 'idle' && !d.dest; });
  await page.evaluate(() => window.__controlsTest.nextMorning());
  await page.waitForTimeout(200);
  assert.equal((await sample()).anim, 'idle', 'morning does not restore completed work');
  await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='borrin')?.workMotion?.completed);
  const consultant=await page.evaluate(()=>JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='borrin'));
  assert.equal(consultant.workMotion.action,'desk-writing');assert.equal(consultant.workMotion.completions,1);
  await page.evaluate(()=>window.__controlsTest.teleport(10,13));await page.waitForTimeout(1600);
  await page.screenshot({path:`${output}/borrin-desk.png`});
  await page.evaluate(()=>window.__controlsTest.teleportDwarf('borrin',20,10));
  await page.waitForFunction(()=>!JSON.parse(window.render_game_to_text()).dwarves.find(d=>d.id==='borrin')?.workMotion);
  assert.equal(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).workstations.find(s=>s.id==='ledger-desk')?.persistent),true);
  await page.screenshot({path:`${output}/borrin-empty-desk.png`});
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ before, after, turned, blocked, held, consultant, plantSamples, movingHolds, assets, errors }, null, 2));
  console.log('PASS NPC atlas loading, displacement-driven walking, turning, collision freeze, idle fallback, work cancellation and day completion');
} finally { await browser.close(); }
