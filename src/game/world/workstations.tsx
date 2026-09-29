import { Billboard, useTexture } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { asset } from "@/lib/asset";
import { workstationSites } from "./workstation-sites";
import { groundHeight } from "../runtime";
import { workstationTaskStates } from "./npc-motion";


export const workstationDiagnostics = new Map<string, { id: string; x: number; z: number; persistent: boolean; completedProp?: boolean }>();

/** Persistent world props, independently owned from actor animation atlases. */
export function Workstations({ scale }: { scale: number }) {
  useEffect(() => () => { workstationTaskStates.clear(); }, []);
  return <>{workstationSites.map(site => <Workstation key={site.id} site={site} scale={scale} />)}</>;
}

function Workstation({ site, scale }: { site: typeof workstationSites[number]; scale: number }) {
  const texture = useTexture(asset(`/sprites/workstations/${site.id}/sprite.png`));
  texture.colorSpace = THREE.SRGBColorSpace;
  const pixel = 1.95 / site.bodyHeight;
  const { targetX: x, targetZ: z } = site.target;
  useEffect(() => {
    workstationDiagnostics.set(site.id, { id: site.id, x, z, persistent: true });
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

/** The released crate stays at the station after the completed worker leaves. */
function CompletedProp({ site, pixel }: { site: typeof workstationSites[number]; pixel: number }) {
  const texture = useTexture(asset(`/sprites/workstations/${site.id}/${site.completionLayer}`));
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const state = workstationTaskStates.get(site.id);
    // While active, the final actor frame already contains the same crate pixels.
    const visible = Boolean(state?.completed && !state.active);
    if (mesh.current) mesh.current.visible = visible;
    const diagnostic = workstationDiagnostics.get(site.id);
    if (diagnostic) diagnostic.completedProp = visible;
  });
  return <mesh ref={mesh} visible={false} position={[(320 - site.anchor[0]) * pixel, (site.anchor[1] - 320) * pixel, .006]} scale={[640 * pixel, 640 * pixel, 1]} renderOrder={3}>
    <planeGeometry args={[1, 1]} />
    <meshBasicMaterial map={texture} transparent alphaTest={.34} depthWrite toneMapped={false} side={THREE.DoubleSide} />
  </mesh>;
}
