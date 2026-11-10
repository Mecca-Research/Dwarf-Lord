import { Billboard, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { asset } from "@/lib/asset";
import { workstationSites } from "./workstation-sites";
import { groundHeight, runtime, zoneAt } from "../runtime";
import { workstationTaskStates } from "./npc-motion";

export const workstationDiagnostics = new Map<
  string,
  { id: string; x: number; z: number; persistent: boolean; completedProp?: boolean }
>();

const workstationTextures: Record<string, string> = Object.fromEntries(
  workstationSites.flatMap((site) => {
    const path = `/sprites/workstations/${site.id}`;
    const files = [[site.id, asset(`${path}/sprite.png`)]];
    if (site.completionLayer)
      files.push([`${site.id}:finished`, asset(`${path}/${site.completionLayer}`)]);
    return files;
  }),
);

/** Persistent world props, independently owned from actor animation atlases. */
export function Workstations({ scale, mineScale = scale }: { scale: number; mineScale?: number }) {
  const textures = useTexture(workstationTextures);
  useEffect(
    () => () => {
      workstationTaskStates.clear();
    },
    [],
  );
  return (
    <>
      {workstationSites.map((site) => (
        <Workstation
          key={site.id}
          site={site}
          texture={textures[site.id]}
          finishedTexture={site.completionLayer ? textures[`${site.id}:finished`] : undefined}
          scale={zoneAt(site.target.targetX, site.target.targetZ) === "mine" ? mineScale : scale}
        />
      ))}
    </>
  );
}

function Workstation({
  site,
  scale,
  texture,
  finishedTexture,
}: {
  site: (typeof workstationSites)[number];
  scale: number;
  texture: THREE.Texture;
  finishedTexture?: THREE.Texture;
}) {
  const root = useRef<THREE.Group>(null);
  texture.colorSpace = THREE.SRGBColorSpace;
  const pixel = 1.95 / site.bodyHeight;
  const { targetX: x, targetZ: z } = site.target;
  useFrame(() => {
    if (root.current)
      root.current.visible =
        (zoneAt(x, z) === "mine") === (zoneAt(runtime.player.x, runtime.player.z) === "mine");
  });
  useEffect(() => {
    const state = workstationTaskStates.get(site.id);
    workstationDiagnostics.set(site.id, {
      id: site.id,
      x,
      z,
      persistent: true,
      ...(site.completionLayer
        ? { completedProp: Boolean(state?.completed && !state.active) }
        : {}),
    });
    return () => {
      workstationDiagnostics.delete(site.id);
    };
  }, [site, x, z]);
  return (
    <group ref={root} position={[x, groundHeight(x, z), z]} scale={scale}>
      <Billboard follow>
        <mesh
          position={[(320 - site.anchor[0]) * pixel, (site.anchor[1] - 320) * pixel, 0.005]}
          scale={[640 * pixel, 640 * pixel, 1]}
          renderOrder={2}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={texture}
            transparent
            alphaTest={0.34}
            depthWrite
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        {finishedTexture && <CompletedProp site={site} pixel={pixel} texture={finishedTexture} />}
      </Billboard>
    </group>
  );
}

/** The finished workpiece stays at its station after the worker leaves. */
function CompletedProp({
  site,
  pixel,
  texture,
}: {
  site: (typeof workstationSites)[number];
  pixel: number;
  texture: THREE.Texture;
}) {
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = useRef<THREE.Mesh>(null);
  useEffect(
    () =>
      workstationTaskStates.subscribe(site.id, (state) => {
        // While active, the final actor frame owns the visible workpiece.
        const visible = Boolean(state?.completed && !state.active);
        if (mesh.current) mesh.current.visible = visible;
        const diagnostic = workstationDiagnostics.get(site.id);
        if (diagnostic) diagnostic.completedProp = visible;
      }),
    [site.id],
  );
  return (
    <mesh
      ref={mesh}
      visible={false}
      position={[(320 - site.anchor[0]) * pixel, (site.anchor[1] - 320) * pixel, 0.006]}
      scale={[640 * pixel, 640 * pixel, 1]}
      renderOrder={3}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.34}
        depthWrite
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
