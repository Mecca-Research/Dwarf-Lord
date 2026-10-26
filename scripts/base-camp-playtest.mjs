/** Run after npm run build:pages. Uses the shipped static build and real game systems. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import ts from 'typescript';

const output = process.env.WORLD_REVIEW_OUTPUT ?? 'artifacts/base-camp-review';
mkdirSync(output, { recursive: true });
const sourceFiles = [
  'src/game/world/scene.tsx', 'src/game/world/terrain.tsx', 'src/game/world/environment.tsx',
  'src/game/world/workstations.tsx', 'src/game/world/buildings.tsx', 'src/game/runtime.ts',
  'src/game/world/landscape.ts', 'src/game/world/mine.tsx', 'src/game/world/world-visibility.tsx',
  'src/game/data/catalog.ts', 'src/game/ui/hud.tsx', 'src/game/world/materials.tsx',
  'public/art/alpine-spruce-v1.webp', 'public/art/alpine-bedrock-v1.webp',
  'scripts/base-camp-playtest.mjs',
];
const hash = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const report = {
  build: 'npm run build:pages', viewport: [1280, 800], renderer: 'headless Chromium / SwiftShader',
  note: 'Google Fonts CSS intercepted for offline QA. Frame rate is not a hardware benchmark.',
  sourceBindings: Object.fromEntries(sourceFiles.map(p => [p, hash(p)])),
  navigationChecks: [], stationChecks: [], screenshots: [], errors: [], failedRequests: [],
};
function load(path, dependencies = {}) {
  const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  new Function('exports', 'require', outputText)(exports, id => {
    assert.ok(id in dependencies, `Unexpected dependency ${id}`);
    return dependencies[id];
  });
  return exports;
}
const appearances = load('src/game/world/dwarf-appearances.ts');
const catalog = load('src/game/data/catalog.ts', {
  '../world/dwarf-appearances': appearances, '@/lib/asset': { asset: p => p },
});
const activities = load('src/game/world/work-activities.ts', { '../data/catalog': catalog });
const stations = load('src/game/world/workstation-sites.ts', {
  '../data/catalog': catalog, './work-activities': activities,
});
const root = resolve('.output/public');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = decodeURIComponent(url.pathname).replace(/^\/Dwarf-Lord\/?/, '');
  const file = resolve(root, path || 'index.html');
  if (!(file === root || file.startsWith(root + '/')) || !existsSync(file)) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.setHeader('content-type', mime[extname(file)] ?? 'application/octet-stream');
  res.end(readFileSync(file));
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.WORLD_CHROMIUM ? { executablePath: process.env.WORLD_CHROMIUM } : {}),
    args: ['--no-sandbox', '--no-zygote', '--single-process', '--disable-dev-shm-usage',
      '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const cdp = await page.context().newCDPSession(page);
  page.setDefaultTimeout(90000);
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') report.errors.push(msg.text()); });
  page.on('response', r => { if (r.status() >= 400) report.failedRequests.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', r => report.failedRequests.push(`${r.failure()?.errorText} ${r.url()}`));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.goto(`http://127.0.0.1:${server.address().port}/Dwarf-Lord/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b =>
    b.textContent.includes('Walk the road') && Object.keys(b).some(k => k.startsWith('__reactProps'))));
  await page.getByRole('button', { name: 'Walk the road', exact: true }).click();
  await page.waitForFunction(() => window.__controlsTest && window.render_game_to_text && document.querySelector('canvas'));
  await page.waitForTimeout(6500);
  const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
  const capture = async (name, x, z, zoom = 0, vista = false) => {
    await page.evaluate(({ x, z, zoom, vista }) => {
      window.__controlsTest.teleport(x, z);
      window.__controlsTest.setZoomBias(zoom);
      window.__controlsTest.setValleyView(vista);
    }, { x, z, zoom, vista });
    await page.waitForTimeout(5000);
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(`${output}/${name}.png`, Buffer.from(screenshot.data, 'base64'));
    report.screenshots.push({ name, player: (await state()).player, camera: await page.evaluate(() => window.__controlsTest.getCameraAngles()) });
    console.log(`Captured ${name}`);
  };
  await capture('base-camp', -3, 4);
  await capture('valley-overview', -2, -2, 0, true);
  await capture('mountain-entrance', 8, -22, 2);
  await capture('first-mining-level', 8, -44, -3);
  await page.keyboard.down('q'); await page.waitForTimeout(1800); await page.keyboard.up('q');
  await capture('mine-camera-turn', 8, -44, -3);
  // Actual game movement, including the portal and bridge waypoint logic.
  await page.evaluate(() => { window.__controlsTest.teleport(-3, 4); window.__controlsTest.setValleyView(false); });
  for (const destination of [{ x: 8, z: -38 }, { x: -3, z: 4 }, { x: -42, z: 18 }, { x: -3, z: 4 }]) {
    await page.evaluate(p => { window.__controlsTest.setDest(p.x, p.z); window.advanceTime(30000); }, destination);
    const p = await page.evaluate(() => window.__controlsTest.getPos());
    assert.ok(Math.hypot(p.x - destination.x, p.z - destination.z) < 0.5, JSON.stringify({ p, destination }));
    report.navigationChecks.push({ destination, reached: p });
  }
  console.log('Passed four live navigation routes');
  const workers = [['kori', 'meals'], ['grit', 'forge'], ['brokk', 'timber'], ['tam', 'storage'], ['stig', 'limestone'], ['borrin', null], ['fenn', null]];
  for (let day = 1; day <= 6; day++) {
    const targets = workers.map(([id, job]) => {
      const appearance = appearances.dwarfAppearance(id);
      const site = stations.activeWorkstation(appearance, job, true, false, day);
      assert.ok(site, `${id} missing site on day ${day}`);
      const action = id === 'kori' ? activities.cookingWorkAction(day) :
        id === 'grit' ? activities.forgeWorkAction(day) : id === 'brokk' ? activities.timberWorkAction(day) :
        id === 'borrin' ? activities.consultantWorkAction(day) :
        id === 'fenn' ? 'check-weights' : id === 'tam' ? 'stack-crates' : 'chisel-contact';
      return { id, job, action, site: site.id, x: site.target.targetX, z: site.target.targetZ };
    });
    await page.evaluate(targets => {
      for (const t of targets) {
        window.__controlsTest.assignJob(t.id, t.job);
        window.__controlsTest.teleportDwarf(t.id, t.x, t.z);
      }
    }, targets);
    await page.waitForFunction(targets => {
      const state = JSON.parse(window.render_game_to_text());
      return targets.every(t => {
        const motion = state.dwarves.find(d => d.id === t.id)?.workMotion;
        return motion?.action === t.action && motion.completed && motion.frame === 7 && motion.completions === 1;
      });
    }, targets, { timeout: 90000 });
    const s = await state();
    assert.equal(s.workstations.length, 14);
    report.stationChecks.push({ day, targets, workstations: s.workstations,
      dwarves: s.dwarves.filter(d => workers.some(([id]) => d.id === id)) });
    if (day === 1 || day === 6) await capture(`camp-workstations-day-${day}`, -2, 1);
    if (day <= 2) await capture(`forestry-day-${day}`, -42, 18, 2);
    if (day === 1) await capture('mining-workstation', 8, -38, -1);
    if (day < 6) {
      await page.evaluate(() => { window.__controlsTest.resolveDay(); window.__controlsTest.nextMorning(); });
    }
    console.log(`Passed day ${day} workstation variants`);
  }
  report.distinctWorkVariants = new Set(report.stationChecks.flatMap(s => s.targets.map(t => `${t.id}:${t.action}`))).size;
  assert.equal(report.distinctWorkVariants, 22);
  await page.setViewportSize({ width: 390, height: 844 });
  await capture('base-camp-mobile', -3, 4);
  report.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  assert.equal(report.horizontalOverflow, false);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.failedRequests, []);
  report.passed = true;
  console.log('PASS: routes, 22 work variants, 14 persistent stations, desktop and mobile');
} catch (error) {
  report.failure = error.stack;
  throw error;
} finally {
  writeFileSync(`${output}/results.json`, JSON.stringify(report, null, 2) + '\n');
  await browser?.close();
  await new Promise(done => server.close(done));
}
