// Render offline volume constraints for sprite authoring, never gameplay art.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { buildVolumeGuide, directions } from './motion-volume-guide.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const selected = option('--direction', 'back-left');
const views = selected === 'all' ? directions : [selected];
const output = resolve(option('--output', 'work/motion-volume-guides'));
const anchorY = Number(option('--anchor-y', '540'));
const guides = new Map(views.map(direction => [direction, buildVolumeGuide({ direction, anchor: [320, anchorY] })]));
const geometrySha256 = createHash('sha256').update(await readFile(new URL('./motion-volume-guide.mjs', import.meta.url))).digest('hex');

async function drawGuide(guide) {
  const T = await import('/three.module.js');
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(2560, 1280); renderer.setScissorTest(true); document.body.appendChild(renderer.domElement);
  const material = color => new T.MeshStandardMaterial({ color, roughness: .87 });
  const skin = material(0xb9b2a7), cloth = material(0x777e79), boot = material(0x4d5558), trim = material(0x9ea3a0);
  const ellipsoid = (group, p, s, m) => { const mesh = new T.Mesh(new T.SphereGeometry(1, 24, 16), m); mesh.position.set(...p); mesh.scale.set(...s); group.add(mesh); };
  const box = (group, p, s, m) => { const mesh = new T.Mesh(new T.BoxGeometry(...s), m); mesh.position.set(...p); group.add(mesh); };
  const limb = (group, a, b, radius, m) => {
    a = new T.Vector3(...a); b = new T.Vector3(...b); const delta = b.clone().sub(a);
    const mesh = new T.Mesh(new T.CapsuleGeometry(radius, Math.max(0, delta.length() - 2 * radius), 8, 16), m);
    mesh.position.copy(a).add(b).multiplyScalar(.5); mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()); group.add(mesh);
  };
  for (const frame of guide.frames) {
    const scene = new T.Scene(); scene.add(new T.HemisphereLight(0xffffff, 0x41474c, 2.6));
    const key = new T.DirectionalLight(0xffffff, 3); key.position.set(-4, 6, 4); scene.add(key);
    const figure = new T.Group(); scene.add(figure);
    ellipsoid(figure, [0, 1.25, 0], [.38, .39, .25], cloth); ellipsoid(figure, [0, .89, 0], [.32, .20, .24], cloth);
    box(figure, [0, 1.04, .245], [.62, .075, .035], boot);
    ellipsoid(figure, [0, 1.67, 0], [.15, .15, .16], skin); ellipsoid(figure, [0, 1.82, -.025], [.25, .255, .225], skin);
    ellipsoid(figure, [0, 1.79, -.245], [.09, .075, .08], skin);
    for (const sign of [-1, 1]) ellipsoid(figure, [sign * .25, 1.80, -.02], [.04, .085, .055], skin);
    ellipsoid(figure, [0, 1.55, -.22], [.19, .27, .10], boot);
    for (const arm of Object.values(frame.arms)) {
      limb(figure, arm.shoulder, arm.elbow, .13, cloth); limb(figure, arm.elbow, arm.hand, .105, skin); ellipsoid(figure, arm.hand, [.09, .11, .10], skin);
    }
    for (const foot of Object.values(frame.feet)) {
      const group = new T.Group(); figure.add(group); group.position.set(...foot.position); group.rotation.x = foot.roll;
      box(group, [0, .032, -.08], [.235, .064, .44], boot); ellipsoid(group, [0, .12, -.09], [.12, .115, .22], boot);
      ellipsoid(group, [0, .26, 0], [.11, .19, .105], boot);
      box(group, [0, .305, .105], [.22, .045, .032], trim); box(group, [0, .19, .112], [.22, .045, .032], trim);
      limb(figure, foot.hip, foot.knee, .145, cloth); limb(figure, foot.knee, foot.ankle, .10, cloth);
    }
    const pixelScale = guide.canvas / guide.viewSize;
    const center = new T.Vector3(...guide.up).multiplyScalar((guide.anchor[1] - 320) / pixelScale)
      .add(new T.Vector3(...guide.right).multiplyScalar((320 - guide.anchor[0]) / pixelScale));
    const camera = new T.OrthographicCamera(-guide.viewSize / 2, guide.viewSize / 2, guide.viewSize / 2, -guide.viewSize / 2, .01, 100);
    camera.position.copy(center).add(new T.Vector3(...guide.cameraAxis).multiplyScalar(6)); camera.lookAt(center); camera.updateMatrixWorld();
    const x = frame.pose % 4 * 640, y = (1 - Math.floor(frame.pose / 4)) * 640;
    renderer.setViewport(x, y, 640, 640); renderer.setScissor(x, y, 640, 640); renderer.render(scene, camera);
  }
  window.guideReady = true;
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/') {
      const guide = guides.get(url.searchParams.get('direction'));
      if (!guide) { response.writeHead(400); response.end('Unknown guide view'); return; }
      response.setHeader('Content-Type', 'text/html');
      response.end(`<style>body{margin:0;background:transparent}canvas{display:block}</style><script type="module">(${drawGuide.toString()})(${JSON.stringify(guide)});</script>`);
    } else if (['/three.module.js', '/three.core.js'].includes(url.pathname)) {
      response.setHeader('Content-Type', 'text/javascript'); response.end(await readFile(resolve('node_modules/three/build', url.pathname.slice(1))));
    } else { response.writeHead(404); response.end(); }
  } catch (error) { response.writeHead(500); response.end(String(error)); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
let browser;
try {
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 2560, height: 1280 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  for (const [direction, guide] of guides) {
    await page.goto(`http://127.0.0.1:${server.address().port}/?direction=${direction}`); await page.waitForFunction(() => window.guideReady);
    if (errors.length) throw new Error(errors.join('\n'));
    const bounds = await page.evaluate(() => {
      const canvas = document.querySelector('canvas'), context = canvas.getContext('webgl2'), pixels = new Uint8Array(canvas.width * canvas.height * 4);
      context.readPixels(0, 0, canvas.width, canvas.height, context.RGBA, context.UNSIGNED_BYTE, pixels);
      return Array.from({ length: 8 }, (_, i) => {
        const ox = i % 4 * 640, oy = (1 - Math.floor(i / 4)) * 640; let minX = 640, minY = 640, maxX = -1, maxY = -1;
        for (let y = 0; y < 640; y++) for (let x = 0; x < 640; x++) if (pixels[((oy + y) * canvas.width + ox + x) * 4 + 3] >= 128) {
          minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, 639 - y); maxY = Math.max(maxY, 639 - y);
        }
        return [minX, minY, maxX + 1, maxY + 1];
      });
    });
    if (bounds.some(b => b[0] <= 0 || b[1] <= 0 || b[2] >= 640 || b[3] >= 640)) throw new Error(`${direction}: guide volume touches the frame edge; move the common anchor`);
    await page.locator('canvas').screenshot({ path: join(output, `${direction}-volume-guide.png`), omitBackground: true });
    await writeFile(join(output, `${direction}-controls.json`), JSON.stringify({ ...guide, geometrySha256, guideSolidBounds: bounds }, null, 2) + '\n');
    console.log(`PASS ${direction}: eight complete volume templates, no clipping; authoring constraints only`);
  }
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
