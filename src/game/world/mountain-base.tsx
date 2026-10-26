import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { cliffHeight, random, surfaceHeight } from "./landscape";
import { useMats } from "./materials";
import { Parts } from "./reference-assets";
import { CampBanner } from "./camp-buildings";

/** World-space stone keeps the cliff's geology continuous across its large faces. */
export function useBedrockMaterial() {
  const m = useMats();
  const material = useMemo(() => {
    const mat = m.cliff.clone();
    mat.color.set("#9ca6a7");
    mat.side = THREE.DoubleSide;
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 rockPosition; varying vec3 rockNormal;",
        )
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nrockPosition=(modelMatrix*vec4(position,1.)).xyz; rockNormal=normalize(mat3(modelMatrix)*normal);",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 rockPosition; varying vec3 rockNormal;",
        )
        .replace(
          "#include <map_fragment>",
          `vec3 w=pow(abs(normalize(rockNormal)),vec3(4.));w/=max(.0001,w.x+w.y+w.z);
          vec3 r=texture2D(map,rockPosition.zy*.075).rgb*w.x+texture2D(map,rockPosition.xz*.075).rgb*w.y+texture2D(map,rockPosition.xy*.075).rgb*w.z;
          diffuseColor.rgb*=r*(.76+.15*sin(rockPosition.y*.7+sin(rockPosition.x*.09)));`,
        );
    };
    mat.customProgramCacheKey = () => "camp-continuous-bedrock-v2";
    return mat;
  }, [m]);
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

export function MountainEscarpment() {
  const material = useBedrockMaterial();
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-36, -0.8);
    for (let x = -36; x <= 42; x += 2) shape.lineTo(x, Math.max(0.1, cliffHeight(x)));
    shape.lineTo(42, -0.8);
    shape.closePath();
    const entrance = new THREE.Path();
    entrance.moveTo(5.55, -0.55);
    entrance.lineTo(10.45, -0.55);
    entrance.lineTo(10.6, 2.8);
    entrance.lineTo(9.7, 4.25);
    entrance.lineTo(8.4, 4.9);
    entrance.lineTo(6.8, 4.4);
    entrance.lineTo(5.5, 3.1);
    entrance.closePath();
    shape.holes.push(entrance);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 8.5,
      bevelEnabled: true,
      bevelSize: 0.18,
      bevelThickness: 0.15,
      bevelSegments: 1,
      curveSegments: 1,
    });
    g.translate(0, 0, -34.5);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      if (z > -27 && !(x > 5.1 && x < 10.9 && y < 5.3))
        p.setZ(i, z - 0.35 + Math.sin(x * 0.57 + y * 1.3) * 0.32);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const shelves = useMemo(() => {
    const result: {
      p: [number, number, number];
      s: [number, number, number];
      r: [number, number, number];
    }[] = [];
    for (let i = 0; i < 94; i++) {
      const x = -33 + random(i * 17 + 8) * 72,
        height = cliffHeight(x);
      const y = 0.5 + random(i * 13 + 24) * Math.max(0, height - 2);
      if (Math.abs(x - 8) < 3.8 && y < 6.4) continue;
      result.push({
        p: [x, y, -25.9],
        s: [1.2 + random(i * 11) * 3.8, 0.28 + random(i * 7) * 0.65, 0.8 + random(i * 3) * 1.1],
        r: [0.05, (random(i) - 0.5) * 0.35, (random(i + 18) - 0.5) * 0.1],
      });
    }
    return result;
  }, []);
  const ribs = useMemo(() => {
    const matrix = new THREE.Matrix4(),
      q = new THREE.Quaternion(),
      e = new THREE.Euler();
    const pieces = shelves.map((part, i) => {
      const g = new THREE.IcosahedronGeometry(1, 1),
        p = g.attributes.position;
      for (let v = 0; v < p.count; v++) {
        const f = 0.82 + random(v + i * 43) * 0.28;
        p.setXYZ(v, p.getX(v) * f, p.getY(v) * f, p.getZ(v) * f);
      }
      e.set(...part.r);
      q.setFromEuler(e);
      matrix.compose(new THREE.Vector3(...part.p), q, new THREE.Vector3(...part.s));
      g.applyMatrix4(matrix);
      return g;
    });
    const g = mergeGeometries(pieces)!;
    pieces.forEach((p) => p.dispose());
    g.computeVertexNormals();
    return g;
  }, [shelves]);
  return (
    <group name="mountain-foot-escarpment">
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
      <mesh geometry={ribs} material={material} castShadow receiveShadow />
    </group>
  );
}

export function RockyTerraces() {
  const m = useMats();
  const blocks = useMemo(() => {
    const result: {
      p: [number, number, number];
      s: [number, number, number];
      r?: [number, number, number];
    }[] = [];
    for (let i = 0; i < 10; i++) {
      const z = -10.5 - i * 0.75,
        top = surfaceHeight(-20, z);
      result.push({
        p: [-20, top - 0.14, z],
        s: [3.6 + random(i) * 0.35, 0.3, 0.79],
        r: [0, (random(i) - 0.5) * 0.05, 0],
      });
    }
    for (let i = 0; i < 13; i++) {
      const z = -8 - i * 1.1;
      for (let row = 0; row < 3; row++)
        result.push({
          p: [-22.4, row * 0.4 + 0.1, z],
          s: [0.75, 0.45, 1.05],
          r: [0, random(i + row * 7) * 0.08, 0],
        });
    }
    return result;
  }, []);
  return (
    <group name="camp-stone-terraces">
      <Parts parts={blocks} material={m.stoneDark} />
      <CampBanner x={-20.8} z={-20} height={4.8} color="#795242" />
    </group>
  );
}
