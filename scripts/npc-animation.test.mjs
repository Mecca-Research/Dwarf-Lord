import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const root = new URL('../public/sprites/', import.meta.url);
const library = JSON.parse(readFileSync(new URL('animation-library.json', root)));
const directions = ['front','front-right','right','back-right','back','back-left','left','front-left'];
test('all 14 non-player character profiles have eight angles and four explicit stance references', () => {
  assert.equal(library.length, 14);
  assert.equal(new Set(library.map(c => c.name)).size, 14);
  for (const character of library) {
    const url = new URL(character.manifest, root);
    const manifest = JSON.parse(readFileSync(url));
    const profile = JSON.parse(readFileSync(new URL('../profile.json', url)));
    assert.equal(manifest.character, character.name);
    assert.equal(manifest.frames.length, 12);
    assert.deepEqual(manifest.frames.slice(0, 8).map(f => f.id), directions);
    assert.equal(profile.animation.gaitComplete, false);
    assert.equal(manifest.status, 'animation-source');
    assert.ok(existsSync(new URL(manifest.canonical, url)));
    for (const frame of manifest.frames) {
      const png = readFileSync(new URL(frame.file, url));
      assert.equal(png.readUInt32BE(16), 384);
      assert.equal(png.readUInt32BE(20), 640);
      assert.deepEqual(frame.anchor, [192,620]);
      if (frame.sourceOverride) assert.ok(existsSync(new URL(frame.sourceOverride, url)));
    }
  }
});
test('Elder and Borrin use narrative poses rather than mislabeled labor cycles', () => {
  const poses = name => JSON.parse(readFileSync(new URL(`${name}/animation/manifest.json`, root))).frames.slice(8).map(f => f.id);
  assert.deepEqual(poses('Elder'), ['seated-listen','seated-speak','stand-stick','step-stick']);
  assert.deepEqual(poses('Borrin'), ['seated-ledger','consult-ledger','step-ledger','explain']);
});
