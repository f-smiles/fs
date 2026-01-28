"use client";

"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

function PortalBackgroundShader() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2() },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
precision highp float;
uniform float iTime;
uniform vec2 iResolution;
varying vec2 vUv;

mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c,s,-s,c);
}

const float pi = acos(-1.0);
const float pi2 = pi*2.0;

vec2 pmod(vec2 p, float r) {
    float a = atan(p.x, p.y) + pi/r;
    float n = pi2 / r;
    a = floor(a/n)*n;
    return p*rot(-a);
}

float box(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float ifsBox(vec3 p) {
    for (int i=0; i<5; i++) {
        p = abs(p) - 1.0;
        p.xy *= rot(iTime*0.3);
        p.xz *= rot(iTime*0.1);
    }
    p.xz *= rot(iTime);
    return box(p, vec3(0.4,0.8,0.3));
}

float map(vec3 p) {
    vec3 p1 = p;
    p1.x = mod(p1.x-5., 10.) - 5.;
    p1.y = mod(p1.y-5., 10.) - 5.;
    p1.z = mod(p1.z, 16.)-8.;
    p1.xy = pmod(p1.xy, 5.0);
    return ifsBox(p1);
}

void main() {
    vec2 fragCoord = vUv * iResolution;
    vec2 p = (fragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);

    vec3 cPos = vec3(0.0,0.0, -3.0 * iTime);
    vec3 cDir = normalize(vec3(0.0, 0.0, -1.0));
    vec3 cUp  = vec3(sin(iTime), 1.0, 0.0);
    vec3 cSide = cross(cDir, cUp);

    vec3 ray = normalize(cSide * p.x + cUp * p.y + cDir);

    float acc = 0.0;
    float acc2 = 0.0;
    float t = 0.0;
    for (int i = 0; i < 80; i++) {
        vec3 pos = cPos + ray * t;
        float dist = map(pos);
        dist = max(abs(dist), 0.02);
        float a = exp(-dist*3.0);
        if (mod(length(pos)+24.0*iTime, 30.0) < 3.0) {
            a *= 2.0;
            acc2 += a;
        }
        acc += a;
        t += dist * 0.5;
    }

    vec3 col = vec3(acc * 0.01, acc * 0.011 + acc2*0.002, acc * 0.012 + acc2*0.005);
    gl_FragColor = vec4(col, 1.0);
}
      `,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      material.uniforms.iResolution.value.set(rect.width, rect.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    let raf;
    const animate = () => {
      material.uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0" />;
}
function PortalShader() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2() },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
varying vec2 vUv;

float rand(vec2 p) {
  return fract(100.0 * sin(p.x * 8.0 + p.y));
}

void main() {
  vec2 uv = vUv * iResolution.xy;
  vec3 col = vec3(0.0);

  vec3 v = vec3(uv, 1.0) / vec3(iResolution, iResolution.x) - 0.5;
  vec3 s = 0.5 / abs(v);
  float sz = min(s.y, s.x);

  float centerDepth = 1.0 - exp(-sz * 0.35);
  centerDepth = clamp(centerDepth, 0.0, 1.0);

  vec3 grid = ceil(800.0 * sz * (s.y < s.x ? vec3(v.x, v.z, v.z) : vec3(v.z, v.y, v.z)));
  vec3 cell = fract(grid * 0.1);

  float rowIndex = grid.y;
  float rowFactor = mix(0.3, 1.0, fract(rowIndex * 0.17));

  float gravity = smoothstep(0.0, 1.0, rowIndex / 40.0);
  rowFactor *= mix(1.0, 0.4, gravity);

  float colIndex = grid.x;
  float hash = fract(sin(colIndex * 13.13) * 43758.5453);
  float speed = mix(0.15, 0.5, hash);
  float phase = fract(sin(colIndex * 91.7) * 10000.0);

  float t = iTime * speed * rowFactor + phase;

  vec3 p = vec3(9.0, floor(t * (9.0 + 8.0 * sin(colIndex))), 0.0) + grid;

  float r = rand(p.xy);

  float mask = step(0.5, r) * step(cell.x, 0.6) * step(cell.y, 0.8);
  float intensity = clamp((r / sz) * 1.4, 0.0, 1.0) * mask;

// Icy blue outer, luminous white core
vec3 iceBlue = vec3(0.65, 0.85, 1.1);   // soft icy blue
vec3 softWhite = vec3(1.1, 1.1, 1.1);   // glowing white

// Blend from blue at edges → white toward center
vec3 frost = mix(iceBlue, softWhite, centerDepth);

col = frost * intensity;
  gl_FragColor = vec4(col, 1.0);
}
      `,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      material.uniforms.iResolution.value.set(rect.width, rect.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    let raf;
    const animate = () => {
      material.uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0" />;
}
function PortalFrame({ children }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
      <div
        className="relative"
        style={{
          width: "720px",
          height: "420px",
          borderRadius: "14px",
          overflow: "hidden",
         boxShadow: 
  "0 20px 60px rgba(0,0,0,0.4),0 0 40px rgba(180,200,255,0.08)",
          background: "#000",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const SpiralShader = () => {
  const containerRef = useRef();
  const uniformsRef = useRef({});
  const requestIdRef = useRef();

  useEffect(() => {
    const container = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2() }
    };
    uniformsRef.current = uniforms;

    const vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.05;
        float lineWidth = 0.002;

        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++) {
          for(int i = 0; i < 5; i++) {
            color[j] += lineWidth * float(i * i) / abs(fract(t - 0.01 * float(j) + float(i) * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));
          }
        }

        gl_FragColor = vec4(color[0], color[1], color[2], 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const onWindowResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.resolution.value.x = renderer.domElement.width;
      uniforms.resolution.value.y = renderer.domElement.height;
    };

    window.addEventListener('resize', onWindowResize);
    onWindowResize();

    const animate = () => {
      uniforms.time.value += 0.05;
      renderer.render(scene, camera);
      requestIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(requestIdRef.current);
      window.removeEventListener('resize', onWindowResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-screen" />;
};
export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-[#2B2B2B] overflow-hidden">
    {/* <PortalShader /> */}
    {/* <SpiralShader /> */}
      <PortalFrame>
    
            <PortalBackgroundShader />
      </PortalFrame>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white">
        <p className="text-[11px] font-khteka tracking-[0.3em] uppercase opacity-60 mb-6">
          Code Unknown
        </p>

        <h1 className="text-[12px] uppercase  mb-10 font-khteka">
          This link slipped through the system.
        </h1>

<div className="absolute bottom-20">
<a
  href="/book-now"
  className="
    relative overflow-hidden
    font-khteka uppercase inline-flex items-center justify-center
    px-8 py-3 rounded-[2px]
    text-[11px] tracking-[0.2em]
    text-white
    bg-black/10 backdrop-blur-md
    border border-white/10
  before:absolute before:inset-0 before:rounded-[2px]
  before:border before:border-[rgba(180,210,255,0.7)]
  before:opacity-70 before:pointer-events-none
    group
  "
>
    {/* Top gradient glow */}
    <span className="
      pointer-events-none absolute top-0 left-0 w-full h-[1px]
      bg-gradient-to-r from-transparent via-[rgba(180,210,255,0.9)] to-transparent
      shadow-[0_0_8px_rgba(180,230,255,0.7)]
      transform -translate-x-full group-hover:translate-x-full
      transition-transform duration-1000 ease-[cubic-bezier(0.65,0,0.35,1)]
      group-hover:duration-2000
    " />

    {/* Right gradient glow */}
    <span className="
      pointer-events-none absolute top-0 right-0 h-full w-[1px]
      bg-gradient-to-b from-transparent via-[rgba(180,210,255,0.9)] to-transparent
      shadow-[0_0_8px_rgba(180,230,255,0.7)]
      transform translate-y-full group-hover:-translate-y-full
      transition-transform duration-1000 ease-[cubic-bezier(0.65,0,0.35,1)]
      delay-300 group-hover:delay-1000
      group-hover:duration-2000
    " />

    {/* Bottom gradient glow */}
    <span className="
      pointer-events-none absolute bottom-0 left-0 w-full h-[1px]
      bg-gradient-to-r from-transparent via-[rgba(180,210,255,0.9)] to-transparent
      shadow-[0_0_8px_rgba(180,230,255,0.7)]
      transform translate-x-full group-hover:-translate-x-full
      transition-transform duration-1000 ease-[cubic-bezier(0.65,0,0.35,1)]
      delay-600 group-hover:delay-2000
      group-hover:duration-2000
    " />

    {/* Left gradient glow */}
    <span className="
      pointer-events-none absolute top-0 left-0 h-full w-[1px]
      bg-gradient-to-b from-transparent via-[rgba(180,210,255,0.9)] to-transparent
      shadow-[0_0_8px_rgba(180,230,255,0.7)]
      transform -translate-y-full group-hover:translate-y-full
      transition-transform duration-1000 ease-[cubic-bezier(0.65,0,0.35,1)]
      delay-900 group-hover:delay-3000
      group-hover:duration-2000
    " />

    <span className="relative z-10">Back Home</span>
  </a>
</div>
      </div>
    </div>
  );
}