import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { runtime, zoneAt } from "../runtime";
import { MineInterior } from "./mine";
export function SurfaceWorld({ children }: { children: ReactNode }) {
  const surface = useRef<Group>(null);
  useFrame(() => {
    if (surface.current)
      surface.current.visible = zoneAt(runtime.player.x, runtime.player.z) !== "mine";
  });
  return (
    <>
      <group ref={surface}>{children}</group>
      <MineInterior />
    </>
  );
}
