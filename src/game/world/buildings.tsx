import { TimberHall, RidgeTent } from "./reference-assets";
import { groundHeight } from "../runtime";
import {
  Anvil,
  Barrel,
  Crate,
  Kettle,
  OrePile,
  PlankDebris,
  Rail,
  Rubble,
  Sack,
  Table,
  Wheel,
  Woodpile,
} from "./kit";
import { useMats } from "./materials";
import { Campfire, ChimneySmoke, FlameSprite } from "./fx";

export const Dorm = TimberHall;

export function Forge({
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
  const hot = condition > 0.4;
  return (
    <group position={[x, 0, z]} rotation-y={rot}>
      <mesh position={[0, 0.22, 0]} material={m.stone} receiveShadow>
        <boxGeometry args={[4.4, 0.44, 3.6]} />
      </mesh>
      {/* Three walls, open front */}
      <mesh position={[0, 1.4, -1.7]} material={m.stone} castShadow receiveShadow>
        <boxGeometry args={[4.4, 2.2, 0.28]} />
      </mesh>
      <mesh position={[-2.1, 1.4, 0]} material={m.stone} castShadow receiveShadow>
        <boxGeometry args={[0.28, 2.2, 3.5]} />
      </mesh>
      <mesh position={[2.1, 1.4, 0]} material={m.stone} castShadow receiveShadow>
        <boxGeometry args={[0.28, 2.2, 3.5]} />
      </mesh>
      {/* Arch lintel */}
      <mesh position={[0, 2.45, 1.65]} material={m.stoneDark} castShadow>
        <boxGeometry args={[4.4, 0.35, 0.28]} />
      </mesh>
      {/* Interior floor */}
      <mesh position={[0, 0.46, 0]} material={m.stoneDark} receiveShadow>
        <boxGeometry args={[3.9, 0.08, 3.1]} />
      </mesh>
      {/* Hearth */}
      <mesh position={[0, 0.7, -0.9]} material={m.stoneDark} castShadow>
        <boxGeometry args={[1.6, 0.5, 1.1]} />
      </mesh>
      <mesh position={[0, 0.95, -0.9]} material={hot ? m.ember : m.iron}>
        <boxGeometry args={[1.1, 0.18, 0.7]} />
      </mesh>
      {hot ? (
        <>
          <FlameSprite x={0} y={1.25} z={-0.9} scale={0.85} />
          <pointLight
            position={[0, 1.4, -0.6]}
            color="#ff7a32"
            intensity={14}
            distance={11}
            decay={2}
          />
        </>
      ) : (
        <pointLight
          position={[0.2, 1.3, 0.2]}
          color="#e07a3d"
          intensity={2.4}
          distance={8}
          decay={2}
        />
      )}
      {/* Chimney */}
      <mesh position={[1.15, 3.15, -1.15]} material={m.stoneDark} castShadow>
        <boxGeometry args={[0.7, 1.8, 0.7]} />
      </mesh>
      <mesh position={[1.15, 4.1, -1.15]} material={m.stone} castShadow>
        <boxGeometry args={[0.82, 0.18, 0.82]} />
      </mesh>
      {hot ? <ChimneySmoke x={1.15} y={4.3} z={-1.15} /> : null}
      {/* Roof slabs */}
      <mesh position={[0, 2.85, -0.15]} rotation={[0.42, 0, 0]} material={m.roof} castShadow>
        <boxGeometry args={[4.7, 0.14, 2.2]} />
      </mesh>
      <mesh position={[0, 2.85, 0.55]} rotation={[-0.28, 0, 0]} material={m.roof} castShadow>
        <boxGeometry args={[4.7, 0.14, 1.6]} />
      </mesh>
      <Anvil x={0.55} z={0.55} />
      {/* Bellows */}
      <mesh position={[-1.1, 0.85, 0.3]} rotation-y={0.4} material={m.leather} castShadow>
        <boxGeometry args={[0.7, 0.35, 0.5]} />
      </mesh>
      <mesh position={[-1.1, 0.7, 0.3]} material={m.woodDark} castShadow>
        <boxGeometry args={[0.55, 0.12, 0.4]} />
      </mesh>
      {/* Tool rack */}
      <mesh position={[-1.7, 1.5, -1.3]} material={m.woodDark}>
        <boxGeometry args={[0.08, 1.1, 0.08]} />
      </mesh>
      <mesh position={[-1.35, 1.85, -1.3]} rotation-z={-0.4} material={m.iron} castShadow>
        <boxGeometry args={[0.05, 0.7, 0.05]} />
      </mesh>
      <Woodpile x={1.6} z={1.7} rot={-0.3} />
    </group>
  );
}

export function Office({ x, z, rot }: { x: number; z: number; rot: number }) {
  const m = useMats();
  return (
    <group position={[x, 0, z]} rotation-y={rot}>
      <mesh position={[0, 0.22, 0]} material={m.stone} receiveShadow>
        <boxGeometry args={[3.6, 0.44, 3.4]} />
      </mesh>
      {/* Walls */}
      <mesh position={[0, 1.35, -1.62]} material={m.stone} castShadow receiveShadow>
        <boxGeometry args={[3.6, 1.9, 0.22]} />
      </mesh>
      <mesh position={[-1.7, 1.35, 0]} material={m.stone} castShadow receiveShadow>
        <boxGeometry args={[0.22, 1.9, 3.3]} />
      </mesh>
      <mesh position={[1.7, 1.35, 0]} material={m.stone} castShadow receiveShadow>
        <boxGeometry args={[0.22, 1.9, 3.3]} />
      </mesh>
      {/* Front with door */}
      <mesh position={[-1.05, 1.35, 1.62]} material={m.stone} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.9, 0.22]} />
      </mesh>
      <mesh position={[1.15, 1.35, 1.62]} material={m.stone} castShadow receiveShadow>
        <boxGeometry args={[1.1, 1.9, 0.22]} />
      </mesh>
      <mesh position={[0.15, 2.15, 1.62]} material={m.stoneDark} castShadow>
        <boxGeometry args={[1.1, 0.35, 0.22]} />
      </mesh>
      <mesh position={[0.12, 1.2, 1.74]} material={m.woodDark} castShadow>
        <boxGeometry args={[0.85, 1.55, 0.08]} />
      </mesh>
      {/* Warm window */}
      <mesh position={[-1.72, 1.55, 0.35]} material={m.ember}>
        <boxGeometry args={[0.08, 0.55, 0.7]} />
      </mesh>
      <pointLight
        position={[-1.2, 1.5, 0.35]}
        color="#ffb060"
        intensity={5}
        distance={6}
        decay={2}
      />
      <mesh position={[1.72, 1.55, -0.2]} material={m.black}>
        <boxGeometry args={[0.08, 0.5, 0.55]} />
      </mesh>
      {/* Hip roof */}
      <mesh position={[0, 2.55, 0]} material={m.woodDark} castShadow>
        <boxGeometry args={[3.9, 0.14, 3.7]} />
      </mesh>
      <mesh position={[0, 3.15, 0]} rotation={[0.62, 0, 0]} material={m.roof} castShadow>
        <boxGeometry args={[3.95, 0.12, 2.15]} />
      </mesh>
      <mesh position={[0, 3.15, 0]} rotation={[-0.62, 0, 0]} material={m.roof} castShadow>
        <boxGeometry args={[3.95, 0.12, 2.15]} />
      </mesh>
      <mesh position={[0, 3.45, 0]} material={m.roof} castShadow>
        <boxGeometry args={[1.2, 0.12, 0.5]} />
      </mesh>
      {/* Chimney */}
      <mesh position={[1.15, 3.5, -0.9]} material={m.stoneDark} castShadow>
        <boxGeometry args={[0.45, 1.1, 0.45]} />
      </mesh>
      <ChimneySmoke x={1.15} y={4.15} z={-0.9} thin />
      {/* Steps */}
      <mesh position={[0.15, 0.18, 2.05]} material={m.stone} castShadow>
        <boxGeometry args={[1.2, 0.16, 0.45]} />
      </mesh>
      <mesh position={[0.15, 0.32, 1.85]} material={m.stone} castShadow>
        <boxGeometry args={[1.1, 0.14, 0.35]} />
      </mesh>
      <Table x={2.15} z={2.35} rot={-0.3} />
    </group>
  );
}

export function StorageShed({
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
  const lean = condition > 0.4 ? 0 : 0.18;
  return (
    <group position={[x, 0, z]} rotation-y={rot}>
      <group rotation-z={lean}>
        <mesh position={[0, 0.18, 0]} material={m.woodDark} receiveShadow>
          <boxGeometry args={[5.2, 0.2, 3.6]} />
        </mesh>
        <mesh position={[-2.5, 1.3, 0]} material={m.wood} castShadow>
          <boxGeometry args={[0.18, 2.4, 3.6]} />
        </mesh>
        <mesh position={[0, 1.3, -1.72]} material={m.woodDark} castShadow>
          <boxGeometry args={[5.2, 2.4, 0.18]} />
        </mesh>
        <mesh position={[2.5, 1.1, 0]} material={m.wood} castShadow>
          <boxGeometry args={[0.18, 2.0, 3.6]} />
        </mesh>
        <mesh position={[0, 2.55, 0]} rotation-z={-0.12} material={m.roof} castShadow>
          <boxGeometry args={[5.6, 0.12, 3.9]} />
        </mesh>
        {/* Posts */}
        {([-2.4, 2.4] as const).map((px) => (
          <mesh key={px} position={[px, 1.2, 1.7]} material={m.woodDark} castShadow>
            <boxGeometry args={[0.16, 2.4, 0.16]} />
          </mesh>
        ))}
      </group>
      <Barrel x={-1.2} z={1.9} />
      <Barrel x={-0.5} z={2.15} />
      <Sack x={0.6} z={2.0} rot={0.4} />
      <Sack x={1.0} z={1.6} rot={-0.3} />
      <OrePile x={1.7} z={1.5} />
      <Crate x={-1.8} z={2.3} s={0.8} />
      {condition < 0.4 ? <PlankDebris x={2.4} z={1.2} rot={-0.5} len={2.8} /> : null}
    </group>
  );
}

export const CanvasTent = RidgeTent;

export function Kitchen({ x, z }: { x: number; z: number }) {
  const m = useMats();
  const y = groundHeight(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2} material={m.stoneDark}>
        <circleGeometry args={[1.15, 16]} />
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.82, 0.18, Math.sin(a) * 0.82]}
            rotation-y={a}
            material={i % 2 ? m.stone : m.stoneDark}
            castShadow
          >
            <boxGeometry args={[0.34, 0.24, 0.22]} />
          </mesh>
        );
      })}
      {[-1, 0, 1].map((i) => (
        <mesh
          key={`log-${i}`}
          position={[i * 0.21, 0.22, 0.03]}
          rotation={[Math.PI / 2, 0, i * 0.5]}
          material={m.bark}
          castShadow
        >
          <cylinderGeometry args={[0.11, 0.14, 1.15, 10]} />
        </mesh>
      ))}
      <Campfire x={0} y={0.3} z={0} />
      <Kettle x={1.1} z={-0.7} y={0.15} />
      <mesh
        position={[1.45, 0.2, 0.45]}
        rotation-z={Math.PI / 2}
        rotation-y={0.35}
        material={m.bark}
        castShadow
      >
        <cylinderGeometry args={[0.18, 0.2, 1.45, 8]} />
      </mesh>
      <mesh
        position={[-1.2, 0.18, 0.9]}
        rotation-z={Math.PI / 2}
        rotation-y={-0.55}
        material={m.bark}
        castShadow
      >
        <cylinderGeometry args={[0.16, 0.18, 1.2, 8]} />
      </mesh>
      <pointLight position={[0, 1.35, 0]} color="#ff8a3a" intensity={16} distance={14} decay={2} />
      <pointLight position={[0, 0.7, 0]} color="#ff6a20" intensity={8} distance={6} decay={2} />
    </group>
  );
}

export function MineCart({
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
  const y = groundHeight(x, z);
  const broken = condition < 0.5;
  return (
    <group position={[x, y, z]} rotation-y={rot}>
      <group rotation-z={broken ? 0.55 : 0} position={broken ? [0.2, 0.15, 0] : [0, 0, 0]}>
        <mesh position={[0, 0.55, 0]} material={m.wood} castShadow>
          <boxGeometry args={[1.7, 0.12, 1.05]} />
        </mesh>
        <mesh position={[0, 0.85, 0.48]} material={m.woodDark} castShadow>
          <boxGeometry args={[1.7, 0.55, 0.1]} />
        </mesh>
        <mesh position={[0, 0.85, -0.48]} material={m.woodDark} castShadow>
          <boxGeometry args={[1.7, 0.55, 0.1]} />
        </mesh>
        <mesh position={[-0.8, 0.85, 0]} material={m.wood} castShadow>
          <boxGeometry args={[0.1, 0.55, 1.05]} />
        </mesh>
        <mesh position={[0.8, 0.85, 0]} material={m.wood} castShadow>
          <boxGeometry args={[0.1, 0.55, 1.05]} />
        </mesh>
        <mesh position={[0, 0.62, 0]} material={m.lime}>
          <boxGeometry args={[1.4, 0.2, 0.8]} />
        </mesh>
      </group>
      <Wheel x={0.55} y={broken ? 0.22 : 0.32} z={0.58} />
      <Wheel x={-0.55} y={0.32} z={0.58} />
      <Wheel x={0.55} y={0.32} z={-0.58} />
      {broken ? (
        <Wheel x={1.35} y={0.32} z={-0.9} rot={0.8} />
      ) : (
        <Wheel x={-0.55} y={0.32} z={-0.58} />
      )}
      <Rail x={0} z={-1.6} len={3.2} rot={0} />
    </group>
  );
}

export function FloodedShaft({ x, z }: { x: number; z: number }) {
  const m = useMats();
  const y = groundHeight(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 0]} material={m.stoneDark}>
        <ringGeometry args={[1.15, 2.25, 20]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.08, 0]} material={m.water}>
        <circleGeometry args={[1.2, 20]} />
      </mesh>
      {/* Broken collar timbers */}
      <mesh position={[-1.35, 0.55, 0.5]} rotation-z={0.35} material={m.woodDark} castShadow>
        <boxGeometry args={[0.18, 1.5, 0.18]} />
      </mesh>
      <mesh position={[1.2, 0.35, -0.4]} rotation-z={-0.9} material={m.woodDark} castShadow>
        <boxGeometry args={[0.18, 1.3, 0.16]} />
      </mesh>
      <mesh
        position={[0.2, 0.15, 1.4]}
        rotation-x={0.4}
        rotation-y={0.3}
        material={m.wood}
        castShadow
      >
        <boxGeometry args={[1.8, 0.14, 0.18]} />
      </mesh>
      <Rubble x={1.6} z={1.1} n={5} />
    </group>
  );
}

export function MineAdit({ x, z }: { x: number; z: number }) {
  const m = useMats();
  return (
    <group position={[x, 0, z]}>
      {/* Irregular cliff instead of a single slab */}
      <mesh
        position={[-2.2, 3.2, -1.4]}
        scale={[3.4, 2.8, 2.2]}
        rotation={[0.15, 0.4, -0.1]}
        material={m.rock}
        castShadow
        receiveShadow
      >
        <icosahedronGeometry args={[2.2, 1]} />
      </mesh>
      <mesh
        position={[2.6, 3.0, -1.6]}
        scale={[3.2, 2.6, 2.4]}
        rotation={[0.1, -0.5, 0.08]}
        material={m.rock}
        castShadow
        receiveShadow
      >
        <icosahedronGeometry args={[2.3, 1]} />
      </mesh>
      <mesh
        position={[0.2, 5.2, -2.2]}
        scale={[4.2, 2.2, 2.6]}
        rotation={[0.2, 0.2, 0]}
        material={m.rock}
        castShadow
      >
        <icosahedronGeometry args={[2.4, 1]} />
      </mesh>
      <mesh
        position={[-5.4, 4.2, -1.2]}
        rotation-y={0.4}
        scale={[2.2, 2.8, 1.8]}
        material={m.rock}
        castShadow
      >
        <icosahedronGeometry args={[2.1, 1]} />
      </mesh>
      <mesh
        position={[5.6, 3.8, -1]}
        rotation-y={-0.35}
        scale={[2.4, 2.6, 1.7]}
        material={m.rock}
        castShadow
      >
        <icosahedronGeometry args={[2.0, 1]} />
      </mesh>
      {/* Tunnel mouth */}
      <mesh position={[0, 1.7, 0.15]} material={m.black}>
        <boxGeometry args={[3.4, 3.5, 2.8]} />
      </mesh>
      {/* Timber portal */}
      <mesh position={[-1.85, 1.8, 0.55]} material={m.woodDark} castShadow>
        <boxGeometry args={[0.32, 3.6, 0.32]} />
      </mesh>
      <mesh position={[1.85, 1.8, 0.55]} material={m.woodDark} castShadow>
        <boxGeometry args={[0.32, 3.6, 0.32]} />
      </mesh>
      <mesh position={[0, 3.55, 0.55]} material={m.wood} castShadow>
        <boxGeometry args={[4.1, 0.32, 0.36]} />
      </mesh>
      {/* Diagonal braces */}
      <mesh position={[-1.1, 3.05, 0.55]} rotation-z={0.7} material={m.woodDark} castShadow>
        <boxGeometry args={[1.4, 0.16, 0.16]} />
      </mesh>
      <mesh position={[1.1, 3.05, 0.55]} rotation-z={-0.7} material={m.woodDark} castShadow>
        <boxGeometry args={[1.4, 0.16, 0.16]} />
      </mesh>
      {/* Lanterns */}
      <mesh position={[-1.7, 2.7, 0.8]} material={m.iron}>
        <boxGeometry args={[0.12, 0.2, 0.12]} />
      </mesh>
      <mesh position={[-1.7, 2.55, 0.8]} material={m.ember}>
        <sphereGeometry args={[0.07, 6, 6]} />
      </mesh>
      <pointLight
        position={[-1.6, 2.55, 0.9]}
        color="#ffb060"
        intensity={5}
        distance={8}
        decay={2}
      />
      <mesh position={[1.7, 2.7, 0.8]} material={m.iron}>
        <boxGeometry args={[0.12, 0.2, 0.12]} />
      </mesh>
      <pointLight
        position={[1.6, 2.55, 0.9]}
        color="#ffb060"
        intensity={4}
        distance={7}
        decay={2}
      />

      <Rail x={0} z={-1.2} len={5} />

      {Array.from({ length: 8 }).map((_, i) => {
        const tz = -4.2 - i * 4.4;
        return (
          <group key={i} position={[0, 0, tz]}>
            <mesh position={[-1.7, 1.6, 0]} material={m.woodDark}>
              <boxGeometry args={[0.22, 3.2, 0.22]} />
            </mesh>
            <mesh position={[1.7, 1.6, 0]} material={m.woodDark}>
              <boxGeometry args={[0.22, 3.2, 0.22]} />
            </mesh>
            <mesh position={[0, 3.2, 0]} material={m.wood}>
              <boxGeometry args={[3.7, 0.22, 0.22]} />
            </mesh>
            {i % 2 === 0 ? (
              <mesh position={[1.45, 0.45, -1]} material={m.lime} castShadow>
                <boxGeometry args={[0.55, 0.7, 0.8]} />
              </mesh>
            ) : (
              <mesh position={[-1.35, 0.4, -0.8]} material={m.iron} castShadow>
                <boxGeometry args={[0.5, 0.4, 0.55]} />
              </mesh>
            )}
            {i % 3 === 0 ? (
              <pointLight
                position={[0, 2.4, 0]}
                color="#d4894a"
                intensity={1.6}
                distance={5}
                decay={2}
              />
            ) : null}
          </group>
        );
      })}
      {/* Tunnel ceiling / walls */}
      <mesh position={[0, 3.5, -22]} material={m.rock}>
        <boxGeometry args={[6.2, 0.8, 36]} />
      </mesh>
      <mesh position={[-2.4, 1.6, -22]} material={m.rock}>
        <boxGeometry args={[0.8, 3.6, 36]} />
      </mesh>
      <mesh position={[2.4, 1.6, -22]} material={m.rock}>
        <boxGeometry args={[0.8, 3.6, 36]} />
      </mesh>
    </group>
  );
}
