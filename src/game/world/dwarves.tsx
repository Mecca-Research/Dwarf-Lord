import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Dwarf } from "../types";
import type { Body } from "../runtime";

const mats = new Map<string, THREE.MeshStandardMaterial>();

function mat(color: string, roughness = 0.72, metalness = 0.04) {
  const k = `${color}:${roughness}:${metalness}`;
  let m = mats.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 0.35 });
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
  const helmet = dwarf?.helmet ?? false;

  const clothesM = useMemo(() => mat(clothes, 0.82), [clothes]);
  const beardM = useMemo(() => mat(beard, 0.94), [beard]);
  const skinM = useMemo(() => mat(skin, 0.64), [skin]);
  const darkM = useMemo(() => mat("#1a1612", 0.66, 0.12), []);
  const copperM = useMemo(() => mat("#c4784a", 0.3, 0.65), []);
  const ironM = useMemo(() => mat("#6a6864", 0.36, 0.58), []);
  const bootM = useMemo(() => mat("#1c1612", 0.88), []);
  const beltM = useMemo(() => mat("#3a2818", 0.82), []);
  const leatherM = useMemo(() => mat("#4a3020", 0.88), []);
  const whiteM = useMemo(() => mat("#e8dcc8", 0.45), []);
  const eyeM = useMemo(() => mat("#1a100c", 0.4), []);
  const clothDark = useMemo(() => mat("#241c16", 0.85), []);

  useFrame((_, dt) => {
    const group = g.current;
    if (!group) return;
    const sit = body.anim === "sit";
    const walk = body.anim === "walk" || body.speed > 0.2;
    const work = body.anim === "work";
    body.bob += dt * (walk ? 9.5 : work ? 8 : 2.2);
    const bob = walk ? Math.sin(body.bob) * 0.04 : sit ? 0 : Math.sin(body.bob * 0.5) * 0.01;
    group.position.y = (sit ? -0.08 : 0) + bob;

    const swing = walk ? Math.sin(body.bob) : 0;
    if (lLeg.current) lLeg.current.rotation.x = sit ? 1.35 : swing * 0.72;
    if (rLeg.current) rLeg.current.rotation.x = sit ? 1.35 : -swing * 0.72;
    if (lArm.current) {
      lArm.current.rotation.x = walk ? -swing * 0.55 : work ? Math.sin(body.bob) * 0.9 - 0.5 : sit ? 0.55 : 0.14;
    }
    if (rArm.current) {
      rArm.current.rotation.x = walk ? swing * 0.55 : work ? Math.sin(body.bob + 0.4) * 0.7 - 0.3 : sit ? 0.55 : 0.14;
    }
    if (tool.current) {
      const show = Boolean(work || (helmet && !isPlayer && !sit));
      tool.current.rotation.z = work ? -0.5 + Math.sin(body.bob) * 0.55 : -0.55;
      tool.current.visible = show;
    }
    if (torso.current && !sit && !walk) {
      torso.current.position.y = Math.sin(body.bob * 0.5) * 0.01;
    }
  });

  const sit = body.anim === "sit";
  const tunic = isPlayer ? darkM : clothesM;

  return (
    <group ref={g} scale={scale}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[0.42, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.42} />
      </mesh>

      <group position={[0, sit ? 0.28 : 0, 0]}>
        <group ref={lLeg} position={[-0.17, sit ? 0.32 : 0.38, sit ? 0.2 : 0]}>
          <mesh position={[0, -0.14, 0]} castShadow material={clothesM}>
            <capsuleGeometry args={[0.11, 0.22, 3, 8]} />
          </mesh>
          <mesh position={[0.02, -0.32, 0.07]} castShadow material={bootM}>
            <boxGeometry args={[0.18, 0.12, 0.28]} />
          </mesh>
        </group>
        <group ref={rLeg} position={[0.17, sit ? 0.32 : 0.38, sit ? 0.2 : 0]}>
          <mesh position={[0, -0.14, 0]} castShadow material={clothesM}>
            <capsuleGeometry args={[0.11, 0.22, 3, 8]} />
          </mesh>
          <mesh position={[-0.02, -0.32, 0.07]} castShadow material={bootM}>
            <boxGeometry args={[0.18, 0.12, 0.28]} />
          </mesh>
        </group>

        <group ref={torso} position={[0, sit ? 0.58 : 0.68, 0]}>
          <mesh position={[0, 0.06, 0.02]} castShadow material={tunic}>
            <capsuleGeometry args={[0.3, 0.32, 4, 10]} />
          </mesh>
          <mesh position={[0, -0.04, 0.08]} scale={[1.15, 0.72, 0.95]} castShadow material={tunic}>
            <sphereGeometry args={[0.26, 12, 8]} />
          </mesh>
          {/* Collar */}
          <mesh position={[0, 0.28, 0.04]} material={clothDark} castShadow>
            <cylinderGeometry args={[0.22, 0.26, 0.1, 10]} />
          </mesh>
          <mesh position={[0, -0.1, 0]} material={beltM} castShadow>
            <boxGeometry args={[0.62, 0.08, 0.46]} />
          </mesh>
          <mesh position={[0, -0.1, 0.24]} material={copperM}>
            <boxGeometry args={[0.1, 0.09, 0.05]} />
          </mesh>
          <mesh position={[0.22, -0.16, 0.12]} rotation-z={0.3} material={leatherM} castShadow>
            <boxGeometry args={[0.14, 0.16, 0.1]} />
          </mesh>
          {isPlayer ? (
            <mesh position={[0, 0.12, -0.18]} rotation-x={0.2} material={leatherM} castShadow>
              <boxGeometry args={[0.56, 0.58, 0.1]} />
            </mesh>
          ) : null}

          {/* Head — oversized dwarf skull */}
          <mesh position={[0, 0.46, 0.05]} castShadow material={skinM}>
            <sphereGeometry args={[0.22, 14, 12]} />
          </mesh>
          {/* Brow */}
          <mesh position={[0, 0.54, 0.18]} material={skinM} castShadow>
            <boxGeometry args={[0.28, 0.07, 0.1]} />
          </mesh>
          {/* Nose */}
          <mesh position={[0, 0.46, 0.24]} rotation-x={0.4} castShadow material={skinM}>
            <boxGeometry args={[0.09, 0.09, 0.12]} />
          </mesh>
          {/* Ears */}
          <mesh position={[-0.2, 0.48, 0.02]} material={skinM} castShadow>
            <sphereGeometry args={[0.06, 6, 6]} />
          </mesh>
          <mesh position={[0.2, 0.48, 0.02]} material={skinM} castShadow>
            <sphereGeometry args={[0.06, 6, 6]} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.07, 0.5, 0.22]} material={whiteM}>
            <sphereGeometry args={[0.038, 8, 6]} />
          </mesh>
          <mesh position={[0.07, 0.5, 0.22]} material={whiteM}>
            <sphereGeometry args={[0.038, 8, 6]} />
          </mesh>
          <mesh position={[-0.07, 0.5, 0.25]} material={eyeM}>
            <sphereGeometry args={[0.02, 6, 6]} />
          </mesh>
          <mesh position={[0.07, 0.5, 0.25]} material={eyeM}>
            <sphereGeometry args={[0.02, 6, 6]} />
          </mesh>

          {/* Hair cap */}
          <mesh position={[0, 0.58, 0.02]} material={beardM} castShadow>
            <sphereGeometry args={[0.21, 12, 8, 0, Math.PI * 2, 0, 1.15]} />
          </mesh>

          {/* Beard mass */}
          <mesh position={[0, 0.28, 0.16]} rotation-x={0.45} castShadow material={beardM}>
            <coneGeometry args={[0.24, 0.46, 8]} />
          </mesh>
          <mesh position={[0, 0.34, 0.14]} scale={[1.25, 0.85, 1]} material={beardM} castShadow>
            <sphereGeometry args={[0.2, 10, 8]} />
          </mesh>
          <mesh position={[-0.12, 0.22, 0.16]} rotation-z={0.35} material={beardM} castShadow>
            <capsuleGeometry args={[0.07, 0.16, 3, 6]} />
          </mesh>
          <mesh position={[0.12, 0.22, 0.16]} rotation-z={-0.35} material={beardM} castShadow>
            <capsuleGeometry args={[0.07, 0.16, 3, 6]} />
          </mesh>
          <mesh position={[0, 0.4, 0.24]} material={beardM} castShadow>
            <boxGeometry args={[0.24, 0.055, 0.07]} />
          </mesh>

          {helmet ? (
            <>
              <mesh position={[0, 0.62, 0.03]} castShadow material={ironM}>
                <sphereGeometry args={[0.24, 12, 8, 0, Math.PI * 2, 0, 1.28]} />
              </mesh>
              <mesh position={[0, 0.52, 0.03]} material={ironM} castShadow>
                <cylinderGeometry args={[0.25, 0.26, 0.07, 14]} />
              </mesh>
              <mesh position={[0, 0.5, 0.24]} material={ironM} castShadow>
                <boxGeometry args={[0.1, 0.14, 0.12]} />
              </mesh>
            </>
          ) : null}

          {isPlayer ? (
            <mesh position={[0, 0.1, 0.3]} material={copperM} castShadow>
              <torusGeometry args={[0.13, 0.028, 6, 12]} />
            </mesh>
          ) : null}

          <group ref={lArm} position={[-0.34, 0.14, 0.02]}>
            <mesh position={[0, -0.15, 0]} rotation-z={0.32} castShadow material={tunic}>
              <capsuleGeometry args={[0.09, 0.26, 3, 8]} />
            </mesh>
            <mesh position={[-0.09, -0.32, 0.02]} material={skinM} castShadow>
              <sphereGeometry args={[0.075, 7, 6]} />
            </mesh>
          </group>
          <group ref={rArm} position={[0.34, 0.14, 0.02]}>
            <mesh position={[0, -0.15, 0]} rotation-z={-0.32} castShadow material={tunic}>
              <capsuleGeometry args={[0.09, 0.26, 3, 8]} />
            </mesh>
            <mesh position={[0.09, -0.32, 0.02]} material={skinM} castShadow>
              <sphereGeometry args={[0.075, 7, 6]} />
            </mesh>
            <group ref={tool} position={[0.12, -0.36, 0.12]} rotation-z={-0.55} rotation-x={0.35}>
              <mesh material={leatherM} castShadow>
                <cylinderGeometry args={[0.032, 0.038, 0.78, 6]} />
              </mesh>
              <mesh position={[0, 0.42, 0]} rotation-z={Math.PI / 2} material={ironM} castShadow>
                <boxGeometry args={[0.32, 0.14, 0.09]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
