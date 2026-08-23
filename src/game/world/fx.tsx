import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useMats } from "./materials";

export function FlameSprite({
  x,
  y,
  z,
  scale = 1,
}: {
  x: number;
  y: number;
  z: number;
  scale?: number;
}) {
  const m = useMats();
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const mesh = ref.current;
    if (!mesh) return;
    mesh.scale.x = scale * (0.85 + Math.sin(t * 11.3) * 0.12);
    mesh.scale.y = scale * (1 + Math.sin(t * 8.1) * 0.14);
  });
  return (
    <Billboard position={[x, y, z]} follow>
      <mesh ref={ref}>
        <planeGeometry args={[1.05, 1.55]} />
        <meshBasicMaterial
          map={m.flame}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.95}
        />
      </mesh>
    </Billboard>
  );
}

export function Campfire({ x, y, z }: { x: number; y: number; z: number }) {
  const m = useMats();
  const glow = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (glow.current) {
      const mat = glow.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 2.2 + Math.sin(t * 7) * 0.55;
      glow.current.scale.setScalar(1.05 + Math.sin(t * 9) * 0.1);
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh ref={glow} material={m.ember}>
        <sphereGeometry args={[0.22, 10, 8]} />
      </mesh>
      <FlameSprite x={0} y={0.55} z={0} scale={1.35} />
      <FlameSprite x={0.08} y={0.35} z={0.05} scale={0.7} />
      <mesh position={[0.06, 0.1, 0.04]} material={m.ember}>
        <sphereGeometry args={[0.1, 6, 5]} />
      </mesh>
      <ChimneySmoke x={0} y={0.9} z={0} />
    </group>
  );
}

export function ChimneySmoke({
  x,
  y,
  z,
  thin,
}: {
  x: number;
  y: number;
  z: number;
  thin?: boolean;
}) {
  const m = useMats();
  const g = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const group = g.current;
    if (!group) return;
    group.children.forEach((ch, i) => {
      const phase = t * 0.35 + i * 0.9;
      ch.position.y = (phase % 2.4) * 0.85;
      const u = (phase % 2.4) / 2.4;
      const s = (thin ? 0.35 : 0.5) * (0.4 + u * 1.4);
      ch.scale.setScalar(Math.max(0.05, s));
      ch.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (mat && "opacity" in mat) mat.opacity = (1 - u) * (thin ? 0.22 : 0.32);
      });
    });
  });
  return (
    <group ref={g} position={[x, y, z]}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Billboard key={i} follow>
          <mesh>
            <planeGeometry args={[1.1, 1.1]} />
            <meshBasicMaterial
              map={m.smokeTex}
              transparent
              depthWrite={false}
              opacity={0.25}
              color="#c8c0b4"
            />
          </mesh>
        </Billboard>
      ))}
    </group>
  );
}
