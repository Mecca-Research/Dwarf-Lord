/** Shared geography: metres, x east, z south, y up. */
export const MINE_OUTLINE: readonly (readonly [number, number])[] = [
  [5.6, -26],
  [10.4, -26],
  [14, -31],
  [28, -35],
  [32, -45],
  [29, -55],
  [36, -65],
  [31, -78],
  [23, -84],
  [13, -83],
  [5, -92],
  [-8, -89],
  [-19, -78],
  [-17, -65],
  [-22, -55],
  [-14, -44],
  [-5, -39],
  [1, -34],
  [5.6, -31],
];
export const MINE_ENTRY = { x: 8, z: -25 };
const LANDMARKS: Record<
  string,
  { center: { x: number; z: number }; approach: { x: number; z: number } }
> = {
  dorm: { center: { x: -11, z: -5 }, approach: { x: -10, z: -0.3 } },
  forge: { center: { x: 10, z: -7 }, approach: { x: 6, z: -7 } },
  storage: { center: { x: 17, z: 8 }, approach: { x: 13, z: 8 } },
  office: { center: { x: 12.5, z: 1.5 }, approach: { x: 12.5, z: 6.5 } },
  "tent-a": { center: { x: -9, z: 15 }, approach: { x: -9, z: 19.2 } },
  "tent-b": { center: { x: -2, z: 17 }, approach: { x: -2, z: 21.1 } },
  shaft: { center: { x: 14, z: -22 }, approach: { x: 14, z: -18.7 } },
  cart: { center: { x: 4, z: -16 }, approach: { x: 4, z: -13 } },
  kitchen: { center: { x: 2, z: 6.5 }, approach: { x: -0.5, z: 4.5 } },
};
/** Canonical approaches also keep older saved building positions inspectable. */
export function buildingApproach(building: { id: string; x: number; z: number }) {
  return LANDMARKS[building.id]?.approach ?? building;
}
export function buildingCenter(building: { id: string; x: number; z: number }) {
  return LANDMARKS[building.id]?.center ?? building;
}
export const random = (seed: number) => {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};
export function smooth(a: number, b: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
export function noise(x: number, z: number) {
  const ix = Math.floor(x),
    iz = Math.floor(z),
    u = smooth(0, 1, x - ix),
    v = smooth(0, 1, z - iz);
  const a = random(ix + iz * 173),
    b = random(ix + 1 + iz * 173),
    c = random(ix + (iz + 1) * 173),
    d = random(ix + 1 + (iz + 1) * 173);
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}
export function inMine(x: number, z: number) {
  if (z >= -26) return false;
  let inside = false;
  for (let i = 0, j = MINE_OUTLINE.length - 1; i < MINE_OUTLINE.length; j = i++) {
    const [ax, az] = MINE_OUTLINE[i],
      [bx, bz] = MINE_OUTLINE[j];
    if (az > z !== bz > z && x < ((bx - ax) * (z - az)) / (bz - az) + ax) inside = !inside;
  }
  return inside;
}
export const creekX = (z: number) => -28 + Math.sin(z * 0.065) * 2.7 + Math.sin(z * 0.19) * 0.7;
/** A connected crest, with long spurs and glacial gullies rather than isolated cones. */
const MAIN_CREST: readonly (readonly [number, number, number])[] = [
  [-150, -128, 76],
  [-115, -140, 108],
  [-90, -126, 95],
  [-65, -148, 128],
  [-41, -142, 119],
  [-20, -127, 103],
  [3, -140, 148],
  [20, -142, 156],
  [35, -129, 130],
  [55, -133, 119],
  [80, -151, 142],
  [110, -143, 108],
  [147, -160, 126],
];
function ridge(
  x: number,
  z: number,
  points: readonly (readonly [number, number, number])[],
  width: number,
) {
  let height = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, az, ah] = points[i - 1],
      [bx, bz, bh] = points[i];
    const dx = bx - ax,
      dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    const distance = Math.hypot(x - ax - dx * t, z - az - dz * t);
    const profile = Math.max(0, 1 - distance / width);
    height = Math.max(height, (ah + (bh - ah) * t) * Math.pow(profile, 0.95));
  }
  return height;
}
export function cliffHeight(x: number) {
  return (
    (12.5 + noise(x * 0.11, 13) * 6 + Math.abs(Math.sin(x * 0.23)) * 2.2) *
    (1 - smooth(29, 40, Math.abs(x - 3)))
  );
}
export function surfaceHeight(x: number, z: number) {
  const north = Math.max(0, -z - 27),
    side = Math.max(0, Math.abs(x - 3) - 28);
  const ridges = Math.max(
    ridge(x, z, MAIN_CREST, 103),
    ridge(
      x,
      z,
      [
        [-113, -4, 29],
        [-91, -36, 51],
        [-78, -67, 69],
        [-72, -94, 87],
      ],
      48,
    ),
    ridge(
      x,
      z,
      [
        [121, 14, 35],
        [99, -29, 55],
        [84, -67, 72],
        [98, -108, 112],
      ],
      51,
    ),
  );
  const detail =
    (noise(x * 0.065, z * 0.065) - 0.5) * 7 +
    (noise(x * 0.17, z * 0.17) - 0.5) * 2.4 +
    (noise(x * 0.43, z * 0.43) - 0.5) * 0.6;
  const gullies = Math.abs(Math.sin(x * 0.17 + Math.sin(z * 0.052) * 2.4));
  let h = Math.max(ridges, cliffHeight(x) * smooth(0, 8, -z - 26));
  h +=
    Math.min(18, side * 0.22) + detail * smooth(0, 10, Math.max(north, side)) * (1 + ridges * 0.01);
  h -= gullies * smooth(15, 70, ridges) * 5.5;
  h += Math.max(0, z - 25) * 0.09;
  h -= (1 - smooth(0.8, 3.1, Math.abs(x - creekX(z)))) * 1.2 * (1 - smooth(-26, -34, z));
  const terrace =
    (1 - smooth(21, 29, Math.abs(x - 2))) * (1 - smooth(24, 29, -z)) * (1 - smooth(16, 24, z));
  const forest =
    (1 - smooth(-60, -64, x)) *
    (1 - smooth(-35, -31, x)) *
    smooth(5, 8, z) *
    (1 - smooth(27, 31, z));
  const road =
    (1 - smooth(2.8, 4.8, Math.abs(z - 11))) * smooth(-65, -60, x) * (1 - smooth(-22, -18, x));
  h *= 1 - Math.max(terrace, forest, road);
  const terraceSteps =
    (1 - smooth(2, 4, Math.abs(x + 20))) * smooth(10, 18, -z) * (1 - smooth(21, 25, -z));
  h = Math.max(h, terraceSteps * 2.4);
  if (Math.abs(x - creekX(z)) < 2 && z > -24)
    h = Math.min(h, -0.9 * (1 - smooth(0.8, 2, Math.abs(x - creekX(z)))));
  return h;
}
export function walkable(x: number, z: number, radius = 0) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  if (z < -26)
    return [
      [0, 0],
      [radius, 0],
      [-radius, 0],
      [0, radius],
      [0, -radius],
    ].every(([dx, dz]) => (z + dz >= -26 ? x + dx > 5.6 && x + dx < 10.4 : inMine(x + dx, z + dz)));
  const camp = x >= -23 + radius && x <= 28 - radius && z >= -26 && z <= 23 - radius;
  const forest = x >= -62 + radius && x <= -20 && z >= 6 + radius && z <= 31 - radius;
  const crossing = Math.abs(z - 11) < 1.8 - radius,
    bank = Math.abs(x - creekX(z)) > 2.1 + radius;
  return (camp || forest) && (bank || crossing);
}
export function navigationTarget(x: number, z: number, destination: { x: number; z: number }) {
  if (destination.z < -26 && z >= -26)
    return Math.hypot(x - MINE_ENTRY.x, z - MINE_ENTRY.z) > 1.2 ? MINE_ENTRY : { x: 8, z: -30 };
  if (destination.z >= -26 && z < -26) return MINE_ENTRY;
  if ((x - creekX(z)) * (destination.x - creekX(destination.z)) < 0) {
    if (Math.abs(z - 11) > 1.1) return { x: x < creekX(z) ? -33 : -23, z: 11 };
    return { x: destination.x < -28 ? -33 : -23, z: 11 };
  }
  return destination;
}
