import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { groundHeight } from "../runtime";
import { useMats } from "./materials";
import { sagCanvasGeo } from "./geom";

type V3 = [number, number, number];
type Part = { p: V3; s: V3; r?: V3; cylinder?: boolean; grain?: boolean };
const noise = (i: number) => {
  const n = Math.sin(i * 127.1 + 31.7) * 43758.5453;
  return n - Math.floor(n);
};
function box(p: V3, s: V3, r?: V3): Part {
  return { p, s, r };
}
/** Merge timber pieces by material: visible construction detail without a draw per board. */
export function Parts({
  parts,
  material,
}: {
  parts: Part[];
  material: THREE.MeshStandardMaterial;
}) {
  const { geo, mat } = useMemo(() => {
    const matrix = new THREE.Matrix4(),
      q = new THREE.Quaternion(),
      e = new THREE.Euler();
    const geos = parts.map((p, i) => {
      const g = p.cylinder
        ? new THREE.CylinderGeometry(0.5, 0.5, 1, 12)
        : new THREE.BoxGeometry(1, 1, 1);
      const uv = g.attributes.uv;
      for (let v = 0; v < uv.count; v++) {
        const u = uv.getX(v),
          t = uv.getY(v);
        const along = p.s[1] > p.s[0] || p.s[2] > p.s[0];
        uv.setXY(
          v,
          (along ? t : u) * 0.75 + noise(i) * 0.2,
          (along ? u : t) * 0.075 + (i % 10) * 0.09,
        );
      }
      e.set(...(p.r ?? [0, 0, 0]));
      q.setFromEuler(e);
      matrix.compose(new THREE.Vector3(...p.p), q, new THREE.Vector3(...p.s));
      g.applyMatrix4(matrix);
      const colors = new Float32Array(g.attributes.position.count * 3);
      const tint = 0.77 + noise(i) * 0.3;
      for (let j = 0; j < colors.length; j++) colors[j] = tint;
      g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      return g;
    });
    const geo = geos.length ? mergeGeometries(geos) : new THREE.BufferGeometry();
    geos.forEach((g) => g.dispose());
    const mat = material.clone();
    mat.vertexColors = true;
    return { geo, mat };
  }, [parts, material]);
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  return <mesh geometry={geo} material={mat} castShadow receiveShadow />;
}
function beam(a: V3, b: V3, width: number): Part {
  const va = new THREE.Vector3(...a),
    vb = new THREE.Vector3(...b),
    d = vb.clone().sub(va);
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    d.clone().normalize(),
  );
  const e = new THREE.Euler().setFromQuaternion(q),
    mid = va.add(vb).multiplyScalar(0.5);
  return box(mid.toArray() as V3, [width, d.length(), width], [e.x, e.y, e.z]);
}
export function TimberHall({
  x,
  z,
  rot,
  condition,
}: {
  x: number;
  z: number;
  rot: number;
  condition: number;
}) {
  const m = useMats(),
    repaired = condition > 0.5;
  const model = useMemo(() => {
    const boards: Part[] = [],
      frame: Part[] = [],
      stone: Part[] = [],
      nails: Part[] = [];
    for (let side = 0; side < 2; side++)
      for (let i = 0; i < 24; i++) {
        const px = -3.98 + i * 0.346,
          pz = side ? 2.45 : -2.45;
        if (side && Math.abs(px) < 0.79) continue;
        const h = 2.28 - noise(i + side * 24) * 0.12;
        boards.push(
          box([px, 0.55 + h / 2, pz], [0.325, h, 0.12], [0, 0, (noise(i) - 0.5) * 0.015]),
        );
        for (const y of [0.76, 2.54])
          nails.push(box([px, y, pz + (side ? 0.067 : -0.067)], [0.025, 0.025, 0.018]));
      }
    for (const side of [-1, 1])
      for (let i = 0; i < 15; i++) {
        const pz = -2.36 + i * 0.337,
          h = 2.3 + (1 - Math.abs(pz) / 2.55) * 1.9;
        boards.push(box([side * 4.14, 0.55 + h / 2, pz], [0.13, h - 0.04, 0.315]));
      }
    for (let i = 0; i < 24; i++)
      for (const side of [-1, 1]) {
        if (!repaired && side === 1 && [5, 6, 12, 18, 19].includes(i)) {
          if (i % 2)
            boards.push(
              box(
                [-4.3 + i * 0.373, 4.65, side * 0.36],
                [0.345, 0.105, 0.95],
                [side * 0.665, 0, 0.025],
              ),
            );
          continue;
        }
        const len = 3.37 - (repaired ? 0 : noise(i + 3) * 0.38);
        boards.push(
          box(
            [-4.3 + i * 0.373, 3.84 + noise(i) * 0.025, side * 1.3],
            [0.347, 0.105, len],
            [side * 0.665, 0, (noise(i) - 0.5) * 0.015],
          ),
        );
      }
    for (const px of [-4.2, -2.1, 0, 2.1, 4.2]) {
      frame.push(
        beam([px, 2.68, -2.67], [px, 4.98, 0], 0.16),
        beam([px, 4.98, 0], [px, 2.68, 2.67], 0.16),
      );
      if (Math.abs(px) > 4)
        frame.push(
          beam([px, 0.45, -2.45], [px, 2.73, 2.45], 0.17),
          beam([px, 0.45, 2.45], [px, 2.73, -2.45], 0.17),
        );
    }
    for (const px of [-4.17, -0.83, 0.83, 4.17])
      for (const pz of [-2.46, 2.46]) frame.push(box([px, 1.63, pz], [0.22, 2.5, 0.22]));
    for (const pz of [-2.48, 2.48])
      for (const y of [0.6, 2.78]) frame.push(box([0, y, pz], [8.55, 0.2, 0.2]));
    frame.push(box([0, 5.02, 0], [8.98, 0.16, 0.2]), box([0, 2.66, 2.47], [1.72, 0.22, 0.24]));
    for (let i = 0; i < 24; i++)
      for (const pz of [-2.5, 2.5])
        stone.push(
          box(
            [-4.2 + i * 0.37, 0.27, pz],
            [0.36, 0.46 + noise(i) * 0.12, 0.43],
            [0, noise(i) * 0.2, noise(i) * 0.1],
          ),
        );
    for (const px of [-4.18, 4.18])
      for (let i = 0; i < 13; i++)
        stone.push(box([px, 0.28, -2.4 + i * 0.4], [0.45, 0.48, 0.37], [0, noise(i), 0]));
    for (let i = 0; i < 3; i++)
      boards.push(box([0, 0.13 + i * 0.15, 3.05 - i * 0.25], [1.65 - i * 0.13, 0.13, 0.48]));
    // Split and fallen lumber at the foot of the wall, leaving the door accessible.
    if (!repaired)
      for (let i = 0; i < 15; i++)
        boards.push(
          box(
            [-4.9 + noise(i) * 1.4, 0.1 + noise(i + 13) * 0.2, -0.5 + noise(i + 8) * 4],
            [0.12 + noise(i + 3) * 0.18, 0.06, 1 + noise(i + 12) * 1.8],
            [noise(i) * 0.15, noise(i + 14) * 2, 0.08],
          ),
        );
    return { boards, frame, stone, nails };
  }, [repaired]);
  const patch = useMemo(() => sagCanvasGeo(2.0, 1.65, 0.12), []);
  return (
    <group position={[x, Math.max(0, groundHeight(x, z)), z]} rotation-y={rot}>
      <Parts parts={model.stone} material={m.stone} />
      <Parts parts={model.boards} material={m.wood} />
      <Parts parts={model.frame} material={m.woodDark} />
      <Parts parts={model.nails} material={m.iron} />
      <mesh position={[0, 0.54, 0]} material={m.woodDark} receiveShadow>
        <boxGeometry args={[8.1, 0.1, 4.8]} />
      </mesh>
      <mesh position={[0, 1.4, 1.6]} material={m.black}>
        <boxGeometry args={[1.4, 1.8, 0.1]} />
      </mesh>
      <mesh position={[0.85, 1.48, 2.77]} rotation-y={-0.8} material={m.woodDark} castShadow>
        <boxGeometry args={[0.9, 1.85, 0.1]} />
      </mesh>
      {!repaired && (
        <mesh
          position={[-0.9, 4.42, 0.85]}
          rotation={[-0.91, 0, 0.09]}
          geometry={patch}
          material={m.canvas}
          castShadow
          receiveShadow
        />
      )}
      {[-2.5, 2.5].map((px) => (
        <group key={px} position={[px, 1.8, 2.53]}>
          <mesh material={m.black}>
            <boxGeometry args={[0.72, 0.7, 0.05]} />
          </mesh>
          {[-0.23, 0, 0.23].map((t) => (
            <mesh key={t} position={[t, 0, 0.045]} material={m.woodDark}>
              <boxGeometry args={[0.055, 0.78, 0.07]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
export function WoodenCrate({
  x,
  z,
  y = 0,
  s = 0.72,
  rot = 0,
}: {
  x: number;
  z: number;
  y?: number;
  s?: number;
  rot?: number;
}) {
  const m = useMats();
  const parts = useMemo(() => {
    const planks: Part[] = [],
      rails: Part[] = [];
    for (const sign of [-1, 1])
      for (let i = 0; i < 5; i++) {
        planks.push(box([-0.29 + i * 0.145, 0.36, sign * 0.355], [0.137, 0.62, 0.045]));
        planks.push(box([sign * 0.355, 0.36, -0.29 + i * 0.145], [0.045, 0.62, 0.137]));
        for (const v of [-0.28, 0.28])
          rails.push(
            box([v, 0.36, sign * 0.39], [0.075, 0.72, 0.075]),
            box([sign * 0.39, 0.36, v], [0.075, 0.72, 0.075]),
          );
        for (const yy of [0.065, 0.66])
          rails.push(
            box([0, yy, sign * 0.39], [0.73, 0.07, 0.075]),
            box([sign * 0.39, yy, 0], [0.075, 0.07, 0.73]),
          );
      }
    for (let i = 0; i < 5; i++) planks.push(box([-0.29 + i * 0.145, 0.69, 0], [0.135, 0.055, 0.7]));
    return { planks, rails };
  }, []);
  return (
    <group position={[x, y || groundHeight(x, z), z]} scale={s / 0.72} rotation-y={rot}>
      <Parts parts={parts.planks} material={m.wood} />
      <Parts parts={parts.rails} material={m.woodDark} />
    </group>
  );
}
export function StaveBarrel({
  x,
  z,
  y = 0,
  rot = 0,
  lying = false,
}: {
  x: number;
  z: number;
  y?: number;
  rot?: number;
  lying?: boolean;
}) {
  const m = useMats();
  const staves = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 18; i++) {
      const points = [
        new THREE.Vector2(0.295, 0),
        new THREE.Vector2(0.335, 0.15),
        new THREE.Vector2(0.37, 0.46),
        new THREE.Vector2(0.335, 0.78),
        new THREE.Vector2(0.295, 0.92),
      ];
      const g = new THREE.LatheGeometry(
        points,
        3,
        (i * Math.PI * 2) / 18,
        (Math.PI * 2) / 18 - 0.009,
      );
      geos.push(g);
    }
    const g = mergeGeometries(geos);
    geos.forEach((g) => g.dispose());
    return g;
  }, []);
  return (
    <group position={[x, y || groundHeight(x, z), z]} rotation-y={rot}>
      <group position={[0, lying ? 0.36 : 0, 0]} rotation-z={lying ? Math.PI / 2 : 0}>
        <mesh geometry={staves} material={m.wood} castShadow receiveShadow />
        {[0.12, 0.27, 0.67, 0.82].map((h, i) => (
          <mesh key={h} position={[0, h, 0]} rotation-x={Math.PI / 2} material={m.iron} castShadow>
            <torusGeometry args={[i === 1 || i === 2 ? 0.354 : 0.326, 0.027, 4, 36]} />
          </mesh>
        ))}
        {[0.02, 0.918].map((h) => (
          <mesh key={h} position={[0, h, 0]} material={m.woodDark}>
            <cylinderGeometry args={[0.294, 0.294, 0.025, 24]} />
          </mesh>
        ))}
        <mesh position={[0.09, 0.94, 0.03]} material={m.wood}>
          <cylinderGeometry args={[0.045, 0.045, 0.02, 12]} />
        </mesh>
      </group>
    </group>
  );
}
export function GroundWalk({
  x,
  z,
  len = 12,
  rot = 0,
  width = 1.45,
}: {
  x: number;
  z: number;
  len?: number;
  rot?: number;
  width?: number;
}) {
  const m = useMats();
  const parts = useMemo(() => {
    const p: Part[] = [],
      n = Math.ceil(len / 0.43);
    for (let i = 0; i < n; i++)
      p.push(
        box(
          [
            (noise(i) - 0.5) * 0.11,
            0.105 + noise(i + 13) * 0.025,
            -len / 2 + ((i + 0.5) * len) / n,
          ],
          [width + (noise(i + 41) - 0.5) * 0.18, 0.11, 0.39],
          [0, (noise(i + 4) - 0.5) * 0.045, (noise(i + 71) - 0.5) * 0.02],
        ),
      );
    p.push(
      box([-width * 0.34, 0.035, 0], [0.13, 0.12, len]),
      box([width * 0.34, 0.035, 0], [0.13, 0.12, len]),
    );
    return p;
  }, [len, width]);
  return (
    <group position={[x, groundHeight(x, z), z]} rotation-y={rot}>
      <Parts parts={parts} material={m.wood} />
    </group>
  );
}
export function RidgeTent({
  x,
  z,
  rot,
  scale = 1,
}: {
  x: number;
  z: number;
  rot: number;
  scale?: number;
}) {
  const m = useMats();
  const cloth = useMemo(() => sagCanvasGeo(2.7, 2.05, 0.13), []);
  const poles = useMemo(
    () => [
      beam([-1.45, 0, 0], [-1.45, 1.8, 0], 0.065),
      beam([1.45, 0, 0], [1.45, 1.8, 0], 0.065),
      beam([-1.55, 1.8, 0], [1.55, 1.8, 0], 0.07),
    ],
    [],
  );
  const ropes = useMemo(
    () => [
      beam([-1.45, 1.78, 0], [-2.15, 0.04, 0], 0.016),
      beam([1.45, 1.78, 0], [2.15, 0.04, 0], 0.016),
    ],
    [],
  );
  const flap = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.23, 0);
    s.lineTo(1.23, 0);
    s.lineTo(0, 1.74);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  return (
    <group position={[x, Math.max(0, groundHeight(x, z)), z]} rotation-y={rot} scale={scale}>
      <Parts parts={poles} material={m.woodDark} />
      <Parts parts={ropes} material={m.canvas} />
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[0, 0.91, side * 0.65]}
          rotation-x={-side * 0.88}
          geometry={cloth}
          material={m.canvas}
          castShadow
          receiveShadow
        />
      ))}
      <mesh
        position={[1.36, 0.04, 0]}
        rotation-y={Math.PI / 2}
        geometry={flap}
        material={m.canvas}
        castShadow
      />
      <mesh
        position={[-1.3, 0.45, -0.78]}
        rotation={[0, -1.4, -0.18]}
        material={m.canvas}
        castShadow
      >
        <planeGeometry args={[0.58, 0.86]} />
      </mesh>
      <mesh position={[0, 0.08, 0.02]} material={m.leather} receiveShadow>
        <boxGeometry args={[1.85, 0.12, 0.74]} />
      </mesh>
      <mesh position={[0.68, 0.2, 0.02]} rotation-x={Math.PI / 2} material={m.leather} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.8, 16]} />
      </mesh>
    </group>
  );
}
