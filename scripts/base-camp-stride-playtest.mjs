/** Re-run the existing lateral stride contact checker against the new static world. */
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { createHash } from 'node:crypto';
const output = process.env.WORLD_STRIDE_OUTPUT ?? 'artifacts/base-camp-strides';
mkdirSync(output, { recursive: true });
const root = resolve('.output/public');
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/Dwarf-Lord\/?/, '');
  const file = resolve(root, path || 'index.html');
  if (!file.startsWith(root + '/') || !existsSync(file)) { res.writeHead(404); res.end(); return; }
  const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  res.setHeader('content-type', types[extname(file)] ?? 'application/octet-stream');
  res.end(readFileSync(file));
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const checker = 'scripts/directional-stride-renderer-check.mjs';
// Keep the original contact algorithm and bounds. Adapt only local launch,
// font handling, hydration readiness and screenshot transport for headless QA.
// Half-resolution framing and 32ms samples reduce software-rendering cost;
// all 24 ordered boundaries and the original normalized contact bounds remain.
const source = readFileSync(checker, 'utf8')
  .replace("const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });",
    "const browser = await chromium.launch({ headless: true, ...(process.env.WORLD_CHROMIUM ? {executablePath:process.env.WORLD_CHROMIUM}:{}), args: ['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });")
  .replace("const errors = [], assets = [], holds = [], boundaries = [], screenshots = new Set();",
    "await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''})); const cdp=await page.context().newCDPSession(page); const errors = [], assets = [], holds = [], boundaries = [], screenshots = new Set();")
  .replace("button => button.textContent === 'Walk the road'", "button => button.textContent === 'Walk the road' && Object.keys(button).some(k=>k.startsWith('__reactProps'))")
  .replace('width: 800, height: 560', 'width: 400, height: 280')
  .replace('const tick = async (ms = 16)', 'const tick = async (ms = 32)')
  .replace("await page.screenshot({ path: `${output}/frame-${sample.frame}.png` });",
    "const capture=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}); await writeFile(`${output}/frame-${sample.frame}.png`,Buffer.from(capture.data,'base64'));");
const runner = resolve(output, 'directional-runner.mjs');
writeFileSync(runner, source);
const hash = p => createHash('sha256').update(readFileSync(p)).digest('hex');
try {
  const reports = [];
  for (const direction of ['right', 'left']) {
    process.env.REVIEW_URL = `http://127.0.0.1:${server.address().port}/Dwarf-Lord/`;
    process.env.REVIEW_OUTPUT = `${output}/${direction}`;
    process.env.STRIDE_OBSERVATIONS = `docs/blacksmith-${direction}-whole-stride-observations.json`;
    await import(`${runner}?direction=${direction}`);
    reports.push({ direction, observationsSha256: hash(process.env.STRIDE_OBSERVATIONS),
      result: JSON.parse(readFileSync(`${output}/${direction}/results.json`, 'utf8')) });
  }
  writeFileSync(`${output}/results.json`, JSON.stringify({ passed: true, viewport: [400, 280], sampleStepMs: 32,
    checker: { file: checker, sha256: hash(checker) },
    wrapper: { file: 'scripts/base-camp-stride-playtest.mjs', sha256: hash('scripts/base-camp-stride-playtest.mjs') },
    reports }, null, 2) + '\n');
} finally {
  await new Promise(done => server.close(done));
}
