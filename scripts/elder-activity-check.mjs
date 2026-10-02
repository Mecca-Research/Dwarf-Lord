import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const output = process.env.REVIEW_OUTPUT ?? 'work/expanded-cycles/elder-live';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: process.env.HEADED !== '1', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
  const errors = [], assets = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => {
    if (response.url().includes('/Elder/motion/')) assets.push({ url: response.url(), status: response.status() });
    if (response.status() >= 400) errors.push(response.status() + ' ' + response.url());
  });
  await page.goto(process.env.REVIEW_URL ?? 'http://localhost:8081/Dwarf-Lord/');
  await page.getByRole('button', { name: 'Walk the road' }).click();
  await page.waitForFunction(() => window.__controlsTest?.teleportDwarf);
  const home = await page.evaluate(() => {
    const dwarf = JSON.parse(window.render_game_to_text()).dwarves.find(dwarf => dwarf.id === 'elder');
    return { x: dwarf.x, z: dwarf.z };
  });
  await page.evaluate(() => window.__controlsTest.teleportDwarf('elder', 20, 10));
  await page.waitForFunction(() => !JSON.parse(window.render_game_to_text()).dwarves.find(dwarf => dwarf.id === 'elder').workMotion);
  // Record before returning. Separate round trips to wait for short actions
  // can miss an entire action on a busy software renderer.
  await page.evaluate(({ x, z }) => {
    window.__elderFrames = [];
    window.__elderRecording = true;
    let loaded = false;
    const record = () => {
      if (!window.__elderRecording) return;
      const motion = JSON.parse(window.render_game_to_text()).dwarves.find(dwarf => dwarf.id === 'elder')?.workMotion;
      loaded ||= Boolean(motion);
      if (loaded) window.__elderFrames.push(motion ?? null);
      requestAnimationFrame(record);
    };
    requestAnimationFrame(record);
    window.__controlsTest.teleport(x + 1, z + 2);
    window.__controlsTest.teleportDwarf('elder', x, z);
  }, home);
  await page.waitForFunction(() => {
    const motion = JSON.parse(window.render_game_to_text()).dwarves.find(dwarf => dwarf.id === 'elder')?.workMotion;
    return motion?.action === 'examine-pickaxe-crack' && motion.completed;
  }, null, { timeout: 120000 });
  await page.waitForTimeout(2500);
  const handoffs = await page.evaluate(() => { window.__elderRecording = false; return window.__elderFrames; });
  assert.ok(handoffs.length > 8);
  assert.ok(handoffs.every(Boolean), 'preloaded activity handoffs must not flash idle');
  const actions = ['eat-stew', 'eat-bread', 'laugh-seated', 'laugh-and-gesture', 'inspect-pickaxe-in-lap', 'examine-pickaxe-crack'];
  const seen = actions.map(action => {
    const samples = handoffs.filter(sample => sample.action === action);
    assert.ok(samples.length > 0, action + ': activity must be recorded');
    const completed = samples.find(sample => sample.completed);
    assert.ok(completed, action + ': completed pose must be held');
    assert.equal(completed.frame, 7);
    assert.equal(completed.completions, 1);
    return { action, frames: [...new Set(samples.map(sample => sample.frame))], samples, completed };
  });
  // Full pose coverage is checked separately with controlled browser time.
  const final = await page.evaluate(() => JSON.parse(window.render_game_to_text()).dwarves.find(dwarf => dwarf.id === 'elder'));
  assert.equal(final.workMotion.action, actions.at(-1));
  assert.equal(final.workMotion.completions, 1);
  await page.screenshot({ path: output + '/terminal-camp.png' });
  await page.evaluate(() => window.__controlsTest.teleportDwarf('elder', 20, 10));
  await page.waitForFunction(() => !JSON.parse(window.render_game_to_text()).dwarves.find(dwarf => dwarf.id === 'elder').workMotion);
  await page.evaluate(({ x, z }) => {
    window.__elderReset = [];
    const record = () => {
      const motion = JSON.parse(window.render_game_to_text()).dwarves.find(dwarf => dwarf.id === 'elder')?.workMotion;
      if (motion) { window.__elderReset.push(motion); return; }
      requestAnimationFrame(record);
    };
    requestAnimationFrame(record);
    window.__controlsTest.teleportDwarf('elder', x, z);
  }, home);
  await page.waitForFunction(() => window.__elderReset.length > 0);
  assert.equal(await page.evaluate(() => window.__elderReset[0].action), 'eat-stew');
  assert.deepEqual(errors, []);
  await writeFile(output + '/results.json', JSON.stringify({ seen, home, assets, errors, final, handoffs, scope: 'Natural-time six-action activation, once-hold completion, terminal hold, continuous displayed handoff and departure/reset. Complete pose coverage uses the controlled-clock review; anatomical walking/tool geometry is separate.' }, null, 2));
  console.log('PASS all six natural-time Elder activities, held completions, no idle handoff and departure reset');
} finally {
  await browser.close();
}
