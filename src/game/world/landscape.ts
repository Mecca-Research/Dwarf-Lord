/** Shared geography: metres, x east, z south, y up. */
export const MINE_OUTLINE: readonly (readonly [number, number])[] = [
  [3, -26],
  [13, -26],
  [15, -31],
  [21, -34],
  [25, -43],
  [23, -56],
  [17, -64],
  [5, -67],
  [-5, -60],
  [-8, -49],
  [-4, -39],
  [1, -34],
  [3, -31],
];
export const MINE_ENTRY = { x: 8, z: -25 };
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
export function surfaceHeight(x: number, z: number) {
  const north = Math.max(0, -z - 27),
    side = Math.max(0, Math.abs(x - 3) - 28);
  const peak = (cx: number, cz: number, rx: number, rz: number, h: number) =>
    Math.pow(Math.max(0, 1 - Math.hypot((x - cx) / rx, (z - cz) / rz)), 1.12) * h;
  const ridges = Math.max(
    peak(7, -91, 55, 69, 81),
    peak(-53, -99, 49, 68, 69),
    peak(66, -103, 52, 75, 85),
    peak(-87, -40, 48, 80, 41),
    peak(94, -29, 56, 86, 47),
  );
  const detail = (noise(x * 0.12, z * 0.12) - 0.5) * 6 + (noise(x * 0.42, z * 0.42) - 0.5) * 2;
  let h = Math.min(45, side * 0.32 + side * side * 0.0016) + Math.min(11, north * 1.8) + ridges;
  h += detail * smooth(0, 10, Math.max(north, side)) * (1 + ridges * 0.04);
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
  if (Math.abs(x - 8) < 4 && z < -26 && z > -30) h = Math.min(h, Math.max(0, -z - 26) * 2.3);
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
    ].every(([dx, dz]) => (z + dz >= -26 ? x + dx > 3 && x + dx < 13 : inMine(x + dx, z + dz)));
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
