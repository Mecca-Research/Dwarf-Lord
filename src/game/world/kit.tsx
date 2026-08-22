import { useMemo } from "react";
import * as THREE from "three";
import { groundHeight } from "../runtime";
import { useMats } from "./materials";

export function Crate({
  x,
  z,
  y = 0,
  s = 0.72,
  rot = 0,
}: {
  x: number;
  z: number;
  y?: number;
  s?: number;
  rot?: number;
}) {
  const m = useMats();
  const h = y || groundHeight(x, z);
  return (
    <group position={[x, h, z]} rotation-y={rot} scale={s / 0.72}>
      <mesh position={[0, 0.34, 0]} material={m.wood} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.64, 0.7]} />
      </mesh>
      <mesh position={[0, 0.14, 0]} material={m.iron}>
        <boxGeometry args={[0.74, 0.06, 0.74]} />
      </mesh>
      <mesh position={[0, 0.54, 0]} material={m.iron}>
        <boxGeometry args={[0.74, 0.06, 0.74]} />
      </mesh>
      <mesh position={[0, 0.68, 0]} rotation-z={0.04} material={m.woodDark} castShadow>
        <boxGeometry args={[0.72, 0.07, 0.72]} />
      </mesh>
    </group>
  );
}

export function Barrel({ x, z, y = 0, rot = 0, lying = false }: { x: number; z: number; y?: number; rot?: number; lying?: boolean }) {
  const m = useMats();
  const h = y || groundHeight(x, z);
  return (
    <group position={[x, h + (lying ? 0.32 : 0), z]} rotation-y={rot} rotation-z={lying ? Math.PI / 2 : 0}>
      <mesh position={[0, 0.48, 0]} material={m.wood} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.32, 0.92, 10]} />
      </mesh>
      <mesh position={[0, 0.18, 0]} material={m.iron}>
        <cylinderGeometry args={[0.33, 0.33, 0.07, 10]} />
      </mesh>
      <mesh position={[0, 0.78, 0]} material={m.iron}>
        <cylinderGeometry args={[0.32, 0.32, 0.07, 10]} />
      </mesh>
    </group>
  );
}

export function Sack({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  const m = useMats();
  const h = groundHeight(x, z);
  return (
    <group position={[x, h, z]} rotation-y={rot}>
      <mesh position={[0, 0.28, 0]} material={m.canvas} castShadow>
        <sphereGeometry args={[0.28, 8, 6]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={m.canvas} castShadow>
        <coneGeometry args={[0.14, 0.22, 6]} />
      </mesh>
    </group>
  );
}

export function Bucket({ x, z }: { x: number; z: number }) {
  const m = useMats();
  const h = groundHeight(x, z);
  return (
    <group position={[x, h, z]}>
      <mesh position={[0, 0.2, 0]} material={m.woodDark} castShadow>
        <cylinderGeometry args={[0.16, 0.13, 0.38, 8]} />
      </mesh>
      <mesh position={[0, 0.4, 0]} rotation-z={0.1} material={m.iron}>
        <torusGeometry args={[0.15, 0.018, 6, 12]} />
      </mesh>
    </group>
  );
}

export function Anvil({ x, z }: { x: number; z: number }) {
  const m = useMats();
  const h = groundHeight(x, z);
  return (
    <group position={[x, h, z]}>
      <mesh position={[0, 0.12, 0]} material={m.iron} castShadow>
        <boxGeometry args={[0.42, 0.22, 0.32]} />
      </mesh>
      <mesh position={[0, 0.34, 0]} material={m.iron} castShadow>
        <boxGeometry args={[0.7, 0.22, 0.28]} />
      </mesh>
      <mesh position={[0.4, 0.34, 0]} material={m.iron} castShadow>
        <boxGeometry args={[0.22, 0.1, 0.12]} />
      </mesh>
    </group>
  );
}

export function Chair({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  const m = useMats();
  const h = groundHeight(x, z);
  return (
    <group position={[x, h, z]} rotation-y={rot}>
      <mesh position={[0, 0.42, 0]} material={m.woodDark} castShadow>
        <boxGeometry args={[0.52, 0.08, 0.52]} />
      </mesh>
      <mesh position={[-0.2, 0.2, -0.2]} material={m.woodDark} castShadow>
        <boxGeometry args={[0.07, 0.4, 0.07]} />
      </mesh>
      <mesh position={[0.2, 0.2, -0.2]} material={m.woodDark} castShadow>
        <boxGeometry args={[0.07, 0.4, 0.07]} />
      </mesh>
      <mesh position={[-0.2, 0.2, 0.2]} material={m.woodDark} castShadow>
        <boxGeometry args={[0.07, 0.4, 0.07]} />
      </mesh>
      <mesh position={[0.2, 0.2, 0.2]} material={m.woodDark} castShadow>
        <boxGeometry args={[0.07, 0.4, 0.07]} />
      </mesh>
      <mesh position={[0, 0.82, -0.22]} material={m.woodDark} castShadow>
        <boxGeometry args={[0.52, 0.72, 0.08]} />
      </mesh>
      <mesh position={[0, 0.88, -0.18]} material={m.straw} castShadow>
        <boxGeometry args={[0.4, 0.5, 0.05]} />
      </mesh>
    </group>
  );
}

export function TorchPost({ x, z, lit = true }: { x: number; z: number; lit?: boolean }) {
  const m = useMats();
  const h = groundHeight(x, z);
  return (
    <group position={[x, h, z]}>
      <mesh position={[0, 0.85, 0]} material={m.woodDark} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 1.7, 6]} />
      </mesh>
      <mesh position={[0, 1.72, 0]} material={m.iron}>
        <cylinderGeometry args={[0.07, 0.05, 0.18, 6]} />
      </mesh>
      {lit ? (
        <>
          <mesh position={[0, 1.88, 0]} material={m.ember}>
            <sphereGeometry args={[0.07, 6, 6]} />
          </mesh>
          <pointLight position={[0, 1.9, 0]} color="#ff8a3a" intensity={3.2} distance={7} decay={2} />
        </>
      ) : null}
    </group>
  );
}

export function Woodpile({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  const m = useMats();
  const h = groundHeight(x, z);
  const logs = useMemo(
    () =>
      [
        [0, 0.1, 0, 0],
        [0.22, 0.1, 0.05, 0.2],
        [-0.2, 0.1, -0.04, -0.15],
        [0.08, 0.28, 0.02, 0.4],
        [-0.12, 0.28, 0.06, -0.3],
        [0, 0.46, 0, 0.1],
      ] as [number, number, number, number][],
    [],
  );
  return (
    <group position={[x, h, z]} rotation-y={rot}>
      {logs.map(([lx, ly, lz, r], i) => (
        <mesh key={i} position={[lx, ly, lz]} rotation-z={Math.PI / 2} rotation-y={r} material={m.bark} castShadow>
          <cylinderGeometry args={[0.09, 0.1, 1.15, 6]} />
        </mesh>
      ))}
    </group>
  );
}

export function PlankDebris({ x, z, rot = 0, len = 2.2 }: { x: number; z: number; rot?: number; len?: number }) {
  const m = useMats();
  const h = groundHeight(x, z);
  return (
    <mesh
      position={[x, h + 0.05, z]}
      rotation-y={rot}
      rotation-z={0.08}
      rotation-x={0.04}
      material={m.woodDark}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[len, 0.08, 0.28]} />
    </mesh>
  );
}

export function Rubble({ x, z, n = 5 }: { x: number; z: number; n?: number }) {
  const m = useMats();
  const h = groundHeight(x, z);
  const bits = useMemo(() => {
    const a: { x: number; z: number; s: number; ry: number }[] = [];
    for (let i = 0; i < n; i++) {
      a.push({
        x: Math.sin(i * 2.1 + x) * 0.55,
        z: Math.cos(i * 1.7 + z) * 0.5,
        s: 0.18 + (i % 4) * 0.08,
        ry: i * 0.9,
      });
    }
    return a;
  }, [n, x, z]);
  return (
    <group position={[x, h, z]}>
      {bits.map((b, i) => (
        <mesh key={i} position={[b.x, b.s * 0.35, b.z]} scale={[b.s, b.s * 0.7, b.s]} rotation-y={b.ry} material={m.rock} castShadow>
          <icosahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
    </group>
  );
}

export function OrePile({ x, z, color = "lime" }: { x: number; z: number; color?: "lime" | "iron" }) {
  const m = useMats();
  const h = groundHeight(x, z);
  const mat = color === "iron" ? m.iron : m.lime;
  return (
    <group position={[x, h, z]}>
      <mesh position={[0, 0.28, 0]} scale={[1.1, 0.55, 0.9]} material={mat} castShadow>
        <icosahedronGeometry args={[0.7, 1]} />
      </mesh>
      <mesh position={[0.35, 0.18, 0.15]} scale={[0.5, 0.35, 0.45]} material={mat} castShadow>
        <icosahedronGeometry args={[0.55, 0]} />
      </mesh>
    </group>
  );
}

export function Wheel({ x, y, z, rot = 0 }: { x: number; y: number; z: number; rot?: number }) {
  const m = useMats();
  return (
    <group position={[x, y, z]} rotation-z={Math.PI / 2} rotation-y={rot}>
      <mesh material={m.woodDark} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.12, 12]} />
      </mesh>
      <mesh material={m.iron}>
        <cylinderGeometry args={[0.06, 0.06, 0.16, 8]} />
      </mesh>
    </group>
  );
}

export function Kettle({ x, z, y = 0 }: { x: number; z: number; y?: number }) {
  const m = useMats();
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.16, 0]} material={m.iron} castShadow>
        <sphereGeometry args={[0.2, 8, 6]} />
      </mesh>
      <mesh position={[0, 0.32, 0]} material={m.iron}>
        <cylinderGeometry args={[0.12, 0.14, 0.08, 8]} />
      </mesh>
    </group>
  );
}

export function Bedroll({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  const m = useMats();
  const h = groundHeight(x, z);
  return (
    <group position={[x, h, z]} rotation-y={rot}>
      <mesh position={[0, 0.1, 0]} rotation-z={Math.PI / 2} material={m.canvas} castShadow>
        <capsuleGeometry args={[0.16, 0.7, 4, 8]} />
      </mesh>
    </group>
  );
}

export function Table({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  const m = useMats();
  const h = groundHeight(x, z);
  return (
    <group position={[x, h, z]} rotation-y={rot}>
      <mesh position={[0, 0.72, 0]} material={m.wood} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.08, 0.7]} />
      </mesh>
      {([-0.46, 0.46] as const).map((lx) =>
        ([-0.26, 0.26] as const).map((lz) => (
          <mesh key={`${lx}${lz}`} position={[lx, 0.36, lz]} material={m.woodDark} castShadow>
            <boxGeometry args={[0.08, 0.72, 0.08]} />
          </mesh>
        )),
      )}
      <mesh position={[0.15, 0.8, 0.05]} rotation-y={0.2} material={m.leather} castShadow>
        <boxGeometry args={[0.28, 0.04, 0.36]} />
      </mesh>
    </group>
  );
}

export function FencePost({ x, z }: { x: number; z: number }) {
  const m = useMats();
  const h = groundHeight(x, z);
  return (
    <mesh position={[x, h + 0.7, z]} material={m.woodDark} castShadow>
      <cylinderGeometry args={[0.07, 0.09, 1.4, 6]} />
    </mesh>
  );
}

export function Rail({ x, z, len = 4, rot = 0 }: { x: number; z: number; len?: number; rot?: number }) {
  const m = useMats();
  const h = groundHeight(x, z);
  return (
    <group position={[x, h, z]} rotation-y={rot}>
      <mesh position={[-0.28, 0.08, 0]} material={m.iron} castShadow>
        <boxGeometry args={[0.08, 0.06, len]} />
      </mesh>
      <mesh position={[0.28, 0.08, 0]} material={m.iron} castShadow>
        <boxGeometry args={[0.08, 0.06, len]} />
      </mesh>
      {Array.from({ length: Math.floor(len / 0.9) }).map((_, i) => (
        <mesh key={i} position={[0, 0.04, -len / 2 + 0.4 + i * 0.9]} material={m.woodDark}>
          <boxGeometry args={[0.72, 0.05, 0.12]} />
        </mesh>
      ))}
    </group>
  );
}
