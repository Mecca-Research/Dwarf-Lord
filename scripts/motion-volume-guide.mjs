// Offline authoring geometry. These controls are never observed sprite material
// and must never be consumed as a travel calibration or motion approval.
export const directions = ['front', 'front-right', 'right', 'back-right', 'back', 'back-left', 'left', 'front-left'];
const phases = [
  { z: -.35, lift: 0, roll: .24 }, { z: -.175, lift: 0, roll: 0 },
  { z: 0, lift: 0, roll: 0 }, { z: .175, lift: 0, roll: -.20 },
  { z: .35, lift: 0, roll: -.32 }, { z: .19, lift: .15, roll: .12 },
  { z: -.05, lift: .24, roll: .20 }, { z: -.34, lift: .11, roll: .04 },
];
const armPhases = [1, .75, 0, -.7, -1, -.75, 0, .7];
const add = (a, b) => a.map((v, i) => v + b[i]);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const mul = (a, n) => a.map(v => v * n);
const dot = (a, b) => a.reduce((v, n, i) => v + n * b[i], 0);
const length = a => Math.hypot(...a);

function knee(hip, ankle) {
  const delta = sub(ankle, hip), distance = length(delta), unit = mul(delta, 1 / distance);
  if (distance > .74) throw new RangeError('Guide leg exceeds its two rigid .37-unit segments');
  const forward = sub([0, 0, -1], mul(unit, dot([0, 0, -1], unit)));
  const bend = mul(forward, 1 / length(forward));
  return add(mul(add(hip, ankle), .5), mul(bend, Math.sqrt(.37 ** 2 - (distance / 2) ** 2)));
}

export function buildVolumeGuide({ direction = 'back-left', elevation = .6, anchor = [320, 540], canvas = 640, viewSize = 2.1 } = {}) {
  const index = directions.indexOf(direction);
  if (index < 0 || !Number.isFinite(elevation) || elevation <= 0 || elevation >= Math.PI / 2
      || !Number.isFinite(canvas) || canvas <= 0 || !Number.isFinite(viewSize) || viewSize <= 0
      || anchor.length !== 2 || anchor.some(v => !Number.isFinite(v))) throw new RangeError('Invalid guide view');
  const angle = index * Math.PI / 4, sin = Math.sin, cos = Math.cos;
  const right = [-cos(angle), 0, -sin(angle)];
  const up = [-sin(angle) * sin(elevation), cos(elevation), cos(angle) * sin(elevation)];
  const cameraAxis = [sin(angle) * cos(elevation), sin(elevation), -cos(angle) * cos(elevation)];
  const pixelsPerWorld = canvas / viewSize;
  const project = point => [anchor[0] + dot(point, right) * pixelsPerWorld, anchor[1] - dot(point, up) * pixelsPerWorld];
  const frames = Array.from({ length: 8 }, (_, i) => {
    const feet = {}, arms = {};
    for (const [side, x, phase] of [['right', .18, i], ['left', -.18, (i + 4) % 8]]) {
      const f = phases[phase], y = f.lift + (f.roll >= 0 ? .14 * sin(f.roll) : -.30 * sin(f.roll));
      const position = [x, y, f.z];
      const transform = ([a, b, c]) => add(position, [a, b * cos(f.roll) - c * sin(f.roll), b * sin(f.roll) + c * cos(f.roll)]);
      const hip = [x, .94, 0], ankle = transform([0, .37, 0]);
      const heel = transform([0, 0, .14]), toe = transform([0, 0, -.30]);
      feet[side] = { ...f, position, hip, ankle, knee: knee(hip, ankle), heel, toe, heelGuidePixel: project(heel), toeGuidePixel: project(toe) };
    }
    for (const [side, sign] of [['left', -1], ['right', 1]]) arms[side] = {
      shoulder: [sign * .34, 1.49, 0], elbow: [sign * .46, 1.20, sign * .08 * armPhases[i]], hand: [sign * .45, .99, sign * .29 * armPhases[i]],
    };
    return { pose: i, feet, arms };
  });
  const transitions = frames.map((frame, i) => {
    const side = i < 4 ? 'right' : 'left', landmark = i % 4 === 0 ? 'heel' : 'toe';
    const next = frames[(i + 1) % 8];
    // External body advances .175 world units in -Z at each contact boundary.
    const worldResidual = sub(add(next.feet[side][landmark], [0, 0, -.175]), frame.feet[side][landmark]);
    const pixelResidual = [dot(worldResidual, right) * pixelsPerWorld, -dot(worldResidual, up) * pixelsPerWorld];
    return { from: i, to: (i + 1) % 8, side, landmark, worldResidual, pixelResidual, guideResidualPx: length(pixelResidual), correspondenceReviewed: false };
  });
  return { role: 'authoring-constraint-only', direction, elevation, anchor, canvas, viewSize, right, up, cameraAxis,
    rootForwardStepWorld: .175, frames, transitions, materialCorrespondenceReviewed: false, wholeStrideApproved: false, loopApproved: false,
    scope: 'Procedural volume and projection targets only. Generated raster anatomy, corresponding sole material, support spacing, arms, actual held frames, turn continuity and final loops require independent source-bound review.' };
}
