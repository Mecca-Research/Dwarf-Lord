import * as THREE from "three";
import { asset } from "@/lib/asset";
import { MotionPlayback, motionPlacement, motionStrideBodyRatio } from "../motion-playback";
import type { MotionManifest } from "../motion-playback";
import type { Body } from "../runtime";
import type { DwarfAppearance } from "./dwarf-appearances";
import { passiveWorkstation } from "./workstation-sites";
import { consultantWorkAction, cookingWorkAction, elderCampActions, elderCampActivity, forgeWorkAction, timberWorkAction, WorkActivitySequence } from "./work-activities";

const folders: Partial<Record<DwarfAppearance, string>> = {
  blacksmith: "Blacksmith", borrin: "Borrin", cook: "Cook", elder: "Elder",
  femaleMiner: "Female Miner", ginger: "Ginger", helga: "Helga", laborer: "Laborer",
};
// Work-only specialists do not yet have eight-direction walking atlases.
const workFolders: Partial<Record<DwarfAppearance, string>> = { ...folders, stoneworker: "Stoneworker", quartermaster: "Quartermaster" };
const directions = ["front", "front-right", "right", "back-right", "back", "back-left", "left", "front-left"];
type Manifest = MotionManifest & { character: string; action: string; kind: string; frames: { durationMs: number }[];
  frameSize: [number, number]; registration: { targetBodyHeight: number; targetAnchor: [number, number] };
  atlas: { file: string }; sourceSha256?: string };
type Playback = { index: number; phase: number; setMotion(m: Manifest, options: { preservePhase: boolean }): void;
  travel(distance: number, stride: number): void; restart(): void;
  advance(ms: number): boolean; ended: boolean; completions: number };
type Placement = { width: number; height: number; left: number; top: number };
type PlaybackModule = { MotionPlayback: new(m: Manifest) => Playback; motionPlacement(m: Manifest, h: number): Placement };
type Loaded = { foregroundPolygons?: number[][][][]; texture: THREE.CanvasTexture; manifest: Manifest; module: PlaybackModule };
type Entry = { promise: Promise<Loaded>; value?: Loaded; users: number; touched: number };
const cache = new Map<string, Entry>();
let clock = 0;
const playbackModule: PlaybackModule = { MotionPlayback, motionPlacement };

function trim() {
  // Each 1280x640 atlas is ~3.1 MiB on the GPU. Never evict a visible actor's atlas.
  const idle = [...cache].filter(([, e]) => e.users === 0 && e.value).sort((a, b) => b[1].touched - a[1].touched);
  for (const [key, entry] of idle.slice(6)) { entry.value!.texture.dispose(); cache.delete(key); }
}

function acquire(folder: string, direction: string, action = "walk") {
  const key = `${folder}/${action}/${direction}`;
  let entry = cache.get(key);
  if (!entry) {
    const item: Entry = { users: 0, touched: ++clock, promise: Promise.resolve(null as unknown as Loaded) };
    item.promise = (async () => {
      const url = new URL(asset(`/sprites/${folder}/motion/${action}/${direction}/manifest.json`), location.href);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Motion manifest: ${response.status}`);
      const manifest: Manifest = await response.json();
      let foregroundPolygons: number[][][][] | undefined;
      if (manifest.frames.length !== 8 || manifest.frameSize?.[0] !== 640 || manifest.frameSize?.[1] !== 640 ||
          (action === "walk" && (manifest.kind !== "walk" || manifest.registration.targetBodyHeight !== 520))) {
        throw new Error("Unsupported NPC motion manifest");
      }
      if (action === "walk") motionStrideBodyRatio(manifest);
      if (action !== "walk" && manifest.kind !== "directional") {
        const calibrationResponse = await fetch(new URL("../../render-calibration.json", url));
        if (!calibrationResponse.ok) throw new Error("Missing work body calibration");
        const calibration = await calibrationResponse.json();
        const placement = calibration.actions?.[`${action}/${direction}`] ?? calibration.actions?.[action];
        if (!["work", "new-work"].includes(manifest.kind) || calibration.character !== manifest.character ||
            !placement || placement.sourceSha256 !== manifest.sourceSha256) throw new Error("Stale work body calibration");
        manifest.registration = { ...manifest.registration, targetBodyHeight: placement.targetBodyHeight, targetAnchor: placement.targetAnchor };
        if (placement.foregroundPolygons !== undefined) {
          const polygons = placement.foregroundPolygons;
          if (!Array.isArray(polygons) || polygons.length !== 8 || polygons.some((frame: number[][][]) =>
            !Array.isArray(frame) || frame.some(poly => !Array.isArray(poly) || poly.length < 3 || poly.some(point =>
              !Array.isArray(point) || point.length !== 2 || point.some(n => !Number.isFinite(n) || n < 0 || n > 640))))) {
            throw new Error("Invalid foreground contours");
          }
          foregroundPolygons = polygons;
        }
        motionPlacement(manifest, 1); // Validate before allocating a GPU texture.
      }
      // Directional tools already carry body-only calibration from the exporter.
      if (action !== "walk") motionPlacement(manifest, 1);
      const imageResponse = await fetch(new URL(manifest.atlas.file, url));
      if (!imageResponse.ok) throw new Error(`Motion atlas: ${imageResponse.status}`);
      const bitmap = await createImageBitmap(await imageResponse.blob());
      const canvas = document.createElement("canvas"); canvas.width = 1280; canvas.height = 640;
      const ctx = canvas.getContext("2d")!;
      try {
        if (bitmap.width !== 5120 || bitmap.height !== 640) throw new Error("Invalid walking atlas dimensions");
        // Repack the 5120-wide source below mobile texture limits; no source art is changed.
        for (let i = 0; i < 8; i++) ctx.drawImage(bitmap, i * 640, 0, 640, 640, i % 4 * 320, Math.floor(i / 4) * 320, 320, 320);
      } finally { bitmap.close(); }
      const module = playbackModule;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace; texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter; texture.generateMipmaps = false;
      item.value = { texture, manifest, module, foregroundPolygons }; trim(); return item.value;
    })().catch(error => { if (cache.get(key) === item) cache.delete(key); throw error; });
    cache.set(key, item); entry = item;
  }
  entry.users++; entry.touched = ++clock;
  const held = entry;
  let released = false;
  return { promise: entry.promise, get value() { return held.value; }, release() { if (!released) { released = true; held.users--; held.touched = ++clock; trim(); } } };
}

export const npcMotionDiagnostics = new Map<string, { loaded: boolean; direction: string; frame: number; phase: number; distance: number; strideBodyRatio: number; visualRoot?: [number, number] }>();

/** Convert resolved root displacement into a rotated/scaled sprite parent's space. */
export function motionRootTranslation(offset: [number, number], yaw: number, scale: THREE.Vector3, heightDelta: number): [number, number, number] {
  const cosine = Math.cos(yaw), sine = Math.sin(yaw);
  return [(cosine * offset[0] - sine * offset[1]) / Math.max(.01, scale.x),
    heightDelta / Math.max(.01, scale.y), (sine * offset[0] + cosine * offset[1]) / Math.max(.01, scale.z)];
}

/** One actor's phase/UV state. Atlas pixels are shared; offsets are never shared. */
export class NpcWalkMotion {
  private lease?: ReturnType<typeof acquire>;
  private loaded?: Loaded;
  private player?: Playback;
  private direction = "";
  private token = 0;
  private previous?: [number, number];
  private moving = false;
  private distance = 0;
  private pendingTravel = 0;
  private retryAt = 0;
  private disposed = false;
  private poseRoot?: [number, number];
  private poseKey = "";
  private lastMove?: [number, number];
  private poseRootSeeded = false;
  constructor(private id: string, private appearance: DwarfAppearance) {}

  update(body: Body, bodyHeight: number, worldScale = 1) {
    const dx = this.previous ? body.x - this.previous[0] : 0;
    const dz = this.previous ? body.z - this.previous[1] : 0;
    const distance = this.previous ? Math.hypot(body.x - this.previous[0], body.z - this.previous[1]) : 0;
    this.previous = [body.x, body.z];
    const walking = body.anim === "walk";
    const folder = folders[this.appearance];
    if (this.disposed || !folder) return null;
    if (!walking) {
      if (this.moving) {
        ++this.token; this.lease?.release(); this.lease = undefined;
        this.loaded = undefined; this.direction = ""; this.pendingTravel = 0;
      }
      this.moving = false; this.poseRoot = undefined; this.poseKey = "";
      this.lastMove = undefined; this.poseRootSeeded = false; npcMotionDiagnostics.delete(this.id); return null;
    }
    const direction = directions[((body.facing % 8) + 8) % 8];
    if (!this.moving) this.player?.restart();
    this.moving = true;
    if (direction !== this.direction || (!this.lease && performance.now() >= this.retryAt)) {
      this.direction = direction; this.loaded = undefined; this.lease?.release();
      const token = ++this.token; this.lease = acquire(folder, direction);
      this.lease.promise.then(value => {
        if (token !== this.token || this.disposed) return;
        this.loaded = value;
        if (this.player) this.player.setMotion(value.manifest, { preservePhase: true });
        else this.player = new value.module.MotionPlayback(value.manifest);
        // Travel accumulated before the first atlas arrived is expressed in strides.
        if (this.pendingTravel) { this.player.travel(this.pendingTravel, 1); this.pendingTravel = 0; }
      }).catch(error => {
        if (token !== this.token || this.disposed) return;
        this.lease?.release(); this.lease = undefined;
        this.retryAt = performance.now() + 5000;
        console.warn("NPC motion unavailable", folder, direction, error);
      });
    }
    // Actual resolved displacement freezes blocked feet. Ignore teleports, not low FPS.
    const strideBodyRatio = this.loaded ? motionStrideBodyRatio(this.loaded.manifest) : 1.2;
    if (distance <= bodyHeight * worldScale) {
      if (distance > 0) this.lastMove = [dx / distance, dz / distance];
      const strides = distance / (bodyHeight * worldScale * strideBodyRatio);
      // Keep logical phase moving while a different view is loading.
      if (this.player) this.player.travel(strides, 1);
      else this.pendingTravel = (this.pendingTravel + strides) % 1;
      this.distance += distance;
    } else {
      // A teleport cannot keep a stale pose planted at the old location.
      this.poseRoot = undefined; this.poseKey = ""; this.lastMove = undefined; this.poseRootSeeded = false;
    }
    if (this.loaded && this.player) {
      const key = `${direction}:${this.player.index}:${this.player.completions}`;
      if (key !== this.poseKey || !this.poseRoot || (!this.poseRootSeeded && this.lastMove)) {
        const durations = this.loaded.manifest.frames.map(frame => frame.durationMs);
        const fraction = this.player.phase - this.player.index;
        const frameTravel = bodyHeight * worldScale * strideBodyRatio * durations[this.player.index] / durations.reduce((a, b) => a + b, 0);
        // Reconstruct the last boundary from resolved travel, including low-FPS
        // updates crossing several frames. No image pixels or limb positions change.
        // Loading may first expose a partly completed pose. Reconstruct its
        // entire fraction, rather than capping it at just the latest update's
        // travel. Retain the last resolved heading when decode finishes idle.
        const back = this.lastMove ? fraction * frameTravel : 0;
        this.poseRoot = [body.x - (this.lastMove?.[0] ?? 0) * back, body.z - (this.lastMove?.[1] ?? 0) * back];
        this.poseRootSeeded = Boolean(this.lastMove);
        this.poseKey = key;
      }
    }
    npcMotionDiagnostics.set(this.id, { loaded: Boolean(this.loaded), direction, frame: this.player?.index ?? 0,
      phase: this.player?.phase ?? 0, distance: this.distance, strideBodyRatio, ...(this.poseRoot ? { visualRoot: this.poseRoot } : {}) });
    if (!this.loaded || !this.player) return null;
    return { texture: this.loaded.texture, frame: this.player.index,
      rootOffset: this.poseRoot ? [this.poseRoot[0] - body.x, this.poseRoot[1] - body.z] as [number, number] : [0, 0] as [number, number],
      placement: this.loaded.module.motionPlacement(this.loaded.manifest, bodyHeight) };
  }

  dispose() { this.disposed = true; ++this.token; this.lease?.release(); npcMotionDiagnostics.delete(this.id); }
}

export function setMotionUv(geometry: THREE.BufferGeometry, frame: number | null) {
  const uv = geometry.getAttribute("uv");
  const column = frame === null ? 0 : frame % 4, row = frame === null ? 0 : Math.floor(frame / 4);
  const columns = frame === null ? 1 : 4, rows = frame === null ? 1 : 2;
  for (let i = 0; i < 4; i++) uv.setXY(i, (column + i % 2) / columns, 1 - (row + Math.floor(i / 2)) / rows);
  uv.needsUpdate = true;
}


export const npcWorkDiagnostics = new Map<string, { action: string; direction: string; frame: number; completed: boolean; completions: number }>();
/** Cosmetic station handoff only: animation never writes inventory or rewards. */
export const workstationTaskStates = new Map<string, { owner: string; task: string; active: boolean; completed: boolean }>();

/** Task-owned one-shot playback. Rendering never awards economic output. */
export class NpcWorkMotion {
  private key = "";
  private lease?: ReturnType<typeof acquire>;
  private loaded?: Loaded;
  private player?: Playback;
  private token = 0;
  private retryAt = 0;
  private view = "";
  private activity?: WorkActivitySequence;
  private activityDay = -1;
  private preload?: { action: string; lease: ReturnType<typeof acquire> };
  private preloadRetryAt = 0;
  constructor(private id: string, private appearance: DwarfAppearance) {}

  update(body: Body, job: string | null, day: number, resolved: boolean, dt: number, bodyHeight: number) {
    // Consultant desk work is cosmetic; Borrin remains excluded from production jobs.
    const passive = passiveWorkstation(this.appearance, job, body);
    const elder = elderCampActivity(this.appearance, job, body);
    if (elder && (!this.activity || this.activityDay !== day)) {
      this.reset(); this.activity = new WorkActivitySequence(elderCampActions); this.activityDay = day;
    }
    const elapsedMs = (Number.isFinite(dt) ? Math.max(dt, 0) : 0) * 1000;
    const action = elder ? this.activity!.action : passive ? (this.appearance === "borrin" ? consultantWorkAction(day) : passive.action!) : this.appearance === "cook" && job === "meals" ? cookingWorkAction(day) :
      this.appearance === "femaleMiner" && (job === "limestone" || job === "iron") ? "pickaxe-swing" :
      this.appearance === "femaleMiner" && job === "shaft2" ? "shovel-cycle" :
      this.appearance === "blacksmith" && job === "forge" ? forgeWorkAction(day) :
      this.appearance === "laborer" && job === "storage" ? "stack-crates" :
      this.appearance === "ginger" && job === "timber" ? timberWorkAction(day) :
      this.appearance === "stoneworker" && job === "limestone" ? "chisel-contact" : null;
    if (!action || (!passive && !elder && (body.anim !== "work" || resolved))) { if (this.key) this.reset(); return null; }
    const key = `${day}:${job}:${action}`;
    if (key !== this.key) {
      const activity = elder ? this.activity : undefined, activityDay = this.activityDay;
      this.reset(); this.activity = activity; this.activityDay = activityDay;
      this.key = key; this.retryAt = 0;
    }
    const direction = elder ? "reference" : this.appearance === "femaleMiner" ? directions[((body.facing % 8) + 8) % 8] : "actor";
    if (direction !== this.view) {
      ++this.token; this.lease?.release(); this.lease = undefined; this.loaded = undefined;
      this.view = direction; this.retryAt = 0;
    }
    if (!this.lease && performance.now() >= this.retryAt) {
      const token = ++this.token;
      this.lease = acquire(workFolders[this.appearance]!, direction, action);
      const install = (value: Loaded) => {
        if (token !== this.token || this.loaded === value) return;
        this.loaded = value;
        if (this.player) this.player.setMotion(value.manifest, { preservePhase: true });
        else this.player = new value.module.MotionPlayback(value.manifest);
      };
      // A ready preloaded activity installs in this frame, without an idle flash.
      if (this.lease.value) install(this.lease.value);
      this.lease.promise.then(install).catch(error => {
        if (token !== this.token) return;
        this.lease?.release(); this.lease = undefined; this.retryAt = performance.now() + 5000;
        console.warn("NPC work motion unavailable", action, error);
      });
    }
    // A texture's network/decode time is not part of its authored animation.
    const endedBeforeUpdate = Boolean(this.player?.ended);
    if (this.loaded) this.player?.advance(elapsedMs);
    if (!this.loaded || !this.player) return null;
    if (this.appearance === "laborer" && job === "storage") {
      workstationTaskStates.set("storage-pallet", { owner: this.id, task: key, active: true, completed: this.player.ended });
    }
    npcWorkDiagnostics.set(this.id, { action, direction, frame: this.player.index, completed: this.player.ended, completions: this.player.completions });
    const result = { texture: this.loaded.texture, frame: this.player.index, foregroundPolygons: this.loaded.foregroundPolygons?.[this.player.index], placement: motionPlacement(this.loaded.manifest, bodyHeight) };
    if (elder) {
      const next = this.activity!.actions[this.activity!.index + 1];
      if (next && !this.preload && performance.now() >= this.preloadRetryAt) {
        const lease = acquire(workFolders[this.appearance]!, "reference", next);
        this.preload = { action: next, lease };
        lease.promise.catch(() => {
          if (this.preload?.lease === lease) { lease.release(); this.preload = undefined; this.preloadRetryAt = performance.now() + 5000; }
        });
      }
      // Hold the completed pose until the next action is actually ready.
      this.activity!.update(elapsedMs, endedBeforeUpdate && Boolean(this.preload?.lease.value));
    }
    return result;
  }

  private reset() {
    const station = workstationTaskStates.get("storage-pallet");
    if (station?.owner === this.id) station.active = false;
    ++this.token; this.lease?.release(); this.lease = undefined; this.loaded = undefined;
    this.preload?.lease.release(); this.preload = undefined; this.preloadRetryAt = 0;
    this.player = undefined; this.key = ""; this.view = ""; this.activity = undefined; this.activityDay = -1; npcWorkDiagnostics.delete(this.id);
  }
  dispose() { this.reset(); }
}

/** Foreground contours reuse original atlas pixels; no duplicated station pixels. */
export function motionForegroundGeometry(polygons: number[][][], frame: number) {
  const shapes = polygons.map(points => new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x / 640 - .5, .5 - y / 640))));
  const geometry = new THREE.ShapeGeometry(shapes);
  const position = geometry.getAttribute("position"), uv = geometry.getAttribute("uv");
  for (let i = 0; i < position.count; i++) uv.setXY(i,
    (frame % 4 + position.getX(i) + .5) / 4,
    1 - (Math.floor(frame / 4) + .5 - position.getY(i)) / 2);
  uv.needsUpdate = true;
  return geometry;
}
