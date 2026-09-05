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
    const camp = x > -16.5 && x < 19.5 && z > -11.5 && z < 12.6;
    if (inTunnel) c.set("#211f1e");
    else if (cliff) c.set("#3f4142");
    else if (road) c.set("#6d5c4c");
    else if (y > 4) c.set("#515254");
    else if (forest) c.set("#3f4937");
    else if (!camp) c.set("#414344");
    else if (z < -14) c.set("#5d554b");
    else c.set("#756555");
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
  const cliffMat = useTiledMat(m.cliff, 2.2, 1.6);
  const rockMat = useTiledMat(m.rock, 2.4, 2.4);
  const cliffGeo = useMemo(() => rockGeo(1, 3), []);

  const pines = useMemo(() => {
    const pts: { x: number; z: number; s: number }[] = [];
    for (let i = 0; i < 46; i++) {
      const x = -38 - (i % 8) * 2.8 - ((i * 1.7) % 3);
      const z = 18 - Math.floor(i / 8) * 4.5 + (i % 3) * 1.4;
      if (z > 6 && z < 28 && x > -60 && x < -34) pts.push({ x, z, s: 0.85 + (i % 5) * 0.08 });
    }
    for (let i = 0; i < 14; i++) pts.push({ x: -22 - i * 1.6, z: 22 + (i % 4) * 1.8, s: 0.9 });
    return pts;
  }, []);

  const cliffs = useMemo(
    () =>
      [
        { x: 8.5, z: 13.6, s: [6.8, 5.8, 4.2], ry: 0.15, y: -2.4 },
        { x: 14.2, z: 11.4, s: [5.6, 6.2, 4.8], ry: 0.7, y: -2.6 },
        { x: 18.6, z: 5.2, s: [5.2, 6.4, 6.2], ry: 0.35, y: -2.8 },
        { x: 18.8, z: -4.5, s: [6.0, 6.0, 5.5], ry: -0.4, y: -2.5 },
        { x: 15.5, z: -11.8, s: [6.4, 5.6, 4.8], ry: 0.2, y: -2.2 },
        { x: 4.2, z: -12.6, s: [5.8, 5.2, 4.4], ry: 0.9, y: -2.0 },
        { x: -8.5, z: -12.2, s: [6.2, 5.4, 4.6], ry: -0.3, y: -2.1 },
        { x: -16.8, z: -6.0, s: [5.4, 6.0, 5.2], ry: 0.5, y: -2.4 },
        { x: -17.4, z: 4.2, s: [5.0, 5.8, 5.6], ry: -0.55, y: -2.5 },
        { x: -14.8, z: 13.2, s: [6.4, 5.6, 4.4], ry: 0.25, y: -2.3 },
        { x: -4.2, z: 14.4, s: [5.2, 5.0, 3.8], ry: -0.2, y: -2.1 },
        { x: 2.2, z: 14.8, s: [4.8, 4.8, 3.6], ry: 0.8, y: -2.0 },
        { x: 11.2, z: 14.2, s: [5.0, 5.4, 4.0], ry: 0.4, y: -2.2 },
      ] as { x: number; z: number; s: number[]; ry: number; y: number }[],
    [],
  );

  const rocks = useMemo(() => {
    const pts: { x: number; z: number; s: number; ry: number }[] = [];
    for (let i = 0; i < 28; i++) {
      pts.push({
        x: -10 + ((i * 3.4) % 40),
        z: -18 - ((i * 2.2) % 22),
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
      <mesh position={[6, 16, -52]} rotation={[0.06, 0.08, 0]}>
        <planeGeometry args={[120, 52]} />
        <meshBasicMaterial map={m.sky} fog={false} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh geometry={terrain} material={dirtMat} receiveShadow />
      <mesh
        geometry={mountains}
        position={[8, 2.2, -62]}
        material={rockMat}
        receiveShadow
        castShadow
      />
      <mesh
        position={[32, 14, -70]}
        rotation={[0.12, 0.5, -0.06]}
        scale={[1.5, 1.35, 1.2]}
        material={m.rock}
        castShadow
      >
        <icosahedronGeometry args={[14, 1]} />
      </mesh>
      <mesh
        position={[-24, 11, -68]}
        rotation={[0.18, 1.0, 0]}
        scale={[1.6, 1.15, 1.3]}
        material={m.stoneDark}
        castShadow
      >
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
          material={cliffMat}
          castShadow
          receiveShadow
        />
      ))}
      <mesh position={[2, -8.2, 1]} rotation-x={-Math.PI / 2} material={m.stoneDark} receiveShadow>
        <planeGeometry args={[90, 80]} />
      </mesh>

      <mesh
        position={[-28, 0.04, 11.2]}
        rotation-x={-Math.PI / 2}
        material={m.dirtRoad}
        receiveShadow
      >
        <planeGeometry args={[46, 3.4]} />
      </mesh>
      <mesh
        position={[-8, 0.045, 8]}
        rotation-x={-Math.PI / 2}
        rotation-z={-0.4}
        material={m.dirtRoad}
        receiveShadow
      >
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
      <CampGroundDetail />
    </group>
  );
}

function CampGroundDetail() {
  const m = useMats();
  const pebbles = useMemo(
    () =>
      Array.from({ length: 96 }, (_, i) => {
        const x = -15 + ((i * 7.37) % 33);
        const z = -10 + ((i * 11.13) % 21);
        return {
          x,
          z,
          size: 0.055 + (i % 6) * 0.025,
          turn: (i * 1.91) % Math.PI,
        };
      }).filter(({ x, z }) => Math.hypot(x - 2, z - 6.5) > 1.6),
    [],
  );
  const moss = useMemo(
    () => [
      { x: -14.1, z: 9.8, sx: 2.5, sz: 1.3, r: 0.2 },
      { x: -13.7, z: -8.7, sx: 2.1, sz: 1.15, r: -0.4 },
      { x: 15.4, z: 10.1, sx: 2.8, sz: 1.2, r: 0.55 },
      { x: 17.4, z: -7.6, sx: 2.3, sz: 1.05, r: -0.25 },
      { x: -3.5, z: 12.0, sx: 1.8, sz: 0.8, r: 0.1 },
    ],
    [],
  );

  return (
    <group>
      {moss.map((patch, i) => (
        <mesh
          key={`moss-${i}`}
          position={[patch.x, groundHeight(patch.x, patch.z) + 0.025, patch.z]}
          rotation={[-Math.PI / 2, 0, patch.r]}
          scale={[patch.sx, patch.sz, 1]}
          material={m.moss}
          receiveShadow
        >
          <circleGeometry args={[1, 18]} />
        </mesh>
      ))}
      {pebbles.map((stone, i) => (
        <mesh
          key={`pebble-${i}`}
          position={[stone.x, groundHeight(stone.x, stone.z) + stone.size * 0.42, stone.z]}
          rotation={[stone.turn * 0.2, stone.turn, stone.turn * 0.12]}
          scale={[stone.size * 1.5, stone.size * 0.65, stone.size]}
          material={i % 3 === 0 ? m.stone : m.stoneDark}
          castShadow
          receiveShadow
        >
          <icosahedronGeometry args={[1, 0]} />
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
