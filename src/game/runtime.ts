import type { ZoneId } from "./types";
import {inMine,surfaceHeight,walkable} from "./world/landscape";

export interface Body {
  x: number;
  z: number;
  yaw: number;
  facing: number;
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
    x: -5,
    z: 4,
    yaw: -Math.PI / 2,
    facing: 3,
    speed: 0,
    anim: "idle" as Body["anim"],
    dest: null as Body["dest"],
    bob: 0,
  },
  dwarves: new Map<string, Body>(),
  keys: new Set<string>(),
  cameraAzimuth: -0.72,
  cameraElev: 0.6,
  valleyView: false,
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

export function groundHeight(x:number,z:number) {
  if(inMine(x,z))return 0;
  if(x>-33&&x<-22&&Math.abs(z-11)<1.9)return 0;
  return surfaceHeight(x,z);
}

export function zoneAt(x: number, z: number): ZoneId {
  if (inMine(x,z)) return "mine";
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
  if(walkable(nx,nz,radius))return {x:nx,z:nz};
  if(walkable(nx,z,radius))return {x:nx,z};
  if(walkable(x,nz,radius))return {x,z:nz};
  return {x,z};
}

export function camBasis(azimuth: number) {
  const forwardX = -Math.sin(azimuth);
  const forwardZ = -Math.cos(azimuth);
  const rightX = Math.cos(azimuth);
  const rightZ = -Math.sin(azimuth);
  return { forwardX, forwardZ, rightX, rightZ };
}

/** 0 front, 1 front-right, 2 right, 3 back-right, 4 back, 5 back-left, 6 left, 7 front-left */
export function facingOctant(yaw: number, camAz: number) {
  return facingFromMove(-Math.sin(yaw), -Math.cos(yaw), camAz);
}

/** Screen-space octant from a world-space move vector. 0 = toward camera. */
export function facingFromMove(mx: number, mz: number, camAz: number) {
  const { forwardX, forwardZ, rightX, rightZ } = camBasis(camAz);
  const sx = mx * rightX + mz * rightZ;
  const sy = mx * forwardX + mz * forwardZ;
  if (sx * sx + sy * sy < 1e-8) return -1;
  const ang = Math.atan2(sx, sy);
  const oct = Math.round(ang / (Math.PI / 4));
  return (((4 - oct) % 8) + 8) % 8;
}

export function setPlayerDest(x: number, z: number) {
  const p = runtime.player;
  p.dest = { x, z };
  const dx = x - p.x;
  const dz = z - p.z;
  const len = Math.hypot(dx, dz);
  if (len > 0.12) {
    p.yaw = Math.atan2(-dx, -dz);
    const f = facingFromMove(dx / len, dz / len, runtime.cameraAzimuth);
    if (f >= 0) p.facing = f;
  }
}
