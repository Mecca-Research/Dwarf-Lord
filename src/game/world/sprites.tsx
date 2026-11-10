import { asset } from "@/lib/asset";
import { Billboard, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { DWARF_ART, dwarfAppearance, type DwarfAppearance } from "./dwarf-appearances";
import { NpcWalkMotion, NpcWorkMotion, setMotionUv, motionForegroundGeometry, motionRootTranslation, npcMotionDiagnostics } from "./npc-motion";
import { reviewSpritePoint, spritePointReviewers } from "./motion-review-points";
import { useGame } from "../store";
import { groundHeight } from "../runtime";
import type { Body } from "../runtime";
import type { Dwarf } from "../types";
import startupFrames from "./startup-sprite-frames.json";

type SpriteBank = {
  appearances: Record<DwarfAppearance, THREE.Texture>;
  lordIdle: THREE.Texture[];
  lordGait: THREE.Texture[][];
};

const Ctx = createContext<SpriteBank | null>(null);
const STARTUP_TEXTURES = [asset("/sprites/startup/cast.webp"), asset("/sprites/startup/lord.webp")];

function prepSpriteTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function atlasFrame(atlas: THREE.Texture, [x, y, w, h]: readonly number[]) {
  const { width, height } = atlas.image as HTMLImageElement;
  const texture = atlas.clone();
  texture.offset.set(x / width, 1 - (y + h) / height);
  texture.repeat.set(w / width, h / height);
  return prepSpriteTexture(texture);
}

export function SpriteBankProvider({ children }: { children: ReactNode }) {
  const [cast, lord] = useTexture(STARTUP_TEXTURES);
  const bank = useMemo(() => {
    const appearances = Object.fromEntries(
      Object.entries(startupFrames.cast).map(([name, frame]) => [name, atlasFrame(cast, frame)]),
    ) as SpriteBank["appearances"];
    const lordFrames: Record<string, number[]> = startupFrames.lord;
    const lordIdle = Array.from({ length: 8 }, (_, d) => atlasFrame(lord, lordFrames[`idle${d}`]));
    const lordGait = Array.from({ length: 8 }, (_, d) =>
      Array.from({ length: 4 }, (_, f) => atlasFrame(lord, lordFrames[`gait${d}${f}`])),
    );
    return { appearances, lordIdle, lordGait };
  }, [cast, lord]);
  useEffect(
    () => () => {
      for (const frame of [...Object.values(bank.appearances), ...bank.lordIdle, ...bank.lordGait.flat()]) {
        frame.dispose();
      }
    },
    [bank],
  );
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
  const walk = body.anim === "walk" || body.speed > 0.2;
  const fi = Math.abs(Math.floor(body.bob)) % 4;
  if (isPlayer) {
    const d = ((body.facing % 8) + 8) % 8;
    if (walk) return bank.lordGait[d][fi];
    return bank.lordIdle[d];
  }
  return bank.appearances[dwarfAppearance(dwarf?.id)];
}

function textureAspect(texture: THREE.Texture, fallback = 0.62) {
  const image = texture.image as { width?: number; height?: number } | undefined;
  return image?.width && image.height
    ? (image.width * texture.repeat.x) / (image.height * texture.repeat.y)
    : fallback;
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

  const sit = isPlayer ? body.anim === "sit" : DWARF_ART[dwarfAppearance(dwarf?.id)].pose === "sit";
  const { camera, size } = useThree();
  const h = (sit ? 1.65 : 1.95) * scale;
  const start = pickTex(bank, dwarf, body, isPlayer);
  const w = h * textureAspect(start);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const upperMesh = useRef<THREE.Mesh>(null);
  const upperMat = useRef<THREE.MeshBasicMaterial>(null);
  const foregroundGeometry = useRef<THREE.BufferGeometry | null>(null);
  useEffect(() => () => { foregroundGeometry.current?.dispose(); }, []);
  const motion = useRef<NpcWalkMotion | null>(null);
  const visualRoot = useRef<THREE.Group>(null);
  const workMotion = useRef<NpcWorkMotion | null>(null);
  const parentScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const uvFrame = useRef("");
  useEffect(() => {
    if (isPlayer) return;
    const driver = new NpcWalkMotion(dwarf?.id ?? "unknown", dwarfAppearance(dwarf?.id));
    motion.current = driver;
    const worker = new NpcWorkMotion(dwarf?.id ?? "unknown", dwarfAppearance(dwarf?.id));
    workMotion.current = worker;
    return () => { driver.dispose(); worker.dispose(); motion.current = null; workMotion.current = null; };
  }, [isPlayer, dwarf?.id]);

  useEffect(() => {
    const id = dwarf?.id;
    if (isPlayer || !id) return;
    const review = (point: [number, number], reference?: [number, number, number]) => {
      const pose = npcMotionDiagnostics.get(id);
      return mesh.current && pose?.loaded && body.anim === 'walk'
        ? reviewSpritePoint(mesh.current, camera, size, point, pose.frame, pose.direction, reference) : null;
    };
    spritePointReviewers.set(id, review);
    return () => { if (spritePointReviewers.get(id) === review) spritePointReviewers.delete(id); };
  }, [isPlayer, dwarf?.id, body, camera, size]);


  useFrame((_, dt) => {
    const moving = body.anim === "walk" || body.speed > 0.2;
    if (!isPlayer) body.bob += Math.min(dt, 0.05) * (moving ? 5.2 : 1.1);

    mesh.current?.parent?.getWorldScale(parentScale);
    const gait = motion.current?.update(body, 1.95 * scale, Math.max(.01, parentScale.y));
    if (visualRoot.current) {
      const offset = gait?.rootOffset ?? [0, 0];
      // The NPC parent rotates and scales; offsets are in resolved world units.
      visualRoot.current.position.set(...motionRootTranslation(offset as [number, number], body.yaw, parentScale,
        groundHeight(body.x + offset[0], body.z + offset[1]) - groundHeight(body.x, body.z)));
    }
    const state = useGame.getState();
    const job = state.dwarves.find(d => d.id === dwarf?.id)?.assignedJobId ?? null;
    const work = workMotion.current?.update(body, job, state.day, state.dayResolved,
      state.dialogue || !state.playing ? 0 : dt, 1.95 * scale);
    const walkMotion = work ?? gait;
    const tex = walkMotion?.texture ?? pickTex(bank, dwarf, body, isPlayer);
    if (mat.current && mat.current.map !== tex) {
      mat.current.map = tex;
      mat.current.needsUpdate = true;
    }
    if (upperMat.current && upperMat.current.map !== tex) { upperMat.current.map = tex; upperMat.current.needsUpdate = true; }
    const polygons = work?.foregroundPolygons;
    if (upperMesh.current) upperMesh.current.visible = Boolean(polygons);
    if (mesh.current) {
      const frame = walkMotion?.frame ?? null;
      const uvKey = `${frame}:${Boolean(polygons)}`;
      if (uvFrame.current !== uvKey) {
        setMotionUv(mesh.current.geometry, frame);
        if (upperMesh.current && polygons && frame !== null) {
          foregroundGeometry.current?.dispose();
          foregroundGeometry.current = motionForegroundGeometry(polygons, frame);
          upperMesh.current.geometry = foregroundGeometry.current;
        }
        uvFrame.current = uvKey;
      }
      if (walkMotion) {
        const p = walkMotion.placement;
        mesh.current.scale.set(p.width, p.height, 1);
        mesh.current.position.set(p.left + p.width / 2, -p.top - p.height / 2, 0);
        if (polygons && upperMesh.current) {
          upperMesh.current.scale.set(p.width, p.height, 1);
          upperMesh.current.position.set(p.left + p.width / 2, -p.top - p.height / 2, .01);
        }
      } else {
        mesh.current.scale.set(h * textureAspect(tex), h, 1);
        mesh.current.position.set(0, h * 0.5, 0);
      }
    }
  });

  return (
    <group ref={visualRoot}>
      <group rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <mesh scale={[1, 0.48, 1]}>
          <circleGeometry args={[0.42 * scale, 20]} />
          <meshBasicMaterial color="#090604" transparent opacity={0.24} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0, 0.001]} scale={[1, 0.42, 1]}>
          <circleGeometry args={[0.29 * scale, 20]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.34} depthWrite={false} />
        </mesh>
      </group>
      <Billboard follow>
        <mesh ref={mesh} position={[0, h * 0.5, 0]} scale={[w, h, 1]} renderOrder={2}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={mat}
            map={start}
            transparent
            alphaTest={0.34}
            depthWrite
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh ref={upperMesh} visible={false} renderOrder={3}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial ref={upperMat} map={start} transparent alphaTest={0.34} depthWrite toneMapped={false} side={THREE.DoubleSide} />
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
  const texture = useTexture(asset(`/sprites/${kind}.png`));
  const tex = useMemo(() => prepSpriteTexture(texture), [texture]);
  const img = tex.image as { width: number; height: number } | undefined;
  const aspect = img ? img.width / img.height : 1;
  const ww = height * aspect;
  const y = groundHeight(x, z);
  return (
    <group position={[x, y, z]} rotation-y={rot}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[ww * 0.22, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.32} />
      </mesh>
      <Billboard follow>
        <mesh position={[0, height * 0.48, 0]} renderOrder={1}>
          <planeGeometry args={[ww, height]} />
          <meshBasicMaterial map={tex} transparent alphaTest={0.28} depthWrite toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}
