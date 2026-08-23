import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { MeshStandardMaterial } from "three";

export function useTiledMat(base: MeshStandardMaterial, rx: number, ry: number) {
  return useMemo(() => {
    const mat = base.clone();
    if (base.map) {
      const map = base.map.clone();
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(rx, ry);
      map.anisotropy = 8;
      map.needsUpdate = true;
      mat.map = map;
    }
    return mat;
  }, [base, rx, ry]);
}

export function plankWallGeo(width: number, height: number, depth = 0.11, seed = 1) {
  const ph = 0.2;
  const n = Math.max(3, Math.round(height / ph));
  const geos: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const wobble = ((i * 17 + seed * 13) % 9) * 0.006;
    const g = new THREE.BoxGeometry(width + wobble, ph * 0.92, depth);
    g.translate(0, i * ph + ph * 0.5, 0);
    geos.push(g);
  }
  const merged = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());
  return merged ?? new THREE.BoxGeometry(width, height, depth);
}

export function sagCanvasGeo(w: number, h: number, sag = 0.22) {
  const g = new THREE.PlaneGeometry(w, h, 10, 8);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const nx = x / (w * 0.5);
    const ny = y / (h * 0.5);
    pos.setZ(i, -Math.cos(nx * Math.PI * 0.5) * sag * (1 - Math.abs(ny) * 0.35) - Math.abs(ny) * 0.04);
  }
  g.computeVertexNormals();
  return g;
}

export function rockGeo(radius = 1, seed = 1) {
  const g = new THREE.IcosahedronGeometry(radius, 1);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = 0.82 + ((Math.sin(x * 3.1 + seed) * Math.cos(z * 2.7 + seed * 1.3) + 1) * 0.12);
    pos.setXYZ(i, x * n, y * n * 0.72, z * n);
  }
  g.computeVertexNormals();
  return g;
}
