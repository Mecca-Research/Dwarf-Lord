import { Billboard, useTexture } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";
import { asset } from "@/lib/asset";
import { JOBS } from "../data/catalog";
import { groundHeight } from "../runtime";

export const cookingSite = JOBS.find(job => job.id === "meals")!;

export const workstationDiagnostics = new Map<string, { id: string; x: number; z: number; persistent: boolean }>();

/** Persistent world prop, independently owned from the Cook's actor atlas. */
export function CookingWorkstation({ scale }: { scale: number }) {
  const texture = useTexture(asset("/sprites/workstations/cutting-block/sprite.png"));
  texture.colorSpace = THREE.SRGBColorSpace;
  const pixel = 1.95 / 520;
  useEffect(() => {
    workstationDiagnostics.set("cutting-block", { id: "cutting-block", x: cookingSite.targetX, z: cookingSite.targetZ, persistent: true });
    return () => { workstationDiagnostics.delete("cutting-block"); };
  }, []);
  return (
    <group position={[cookingSite.targetX, groundHeight(cookingSite.targetX, cookingSite.targetZ), cookingSite.targetZ]} scale={scale}>
      <Billboard follow>
        <mesh position={[0, (616 - 320) * pixel, .005]} scale={[640 * pixel, 640 * pixel, 1]} renderOrder={2}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={texture} transparent alphaTest={.34} depthWrite toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </Billboard>
    </group>
  );
}
