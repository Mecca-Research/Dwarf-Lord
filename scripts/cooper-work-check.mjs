import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const output = process.env.REVIEW_OUTPUT ?? 'work/expanded-cycles/motion43/cooper-gameplay';
await mkdir(output, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } }), errors = [], seen = [];
  page.setDefaultTimeout(90000);
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  const now = new Date(); await page.clock.install({ time: now }); await page.clock.pauseAt(now);
  await page.goto(process.env.REVIEW_URL ?? 'http://localhost:8081/Dwarf-Lord/');
  const tick = async (ms = 16) => { await page.clock.fastForward(ms); await new Promise(r => setTimeout(r, 25)); };
  const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
  const worker = async () => (await state()).dwarves.find(d => d.id === 'brokk');
  const until = async (predicate, label) => {
    for (let n = 0; n < 500; n++) { if (await page.evaluate(predicate)) return; await tick(); }
    await page.screenshot({ path: `${output}/failure.png` }); throw Error(`Timed out: ${label}`);
  };
  await until(() => [...document.querySelectorAll('button')].some(b => b.textContent === 'Walk the road'), 'start');
  await page.getByRole('button', { name: 'Walk the road' }).click({ force: true });
  await until(() => Boolean(window.__controlsTest?.assignJob), 'scene');
  for (const [day, action, x, station] of [[1, 'fell-tree', -42, 'forestry-trunk'], [2, 'build-barrel', -36, 'cooper-barrel']]) {
    const folder = `public/sprites/Ginger/motion/${action}/actor`;
    const manifest = JSON.parse(readFileSync(`${folder}/manifest.json`));
    await page.evaluate(({ x }) => {
      const t = window.__controlsTest; t.teleport(x, 21); t.setZoomBias(12);
      t.teleportDwarf('brokk', x - 2, 18); t.assignJob('brokk', 'timber');
    }, { x });
    await until(() => Boolean(JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === 'brokk')?.workMotion), 'natural arrival');
    const served = await (await page.request.get(new URL(`sprites/Ginger/motion/${action}/actor/manifest.json`, page.url()).href)).json();
    assert.equal(served.sourceSha256, manifest.sourceSha256);
    const atlas = await (await page.request.get(new URL(`sprites/Ginger/motion/${action}/actor/atlas.png`, page.url()).href)).body();
    assert.equal(hash(atlas), hash(readFileSync(`${folder}/atlas.png`)));
    const calibration = await (await page.request.get(new URL('sprites/Ginger/motion/render-calibration.json', page.url()).href)).body();
    assert.equal(hash(calibration), hash(readFileSync('public/sprites/Ginger/motion/render-calibration.json')));
    const prop = await (await page.request.get(new URL(`sprites/workstations/${station}/sprite.png`, page.url()).href)).body();
    assert.equal(hash(prop), hash(readFileSync(`public/sprites/workstations/${station}/sprite.png`)));
    const arrival = await worker(); assert.ok(Math.hypot(arrival.x - x, arrival.z - 18) <= .51);
    const samples = [];
    for (let frame = 0; frame < 8; frame++) {
      const d = await worker(); assert.equal(d.anim, 'work'); assert.equal(d.workMotion.action, action);
      assert.equal(d.workMotion.frame, frame); assert.equal(d.workMotion.direction, 'actor'); samples.push(d.workMotion);
      await page.screenshot({ path: `${output}/${action}-${frame}.png` });
      await tick(manifest.frames[frame].durationMs);
    }
    const completed = (await worker()).workMotion;
    assert.equal(completed.completed, true); assert.equal(completed.completions, 1);
    await tick(5000); assert.deepEqual((await worker()).workMotion, completed, 'finished operation stays held');
    await page.keyboard.down('q'); await tick(200); await page.keyboard.up('q');
    assert.deepEqual((await worker()).workMotion, completed, 'fixed station view preserves completed task during camera rotation');
    await page.evaluate(() => window.__controlsTest.assignJob('brokk', null)); await tick();
    assert.equal((await worker()).workMotion, undefined, 'cancel releases actor');
    await page.evaluate(() => window.__controlsTest.teleportDwarf('brokk', -46, 18)); await tick();
    const stations = (await state()).workstations;
    assert.ok(stations.some(s => s.id === station && s.persistent && s.x === x && s.z === 18));
    await page.screenshot({ path: `${output}/${action}-departed.png` });
    await page.evaluate(({ x }) => {
      const t = window.__controlsTest; t.teleportDwarf('brokk', x, 18); t.assignJob('brokk', 'timber');
    }, { x });
    await until(() => Boolean(JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === 'brokk')?.workMotion), 'reassignment');
    assert.equal((await worker()).workMotion.frame, 0, 'explicit reassignment restarts0');
    await page.evaluate(() => window.__controlsTest.resolveDay()); await tick();
    assert.equal((await worker()).workMotion, undefined, 'resolved day releases action');
    seen.push({ day, action, x, station, naturalArrival: true, arrival, samples, completed, stations,
      sourceSha256: served.sourceSha256, atlasSha256: hash(atlas), calibrationSha256: hash(calibration), propSha256: hash(prop) });
    await page.evaluate(() => window.__controlsTest.nextMorning()); await tick();
    console.log(`PASS timber day${day}: ${action}, natural arrival, eight poses, held completion, camera turn, cancellation and reset`);
  }
  await page.evaluate(() => {
    const t = window.__controlsTest; t.teleportDwarf('brokk', -42, 18); t.assignJob('brokk', 'timber');
  });
  await until(() => JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === 'brokk')?.workMotion?.action === 'fell-tree', 'day3 forestry restoration');
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ method: 'Controlled clock and actual Three renderer. Job/day controls and natural arrival, without direct frame mutation.', seen, errors,
    day3Action: 'fell-tree', scope: 'Two finite daily timber activities at independent persistent stations. Barrel action reseats the same existing upper hoop twice; it does not fabricate barrels, create resources, certify another direction or approve a seamless loop.' }, null, 2) + '\n');
} finally { await browser.close(); }
