import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'work/expanded-cycles/motion34/browser';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1050 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const ready = () => page.waitForFunction(() => window.render_game_to_text && !JSON.parse(window.render_game_to_text()).loading);
  await page.goto(process.env.REVIEW_URL ?? 'http://localhost:8081/Dwarf-Lord/motion-review.html');
  await ready();
  const reports = [];
  for (const [name, direction] of [['Laborer', 'back-left'], ['Blacksmith', 'right']]) {
    await page.selectOption('#character', { label: name }); await ready();
    const action = await page.locator('#action option').evaluateAll((options, dir) =>
      options.find(option => option.textContent === `Walking cycle · ${dir}`)?.value, direction);
    assert.ok(action, `${name} ${direction} walk available`);
    await page.selectOption('#action', action); await ready();
    await page.check('#travel');
    const samples = await page.evaluate(() => {
      document.querySelector('#travel-speed').value = '.8';
      document.querySelector('#stride').value = '1.2';
      document.querySelector('#restart').click();
      document.querySelector('#play').click();
      const states = [];
      for (let i = 0; i < 4; i++) { window.advanceTime(10); states.push(JSON.parse(window.render_game_to_text())); }
      document.querySelector('#play').click();
      return states;
    });
    assert.ok(samples.every(sample => sample.index === 0));
    const angle = ['front', 'front-right', 'right', 'back-right', 'back', 'back-left', 'left', 'front-left'].indexOf(direction) * Math.PI / 4;
    const axis = [Math.sin(angle), Math.cos(angle) * Math.sin(.6)];
    const roots = samples.map(sample => axis.map((value, i) => sample.distance * 380 * value + sample.heldRootOffset[i]));
    for (const root of roots) root.forEach((value, i) => assert.ok(Math.abs(value - roots[0][i]) < 1e-8));
    const returnState = await page.evaluate(() => {
      document.querySelector('#restart').click(); document.querySelector('#play').click();
      window.advanceTime(1500); document.querySelector('#play').click();
      return JSON.parse(window.render_game_to_text());
    });
    assert.ok(Math.abs(returnState.phase) < 1e-8);
    assert.ok(Math.abs(returnState.distance - 1.2) < 1e-8);
    await page.uncheck('#travel'); await page.click('#restart');
    for (let i = 0; i < (name === 'Laborer' ? 3 : 7); i++) await page.click('#next');
    await page.screenshot({ path: `${output}/${name.toLowerCase()}-${direction}.png`, fullPage: true });
    reports.push({ name, direction, samples, roots, returnState, scope: 'Review held-root projection and loop travel accounting only. Anatomical contacts and gameplay approvals remain open.' });
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/held-review-results.json`, JSON.stringify({ reports, errors }, null, 2));
  console.log('PASS: Both pilot views hold their review root; cycle-return travel is retained; no page or asset errors.');
} finally {
  await browser.close();
}
