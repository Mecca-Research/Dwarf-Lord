import type { ZoneId } from "./types";

export interface Body {
  x: number;
  z: number;
  yaw: number;
  speed: number;
  anim: "idle" | "sit" | "walk" | "work" | "talk" | "sleep";
  dest: { x: number; z: number } | null;
  bob: number;
}

export interface Obstacle {
  x: number;
  z: number;
  r: number;
}

export const runtime = {
  ready: false,
  player: {
    x: -30,
    z: 11,
    yaw: -Math.PI / 2,
    speed: 0,
    anim: "idle" as Body["anim"],
    dest: null as Body["dest"],
    bob: 0,
  },
  dwarves: new Map<string, Body>(),
  keys: new Set<string>(),
  cameraAzimuth: -0.92,
  cameraElev: 0.82,
  zoom: 40,
  zoomBias: 0,
  zone: "road" as ZoneId,
  pointerNdc: { x: 0, y: 0 },
  interactId: null as string | null,
  interactKind: null as "dwarf" | "building" | null,
  smoke: 0,
  dayPulse: 0,
};

export const OBSTACLES: Obstacle[] = [
  { x: -11, z: -5, r: 3.4 },
  { x: 10, z: -7, r: 3.0 },
  { x: 17, z: 8, r: 3.2 },
  { x: 12.5, z: 1.5, r: 2.4 },
  { x: 4, z: -16, r: 1.8 },
  { x: 14, z: -22, r: 2.2 },
  { x: -6, z: 7, r: 1.6 },
  { x: -3, z: 10, r: 1.5 },
  { x: 2, z: 6.5, r: 1.4 },
];

export function groundHeight(x: number, z: number) {
  const onRoad = x > -58 && x < -6 && z > 7.2 && z < 15.5;
  const onMine = x > 2 && x < 14 && z < -24 && z > -72;
  const onCamp = x > -22 && x < 24 && z > -20 && z < 14;
  const onForest = x < -34 && z > 6 && z < 28;

  const basin = Math.max(0, Math.hypot(x, z + 2) - 28);
  const mountain = Math.max(0, -z - 18);
  let h = mountain * 0.42 + mountain * mountain * 0.012;
  h += Math.sin(x * 0.11) * Math.sin(z * 0.09) * (0.4 + mountain * 0.08);
  if (z > 16) h += Math.max(0, z - 16) * 0.08;
  if (x < -36) h += Math.max(0, -36 - x) * 0.05;
  h += basin * 0.01;
  if (onMine) {
    const tunnel = 1 - Math.min(1, Math.abs(x - 8) / 6);
    h = Math.min(h, 0.15 + (1 - tunnel) * mountain * 0.3);
    return Math.max(0, h);
  }
  if (onRoad || onCamp || onForest) return Math.max(0, h);

  const dx = x < -22 ? -22 - x : x > 24 ? x - 24 : 0;
  const dz = z < -20 ? -20 - z : z > 14 ? z - 14 : 0;
  const drop = Math.max(dx, dz);
  return Math.max(-12, h - drop * 0.85);
}

export function zoneAt(x: number, z: number): ZoneId {
  if (x > 2 && x < 14 && z < -26) return "mine";
  if (z < -16) return "periphery";
  if (x < -34) return "forest";
  if (x < -22) return "road";
  return "camp";
}

export function resolveMove(
  x: number,
  z: number,
  dx: number,
  dz: number,
  radius = 0.55,
): { x: number; z: number } {
  let nx = x + dx;
  let nz = z + dz;
  for (const o of OBSTACLES) {
    const vx = nx - o.x;
    const vz = nz - o.z;
    const d = Math.hypot(vx, vz) || 0.0001;
    const min = o.r + radius;
    if (d < min) {
      const push = (min - d) / d;
      nx += vx * push;
      nz += vz * push;
    }
  }
  nx = Math.max(-62, Math.min(36, nx));
  nz = Math.max(-68, Math.min(32, nz));
  return { x: nx, z: nz };
}

export function camBasis(azimuth: number) {
  const forwardX = -Math.sin(azimuth);
  const forwardZ = -Math.cos(azimuth);
  const rightX = Math.cos(azimuth);
  const rightZ = -Math.sin(azimuth);
  return { forwardX, forwardZ, rightX, rightZ };
}
