import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const output = 'work/expanded-cycles/motion34/runtime';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: process.env.HEADED !== '1', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [], consoleMessages = [], assets = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) consoleMessages.push(message.text()); });
  page.on('response', response => {
    if (response.url().includes('/motion/walk/')) {
      assets.push({ url: response.url(), status: response.status() });
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    }
  });
  const url = process.env.GAME_URL ?? 'http://localhost:8081/Dwarf-Lord/';
  await page.goto(url); await page.getByRole('button', { name: 'Walk the road' }).click();
  await page.waitForFunction(() => window.__controlsTest?.teleportDwarf);
  await page.waitForTimeout(10000);
  const results = [];
  for (const spec of [
    { id: 'tam', name: 'Laborer', direction: 'back-left', start: [0, 12], end: [-1, -4] },
    { id: 'grit', name: 'Blacksmith', direction: 'right', start: [-8, 2], end: [4, 12] },
  ]) {
    const route = () => page.evaluate(spec => {
      const test = window.__controlsTest;
      test.teleport(0, 5); test.assignJob(spec.id, null);
      test.teleportDwarf(spec.id, ...spec.start); test.setDwarfDest(spec.id, ...spec.end);
    }, spec);
    await route();
    await page.evaluate(spec => {
      window.__pilotWarm = setInterval(() => {
        const dwarf = JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === spec.id);
        if (dwarf?.motion?.loaded && dwarf.motion.direction === spec.direction) { clearInterval(window.__pilotWarm); return; }
        if (dwarf?.anim !== 'walk') {
          window.__controlsTest.teleportDwarf(spec.id, ...spec.start);
          window.__controlsTest.setDwarfDest(spec.id, ...spec.end);
        }
      }, 500);
    }, spec);
    await page.waitForFunction(spec => {
      const dwarf = JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === spec.id);
      return dwarf?.motion?.loaded && dwarf.motion.direction === spec.direction;
    }, spec, { timeout: 60000 });
    const manifestURL = new URL(`sprites/${spec.name}/motion/walk/${spec.direction}/manifest.json`, url).href;
    const exported = await (await page.request.get(manifestURL)).json();
    const local = JSON.parse(await readFile(`public/sprites/${spec.name}/motion/walk/${spec.direction}/manifest.json`, 'utf8'));
    assert.equal(exported.sourceSha256, local.sourceSha256, 'game serves current reviewed source');
    const atlasURL = new URL(exported.atlas.file, manifestURL).href;
    const atlas = await (await page.request.get(atlasURL)).body();
    assert.equal(createHash('sha256').update(atlas).digest('hex'), createHash('sha256').update(await readFile(`public/sprites/${spec.name}/motion/walk/${spec.direction}/${local.atlas.file}`)).digest('hex'));
    await route();
    const samples = await page.evaluate(spec => new Promise(resolve => {
      const samples = [];
      const timeout = setTimeout(() => resolve(samples), 60000);
      function collect() {
        const dwarf = JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === spec.id);
        if (dwarf?.motion?.loaded && dwarf.motion.direction === spec.direction) samples.push({ x: dwarf.x, z: dwarf.z, ...dwarf.motion });
        if (samples.length >= 64) { clearTimeout(timeout); resolve(samples); }
        else requestAnimationFrame(collect);
      }
      requestAnimationFrame(collect);
    }), spec);
    assert.equal(samples.length, 64);
    let movingHolds = 0;
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1], b = samples[i];
      if (a.frame !== b.frame || b.phase < a.phase || b.distance <= a.distance) continue;
      movingHolds++;
      assert.ok(Math.hypot(b.visualRoot[0] - a.visualRoot[0], b.visualRoot[1] - a.visualRoot[1]) < 1e-8);
    }
    assert.ok(movingHolds > 0);
    assert.deepEqual([...new Set(samples.map(s => s.frame))].sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
    assert.ok(samples.some((sample, i) => i && sample.phase < samples[i - 1].phase), 'covers a loop return during travel');
    await page.screenshot({ path: `${output}/${spec.name.toLowerCase()}-${spec.direction}.png` });
    results.push({ ...spec, sourceSha256: local.sourceSha256, samples, movingHolds,
      scope: 'Current atlas, all eight frame selections, runtime held-root stability and phase return only. No anatomical foot, ground-contact or full-stride approval.' });
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ results, errors, consoleMessages, assets }, null, 2));
  console.log('PASS: Current Laborer rear-left and Blacksmith right atlases, eight poses, moving holds and phase returns. Anatomical acceptance remains open.');
} finally {
  await browser.close();
}
