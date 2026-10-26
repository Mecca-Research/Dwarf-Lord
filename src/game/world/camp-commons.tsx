import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { groundHeight } from "../runtime";
import { CAMP_ADDITIONS, random } from "./landscape";
import { Parts } from "./reference-assets";
import { useMats } from "./materials";
import { CampBanner, CanvasCloth, ExpeditionTent, tentRoof } from "./camp-buildings";
import { Barrel, Bucket, Crate, Sack, Woodpile } from "./kit";

type V3 = [number, number, number];
type Part = { p: V3; s: V3; r?: V3; cylinder?: boolean };
const box = (p: V3, s: V3, r?: V3): Part => ({ p, s, r });
function beam(a: V3, b: V3, width = 0.2): Part {
  const start = new THREE.Vector3(...a),
    end = new THREE.Vector3(...b),
    delta = end.clone().sub(start);
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    delta.clone().normalize(),
  );
  const e = new THREE.Euler().setFromQuaternion(q);
  return box(
    start.add(end).multiplyScalar(0.5).toArray() as V3,
    [width, delta.length(), width],
    [e.x, e.y, e.z],
  );
}
function Cable({ points, radius = 0.025 }: { points: V3[]; radius?: number }) {
  const m = useMats();
  const key = JSON.stringify(points);
  const geometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
        32,
        radius,
        5,
        false,
      ),
    [key, radius],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={m.straw} />;
}
function Lantern({ x, y, z, light = false }: { x: number; y: number; z: number; light?: boolean }) {
  const m = useMats();
  return (
    <group position={[x, y, z]}>
      <mesh material={m.iron}>
        <boxGeometry args={[0.32, 0.48, 0.32]} />
      </mesh>
      <mesh material={m.ember}>
        <boxGeometry args={[0.25, 0.31, 0.34]} />
      </mesh>
      <mesh material={m.iron} position-y={0.29}>
        <torusGeometry args={[0.11, 0.018, 5, 10]} />
      </mesh>
      {light && (
        <pointLight
          position={[0, -0.1, 0.25]}
          color="#ffc587"
          intensity={7}
          distance={9}
          decay={2}
        />
      )}
    </group>
  );
}
function MessTable({ x }: { x: number }) {
  const m = useMats();
  const parts = useMemo(() => {
    const p: Part[] = [];
    for (let i = 0; i < 5; i++) p.push(box([-0.7 + i * 0.35, 1.04, 0], [0.33, 0.12, 3.8]));
    for (const side of [-1, 1]) {
      p.push(box([side * 1.25, 0.6, 0], [0.48, 0.13, 4.1]));
      for (const end of [-1, 1])
        p.push(
          box([side * 0.59, 0.52, end * 1.35], [0.15, 1, 0.18]),
          box([side * 1.25, 0.3, end * 1.45], [0.16, 0.6, 0.2]),
        );
    }
    for (const end of [-1, 1]) p.push(box([0, 0.55, end * 1.35], [2.9, 0.16, 0.2]));
    p.push(beam([-0.6, 0.12, -1.35], [0.6, 0.95, 1.35], 0.12));
    return p;
  }, []);
  return (
    <group position={[x, 0, 0]}>
      <Parts parts={parts} material={m.wood} />
      {[-1.1, 1.1].map((z, i) => (
        <group key={z} position={[i ? 0.35 : -0.35, 1.13, z]}>
          <mesh material={m.woodDark}>
            <cylinderGeometry args={[0.21, 0.15, 0.12, 12]} />
          </mesh>
          <mesh position-y={0.065}>
            <cylinderGeometry args={[0.17, 0.17, 0.015, 12]} />
            <meshStandardMaterial color="#796342" roughness={1} />
          </mesh>
          <mesh material={m.woodDark} position={[0.5, 0.12, 0.15]}>
            <cylinderGeometry args={[0.1, 0.1, 0.25, 10]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.23, 0]} scale={[0.5, 0.14, 0.24]} material={m.straw}>
        <sphereGeometry args={[1, 10, 6]} />
      </mesh>
    </group>
  );
}
function MessShelter() {
  const m = useMats(),
    site = CAMP_ADDITIONS.mess;
  const frame = useMemo(() => {
    const p: Part[] = [];
    for (const z of [-4.5, 0, 4.5]) {
      for (const side of [-1, 1])
        p.push(
          box([side * 9.5, 1.8, z], [0.27, 3.6, 0.27]),
          beam([side * 9.5, 3.6, z], [0, 5.1, z], 0.22),
        );
      if (z !== 0) p.push(box([0, 2.55, z], [0.23, 5.1, 0.23]));
    }
    p.push(box([0, 5.1, 0], [0.25, 0.25, 9.8]));
    for (const x of [-9.5, 9.5]) p.push(box([x, 3.6, 0], [0.23, 0.23, 9.8]));
    for (const side of [-1, 1]) p.push(beam([side * 9.5, 2.55, 3.1], [side * 9.5, 3.6, 4.5], 0.14));
    return p;
  }, []);
  const roof = useMemo(() => tentRoof(20, 5.5, 1.5), []);
  useEffect(() => () => roof.dispose(), [roof]);
  return (
    <group
      name="camp-mess-pavilion"
      userData={{ worldApproach: site.approach }}
      position={[site.x, 0, site.z]}
    >
      <Parts parts={frame} material={m.woodDark} />
      {/* The uncovered front bay keeps tables and their walking aisles visible. */}
      <group position={[0, 3.5, -1.6]}>
        <CanvasCloth geometry={roof} color="#b7a282" />
      </group>
      {[-6.2, 0, 6.2].map((x) => (
        <MessTable key={x} x={x} />
      ))}
      <Lantern x={-9.5} y={3.1} z={4.5} light />
      <Lantern x={9.5} y={3.1} z={4.5} />
      <Barrel x={-10.8} z={-3.5} />
      <Barrel x={-10.8} z={-2.3} />
      <Crate x={10.1} z={-3.7} s={0.8} />
      <Sack x={9.9} z={-2.4} />
      <Cable
        points={[
          [-9.5, 3.6, -4.5],
          [-11, 1.7, -5.5],
          [-12, 0.12, -6.5],
        ]}
      />
      <Cable
        points={[
          [9.5, 3.6, -4.5],
          [11, 1.7, -5.5],
          [12, 0.12, -6.5],
        ]}
      />
    </group>
  );
}
function CampWell() {
  const m = useMats(),
    site = CAMP_ADDITIONS.well;
  const stone = useMemo(() => {
    const p: Part[] = [];
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 16; i++) {
        const a = ((i + row * 0.5) * Math.PI) / 8;
        p.push(
          box(
            [Math.sin(a) * 1.15, 0.2 + row * 0.33, Math.cos(a) * 1.15],
            [0.47, 0.31, 0.4],
            [0, a, 0],
          ),
        );
      }
    return p;
  }, []);
  const timber = useMemo(() => {
    const p: Part[] = [];
    for (const side of [-1, 1]) {
      p.push(box([side * 1.65, 1.85, 0], [0.24, 3.7, 0.25]));
      p.push(beam([side * 2.2, 3.5, 0], [0, 4.6, 0], 0.16));
    }
    p.push(box([0, 4.6, 0], [0.17, 0.17, 3.9]));
    for (let i = 0; i < 13; i++)
      for (const side of [-1, 1])
        p.push(box([side * 1.12, 4.06, -1.95 + i * 0.32], [2.55, 0.11, 0.3], [0, 0, -side * 0.47]));
    for (const x of [2.8, 4.1]) p.push(box([x, 0.35, 1.3], [0.18, 0.7, 2.9]));
    p.push(box([3.45, 0.12, 1.3], [1.5, 0.2, 2.9]));
    for (const z of [-0.1, 2.7]) p.push(box([3.45, 0.35, z], [1.5, 0.7, 0.16]));
    return p;
  }, []);
  return (
    <group
      name="camp-stone-well"
      userData={{ worldApproach: site.approach }}
      position={[site.x, 0, site.z]}
    >
      <Parts parts={stone} material={m.stone} />
      <Parts parts={timber} material={m.woodDark} />
      <mesh position={[0, 0.18, 0]} rotation-x={-Math.PI / 2} material={m.water}>
        <circleGeometry args={[0.91, 24]} />
      </mesh>
      <mesh position={[0, 2.35, 0]} rotation-z={Math.PI / 2} material={m.wood}>
        <cylinderGeometry args={[0.18, 0.18, 3.75, 12]} />
      </mesh>
      <Cable
        points={[
          [0, 2.48, 0.18],
          [0.12, 1.62, 0.15],
          [0.1, 0.72, 0.1],
        ]}
        radius={0.035}
      />
      <mesh position={[0.1, 0.57, 0.1]} material={m.woodDark}>
        <cylinderGeometry args={[0.27, 0.22, 0.4, 12]} />
      </mesh>
      <mesh position={[2.02, 2.08, 0]} material={m.iron}>
        <boxGeometry args={[0.12, 0.65, 0.12]} />
      </mesh>
      <mesh position={[2.2, 1.78, 0]} rotation-z={Math.PI / 2} material={m.wood}>
        <cylinderGeometry args={[0.07, 0.07, 0.43, 8]} />
      </mesh>
      <mesh position={[3.45, 0.54, 1.3]} rotation-x={-Math.PI / 2} material={m.water}>
        <planeGeometry args={[1.1, 2.5]} />
      </mesh>
      <Bucket x={-2.1} z={1.5} />
      <Barrel x={-2.5} z={-1.3} />
    </group>
  );
}
function Wagon() {
  const m = useMats(),
    site = CAMP_ADDITIONS.wagon;
  const model = useMemo(() => {
    const p: Part[] = [];
    for (let i = 0; i < 12; i++) p.push(box([-1.7 + i * 0.31, 1.22, 0], [0.29, 0.15, 6.6]));
    for (const side of [-1, 1]) {
      p.push(box([0, 1, side * 2.1], [4.4, 0.23, 0.23]));
      for (let row = 0; row < 4; row++)
        p.push(box([side * 1.8, 1.5 + row * 0.25, 0], [0.14, 0.22, 6.7]));
      for (const z of [-2.9, 0, 2.9]) p.push(box([side * 1.83, 1.88, z], [0.14, 1.45, 0.18]));
    }
    p.push(
      beam([-1.5, 0.8, 3.3], [-0.8, 0.45, 6.2], 0.18),
      beam([1.5, 0.8, 3.3], [0.8, 0.45, 6.2], 0.18),
    );
    return p;
  }, []);
  const roof = useMemo(() => {
    const p: number[] = [],
      uv: number[] = [],
      index: number[] = [];
    for (let j = 0; j <= 12; j++)
      for (let i = 0; i <= 16; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 16;
        p.push(
          Math.sin(a) * 1.9,
          2.25 + Math.cos(a) * 1.7 - Math.sin((j * Math.PI) / 12) * 0.08,
          (j / 12 - 0.5) * 6.5,
        );
        uv.push(i / 16, j / 12);
        if (i < 16 && j < 12) {
          const q = j * 17 + i;
          index.push(q, q + 17, q + 1, q + 1, q + 17, q + 18);
        }
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(index);
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => roof.dispose(), [roof]);
  const hoops = useMemo(
    () =>
      [-2.9, 0, 2.9].map((z) =>
        Array.from({ length: 17 }, (_, i) => {
          const a = -Math.PI / 2 + (i * Math.PI) / 16;
          return [Math.sin(a) * 1.94, 2.25 + Math.cos(a) * 1.74, z] as V3;
        }),
      ),
    [],
  );
  const spokes = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) =>
        box([0, 0, 0], [0.1, 1.7, 0.12], [(i * Math.PI) / 8, 0, 0]),
      ),
    [],
  );
  return (
    <group
      name="covered-supply-wagon"
      userData={{ worldApproach: site.approach }}
      position={[site.x, 0, site.z]}
    >
      <Parts parts={model} material={m.wood} />
      <CanvasCloth geometry={roof} color="#b7b4a0" />
      {hoops.map((points, i) => (
        <Cable key={i} points={points} radius={0.035} />
      ))}
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((end) => (
          <group key={`${side}:${end}`} position={[side * 2.1, 0.95, end * 2.1]}>
            <mesh rotation-y={Math.PI / 2} material={m.woodDark}>
              <torusGeometry args={[0.85, 0.11, 6, 16]} />
            </mesh>
            <mesh rotation-y={Math.PI / 2} material={m.iron}>
              <torusGeometry args={[0.92, 0.04, 5, 16]} />
            </mesh>
            <Parts parts={spokes} material={m.woodDark} />
            <mesh rotation-z={Math.PI / 2} material={m.iron}>
              <cylinderGeometry args={[0.18, 0.18, 0.35, 10]} />
            </mesh>
          </group>
        )),
      )}
      <group position={[0, 1.3, 0]}>
        <Crate x={-0.7} z={-2} s={0.8} />
        <Crate x={0.5} z={-1.8} s={0.7} />
        <Sack x={-0.4} z={1.8} />
      </group>
      <Barrel x={-3} z={-2.5} />
      <Crate x={-3.2} z={-1.2} s={0.75} />
    </group>
  );
}
function Stockyard() {
  const m = useMats(),
    site = CAMP_ADDITIONS.timber;
  const rack = useMemo(() => {
    const p: Part[] = [];
    for (const x of [-3, 3]) for (const z of [-2.5, 2.5]) p.push(box([x, 1.7, z], [0.2, 3.4, 0.2]));
    for (const x of [-3, 3])
      p.push(box([x, 0.75, 0], [0.2, 0.2, 5.6]), beam([x, 1.8, -2.5], [x, 3.3, 2.5], 0.16));
    for (const z of [-2.5, 2.5]) p.push(box([0, 0.8, z], [6.5, 0.18, 0.2]));
    return p;
  }, []);
  const blocks = useMemo(() => {
    const p: Part[] = [];
    for (let row = 0; row < 3; row++)
      for (let x = 0; x < 4 - row; x++)
        for (let z = 0; z < 3; z++)
          p.push(
            box(
              [-1.7 + x * 0.85 + row * 0.3, 0.22 + row * 0.48, -8 + z * 0.9],
              [0.8, 0.43, 0.84],
              [0, random(x + z * 11 + row) * 0.06, 0],
            ),
          );
    return p;
  }, []);
  return (
    <group
      name="timber-and-stone-stockyard"
      userData={{ worldApproach: site.approach }}
      position={[site.x, 0, site.z]}
    >
      <Parts parts={rack} material={m.woodDark} />
      <Parts parts={blocks} material={m.stone} />
      <group position-y={0.8}>
        <Woodpile x={0} z={-0.6} rot={Math.PI / 2} />
        <Woodpile x={0} z={1.1} rot={Math.PI / 2} />
      </group>
      <Crate x={-2.7} z={4} s={1.0} />
      <Crate x={-1.5} z={4.4} s={0.75} />
      <Sack x={-2.2} z={5.2} />
      <Barrel x={3} z={-3.5} />
    </group>
  );
}
function CampBoundary() {
  const m = useMats();
  const parts = useMemo(() => {
    const p: Part[] = [];
    const post = (x: number, z: number) => {
      const y = groundHeight(x, z);
      p.push(box([x, y + 1.1, z], [0.2, 2.2, 0.21], [0, 0, (random(x + z) - 0.5) * 0.045]));
    };
    for (let z = -21; z <= 38; z += 3) post(35.8, z);
    for (let z = -19.5; z < 37; z += 3)
      for (const y of [0.65, 1.45])
        p.push(box([35.8, groundHeight(35.8, z) + y, z], [0.13, 0.13, 3.2]));
    for (let x = -22; x < 36; x += 3) {
      if (x > 3 && x < 13) continue;
      post(x, 39.8);
      for (const y of [0.65, 1.45])
        p.push(box([x + 1.3, groundHeight(x, 39.8) + y, 39.8], [2.8, 0.13, 0.13]));
    }
    for (const x of [3.6, 12.4])
      p.push(
        box([x, 2.25, 38.8], [0.36, 4.5, 0.36]),
        beam([x, 3.2, 38.8], [x + (x < 8 ? 1 : -1), 4.5, 38.8], 0.18),
      );
    p.push(box([8, 4.6, 38.8], [9.8, 0.32, 0.35]));
    return p;
  }, []);
  return (
    <group name="camp-road-entrance-and-fence">
      <Parts parts={parts} material={m.woodDark} />
      <CampBanner x={2.5} z={38.2} height={4.8} color="#6b4939" />
      <Lantern x={12.4} y={3.65} z={38.95} />
    </group>
  );
}
function Laundry() {
  const m = useMats();
  const cloth = useMemo(() => new THREE.PlaneGeometry(1.25, 1.6, 5, 5), []);
  useEffect(() => () => cloth.dispose(), [cloth]);
  return (
    <group name="camp-wash-line" position={[-21, 0, 27]}>
      <Parts
        parts={[box([0, 1.65, -5.5], [0.14, 3.3, 0.14]), box([0, 1.65, 5.5], [0.14, 3.3, 0.14])]}
        material={m.woodDark}
      />
      <Cable
        points={[
          [0, 3.15, -5.5],
          [0, 2.85, 0],
          [0, 3.15, 5.5],
        ]}
      />
      {[-3, -1, 1, 3].map((z, i) => (
        <group key={z} position={[0, 2.05, z]} rotation-y={Math.PI / 2}>
          <CanvasCloth geometry={cloth} color={i % 2 ? "#817b68" : "#aca48b"} />
        </group>
      ))}
      <Bucket x={1} z={4} />
      <Barrel x={1.2} z={-4.5} />
    </group>
  );
}
export function CampCommons() {
  const m = useMats();
  return (
    <group name="camp-commons-district">
      <MessShelter />
      <CampWell />
      <Wagon />
      <Stockyard />
      <CampBoundary />
      <Laundry />
      <ExpeditionTent
        x={CAMP_ADDITIONS.tentWest.x}
        approach={CAMP_ADDITIONS.tentWest.approach}
        z={CAMP_ADDITIONS.tentWest.z}
        width={5}
        length={6.2}
        height={3.8}
        rot={-0.12}
        color="#a99f85"
      />
      <ExpeditionTent
        x={CAMP_ADDITIONS.tentSouth.x}
        approach={CAMP_ADDITIONS.tentSouth.approach}
        z={CAMP_ADDITIONS.tentSouth.z}
        width={4.5}
        length={5.8}
        height={3.6}
        rot={0.1}
        color="#969985"
      />
      <group name="commons-brazier" position={[23, 0, 32]}>
        <mesh position-y={0.7} material={m.iron}>
          <cylinderGeometry args={[0.58, 0.28, 0.55, 10]} />
        </mesh>
        <mesh position-y={0.93} material={m.ember}>
          <circleGeometry args={[0.5, 10]} />
        </mesh>
        <sprite position={[0, 1.4, 0]} scale={[1.2, 1.6, 1]}>
          <spriteMaterial map={m.flame} transparent depthWrite={false} alphaTest={0.05} />
        </sprite>
        <pointLight position={[0, 1.6, 0]} color="#ffad60" intensity={9} distance={10} decay={2} />
        <Woodpile x={2} z={1} rot={0.4} />
      </group>
    </group>
  );
}
