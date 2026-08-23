import { asset } from "@/lib/asset";
import { Billboard, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { groundHeight } from "../runtime";
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
    if (walk) return bank.lordWalk[fi];
    return bank.standLord;
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
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    const moving = body.anim === "walk" || body.speed > 0.25;
    body.bob += Math.min(dt, 0.08) * (moving ? 6.2 : 1.4);
    const tex = pickTex(bank, dwarf, body, isPlayer);
    if (mat.current && mat.current.map !== tex) {
      mat.current.map = tex;
      mat.current.needsUpdate = true;
    }
    const sit = body.anim === "sit";
    const img = tex.image as { width: number; height: number } | undefined;
    const aspect = img ? img.width / img.height : 0.62;
    const h = (sit ? 0.82 : 1.02) * scale;
    const w = h * aspect;
    if (mesh.current) {
      mesh.current.scale.set(w, h, 1);
      const bounce = moving ? Math.abs(Math.sin(body.bob * Math.PI)) * 0.045 : 0;
      mesh.current.position.y = h * 0.5 + bounce;
    }
  });

  const sit = body.anim === "sit";
  const start = pickTex(bank, dwarf, body, isPlayer);
  const img = start.image as { width: number; height: number } | undefined;
  const aspect = img ? img.width / img.height : 0.62;
  const h = (sit ? 0.82 : 1.02) * scale;
  const w = h * aspect;

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[0.32, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.38} />
      </mesh>
      <Billboard follow position={[0, 0, 0]}>
        <mesh ref={mesh} position={[0, h * 0.5, 0]} scale={[w, h, 1]} renderOrder={2}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={mat}
            map={start}
            transparent
            alphaTest={0.36}
            depthWrite
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
