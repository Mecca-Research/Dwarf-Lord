import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { runtime, zoneAt } from "../runtime";
import { MINE_OUTLINE, random, inMine } from "./landscape";
import { rockGeo, useTiledMat } from "./geom";
import { Barrel, Crate, OrePile, Pickaxe, Rail, Rubble, Sack, Woodpile } from "./kit";
import { useMats } from "./materials";
import { useBedrockMaterial } from "./mountain-base";
function MineLantern({ x, z }: { x: number; z: number }) {
  const m = useMats();
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.1, 0]} material={m.woodDark}>
        <boxGeometry args={[0.13, 2.2, 0.13]} />
      </mesh>
      <mesh position={[0.15, 2.05, 0]} material={m.iron}>
        <boxGeometry args={[0.4, 0.07, 0.08]} />
      </mesh>
      <mesh position={[0.3, 1.83, 0]} material={m.iron}>
        <boxGeometry args={[0.24, 0.36, 0.24]} />
      </mesh>
      <mesh position={[0.3, 1.82, 0.13]}>
        <planeGeometry args={[0.13, 0.2]} />
        <meshStandardMaterial
          color="#ffda8f"
          emissive="#ffb751"
          emissiveIntensity={2.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight
        position={[0.3, 1.9, 0.2]}
        color="#ffc17b"
        intensity={24}
        distance={13}
        decay={2}
      />
    </group>
  );
}
function floorGeometry() {
  const shape = new THREE.Shape();
  MINE_OUTLINE.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
  shape.closePath();
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position,
    uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) * 0.035, p.getZ(i) * 0.035);
  return g;
}
function wallGeometry(
  a: readonly [number, number],
  b: readonly [number, number],
  upper: boolean,
  seed: number,
) {
  const p: number[] = [],
    uv: number[] = [],
    ix: number[] = [];
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    length = Math.hypot(dx, dz),
    n = Math.ceil(length / 1.3);
  for (let j = 0; j <= n; j++)
    for (let row = 0; row < 3; row++) {
      const t = j / n,
        y = (upper ? 1.15 : 0) + ((upper ? 5.4 + random(seed + j) * 2.8 : 1.2) * row) / 2;
      const inset = (row === 1 ? 0.45 : 0) + Math.sin(j * 1.7 + seed) * 0.2;
      p.push(a[0] + dx * t - (dz / length) * inset, y, a[1] + dz * t + (dx / length) * inset);
      uv.push(t * length * 0.08, y * 0.08);
      if (j < n && row < 2) {
        const q = j * 3 + row;
        ix.push(q, q + 3, q + 1, q + 1, q + 3, q + 4);
      }
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(ix);
  g.computeVertexNormals();
  return g;
}
function WallSection({ index }: { index: number }) {
  const material = useBedrockMaterial(),
    high = useRef<THREE.Mesh>(null);
  const a = MINE_OUTLINE[index],
    b = MINE_OUTLINE[(index + 1) % MINE_OUTLINE.length];
  const lowGeo = useMemo(() => wallGeometry(a, b, false, index * 37), [a, b, index]);
  const highGeo = useMemo(() => wallGeometry(a, b, true, index * 37), [a, b, index]);
  useFrame(() => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]),
      nx = -(b[1] - a[1]) / length,
      nz = (b[0] - a[0]) / length;
    if (high.current)
      high.current.visible =
        nx * Math.sin(runtime.cameraAzimuth) + nz * Math.cos(runtime.cameraAzimuth) < 0.12;
  });
  return (
    <group>
      <mesh geometry={lowGeo} material={material} receiveShadow />
      <mesh ref={high} geometry={highGeo} material={material} receiveShadow />
    </group>
  );
}
function ChamberWalls() {
  return (
    <group name="continuous-excavated-rock-walls">
      {MINE_OUTLINE.map((_, i) => (i === 0 ? null : <WallSection key={i} index={i} />))}
    </group>
  );
}
function QuarryScatter() {
  const m = useMats(),
    ref = useRef<THREE.InstancedMesh>(null),
    geometry = useMemo(() => rockGeo(1, 83), []);
  const stones = useMemo(
    () =>
      Array.from({ length: 1300 }, (_, i) => ({
        x: -20 + random(i * 11) * 55,
        z: -88 + random(i * 17 + 6) * 55,
        size: 0.025 + random(i * 19) * 0.12,
      })).filter((p) => inMine(p.x, p.z)),
    [],
  );
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    stones.forEach((s, i) => {
      o.position.set(s.x, 0.02, s.z);
      o.scale.set(s.size * 1.4, s.size * 0.3, s.size);
      o.rotation.y = i * 2.399;
      o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [stones]);
  return <instancedMesh ref={ref} args={[geometry, m.rock, stones.length]} />;
}
function TimberSupport({ x, z, width = 6 }: { x: number; z: number; width?: number }) {
  const m = useMats();
  return (
    <group position={[x, 0, z]}>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[(side * width) / 2, 1.85, 0]}
            rotation-z={side * 0.035}
            material={m.woodDark}
          >
            <boxGeometry args={[0.28, 3.7, 0.3]} />
          </mesh>
          <mesh
            position={[side * (width / 2 - 0.55), 3.25, 0]}
            rotation-z={-side * 0.72}
            material={m.wood}
          >
            <boxGeometry args={[0.18, 1.65, 0.2]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3.8, 0]} material={m.woodDark}>
        <boxGeometry args={[width + 0.6, 0.34, 0.36]} />
      </mesh>
    </group>
  );
}
function OreFace({ x, z, color }: { x: number; z: number; color: string }) {
  const m = useMats(),
    g = useMemo(() => rockGeo(1, 43), []);
  return (
    <group position={[x, 0, z]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          geometry={g}
          material={m.rock}
          position={[(i - 2) * 0.7, 0.6 + random(i) * 0.3, random(i + 10) * 0.6]}
          scale={[1.1, 1.3 + random(i + 17), 1]}
          rotation-y={i * 1.3}
          receiveShadow
        />
      ))}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <mesh
          key={i}
          position={[-1.6 + i * 0.5, 0.6 + random(i + 33) * 1.1, 0.85]}
          rotation={[0.25, 0.4, -0.7 + random(i + 45) * 0.5]}
          scale={[0.09, 0.6, 0.12]}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={color} roughness={0.7} metalness={0.15} />
        </mesh>
      ))}
    </group>
  );
}
export function MineInterior() {
  const m = useMats(),
    root = useRef<THREE.Group>(null),
    floor = useMemo(floorGeometry, []);
  const baseFloorMat = useTiledMat(m.dirt, 1, 1);
  const floorMat = useMemo(() => {
    baseFloorMat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `float quarry=dot(texture2D(map,vMapUv).rgb,vec3(.2126,.7152,.0722));
         diffuseColor.rgb=vec3(.19,.21,.22)*(.45+quarry*3.5);`,
      );
    };
    baseFloorMat.customProgramCacheKey = () => "first-chamber-gravel-v1";
    return baseFloorMat;
  }, [baseFloorMat]);
  useFrame(() => {
    if (root.current) root.current.visible = zoneAt(runtime.player.x, runtime.player.z) === "mine";
  });
  return (
    <group ref={root} visible={false} name="first-mining-level">
      <mesh position={[8, -0.25, -46]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[360, 360]} />
        <meshBasicMaterial color="#080b0e" />
      </mesh>
      <mesh geometry={floor} material={floorMat} receiveShadow />
      <ChamberWalls />
      <QuarryScatter />
      <TimberSupport x={8} z={-29.8} />
      <TimberSupport x={8} z={-34.5} width={8} />
      <TimberSupport x={19} z={-54} width={8} />
      <TimberSupport x={3} z={-69} width={10} />
      <TimberSupport x={13} z={-80} width={8} />
      <Rail x={8} z={-32} len={11} />
      <Rail x={8} z={-41} len={6} />
      <Rail x={8} z={-53} len={14} />
      <Rail x={8} z={-69} len={10} />
      <MineLantern x={4} z={-34} />
      <MineLantern x={19} z={-43} />
      <MineLantern x={14} z={-59} />
      <MineLantern x={-8} z={-47} />
      <MineLantern x={-14} z={-64} />
      <MineLantern x={23} z={-66} />
      <MineLantern x={2} z={-83} />
      <MineLantern x={17} z={-77} />
      <OreFace x={10} z={-48} color="#a3724d" />
      <OreFace x={7} z={-40.5} color="#b6b3a1" />
      <OreFace x={-16} z={-56} color="#626d77" />
      <OrePile x={12.5} z={-48} color="iron" />
      <OrePile x={6.5} z={-39.8} />
      <Woodpile x={17.8} z={-36} rot={0.3} />
      <Woodpile x={-9} z={-61} rot={1.57} />
      <Barrel x={-12} z={-63} />
      <Barrel x={-13} z={-63.7} />
      <Barrel x={-12.5} z={-65} />
      <Crate x={-9} z={-66} s={1.1} />
      <Crate x={-8.5} z={-65} s={0.8} />
      <Sack x={-11} z={-65.8} />
      <OreFace x={26} z={-70} color="#996b48" />
      <OreFace x={5} z={-88} color="#b9b5a1" />
      <Rubble x={24} z={-80} n={18} />
      <Rubble x={17} z={-34} n={16} />
      <Woodpile x={17.5} z={-34} rot={0.5} />
      <mesh rotation-x={-Math.PI / 2} position={[-8, 0.012, -73]} scale={[4.5, 8, 1]}>
        <circleGeometry args={[1, 24]} />
        <meshStandardMaterial
          color="#283b3d"
          roughness={0.22}
          metalness={0.35}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
      <Barrel x={17} z={-37.5} />
      <Barrel x={18} z={-38} />
      <Crate x={3} z={-39} s={0.95} />
      <Crate x={2.2} z={-40} s={0.7} />
      <Sack x={1.8} z={-39} />
      <Pickaxe x={15} z={-39} rot={0.7} />
      <Rubble x={-2.5} z={-55} n={10} />
      <Rubble x={19} z={-56} n={8} />
      <mesh position={[19, 2.8, -82.5]}>
        <planeGeometry args={[5.5, 5.6]} />
        <meshBasicMaterial color="#050608" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
