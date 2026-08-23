import { useMemo } from "react";
import * as THREE from "three";
import { groundHeight } from "../runtime";
import { rockGeo, useTiledMat } from "./geom";
import { Boardwalk } from "./kit";
import { useMats } from "./materials";

function makeTerrain() {
  const w = 108;
  const d = 96;
  const geo = new THREE.PlaneGeometry(w, d, 110, 90);
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
    uv.setXY(i, x * 0.12, z * 0.12);
    const road = x > -58 && x < -8 && z > 7 && z < 15 && y < 1.4;
    const forest = x < -34 && z > 6;
    const cliff = y < -1.5;
    const camp = x > -20 && x < 22 && z > -16 && z < 14;
    if (inTunnel) c.set("#2a2622");
    else if (cliff) c.set("#5a5248");
    else if (road) c.set("#b89a78");
    else if (y > 4) c.set("#8a847c");
    else if (forest) c.set("#6a7a52");
    else if (!camp) c.set("#5a5248");
    else if (z < -14) c.set("#8a7a64");
    else c.set("#c4b090");
    const n = (Math.sin(x * 1.7) * Math.cos(z * 1.4) + 1) * 0.04;
    c.offsetHSL(0, 0, n - 0.06);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function makeMountains() {
  const geo = new THREE.PlaneGeometry(140, 70, 56, 28);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const ridge = Math.exp(-((x - 8) * (x - 8)) / 1100);
    const h =
      14 +
      ridge * 16 +
      Math.abs(x) * 0.05 +
      Math.sin(x * 0.14) * 3.2 +
      Math.cos(z * 0.18 + x * 0.08) * 2.4 +
      Math.sin(x * 0.45) * Math.sin(z * 0.35) * 2.0;
    pos.setY(i, Math.max(0.4, h));
    uv.setXY(i, x * 0.05, z * 0.05);
  }
  geo.computeVertexNormals();
  return geo;
}

function SkyDome() {
  const m = useMats();
  const mat = useMemo(() => {
    const mm = new THREE.MeshBasicMaterial({
      map: m.sky,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    });
    return mm;
  }, [m.sky]);
  return (
    <mesh scale={[-1, 1, 1]} position={[0, 8, -8]}>
      <sphereGeometry args={[120, 40, 24]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

export function Terrain() {
  const m = useMats();
  const terrain = useMemo(() => makeTerrain(), []);
  const mountains = useMemo(() => makeMountains(), []);
  const dirtMat = useMemo(() => {
    const mat = m.dirt.clone();
    mat.vertexColors = true;
    if (mat.map) {
      mat.map = mat.map.clone();
      mat.map.repeat.set(8, 7);
      mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
    }
    return mat;
  }, [m.dirt]);
  const forestMat = useMemo(() => {
    const mat = m.forest.clone();
    mat.vertexColors = true;
    return mat;
  }, [m.forest]);
  const rockMat = useTiledMat(m.rock, 2.4, 2.4);
  const cliffGeo = useMemo(() => rockGeo(1, 3), []);

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

  const cliffs = useMemo(
    () =>
      [
        { x: 18, z: 13, s: [7.2, 5.0, 6.0], ry: 0.4, y: -1.4 },
        { x: 22, z: 3, s: [6.5, 5.4, 6.8], ry: 0.8, y: -1.6 },
        { x: 20, z: -9, s: [7.5, 5.2, 5.6], ry: -0.3, y: -1.2 },
        { x: 14, z: 15, s: [5.8, 4.0, 5.0], ry: 1.1, y: -1.0 },
        { x: -16, z: 15, s: [6.8, 4.6, 5.6], ry: 0.2, y: -1.3 },
        { x: -20, z: 6, s: [6.0, 5.0, 5.2], ry: -0.6, y: -1.5 },
        { x: -18, z: -8, s: [6.8, 5.0, 6.0], ry: 0.5, y: -1.1 },
        { x: 6, z: 16.5, s: [5.4, 3.8, 4.6], ry: 0.9, y: -0.9 },
        { x: 24, z: -16, s: [8.4, 6.2, 6.8], ry: 0.15, y: -0.4 },
        { x: -4, z: 16.5, s: [5.0, 3.6, 4.2], ry: -0.4, y: -1.2 },
        { x: 12, z: -14, s: [6.2, 4.4, 5.2], ry: 0.3, y: -0.8 },
        { x: -12, z: -13, s: [5.6, 4.2, 4.8], ry: 0.7, y: -1.0 },
      ] as { x: number; z: number; s: number[]; ry: number; y: number }[],
    [],
  );

  const rocks = useMemo(() => {
    const pts: { x: number; z: number; s: number; ry: number }[] = [];
    for (let i = 0; i < 28; i++) {
      pts.push({
        x: -10 + (i * 3.4) % 40,
        z: -18 - (i * 2.2) % 22,
        s: 0.5 + (i % 5) * 0.32,
        ry: i * 0.7,
      });
    }
    // camp scatter
    const camp = [
      [-14.5, 1.2, 0.55],
      [-9.2, 8.4, 0.4],
      [6.8, 9.5, 0.45],
      [15.5, 4.2, 0.7],
      [-2.2, -10.5, 0.5],
    ] as [number, number, number][];
    camp.forEach(([x, z, s], i) => pts.push({ x, z, s, ry: i * 1.1 }));
    return pts;
  }, []);

  return (
    <group>
      <SkyDome />
      <mesh geometry={terrain} material={dirtMat} receiveShadow />
      <mesh geometry={mountains} position={[8, 2.2, -62]} material={rockMat} receiveShadow castShadow />
      <mesh position={[32, 14, -70]} rotation={[0.12, 0.5, -0.06]} scale={[1.5, 1.35, 1.2]} material={m.rock} castShadow>
        <icosahedronGeometry args={[14, 1]} />
      </mesh>
      <mesh position={[-24, 11, -68]} rotation={[0.18, 1.0, 0]} scale={[1.6, 1.15, 1.3]} material={m.stoneDark} castShadow>
        <icosahedronGeometry args={[12, 1]} />
      </mesh>
      <mesh position={[4, 18, -78]} scale={[2.2, 1.6, 1.4]} material={m.rock} castShadow>
        <icosahedronGeometry args={[11, 1]} />
      </mesh>

      {cliffs.map((c, i) => (
        <mesh
          key={`cl${i}`}
          geometry={cliffGeo}
          position={[c.x, c.y, c.z]}
          scale={c.s as [number, number, number]}
          rotation-y={c.ry}
          material={rockMat}
          castShadow
          receiveShadow
        />
      ))}

      <mesh position={[-28, 0.04, 11.2]} rotation-x={-Math.PI / 2} material={m.dirtRoad} receiveShadow>
        <planeGeometry args={[46, 3.4]} />
      </mesh>
      <mesh position={[-8, 0.045, 8]} rotation-x={-Math.PI / 2} rotation-z={-0.4} material={m.dirtRoad} receiveShadow>
        <planeGeometry args={[14, 2.9]} />
      </mesh>
      <mesh position={[-46, 0.05, 16]} rotation-x={-Math.PI / 2} material={forestMat} receiveShadow>
        <planeGeometry args={[28, 22]} />
      </mesh>

      {pines.map((p, i) => (
        <Pine key={i} x={p.x} z={p.z} scale={p.s} />
      ))}
      {rocks.map((r, i) => (
        <mesh
          key={`rk${i}`}
          position={[r.x, Math.max(0, groundHeight(r.x, r.z)) + r.s * 0.28, r.z]}
          scale={[r.s, r.s * 0.62, r.s * 0.9]}
          rotation-y={r.ry}
          material={m.rock}
          castShadow
          receiveShadow
        >
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}

function Pine({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  const m = useMats();
  const y = Math.max(0, groundHeight(x, z));
  const h = 3.4 * scale;
  return (
    <group position={[x, y, z]} scale={scale}>
      <mesh position={[0, h * 0.2, 0]} material={m.bark} castShadow>
        <cylinderGeometry args={[0.12, 0.22, h * 0.42, 6]} />
      </mesh>
      <mesh position={[0, h * 0.5, 0]} material={m.needle} castShadow>
        <coneGeometry args={[1.25, h * 0.6, 7]} />
      </mesh>
      <mesh position={[0, h * 0.74, 0]} material={m.needle} castShadow>
        <coneGeometry args={[0.9, h * 0.48, 7]} />
      </mesh>
      <mesh position={[0, h * 0.96, 0]} material={m.needle} castShadow>
        <coneGeometry args={[0.52, h * 0.36, 7]} />
      </mesh>
    </group>
  );
}

export function PathClutter() {
  return (
    <group>
      <Boardwalk x={-18} z={11.0} len={22} rot={Math.PI / 2} width={1.55} />
      <Boardwalk x={-7.2} z={8.4} len={10} rot={1.15} width={1.4} />
    </group>
  );
}
