/** Map a fixed prop into an actor's native review canvas at the same world root.
 * Each layer retains its own measured physical body basis. This is one uniform
 * transform for the prop, never a per-frame actor or limb correction.
 */
export function workstationTransform(actor, station, frameSize = [640, 640]) {
  for (const [name, registration] of [['Actor', actor], ['Station', station]]) {
    if (!Number.isFinite(registration?.targetBodyHeight) || registration.targetBodyHeight <= 0 ||
        !Array.isArray(registration.targetAnchor) || registration.targetAnchor.length !== 2 ||
        !registration.targetAnchor.every(Number.isFinite)) {
      throw new Error(`${name} requires a finite physical registration`);
    }
  }
  if (!Array.isArray(frameSize) || frameSize.length !== 2 ||
      !frameSize.every(value => Number.isFinite(value) && value > 0)) {
    throw new Error('Station requires finite positive canvas dimensions');
  }
  const scale = actor.targetBodyHeight / station.targetBodyHeight;
  const x = actor.targetAnchor[0] - station.targetAnchor[0] * scale;
  const y = actor.targetAnchor[1] - station.targetAnchor[1] * scale;
  const width = frameSize[0] * scale, height = frameSize[1] * scale;
  if (![scale, x, y, width, height].every(Number.isFinite) || scale <= 0) {
    throw new Error('Station registration cannot be represented');
  }
  return { scale, x, y, width, height };
}
