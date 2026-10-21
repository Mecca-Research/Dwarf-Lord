import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const output = process.env.REVIEW_OUTPUT ?? 'work/expanded-cycles/stride-renderer-review';
const observations = JSON.parse(await readFile(process.env.STRIDE_OBSERVATIONS ?? 'docs/blacksmith-right-whole-stride-observations.json'));
const direction = observations.binding.direction;
assert.ok(['right', 'left'].includes(direction), 'This route reviews Blacksmith lateral views only');
const sign = direction === 'right' ? 1 : -1;
const manifest = JSON.parse(await readFile(`${observations.folder}/manifest.json`));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 560 } });
  const errors = [], assets = [], holds = [], boundaries = [], screenshots = new Set();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const now = new Date(); await page.clock.install({ time: now }); await page.clock.pauseAt(now);
  const url = process.env.REVIEW_URL ?? 'http://localhost:8081/Dwarf-Lord/';
  await page.goto(url);
  const tick = async (ms = 16) => { await page.clock.fastForward(ms); await new Promise(resolve => setTimeout(resolve, 20)); };
  const until = async (predicate, description) => {
    for (let i = 0; i < 250; i++) { if (await page.evaluate(predicate)) return; await tick(); }
    throw new Error(`Timed out waiting for ${description}`);
  };
  await until(() => [...document.querySelectorAll('button')].some(button => button.textContent === 'Walk the road'), 'start button');
  await page.getByRole('button', { name: 'Walk the road' }).click({ force: true });
  await until(() => Boolean(window.__controlsTest?.projectDwarfSprite), 'sprite geometry probe');
  for (let i = 0; i < 20; i++) await tick(100);
  const route = () => page.evaluate(({sign}) => {
    const t = window.__controlsTest, { azimuth } = t.getCameraAngles();
    t.teleport(0, 5); t.assignJob('grit', null);
    const start = sign === 1 ? [-8, 2] : [-8 + 14 * Math.cos(azimuth), 2 - 14 * Math.sin(azimuth)];
    const end = sign === 1 ? [-8 + 14 * Math.cos(azimuth), 2 - 14 * Math.sin(azimuth)] : [-8, 2];
    t.teleportDwarf('grit', ...start); t.setDwarfDest('grit', ...end);
  }, {sign});
  await route();
  await until(() => JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === 'grit')?.motion?.loaded, 'Blacksmith atlas');
  const served = await (await page.request.get(new URL(`sprites/Blacksmith/motion/walk/${direction}/manifest.json`, url).href)).json();
  assert.deepEqual(served.travelCalibration, manifest.travelCalibration);
  const atlas = await (await page.request.get(new URL(`sprites/Blacksmith/motion/walk/${direction}/atlas.png`, url).href)).body();
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash(atlas), hash(await readFile(`${observations.folder}/atlas.png`)));
  assets.push({ sourceSha256: served.sourceSha256, atlasSha256: hash(atlas), travelCalibration: served.travelCalibration });
  // Separate the deliberate review teleport from a new walking start. The
  // renderer must observe idle so arrival/reset, rather than an old partial
  // stride, establishes the new phase. Normal loading is still exercised.
  await page.evaluate(({sign}) => {
    const t=window.__controlsTest,{azimuth}=t.getCameraAngles();
    const start=sign===1?[-8,2]:[-8+14*Math.cos(azimuth),2-14*Math.sin(azimuth)];
    t.teleportDwarf('grit',...start);
  }, {sign}); await tick();
  await route(); let previous = null, active = false;
  for (let i = 0; i < 360 && boundaries.length < 24; i++) {
    await tick();
    const sample = await page.evaluate(({ transitions, previous, direction }) => {
      const dwarf = JSON.parse(window.render_game_to_text()).dwarves.find(d => d.id === 'grit');
      if (!dwarf?.motion?.loaded || dwarf.motion.direction !== direction) return null;
      const t = window.__controlsTest, frame = dwarf.motion.frame;
      const outgoing = t.projectDwarfSprite('grit', transitions[frame].fromPoint);
      const contact = previous && t.projectDwarfSprite('grit',
        frame === previous.frame ? transitions[frame].fromPoint : transitions[previous.frame].toPoint, previous.world);
      return { ...outgoing, contact, x: dwarf.x, z: dwarf.z, motion: dwarf.motion };
    }, { transitions: observations.transitions, previous, direction });
    if (!sample) continue;
    assert.equal(sample.motion.strideBodyRatio, manifest.travelCalibration.strideBodyRatio);
    if (!active) { if (sample.frame !== 0) continue; active = true; }
    if (!screenshots.has(sample.frame)) { screenshots.add(sample.frame); await page.screenshot({ path: `${output}/frame-${sample.frame}.png` }); }
    if (previous) {
      const p = sample.contact, residual = Math.hypot(p.screen[0] - p.referenceScreen[0], p.screen[1] - p.referenceScreen[1]) * 520 / p.bodyPixels;
      if (sample.frame === previous.frame) {
        const moved = Math.hypot(sample.x - previous.x, sample.z - previous.z);
        holds.push({ frame: sample.frame, moved, contactDriftSpritePx: residual });
      } else {
        assert.equal(sample.frame, (previous.frame + 1) % 8, 'small real-time steps must expose every boundary');
        boundaries.push({ from: previous.frame, to: sample.frame, contactJumpSpritePx: residual,
          before: previous, after: sample });
      }
    }
    previous = sample;
  }
  assert.ok(holds.filter(hold => hold.moved > 0).length >= 8);
  assert.equal(boundaries.length, 24, 'three complete strides including return');
  assert.deepEqual([...screenshots].sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ method: 'Actual rendered mesh matrices and camera, matching visible material marks. Camera movement compensated by reprojecting the prior world contact.',
    sourceBinding: observations.binding, assets, holds, boundaries, errors,
    maxHeldDriftSpritePx: Math.max(...holds.map(hold => hold.contactDriftSpritePx)),
    maxBoundaryJumpSpritePx: Math.max(...boundaries.map(boundary => boundary.contactJumpSpritePx)),
    scope: `Blacksmith ${direction}-view flat-ground material contacts across three complete strides; camera turns, terrain and other views are separate.` }, null, 2));
  assert.ok(holds.every(hold => hold.contactDriftSpritePx < .5), 'rendered material must remain planted through held frames');
  assert.ok(boundaries.every(boundary => boundary.contactJumpSpritePx <= 6), 'rendered material must match across every boundary within 6px');
  console.log(`PASS Blacksmith ${direction}: three complete rendered strides; ${holds.length} held-material samples; max boundary ${Math.max(...boundaries.map(boundary => boundary.contactJumpSpritePx)).toFixed(3)} sprite px`);
} catch (error) {
  console.error(error); throw error;
} finally { await browser.close(); }
