import * as THREE from "three";
import { asset } from "@/lib/asset";
import { MotionPlayback, motionPlacement } from "../motion-playback";
import type { Body } from "../runtime";
import type { DwarfAppearance } from "./dwarf-appearances";

const folders: Partial<Record<DwarfAppearance, string>> = {
  blacksmith: "Blacksmith", borrin: "Borrin", cook: "Cook", elder: "Elder",
  femaleMiner: "Female Miner", ginger: "Ginger", helga: "Helga", laborer: "Laborer",
};
const directions = ["front", "front-right", "right", "back-right", "back", "back-left", "left", "front-left"];
type Manifest = { character: string; action: string; kind: string; frames: { durationMs: number }[];
  frameSize: [number, number]; registration: { targetBodyHeight: number; targetAnchor: [number, number] };
  atlas: { file: string } };
type Playback = { index: number; phase: number; setMotion(m: Manifest, options: { preservePhase: boolean }): void;
  travel(distance: number, stride: number): void; restart(): void };
type Placement = { width: number; height: number; left: number; top: number };
type PlaybackModule = { MotionPlayback: new(m: Manifest) => Playback; motionPlacement(m: Manifest, h: number): Placement };
type Loaded = { texture: THREE.CanvasTexture; manifest: Manifest; module: PlaybackModule };
type Entry = { promise: Promise<Loaded>; value?: Loaded; users: number; touched: number };
const cache = new Map<string, Entry>();
let clock = 0;
const playbackModule: PlaybackModule = { MotionPlayback, motionPlacement };

function trim() {
  // Each 1280x640 atlas is ~3.1 MiB on the GPU. Never evict a visible actor's atlas.
  const idle = [...cache].filter(([, e]) => e.users === 0 && e.value).sort((a, b) => b[1].touched - a[1].touched);
  for (const [key, entry] of idle.slice(6)) { entry.value!.texture.dispose(); cache.delete(key); }
}

function acquire(folder: string, direction: string) {
  const key = `${folder}/${direction}`;
  let entry = cache.get(key);
  if (!entry) {
    const item: Entry = { users: 0, touched: ++clock, promise: Promise.resolve(null as unknown as Loaded) };
    item.promise = (async () => {
      const url = new URL(asset(`/sprites/${folder}/motion/walk/${direction}/manifest.json`), location.href);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Motion manifest: ${response.status}`);
      const manifest: Manifest = await response.json();
      if (manifest.kind !== "walk" || manifest.frames.length !== 8 || manifest.registration.targetBodyHeight !== 520) {
        throw new Error("Unsupported NPC walking manifest");
      }
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
      item.value = { texture, manifest, module }; trim(); return item.value;
    })().catch(error => { if (cache.get(key) === item) cache.delete(key); throw error; });
    cache.set(key, item); entry = item;
  }
  entry.users++; entry.touched = ++clock;
  const held = entry;
  let released = false;
  return { promise: entry.promise, release() { if (!released) { released = true; held.users--; held.touched = ++clock; trim(); } } };
}

export const npcMotionDiagnostics = new Map<string, { loaded: boolean; direction: string; frame: number; phase: number; distance: number }>();

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
  private disposed = false;
  constructor(private id: string, private appearance: DwarfAppearance) {}

  update(body: Body, bodyHeight: number, worldScale = 1) {
    const distance = this.previous ? Math.hypot(body.x - this.previous[0], body.z - this.previous[1]) : 0;
    this.previous = [body.x, body.z];
    const walking = body.anim === "walk";
    const folder = folders[this.appearance];
    if (this.disposed || !folder) return null;
    if (!walking) { this.moving = false; npcMotionDiagnostics.delete(this.id); return null; }
    const direction = directions[((body.facing % 8) + 8) % 8];
    if (!this.moving) this.player?.restart();
    this.moving = true;
    if (direction !== this.direction) {
      this.direction = direction; this.loaded = undefined; this.lease?.release();
      const token = ++this.token; this.lease = acquire(folder, direction);
      this.lease.promise.then(value => {
        if (token !== this.token || this.disposed) return;
        this.loaded = value;
        if (this.player) this.player.setMotion(value.manifest, { preservePhase: true });
        else this.player = new value.module.MotionPlayback(value.manifest);
      }).catch(error => { if (token === this.token && !this.disposed) console.warn("NPC motion unavailable", folder, direction, error); });
    }
    // Actual resolved displacement freezes blocked feet. Ignore teleports, not low FPS.
    if (this.loaded && this.player && distance <= bodyHeight * worldScale) {
      this.player.travel(distance, bodyHeight * worldScale * 1.2); this.distance += distance;
    }
    npcMotionDiagnostics.set(this.id, { loaded: Boolean(this.loaded), direction, frame: this.player?.index ?? 0,
      phase: this.player?.phase ?? 0, distance: this.distance });
    if (!this.loaded || !this.player) return null;
    return { texture: this.loaded.texture, frame: this.player.index,
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
