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
};

const Ctx = createContext<WorldMats | null>(null);

export function useMats(): WorldMats {
  const m = useContext(Ctx);
  if (!m) throw new Error("WorldMats missing");
  return m;
}

function prep(t: THREE.Texture) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export function WorldMatsProvider({ children }: { children: ReactNode }) {
  const maps = useTexture({
    dirt: asset("/textures/dirt.jpg"),
    wood: asset("/textures/wood.jpg"),
    stone: asset("/textures/stone.jpg"),
    rock: asset("/textures/rock.jpg"),
    canvas: asset("/textures/canvas.jpg"),
    roof: asset("/textures/roof.jpg"),
    iron: asset("/textures/iron.jpg"),
    forest: asset("/textures/forest.jpg"),
    cobble: asset("/textures/cobble.jpg"),
    bark: asset("/textures/bark.jpg"),
    flame: asset("/textures/flame.png"),
    smoke: asset("/textures/smoke.png"),
  });

  const mats = useMemo(() => {
    prep(maps.dirt);
    prep(maps.wood);
    prep(maps.stone);
    prep(maps.rock);
    prep(maps.canvas);
    prep(maps.roof);
    prep(maps.iron);
    prep(maps.forest);
    prep(maps.cobble);
    prep(maps.bark);
    maps.flame.colorSpace = THREE.SRGBColorSpace;
    maps.smoke.colorSpace = THREE.SRGBColorSpace;

    const std = (
      map: THREE.Texture,
      color: string,
      roughness: number,
      metalness = 0,
    ) =>
      new THREE.MeshStandardMaterial({
        map,
        color,
        roughness,
        metalness,
      });

    const value: WorldMats = {
      dirt: std(maps.dirt, "#e6d3b4", 0.96),
      dirtRoad: std(maps.cobble, "#d8c4a4", 0.92),
      wood: std(maps.wood, "#e2c49a", 0.84, 0.02),
      woodDark: std(maps.wood, "#9a7350", 0.88, 0.02),
      stone: std(maps.stone, "#ddd6c8", 0.8, 0.03),
      stoneDark: std(maps.stone, "#9a9488", 0.84, 0.03),
      rock: std(maps.rock, "#b8b0a6", 0.9, 0.04),
      canvas: Object.assign(std(maps.canvas, "#e8d8b8", 0.92), { side: THREE.DoubleSide }),
      roof: std(maps.roof, "#c4a888", 0.86),
      iron: std(maps.iron, "#d0c8c0", 0.4, 0.58),
      forest: std(maps.forest, "#9aaa78", 0.95),
      bark: std(maps.bark, "#c4a888", 0.9),
      moss: new THREE.MeshStandardMaterial({
        map: maps.forest,
        color: "#3d4c32",
        roughness: 0.96,
        side: THREE.DoubleSide,
      }),
      water: new THREE.MeshPhysicalMaterial({
        color: "#1a4a48",
        roughness: 0.08,
        metalness: 0.12,
        transmission: 0.15,
        transparent: true,
        opacity: 0.82,
        thickness: 0.4,
      }),
      ember: new THREE.MeshStandardMaterial({
        color: "#ff6a2a",
        emissive: "#ff5418",
        emissiveIntensity: 2.2,
        roughness: 0.35,
      }),
      lime: std(maps.rock, "#e8dcc0", 0.86),
      black: new THREE.MeshStandardMaterial({ color: "#080706", roughness: 1 }),
      straw: std(maps.canvas, "#d4b56a", 0.95),
      needle: new THREE.MeshStandardMaterial({
        map: maps.forest,
        color: "#3a4c30",
        roughness: 0.94,
      }),
      leather: new THREE.MeshStandardMaterial({ color: "#4a3020", roughness: 0.9 }),
      gold: new THREE.MeshStandardMaterial({
        color: "#c4783a",
        roughness: 0.35,
        metalness: 0.7,
      }),
      flame: maps.flame,
      smokeTex: maps.smoke,
    };
    return value;
  }, [maps]);

  return <Ctx.Provider value={mats}>{children}</Ctx.Provider>;
}
