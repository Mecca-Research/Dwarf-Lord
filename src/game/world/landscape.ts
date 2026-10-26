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
export const TARN = { x: -54, z: -59, rx: 16, rz: 11, waterY: 24.5 };
export const CAMP_ADDITIONS = {
  mess: { x: 11, z: 29, approach: { x: 21, z: 28 } },
  well: { x: 28, z: 24, approach: { x: 25, z: 24 } },
  wagon: { x: 31, z: 5, approach: { x: 26, z: 5 } },
  timber: { x: 31, z: -9, approach: { x: 25, z: -9 } },
  tentWest: { x: -16, z: 27, approach: { x: -16, z: 32 } },
  tentSouth: { x: -6, z: 30, approach: { x: -6, z: 35 } },
  gate: { x: 8, z: 38.8, approach: { x: 8, z: 38 } },
};
/** These same footprints are used by the new structures and their street routes. */
export const CAMP_OBSTACLES = [
  { x: -11, z: -5, r: 3.4 },
  { x: 10, z: -7, r: 3.0 },
  { x: 17, z: 8, r: 3.2 },
  { x: 12.5, z: 1.5, r: 2.4 },
  { x: 4, z: -16, r: 1.8 },
  { x: 14, z: -22, r: 2.2 },
  { x: -9, z: 15, r: 2.5 },
  { x: -2, z: 17, r: 2.2 },
  { x: 7, z: 18, r: 2.4 },
  { x: 2, z: 6.5, r: 1.4 },
  { ...CAMP_ADDITIONS.well, r: 1.7 },
  { ...CAMP_ADDITIONS.wagon, r: 3.5 },
  { ...CAMP_ADDITIONS.timber, r: 2.7 },
  { x: 31, z: -17, r: 2.2 },
  { ...CAMP_ADDITIONS.tentWest, r: 2.7 },
  { ...CAMP_ADDITIONS.tentSouth, r: 2.4 },
  ...[-6.2, 0, 6.2].map((offset) => ({
    x: CAMP_ADDITIONS.mess.x + offset,
    z: CAMP_ADDITIONS.mess.z,
    r: 1.9,
  })),
];
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
export function campClearing(x: number, z: number) {
  const original =
    (1 - smooth(21, 29, Math.abs(x - 2))) * (1 - smooth(24, 29, -z)) * (1 - smooth(16, 24, z));
  const south = 1 - smooth(0.84, 1.12, Math.max(Math.abs(x - 8) / 30, Math.abs(z - 27) / 18));
  const east = 1 - smooth(0.78, 1.12, Math.max(Math.abs(x - 29) / 13, Math.abs(z - 4) / 28));
  return Math.max(original, south, east);
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
  const terrace = campClearing(x, z);
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
  const lakeRadius = Math.hypot((x - TARN.x) / TARN.rx, (z - TARN.z) / TARN.rz);
  if (lakeRadius < 1.4) {
    const bed = TARN.waterY - 1.7 + Math.min(1.5, lakeRadius) ** 3 * 1.9;
    h = bed + (h - bed) * smooth(0.95, 1.4, lakeRadius);
  }
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
  const camp = x >= -23 + radius && x <= 36 - radius && z >= -26 && z <= 40 - radius;
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
  if (x > 28 || z > 23 || destination.x > 28 || destination.z > 23)
    return campStreetTarget(x, z, destination);
  return destination;
}

const STREETS = [
  [-18, 10],
  [-20, 21],
  [-20, 35],
  [-1, 37],
  [8, 37],
  [22, 37],
  [22, 21],
  [25, 13],
  [25, -20],
  [33, 35],
  [33, 16],
].map(([x, z]) => ({ x, z }));
function clearStreet(a: { x: number; z: number }, b: { x: number; z: number }) {
  const dx = b.x - a.x,
    dz = b.z - a.z,
    len2 = dx * dx + dz * dz;
  return CAMP_OBSTACLES.every((o) => {
    const t = Math.max(0, Math.min(1, ((o.x - a.x) * dx + (o.z - a.z) * dz) / (len2 || 1)));
    return Math.hypot(a.x + dx * t - o.x, a.z + dz * t - o.z) > o.r + 0.65;
  });
}
const STREET_EDGES = STREETS.map((a) =>
  STREETS.map((b) => (clearStreet(a, b) ? Math.hypot(a.x - b.x, a.z - b.z) : Infinity)),
);
/** Small visibility graph for the new district. Existing work routes retain their old waypoints. */
function campStreetTarget(x: number, z: number, destination: { x: number; z: number }) {
  const start = { x, z };
  if (clearStreet(start, destination)) return destination;
  const cost = STREETS.map((p) =>
    clearStreet(p, destination) ? Math.hypot(p.x - destination.x, p.z - destination.z) : Infinity,
  );
  const visited = new Set<number>();
  for (let k = 0; k < STREETS.length; k++) {
    let next = -1;
    for (let i = 0; i < cost.length; i++)
      if (!visited.has(i) && (next < 0 || cost[i] < cost[next])) next = i;
    if (next < 0 || !Number.isFinite(cost[next])) break;
    visited.add(next);
    for (let i = 0; i < cost.length; i++)
      cost[i] = Math.min(cost[i], cost[next] + STREET_EDGES[next][i]);
  }
  let best = Infinity,
    target = destination;
  STREETS.forEach((point, i) => {
    const distance = Math.hypot(x - point.x, z - point.z),
      score = distance + cost[i];
    if (distance > 0.75 && score < best && clearStreet(start, point)) {
      best = score;
      target = point;
    }
  });
  return target;
}
