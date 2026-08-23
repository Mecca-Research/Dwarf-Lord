import { asset } from "@/lib/asset";
import { Billboard, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { facingOctant, groundHeight, runtime } from "../runtime";
import type { Body } from "../runtime";
import type { Dwarf } from "../types";

export type SpriteBank = {
  sitBeard: THREE.Texture;
  sitHelm: THREE.Texture;
  sitBorrin: THREE.Texture;
  standHelm: THREE.Texture;
  standLabor: THREE.Texture;
  standLord: THREE.Texture;
  standHelga: THREE.Texture;
  walk: THREE.Texture[];
  lordWalk: THREE.Texture[];
  lordIdle: THREE.Texture[];
  lordStep: THREE.Texture[];
  lordStepR: THREE.Texture[];
  tent: THREE.Texture;
  leanto: THREE.Texture;
  crate: THREE.Texture;
  barrel: THREE.Texture;
};

const Ctx = createContext<SpriteBank | null>(null);

export function SpriteBankProvider({ children }: { children: ReactNode }) {
  const maps = useTexture({
    sitBeard: asset("/sprites/sit-beard.png"),
    sitHelm: asset("/sprites/sit-helm.png"),
    sitBorrin: asset("/sprites/sit-borrin.png"),
    standHelm: asset("/sprites/stand-helm.png"),
    standLabor: asset("/sprites/stand-labor.png"),
    standLord: asset("/sprites/stand-lord.png"),
    standHelga: asset("/sprites/stand-helga.png"),
    walk0: asset("/sprites/walk-0.png"),
    walk1: asset("/sprites/walk-1.png"),
    walk2: asset("/sprites/walk-2.png"),
    walk3: asset("/sprites/walk-3.png"),
    lord0: asset("/sprites/lord-walk-0.png"),
    lord1: asset("/sprites/lord-walk-1.png"),
    lord2: asset("/sprites/lord-walk-2.png"),
    lord3: asset("/sprites/lord-walk-3.png"),
    idle0: asset("/sprites/lord-idle-0.png"),
    idle1: asset("/sprites/lord-idle-1.png"),
    idle2: asset("/sprites/lord-idle-2.png"),
    idle3: asset("/sprites/lord-idle-3.png"),
    idle4: asset("/sprites/lord-idle-4.png"),
    idle5: asset("/sprites/lord-idle-5.png"),
    idle6: asset("/sprites/lord-idle-6.png"),
    idle7: asset("/sprites/lord-idle-7.png"),
    step0: asset("/sprites/lord-step-0.png"),
    step1: asset("/sprites/lord-step-1.png"),
    step2: asset("/sprites/lord-step-2.png"),
    step3: asset("/sprites/lord-step-3.png"),
    step4: asset("/sprites/lord-step-4.png"),
    step5: asset("/sprites/lord-step-5.png"),
    step6: asset("/sprites/lord-step-6.png"),
    step7: asset("/sprites/lord-step-7.png"),
    stepR0: asset("/sprites/lord-stepR-0.png"),
    stepR1: asset("/sprites/lord-stepR-1.png"),
    stepR2: asset("/sprites/lord-stepR-2.png"),
    stepR3: asset("/sprites/lord-stepR-3.png"),
    stepR4: asset("/sprites/lord-stepR-4.png"),
    stepR5: asset("/sprites/lord-stepR-5.png"),
    stepR6: asset("/sprites/lord-stepR-6.png"),
    stepR7: asset("/sprites/lord-stepR-7.png"),
    tent: asset("/sprites/tent.png"),
    leanto: asset("/sprites/leanto.png"),
    crate: asset("/sprites/crate.png"),
    barrel: asset("/sprites/barrel.png"),
  });

  const bank = useMemo(() => {
    const list = Object.values(maps);
    for (const t of list) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.premultiplyAlpha = false;
      t.needsUpdate = true;
    }
    return {
      sitBeard: maps.sitBeard,
      sitHelm: maps.sitHelm,
      sitBorrin: maps.sitBorrin,
      standHelm: maps.standHelm,
      standLabor: maps.standLabor,
      standLord: maps.standLord,
      standHelga: maps.standHelga,
      walk: [maps.walk0, maps.walk1, maps.walk2, maps.walk3],
      lordWalk: [maps.lord0, maps.lord1, maps.lord2, maps.lord3],
      lordIdle: [maps.idle0, maps.idle1, maps.idle2, maps.idle3, maps.idle4, maps.idle5, maps.idle6, maps.idle7],
      lordStep: [maps.step0, maps.step1, maps.step2, maps.step3, maps.step4, maps.step5, maps.step6, maps.step7],
      lordStepR: [maps.stepR0, maps.stepR1, maps.stepR2, maps.stepR3, maps.stepR4, maps.stepR5, maps.stepR6, maps.stepR7],
      tent: maps.tent,
      leanto: maps.leanto,
      crate: maps.crate,
      barrel: maps.barrel,
    } satisfies SpriteBank;
  }, [maps]);

  return <Ctx.Provider value={bank}>{children}</Ctx.Provider>;
}

function useBank() {
  const b = useContext(Ctx);
  if (!b) throw new Error("SpriteBank missing");
  return b;
}

function lordCycle(bank: SpriteBank, d: number): THREE.Texture[] {
  if (d === 0) return bank.lordWalk;
  const l = bank.lordStep[d];
  const r = bank.lordStepR[d];
  return [l, r, l, r];
}

function pickTex(
  bank: SpriteBank,
  dwarf: Pick<Dwarf, "id" | "helmet" | "sitOnStart"> | undefined,
  body: Body,
  isPlayer?: boolean,
) {
  const sit = body.anim === "sit";
  const walk = body.anim === "walk" || body.speed > 0.25;
  const fi = Math.abs(Math.floor(body.bob)) % 4;
  if (isPlayer) {
    const d = facingOctant(body.yaw, runtime.cameraAzimuth);
    if (walk) {
      const cycle = lordCycle(bank, d);
      return cycle[Math.abs(Math.floor(body.bob)) % cycle.length];
    }
    return bank.lordIdle[d];
  }
  if (dwarf?.id === "borrin") return bank.sitBorrin;
  if (sit && dwarf?.helmet) return bank.sitHelm;
  if (sit) return bank.sitBeard;
  if (walk && dwarf?.helmet) return bank.walk[fi];
  if (dwarf?.id === "helga") return bank.standHelga;
  if (dwarf?.helmet) return bank.standHelm;
  return bank.standLabor;
}

export function DwarfSprite({
  dwarf,
  body,
  isPlayer,
  scale = 1,
}: {
  dwarf?: Pick<Dwarf, "id" | "helmet" | "sitOnStart" | "clothes" | "beard" | "skin">;
  body: Body;
  isPlayer?: boolean;
  scale?: number;
}) {
  const bank = useBank();
  const matA = useRef<THREE.MeshBasicMaterial>(null);
  const matB = useRef<THREE.MeshBasicMaterial>(null);
  const meshA = useRef<THREE.Mesh>(null);
  const meshB = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);

  const sit = body.anim === "sit";
  const h = (sit ? 0.84 : 1.08) * scale;
  const w = isPlayer ? h * (512 / 800) : h * 0.62;

  useFrame((_, dt) => {
    const moving = body.anim === "walk" || body.speed > 0.22;
    const capped = Math.min(dt, 0.05);
    if (isPlayer && moving) {
      body.bob += capped * (4.2 + Math.max(body.speed, 1) * 1.7);
    } else {
      body.bob += capped * (moving ? 6 : 1.2);
    }

    const d = isPlayer ? facingOctant(body.yaw, runtime.cameraAzimuth) : 0;
    let tex0: THREE.Texture;
    let tex1: THREE.Texture;
    let mix = 0;
    if (isPlayer) {
      if (moving) {
        const cycle = lordCycle(bank, d);
        const n = cycle.length;
        const phase = ((body.bob % n) + n) % n;
        const i0 = Math.floor(phase) % n;
        const i1 = (i0 + 1) % n;
        const t = phase - Math.floor(phase);
        mix = t * t * (3 - 2 * t);
        tex0 = cycle[i0];
        tex1 = cycle[i1];
      } else {
        tex0 = tex1 = bank.lordIdle[d];
        mix = 0;
      }
    } else {
      tex0 = tex1 = pickTex(bank, dwarf, body, false);
      mix = 0;
    }

    if (matA.current && matA.current.map !== tex0) {
      matA.current.map = tex0;
      matA.current.needsUpdate = true;
    }
    if (matB.current && matB.current.map !== tex1) {
      matB.current.map = tex1;
      matB.current.needsUpdate = true;
    }
    if (matA.current) {
      matA.current.opacity = 1 - mix;
      matA.current.depthWrite = mix < 0.55;
    }
    if (matB.current) {
      matB.current.opacity = mix;
      matB.current.depthWrite = mix >= 0.55;
    }
    if (meshB.current) meshB.current.visible = mix > 0.02;

    const plant = moving ? Math.abs(Math.sin(body.bob * Math.PI)) : 0;
    const bounce = plant * 0.11;
    const squash = moving ? 1 - plant * 0.06 : 1;
    const stretch = moving ? 1 + plant * 0.04 : 1;
    const hh = h * squash;
    const ww = w * stretch;
    const y = hh * 0.5 + bounce;
    if (meshA.current) {
      meshA.current.scale.set(ww, hh, 1);
      meshA.current.position.y = y;
    }
    if (meshB.current) {
      meshB.current.scale.set(ww, hh, 1);
      meshB.current.position.y = y;
    }
  });

  const start = pickTex(bank, dwarf, body, isPlayer);

  return (
    <group ref={group}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[0.28, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.34} />
      </mesh>
      <Billboard follow position={[0, 0, 0]}>
        <mesh ref={meshA} position={[0, h * 0.5, 0]} scale={[w, h, 1]} renderOrder={2}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={matA}
            map={start}
            transparent
            opacity={1}
            alphaTest={0.34}
            depthWrite
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh ref={meshB} position={[0, h * 0.5, 0]} scale={[w, h, 1]} renderOrder={3} visible={false}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={matB}
            map={start}
            transparent
            opacity={0}
            alphaTest={0.34}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Billboard>
    </group>
  );
}

export function IllustratedProp({
  kind,
  x,
  z,
  height,
  rot = 0,
}: {
  kind: "tent" | "leanto" | "crate" | "barrel";
  x: number;
  z: number;
  height: number;
  rot?: number;
}) {
  const bank = useBank();
  const tex = bank[kind];
  const img = tex.image as { width: number; height: number } | undefined;
  const aspect = img ? img.width / img.height : 1;
  const w = height * aspect;
  const y = groundHeight(x, z);
  return (
    <group position={[x, y, z]} rotation-y={rot}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[w * 0.22, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.32} />
      </mesh>
      <Billboard follow>
        <mesh position={[0, height * 0.48, 0]} renderOrder={1}>
          <planeGeometry args={[w, height]} />
          <meshBasicMaterial map={tex} transparent alphaTest={0.28} depthWrite toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}
