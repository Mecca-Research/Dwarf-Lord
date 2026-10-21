import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVolumeGuide, directions } from './motion-volume-guide.mjs';
const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));

test('volume guides keep each corresponding support landmark grounded across all eight boundaries', () => {
  const guide = buildVolumeGuide();
  for (const t of guide.transitions) {
    for (const frame of [t.from, t.to]) assert.ok(Math.abs(guide.frames[frame].feet[t.side][t.landmark][1]) < 1e-12);
  }
  for (const frame of guide.frames) for (const foot of Object.values(frame.feet)) {
    assert.ok(Math.abs(distance(foot.hip, foot.knee) - .37) < 1e-12);
    assert.ok(Math.abs(distance(foot.knee, foot.ankle) - .37) < 1e-12);
    assert.ok(Math.abs(distance(foot.heel, foot.toe) - .44) < 1e-12);
  }
});

test('all eight camera views preserve the fixed world support and closed return without approving sprite motion', () => {
  for (const direction of directions) {
    const guide = buildVolumeGuide({ direction });
    assert.equal(guide.transitions.length, 8);
    assert.equal(guide.transitions[7].to, 0);
    assert.ok(Math.max(...guide.transitions.map(t => t.guideResidualPx)) < 3);
    assert.equal(guide.role, 'authoring-constraint-only');
    assert.equal(guide.materialCorrespondenceReviewed, false);
    assert.equal(guide.wholeStrideApproved, false);
    assert.equal(guide.loopApproved, false);
  }
});

test('opposite half-strides change supporting legs and counter-arms, with both passing feet lifted', () => {
  const { frames } = buildVolumeGuide();
  assert.equal(frames[2].feet.right.lift, 0);
  assert.ok(frames[2].feet.left.lift > .2);
  assert.equal(frames[6].feet.left.lift, 0);
  assert.ok(frames[6].feet.right.lift > .2);
  for (const i of [0, 4]) {
    for (const side of ['left', 'right']) assert.ok(frames[i].feet[side].z * frames[i].arms[side].hand[2] < 0, 'arms oppose their own advancing thigh');
  }
  assert.throws(() => buildVolumeGuide({ direction: 'unknown' }), RangeError);
  assert.throws(() => buildVolumeGuide({ elevation: NaN }), RangeError);
});
