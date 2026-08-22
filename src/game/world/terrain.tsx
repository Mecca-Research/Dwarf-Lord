import { useMemo } from "react";
import * as THREE from "three";
import { groundHeight } from "../runtime";
import { useMats } from "./materials";

function makeTerrain() {
  const w = 128;
  const d = 110;
  const geo = new THREE.PlaneGeometry(w, d, 96, 80);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    let y = groundHeight(x, z);
    const inTunnel = x > 2.4 && x < 13.6 && z < -24 && z > -70;
    if (inTunnel) y = 0.02;
    pos.setY(i, y);
    uv.setXY(i, x * 0.18, z * 0.18);
    const road = x > -58 && x < -8 && z > 7 && z < 15 && y < 1.2;
    const forest = x < -34 && z > 6;
    if (inTunnel) c.set("#2a2622");
    else if (road) c.set("#d8c4a8");
    else if (y > 4) c.set("#b0aaa0");
    else if (forest) c.set("#8a9a6c");
    else if (z < -14) c.set("#c4b49a");
    else c.set("#e0ccb0");
    const n = (Math.sin(x * 2.1) * Math.cos(z * 1.7) + 1) * 0.05;
    c.offsetHSL(0, 0, n - 0.04);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function makeMountains() {
  const geo = new THREE.PlaneGeometry(110, 55, 48, 24);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const ridge = Math.exp(-((x - 8) * (x - 8)) / 900);
    const h =
      10 +
      ridge * 9 +
      Math.abs(x) * 0.04 +
      Math.sin(x * 0.18) * 2.4 +
      Math.cos(z * 0.22 + x * 0.1) * 1.8 +
      Math.sin(x * 0.51) * Math.sin(z * 0.4) * 1.4;
    const bowl = Math.max(0, 12 - Math.hypot(x - 8, z + 8));
    pos.setY(i, Math.max(0.2, h - bowl * 0.55));
    uv.setXY(i, x * 0.07, z * 0.07);
  }
  geo.computeVertexNormals();
  return geo;
}

export function Terrain() {
  const m = useMats();
  const terrain = useMemo(() => makeTerrain(), []);
  const mountains = useMemo(() => makeMountains(), []);
  const dirtMat = useMemo(() => {
    const mat = m.dirt.clone();
    mat.vertexColors = true;
    return mat;
  }, [m.dirt]);
  const forestMat = useMemo(() => {
    const mat = m.forest.clone();
    mat.vertexColors = true;
    return mat;
  }, [m.forest]);

  const pines = useMemo(() => {
    const pts: { x: number; z: number; s: number }[] = [];
    for (let i = 0; i < 46; i++) {
      const x = -38 - (i % 8) * 2.8 - (i * 1.7) % 3;
      const z = 18 - Math.floor(i / 8) * 4.5 + (i % 3) * 1.4;
      if (z > 6 && z < 28 && x > -60 && x < -34) pts.push({ x, z, s: 0.85 + (i % 5) * 0.08 });
    }
    for (let i = 0; i < 14; i++) pts.push({ x: -22 - i * 1.6, z: 22 + (i % 4) * 1.8, s: 0.9 });
    return pts;
  }, []);

  const rocks = useMemo(() => {
    const pts: { x: number; z: number; s: number; ry: number }[] = [];
    for (let i = 0; i < 34; i++) {
      pts.push({
        x: -8 + (i * 3.1) % 42,
        z: -20 - (i * 2.4) % 24,
        s: 0.45 + (i % 5) * 0.28,
        ry: i * 0.7,
      });
    }
    return pts;
  }, []);

  const grass = useMemo(() => {
    const pts: { x: number; z: number; s: number; ry: number }[] = [];
    for (let i = 0; i < 52; i++) {
      const x = -18 + ((i * 5.17) % 38);
      const z = -10 + ((i * 3.91) % 26);
      if (Math.hypot(x + 11, z + 5) < 5.5) continue;
      if (Math.hypot(x - 10, z + 7) < 4) continue;
      if (Math.hypot(x - 12.5, z - 1.5) < 3) continue;
      if (Math.hypot(x - 2, z - 6.5) < 2.2) continue;
      pts.push({ x, z, s: 0.55 + (i % 4) * 0.12, ry: i * 0.8 });
    }
    return pts;
  }, []);

  return (
    <group>
      <mesh geometry={terrain} material={dirtMat} receiveShadow />
      <mesh geometry={mountains} position={[6, -0.4, -52]} material={m.rock} receiveShadow castShadow />
      <mesh position={[26, 8, -56]} rotation={[0.15, 0.4, -0.08]} scale={[1.3, 1.1, 1.1]} material={m.rock} castShadow>
        <icosahedronGeometry args={[12, 1]} />
      </mesh>
      <mesh position={[-18, 6.5, -54]} rotation={[0.2, 1.1, 0]} scale={[1.4, 1, 1.2]} material={m.stoneDark} castShadow>
        <icosahedronGeometry args={[10, 1]} />
      </mesh>

      {/* Packed road ribbon */}
      <mesh position={[-28, 0.03, 11.2]} rotation-x={-Math.PI / 2} material={m.dirtRoad} receiveShadow>
        <planeGeometry args={[46, 3.2]} />
      </mesh>
      <mesh position={[-8, 0.035, 8]} rotation-x={-Math.PI / 2} rotation-z={-0.4} material={m.dirtRoad} receiveShadow>
        <planeGeometry args={[14, 2.8]} />
      </mesh>

      {/* Forest floor patch */}
      <mesh position={[-46, 0.04, 16]} rotation-x={-Math.PI / 2} material={forestMat} receiveShadow>
        <planeGeometry args={[28, 22]} />
      </mesh>

      {pines.map((p, i) => (
        <Pine key={i} x={p.x} z={p.z} scale={p.s} />
      ))}
      {rocks.map((r, i) => (
        <mesh
          key={`rk${i}`}
          position={[r.x, groundHeight(r.x, r.z) + r.s * 0.28, r.z]}
          scale={[r.s, r.s * 0.62, r.s * 0.9]}
          rotation-y={r.ry}
          material={m.rock}
          castShadow
          receiveShadow
        >
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      ))}
      {grass.map((g, i) => (
        <group key={`gr${i}`} position={[g.x, groundHeight(g.x, g.z) + 0.12, g.z]} rotation-y={g.ry} scale={g.s}>
          <mesh rotation-x={-0.35} material={m.moss}>
            <planeGeometry args={[0.32, 0.34]} />
          </mesh>
          <mesh rotation-y={1.05} rotation-x={-0.32} material={m.moss}>
            <planeGeometry args={[0.28, 0.3]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Pine({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  const m = useMats();
  const y = groundHeight(x, z);
  const h = 3.1 * scale;
  return (
    <group position={[x, y, z]} scale={scale}>
      <mesh position={[0, h * 0.2, 0]} material={m.bark} castShadow>
        <cylinderGeometry args={[0.11, 0.2, h * 0.42, 6]} />
      </mesh>
      <mesh position={[0, h * 0.48, 0]} material={m.needle} castShadow>
        <coneGeometry args={[1.2, h * 0.58, 7]} />
      </mesh>
      <mesh position={[0, h * 0.72, 0]} material={m.needle} castShadow>
        <coneGeometry args={[0.86, h * 0.46, 7]} />
      </mesh>
      <mesh position={[0, h * 0.94, 0]} material={m.needle} castShadow>
        <coneGeometry args={[0.5, h * 0.34, 7]} />
      </mesh>
    </group>
  );
}

export function PathClutter() {
  const m = useMats();
  return (
    <group>
      {[-44, -36, -28, -20].map((x) => (
        <mesh key={x} position={[x, groundHeight(x, 13.5) + 0.75, 13.5]} material={m.woodDark} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 1.5, 6]} />
        </mesh>
      ))}
      <mesh position={[-16, 0.06, 10.5]} rotation-y={0.08} material={m.wood} receiveShadow>
        <boxGeometry args={[22, 0.1, 2.6]} />
      </mesh>
    </group>
  );
}
