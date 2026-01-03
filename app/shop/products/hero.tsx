"use client";
import { EffectComposer, Bloom, Selection, Select, ChromaticAberration } from "@react-three/postprocessing";
import { gsap } from "gsap";
import { useRef, useEffect, useMemo } from "react";
import { useFrame, extend, useThree, Canvas } from "@react-three/fiber";
import FlutedGlassEffect from "../../../utils/glass";
import { Vector2 } from "three";
import {
  OrbitControls,
  useGLTF,
  MeshTransmissionMaterial,
  Environment,
  shaderMaterial,
  Center,
  useAnimations
} from "@react-three/drei";
import * as THREE from "three";
const GlassRingMaterial = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector2(),
  },

  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  `
   varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;

#define SLICE_SIZE 0.05
#define STRENGTH 0.05

vec3 sdfCircle(vec2 uv, float r) {
  float d = length(uv) - r;
  return vec3(smoothstep(0.01, 0.015, d)) * -1.0;
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;
uv *= 1.5;
  vec2 fv = uv;
  fv.x = fract(uv.x / SLICE_SIZE);
  uv.x += tan(uTime * 0.5 + fv.x * STRENGTH) / 5.0;

vec3 col = vec3(1.0); // white base
  float brightness = 0.85;

  col += sdfCircle(uv, 0.3) * brightness;
  col -= sdfCircle(uv, 0.18) * brightness;

  vec3 glass = vec3(abs(fv.x));
  col += glass * 0.1;

  col *= vec3(0.8, 0.6, 1.0);

float alpha = smoothstep(0.0, 0.15, length(col));
gl_FragColor = vec4(col, alpha);
}
  `
);

extend({ GlassRingMaterial });


const GradientMaterial = shaderMaterial(
  {},
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    varying vec2 vUv;
    void main() {
      // Purple (#8B5CF6) at top → Teal/Cyan (#5EEAD4) at bottom
   vec3 topColor = vec3(0.663, 0.678, 0.765); // #A9ADC3
      vec3 bottomColor = vec3(0.369, 0.918, 0.831); 

      float mixValue = vUv.y; // 0 at bottom, 1 at top
      vec3 color = mix(bottomColor, topColor, mixValue);

gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // pure red
    }
  `
);

extend({ GradientMaterial });

function ShaderScene() {
  const ringRef = useRef();
  const { viewport } = useThree(); 

  useFrame(({ clock, size }) => {
    if (ringRef.current) {
      ringRef.current.uTime = clock.getElapsedTime();
      ringRef.current.uResolution.set(size.width, size.height);
    }
  });

  return (
    <>

      <mesh scale={[viewport.width, viewport.height, 1]} position={[0, 0, -1]}>
        <planeGeometry args={[1, 1]} />
        <gradientMaterial />
      </mesh>


      <mesh scale={[viewport.width, viewport.height, 1]}>
        <planeGeometry args={[1, 1]} />
<glassRingMaterial
  ref={ringRef}
  transparent
  depthWrite={false}
/>
      </mesh>
    </>
  );
}

const Marquee = () => {
  const text =
    "Reserve an appointment to experience our year end holiday courtesy of up to 700 dollars off full treatment";
  const repeatCount = 12;

  return (
    <div className="relative w-full overflow-hidden bg-[#F0EF59]">
      <div className="marquee">
<div className="marquee__group">
  {Array.from({ length: repeatCount }).map((_, i) => (
    <div
      key={`a-${i}`}
      className="flex items-center"
    >
      <span className="px-6 py-2 text-[12px] font-neuehaas45 whitespace-nowrap tracking-wide">
        {text}
      </span>


<span className="mx-4 text-[12px] font-light opacity-70">+</span>
    </div>
  ))}
</div>

<div className="marquee__group">
  {Array.from({ length: repeatCount }).map((_, i) => (
    <div
      key={`a-${i}`}
      className="flex items-center"
    >
      <span className="px-6 py-2 text-[12px] font-neuehaas45 whitespace-nowrap tracking-wide">
        {text}
      </span>


<span className="mx-4 text-[12px] font-light opacity-70">+</span>
    </div>
  ))}
</div>
      </div>
    </div>
  );
};


function DentalModel() {
  const { scene, animations } = useGLTF("/models/art_gallery_test.glb");
  const animatedRef = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, animatedRef);


  useEffect(() => {
    console.log("end mesh");
scene.traverse((child: any) => {
  if (!child.isMesh || !child.material) return;

  const mat = child.material as THREE.MeshStandardMaterial;

  if (mat.name.includes("Wall")) {
    mat.color.set("#f2f2f2");
    mat.roughness = 0.9;
  }

  if (mat.name.includes("Floor")) {
    mat.color.set("#e6e6e6");
    mat.roughness = 0.6;
  }

  if (mat.name.includes("Ceiling")) {
    mat.color.set("#fafafa");
    mat.roughness = 1.0;
  }

  mat.needsUpdate = true;
});

    console.log("end mesh");
  }, [scene]);


useEffect(() => {
  const tl = gsap.timeline({ delay: 1 });

  tl.from(".line-inner", {
    y: 100,
    skewY: 7,
    duration: 1.8,
    ease: "power4.out",
    stagger: 0.15
  });
}, []);
  useEffect(() => {
    if (!actions) return;

    const firstAction = Object.values(actions)[0];
    if (!firstAction) return;

    firstAction.reset();
    firstAction.setLoop(THREE.LoopRepeat, Infinity);
    firstAction.play();

    return () => firstAction.stop();
  }, [actions]);

  return (
    <group rotation={[0, 0, 0]} scale={1}>
      <group ref={animatedRef}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
const Hero: React.FC = () => {

  return (
    <section> 

      {/* <Marquee /> */}

      {/* <AnimatedBackground /> */}
<div className="relative min-h-screen">
<div className="w-full h-screen bg-black"> 
  <Canvas orthographic camera={{ zoom: 300, position: [0, 0, 100] }}>
    <ShaderScene />
  </Canvas>
</div>

<section className="grid grid-cols-1 lg:grid-cols-2 min-h-screen px-6 py-20">

<Canvas camera={{ position: [4, 3, 6], fov: 45 }}>
  <Environment files="/images/studio_small_03_4k.hdr" />


<ambientLight intensity={0.4} />

<directionalLight
  position={[5, 8, 5]}
  intensity={1.2}
  castShadow
/>

<directionalLight
  position={[-5, 4, -5]}
  intensity={0.6}
/>


  <DentalModel />

  <OrbitControls enableZoom={false} enablePan={false} />
</Canvas>

<div className="flex items-center justify-center text-center lg:text-left">
<div className="text-gsap-contain">
  <h1 className="text-[clamp(24px,3vw,32px)] font-neuehaas35">
    <div className="gsap-line">
      <span className="line-inner">
        <span className="font-canelathin">shop</span> your smile.
      </span>
    </div>

    <div className="gsap-line">
      <span className="line-inner">
        buy something — or <span className="font-canelathin">don’t</span>.
      </span>
    </div>

    <div className="gsap-line">
      <span className="line-inner">
        just don't forget to floss.
      </span>
    </div>
  </h1>
</div>
</div>
</section>
</div>
    </section>
  );
};

const AnimatedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }

    const vsSource = `#version 300 es
      in vec2 a_position;
      out vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = (a_position + 1.0) / 2.0;
      }`;

    const fsSource = `#version 300 es
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
in vec2 v_texCoord;
out vec4 fragColor;

float psrdnoise(vec2 x, vec2 period, float alpha, out vec2 gradient) {
  vec2 uv = vec2(x.x + x.y*0.5, x.y);
  vec2 i0 = floor(uv);
  vec2 f0 = fract(uv);
  float cmp = step(f0.y, f0.x);
  vec2 o1 = vec2(cmp, 1.0-cmp);
  vec2 i1 = i0 + o1;
  vec2 i2 = i0 + vec2(1.0, 1.0);
  vec2 v0 = vec2(i0.x - i0.y * 0.5, i0.y);
  vec2 v1 = vec2(v0.x + o1.x - o1.y * 0.5, v0.y + o1.y);
  vec2 v2 = vec2(v0.x + 0.5, v0.y + 1.0);
  vec2 x0 = x - v0;
  vec2 x1 = x - v1;
  vec2 x2 = x - v2;
  vec3 iu, iv, xw, yw;
  if(any(greaterThan(period, vec2(0.0)))) {
    xw = vec3(v0.x, v1.x, v2.x);
    yw = vec3(v0.y, v1.y, v2.y);
    if(period.x > 0.0) xw = mod(vec3(v0.x, v1.x, v2.x), period.x);
    if(period.y > 0.0) yw = mod(vec3(v0.y, v1.y, v2.y), period.y);
    iu = floor(xw + 0.5*yw + 0.5);
    iv = floor(yw + 0.5);
  } else {
    iu = vec3(i0.x, i1.x, i2.x);
    iv = vec3(i0.y, i1.y, i2.y);
  }
  vec3 hash = mod(iu, 289.0);
  hash = mod((hash*51.0 + 2.0)*hash + iv, 289.0);
  hash = mod((hash*34.0 + 10.0)*hash, 289.0);
  vec3 psi = hash * 0.07482 + alpha;
  vec3 gx = cos(psi);
  vec3 gy = sin(psi);
  vec2 g0 = vec2(gx.x, gy.x);
  vec2 g1 = vec2(gx.y, gy.y);
  vec2 g2 = vec2(gx.z, gy.z);
  vec3 w = 0.8 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2));
  w = max(w, 0.0);
  vec3 w2 = w*w;
  vec3 w4 = w2*w2;
  vec3 gdotx = vec3(dot(g0,x0), dot(g1,x1), dot(g2,x2));
  float n = dot(w4,gdotx);
  vec3 w3 = w2*w;
  vec3 dw = -8.0*w3*gdotx;
  vec2 dn0 = w4.x*g0 + dw.x*x0;
  vec2 dn1 = w4.y*g1 + dw.y*x1;
  vec2 dn2 = w4.z*g2 + dw.z*x2;
  gradient = 10.9*(dn0 + dn1 + dn2);
  return 10.9*n;
}

#define PI 3.1415926535897932384626433832795

float bounceOut(in float t) {
  const float a = 4.0 / 11.0;
  const float b = 8.0 / 11.0;
  const float c = 9.0 / 10.0;
  const float ca = 4356.0 / 361.0;
  const float cb = 35442.0 / 1805.0;
  const float cc = 16061.0 / 1805.0;
  float t2 = t * t;
  return t < a
    ? 7.5625 * t2
    : t < b
      ? 9.075 * t2 - 9.9 * t + 3.4
      : t < c
        ? ca * t2 - cb * t + cc
        : 10.8 * t * t - 20.52 * t + 10.72;
}
float bounceIn(in float t) { return 1.0 - bounceOut(1.0 - t); }

vec2 rot(vec2 v, float a){
  return mat2(cos(a), -sin(a), sin(a), cos(a)) * v;
}

void main() {
  vec2 fragCoord = v_texCoord * iResolution.xy;
  vec2 uv = fragCoord / iResolution.xy;
  vec2 st = uv * vec2(iResolution.x / iResolution.y, 1.0);

  st = rot(st, -PI / 10.0);

  vec2 mouse = iMouse.xy / iResolution.xy;


  vec2 gradient;
  float n = psrdnoise(st * 1.2, vec2(0.0), 0.2 * iTime + mouse.y * PI, gradient);


  float lines = cos((st.x * 0.3 + n * 0.25 + mouse.x + 0.2) * PI);


vec3 colorA = vec3(.92, .95, 1.0);     
vec3 colorB = vec3(0.4, 0.6, 1.0);   


  float wave = bounceIn(lines * 0.5 + 0.5);
float fade = smoothstep(0.0, 1.0, uv.x);


float blueBase = 0.15;

// final blend
float mixAmt = blueBase + wave * fade * 0.6;

vec3 col = mix(colorA, colorB, mixAmt);

  fragColor = vec4(col, 1.0);
}
`;

    const createShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iTimeLoc = gl.getUniformLocation(program, 'iTime');
    const iResLoc = gl.getUniformLocation(program, 'iResolution');
    const iMouseLoc = gl.getUniformLocation(program, 'iMouse');

    const resizeCanvas = () => {
      const { clientWidth, clientHeight } = canvas;
      canvas.width = clientWidth;
      canvas.height = clientHeight;
      gl.viewport(0, 0, clientWidth, clientHeight);
      gl.uniform3f(iResLoc, clientWidth, clientHeight, 1.0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let startTime = Date.now();
    const animate = () => {
      const currentTime = (Date.now() - startTime) / 1000;
      gl.uniform1f(iTimeLoc, currentTime);
      gl.uniform4f(iMouseLoc, 0.0, 0.0, 0.0, 0.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};


export default Hero;