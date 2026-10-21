import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';

// Inspect selected references whose contact review is still changes-required.
// A successful timed gallery check never grants task, loop or gameplay approval.
const list = process.env.REVIEW_LIST ?? 'docs/art-review/motion45/gallery-reference-checks.json';
const output = process.env.REVIEW_OUTPUT ?? 'work/expanded-cycles/motion45/gallery';
const findings = JSON.parse(readFileSync(list));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1050 } });
  const errors = [], seen = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(process.env.REVIEW_URL ?? 'http://localhost:8082/motion-review.html');
  await page.waitForFunction(() => window.render_game_to_text && !JSON.parse(window.render_game_to_text()).loading);
  const now = new Date();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now);
  const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
  const ready = async () => {
    for (let i = 0; i < 200; i++) {
      if (!(await state()).loading) return;
      await new Promise(r => setTimeout(r, 20));
    }
    throw new Error('Review images did not decode');
  };
  for (const record of findings.cycles.filter(r => r.verdict === 'changes-required')) {
    const manifest = JSON.parse(readFileSync(`${record.destination}/manifest.json`));
    assert.equal(manifest.playback.taskApproved, false);
    assert.equal(manifest.playback.loopApproved, false);
    assert.equal(manifest.productionReady, false);
    assert.equal(record.sourceSha256, manifest.sourceSha256, 'art verdict must match current source');
    assert.equal(record.settingsSha256, manifest.registration.settingsSha256, 'art verdict must match registration');
    await page.evaluate(character => {
      const s = document.querySelector('#character');
      const option = [...s.options].find(o => o.textContent === character);
      if (!option) throw new Error(`Missing character ${character}`);
      s.value = option.value; s.dispatchEvent(new Event('change'));
    }, record.character);
    await ready();
    const selected = await page.evaluate(({ action, direction }) => {
      const s = document.querySelector('#action');
      const option = [...s.options].find(o => o.textContent === `${action} · ${direction}`);
      if (!option) return false;
      s.value = option.value; s.dispatchEvent(new Event('change')); return true;
    }, { action: manifest.title, direction: manifest.direction });
    assert.equal(selected, true, record.destination);
    await ready();
    assert.equal((await state()).action, record.action);
    await page.evaluate(() => {
      document.querySelector('#repeat').checked = false;
      document.querySelector('#restart').click(); document.querySelector('#play').click();
    });
    const frames = [];
    for (let i = 0; i < 8; i++) {
      assert.equal((await state()).index, i, `${record.action}: pose${i}`);
      await page.evaluate(ms => window.advanceTime(ms), manifest.frames[i].durationMs - 1);
      const held = await state(); assert.equal(held.index, i, 'authored held duration');
      frames.push(held);
      if ([0, 4, 7].includes(i)) await page.locator('#preview').screenshot({ path: `${output}/${record.character.replaceAll(' ', '-')}-${record.action}-${i}.png` });
      await page.evaluate(() => window.advanceTime(1));
    }
    const terminal = await state();
    assert.equal(terminal.index, 7); assert.equal(terminal.completed, true); assert.equal(terminal.playing, false);
    await page.evaluate(() => window.advanceTime(10000));
    assert.deepEqual(await state(), terminal, 'completed pose holds without implicit reset');
    await page.evaluate(() => document.querySelector('#restart').click());
    assert.equal((await state()).index, 0); assert.equal((await state()).completed, false);
    seen.push({ character: record.character, action: record.action, sourceSha256: manifest.sourceSha256,
      settingsSha256: manifest.registration.settingsSha256, durationsMs: manifest.frames.map(f => f.durationMs), frames, terminal,
      artVerdict: 'changes-required', taskApproved: false, loopApproved: false });
    console.log(`PLAYBACK ONLY ${record.character}/${record.action}: all8 held poses, terminal hold, explicit reset; contact review remains open`);
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ method: 'Frozen browser clock; actual gallery canvas and shared MotionPlayback; exact authored durations. Both contact reviews remain changes-required; timed playback and image loading grant no art, loop or gameplay approval.', seen, errors }, null, 2) + '\n');
} finally { await browser.close(); }
