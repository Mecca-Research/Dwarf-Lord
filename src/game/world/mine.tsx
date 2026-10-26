import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { runtime, zoneAt } from "../runtime";
import { MINE_OUTLINE, random } from "./landscape";
import { rockGeo, useTiledMat } from "./geom";
import { Barrel, Crate, OrePile, Pickaxe, Rail, Rubble, Sack, Woodpile } from "./kit";
import { useMats } from "./materials";
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
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) * 0.27, p.getZ(i) * 0.27);
  return g;
}
function ChamberWalls() {
  const m = useMats(),
    high = useRef<THREE.InstancedMesh>(null),
    low = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => rockGeo(1, 19), []),
    object = useMemo(() => new THREE.Object3D(), []);
  const blocks = useMemo(() => {
    const result: {
      x: number;
      z: number;
      nx: number;
      nz: number;
      height: number;
      width: number;
    }[] = [];
    MINE_OUTLINE.forEach(([ax, az], i) => {
      if (i === 0) return;
      const [bx, bz] = MINE_OUTLINE[(i + 1) % MINE_OUTLINE.length],
        length = Math.hypot(bx - ax, bz - az),
        n = Math.ceil(length / 1.6);
      for (let j = 0; j < n; j++) {
        const t = (j + 0.5) / n;
        result.push({
          x: ax + (bx - ax) * t,
          z: az + (bz - az) * t,
          nx: -(bz - az) / length,
          nz: (bx - ax) / length,
          height: 4.4 + random(i * 23 + j) * 2,
          width: (length / n) * 1.1,
        });
      }
    });
    return result;
  }, []);
  useLayoutEffect(() => {
    blocks.forEach((b, i) => {
      object.position.set(b.x, 0.36, b.z);
      object.rotation.y = Math.atan2(b.nx, b.nz);
      object.scale.set(b.width, 0.85, 1.65);
      object.updateMatrix();
      low.current!.setMatrixAt(i, object.matrix);
    });
    low.current!.instanceMatrix.needsUpdate = true;
    low.current!.computeBoundingSphere();
  }, [blocks, object]);
  useFrame(() => {
    const cx = Math.sin(runtime.cameraAzimuth),
      cz = Math.cos(runtime.cameraAzimuth);
    blocks.forEach((b, i) => {
      const h = b.nx * cx + b.nz * cz > 0.12 ? 0.2 : b.height;
      object.position.set(b.x, 0.65 + h * 0.34, b.z);
      object.rotation.y = Math.atan2(b.nx, b.nz);
      object.scale.set(b.width, h, 1.8);
      object.updateMatrix();
      high.current!.setMatrixAt(i, object.matrix);
    });
    high.current!.instanceMatrix.needsUpdate = true;
  });
  return (
    <group name="camera-cutaway-chamber-walls">
      <instancedMesh ref={low} args={[geometry, m.rock, blocks.length]} receiveShadow />
      <instancedMesh
        ref={high}
        args={[geometry, m.cliff, blocks.length]}
        frustumCulled={false}
        receiveShadow
      />
    </group>
  );
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
  const floorMat = useTiledMat(m.dirt, 1, 1);
  floorMat.color.set("#ada89b");
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
      <TimberSupport x={8} z={-29.8} />
      <TimberSupport x={8} z={-34.5} width={8} />
      <TimberSupport x={17} z={-52} width={6.5} />
      <Rail x={8} z={-32} len={11} />
      <Rail x={8} z={-41} len={6} />
      <MineLantern x={4} z={-34} />
      <MineLantern x={19} z={-43} />
      <MineLantern x={14} z={-59} />
      <MineLantern x={-3} z={-49} />
      <OreFace x={19.5} z={-45} color="#a3724d" />
      <OreFace x={7} z={-62} color="#b6b3a1" />
      <OreFace x={-4} z={-49} color="#626d77" />
      <OrePile x={10.5} z={-48} color="iron" />
      <OrePile x={6.5} z={-39.8} />
      <Woodpile x={17.8} z={-36} rot={0.3} />
      <Barrel x={17} z={-37.5} />
      <Barrel x={18} z={-38} />
      <Crate x={3} z={-39} s={0.95} />
      <Crate x={2.2} z={-40} s={0.7} />
      <Sack x={1.8} z={-39} />
      <Pickaxe x={15} z={-39} rot={0.7} />
      <Rubble x={-2.5} z={-55} n={10} />
      <Rubble x={19} z={-56} n={8} />
      <mesh position={[13, 1.5, -64.7]}>
        <planeGeometry args={[3.5, 3]} />
        <meshBasicMaterial color="#050608" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
