/** Rebind only changed environment dependencies after the shipped-world playtest. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, relative, resolve } from 'node:path';

const baseCommit = '17cb5dca4dee90f1a977a607e5de2a6b70c37b77';
const checkpoint = 'camp-commons-v3';
const folder = 'docs/world-review/camp-commons-v3';
const auditFile = `${folder}/runtime-revalidation.json`;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hash = file => digest(readFileSync(file));
const original = file => execFileSync('git', ['show', `${baseCommit}:${file}`], { maxBuffer: 30 * 1024 * 1024 });
const originalPaths = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', baseCommit], { encoding: 'utf8' }).trim().split('\n'));
const json = file => JSON.parse(readFileSync(file, 'utf8'));
function authoredFiles(root, manifest) {
  return ['manifest.json', 'motion-polish.json', 'generation.json',
    ...((originalPaths.has(`${root}/assembly.json`) || existsSync(`${root}/assembly.json`)) ? ['assembly.json'] : []),
    manifest.source, manifest.atlas.file, ...manifest.frames.map(f => f.file)];
}
const allowed = new Set(['src/game/world/scene.tsx', 'src/game/world/terrain.tsx',
  'src/game/world/environment.tsx', 'src/game/world/workstations.tsx', 'src/game/runtime.ts']);
const report = json(`${folder}/results.json`);
const strides = json(`${folder}/stride-results.json`);
assert.equal(strides.passed, true);
assert.deepEqual(strides.reports.map(r => r.direction), ['right', 'left']);
for (const { result } of strides.reports) {
  assert.equal(result.boundaries.length, 24);
  assert.ok(result.maxHeldDriftSpritePx < 0.5);
  assert.ok(result.maxBoundaryJumpSpritePx <= 6);
  assert.deepEqual(result.errors, []);
}
assert.equal(hash(strides.checker.file), strides.checker.sha256);
assert.equal(hash(strides.wrapper.file), strides.wrapper.sha256);
assert.equal(report.passed, true);
assert.equal(report.mode, 'full');
assert.equal(report.controlChecks.length, 3);
assert.ok(report.controlChecks.every(c => c.passed));
assert.equal(report.savedCampCheck.passed, true);
assert.deepEqual(report.errors, []);
assert.deepEqual(report.failedRequests, []);
assert.equal(report.horizontalOverflow, false);
assert.equal(report.navigationChecks.length, 11);
assert.equal(report.stationChecks.length, 6);
assert.equal(report.distinctWorkVariants, 22);
for (const day of report.stationChecks) {
  assert.equal(day.workstations.length, 14);
  for (const target of day.targets) {
    const motion = day.dwarves.find(d => d.id === target.id).workMotion;
    assert.equal(motion.action, target.action);
    assert.equal(motion.completed, true);
    assert.equal(motion.frame, 7);
    assert.equal(motion.completions, 1);
  }
}
for (const [file, sha] of Object.entries(report.sourceBindings)) assert.equal(hash(file), sha, `stale playtest: ${file}`);
assert.match(readFileSync(`${folder}/route-tests.txt`, 'utf8'), /fail 0/);
assert.match(readFileSync(`${folder}/asset-tests.txt`, 'utf8'), /fail 0/);
const screenshots = json(`${folder}/screenshots.json`);
assert.equal(screenshots.length, 10);
for (const screenshot of screenshots) assert.equal(hash(`${folder}/${screenshot.file}`), screenshot.sha256);
const retainedFiles = ['src/game/world/npc-motion.ts', 'src/game/world/sprites.tsx',
  'src/game/world/workstations.tsx',
  'src/game/world/workstation-sites.ts', 'src/game/world/work-activities.ts',
  'src/game/world/motion-review-points.ts', 'src/game/motion-playback.ts', 'public/motion-playback.mjs',
  'public/workstation-registration.mjs', 'src/game/store.ts', 'src/game/sim.ts'];
for (const file of retainedFiles) assert.equal(hash(file), digest(original(file)), `changed motion core: ${file}`);
function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${path}/${e.name}`) : [`${path}/${e.name}`]);
}
const approvals = [], art = new Map();
const workEntries = [...json('docs/runtime-motion-layers.json').entries, ...json('docs/runtime-motion-additions.json').entries];
assert.equal(workEntries.length, 22);
for (const entry of workEntries) {
  const root = entry.destination, manifest = json(`${root}/manifest.json`);
  for (const name of authoredFiles(root, manifest)) {
    const path = `${root}/${name}`;
    assert.equal(hash(path), digest(original(path)), `changed workstation art: ${path}`);
    art.set(path, hash(path));
  }
}
for (const file of walk('public/sprites').filter(p => /\/(loop|task)-approval\.json$/.test(p))) {
  const native = original(file), approval = JSON.parse(native);
  const changes = [];
  for (const dependency of approval.dependencies ?? []) {
    const path = relative(process.cwd(), resolve(dirname(file), dependency.file));
    const sha = hash(path);
    if (sha === dependency.sha256) continue;
    assert.ok(allowed.has(path), `unreviewed dependency change: ${file} -> ${path}`);
    assert.equal(digest(original(path)), dependency.sha256, `not the original reviewed dependency: ${path}`);
    changes.push({ file: path, before: dependency.sha256, after: sha });
    dependency.sha256 = sha;
  }
  if (!changes.length) continue;
  const root = dirname(file), manifest = json(`${root}/manifest.json`);
  for (const name of authoredFiles(root, manifest)) {
    const path = `${root}/${name}`;
    assert.equal(hash(path), digest(original(path)), `changed authored motion: ${path}`);
    art.set(path, hash(path));
  }
  approvals.push({ file, originalSha256: digest(native), priorRuntimeRevalidation: approval.runtimeRevalidation ?? null,
    changedDependencies: changes, approval });
}
assert.equal(approvals.length, 17, '15 changed work dependency bundles and two retained lateral gaits; workstation geometry is unchanged');
const propFiles = walk('public/sprites/workstations');
for (const file of propFiles) {
  assert.equal(hash(file), digest(original(file)), `changed persistent prop: ${file}`);
  art.set(file, hash(file));
}
const audit = {
  checkpoint, baseCommit, nativeScopeExpanded: false,
  scope: 'Environment-only replay of the previously approved 22 workstation variants and 14 props, plus three flat-ground strides in each retained Blacksmith lateral view. Same art, calibration, task state and motion core; expanded camp commons, tents, well, wagon, stockyard, entrance, waterfall, tarn, terrain, camera and click approaches. Original native scopes, dates, checks and approval flags are retained. No unresolved animation gate is closed.',
  browserReport: { file: `${folder}/results.json`, sha256: hash(`${folder}/results.json`) },
  routeTests: { file: `${folder}/route-tests.txt`, sha256: hash(`${folder}/route-tests.txt`) },
  assetTests: { file: `${folder}/asset-tests.txt`, sha256: hash(`${folder}/asset-tests.txt`) },
  strideReport: { file: `${folder}/stride-results.json`, sha256: hash(`${folder}/stride-results.json`) },
  reviewImages: { file: `${folder}/screenshots.json`, sha256: hash(`${folder}/screenshots.json`) },
  verifier: { file: 'scripts/revalidate-world-v3.mjs', sha256: hash('scripts/revalidate-world-v3.mjs') },
  retainedCore: Object.fromEntries(retainedFiles.map(p => [p, hash(p)])),
  worldFiles: report.sourceBindings,
  unchangedArt: Object.fromEntries(art),
  approvals: approvals.map(({ approval, ...record }) => record),
};
writeFileSync(auditFile, JSON.stringify(audit, null, 2) + '\n');
for (const record of approvals) {
  const { approval, file } = record;
  const auditPath = relative(dirname(file), auditFile);
  approval.dependencies.push({ file: auditPath, sha256: hash(auditFile) });
  approval.runtimeRevalidation = { checkpoint, files: record.changedDependencies.map(d => d.file), audit: auditPath,
    scope: audit.scope };
  writeFileSync(file, JSON.stringify(approval, null, 2) + '\n');
}
console.log(`Revalidated ${approvals.length} environment dependency bindings; native motion approvals unchanged.`);
