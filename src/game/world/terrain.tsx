import { useMemo, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { groundHeight } from "../runtime";
import { rockGeo } from "./geom";
import { Boardwalk } from "./kit";
import { useMats } from "./materials";
const N = 128,
  R = 28;
const rand = (i: number) => {
  const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function rim(a: number) {
  const c = Math.cos(a),
    s = Math.sin(a),
    w = 1 + Math.sin(a * 9) * 0.014 + Math.sin(a * 17 + 1) * 0.012;
  return [
    1.4 + Math.sign(c) * Math.pow(Math.abs(c), 0.58) * 19.3 * w,
    0.3 + Math.sign(s) * Math.pow(Math.abs(s), 0.58) * 13.8 * w,
  ];
}
function surface(skirt = false) {
  const p: number[] = [],
    uv: number[] = [],
    co: number[] = [],
    ix: number[] = [],
    col = new THREE.Color();
  const rings = skirt ? 8 : R;
  for (let r = 0; r <= rings; r++)
    for (let s = 0; s <= N; s++) {
      const [ex, ez] = rim((s / N) * Math.PI * 2),
        f = skirt ? 1 + r * 0.018 + (r ? rand(s + r * 271) * 0.026 : 0) : r / R;
      const x = 1.4 + (ex - 1.4) * f,
        z = 0.3 + (ez - 0.3) * f;
      const y = skirt
        ? r === 0
          ? Math.max(0, groundHeight(ex, ez)) - 0.12
          : -r * 1.05 + rand(s + r * 83) * 0.5
        : Math.max(0, groundHeight(x, z)) - (r === R ? 0.12 : 0);
      p.push(x, y, z);
      uv.push(skirt ? (s / N) * 18 : x * 0.2, skirt ? r * 0.6 : z * 0.2);
      col
        .set(
          skirt
            ? ["#9da4a6", "#777e83", "#b3b4ac", "#747e87"][Math.floor(rand(s + r * 75) * 4)]
            : f > 0.88
              ? "#929984"
              : "#c8bba8",
        )
        .multiplyScalar(skirt ? 1 - r * 0.04 : 0.85 + rand(r * 311 + s) * 0.15);
      co.push(col.r, col.g, col.b);
      if (r < rings && s < N) {
        const i = r * (N + 1) + s;
        if (skirt) ix.push(i, i + 1, i + N + 1, i + 1, i + N + 2, i + N + 1);
        else ix.push(i, i + 1, i + N + 1, i + 1, i + N + 2, i + N + 1);
      }
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(co, 3));
  g.setIndex(ix);
  g.computeVertexNormals();
  return g;
}
function Dressing({ moss = false }: { moss?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null),
    count = moss ? 650 : 2400,
    g = useMemo(() => rockGeo(1, 2), []);
  const dressingMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#787d78", roughness: 1 }),
    [],
  );
  useLayoutEffect(() => {
    if (!ref.current) return;
    const o = new THREE.Object3D(),
      c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = rand(i * 7 + 31) * Math.PI * 2,
        [ex, ez] = rim(a),
        f = moss ? 0.83 + rand(i * 11) * 0.165 : Math.sqrt(rand(i * 11 + 3)) * 0.995,
        x = 1.4 + (ex - 1.4) * f,
        z = 0.3 + (ez - 0.3) * f,
        size = moss ? 0.08 + rand(i * 19) * 0.3 : 0.025 + Math.pow(rand(i * 19), 2) * 0.18;
      o.position.set(x, Math.max(0, groundHeight(x, z)) + (moss ? 0.018 : size * 0.28), z);
      const onWalk =
        (x < -10 && Math.abs(z - 11) < 1.1) || (Math.abs(x + 7.4) < 1.1 && z > -1 && z < 5.6);
      const scale = !moss && (onWalk || Math.hypot(x - 2, z - 6.5) < 1.4) ? size * 0.12 : size;
      o.scale.set(scale * (moss ? 1.6 : 1.2), scale * (moss ? 0.07 : 0.5), scale);
      o.rotation.set(rand(i * 29) * 0.2, i * 2.399, rand(i * 37) * 0.15);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
      c.set(
        moss
          ? ["#556039", "#394628", "#677144"][i % 3]
          : ["#a4aaa7", "#737c80", "#c0bdb2", "#656b6a", "#8e8170"][i % 5],
      );
      ref.current.setColorAt(i, c);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [count, moss]);
  return (
    <instancedMesh ref={ref} args={[g, dressingMat, count]} castShadow={!moss} receiveShadow />
  );
}
function Mountains() {
  const g = useMemo(() => {
    const geo = new THREE.PlaneGeometry(180, 85, 90, 40);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i);
      p.setY(
        i,
        Math.max(0, 1 - Math.abs(z) / 48) *
          (12 +
            9 * Math.sin(x * 0.085) +
            4 * Math.sin(x * 0.31) +
            2 * Math.cos(x * 0.83 + z * 0.5)) +
          Math.sin(z * 0.23) * 2,
      );
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
  return (
    <group>
      <mesh geometry={g} position={[0, -7, -67]}>
        <meshStandardMaterial color="#323f4b" roughness={1} />
      </mesh>
      <mesh geometry={g} position={[-38, -6, -91]} scale={[1.4, 1.5, 1.2]}>
        <meshStandardMaterial color="#53616d" roughness={1} />
      </mesh>
    </group>
  );
}
export function Terrain() {
  const m = useMats(),
    top = useMemo(() => surface(), []),
    cliff = useMemo(() => surface(true), []);
  const dirt = useMemo(() => {
    const mat = m.dirt.clone();
    mat.vertexColors = true;
    return mat;
  }, [m.dirt]);
  const rock = useMemo(() => {
    const mat = m.cliff.clone();
    mat.vertexColors = true;
    mat.side = THREE.DoubleSide;
    return mat;
  }, [m.cliff]);
  return (
    <group>
      <mesh position={[0, 8, 0]}>
        <sphereGeometry args={[125, 48, 24]} />
        <meshBasicMaterial map={m.sky} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      <Mountains />
      <mesh geometry={top} material={dirt} receiveShadow />
      <mesh geometry={cliff} material={rock} receiveShadow castShadow />
      <mesh position={[-37, -0.2, 11.1]} material={m.dirtRoad} receiveShadow>
        <boxGeometry args={[41, 0.4, 7.6]} />
      </mesh>
      <mesh position={[-46, -2.1, 15]} material={m.cliff} receiveShadow>
        <boxGeometry args={[31, 4, 22]} />
      </mesh>
      <mesh position={[8, -0.18, -37]} material={m.dirt} receiveShadow>
        <boxGeometry args={[13, 0.4, 53]} />
      </mesh>
      <Dressing />
      <Dressing moss />
      {Array.from({ length: 28 }, (_, i) => (
        <Pine
          key={i}
          x={-38 - (i % 7) * 3.2}
          z={18 + Math.floor(i / 7) * 3.1}
          scale={0.8 + rand(i) * 0.35}
        />
      ))}
    </group>
  );
}
function Pine({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  const m = useMats();
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 1, 0]} material={m.bark}>
        <cylinderGeometry args={[0.1, 0.18, 2.2, 8]} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[0, 1.6 + i * 0.48, 0]}
          rotation-y={i * 0.8}
          material={m.needle}
          castShadow
        >
          <coneGeometry args={[1.35 - i * 0.22, 1.8, 9]} />
        </mesh>
      ))}
    </group>
  );
}
export function PathClutter() {
  return (
    <group>
      <Boardwalk x={-25} z={11} len={28} rot={Math.PI / 2} width={1.85} />
      <Boardwalk x={-7.2} z={8.4} len={10} rot={1.15} width={1.85} />
      <Boardwalk x={-7.4} z={2.3} len={6.5} rot={0.1} width={1.8} />
    </group>
  );
}
