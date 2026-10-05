import { Billboard, useTexture } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { asset } from "@/lib/asset";
import { workstationSites } from "./workstation-sites";
import { groundHeight, zoneAt } from "../runtime";
import { workstationTaskStates } from "./npc-motion";


export const workstationDiagnostics = new Map<string, { id: string; x: number; z: number; persistent: boolean; completedProp?: boolean }>();

/** Persistent world props, independently owned from actor animation atlases. */
export function Workstations({ scale, mineScale = scale }: { scale: number; mineScale?: number }) {
  useEffect(() => () => { workstationTaskStates.clear(); }, []);
  return <>{workstationSites.map(site => <Workstation key={site.id} site={site} scale={zoneAt(site.target.targetX, site.target.targetZ) === "mine" ? mineScale : scale} />)}</>;
}

function Workstation({ site, scale }: { site: typeof workstationSites[number]; scale: number }) {
  const texture = useTexture(asset(`/sprites/workstations/${site.id}/sprite.png`));
  texture.colorSpace = THREE.SRGBColorSpace;
  const pixel = 1.95 / site.bodyHeight;
  const { targetX: x, targetZ: z } = site.target;
  useEffect(() => {
    const state = workstationTaskStates.get(site.id);
    workstationDiagnostics.set(site.id, { id: site.id, x, z, persistent: true,
      ...(site.completionLayer ? { completedProp: Boolean(state?.completed && !state.active) } : {}) });
    return () => { workstationDiagnostics.delete(site.id); };
  }, [site, x, z]);
  return (
    <group position={[x, groundHeight(x, z), z]} scale={scale}>
      <Billboard follow>
        <mesh position={[(320 - site.anchor[0]) * pixel, (site.anchor[1] - 320) * pixel, .005]} scale={[640 * pixel, 640 * pixel, 1]} renderOrder={2}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={texture} transparent alphaTest={.34} depthWrite toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        {site.completionLayer && <CompletedProp site={site} pixel={pixel} />}
      </Billboard>
    </group>
  );
}

/** The finished workpiece stays at its station after the worker leaves. */
function CompletedProp({ site, pixel }: { site: typeof workstationSites[number]; pixel: number }) {
  const texture = useTexture(asset(`/sprites/workstations/${site.id}/${site.completionLayer}`));
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = useRef<THREE.Mesh>(null);
  useEffect(() => workstationTaskStates.subscribe(site.id, state => {
    // While active, the final actor frame owns the visible workpiece.
    const visible = Boolean(state?.completed && !state.active);
    if (mesh.current) mesh.current.visible = visible;
    const diagnostic = workstationDiagnostics.get(site.id);
    if (diagnostic) diagnostic.completedProp = visible;
  }), [site.id]);
  return <mesh ref={mesh} visible={false} position={[(320 - site.anchor[0]) * pixel, (site.anchor[1] - 320) * pixel, .006]} scale={[640 * pixel, 640 * pixel, 1]} renderOrder={3}>
    <planeGeometry args={[1, 1]} />
    <meshBasicMaterial map={texture} transparent alphaTest={.34} depthWrite toneMapped={false} side={THREE.DoubleSide} />
  </mesh>;
}
