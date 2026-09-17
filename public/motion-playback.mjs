/** Shared, renderer-independent playback for the authored sprite library.
 * Frame phase (including the fraction inside a frame) survives direction changes.
 * Gait progress is driven by actual displacement, never requested velocity.
 */
export class MotionPlayback {
  constructor(manifest) {
    this.completions = 0;
    this.setMotion(manifest);
  }

  setMotion(manifest, { preservePhase = false } = {}) {
    if (!manifest?.frames?.length || manifest.frames.some(f => !Number.isFinite(f.durationMs) || f.durationMs <= 0)) {
      throw new Error('Motion requires positive finite frame durations');
    }
    const compatible = preservePhase && this.manifest?.character === manifest.character &&
      this.manifest?.action === manifest.action && this.manifest.frames.length === manifest.frames.length;
    const phase = compatible ? this.phase : 0;
    const ended = compatible && this.ended;
    this.manifest = manifest;
    this.durations = manifest.frames.map(f => f.durationMs);
    this.duration = this.durations.reduce((a, b) => a + b, 0);
    this.seekPhase(phase);
    this.ended = ended;
  }

  get phase() { return this.index + this.elapsed / this.durations[this.index]; }

  seekPhase(phase = 0) {
    if (!Number.isFinite(phase)) throw new Error('Phase must be finite');
    const count = this.durations.length;
    const bounded = Math.max(0, Math.min(count - Number.EPSILON * count, phase));
    this.index = Math.floor(bounded);
    this.elapsed = (bounded - this.index) * this.durations[this.index];
    this.ended = false;
  }

  restart() { this.seekPhase(0); }

  advance(ms, { repeat = false } = {}) {
    if (!Number.isFinite(ms) || ms < 0) throw new Error('Elapsed time must be finite and nonnegative');
    if (this.ended || ms === 0) return false;
    let time = this.durations.slice(0, this.index).reduce((a, b) => a + b, 0) + this.elapsed + ms;
    const cycles = Math.floor(time / this.duration);
    if (cycles && !repeat) {
      this.index = this.durations.length - 1;
      this.elapsed = this.durations[this.index];
      this.ended = true;
      this.completions++;
      return true;
    }
    if (repeat) {
      this.completions += cycles;
      time %= this.duration;
    }
    this.index = 0;
    while (this.index < this.durations.length - 1 && time >= this.durations[this.index]) {
      time -= this.durations[this.index++];
    }
    this.elapsed = time;
    return cycles > 0;
  }

  travel(distance, strideLength) {
    if (!Number.isFinite(distance) || distance < 0 || !Number.isFinite(strideLength) || strideLength <= 0) {
      throw new Error('Travel needs nonnegative distance and positive stride length');
    }
    if (!isTravelMotion(this.manifest)) throw new Error('Only walking motions accept travel');
    return this.advance(distance / strideLength * this.duration, { repeat: true });
  }
}

export function isTravelMotion(manifest) {
  return manifest?.kind === 'walk' ||
    (manifest?.kind === 'directional' && manifest.action === 'carry-mine-timber');
}

/** A shared physical body height, independent of canvas padding and tool reach.
 * y is canvas-down. Offset places the authored root exactly at the world origin.
 * Refuse uncalibrated work art rather than silently changing the character size.
 */
export function motionPlacement(manifest, bodyHeight) {
  const height = manifest.registration?.targetBodyHeight;
  const root = manifest.registration?.targetAnchor;
  const size = manifest.frameSize;
  if (!Number.isFinite(height) || height <= 0 || !Number.isFinite(bodyHeight) || bodyHeight <= 0 ||
      !root || root.length !== 2 || !root.every(Number.isFinite) ||
      !size || size.length !== 2 || size.some(n => !Number.isFinite(n) || n <= 0)) {
    throw new Error('Motion requires body height, root and canvas calibration');
  }
  const scale = bodyHeight / height;
  return { scale, width: size[0] * scale, height: size[1] * scale,
    left: -root[0] * scale, top: -root[1] * scale };
}

/** Projection for the review floor only; not a replacement for the game camera. */
export function reviewTravelVector(direction) {
  const directions = ['front', 'front-right', 'right', 'back-right', 'back', 'back-left', 'left', 'front-left'];
  const index = directions.indexOf(direction);
  if (index < 0) throw new Error('Travel requires a directional walking view');
  const angle = index * Math.PI / 4;
  return [Math.sin(angle), Math.cos(angle) * 0.45];
}
