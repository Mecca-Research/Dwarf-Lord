import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TARN, cliffHeight, creekX, random, surfaceHeight } from "./landscape";
import { useMats } from "./materials";
import { rockGeo } from "./geom";

/** One continuous stream down the escarpment, with animated white water and a plunge pool. */
function SnowmeltFalls() {
  const m = useMats(),
    time = useMemo(() => ({ value: 0 }), []);
  const geometry = useMemo(() => {
    const positions: number[] = [],
      uv: number[] = [],
      indices: number[] = [];
    const x = creekX(-25),
      height = cliffHeight(x) + 0.15;
    for (let i = 0; i <= 24; i++)
      for (const side of [-1, 1]) {
        const t = i / 24,
          width = 0.85 + Math.sin(t * Math.PI) * 0.7;
        positions.push(
          x + side * width + Math.sin(t * 8) * 0.12,
          height * (1 - t) - 0.55,
          -25.35 + Math.sin(t * Math.PI) * 0.2,
        );
        uv.push((side + 1) / 2, t);
        if (i < 24 && side === -1) {
          const q = i * 2;
          indices.push(q, q + 2, q + 1, q + 1, q + 2, q + 3);
        }
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: { fallTime: time },
        vertexShader:
          "varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader: `uniform float fallTime;varying vec2 v;
    void main(){float edge=pow(sin(v.x*3.14159),.4);float streak=sin(v.x*59.+sin(v.y*16.-fallTime*4.))*sin(v.y*90.-fallTime*17.);
      float foam=smoothstep(-.2,.7,streak);vec3 c=mix(vec3(.22,.37,.4),vec3(.75,.83,.81),foam);
      gl_FragColor=vec4(c,edge*(.68+foam*.25));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
      }),
    [time],
  );
  const rock = useMemo(() => rockGeo(1, 129), []);
  useFrame(({ clock }) => (time.value = clock.elapsedTime));
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      rock.dispose();
    },
    [geometry, material, rock],
  );
  const x = creekX(-25);
  return (
    <group name="snowmelt-waterfall">
      <mesh geometry={geometry} material={material} />
      <mesh
        position={[x, -0.54, -23.7]}
        rotation-x={-Math.PI / 2}
        scale={[2.4, 2.8, 1]}
        material={m.water}
      >
        <circleGeometry args={[1, 40]} />
      </mesh>
      <mesh position={[x, -0.51, -24]} rotation-x={-Math.PI / 2} scale={[1.9, 1.5, 1]}>
        <circleGeometry args={[1, 40]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={{ fallTime: time }}
          vertexShader="varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
          fragmentShader={`uniform float fallTime;varying vec2 v;void main(){float r=length(v-.5)*2.;float ring=pow(max(0.,sin(r*27.-fallTime*3.)),8.);float a=(1.-smoothstep(.3,1.,r))*(.3+ring*.25);gl_FragColor=vec4(.7,.8,.78,a);}`}
        />
      </mesh>
      {Array.from({ length: 14 }, (_, i) => {
        const side = i % 2 ? 1 : -1,
          px = x + side * (1.7 + random(i + 43) * 1.1),
          pz = -25 + random(i + 23) * 4;
        return (
          <mesh
            key={i}
            geometry={rock}
            material={m.cliff}
            position={[px, surfaceHeight(px, pz) + 0.2, pz]}
            scale={[0.7 + random(i), 0.5 + random(i + 7), 0.8 + random(i + 19)]}
            rotation-y={i * 2.399}
            receiveShadow
          />
        );
      })}
    </group>
  );
}

function GlacialTarn() {
  const m = useMats(),
    time = useMemo(() => ({ value: 0 }), []);
  const geometry = useMemo(() => {
    const p: number[] = [TARN.x, TARN.waterY, TARN.z],
      uv: number[] = [0.5, 0.5],
      ix: number[] = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2,
        r = 0.99 + Math.sin(a * 7) * 0.025 + Math.sin(a * 11) * 0.012;
      p.push(TARN.x + Math.cos(a) * TARN.rx * r, TARN.waterY, TARN.z + Math.sin(a) * TARN.rz * r);
      uv.push(0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5);
      if (i < 96) ix.push(0, i + 2, i + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(ix);
    g.computeVertexNormals();
    return g;
  }, []);
  const material = useMemo(() => {
    const mat = m.water.clone();
    mat.color.set("#406e73");
    mat.opacity = 0.93;
    mat.roughness = 0.19;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.tarnTime = time;
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float tarnTime;")
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float bands=pow(max(0.,sin(vUv.x*175.+sin(vUv.y*80.)*1.2+tarnTime*.7)),22.);
          diffuseColor.rgb+=vec3(.045,.07,.075)*bands;`,
        );
      // m.water has no map: explicitly enable a UV varying for its ripples.
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec2 tarnUv;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\ntarnUv=uv;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec2 tarnUv;")
        .replaceAll("vUv.", "tarnUv.");
    };
    mat.customProgramCacheKey = () => "glacial-tarn-v3";
    return mat;
  }, [m, time]);
  useFrame(({ clock }) => (time.value = clock.elapsedTime));
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return <mesh name="glacial-tarn" geometry={geometry} material={material} />;
}
export function ValleyWater() {
  return (
    <group name="valley-water-landmarks">
      <SnowmeltFalls />
      <GlacialTarn />
    </group>
  );
}
