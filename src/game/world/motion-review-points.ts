/** Read-only sprite geometry probe used by the existing motion review controls. */
import * as THREE from 'three';
export type SpritePointReview = {
  frame: number; direction: string; world: [number, number, number];
  screen: [number, number]; bodyPixels: number; referenceScreen?: [number, number];
};
export const spritePointReviewers = new Map<string,
  (point: [number, number], reference?: [number, number, number]) => SpritePointReview | null>();

export function reviewSpritePoint(mesh: THREE.Mesh, camera: THREE.Camera,
  viewport: { width: number; height: number }, point: [number, number],
  frame: number, direction: string, reference?: [number, number, number]): SpritePointReview {
  if (point.length !== 2 || point.some(value => !Number.isFinite(value) || value < 0 || value > 640)) {
    throw new Error('Sprite review requires a finite point within the authored canvas');
  }
  mesh.updateWorldMatrix(true, false);
  const world = mesh.localToWorld(new THREE.Vector3(point[0] / 640 - .5, .5 - point[1] / 640, 0));
  const screen = (position: THREE.Vector3): [number, number] => {
    const p = position.clone().project(camera);
    return [(p.x + 1) * viewport.width / 2, (1 - p.y) * viewport.height / 2];
  };
  const bottom = screen(mesh.localToWorld(new THREE.Vector3(0, .5 - 616 / 640, 0)));
  const top = screen(mesh.localToWorld(new THREE.Vector3(0, .5 - 96 / 640, 0)));
  return { frame, direction, world: world.toArray() as [number, number, number], screen: screen(world),
    bodyPixels: Math.hypot(top[0] - bottom[0], top[1] - bottom[1]),
    ...(reference ? { referenceScreen: screen(new THREE.Vector3(...reference)) } : {}) };
}
