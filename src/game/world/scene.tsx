import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { JOBS, WORLD_STAGES } from "../data/catalog";
import type { Dwarf } from "../types";
import {
  camBasis,
  facingFromMove,
  groundHeight,
  resolveMove,
  runtime,
  setPlayerDest,
  zoneAt,
} from "../runtime";
import { useGame } from "../store";
import { DwarfSprite, SpriteBankProvider } from "./sprites";
import { Environment } from "./environment";
import { WorldMatsProvider } from "./materials";

const _look = new THREE.Vector3();
const _cam = new THREE.Vector3();
const _hit = new THREE.Vector3();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function bindKeys() {
  const down = (e: KeyboardEvent) => {
    runtime.keys.add(e.code);
    if (
      [
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Space",
      ].includes(e.code)
    ) {
      e.preventDefault();
    }
  };
  const up = (e: KeyboardEvent) => runtime.keys.delete(e.code);
  const blur = () => runtime.keys.clear();
  window.addEventListener("keydown", down, { passive: false });
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
  };
}

function IsoCamera() {
  const { camera } = useThree();
  const stage = useGame((s) => s.settlement);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1);
    const p = runtime.player;
    const keys = runtime.keys;
    if (keys.has("KeyQ")) runtime.cameraAzimuth += 0.7 * d;
    if (keys.has("KeyR")) runtime.cameraAzimuth -= 0.7 * d;

    const zone = zoneAt(p.x, p.z);
    runtime.zone = zone;
    const spec = WORLD_STAGES.find((w) => w.id === stage) ?? WORLD_STAGES[0];
    const targetZoom =
      (zone === "mine" ? spec.cameraZoom * 0.72 : spec.cameraZoom) + runtime.zoomBias;
    runtime.zoom += (targetZoom - runtime.zoom) * (1 - Math.exp(-d * 3));

    const dist = 38;
    const az = runtime.cameraAzimuth;
    const el = runtime.cameraElev;
    _cam.set(
      p.x + dist * Math.sin(az) * Math.cos(el),
      dist * Math.sin(el) + 5,
      p.z + dist * Math.cos(az) * Math.cos(el),
    );
    camera.position.lerp(_cam, 1 - Math.exp(-d * 4));
    _look.set(p.x, 1.15, p.z);
    camera.lookAt(_look);
    const cam = camera as THREE.OrthographicCamera;
    cam.zoom = runtime.zoom;
    cam.near = 0.1;
    cam.far = 280;
    cam.updateProjectionMatrix();
  });
  return null;
}

function Systems() {
  const dwarves = useGame((s) => s.dwarves);
  const dialogue = useGame((s) => s.dialogue);
  const joy = useGame((s) => s.mobileJoy);
  const talk = useGame((s) => s.talk);
  const inspect = useGame((s) => s.inspect);
  const setSelected = useGame((s) => s.setSelected);
  const setPrompt = useGame((s) => s.setPrompt);
  const discover = useGame((s) => s.discover);
  const buildings = useGame((s) => s.buildings);
  const playing = useGame((s) => s.playing);
  const expedition = useGame((s) => s.expedition);
  const acc = useRef(0);
  const promptAcc = useRef(0);

  useEffect(() => bindKeys(), []);

  useEffect(() => {
    const probe = {
      getYaw: () => runtime.player.yaw,
      getFacing: () => runtime.player.facing,
      getSpeed: () => runtime.player.speed,
      getPos: () => ({ x: runtime.player.x, z: runtime.player.z, zone: runtime.zone }),
      setKeys: (codes: string[]) => {
        runtime.keys.clear();
        for (const c of codes) runtime.keys.add(c);
      },
      setDest: (x: number, z: number) => setPlayerDest(x, z),
      teleport: (x: number, z: number) => {
        runtime.player.x = x;
        runtime.player.z = z;
        runtime.player.dest = null;
        runtime.player.speed = 0;
        runtime.player.anim = "idle";
      },
      setZoomBias: (z: number) => {
        runtime.zoomBias = z;
      },
    };
    window.__controlsTest = probe;
    return () => {
      if (window.__controlsTest === probe) delete window.__controlsTest;
    };
  }, []);

  useFrame((state, dt) => {
    if (!playing || dialogue) {
      runtime.player.speed = 0;
      return;
    }
    const d = Math.min(dt, 0.1);
    acc.current += d;
    while (acc.current >= 1 / 60) {
      step(1 / 60);
      acc.current -= 1 / 60;
    }

    promptAcc.current += d;
    if (promptAcc.current > 0.12) {
      promptAcc.current = 0;
      const p = runtime.player;
      let best = 9;
      let id: string | null = null;
      let kind: "dwarf" | "building" | null = null;
      for (const dw of dwarves) {
        const b = runtime.dwarves.get(dw.id);
        if (!b) continue;
        const dist = Math.hypot(p.x - b.x, p.z - b.z);
        if (dist < best && dist < 3.6) {
          best = dist;
          id = dw.id;
          kind = "dwarf";
        }
      }
      for (const bld of buildings) {
        const dist = Math.hypot(p.x - bld.x, p.z - bld.z);
        if (dist < best && dist < 3.2) {
          best = dist;
          id = bld.id;
          kind = "building";
        }
      }
      runtime.interactId = id;
      runtime.interactKind = kind;
      let nextPrompt = useGame.getState().prompt;
      if (kind === "dwarf") {
        const dw = dwarves.find((x) => x.id === id);
        nextPrompt = `${dw?.name ?? "Dwarf"} — ${dw?.title ?? ""}. Press E or tap Interact.`;
      } else if (kind === "building") {
        const bld = buildings.find((x) => x.id === id);
        nextPrompt = `${bld?.name ?? "Ruin"}. Press E to inspect.`;
      } else if (runtime.zone === "mine") {
        nextPrompt = "The shallow mine. Timber, limestone, a rumor of iron.";
      } else if (runtime.zone === "road") {
        nextPrompt = "The outer road. This is how you arrived.";
      } else if (runtime.zone === "forest") {
        nextPrompt = "Forest edge. Timber, if anyone will cut it.";
      } else if (runtime.zone === "camp") {
        nextPrompt = "The camp. This is the company.";
        if (!useGame.getState().discoveries.camp) discover("camp");
      }
      if (nextPrompt !== useGame.getState().prompt) setPrompt(nextPrompt);
    }

    if (runtime.keys.has("KeyE") || runtime.keys.has("Enter")) {
      runtime.keys.delete("KeyE");
      runtime.keys.delete("Enter");
      interact();
    }
    void state;
  });

  function interact() {
    const id = runtime.interactId;
    const kind = runtime.interactKind;
    if (!id || !kind) return;
    if (kind === "dwarf") {
      const dw = useGame.getState().dwarves.find((x) => x.id === id);
      if (!dw) return;
      setSelected(dw.id);
      talk(dw.talkKey, dw.id);
    } else {
      inspect(id);
    }
  }

  function step(dt: number) {
    const p = runtime.player;
    const { forwardX, forwardZ, rightX, rightZ } = camBasis(runtime.cameraAzimuth);
    let mx = 0;
    let mz = 0;
    const keys = runtime.keys;
    if (keys.has("KeyW") || keys.has("ArrowUp")) {
      mx += forwardX;
      mz += forwardZ;
    }
    if (keys.has("KeyS") || keys.has("ArrowDown")) {
      mx -= forwardX;
      mz -= forwardZ;
    }
    if (keys.has("KeyD") || keys.has("ArrowRight")) {
      mx += rightX;
      mz += rightZ;
    }
    if (keys.has("KeyA") || keys.has("ArrowLeft")) {
      mx -= rightX;
      mz -= rightZ;
    }
    mx += joy.x * rightX + joy.y * forwardX;
    mz += joy.x * rightZ + joy.y * forwardZ;

    const usingStick = Math.hypot(mx, mz) > 0.12;
    if (usingStick) p.dest = null;

    if (!usingStick && p.dest) {
      const dx = p.dest.x - p.x;
      const dz = p.dest.z - p.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.35) p.dest = null;
      else {
        mx = dx / dist;
        mz = dz / dist;
      }
    }

    const mag = Math.hypot(mx, mz);
    if (mag > 0.05) {
      mx /= mag;
      mz /= mag;
      p.yaw = Math.atan2(-mx, -mz);
      const nextFace = facingFromMove(mx, mz, runtime.cameraAzimuth);
      if (nextFace >= 0 && nextFace !== p.facing) {
        const curAng = ((4 - p.facing) * Math.PI) / 4;
        const { forwardX, forwardZ, rightX, rightZ } = camBasis(runtime.cameraAzimuth);
        const sx = mx * rightX + mz * rightZ;
        const sy = mx * forwardX + mz * forwardZ;
        const ang = Math.atan2(sx, sy);
        let diff = ang - curAng;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) > 0.52) p.facing = nextFace;
      } else if (nextFace >= 0) {
        p.facing = nextFace;
      }
      p.bob += dt * 5.2;
      const speed = 2.7;
      p.speed = speed;
      const moved = resolveMove(p.x, p.z, mx * speed * dt, mz * speed * dt, 0.5);
      p.x = moved.x;
      p.z = moved.z;
      p.anim = "walk";
    } else {
      p.speed = 0;
      p.anim = "idle";
      const idleFace = facingFromMove(-Math.sin(p.yaw), -Math.cos(p.yaw), runtime.cameraAzimuth);
      if (idleFace >= 0) p.facing = idleFace;
    }

    for (const dw of dwarves) {
      const b = runtime.dwarves.get(dw.id);
      if (!b) continue;
      if (dw.isSteward) {
        b.anim = "sit";
        b.speed = 0;
        continue;
      }
      if (expedition?.status === "out" && expedition.dwarfIds.includes(dw.id)) {
        b.dest = { x: 8, z: -42 };
      }
      if (dw.assignedJobId && !b.dest) {
        const job = JOBS.find((j) => j.id === dw.assignedJobId);
        if (job) b.dest = { x: job.targetX, z: job.targetZ };
      }
      if (b.dest) {
        const dx = b.dest.x - b.x;
        const dz = b.dest.z - b.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.5) {
          b.dest = null;
          b.anim = dw.assignedJobId ? "work" : dw.sitOnStart ? "sit" : "idle";
          b.speed = 0;
        } else {
          const vx = dx / dist;
          const vz = dz / dist;
          const moved = resolveMove(b.x, b.z, vx * 2.4 * dt, vz * 2.4 * dt, 0.45);
          b.x = moved.x;
          b.z = moved.z;
          b.yaw = Math.atan2(-vx, -vz);
          b.anim = "walk";
          b.speed = 2.4;
        }
      } else if (dw.sitOnStart) {
        b.anim = "sit";
        b.speed = 0;
      } else if (dw.assignedJobId) {
        b.anim = "work";
        b.speed = 0;
      } else {
        b.anim = b.anim === "walk" ? "idle" : b.anim;
        b.speed = 0;
      }
    }
  }

  return null;
}

function GroundPick() {
  const { camera, gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const onClick = (ev: PointerEvent) => {
      if (useGame.getState().dialogue) return;
      if (useGame.getState().overlay) return;
      const rect = el.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);
      const ok = ray.ray.intersectPlane(plane, _hit);
      if (!ok) return;
      const dwarves = useGame.getState().dwarves;
      let nearest: string | null = null;
      let nd = 2.2;
      for (const dw of dwarves) {
        const b = runtime.dwarves.get(dw.id);
        if (!b) continue;
        const dist = Math.hypot(_hit.x - b.x, _hit.z - b.z);
        if (dist < nd) {
          nd = dist;
          nearest = dw.id;
        }
      }
      const buildings = useGame.getState().buildings;
      let bnear: string | null = null;
      let bd = 2.4;
      for (const bld of buildings) {
        const dist = Math.hypot(_hit.x - bld.x, _hit.z - bld.z);
        if (dist < bd) {
          bd = dist;
          bnear = bld.id;
        }
      }
      if (nearest && nd < 1.6) {
        const dw = dwarves.find((d) => d.id === nearest);
        if (dw) {
          useGame.getState().setSelected(dw.id);
          const p = runtime.player;
          if (
            Math.hypot(
              p.x - (runtime.dwarves.get(dw.id)?.x ?? 0),
              p.z - (runtime.dwarves.get(dw.id)?.z ?? 0),
            ) < 3
          ) {
            useGame.getState().talk(dw.talkKey, dw.id);
          } else {
            setPlayerDest(runtime.dwarves.get(dw.id)!.x, runtime.dwarves.get(dw.id)!.z);
          }
        }
        return;
      }
      if (bnear && bd < 2) {
        const p = runtime.player;
        const bld = buildings.find((b) => b.id === bnear);
        if (bld && Math.hypot(p.x - bld.x, p.z - bld.z) < 3.4) {
          useGame.getState().inspect(bld.id);
        } else if (bld) {
          setPlayerDest(bld.x, bld.z);
        }
        return;
      }
      setPlayerDest(_hit.x, _hit.z);
    };
    el.addEventListener("pointerdown", onClick);
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      runtime.zoomBias = Math.max(-16, Math.min(18, runtime.zoomBias - ev.deltaY * 0.02));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onClick);
      el.removeEventListener("wheel", onWheel);
    };
  }, [camera, gl]);
  return null;
}

function Actors() {
  const dwarves = useGame((s) => s.dwarves);
  const settlement = useGame((s) => s.settlement);
  const spec = WORLD_STAGES.find((w) => w.id === settlement) ?? WORLD_STAGES[0];
  const playerBody = runtime.player;
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const y = groundHeight(playerBody.x, playerBody.z);
    g.position.set(playerBody.x, y, playerBody.z);
    g.rotation.y = 0;
  });

  const dwarfNodes = useMemo(() => dwarves, [dwarves]);

  return (
    <>
      <group ref={group}>
        <DwarfSprite
          isPlayer
          scale={runtime.zone === "mine" ? spec.mineScale * 1.15 : spec.townScale}
          body={playerBody}
          dwarf={{
            id: "player",
            clothes: "#241c18",
            beard: "#6a3a28",
            skin: "#c4a07a",
            helmet: false,
          }}
        />
      </group>
      {dwarfNodes.map((d) => (
        <DwarfActor key={d.id} dwarf={d} specScale={spec} />
      ))}
    </>
  );
}

function DwarfActor({
  dwarf,
  specScale,
}: {
  dwarf: Dwarf;
  specScale: (typeof WORLD_STAGES)[number];
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const b = runtime.dwarves.get(dwarf.id);
    const g = ref.current;
    if (!b || !g) return;
    const y = groundHeight(b.x, b.z);
    g.position.set(b.x, y, b.z);
    g.rotation.y = b.yaw;
    const mine = zoneAt(b.x, b.z) === "mine";
    const s = mine ? specScale.mineScale : specScale.townScale;
    g.scale.setScalar(s);
  });
  const body = runtime.dwarves.get(dwarf.id);
  if (!body) return null;
  return (
    <group ref={ref}>
      <DwarfSprite dwarf={dwarf} body={body} scale={1} />
    </group>
  );
}

function Lights() {
  return (
    <>
      <color attach="background" args={["#202936"]} />
      <fog attach="fog" args={["#252d39", 38, 112]} />
      <hemisphereLight args={["#8290a2", "#2d251f", 0.62]} />
      <ambientLight intensity={0.18} color="#8d8175" />
      <directionalLight
        position={[-36, 38, 20]}
        intensity={1.45}
        color="#d7b18c"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00035}
        shadow-normalBias={0.04}
        shadow-camera-near={2}
        shadow-camera-far={140}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
      />
      <directionalLight position={[22, 18, -18]} intensity={0.38} color="#74859f" />
    </>
  );
}

export function GameCanvas() {
  return (
    <Canvas
      orthographic
      shadows
      dpr={[1, 1.6]}
      camera={{ position: [28, 30, 28], zoom: 40, near: 0.1, far: 280 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor("#202936");
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.94;
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFShadowMap;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        scene.fog = new THREE.Fog("#252d39", 38, 112);
      }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
    >
      <Lights />
      <IsoCamera />
      <Systems />
      <GroundPick />
      <Suspense fallback={null}>
        <WorldMatsProvider>
          <SpriteBankProvider>
            <Environment />
            <Actors />
          </SpriteBankProvider>
        </WorldMatsProvider>
      </Suspense>
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <SMAA />
        <Bloom luminanceThreshold={0.58} intensity={0.62} mipmapBlur luminanceSmoothing={0.22} />
        <Vignette eskil={false} offset={0.2} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  );
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getFacing?: () => number;
      getSpeed: () => number;
      getPos?: () => { x: number; z: number; zone: string };
      setKeys?: (codes: string[]) => void;
      setDest?: (x: number, z: number) => void;
      teleport?: (x: number, z: number) => void;
      setZoomBias?: (z: number) => void;
    };
  }
}
