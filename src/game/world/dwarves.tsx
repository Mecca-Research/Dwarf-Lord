import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Dwarf } from "../types";
import type { Body } from "../runtime";

const mats = new Map<string, THREE.MeshStandardMaterial>();

function mat(color: string, roughness = 0.7, metalness = 0.05) {
  const k = `${color}:${roughness}:${metalness}`;
  let m = mats.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    mats.set(k, m);
  }
  return m;
}

export function DwarfRig({
  dwarf,
  body,
  isPlayer,
  scale = 1,
}: {
  dwarf?: Pick<Dwarf, "clothes" | "beard" | "skin" | "helmet">;
  body: Body;
  isPlayer?: boolean;
  scale?: number;
}) {
  const g = useRef<THREE.Group>(null);
  const lLeg = useRef<THREE.Group>(null);
  const rLeg = useRef<THREE.Group>(null);
  const lArm = useRef<THREE.Group>(null);
  const rArm = useRef<THREE.Group>(null);
  const tool = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);

  const clothes = dwarf?.clothes ?? "#2a2420";
  const beard = dwarf?.beard ?? "#3a3028";
  const skin = dwarf?.skin ?? "#c4a07a";
  const helmet = dwarf?.helmet ?? isPlayer === false;

  const clothesM = useMemo(() => mat(clothes, 0.78), [clothes]);
  const beardM = useMemo(() => mat(beard, 0.9), [beard]);
  const skinM = useMemo(() => mat(skin, 0.68), [skin]);
  const darkM = useMemo(() => mat("#1a1612", 0.62, 0.18), []);
  const copperM = useMemo(() => mat("#c4784a", 0.32, 0.62), []);
  const ironM = useMemo(() => mat("#6a6864", 0.38, 0.55), []);
  const bootM = useMemo(() => mat("#1c1612", 0.85), []);
  const beltM = useMemo(() => mat("#3a2818", 0.8), []);
  const leatherM = useMemo(() => mat("#4a3020", 0.88), []);

  useFrame((_, dt) => {
    const group = g.current;
    if (!group) return;
    const sit = body.anim === "sit";
    const walk = body.anim === "walk" || body.speed > 0.2;
    const work = body.anim === "work";
    body.bob += dt * (walk ? 9.5 : work ? 8 : 2.2);
    const bob = walk ? Math.sin(body.bob) * 0.045 : sit ? 0 : Math.sin(body.bob * 0.5) * 0.012;
    group.position.y = (sit ? -0.02 : 0) + bob;

    const swing = walk ? Math.sin(body.bob) : 0;
    if (lLeg.current) lLeg.current.rotation.x = sit ? 1.15 : swing * 0.7;
    if (rLeg.current) rLeg.current.rotation.x = sit ? 1.15 : -swing * 0.7;
    if (lArm.current) {
      lArm.current.rotation.x = walk ? -swing * 0.55 : work ? Math.sin(body.bob) * 0.9 - 0.5 : sit ? 0.35 : 0.12;
    }
    if (rArm.current) {
      rArm.current.rotation.x = walk ? swing * 0.55 : work ? Math.sin(body.bob + 0.4) * 0.7 - 0.3 : sit ? 0.35 : 0.12;
    }
    if (tool.current) {
      const show = Boolean(work || (helmet && !isPlayer && !sit));
      tool.current.rotation.z = work ? -0.5 + Math.sin(body.bob) * 0.55 : -0.55;
      tool.current.visible = show;
    }
    if (torso.current && !sit && !walk) {
      torso.current.position.y = Math.sin(body.bob * 0.5) * 0.012;
    }
  });

  const sit = body.anim === "sit";
  const tunic = isPlayer ? darkM : clothesM;

  return (
    <group ref={g} scale={scale}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[0.38, 14]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.38} />
      </mesh>

      <group position={[0, sit ? 0.22 : 0, 0]}>
        {/* Legs */}
        <group ref={lLeg} position={[-0.16, sit ? 0.38 : 0.42, sit ? 0.16 : 0]}>
          <mesh position={[0, -0.16, 0]} castShadow material={clothesM}>
            <capsuleGeometry args={[0.1, 0.28, 3, 8]} />
          </mesh>
          <mesh position={[0.02, -0.36, 0.04]} castShadow material={bootM}>
            <boxGeometry args={[0.16, 0.12, 0.24]} />
          </mesh>
        </group>
        <group ref={rLeg} position={[0.16, sit ? 0.38 : 0.42, sit ? 0.16 : 0]}>
          <mesh position={[0, -0.16, 0]} castShadow material={clothesM}>
            <capsuleGeometry args={[0.1, 0.28, 3, 8]} />
          </mesh>
          <mesh position={[-0.02, -0.36, 0.04]} castShadow material={bootM}>
            <boxGeometry args={[0.16, 0.12, 0.24]} />
          </mesh>
        </group>

        <group ref={torso} position={[0, sit ? 0.62 : 0.72, 0]}>
          {/* Tunic */}
          <mesh position={[0, 0.08, 0]} castShadow material={tunic}>
            <capsuleGeometry args={[0.26, 0.36, 4, 10]} />
          </mesh>
          {/* Belly - dwarf silhouette */}
          <mesh position={[0, -0.02, 0.06]} scale={[1.05, 0.7, 0.9]} castShadow material={tunic}>
            <sphereGeometry args={[0.24, 10, 8]} />
          </mesh>
          {/* Belt */}
          <mesh position={[0, -0.08, 0]} material={beltM} castShadow>
            <boxGeometry args={[0.56, 0.07, 0.42]} />
          </mesh>
          <mesh position={[0, -0.08, 0.22]} material={copperM}>
            <boxGeometry args={[0.1, 0.08, 0.04]} />
          </mesh>
          {isPlayer ? (
            <mesh position={[0, 0.18, -0.16]} rotation-x={0.25} material={leatherM} castShadow>
              <boxGeometry args={[0.5, 0.55, 0.08]} />
            </mesh>
          ) : null}

          {/* Head */}
          <mesh position={[0, 0.48, 0.04]} castShadow material={skinM}>
            <sphereGeometry args={[0.2, 12, 10]} />
          </mesh>
          {/* Nose */}
          <mesh position={[0, 0.46, 0.2]} rotation-x={0.35} castShadow material={skinM}>
            <boxGeometry args={[0.08, 0.08, 0.1]} />
          </mesh>
          {/* Ears */}
          <mesh position={[-0.18, 0.5, 0.02]} material={skinM} castShadow>
            <sphereGeometry args={[0.055, 6, 6]} />
          </mesh>
          <mesh position={[0.18, 0.5, 0.02]} material={skinM} castShadow>
            <sphereGeometry args={[0.055, 6, 6]} />
          </mesh>
          {/* Hair cap */}
          <mesh position={[0, 0.58, 0]} material={beardM} castShadow>
            <sphereGeometry args={[0.185, 10, 8, 0, Math.PI * 2, 0, 1.1]} />
          </mesh>
          {/* Beard volume */}
          <mesh position={[0, 0.32, 0.14]} rotation-x={0.55} castShadow material={beardM}>
            <coneGeometry args={[0.2, 0.38, 8]} />
          </mesh>
          <mesh position={[0, 0.38, 0.1]} scale={[1.15, 0.7, 0.9]} material={beardM} castShadow>
            <sphereGeometry args={[0.18, 8, 6]} />
          </mesh>
          {/* Mustache */}
          <mesh position={[0, 0.42, 0.2]} material={beardM} castShadow>
            <boxGeometry args={[0.22, 0.05, 0.06]} />
          </mesh>

          {helmet ? (
            <>
              <mesh position={[0, 0.62, 0.02]} castShadow material={ironM}>
                <sphereGeometry args={[0.22, 10, 8, 0, Math.PI * 2, 0, 1.25]} />
              </mesh>
              <mesh position={[0, 0.54, 0.02]} material={ironM} castShadow>
                <cylinderGeometry args={[0.23, 0.24, 0.06, 12]} />
              </mesh>
              <mesh position={[0, 0.52, 0.22]} material={ironM} castShadow>
                <boxGeometry args={[0.08, 0.12, 0.1]} />
              </mesh>
            </>
          ) : null}

          {isPlayer ? (
            <mesh position={[0, 0.12, 0.28]} material={copperM} castShadow>
              <torusGeometry args={[0.12, 0.025, 6, 10]} />
            </mesh>
          ) : null}

          {/* Arms */}
          <group ref={lArm} position={[-0.32, 0.16, 0]}>
            <mesh position={[0, -0.16, 0]} rotation-z={0.28} castShadow material={tunic}>
              <capsuleGeometry args={[0.08, 0.28, 3, 8]} />
            </mesh>
            <mesh position={[-0.08, -0.34, 0.02]} material={skinM} castShadow>
              <sphereGeometry args={[0.07, 6, 6]} />
            </mesh>
          </group>
          <group ref={rArm} position={[0.32, 0.16, 0]}>
            <mesh position={[0, -0.16, 0]} rotation-z={-0.28} castShadow material={tunic}>
              <capsuleGeometry args={[0.08, 0.28, 3, 8]} />
            </mesh>
            <mesh position={[0.08, -0.34, 0.02]} material={skinM} castShadow>
              <sphereGeometry args={[0.07, 6, 6]} />
            </mesh>
            <group ref={tool} position={[0.12, -0.38, 0.12]} rotation-z={-0.55} rotation-x={0.35}>
              <mesh material={leatherM} castShadow>
                <cylinderGeometry args={[0.03, 0.035, 0.7, 6]} />
              </mesh>
              <mesh position={[0, 0.38, 0]} rotation-z={Math.PI / 2} material={ironM} castShadow>
                <boxGeometry args={[0.28, 0.12, 0.08]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
