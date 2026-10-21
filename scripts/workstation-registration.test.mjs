import assert from 'node:assert/strict';
import test from 'node:test';
import { workstationTransform } from '../public/workstation-registration.mjs';

test('different workstation source bases retain the same physical root and distances', () => {
  const actor = { targetBodyHeight: 509, targetAnchor: [280, 592] };
  const station = { targetBodyHeight: 520, targetAnchor: [320, 616] };
  const transform = workstationTransform(actor, station);
  for (const point of [[320, 616], [246, 361], [475, 367], [520, 620]]) {
    const mapped = [point[0] * transform.scale + transform.x,
      point[1] * transform.scale + transform.y];
    for (let axis = 0; axis < 2; axis++) {
      assert.ok(Math.abs((mapped[axis] - actor.targetAnchor[axis]) / actor.targetBodyHeight -
        (point[axis] - station.targetAnchor[axis]) / station.targetBodyHeight) < 1e-12);
    }
  }
  assert.equal(transform.width / transform.height, 1);
  assert.deepEqual(workstationTransform(station, station), {
    scale: 1, x: 0, y: 0, width: 640, height: 640,
  });
});

test('workstation review rejects missing, zero and unrepresentable physical registrations', () => {
  const valid = { targetBodyHeight: 520, targetAnchor: [320, 616] };
  for (const invalid of [undefined, {}, { ...valid, targetBodyHeight: 0 },
    { ...valid, targetBodyHeight: NaN }, { ...valid, targetAnchor: [320] },
    { ...valid, targetAnchor: [320, Infinity] }]) {
    assert.throws(() => workstationTransform(invalid, valid), /physical registration/);
    assert.throws(() => workstationTransform(valid, invalid), /physical registration/);
  }
  assert.throws(() => workstationTransform(valid, valid, [0, 640]), /canvas dimensions/);
  assert.throws(() => workstationTransform(valid, { ...valid, targetBodyHeight: Number.MIN_VALUE }),
    /cannot be represented/);
});
