import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { groundHeight } from "../runtime";
import { Parts } from "./reference-assets";
import { useMats } from "./materials";
import { Barrel, Crate, Sack, Woodpile, OrePile, TorchPost } from "./kit";
import { ChimneySmoke } from "./fx";
import { random } from "./landscape";

type V3 = [number, number, number];
type Part = { p: V3; s: V3; r?: V3; cylinder?: boolean };
const box = (p: V3, s: V3, r?: V3): Part => ({ p, s, r });
function beam(a: V3, b: V3, width = 0.2): Part {
  const av = new THREE.Vector3(...a),
    bv = new THREE.Vector3(...b),
    delta = bv.clone().sub(av);
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    delta.clone().normalize(),
  );
  const e = new THREE.Euler().setFromQuaternion(q);
  return box(
    av.add(bv).multiplyScalar(0.5).toArray() as V3,
    [width, delta.length(), width],
    [e.x, e.y, e.z],
  );
}
function Rope({ a, b, sag = 0.12 }: { a: V3; b: V3; sag?: number }) {
  const m = useMats();
  const geometry = useMemo(() => {
    const mid = new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(0.5);
    mid.y -= sag;
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(...a), mid, new THREE.Vector3(...b)]),
      12,
      0.025,
      4,
      false,
    );
  }, [a.join(), b.join(), sag]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={m.straw} />;
}

function CanvasCloth({
  geometry,
  color = "#d7c9a7",
}: {
  geometry: THREE.BufferGeometry;
  color?: string;
}) {
  const m = useMats(),
    wind = useMemo(() => ({ value: 0 }), []);
  const material = useMemo(() => {
    const mat = m.canvas.clone();
    mat.color.set(color);
    mat.roughness = 1;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.campWind = wind;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        "#include <map_fragment>\ndiffuseColor.rgb*=2.2;",
      );
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float campWind;")
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\ntransformed.x+=sin(campWind*1.1+position.z*2.3)*sin(uv.x*3.14159)*.025;",
        );
    };
    mat.customProgramCacheKey = () => "camp-cloth-v2";
    return mat;
  }, [m, color, wind]);
  useFrame(({ clock }) => {
    wind.value = clock.elapsedTime;
  });
  useEffect(() => () => material.dispose(), [material]);
  return <mesh geometry={geometry} material={material} castShadow receiveShadow />;
}
function tentRoof(width: number, length: number, height: number) {
  const positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (const side of [-1, 1]) {
    const start = positions.length / 3;
    for (let j = 0; j <= 12; j++)
      for (let i = 0; i <= 6; i++) {
        const u = i / 6,
          v = j / 12;
        positions.push(
          (side * u * width) / 2,
          height * (1 - u) + 0.15 * u - Math.sin(v * Math.PI) * Math.sin(u * Math.PI) * 0.25,
          (v - 0.5) * length,
        );
        uv.push(u, v);
        if (i < 6 && j < 12) {
          const a = start + j * 7 + i;
          indices.push(a, a + 7, a + 1, a + 1, a + 7, a + 8);
        }
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
function TentFlaps({
  width,
  length,
  height,
  color,
}: {
  width: number;
  length: number;
  height: number;
  color: string;
}) {
  const geometry = useMemo(() => {
    const p: number[] = [],
      uv: number[] = [];
    for (const side of [-1, 1]) {
      p.push(
        0,
        height,
        length / 2,
        (side * width) / 2,
        0.15,
        length / 2,
        side * 0.85,
        0.3,
        length / 2 + 0.5,
      );
      uv.push(0.5, 1, side === 1 ? 1 : 0, 0, 0.5 + side * 0.16, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }, [width, length, height]);
  return <CanvasCloth geometry={geometry} color={color} />;
}

export function ExpeditionTent({
  x,
  z,
  rot = 0,
  width = 4.8,
  length = 6.2,
  height = 3.8,
  color = "#d4c6a7",
  buildingId,
}: {
  x: number;
  z: number;
  rot?: number;
  width?: number;
  length?: number;
  height?: number;
  color?: string;
  buildingId?: string;
}) {
  const m = useMats(),
    roof = useMemo(() => tentRoof(width, length, height), [width, length, height]);
  const endPanel = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0.15);
    shape.lineTo(0, height);
    shape.lineTo(width / 2, 0.15);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [width, height]);
  const frame = useMemo(
    () => [
      box([0, height / 2, -length / 2], [0.14, height, 0.14]),
      box([0, height / 2, length / 2], [0.14, height, 0.14]),
      box([0, height, 0], [0.15, 0.15, length + 0.6]),
      box([0, 0.05, 0], [width - 0.3, 0.1, length - 0.3]),
      ...[-1, 1].flatMap((side) =>
        [-1, 1].map((end) =>
          box(
            [side * (width / 2 + 0.7), 0.16, (end * length) / 2],
            [0.1, 0.42, 0.1],
            [0.2, 0, side * 0.2],
          ),
        ),
      ),
    ],
    [width, height, length],
  );
  return (
    <group
      name="weathered-expedition-tent"
      userData={{ buildingId }}
      position={[x, groundHeight(x, z), z]}
      rotation-y={rot}
    >
      <Parts parts={frame} material={m.woodDark} />
      <CanvasCloth geometry={roof} color={color} />
      <TentFlaps width={width} length={length} height={height} color={color} />
      <group position={[0, 0, -length / 2]}>
        <CanvasCloth geometry={endPanel} color={color} />
      </group>
      <mesh geometry={endPanel} position={[0, 0, -length / 2 + 0.025]}>
        <meshBasicMaterial color="#25271f" side={THREE.DoubleSide} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * width * 0.22, 0.14, -0.1]}>
          <boxGeometry args={[1, 0.16, 2.6]} />
          <meshStandardMaterial color="#756d54" roughness={1} />
        </mesh>
      ))}
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((end) => (
          <Rope
            key={`${side}:${end}`}
            a={[(side * width) / 2, 0.45, (end * length) / 2]}
            b={[side * (width / 2 + 0.7), 0.2, (end * length) / 2]}
          />
        )),
      )}
      <Rope a={[0, height, length / 2]} b={[0, 0.15, length / 2 + 1.6]} sag={0.05} />
      <Crate x={-width / 2 - 0.5} z={length / 2 - 0.3} s={0.6} />
      <Sack x={width / 2 - 0.3} z={length / 2 + 0.5} />
    </group>
  );
}

export function RuinedBarracks({
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
    const wood: Part[] = [],
      dark: Part[] = [],
      stone: Part[] = [];
    for (const px of [-4.4, 0, 4.4])
      for (const pz of [-3.1, 3.1]) dark.push(box([px, 1.7, pz], [0.28, 3.1, 0.28]));
    for (const pz of [-3.1, 3.1]) {
      dark.push(box([0, 3.2, pz], [9.1, 0.28, 0.28]), box([0, 0.38, pz], [9.1, 0.25, 0.28]));
      for (let i = 0; i < 26; i++) {
        const px = -4.3 + i * 0.345;
        if (pz > 0 && Math.abs(px) < 1.1) continue;
        const broken = !repaired && pz > 0 && i > 19;
        wood.push(
          box(
            [px, 0.5 + (broken ? 0.9 : 1.3), pz],
            [0.32, broken ? 1.8 : 2.6, 0.14],
            [0, 0, (random(i) - 0.5) * 0.025],
          ),
        );
      }
    }
    for (const px of [-4.4, 4.4]) {
      for (let j = 0; j < 18; j++) wood.push(box([px, 1.75, -3 + j * 0.35], [0.14, 2.6, 0.32]));
      dark.push(beam([px, 0.45, -3], [px, 3.15, 3], 0.2), beam([px, 0.45, 3], [px, 3.15, -3], 0.2));
    }
    for (const px of [-4.5, -2.25, 0, 2.25, 4.5]) {
      dark.push(
        beam([px, 3.15, -3.3], [px, 5.65, 0], 0.2),
        beam([px, 5.65, 0], [px, 3.15, 3.3], 0.2),
      );
      for (const pz of [-3.15, 3.15]) dark.push(box([px, 3.2, pz], [0.2, 0.2, 0.4]));
    }
    dark.push(box([0, 5.65, 0], [9.6, 0.25, 0.25]));
    for (let i = 0; i < 27; i++)
      for (const side of [-1, 1]) {
        if (!repaired && side > 0 && i > 8 && i < 20) continue;
        wood.push(
          box(
            [-4.65 + i * 0.355, 4.38, side * 1.66],
            [0.33, 0.14, 4.23 - random(i) * 0.22],
            [side * 0.64, 0, 0],
          ),
        );
      }
    for (let i = 0; i < 28; i++)
      for (const side of [-1, 1])
        stone.push(
          box(
            [-4.5 + i * 0.34, 0.22, side * 3.1],
            [0.33, 0.44 + random(i) * 0.08, 0.55],
            [0, random(i) * 0.18, 0],
          ),
        );
    for (let i = 0; i < 4; i++)
      wood.push(box([0, 0.06 + i * 0.1, 4.3 - i * 0.3], [2.5 - i * 0.15, 0.12, 0.48]));
    for (let i = 0; i < 14; i++)
      wood.push(
        box(
          [1.6 + random(i) * 2.5, 0.12 + random(i + 20) * 0.18, 2.4 + random(i + 10) * 2.4],
          [0.2, 0.1, 1.2 + random(i) * 1.8],
          [0.1, random(i + 2) * 2.6, 0.03],
        ),
      );
    return { wood, dark, stone };
  }, [repaired]);
  const patch = useMemo(() => tentRoof(3.4, 3.5, 1.3), []);
  return (
    <group
      name="ruined-timber-barracks"
      userData={{ buildingId: "dorm" }}
      position={[x, 0, z]}
      rotation-y={rot}
    >
      <Parts parts={model.stone} material={m.stoneDark} />
      <Parts parts={model.dark} material={m.woodDark} />
      <Parts parts={model.wood} material={m.wood} />
      {!repaired && (
        <group position={[0.5, 4, 0.5]} rotation-y={Math.PI / 2}>
          <CanvasCloth geometry={patch} color="#8a8770" />
        </group>
      )}
      <mesh position={[0, 1.55, 3.08]}>
        <planeGeometry args={[2.1, 2.65]} />
        <meshBasicMaterial color="#151711" />
      </mesh>
      <Barrel x={-4.8} z={2.5} />
      <Woodpile x={-5} z={-1} rot={0.1} />
    </group>
  );
}

export function FieldForge({ x, z, condition }: { x: number; z: number; condition: number }) {
  const m = useMats(),
    hot = condition > 0.4;
  const model = useMemo(() => {
    const stone: Part[] = [],
      wood: Part[] = [],
      roof: Part[] = [];
    for (let level = 0; level < 6; level++)
      for (let i = 0; i < 10; i++) {
        const px = -3 + i * 0.64 + (level % 2) * 0.12;
        stone.push(
          box(
            [px, 0.25 + level * 0.48, -2.4],
            [0.61, 0.45, 0.7],
            [0, random(i + level * 10) * 0.08, 0],
          ),
        );
      }
    for (let level = 0; level < 13; level++)
      for (const side of [-1, 1])
        stone.push(box([1.5 + side * 0.6, 0.24 + level * 0.47, -1.55], [0.5, 0.44, 1.25]));
    stone.push(box([1.5, 1, -1.35], [2.5, 0.5, 2.5]), box([1.5, 6.25, -1.55], [1.9, 0.3, 1.9]));
    for (const px of [-3.15, 3.3])
      for (const pz of [-2.4, 2.2]) wood.push(box([px, 2.3, pz], [0.25, 4.6, 0.25]));
    for (const px of [-3.15, -0.5, 3.3]) {
      wood.push(beam([px, 4.3, -2.5], [px, 3.6, 2.7], 0.22));
      wood.push(beam([px, 3.3, 1.5], [px, 4, 2.4], 0.16));
    }
    for (let i = 0; i < 18; i++) {
      if (i > 9 && i < 15) continue;
      roof.push(box([-3.4 + i * 0.4, 4, 0], [0.36, 0.14, 5.6], [0.14, 0, 0]));
    }
    return { stone, wood, roof };
  }, []);
  return (
    <group name="open-field-forge" userData={{ buildingId: "forge" }} position={[x, 0, z]}>
      <Parts parts={model.stone} material={m.stoneDark} />
      <Parts parts={model.wood} material={m.woodDark} />
      <Parts parts={model.roof} material={m.roof} />
      <mesh position={[1.5, 1.4, -0.05]}>
        <boxGeometry args={[1.45, 0.5, 0.3]} />
        <meshStandardMaterial
          color={hot ? "#c74214" : "#1e211e"}
          emissive={hot ? "#d3410b" : "#000000"}
          emissiveIntensity={hot ? 2 : 0}
        />
      </mesh>
      {hot && (
        <>
          <pointLight position={[1, 2, 0]} color="#ff9a45" intensity={18} distance={8} />
          <ChimneySmoke x={1.5} z={-1.55} y={6.6} />
        </>
      )}
      <Woodpile x={3.8} z={-1.2} rot={0.2} />
      <Barrel x={3.5} z={2} />
      <OrePile x={2.9} z={3} color="iron" />
    </group>
  );
}

export function StoresLeanTo({
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
  const m = useMats();
  const model = useMemo(() => {
    const frame: Part[] = [],
      boards: Part[] = [];
    for (const px of [-3.6, 0, 3.6])
      for (const side of [-1, 1])
        frame.push(box([px, side < 0 ? 2.1 : 1.6, side * 2.3], [0.25, side < 0 ? 4.2 : 3.2, 0.25]));
    for (const px of [-3.6, 0, 3.6]) frame.push(beam([px, 4.25, -2.6], [px, 3.2, 2.7], 0.22));
    for (let i = 0; i < 22; i++) {
      if (condition < 0.5 && [4, 12, 18].includes(i)) continue;
      boards.push(box([-3.8 + i * 0.36, 3.76, 0], [0.33, 0.13, 5.7], [0.19, 0, 0]));
    }
    frame.push(
      beam([-3.6, 0.3, -2.3], [-3.6, 3.2, 2.3], 0.18),
      beam([3.6, 0.3, -2.3], [3.6, 3.2, 2.3], 0.18),
    );
    return { frame, boards };
  }, [condition]);
  return (
    <group
      name="stores-timber-lean-to"
      userData={{ buildingId: "storage" }}
      position={[x, 0, z]}
      rotation-y={rot}
    >
      <Parts parts={model.frame} material={m.woodDark} />
      <Parts parts={model.boards} material={m.wood} />
      {[
        [-2.3, -1],
        [-0.8, -1.4],
        [1.4, -1.2],
        [2.7, -1],
        [1, 0.2],
      ].map(([cx, cz], i) => (
        <Crate key={i} x={cx} z={cz} s={i % 2 ? 0.9 : 1.1} />
      ))}
      <Crate x={-2.3} z={-1} y={1.1} s={0.8} />
      <Barrel x={-3} z={1.2} />
      <Barrel x={2.8} z={1.2} />
      <Sack x={0} z={0.8} />
      <Sack x={0.7} z={1.2} />
    </group>
  );
}

export function CookShelter() {
  const m = useMats();
  const frame = useMemo(
    () =>
      [-13.7, -6.5, 0.7].flatMap((x) => [
        box([x, 2.15, 1.5], [0.17, 4.3, 0.17]),
        ...(x === -6.5 ? [] : [box([x, 1.65, 3.2], [0.17, 3.3, 0.17])]),
        beam([x, 4.3, 1.5], [x, 3.3, 3.2], 0.14),
      ]),
    [],
  );
  const roof = useMemo(() => {
    const g = new THREE.PlaneGeometry(14.8, 2.3, 24, 5);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++)
      p.setY(i, 3.8 - p.getZ(i) * 0.48 - Math.sin(((p.getX(i) + 7.4) / 14.8) * Math.PI) * 0.16);
    g.translate(-6.5, 0, 2.3);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group name="canvas-cook-yard">
      <Parts parts={frame} material={m.woodDark} />
      <CanvasCloth geometry={roof} color="#c1ae86" />
      <Rope a={[-13.7, 4.3, 1.5]} b={[-15.2, 0.15, 0]} />
      <Rope a={[0.7, 4.3, 1.5]} b={[2, 0.15, -0.1]} />
      <Barrel x={-14.4} z={3.5} />
      <Barrel x={-14.6} z={4.6} />
      <Woodpile x={-14.5} z={1.5} rot={0.2} />
    </group>
  );
}

export function CampBanner({
  x,
  z,
  height = 5,
  color = "#74382d",
}: {
  x: number;
  z: number;
  height?: number;
  color?: string;
}) {
  const m = useMats();
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(1.35, 2.1, 6, 8);
    g.translate(0.65, height - 1.45, 0);
    return g;
  }, [height]);
  return (
    <group position={[x, groundHeight(x, z), z]}>
      <Parts
        parts={[
          box([0, height / 2, 0], [0.12, height, 0.12]),
          box([0.65, height - 0.4, 0], [1.6, 0.09, 0.1]),
        ]}
        material={m.woodDark}
      />
      <CanvasCloth geometry={geometry} color={color} />
      <mesh position={[0.65, height - 1.3, 0.025]} rotation-z={Math.PI / 4}>
        <boxGeometry args={[0.32, 0.32, 0.02]} />
        <meshStandardMaterial color="#c4b183" roughness={1} />
      </mesh>
    </group>
  );
}

export function MineYard() {
  const m = useMats();
  const hoist = useMemo(
    () => [
      box([19, 3, -22], [0.4, 6, 0.4]),
      box([19, 5.8, -22], [10, 0.38, 0.4]),
      beam([19, 1.5, -22], [16, 5.8, -22], 0.28),
      beam([19, 1.5, -22], [22.8, 5.8, -22], 0.28),
      beam([19, 0.2, -24], [19, 4.5, -22], 0.3),
      box([22, 1, -22], [1.4, 1.8, 1.4]),
    ],
    [],
  );
  return (
    <group name="mountain-loading-yard">
      <Parts parts={hoist} material={m.woodDark} />
      <Rope a={[14.2, 5.8, -22]} b={[14.2, 0.9, -22]} sag={0} />
      <Woodpile x={20} z={-16.5} rot={Math.PI / 2} />
      <Crate x={21} z={-13.5} s={1.2} />
      <Crate x={22.2} z={-14.2} s={0.8} />
      <Barrel x={21} z={-12} />
      <OrePile x={18} z={-15} />
      <CampBanner x={2.5} z={-22} height={4.8} />
      <TorchPost x={10.9} z={-23.3} />
    </group>
  );
}
