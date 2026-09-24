import { Billboard, useTexture } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";
import { asset } from "@/lib/asset";
import { workstationSites } from "./workstation-sites";
import { groundHeight } from "../runtime";


export const workstationDiagnostics = new Map<string, { id: string; x: number; z: number; persistent: boolean }>();

/** Persistent world props, independently owned from actor animation atlases. */
export function Workstations({ scale }: { scale: number }) {
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
      </Billboard>
    </group>
  );
}
