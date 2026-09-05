import { asset } from "@/lib/asset";
import { useTexture } from "@react-three/drei";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import * as THREE from "three";

export type WorldMats = {
  dirt: THREE.MeshStandardMaterial;
  dirtRoad: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  woodDark: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  stoneDark: THREE.MeshStandardMaterial;
  rock: THREE.MeshStandardMaterial;
  cliff: THREE.MeshStandardMaterial;
  canvas: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  iron: THREE.MeshStandardMaterial;
  forest: THREE.MeshStandardMaterial;
  bark: THREE.MeshStandardMaterial;
  moss: THREE.MeshStandardMaterial;
  water: THREE.MeshPhysicalMaterial;
  ember: THREE.MeshStandardMaterial;
  lime: THREE.MeshStandardMaterial;
  black: THREE.MeshStandardMaterial;
  straw: THREE.MeshStandardMaterial;
  needle: THREE.MeshStandardMaterial;
  leather: THREE.MeshStandardMaterial;
  gold: THREE.MeshStandardMaterial;
  flame: THREE.Texture;
  smokeTex: THREE.Texture;
  sky: THREE.Texture;
};

const Ctx = createContext<WorldMats | null>(null);

export function useMats(): WorldMats {
  const m = useContext(Ctx);
  if (!m) throw new Error("WorldMats missing");
  return m;
}

function prep(t: THREE.Texture, repeatX = 1, repeatY = 1) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.repeat.set(repeatX, repeatY);
  t.needsUpdate = true;
  return t;
}

export function WorldMatsProvider({ children }: { children: ReactNode }) {
  const maps = useTexture({
    dirt: asset("/textures/dirt.jpg"),
    wood: asset("/textures/wood.jpg"),
    stone: asset("/textures/stone.jpg"),
    rock: asset("/textures/rock.jpg"),
    cliff: asset("/textures/cliff.jpg"),
    canvas: asset("/textures/canvas.jpg"),
    roof: asset("/textures/roof.jpg"),
    iron: asset("/textures/iron.jpg"),
    forest: asset("/textures/forest.jpg"),
    cobble: asset("/textures/cobble.jpg"),
    bark: asset("/textures/bark.jpg"),
    flame: asset("/textures/flame.png"),
    smoke: asset("/textures/smoke.png"),
    sky: asset("/art/sky-dusk.jpg"),
  });

  const mats = useMemo(() => {
    prep(maps.dirt, 1, 1);
    prep(maps.wood, 1, 1);
    prep(maps.stone, 1, 1);
    prep(maps.rock, 1, 1);
    prep(maps.cliff, 1, 1);
    prep(maps.canvas, 1, 1);
    prep(maps.roof, 1, 1);
    prep(maps.iron, 1, 1);
    prep(maps.forest, 1, 1);
    prep(maps.cobble, 1, 1);
    prep(maps.bark, 1, 1);
    maps.flame.colorSpace = THREE.SRGBColorSpace;
    maps.smoke.colorSpace = THREE.SRGBColorSpace;
    maps.sky.colorSpace = THREE.SRGBColorSpace;
    maps.sky.wrapS = maps.sky.wrapT = THREE.ClampToEdgeWrapping;

    const std = (map: THREE.Texture, color: string, roughness: number, metalness = 0) =>
      new THREE.MeshStandardMaterial({
        map,
        color,
        roughness,
        metalness,
        envMapIntensity: 0.45,
      });

    const value: WorldMats = {
      dirt: std(maps.dirt, "#756454", 0.98),
      dirtRoad: std(maps.cobble, "#716252", 0.96),
      wood: std(maps.wood, "#8c735b", 0.9, 0.01),
      woodDark: std(maps.wood, "#4b382c", 0.94, 0.01),
      stone: std(maps.stone, "#807c77", 0.92, 0.03),
      stoneDark: std(maps.stone, "#454546", 0.96, 0.03),
      rock: std(maps.rock, "#575657", 0.96, 0.03),
      cliff: std(maps.cliff, "#434345", 0.98, 0.03),
      canvas: Object.assign(std(maps.canvas, "#9a8e79", 0.97), { side: THREE.DoubleSide }),
      roof: std(maps.roof, "#715c4b", 0.94),
      iron: std(maps.iron, "#9a948c", 0.38, 0.62),
      forest: std(maps.forest, "#44513a", 0.98),
      bark: std(maps.bark, "#5e4938", 0.96),
      moss: new THREE.MeshStandardMaterial({
        map: maps.forest,
        color: "#3a4a30",
        roughness: 0.97,
        side: THREE.DoubleSide,
      }),
      water: new THREE.MeshPhysicalMaterial({
        color: "#1a3a3c",
        roughness: 0.08,
        metalness: 0.1,
        transparent: true,
        opacity: 0.78,
        thickness: 0.4,
      }),
      ember: new THREE.MeshStandardMaterial({
        color: "#ff6a28",
        emissive: "#ff4a10",
        emissiveIntensity: 2.6,
        roughness: 0.32,
      }),
      lime: std(maps.rock, "#c8bca0", 0.88),
      black: new THREE.MeshStandardMaterial({ color: "#070605", roughness: 1 }),
      straw: std(maps.canvas, "#c4a060", 0.96),
      needle: new THREE.MeshStandardMaterial({
        map: maps.forest,
        color: "#2e3c26",
        roughness: 0.95,
      }),
      leather: new THREE.MeshStandardMaterial({ color: "#4a3020", roughness: 0.9 }),
      gold: new THREE.MeshStandardMaterial({
        color: "#c4783a",
        roughness: 0.35,
        metalness: 0.7,
      }),
      flame: maps.flame,
      smokeTex: maps.smoke,
      sky: maps.sky,
    };
    return value;
  }, [maps]);

  return <Ctx.Provider value={mats}>{children}</Ctx.Provider>;
}
