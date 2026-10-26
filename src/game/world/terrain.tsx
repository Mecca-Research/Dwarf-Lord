import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { asset } from "@/lib/asset";
import { workstationSites } from "./workstation-sites";
import { rockGeo } from "./geom";
import { Boardwalk } from "./kit";
import { useMats } from "./materials";
import { creekX, random, surfaceHeight } from "./landscape";

function valleyGeometry() {
  const g = new THREE.PlaneGeometry(300, 300, 240, 240);
  g.rotateX(-Math.PI / 2);
  g.translate(0, 0, -35);
  const p = g.attributes.position,
    uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i),
      z = p.getZ(i);
    if (Math.abs(x) > 100) x = Math.sign(x) * (100 + (Math.abs(x) - 100) * 4);
    if (z < -140) z = -140 + (z + 140) * 4;
    if (z > 75) z = 75 + (z - 75) * 4;
    p.setXYZ(i, x, surfaceHeight(x, z), z);
    uv.setXY(i, x * 0.035, z * 0.035);
  }
  const index = g.index!,
    indices: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i),
      b = index.getX(i + 1),
      c = index.getX(i + 2);
    const x = (p.getX(a) + p.getX(b) + p.getX(c)) / 3,
      z = (p.getZ(a) + p.getZ(b) + p.getZ(c)) / 3;
    if (x > 5.5 && x < 10.5 && z < -26 && z > -27.8) continue;
    indices.push(a, b, c);
  }
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
function ValleyFloor() {
  const m = useMats(),
    geometry = useMemo(valleyGeometry, []);
  const material = useMemo(() => {
    const mat = m.dirt.clone();
    mat.color.set("#ffffff");
    mat.bumpMap = m.dirt.map;
    mat.bumpScale = 0.12;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.valleyRock = { value: m.cliff.map };
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 valleyPosition; varying vec3 valleyNormal;",
        )
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvalleyPosition=(modelMatrix*vec4(position,1.)).xyz; valleyNormal=normalize(mat3(modelMatrix)*normal);",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
        uniform sampler2D valleyRock;varying vec3 valleyPosition;varying vec3 valleyNormal;
        float track(vec2 p,vec2 a,vec2 b){vec2 q=p-a,v=b-a;return length(q-v*clamp(dot(q,v)/dot(v,v),0.,1.));}
        float valleyHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float valleyNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(valleyHash(i),valleyHash(i+vec2(1.,0.)),f.x),mix(valleyHash(i+vec2(0.,1.)),valleyHash(i+vec2(1.,1.)),f.x),f.y);}
      `,
        )
        .replace(
          "#include <map_fragment>",
          `
        vec3 wp=valleyPosition;
        vec3 weights=pow(abs(normalize(valleyNormal)),vec3(5.));weights/=max(.0001,weights.x+weights.y+weights.z);
        vec3 rock=texture2D(valleyRock,wp.zy*.055).rgb*weights.x+texture2D(valleyRock,wp.xz*.055).rgb*weights.y+texture2D(valleyRock,wp.xy*.055).rgb*weights.z;
        vec3 soil=texture2D(map,wp.xz*.035).rgb;
        float variation=valleyNoise(wp.xz*.12)*.65+valleyNoise(wp.xz*.47)*.35;
        float path=min(track(wp.xz,vec2(-65.,11.),vec2(-12.,11.)),min(track(wp.xz,vec2(-12.,11.),vec2(-3.,3.)),track(wp.xz,vec2(-3.,3.),vec2(8.,-27.))));
        float clearing=1.-smoothstep(.68,.96,length((wp.xz-vec2(2.,1.))/vec2(24.,18.))+variation*.17);
        float dirt=max(clearing,1.-smoothstep(1.1,2.8,path))*(1.-smoothstep(1.,7.,wp.y));
        vec3 meadow=mix(vec3(.075,.12,.045),vec3(.19,.23,.095),variation);
        float grain=clamp(dot(soil,vec3(.2126,.7152,.0722))*8.,.15,1.6);
        vec3 ground=mix(meadow,mix(vec3(.14,.107,.073),vec3(.25,.20,.135),variation),dirt)*(.32+grain*.9);
        float exposed=max(1.-smoothstep(.45,.82,abs(valleyNormal.y)),smoothstep(8.,22.,wp.y));
        vec3 bedrock=rock*vec3(.5,.53,.56)*(.7+variation*.6);
        float snow=smoothstep(67.+variation*14.,83.+variation*14.,wp.y)*smoothstep(.4,.78,abs(valleyNormal.y));
        diffuseColor.rgb*=mix(mix(ground,bedrock,exposed),vec3(.83,.89,.9),snow);
      `,
        );
    };
    mat.customProgramCacheKey = () => "alpine-valley-v2";
    return mat;
  }, [m]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return (
    <mesh name="continuous-alpine-valley" geometry={geometry} material={material} receiveShadow />
  );
}
function AlpineSky() {
  return (
    <mesh position={[0, 0, -20]}>
      <sphereGeometry args={[650, 32, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={{
          zenith: { value: new THREE.Color("#637f99") },
          horizon: { value: new THREE.Color("#c3cccb") },
        }}
        vertexShader={`varying vec3 skyDirection;void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`uniform vec3 zenith;uniform vec3 horizon;varying vec3 skyDirection;
        void main(){vec3 d=normalize(skyDirection);float h=pow(max(0.,d.y),.55);
          float cloud=smoothstep(.35,.8,sin(d.x*17.+d.z*11.)*sin(d.z*31.-d.x*8.))*.12*(1.-h);
          gl_FragColor=vec4(mix(horizon,zenith,h)+cloud,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`}
      />
    </mesh>
  );
}
function Forest() {
  const atlas = useTexture(asset("/art/alpine-spruce-v1.webp")),
    ref = useRef<THREE.InstancedMesh>(null);
  const previous = useRef(new THREE.Quaternion(0, 0, 0, 0)),
    object = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(2 / 3, 1);
    g.translate(0, 0.474, 0);
    return g;
  }, []);
  const trees = useMemo(() => {
    const result: { x: number; z: number; y: number; scale: number }[] = [];
    for (let i = 0; i < 1300; i++) {
      const x = -112 + random(i * 11 + 4) * 224,
        z = -90 + random(i * 13 + 9) * 170,
        h = surfaceHeight(x, z);
      if (
        !(Math.abs(x - 2) > 30 || z > 29 || z < -34) ||
        h > 31 ||
        Math.abs(x - creekX(z)) < 4 ||
        workstationSites.some((s) => Math.hypot(x - s.target.targetX, z - s.target.targetZ) < 5.2)
      )
        continue;
      if (z > 18 && x > -19 && x < 31) continue;
      result.push({ x, z, y: h, scale: 4.5 + random(i * 17) * 4.4 });
    }
    for (const [x, z] of [
      [-25, -9],
      [-23, -15],
      [25, -4],
      [26, 12],
      [22, -19],
    ])
      result.push({ x, z, y: surfaceHeight(x, z), scale: 5.2 });
    return result;
  }, []);
  useLayoutEffect(() => {
    atlas.colorSpace = THREE.SRGBColorSpace;
    const c = new THREE.Color();
    trees.forEach((_, i) => {
      c.set(["#d4d8cb", "#b6c7b7", "#d7d3bb"][i % 3]);
      ref.current!.setColorAt(i, c);
    });
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
  }, [atlas, trees]);
  useFrame(({ camera }) => {
    if (1 - Math.abs(camera.quaternion.dot(previous.current)) < 0.000001) return;
    previous.current.copy(camera.quaternion);
    trees.forEach((t, i) => {
      object.position.set(t.x, t.y, t.z);
      object.quaternion.copy(camera.quaternion);
      object.scale.set(t.scale * (0.9 + random(i) * 0.22), t.scale, 1);
      object.updateMatrix();
      ref.current!.setMatrixAt(i, object.matrix);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  });
  return (
    <instancedMesh name="alpine-conifer-belt" ref={ref} args={[geometry, undefined, trees.length]}>
      <meshBasicMaterial map={atlas} alphaTest={0.42} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}
function Talus() {
  const m = useMats(),
    ref = useRef<THREE.InstancedMesh>(null),
    geometry = useMemo(() => rockGeo(1, 7), []);
  const stones = useMemo(() => {
    const result: { x: number; z: number; y: number; size: number }[] = [];
    for (let i = 0; i < 1200; i++) {
      const x = -70 + random(i * 7 + 8) * 140,
        z = -60 + random(i * 11 + 3) * 115;
      if (Math.abs(x - 2) < 24 && z > -26 && z < 20) continue;
      if ((Math.abs(z - 11) < 2.4 && x < -18) || Math.abs(x - creekX(z)) < 1.7) continue;
      if (
        workstationSites.some((s) => Math.hypot(x - s.target.targetX, z - s.target.targetZ) < 4.5)
      )
        continue;
      if (Math.abs(x - 8) < 5 && z < -24 && z > -35) continue;
      result.push({ x, z, y: surfaceHeight(x, z), size: 0.12 + Math.pow(random(i * 17), 3) * 1.3 });
    }
    for (let i = 0; i < 22; i++) {
      const x = -30 + i * 3.3;
      if (Math.abs(x - 8) < 4.4) continue;
      const z = -28 - random(i + 43) * 3.5;
      result.push({ x, z, y: surfaceHeight(x, z), size: 1.3 + random(i + 55) * 1.3 });
    }
    // Small embedded stones break up the worked earth, with clear station aprons.
    for (let i = 0; i < 260; i++) {
      const x = -21 + random(i * 19 + 601) * 47,
        z = -24 + random(i * 29 + 703) * 45;
      if (
        workstationSites.some((s) => Math.hypot(x - s.target.targetX, z - s.target.targetZ) < 2.2)
      )
        continue;
      if (
        [
          [-11, -5, 4.5],
          [10, -7, 3.5],
          [12.5, 1.5, 3],
          [17, 8, 4],
        ].some(([bx, bz, radius]) => Math.hypot(x - bx, z - bz) < radius)
      )
        continue;
      result.push({
        x,
        z,
        y: surfaceHeight(x, z) - 0.025,
        size: 0.025 + random(i * 31) ** 2 * 0.09,
      });
    }
    return result;
  }, []);
  useLayoutEffect(() => {
    const o = new THREE.Object3D(),
      c = new THREE.Color();
    stones.forEach((s, i) => {
      o.position.set(s.x, s.y + s.size * 0.22, s.z);
      o.scale.set(s.size * 1.4, s.size * 0.85, s.size);
      o.rotation.set(random(i) * 0.4, i * 2.399, random(i + 71) * 0.3);
      o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
      c.set(["#dddace", "#b9c3c2", "#d3d3c3", "#b5bfc3"][i % 4]);
      ref.current!.setColorAt(i, c);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.instanceColor!.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [stones]);
  return (
    <instancedMesh ref={ref} args={[geometry, m.cliff, stones.length]} castShadow receiveShadow />
  );
}
function Meadow() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 9; i++) {
      const g = new THREE.BufferGeometry(),
        h = 0.22 + random(i + 43) * 0.25,
        b = 0.05 + random(i + 11) * 0.13;
      g.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
          [-0.025, 0, 0, 0.025, 0, 0, -0.016, h * 0.6, b * 0.4, 0.016, h * 0.6, b * 0.4, b, h, b],
          3,
        ),
      );
      g.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);
      g.computeVertexNormals();
      g.rotateY(i * 2.399);
      g.translate(random(i) * 0.12, 0, random(i + 12) * 0.12);
      geos.push(g);
    }
    const g = mergeGeometries(geos)!;
    geos.forEach((p) => p.dispose());
    return g;
  }, []);
  const blades = useMemo(
    () =>
      Array.from({ length: 4500 }, (_, i) => {
        const x = -68 + random(i * 3 + 7) * 135,
          z = -34 + random(i * 7 + 19) * 94;
        return { x, z, y: surfaceHeight(x, z) };
      }).filter(
        (p) =>
          (Math.abs(p.x - 2) > 23 || p.z > 20 || p.z < -26) &&
          p.y < 18 &&
          Math.abs(p.x - creekX(p.z)) > 2.6 &&
          !(Math.abs(p.z - 11) < 2.6 && p.x < -12) &&
          workstationSites.every(
            (s) => Math.hypot(p.x - s.target.targetX, p.z - s.target.targetZ) > 4,
          ),
      ),
    [],
  );
  useLayoutEffect(() => {
    const o = new THREE.Object3D(),
      c = new THREE.Color();
    blades.forEach((p, i) => {
      o.position.set(p.x, p.y, p.z);
      o.rotation.y = i * 2.399;
      o.scale.setScalar(0.5 + random(i) * 0.9);
      o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
      c.set(["#6d7443", "#707854", "#8c7850", "#596643", "#815a37"][i % 5]);
      ref.current!.setColorAt(i, c);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.instanceColor!.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [blades]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, blades.length]}>
      <meshStandardMaterial roughness={1} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}
function Creek() {
  const flow = useMemo(() => ({ value: 0 }), []);
  const geometry = useMemo(() => {
    const p: number[] = [],
      uv: number[] = [],
      ix: number[] = [];
    for (let i = 0; i <= 120; i++) {
      const z = -25 + i * 0.95,
        x = creekX(z);
      for (const side of [-1, 1]) {
        p.push(x + side * 1.1, -0.66, z);
        uv.push((side + 1) / 2, i / 8);
      }
      if (i < 120) {
        const a = i * 2;
        ix.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(ix);
    g.computeVertexNormals();
    return g;
  }, []);
  useFrame(({ clock }) => {
    flow.value = clock.elapsedTime;
  });
  return (
    <mesh name="snowmelt-creek" geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color="#456d6e"
        roughness={0.23}
        metalness={0.3}
        emissive="#6b9997"
        emissiveIntensity={0.04}
        onBeforeCompile={(shader) => {
          shader.uniforms.flowTime = flow;
          shader.vertexShader = shader.vertexShader
            .replace("#include <common>", "#include <common>\nvarying vec2 creekUv;")
            .replace("#include <begin_vertex>", "#include <begin_vertex>\ncreekUv=uv;");
          shader.fragmentShader = shader.fragmentShader
            .replace(
              "#include <common>",
              "#include <common>\nuniform float flowTime; varying vec2 creekUv;",
            )
            .replace(
              "#include <color_fragment>",
              `#include <color_fragment>
          float ripple=smoothstep(.92,1.,sin(creekUv.y*95.+flowTime*2.4+sin(creekUv.x*15.)));
          diffuseColor.rgb+=vec3(.12,.16,.15)*ripple*sin(creekUv.x*3.14159);`,
            );
        }}
      />
    </mesh>
  );
}
export function Terrain() {
  return (
    <group>
      <AlpineSky />
      <ValleyFloor />
      <Creek />
      <Forest />
      <Talus />
      <Meadow />
    </group>
  );
}
export function PathClutter() {
  const m = useMats();
  return (
    <group>
      <Boardwalk x={-27.5} z={11} len={10.5} rot={Math.PI / 2} width={3.8} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[-27.5, 0.92, 11 + side * 1.7]} material={m.woodDark}>
            <boxGeometry args={[10.6, 0.12, 0.14]} />
          </mesh>
          {[-32, -29, -26, -23].map((x) => (
            <mesh key={x} position={[x, 0.5, 11 + side * 1.7]} material={m.woodDark}>
              <boxGeometry args={[0.16, 1.2, 0.16]} />
            </mesh>
          ))}
        </group>
      ))}
      <Boardwalk x={-7.2} z={8.4} len={6} rot={1.15} width={1.85} />
      <Boardwalk x={-7.4} z={2.3} len={6.5} rot={0.1} width={1.8} />
    </group>
  );
}
