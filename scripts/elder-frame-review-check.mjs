import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

// Freeze browser time, not animation state. The real renderer, work controller,
// atlas loading and authored timings run normally on each controlled RAF.
const output = process.env.REVIEW_OUTPUT ?? 'work/expanded-cycles/elder-frame-review';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
  const errors = [], assets = [], seen = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => {
    if (response.url().includes('/Elder/motion/')) assets.push({ url: response.url(), status: response.status() });
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  const now = new Date();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now);
  await page.goto(process.env.REVIEW_URL ?? 'http://localhost:8081/Dwarf-Lord/');
  const tick = async (ms = 16) => {
    await page.clock.fastForward(ms);
    // Network/decode progress is real asynchronous work, independent of time.
    await new Promise(resolve => setTimeout(resolve, 25));
  };
  const until = async (predicate, description) => {
    for (let attempt = 0; attempt < 200; attempt++) {
      if (await page.evaluate(predicate)) return;
      await tick();
    }
    throw new Error(`Timed out waiting for ${description}`);
  };
  await until(() => [...document.querySelectorAll('button')].some(button => button.textContent === 'Walk the road'), 'start button');
  await page.getByRole('button', { name: 'Walk the road' }).click({ force: true });
  await until(() => Boolean(window.__controlsTest?.teleportDwarf), 'live scene controls');
  const elder = () => page.evaluate(() => JSON.parse(window.render_game_to_text()).dwarves.find(dwarf => dwarf.id === 'elder'));
  const home = await elder();
  await page.evaluate(() => window.__controlsTest.teleportDwarf('elder', 20, 10));
  await tick();
  assert.equal((await elder()).workMotion, undefined, 'departure releases the seated activity');
  await page.evaluate(({ x, z }) => {
    window.__controlsTest.teleport(x + 1, z + 2);
    window.__controlsTest.teleportDwarf('elder', x, z);
  }, home);
  const actions = ['eat-stew', 'eat-bread', 'laugh-seated', 'laugh-and-gesture', 'inspect-pickaxe-in-lap', 'examine-pickaxe-crack'];
  for (const action of actions) {
    // Keep frame0 visible while a manifest or atlas is decoding.
    for (let attempt = 0; attempt < 200; attempt++) {
      if ((await elder()).workMotion?.action === action) break;
      await tick();
    }
    const samples = [];
    for (let frame = 0; frame < 8; frame++) {
      const body = await elder(), motion = body.workMotion;
      assert.equal(motion?.action, action);
      assert.equal(motion.frame, frame, `${action}: every authored live pose must be visible`);
      samples.push(motion);
      if ([0, 2, 4, 7].includes(frame)) await page.screenshot({ path: `${output}/${action}-${frame}.png` });
      await tick(125);
    }
    const completed = (await elder()).workMotion;
    assert.equal(completed.completed, true);
    assert.equal(completed.frame, 7);
    assert.equal(completed.completions, 1);
    seen.push({ action, frames: samples.map(sample => sample.frame), samples, completed });
    console.log(`Reviewed ${action}: live frames0-7 and one completion`);
    await tick(2000);
    assert.ok((await elder()).workMotion, 'preloaded handoff holds a displayed work pose');
    await tick();
  }
  await tick(5000);
  const final = (await elder()).workMotion;
  assert.equal(final.action, actions.at(-1));
  assert.equal(final.frame, 7);
  assert.equal(final.completions, 1);
  await page.evaluate(() => window.__controlsTest.teleportDwarf('elder', 20, 10));
  await tick();
  assert.equal((await elder()).workMotion, undefined);
  await page.evaluate(({ x, z }) => window.__controlsTest.teleportDwarf('elder', x, z), home);
  await until(() => JSON.parse(window.render_game_to_text()).dwarves.find(dwarf => dwarf.id === 'elder')?.workMotion?.action === 'eat-stew', 'reset first activity');
  assert.equal((await elder()).workMotion.frame, 0);
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ method: 'Controlled browser clock; actual renderer and unchanged authored125ms frame timing', seen, final, assets, errors, scope: 'Complete live pose coverage and once-hold lifecycle. Moving foot/cane contacts and pickaxe geometry are separate art reviews.' }, null, 2));
  console.log('PASS all48 live Elder seated poses, once-hold completion, terminal hold and departure reset');
} finally {
  await browser.close();
}
