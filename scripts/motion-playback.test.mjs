import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compiledPlayback } from './sync-motion-playback.mjs';
import { MotionPlayback, motionPlacement, motionStrideBodyRatio, reviewTravelVector, reviewHeldRootOffset } from '../public/motion-playback.mjs';
const motion = (overrides = {}) => ({ character: 'Helga', action: 'walk', kind: 'walk',
  frames: [140, 140, 105, 115, 140, 140, 105, 115].map(durationMs => ({ durationMs })),
  registration: { targetBodyHeight: 520, targetAnchor: [320, 616] }, frameSize: [640, 640], ...overrides });

test('standalone review and game use the same compiled controller', () => {
  assert.equal(readFileSync(new URL('../public/motion-playback.mjs', import.meta.url), 'utf8'), compiledPlayback());
});

test('walking advances from actual travel and freezes against an obstacle', () => {
  const p = new MotionPlayback(motion());
  p.travel(.28, 2); assert.equal(p.index, 1); assert.equal(p.elapsed, 0);
  p.travel(0, 2); assert.equal(p.phase, 1);
  p.travel(1.72, 2); assert.equal(p.phase, 0); assert.equal(p.completions, 1);
});
test('direction changes preserve the exact gait beat with different contact durations', () => {
  const p = new MotionPlayback(motion()); p.seekPhase(2.5);
  p.setMotion(motion({ direction: 'right', frames: Array.from({ length: 8 }, () => ({ durationMs: 125 })) }), { preservePhase: true });
  assert.equal(p.phase, 2.5); assert.equal(p.elapsed, 62.5);
  p.setMotion(motion({ action: 'pickaxe-swing' }), { preservePhase: true }); assert.equal(p.phase, 0);
});
test('one-shot completion fires once, holds the final prop state, and requires explicit restart', () => {
  const p = new MotionPlayback(motion({ action: 'count-coins', kind: 'work' }));
  assert.equal(p.advance(999), false); assert.equal(p.ended, false);
  assert.equal(p.advance(1), true); assert.equal(p.index, 7); assert.equal(p.completions, 1);
  assert.equal(p.advance(10000), false); assert.equal(p.index, 7); assert.equal(p.completions, 1);
  p.restart(); assert.equal(p.phase, 0); assert.equal(p.ended, false);
});
test('large elapsed steps are bounded and match incremental updates', () => {
  const a = new MotionPlayback(motion()), b = new MotionPlayback(motion());
  a.advance(1000123, { repeat: true });
  for (let i = 0; i < 1000; i++) b.advance(1000, { repeat: true });
  b.advance(123, { repeat: true });
  assert.equal(a.phase, b.phase); assert.equal(a.completions, b.completions);
});
test('body size and root stay constant across walk and overhead tool canvases', () => {
  const a = motionPlacement(motion(), 1.95);
  const b = motionPlacement(motion({ registration: { targetBodyHeight: 340, targetAnchor: [320, 576] } }), 1.95);
  assert.equal(a.scale * 520, 1.95); assert.equal(b.scale * 340, 1.95);
  assert.equal(a.top + 616 * a.scale, 0); assert.equal(b.top + 576 * b.scale, 0);
  assert.throws(() => motionPlacement(motion({ registration: {} }), 1.95), /calibration/);
});
test('invalid motion input cannot hang playback or produce NaN geometry', () => {
  assert.throws(() => new MotionPlayback(motion({ frames: [{ durationMs: 0 }] })));
  const p = new MotionPlayback(motion());
  for (const n of [NaN, Infinity, -1]) assert.throws(() => p.advance(n));
  assert.throws(() => p.travel(1, 0)); assert.throws(() => p.seekPhase(NaN));
  assert.throws(() => new MotionPlayback(motion({ kind: 'work' })).travel(1, 2));
});
test('review travel follows authored directions without mirroring sprites', () => {
  assert.deepEqual(reviewTravelVector('front'), [0, Math.sin(.6)]);
  assert.ok(reviewTravelVector('right')[0] > .99);
  assert.ok(reviewTravelVector('left')[0] < -.99);
  assert.ok(reviewTravelVector('back')[1] < 0);
});

test('review uses the measurement projection and rejects invalid elevation', () => {
  const axis = reviewTravelVector('back-left');
  assert.ok(Math.abs(axis[0] + Math.SQRT1_2) < 1e-12);
  assert.ok(Math.abs(axis[1] + Math.SQRT1_2 * Math.sin(.6)) < 1e-12);
  for (const value of [NaN, 0, Math.PI / 2]) assert.throws(() => reviewTravelVector('front', value));
});

test('held review root stays fixed in world space through every pose', () => {
  const m = motion({ direction: 'back-left' });
  const axis = reviewTravelVector(m.direction);
  let elapsed = 0;
  for (let i = 0; i < 8; i++) {
    let expected;
    for (const fraction of [.05, .35, .75, .99]) {
      const distance = (elapsed + fraction * m.frames[i].durationMs) / 1000 * 1.2 * 380;
      const offset = reviewHeldRootOffset(m, i + fraction, 1.2, 380);
      const root = axis.map((v, j) => v * distance + offset[j]);
      if (expected) root.forEach((v, j) => assert.ok(Math.abs(v - expected[j]) < 1e-9));
      expected = root;
    }
    elapsed += m.frames[i].durationMs;
  }
});

test('held review rejects non-travel actions and invalid phase or scale', () => {
  for (const phase of [-1, 8, NaN]) assert.throws(() => reviewHeldRootOffset(motion({ direction: 'right' }), phase, 1.2, 380));
  assert.throws(() => reviewHeldRootOffset(motion({ kind: 'work' }), 1, 1.2, 380));
  assert.throws(() => reviewHeldRootOffset(motion({ direction: 'right' }), 1, 0, 380));
});

test('directional timber carrying follows travel without replaying stationary tool work', () => {
  const p = new MotionPlayback(motion({ kind: 'directional', action: 'carry-mine-timber' }));
  p.travel(.6, 1.2); assert.equal(p.index, 4);
  assert.throws(() => new MotionPlayback(motion({ kind: 'directional', action: 'pickaxe-swing' })).travel(.6, 1.2));
});

test('measured walking stride requires the exact source, view, registration and timings', () => {
  const m = motion({ direction: 'right', sourceSha256: 'source', registration: { settingsSha256: 'settings' } });
  assert.equal(motionStrideBodyRatio(m), 1.2);
  m.travelCalibration = { version: 1, sourceSha256: 'source', settingsSha256: 'settings', direction: 'right',
    durationsMs: m.frames.map(frame => frame.durationMs), strideBodyRatio: .880769, scope: 'Reviewed eight sole boundaries.' };
  assert.equal(motionStrideBodyRatio(m), .880769);
  for (const change of [{ sourceSha256: 'changed' }, { settingsSha256: 'changed' }, { direction: 'left' },
    { strideBodyRatio: 0 }, { strideBodyRatio: NaN }, { strideBodyRatio: 2.1 }, { scope: '' },
    { durationsMs: [125] }, { durationsMs: m.frames.map(() => 125) }]) {
    assert.throws(() => motionStrideBodyRatio({ ...m, travelCalibration: { ...m.travelCalibration, ...change } }));
  }
  assert.throws(() => motionStrideBodyRatio({ ...m, kind: 'work' }));
});
