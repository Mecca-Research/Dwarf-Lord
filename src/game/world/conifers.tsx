import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { asset } from "@/lib/asset";
import { campClearing, creekX, noise, random, surfaceHeight, TARN } from "./landscape";
import { workstationSites } from "./workstation-sites";

type Tree = { x: number; y: number; z: number; scale: number; variant: number };
function TreeCards({
  trees,
  variant,
  shadows = false,
}: {
  trees: Tree[];
  variant: number;
  shadows?: boolean;
}) {
  const texture = useTexture(asset("/art/alpine-conifers-v2.webp"));
  const ref = useRef<THREE.InstancedMesh>(null),
    previous = useRef(NaN);
  const object = useMemo(() => new THREE.Object3D(), []),
    direction = useMemo(() => new THREE.Vector3(), []);
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1);
    g.translate(0, 0.48, 0);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, (uv.getX(i) + (variant % 2)) / 2, (uv.getY(i) + (variant < 2 ? 1 : 0)) / 2);
    return g;
  }, [variant]);
  const depth = useMemo(
    () =>
      new THREE.MeshDepthMaterial({
        map: texture,
        alphaTest: 0.42,
        depthPacking: THREE.RGBADepthPacking,
        side: THREE.DoubleSide,
      }),
    [texture],
  );
  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    trees.forEach((_, i) =>
      ref.current!.setColorAt(i, new THREE.Color(i % 3 ? "#c5cfc0" : "#d8d0b7")),
    );
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
  }, [texture, trees]);
  useFrame(({ camera }) => {
    camera.getWorldDirection(direction);
    const yaw = Math.atan2(-direction.x, -direction.z);
    if (Math.abs(yaw - previous.current) < 0.0001) return;
    previous.current = yaw;
    trees.forEach((t, i) => {
      object.position.set(t.x, t.y, t.z);
      object.rotation.set(0, yaw, 0);
      object.scale.set(t.scale * (0.92 + random(i + variant * 100) * 0.18), t.scale, 1);
      object.updateMatrix();
      ref.current!.setMatrixAt(i, object.matrix);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  });
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, trees.length]}
      castShadow={shadows}
      customDepthMaterial={depth}
    >
      <meshBasicMaterial map={texture} alphaTest={0.42} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}
function RootShadows({ trees }: { trees: Tree[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    trees.forEach((t, i) => {
      o.position.set(t.x, t.y + 0.025, t.z);
      o.rotation.x = -Math.PI / 2;
      o.scale.set(t.scale * 0.48, t.scale * 0.32, 1);
      o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [trees]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, trees.length]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        vertexShader={
          "varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}"
        }
        fragmentShader={
          "varying vec2 v;void main(){float a=(1.-smoothstep(.05,.5,length(v-.5)))*.22;gl_FragColor=vec4(.025,.035,.022,a);}"
        }
      />
    </instancedMesh>
  );
}
export function ConiferBelt() {
  const trees = useMemo(() => {
    const result: Tree[] = [];
    for (let i = 0; i < 1450; i++) {
      const x = -120 + random(i * 11 + 4) * 240,
        z = -103 + random(i * 13 + 9) * 175,
        y = surfaceHeight(x, z);
      if ((x > -28 && x < 33 && z > -32 && z < 30) || y > 43 || Math.abs(x - creekX(z)) < 4.5)
        continue;
      if (
        campClearing(x, z) > 0.1 ||
        Math.hypot((x - TARN.x) / TARN.rx, (z - TARN.z) / TARN.rz) < 1.16
      )
        continue;
      if (z < -24 && z > -37 && x > -37 && x < 43) continue;
      if (random(i + 777) > 0.35 + noise(x * 0.07, z * 0.07) * 0.65) continue;
      if (workstationSites.some((s) => Math.hypot(x - s.target.targetX, z - s.target.targetZ) < 5))
        continue;
      result.push({
        x,
        z,
        y,
        scale: 5.8 + random(i * 17) * 5.2,
        variant: i % 13 === 0 ? 3 : i % 3,
      });
    }
    for (const [x, z, variant] of [
      [-25, -5, 0],
      [-24, -15, 2],
      [28, -13, 1],
      [30, 7, 0],
      [24, 23, 2],
      [-20, 27, 1],
    ])
      if (campClearing(x, z) < 0.3)
        result.push({ x, z, y: surfaceHeight(x, z), scale: 7.6, variant });
    return result;
  }, []);
  const groups = useMemo(
    () => Array.from({ length: 4 }, (_, variant) => trees.filter((t) => t.variant === variant)),
    [trees],
  );
  return (
    <group name="clustered-alpine-forest">
      <RootShadows trees={trees.filter((t) => t.y < 5)} />
      {groups.map((group, variant) => (
        <TreeCards
          key={variant}
          trees={group.filter((t) => Math.hypot(t.x, t.z) >= 34)}
          variant={variant}
        />
      ))}
      {groups.map((group, variant) => (
        <TreeCards
          key={`near-${variant}`}
          trees={group.filter((t) => Math.hypot(t.x, t.z) < 34)}
          variant={variant}
          shadows
        />
      ))}
    </group>
  );
}
