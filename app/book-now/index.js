"use client";
import Link from "next/link";
import MouseTrail from "../book-now/mouse.jsx";
import { createPortal } from "react-dom";
import { Renderer, Program, Mesh, Plane, Uniform } from "wtc-gl";
import { Vec2, Mat2 } from "wtc-math";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import React, { useRef, useEffect, useState, useMemo, useLayoutEffect, Suspense, useCallback } from "react";
import { motion } from "framer-motion";
import "tw-elements";
import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import ScrollTrigger from "gsap/ScrollTrigger";
import {Environment, Text, OrbitControls, useGLTF, Center, useAnimations } from "@react-three/drei";

import { useThree, useFrame, extend, Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { NormalBlending } from 'three';
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { SplitText } from 'gsap/SplitText';
import { AnimatePresence } from "framer-motion";

gsap.registerPlugin(MorphSVGPlugin, ScrollTrigger, ScrambleTextPlugin, SplitText);
function StormySkyWithLightning() {
  const groupRef = useRef();

  const rotatingCloudsRef = useRef();

  const ambientRef = useRef();

  const dirRef = useRef();

  const hemiRef = useRef();

  const flashRef = useRef();

  const lightningIntensity = useRef(0);

  const lightningCooldown = useRef(0);

  const stormConfig = useMemo(
    () => ({
      seed: 2,
      segments: 24,
      volume: 8,
      opacity: 0.95,
      fade: 14,
      growth: 5,
      speed: 0.12,
    }),

    [],
  );

  const random = useMemo(() => {
  const rand = (min, max) => min + Math.random() * (max - min);

  return {
    groupRotY: rand(0, Math.PI * 2),
    groupRotX: rand(-0.2, 0.2),

    mainSeed: Math.random() * 100,
    secondarySeed: Math.random() * 100,
    upperSeed: Math.random() * 100,

    offsetX: rand(-1.5, 1.5),
    offsetY: rand(-0.5, 0.5),
    offsetZ: rand(-1, 1),
  };
}, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

if (groupRef.current) {
  groupRef.current.rotation.y =
    random.groupRotY + Math.cos(t * 0.05) * 0.04;

  groupRef.current.rotation.x =
    random.groupRotX + Math.sin(t * 0.03) * 0.02;
}

    if (rotatingCloudsRef.current) {
      rotatingCloudsRef.current.rotation.y -= delta * 0.04;
    }


    lightningCooldown.current -= delta;

    if (lightningCooldown.current <= 0 && Math.random() < 0.015) {
      lightningIntensity.current = 1;

      lightningCooldown.current = 1.5 + Math.random() * 3.0;
    }



    lightningIntensity.current = Math.max(
      0,

      lightningIntensity.current - delta * 3.2,
    );

    const flash = lightningIntensity.current;


    if (ambientRef.current) {
      ambientRef.current.intensity = MathUtils.lerp(
        ambientRef.current.intensity,

        0.18 + flash * 0.35,

        0.12,
      );

      ambientRef.current.color.lerp(
        new Color(flash > 0.05 ? "#fff1d6" : "#2a221c"),

        0.12,
      );
    }

    if (hemiRef.current) {
      hemiRef.current.intensity = MathUtils.lerp(
        hemiRef.current.intensity,

        0.55 + flash * 0.35,

        0.12,
      );

      hemiRef.current.color.lerp(new Color("#ffe6bf"), 0.1);

      hemiRef.current.groundColor.lerp(new Color("#120d0a"), 0.1); 
    }

    if (dirRef.current) {
      dirRef.current.intensity = MathUtils.lerp(
        dirRef.current.intensity,

        0.3 + flash * 0.2,

        0.12,
      );

      dirRef.current.color.lerp(new Color("#ffd9a3"), 0.1);
    }


    if (flashRef.current) {
      flashRef.current.intensity = MathUtils.lerp(
        flashRef.current.intensity,

        flash * 10,

        0.18,
      );

      flashRef.current.color.lerp(new Color("#fff5df"), 0.18);
    }
  });

  return (
    <>
      <color attach="background" args={["#f2e6cf"]} />
      <fog attach="fog" args={["#e2d4bb", 10, 32]} />


      <ambientLight ref={ambientRef} intensity={0.18} color="#2a221c" />

      <hemisphereLight ref={hemiRef} args={["#ffe6bf", "#e9c4ad", 0.55]} />

      <directionalLight
        ref={dirRef}
        position={[-6, 8, -4]}
        intensity={0.3}
        color="#ffd9a3"
      />


      <pointLight
        ref={flashRef}
        position={[1, -1.5, -2]}
        intensity={0}
        distance={18}
        decay={2}
        color="#fff5df"
      />

      <group ref={groupRef}>

<Clouds
  ref={rotatingCloudsRef}
  {...stormConfig}
  seed={random.mainSeed}
  bounds={[8, 2, 8]}
  position={[
    random.offsetX * 0.5,
    -4.7 + random.offsetY,
    -3 + random.offsetZ,
  ]}
  color="#dbd0d0"
>
          <Cloud
            {...stormConfig}
            bounds={[8, 2, 8]}
            color="#eadcdc"
            opacity={0.98}
          />

          <Cloud
            concentrate="outside"
            growth={90}
            color="#171717"
            opacity={0.95}
            seed={0.4}
            bounds={120}
            volume={120}
          />
        </Clouds>


        <Clouds
       seed={random.secondarySeed}
          segments={28}
          volume={7}
          opacity={0.95}
          fade={12}
          growth={5}
          speed={0.08}
          bounds={[7, 1.5, 7]}
        position={[
  3.5 + random.offsetX,
  -4.2 + random.offsetY,
  -4.5 + random.offsetZ,
]}
          color="#0d0d0d"
        />


        <Clouds
       seed={random.upperSeed}
          segments={26}
          volume={6}
          opacity={0.92}
          fade={10}
          growth={4}
          speed={0.06}
          bounds={[6, 1.2, 5]}
          position={[2.5, -1.8, -5]}
          color="#141414"
        />
      </group>
    </>
  );
}

extend({ OrbitControls, EffectComposer });

const ParticleSystem = () => {

  const isMobile = useMemo(() => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
  }, []);
  
  const particlesCount = isMobile ? 20000 : 27000;
  const mouseRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const particlesRef = useRef();
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const isTouchingRef = useRef(false);

  const positions = useMemo(() => new Float32Array(particlesCount * 3), []);
  const velocities = useMemo(() => new Float32Array(particlesCount * 3), []);


  const speedMultiplier = isMobile ? 1.0 : 0.5;

  const createSphere = (count, radius) => {
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random());

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      velocities[i * 3] = (Math.random() - 0.5) * 0.45 * speedMultiplier;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.45 * speedMultiplier;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.45 * speedMultiplier;
    }
  };

  useEffect(() => {
    createSphere(particlesCount, 400);
    if (particlesRef.current) {
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  }, [speedMultiplier]);

  const { gl } = useThree();

  useEffect(() => {
    const canvasEl = gl.domElement;
    
    const handleMove = (e) => {
      e.preventDefault();
      
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const rect = canvasEl.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      
      const dt = 1 / 60;
      const vx = (x - lastMousePosRef.current.x) / dt;
      const vy = (y - lastMousePosRef.current.y) / dt;
      
      const maxMouseVel = isMobile ? 30 : 15;
      mouseRef.current.vx = Math.min(Math.max(vx, -maxMouseVel), maxMouseVel);
      mouseRef.current.vy = Math.min(Math.max(vy, -maxMouseVel), maxMouseVel);
      mouseRef.current.x = x;
      mouseRef.current.y = y;
      lastMousePosRef.current.x = x;
      lastMousePosRef.current.y = y;
    };
    
    const handleStart = (e) => {
      e.preventDefault();
      isTouchingRef.current = true;
      
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const rect = canvasEl.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      
      mouseRef.current.x = x;
      mouseRef.current.y = y;
      lastMousePosRef.current.x = x;
      lastMousePosRef.current.y = y;
      mouseRef.current.vx = 0;
      mouseRef.current.vy = 0;
    };
    
    const handleEnd = () => {
      isTouchingRef.current = false;
      setTimeout(() => {
        if (!isTouchingRef.current) {
          const decay = isMobile ? 0.95 : 0.98;
          mouseRef.current.vx *= decay;
          mouseRef.current.vy *= decay;
        }
      }, 100);
    };
    
    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerdown", handleStart);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
    
    canvasEl.addEventListener("touchmove", handleMove, { passive: false });
    canvasEl.addEventListener("touchstart", handleStart);
    canvasEl.addEventListener("touchend", handleEnd);
    canvasEl.addEventListener("touchcancel", handleEnd);
    
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerdown", handleStart);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
      canvasEl.removeEventListener("touchmove", handleMove);
      canvasEl.removeEventListener("touchstart", handleStart);
      canvasEl.removeEventListener("touchend", handleEnd);
      canvasEl.removeEventListener("touchcancel", handleEnd);
    };
  }, [gl, isMobile]);

  useFrame(() => {
    if (!particlesRef.current) return;
    
    const pos = particlesRef.current.geometry.attributes.position.array;
    const RADIUS = 400;
    
    const MOUSE_RADIUS = isMobile ? 150 : 120;
    const MOUSE_STRENGTH = isMobile ? 0.035 : 0.018;
    const MOMENTUM_FACTOR = isMobile ? 0.15 : 0.08;
    const BOUNDARY_DAMPING = isMobile ? 0.92 : 0.94;
    const RANDOM_IMPULSE_FREQ = isMobile ? 0.008 : 0.006;
    const RANDOM_IMPULSE_STRENGTH = isMobile ? 0.12 : 0.08;
    const MAX_VEL = isMobile ? 1.2 : 0.8;
    
    if (!isTouchingRef.current) {
      mouseRef.current.vx *= 0.98;
      mouseRef.current.vy *= 0.98;
    }
    
    for (let i = 0; i < pos.length; i += 3) {

      pos[i] += velocities[i];
      pos[i + 1] += velocities[i + 1];
      pos[i + 2] += velocities[i + 2];
      
      const x = pos[i];
      const y = pos[i + 1];
      const z = pos[i + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      
      if (dist > RADIUS) {
        const nx = x / dist;
        const ny = y / dist;
        const nz = z / dist;
        
        pos[i] = nx * RADIUS;
        pos[i + 1] = ny * RADIUS;
        pos[i + 2] = nz * RADIUS;
        
        const dot = velocities[i] * nx + velocities[i + 1] * ny + velocities[i + 2] * nz;
        
        velocities[i] -= 2 * dot * nx;
        velocities[i + 1] -= 2 * dot * ny;
        velocities[i + 2] -= 2 * dot * nz;
        

        velocities[i] *= BOUNDARY_DAMPING;
        velocities[i + 1] *= BOUNDARY_DAMPING;
        velocities[i + 2] *= BOUNDARY_DAMPING;
      }
      
      const dx = mouseRef.current.x - x;
      const dy = -mouseRef.current.y - y;
      const distanceSq = dx * dx + dy * dy;
      const radiusSq = MOUSE_RADIUS * MOUSE_RADIUS;
      
      if (distanceSq > 0 && distanceSq < radiusSq) {
        const distance = Math.sqrt(distanceSq);
        const force = (1 - distance / MOUSE_RADIUS) * MOUSE_STRENGTH;
        const invDistance = 1 / distance;
        
        velocities[i] -= dx * invDistance * force;
        velocities[i + 1] -= dy * invDistance * force;
        
        const momentumForce = force * MOMENTUM_FACTOR;
        velocities[i] += mouseRef.current.vx * momentumForce * 0.5;
        velocities[i + 1] += mouseRef.current.vy * momentumForce * 0.5;
      }
      

      if (Math.random() < RANDOM_IMPULSE_FREQ) {
        velocities[i] += (Math.random() - 0.5) * RANDOM_IMPULSE_STRENGTH;
        velocities[i + 1] += (Math.random() - 0.5) * RANDOM_IMPULSE_STRENGTH;
        velocities[i + 2] += (Math.random() - 0.5) * RANDOM_IMPULSE_STRENGTH;
        
        velocities[i] = Math.min(Math.max(velocities[i], -MAX_VEL), MAX_VEL);
        velocities[i + 1] = Math.min(Math.max(velocities[i + 1], -MAX_VEL), MAX_VEL);
        velocities[i + 2] = Math.min(Math.max(velocities[i + 2], -MAX_VEL), MAX_VEL);
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={particlesCount}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={0xff33cc}
        size={isMobile ? 2.6 : 2.2}
        sizeAttenuation
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={NormalBlending}
      />
    </points>
  );
};

const ParticleScene = () => {
  return (
    <>
      <ParticleSystem />
      {/* <OrbitControls 
        enableDamping 
        dampingFactor={0.25} 
        screenSpacePanning={false} 
        maxPolarAngle={Math.PI / 2} 
      /> */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0}
          luminanceSmoothing={0.9}
          intensity={1.5}
          height={300}
        />
      </EffectComposer>
    </>
  );
};

const ScrambleText = ({
  text,
  className,
  scrambleOnLoad = true,
  charsType = "default", // 'default' | 'numbers' | 'letters'
}) => {
  const scrambleRef = useRef(null);
  const originalText = useRef(text);

  const charSets = {
    default: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    numbers: "0123456789",
    letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  };

  const scrambleAnimation = () => {
    return gsap.to(scrambleRef.current, {
      duration: 0.8,
      scrambleText: {
        text: originalText.current,
        characters: charSets[charsType],
        speed: 1,
        revealDelay: 0.1,
        delimiter: "",
        tweenLength: false,
      },
      ease: "power1.out",
    });
  };

  useEffect(() => {
    const element = scrambleRef.current;
    if (!element) return;

    if (scrambleOnLoad) {
      gsap.set(element, {
        scrambleText: {
          text: originalText.current,
          chars: charSets[charsType],
          revealDelay: 0.5,
        },
      });
      scrambleAnimation();
    }

    const handleMouseEnter = () => scrambleAnimation();
    element.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [scrambleOnLoad, charsType]);

  return (
   <span
  ref={scrambleRef}
  className={`scramble-text inline-block ${className || ""}`}
  style={{ minWidth: `${text.length}ch` }}
>
  {text}
</span>
  );
};

const RaymarchingShader = () => {
  const meshRef = useRef();
  const { size, viewport } = useThree();
  

  const uniforms = React.useMemo(() => ({
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(size.width, size.height) },
    mouse: { value: new THREE.Vector2(0, 0) }
  }), []);


  useEffect(() => {
    uniforms.resolution.value.set(size.width, size.height);
  }, [size]);

  useFrame(({ clock }) => {
    uniforms.time.value = clock.getElapsedTime();
  });


  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;


  const fragmentShader = `
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
varying vec2 vUv;

void main() {
  vec2 uv = (2.0 * vUv - 1.0) * vec2(resolution.x / resolution.y, 1.0);
  float PI = 3.1415926535;

  float wave = sin((uv.x + uv.y - time * 0.25) * PI * 0.4);


  float subtleShift = 0.05 * sin((uv.x + uv.y + time * 0.1) * PI * 0.8);

  float combined = wave + subtleShift;

  float band = smoothstep(-0.6, 0.6, combined);

  vec3 darkest = vec3(0.78);
  vec3 midtone = vec3(0.88);
  vec3 highlight = vec3(0.98);

  vec3 color = mix(darkest, midtone, band);
  color = mix(color, highlight, pow(band, 2.0));

  gl_FragColor = vec4(color, 1.0);
}

  `;

  return (
<mesh ref={meshRef}>
  <planeGeometry args={[viewport.width, viewport.height]} />
  <shaderMaterial
    uniforms={uniforms}
    vertexShader={vertexShader}
    fragmentShader={fragmentShader}
  />
</mesh>

  );
};

function ShaderBackground() {
  const materialRef = useRef();
  const { size } = useThree();

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.iTime.value = clock.getElapsedTime();
    materialRef.current.uniforms.iResolution.value.set(size.width, size.height, 1);
  });

return (
  <mesh>
    <planeGeometry args={[2, 2]} />
    <shaderMaterial
      ref={materialRef}
      uniforms={{
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector3() }
      }}
      fragmentShader={fragmentShader}
      vertexShader={vertexShader}
    />
  </mesh>
);
}

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
#define S(a,b,t) smoothstep(a,b,t)
precision mediump float;

uniform float iTime;
uniform vec3 iResolution;
varying vec2 vUv;

mat2 Rot(float a)
{
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

vec2 hash( vec2 p )
{
    p = vec2( dot(p,vec2(2127.1,81.17)), dot(p,vec2(1269.5,283.37)) );
    return fract(sin(p)*43758.5453);
}

float noise( in vec2 p )
{
    vec2 i = floor( p );
    vec2 f = fract( p );
    vec2 u = f*f*(3.0-2.0*f);

    float n = mix( mix( dot( -1.0+2.0*hash( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                        dot( -1.0+2.0*hash( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                   mix( dot( -1.0+2.0*hash( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                        dot( -1.0+2.0*hash( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);

    return 0.5 + 0.5*n;
}

void main() {
    vec2 fragCoord = vec2(vUv.x * iResolution.x, vUv.y * iResolution.y);
    vec2 uv = fragCoord / iResolution.xy;

    float ratio = iResolution.x / iResolution.y;
    vec2 tuv = uv - 0.5;

    float degree = noise(vec2(iTime*.1, tuv.x*tuv.y));
    tuv.y *= 1.0 / ratio;
    tuv *= Rot(radians((degree - .5) * 720. + 60.0));
    tuv.y *= ratio;

    // --- Soft wave drifting ---
    float frequency = 2.;
    float amplitude = 35.;
    float speed = iTime * 3.;

    tuv.x += sin(tuv.y * frequency + speed) / amplitude;
    tuv.y += sin(tuv.x * (frequency * 1.4) + speed) / (amplitude * .5);

vec3 cold1 = vec3(0.86, 0.87, 0.94);
vec3 cold2 = vec3(0.75, 0.76, 0.84);
vec3 cold3 = vec3(0.66, 0.67, 0.73);

vec3 warm1 = vec3(1.00, 0.55, 0.85); 
vec3 warm2 = vec3(0.95, 0.72, 1.00); 

// vec3 warm1 = vec3(1.00, 0.55, 0.85); // hot pink
// vec3 warm2 = vec3(0.95, 0.69, 1.00); // lavender pink

    vec3 layer1 = mix(cold1, cold2, S(-0.5, 0.3, (tuv * Rot(radians(-5.))).x));
    layer1 = mix(layer1, cold3, S(-0.1, 0.7, (tuv * Rot(radians(-5.))).x));

    vec3 layer2 = mix(cold2, cold3, S(-0.8, 0.2, (tuv * Rot(radians(-5.))).x));
    layer2 = mix(layer2, cold1, S(-0.2, 0.9, (tuv * Rot(radians(-5.))).x));


    float dist = length(tuv * vec2(1.2, 1.0));
    float glow = smoothstep(0.7, 0.0, dist);    // soft radial falloff
    glow = pow(glow, 1.8);                     // softer edge

    vec3 warmGlow = mix(warm1, warm2, glow);


vec3 base = mix(layer1, layer2, S(.6, -.4, tuv.y));
vec3 col = mix(base, warmGlow, glow * 1.3);

col = mix(col, vec3(0.98, 0.97, 1.0), 0.05);

gl_FragColor = vec4(col, 1.0);
}
`;


const CopyButton = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const el = document.createElement("textarea");
    el.style.position = "fixed";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    el.style.zIndex = "-9999";

    textareaRef.current = el;
    document.body.appendChild(el);

    return () => {
      if (document.body.contains(el)) {
        document.body.removeChild(el);
      }
    };
  }, []);

  const handleCopy = async () => {
    let success = false;

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {}
    }

    if (!success && textareaRef.current) {
      const el = textareaRef.current;
      el.value = text;
      el.setSelectionRange(0, text.length);
      success = document.execCommand("copy");
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="relative w-[280px] h-[48px] rounded-md overflow-hidden group"
    >

      <div className="absolute inset-0 p-px bg-neutral-600 rounded-md overflow-hidden">
        <div className="glowing-border absolute inset-0 w-[90px] h-[90px]"></div>
      </div>


      <div className="absolute inset-[1px] bg-black rounded-md flex items-center justify-center text-[12px] tracking-wider">
        <span
          className={`transition-opacity duration-300 ${
            copied ? "opacity-0" : "opacity-100"
          }`}
        >
          {label}
        </span>

        <span
          className={`absolute transition-opacity duration-300 ${
            copied ? "opacity-100" : "opacity-0"
          }`}
        >
          COPIED
        </span>
      </div>
    </button>
  );
};
const AnimatedText = ({ 
  text, 
  className = "",
  as: Component = "span",
  splitType = "chars,words",
  animationDistance = -100,
  staggerAmount = 0.4,
  ease = "power4.inOut",
  textShadow = true,
  onClick, 

}) => {
  const textRef = useRef(null);
  const splitRef = useRef(null);
  const charsRef = useRef(null);

  useEffect(() => {
 
    splitRef.current = new SplitText(textRef.current, {
      type: splitType,
      wordsClass: "overflow-hidden"
    });


    charsRef.current = splitRef.current.chars;

  
    return () => {
      if (splitRef.current) {
        splitRef.current.revert();
      }
    };
  }, [text, splitType]); 

  const handleMouseEnter = () => {
    if (!charsRef.current) return;
    
    gsap.to(charsRef.current, {
      yPercent: animationDistance,
      ease: ease,
      stagger: {
        amount: staggerAmount,
        from: "random"
      }
    });
  };

  const handleMouseLeave = () => {
    if (!charsRef.current) return;
    
    gsap.to(charsRef.current, {
      yPercent: 0,
      ease: ease,
      stagger: {
        amount: staggerAmount,
        from: "random"
      },
      overwrite: true
    });
  };

  const textShadowStyle = textShadow ? { textShadow: '0 1em' } : {};

  return (
    <Component
      ref={textRef}
      className={className}
      style={textShadowStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick} 

    >
      {text}
    </Component>
  );
};
export default function BookNow() {
  
  const fadeUpMaskedVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: {
      y: "0%",
      opacity: 1,
      transition: {
        duration: 1,
        ease: "easeOut",
        transition: { duration: 1, ease: "easeOut", delay: 2 },
      },
    },
  };

  const contentRef = useRef(null);


  const cardsectionRef = useRef(null);
  const [linesComplete, setLinesComplete] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isEmailHovered, setIsEmailHovered] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }
  }, []);


const containerOneRef = useRef(null);
  const h1Ref = useRef(null);

useEffect(() => {
 if (typeof window === "undefined" || !h1Ref.current) return;

  const split = new SplitText(h1Ref.current, { types: "chars" });
  const chars = split.chars;


  gsap.set(chars, {
    y: 100,
    rotation: 2,    
    opacity: 0,
    force3D: true
  });

  gsap.to(chars, {
    y: 0,
    rotation: 0,
    opacity: 1,
    duration: 1,    
    ease: "power3.inOut",
    stagger: 0.1,   
  });

  return () => split.revert();
}, []);

const [open, setOpen] = useState(false);

useEffect(() => {
  if (open) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
}, [open]);
  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  };

  const [errors, setErrors] = useState({});
const handleSubmit = async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const res = await fetch("/api/apply", {
    method: "POST",
    body: formData, 
  });

  if (res.ok) {
    alert("Application submitted successfully!");
    form.reset();
    setResumeName("");
  } else {
    alert("Something went wrong. Please try again.");
  }
};

const [resumeName, setResumeName] = useState("");
const [time, setTime] = useState("");

useEffect(() => {
  const update = () => {
    const now = new Date();
    setTime(now.toLocaleTimeString("en-GB", { hour12: false }));
  };

  update();
  const interval = setInterval(update, 1000);
  return () => clearInterval(interval);
}, []);

const [showScheduler, setShowScheduler] = useState(false)
  return (
    <>
    {/* <div style={{height: '100vh', width: '100vw'}}>
<Canvas camera={{ position: [0, 1.5, 4], fov: 45 }}>
  <ambientLight intensity={0.5} />

  <directionalLight position={[4, 6, 4]} intensity={1.4} />
  <directionalLight position={[-3, 2, 2]} intensity={0.9} color="#fff4ee" />
  <directionalLight position={[0, 3, -6]} intensity={1.1} />

  <Environment files='/images/studio_small_03_4k.hdr' />

  <Suspense fallback={null}>
    <PortalJourneyModel position={[0, -0.6, 0]} scale={0.5} />
  </Suspense>
</Canvas>
    </div> */}

<App />

 {/* <div className="absolute inset-0 -z-10">
    <Canvas
      orthographic
      camera={{ zoom: 1, position: [0, 0, 1] }}
      className="w-full h-full"
    >
      <ShaderBackground />
    </Canvas>
  </div>

<div className="flex flex-col lg:flex-row w-full h-screen">
            <div className="w-1/2 relative h-screen">
              <Canvas
                camera={{ position: [0, 0, 1000], fov: 75 }}
                gl={{ alpha: true }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 0,
                }}
              >
                <Scene />
              </Canvas>

              <div className="relative z-10 flex flex-col justify-center h-full items-center">
                <div className="flex flex-col gap-6 text-sm uppercase">
                  <p className="text-[11px] text-white  uppercase font-ibmplex">
                    // Contact Us
                  </p>
                  <div>
<p className="text-[11px] text-white mb-1 font-ibmplex uppercase">
  <span className="block">
    <ScrambleText text="GENERAL" />
  </span>
</p>
                    <p className="text-[11px] text-white leading-[1.6] font-ibmplex">
                       <span className="block">
                      <ScrambleText text="info@freysmiles.com" />
                   </span>
                    </p>
                   <p className="text-[11px] text-white leading-[1.6] font-ibmplex">
                     <span className="block">
                                    <ScrambleText text="(610)437-4748" charsType="numbers" />
                     </span>
             
                           </p>
              
                  </div>

                  <div>
                    <p className="text-[11px] text-white mb-1 font-ibmplex uppercase">
                      <ScrambleText text="ADDRESS" className="mr-10" />
                    </p>
                    <p className="text-[11px] text-white leading-[1.5] font-ibmplex">
                      <ScrambleText text="Frey Smiles" charsType="numbers" />
                      <br />
                      <ScrambleText
                        text="1250 S Cedar Crest Blvd"
                        charsType="numbers"
                      />
                      <br />
                      <ScrambleText text="Allentown PA" charsType="numbers" />
                    </p>
                  </div>
                </div>
              </div>
            </div>



<div className="acuity-font w-full lg:w-1/2 h-[50vh] lg:h-full flex items-center justify-center">
  <div className="w-full h-full p-[5vh]">
    <div className="w-full h-full rounded-2xl overflow-hidden">
      <iframe
        src="https://app.acuityscheduling.com/schedule.php?owner=37690830"
        title="Schedule Appointment"
        className="w-full h-full"
        frameBorder="0"
        allow="payment"
      />
    </div>
  </div>
</div>
</div> */}

              {/* <div
                className="
    relative
    w-[18vw]
    h-[45vh]
    z-10 
  "
              >
                <a
                  href="https://www.amazon.com/hz/wishlist/ls/3H5ZN3KIOODT1?ref_=wl_share"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      zIndex: 5,
                    }}
                    viewBox="0 0 149.835 79"
                  >
                    <defs>
                      <mask id="customShape">
                        <path
                          d="M90.375,0h18.98c.275,0,.5,.225,.5,.5v36.98c0,.275-.225,.5-.5,.5h-18.98c-10.21,0-18.5-8.29-18.5-18.5v-.98c0-10.21,8.29-18.5,18.5-18.5Z"
                          fill="white"
                        />
                        <path
                          d="M112.355,0h18.98c10.21,0,18.5,8.29,18.5,18.5v18.98c0,.275-.225,.5-.5,.5h-18.98c-10.21,0-18.5-8.29-18.5-18.5V.5c0-.275,.225-.5,.5-.5Z"
                          fill="white"
                        />
                        <path
                          d="M72.375,39.98h18.98c10.21,0,18.5,8.29,18.5,18.5v18.98c0,.275-.225,.5-.5,.5h-18.98c-10.21,0-18.5-8.29-18.5-18.5v-18.98c0-.275,.225-.5,.5-.5Z"
                          fill="white"
                        />
                        <path
                          d="M112.355,39.98h18.98c10.21,0,18.5,8.29,18.5,18.5v.98c0,10.21-8.29,18.5-18.5,18.5h-18.98c-.275,0-.5-.225-.5-.5v-36.98c0-.275,.225-.5,.5-.5Z"
                          fill="white"
                        />
                        <path
                          d="M12.5,0h0c6.9,0,12.5,5.6,12.5,12.5v12c0,.275-.225,.5-.5,.5h-12C5.6,25,0,19.4,0,12.5H0C0,5.6,5.6,0,12.5,0Z"
                          fill="white"
                        />
                        <path
                          d="M39.685,0h15c6.9,0,12.5,5.6,12.5,12.5h0c0,6.9-5.6,12.5-12.5,12.5h-27c-.275,0-.5-.225-.5-.5v-12c0-6.9,5.6-12.5,12.5-12.5Z"
                          fill="white"
                        />
                        <path
                          d="M12.5,27h12c.275,0,.5,.225,.5,.5v12c0,6.9-5.6,12.5-12.5,12.5h0c-6.9,0-12.5-5.6-12.5-12.5h0c0-6.9,5.6-12.5,12.5-12.5Z"
                          fill="white"
                        />
                        <path
                          d="M12.5,54h12c.275,0,.5,.225,.5,.5v12c0,6.9-5.6,12.5-12.5,12.5H.5c-.275,0-.5-.225-.5-.5v-12c0-6.9,5.6-12.5,12.5-12.5Z"
                          fill="white"
                        />
                        <path
                          d="M27.69,27h12c6.9,0,12.5,5.6,12.5,12.5h0c0,6.9-5.6,12.5-12.5,12.5h-12c-.275,0-.5-.225-.5-.5v-24c0-.275,.225-.5,.5-.5Z"
                          fill="white"
                        />
                      </mask>
                    </defs>
                    <rect
                      width="100%"
                      height="100%"
                      fill="transparent"
                      mask="url(#customShape)"
                    />
                  </svg>
                </a>

                <div
                  className="
      absolute
      inset-0
      overflow-hidden
    "
                  style={{
                    mask: "url(#customShape)",
                    WebkitMask: "url(#customShape)",
                  }}
                >
                  <Canvas camera={{ position: [0, -10, 10], fov: 75 }}>
                    <StatsGl />
                    <group position={[0, 0, 0]}>
                      <StormySkyWithLightning />
                      <ambientLight intensity={Math.PI / 1.5} />
                      <spotLight
                        position={[0, 40, 0]}
                        decay={0}
                        distance={45}
                        penumbra={1}
                        intensity={100}
                      />
                      <spotLight
                        position={[-20, 0, 10]}
                        color="purple"
                        angle={0.15}
                        decay={0}
                        penumbra={-1}
                        intensity={30}
                      />
                      <spotLight
                        position={[20, -10, 10]}
                        color="red"
                        angle={0.2}
                        decay={0}
                        penumbra={-1}
                        intensity={20}
                      />
                    </group>
                    <CameraControls />
                  </Canvas>
                </div>
              </div> */}

<svg xmlns="http://www.w3.org/2000/svg" viewBox="-15 -15 329.67 188" width="1200" height="686">
<rect x="-15" y="-15" width="329.67" height="188" fill="#000000"/>


<g>
<path d="M25,0h0C38.8,0,50,11.2,50,25v24c0,.55-.45,1-1,1h-24C11.2,50,0,38.8,0,25H0C0,11.2,11.2,0,25,0Z" fill="#ffffff"/>
<path d="M25,0h0C38.8,0,50,11.2,50,25v24c0,.55-.45,1-1,1h-24C11.2,50,0,38.8,0,25H0C0,11.2,11.2,0,25,0Z" fill="none" stroke="#00eaff" stroke-width="0.6">
<animate attributeName="stroke-opacity" values="0.35;0.9;0.35" dur="3s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M25,0h0C38.8,0,50,11.2,50,25v24c0,.55-.45,1-1,1h-24C11.2,50,0,38.8,0,25H0C0,11.2,11.2,0,25,0Z" fill="none" stroke="#00a0d8" stroke-width="1.2" stroke-opacity="0.4" stroke-dasharray="7 93">
<animate attributeName="stroke-dashoffset" values="7;-93" dur="20s" begin="-1s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M25,0h0C38.8,0,50,11.2,50,25v24c0,.55-.45,1-1,1h-24C11.2,50,0,38.8,0,25H0C0,11.2,11.2,0,25,0Z" fill="none" stroke="#00eaff" stroke-width="1" stroke-opacity="0.7" stroke-dasharray="4 96">
<animate attributeName="stroke-dashoffset" values="3;-97" dur="20s" begin="-1s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M25,0h0C38.8,0,50,11.2,50,25v24c0,.55-.45,1-1,1h-24C11.2,50,0,38.8,0,25H0C0,11.2,11.2,0,25,0Z" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-dasharray="1.5 98.5">
<animate attributeName="stroke-dashoffset" values="0;-100" dur="20s" begin="-1s" repeatCount="indefinite"/>
</path>
</g>


<g>
<path d="M79.37,0h30C123.17,0,134.38,11.2,134.38,25h0c0,13.8-11.2,25-25,25h-54c-.55,0-1-.45-1-1v-24C54.38,11.2,65.58,0,79.37,0Z" fill="#ffffff"/>
<path d="M79.37,0h30C123.17,0,134.38,11.2,134.38,25h0c0,13.8-11.2,25-25,25h-54c-.55,0-1-.45-1-1v-24C54.38,11.2,65.58,0,79.37,0Z" fill="none" stroke="#00eaff" stroke-width="0.6">
<animate attributeName="stroke-opacity" values="0.35;0.9;0.35" dur="3s" begin="-0.7s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M79.37,0h30C123.17,0,134.38,11.2,134.38,25h0c0,13.8-11.2,25-25,25h-54c-.55,0-1-.45-1-1v-24C54.38,11.2,65.58,0,79.37,0Z" fill="none" stroke="#00a0d8" stroke-width="1.2" stroke-opacity="0.4" stroke-dasharray="7 93">
<animate attributeName="stroke-dashoffset" values="-7;93" dur="20s" begin="-5s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M79.37,0h30C123.17,0,134.38,11.2,134.38,25h0c0,13.8-11.2,25-25,25h-54c-.55,0-1-.45-1-1v-24C54.38,11.2,65.58,0,79.37,0Z" fill="none" stroke="#00eaff" stroke-width="1" stroke-opacity="0.7" stroke-dasharray="4 96">
<animate attributeName="stroke-dashoffset" values="-3;97" dur="20s" begin="-5s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M79.37,0h30C123.17,0,134.38,11.2,134.38,25h0c0,13.8-11.2,25-25,25h-54c-.55,0-1-.45-1-1v-24C54.38,11.2,65.58,0,79.37,0Z" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-dasharray="1.5 98.5">
<animate attributeName="stroke-dashoffset" values="0;100" dur="20s" begin="-5s" repeatCount="indefinite"/>
</path>
</g>


<g>
<path d="M25,54h24c.55,0,1,.45,1,1v24c0,13.8-11.2,25-25,25h0C11.2,104,0,92.8,0,79H0C0,65.2,11.2,54,25,54Z" fill="#ffffff"/>
<path d="M25,54h24c.55,0,1,.45,1,1v24c0,13.8-11.2,25-25,25h0C11.2,104,0,92.8,0,79H0C0,65.2,11.2,54,25,54Z" fill="none" stroke="#00eaff" stroke-width="0.6">
<animate attributeName="stroke-opacity" values="0.35;0.9;0.35" dur="3s" begin="-1.4s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M25,54h24c.55,0,1,.45,1,1v24c0,13.8-11.2,25-25,25h0C11.2,104,0,92.8,0,79H0C0,65.2,11.2,54,25,54Z" fill="none" stroke="#00a0d8" stroke-width="1.2" stroke-opacity="0.4" stroke-dasharray="7 93">
<animate attributeName="stroke-dashoffset" values="7;-93" dur="20s" begin="-9s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M25,54h24c.55,0,1,.45,1,1v24c0,13.8-11.2,25-25,25h0C11.2,104,0,92.8,0,79H0C0,65.2,11.2,54,25,54Z" fill="none" stroke="#00eaff" stroke-width="1" stroke-opacity="0.7" stroke-dasharray="4 96">
<animate attributeName="stroke-dashoffset" values="3;-97" dur="20s" begin="-9s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M25,54h24c.55,0,1,.45,1,1v24c0,13.8-11.2,25-25,25h0C11.2,104,0,92.8,0,79H0C0,65.2,11.2,54,25,54Z" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-dasharray="1.5 98.5">
<animate attributeName="stroke-dashoffset" values="0;-100" dur="20s" begin="-9s" repeatCount="indefinite"/>
</path>
</g>


<g>
<path d="M25,108h24c.55,0,1,.45,1,1v24c0,13.8-11.2,25-25,25H1C.45,158,0,157.55,0,157v-24C0,119.2,11.2,108,25,108Z" fill="#ffffff"/>
<path d="M25,108h24c.55,0,1,.45,1,1v24c0,13.8-11.2,25-25,25H1C.45,158,0,157.55,0,157v-24C0,119.2,11.2,108,25,108Z" fill="none" stroke="#00eaff" stroke-width="0.6">
<animate attributeName="stroke-opacity" values="0.35;0.9;0.35" dur="3s" begin="-2.1s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M25,108h24c.55,0,1,.45,1,1v24c0,13.8-11.2,25-25,25H1C.45,158,0,157.55,0,157v-24C0,119.2,11.2,108,25,108Z" fill="none" stroke="#00a0d8" stroke-width="1.2" stroke-opacity="0.4" stroke-dasharray="7 93">
<animate attributeName="stroke-dashoffset" values="-7;93" dur="20s" begin="-13s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M25,108h24c.55,0,1,.45,1,1v24c0,13.8-11.2,25-25,25H1C.45,158,0,157.55,0,157v-24C0,119.2,11.2,108,25,108Z" fill="none" stroke="#00eaff" stroke-width="1" stroke-opacity="0.7" stroke-dasharray="4 96">
<animate attributeName="stroke-dashoffset" values="-3;97" dur="20s" begin="-13s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M25,108h24c.55,0,1,.45,1,1v24c0,13.8-11.2,25-25,25H1C.45,158,0,157.55,0,157v-24C0,119.2,11.2,108,25,108Z" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-dasharray="1.5 98.5">
<animate attributeName="stroke-dashoffset" values="0;100" dur="20s" begin="-13s" repeatCount="indefinite"/>
</path>
</g>

<g>
<path d="M55.38,54h24c13.8,0,25,11.2,25,25h0c0,13.8-11.2,25-25,25h-24c-.55,0-1-.45-1-1v-48c0-.55.45-1,1-1Z" fill="#ffffff"/>
<path d="M55.38,54h24c13.8,0,25,11.2,25,25h0c0,13.8-11.2,25-25,25h-24c-.55,0-1-.45-1-1v-48c0-.55.45-1,1-1Z" fill="none" stroke="#00eaff" stroke-width="0.6">
<animate attributeName="stroke-opacity" values="0.35;0.9;0.35" dur="3s" begin="-0.3s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M55.38,54h24c13.8,0,25,11.2,25,25h0c0,13.8-11.2,25-25,25h-24c-.55,0-1-.45-1-1v-48c0-.55.45-1,1-1Z" fill="none" stroke="#00a0d8" stroke-width="1.2" stroke-opacity="0.4" stroke-dasharray="7 93">
<animate attributeName="stroke-dashoffset" values="7;-93" dur="20s" begin="-17s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M55.38,54h24c13.8,0,25,11.2,25,25h0c0,13.8-11.2,25-25,25h-24c-.55,0-1-.45-1-1v-48c0-.55.45-1,1-1Z" fill="none" stroke="#00eaff" stroke-width="1" stroke-opacity="0.7" stroke-dasharray="4 96">
<animate attributeName="stroke-dashoffset" values="3;-97" dur="20s" begin="-17s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M55.38,54h24c13.8,0,25,11.2,25,25h0c0,13.8-11.2,25-25,25h-24c-.55,0-1-.45-1-1v-48c0-.55.45-1,1-1Z" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-dasharray="1.5 98.5">
<animate attributeName="stroke-dashoffset" values="0;-100" dur="20s" begin="-17s" repeatCount="indefinite"/>
</path>
</g>


<g>
<path d="M180.75,0h37.96c.55,0,1,.45,1,1v73.96c0,.55-.45,1-1,1h-37.96c-20.42,0-37-16.58-37-37v-1.96C143.75,16.58,160.33,0,180.75,0Z" fill="#ffffff"/>
<path d="M180.75,0h37.96c.55,0,1,.45,1,1v73.96c0,.55-.45,1-1,1h-37.96c-20.42,0-37-16.58-37-37v-1.96C143.75,16.58,160.33,0,180.75,0Z" fill="none" stroke="#00eaff" stroke-width="0.6">
<animate attributeName="stroke-opacity" values="0.35;0.9;0.35" dur="3s" begin="-1.7s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M180.75,0h37.96c.55,0,1,.45,1,1v73.96c0,.55-.45,1-1,1h-37.96c-20.42,0-37-16.58-37-37v-1.96C143.75,16.58,160.33,0,180.75,0Z" fill="none" stroke="#00a0d8" stroke-width="1.2" stroke-opacity="0.4" stroke-dasharray="7 93">
<animate attributeName="stroke-dashoffset" values="-7;93" dur="20s" begin="-3s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M180.75,0h37.96c.55,0,1,.45,1,1v73.96c0,.55-.45,1-1,1h-37.96c-20.42,0-37-16.58-37-37v-1.96C143.75,16.58,160.33,0,180.75,0Z" fill="none" stroke="#00eaff" stroke-width="1" stroke-opacity="0.7" stroke-dasharray="4 96">
<animate attributeName="stroke-dashoffset" values="-3;97" dur="20s" begin="-3s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M180.75,0h37.96c.55,0,1,.45,1,1v73.96c0,.55-.45,1-1,1h-37.96c-20.42,0-37-16.58-37-37v-1.96C143.75,16.58,160.33,0,180.75,0Z" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-dasharray="1.5 98.5">
<animate attributeName="stroke-dashoffset" values="0;100" dur="20s" begin="-3s" repeatCount="indefinite"/>
</path>
</g>


<g>
<path d="M224.71,0h37.96C283.09,0,299.67,16.58,299.67,37v37.96c0,.55-.45,1-1,1h-37.96c-20.42,0-37-16.58-37-37V1C223.71.45,224.16,0,224.71,0Z" fill="#ffffff"/>
<path d="M224.71,0h37.96C283.09,0,299.67,16.58,299.67,37v37.96c0,.55-.45,1-1,1h-37.96c-20.42,0-37-16.58-37-37V1C223.71.45,224.16,0,224.71,0Z" fill="none" stroke="#00eaff" stroke-width="0.6">
<animate attributeName="stroke-opacity" values="0.35;0.9;0.35" dur="3s" begin="-2.4s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M224.71,0h37.96C283.09,0,299.67,16.58,299.67,37v37.96c0,.55-.45,1-1,1h-37.96c-20.42,0-37-16.58-37-37V1C223.71.45,224.16,0,224.71,0Z" fill="none" stroke="#00a0d8" stroke-width="1.2" stroke-opacity="0.4" stroke-dasharray="7 93">
<animate attributeName="stroke-dashoffset" values="7;-93" dur="20s" begin="-7s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M224.71,0h37.96C283.09,0,299.67,16.58,299.67,37v37.96c0,.55-.45,1-1,1h-37.96c-20.42,0-37-16.58-37-37V1C223.71.45,224.16,0,224.71,0Z" fill="none" stroke="#00eaff" stroke-width="1" stroke-opacity="0.7" stroke-dasharray="4 96">
<animate attributeName="stroke-dashoffset" values="3;-97" dur="20s" begin="-7s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M224.71,0h37.96C283.09,0,299.67,16.58,299.67,37v37.96c0,.55-.45,1-1,1h-37.96c-20.42,0-37-16.58-37-37V1C223.71.45,224.16,0,224.71,0Z" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-dasharray="1.5 98.5">
<animate attributeName="stroke-dashoffset" values="0;-100" dur="20s" begin="-7s" repeatCount="indefinite"/>
</path>
</g>


<g>
<path d="M144.75,79.96h37.96c20.42,0,37,16.58,37,37v37.96c0,.55-.45,1-1,1h-37.96c-20.42,0-37-16.58-37-37v-37.96c0-.55.45-1,1-1Z" fill="#ffffff"/>
<path d="M144.75,79.96h37.96c20.42,0,37,16.58,37,37v37.96c0,.55-.45,1-1,1h-37.96c-20.42,0-37-16.58-37-37v-37.96c0-.55.45-1,1-1Z" fill="none" stroke="#00eaff" stroke-width="0.6">
<animate attributeName="stroke-opacity" values="0.35;0.9;0.35" dur="3s" begin="-2.8s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M144.75,79.96h37.96c20.42,0,37,16.58,37,37v37.96c0,.55-.45,1-1,1h-37.96c-20.42,0-37-16.58-37-37v-37.96c0-.55.45-1,1-1Z" fill="none" stroke="#00a0d8" stroke-width="1.2" stroke-opacity="0.4" stroke-dasharray="7 93">
<animate attributeName="stroke-dashoffset" values="-7;93" dur="20s" begin="-11s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M144.75,79.96h37.96c20.42,0,37,16.58,37,37v37.96c0,.55-.45,1-1,1h-37.96c-20.42,0-37-16.58-37-37v-37.96c0-.55.45-1,1-1Z" fill="none" stroke="#00eaff" stroke-width="1" stroke-opacity="0.7" stroke-dasharray="4 96">
<animate attributeName="stroke-dashoffset" values="-3;97" dur="20s" begin="-11s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M144.75,79.96h37.96c20.42,0,37,16.58,37,37v37.96c0,.55-.45,1-1,1h-37.96c-20.42,0-37-16.58-37-37v-37.96c0-.55.45-1,1-1Z" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-dasharray="1.5 98.5">
<animate attributeName="stroke-dashoffset" values="0;100" dur="20s" begin="-11s" repeatCount="indefinite"/>
</path>
</g>


<g>
<path d="M224.71,79.96h37.96c20.42,0,37,16.58,37,37v1.96c0,20.42-16.58,37-37,37h-37.96c-.55,0-1-.45-1-1v-73.96c0-.55.45-1,1-1Z" fill="#ffffff"/>
<path d="M224.71,79.96h37.96c20.42,0,37,16.58,37,37v1.96c0,20.42-16.58,37-37,37h-37.96c-.55,0-1-.45-1-1v-73.96c0-.55.45-1,1-1Z" fill="none" stroke="#00eaff" stroke-width="0.6">
<animate attributeName="stroke-opacity" values="0.35;0.9;0.35" dur="3s" begin="-1.1s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M224.71,79.96h37.96c20.42,0,37,16.58,37,37v1.96c0,20.42-16.58,37-37,37h-37.96c-.55,0-1-.45-1-1v-73.96c0-.55.45-1,1-1Z" fill="none" stroke="#00a0d8" stroke-width="1.2" stroke-opacity="0.4" stroke-dasharray="7 93">
<animate attributeName="stroke-dashoffset" values="7;-93" dur="20s" begin="-15s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M224.71,79.96h37.96c20.42,0,37,16.58,37,37v1.96c0,20.42-16.58,37-37,37h-37.96c-.55,0-1-.45-1-1v-73.96c0-.55.45-1,1-1Z" fill="none" stroke="#00eaff" stroke-width="1" stroke-opacity="0.7" stroke-dasharray="4 96">
<animate attributeName="stroke-dashoffset" values="3;-97" dur="20s" begin="-15s" repeatCount="indefinite"/>
</path>
<path pathLength="100" d="M224.71,79.96h37.96c20.42,0,37,16.58,37,37v1.96c0,20.42-16.58,37-37,37h-37.96c-.55,0-1-.45-1-1v-73.96c0-.55.45-1,1-1Z" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-dasharray="1.5 98.5">
<animate attributeName="stroke-dashoffset" values="0;-100" dur="20s" begin="-15s" repeatCount="indefinite"/>
</path>
</g>

</svg>
<section 
  style={{
    background: `
      radial-gradient(
        circle at 70% 20%,
        rgba(255,255,255,0.7) 0%,
        rgba(255,255,255,0.4) 20%,
        rgba(240,240,240,0.6) 40%,
        rgba(220,220,220,0.8) 100%
      ),
      linear-gradient(
        180deg,
        #f5f5f5 0%,
        #e8e8e8 100%
      )
    `
  }}
  className="w-full h-screen text-black grid grid-rows-[auto_1fr_auto] fixed overflow-y-auto"
>

<div
  className={`
    fixed top-0 left-0 right-0 z-[100]
    transform transition-all duration-500 ease-[cubic-bezier(0.34,1.2,0.64,1)]
    ${showScheduler ? 'translate-y-0' : '-translate-y-full'}
  `}
>
  <div className="relative">

    
    <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-b-2xl overflow-hidden">
      <div className="relative w-full h-[90vh]">

        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/40 to-transparent z-40 pointer-events-none">
          <div className="flex justify-end p-6 pointer-events-auto">
  <button
  type="button"
onClick={(e) => {
  e.preventDefault()
  e.stopPropagation()
  setShowScheduler(false)
}}
  className="font-canelathin text-white hover:opacity-70 transition-opacity bg-black/20 px-5 py-2 rounded-full backdrop-blur-sm"
>
  ✕ Close
</button>
          </div>
        </div>
        
        <iframe
          src="https://freysmilesappointments.as.me/"
          title="Schedule Appointment"
          className="w-full h-full"
          frameBorder="0"
          allow="payment"
          style={{ marginTop: 0 }}
        />
      </div>
    </div>
  </div>
</div>

{/* Overlay */}
<div
  className={`
    fixed inset-0 bg-black/20 backdrop-blur-sm z-[99]
    transition-all duration-500 ease-in-out
    ${showScheduler ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
  `}
  onClick={() => setShowScheduler(false)}
/>

  <div className="absolute top-6 left-0 right-0 flex justify-center items-center xl:hidden z-50">
    <div
      className="
        relative
        flex flex-wrap justify-center items-center gap-4
        px-5 py-3
        rounded-full
        text-[11px] font-neuehaas35 tracking-wider uppercase
        backdrop-blur-xl
        max-w-[90vw] mx-auto
      "
      style={{
        background: `
          linear-gradient(
            180deg,
            rgba(255,255,255,0.35) 0%,
            rgba(255,255,255,0.08) 40%,
            rgba(255,255,255,0.03) 100%
          )
        `,
        backdropFilter: "blur(20px) saturate(140%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(255,255,255,0.45) 0%,
              rgba(255,255,255,0.12) 25%,
              rgba(255,255,255,0.04) 50%,
              rgba(255,255,255,0.0) 70%,
              rgba(255,255,255,0.04) 85%,
              rgba(255,255,255,0.12) 95%,
              rgba(255,255,255,0.45) 100%
            ),
            radial-gradient(
              circle at 0% 50%,
              rgba(255,255,255,0.18),
              transparent 40%
            ),
            radial-gradient(
              circle at 100% 50%,
              rgba(255,255,255,0.12),
              transparent 40%
            )
          `,
        }}
      />

      <AnimatedText
        onClick={() => setShowScheduler(true)}
        text="Book Now"
        className="text-[11px] tracking-wider uppercase leading-none block"
      />

      <div className="w-px h-4 bg-white/20" />

      <Link href="/early-orthodontics">
        <AnimatedText 
          text="Early Orthodontics"
          className="text-[11px] tracking-wider uppercase leading-none block"
        />
      </Link>

      <div className="w-px h-4 bg-white/20" />

      <Link href="/adult-orthodontics">
        <AnimatedText 
          text="Adult Orthodontics"
          className="text-[11px] tracking-wider uppercase leading-none block"
        />
      </Link>
    </div>
  </div>


  <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-0">
    <div className="relative w-full h-full xl:w-auto xl:h-auto">
      <Canvas
        camera={{ position: [0, 0, 1000], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "150vw",
          height: "150vh",
          maxWidth: "800px",
          maxHeight: "800px",
          zIndex: 0,
        }}
        className="xl:w-full xl:h-full"
      >
        <ParticleScene />
      </Canvas>
    </div>
  </div>

  <div className="flex items-center justify-between px-12 pt-6 text-xs tracking-wide relative z-10">

  </div>


  <div className="grid grid-cols-1 xl:grid-cols-3 items-center px-4 xl:px-12 gap-8 xl:gap-0 relative z-10">

    <div className="flex flex-col items-center xl:items-center order-2 xl:order-1">
      <h1 className="text-[24px] font-neuehaasdisplaythin tracking-[.02em] xl:text-[24px] text-center xl:text-left">
       please explore our new site
      </h1>
<div className="py-2 text-[13px] font-neuehaas35 tracking-[0.07em]">
  ...more upgrades in the works
</div>
    
    </div>


    <div className="flex justify-center items-center order-1 xl:order-2 h-[300px] xl:h-auto relative">
  <div className="text-[13px] flex flex-col xl:flex-row justify-center xl:justify-start gap-4 xl:gap-12 font-neuehaas35 tracking-[0.07em] items-center xl:items-start">
      
                    <p className="text-[14px] text-black leading-[1.6] font-ibmplex">
                       <span className="block">
                      <ScrambleText text="info@freysmiles.com" />
                   </span>
                    </p>
                   <p className="text-[14px] text-black leading-[1.6] font-ibmplex">
                     <span className="block">
                                    <ScrambleText text="(610)437-4748" charsType="numbers" />
                     </span>
             
                           </p>
      </div>
    </div>


    <div className="hidden xl:flex justify-end order-3">
      <div
        className="
          relative
          flex items-center gap-6
          px-5 py-3
          rounded-full
          text-[11px] font-neuehaas35 tracking-wider uppercase
          backdrop-blur-xl
        "
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(255,255,255,0.35) 0%,
              rgba(255,255,255,0.08) 40%,
              rgba(255,255,255,0.03) 100%
            )
          `,
          backdropFilter: "blur(20px) saturate(140%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: `
              linear-gradient(
                180deg,
                rgba(255,255,255,0.45) 0%,
                rgba(255,255,255,0.12) 25%,
                rgba(255,255,255,0.04) 50%,
                rgba(255,255,255,0.0) 70%,
                rgba(255,255,255,0.04) 85%,
                rgba(255,255,255,0.12) 95%,
                rgba(255,255,255,0.45) 100%
              ),
              radial-gradient(
                circle at 0% 50%,
                rgba(255,255,255,0.18),
                transparent 40%
              ),
              radial-gradient(
                circle at 100% 50%,
                rgba(255,255,255,0.12),
                transparent 40%
              )
            `,
          }}
        />

        <AnimatedText
          onClick={() => setShowScheduler(true)}
          text="Book Now"
          className="relative text-[11px] tracking-wider uppercase leading-none block cursor-pointer"
        />
        <div className="w-px h-4 bg-white/20" />

        <Link href="/early-orthodontics">
          <AnimatedText 
            text="Early Orthodontics"
            className="text-[11px] tracking-wider uppercase leading-none block"
          />
        </Link>

        <div className="w-px h-4 bg-white/20" />

        <Link href="/adult-orthodontics">
          <AnimatedText 
            text="Adult Orthodontics"
            className="text-[11px] tracking-wider uppercase leading-none block"
          />
        </Link>
      </div>
    </div>
  </div>

<div
  className="flex flex-col xl:flex-row justify-center gap-4 xl:gap-8 pb-6 text-xs font-neuehaas35 tracking-widest items-center relative z-10"
  style={{ fontVariantNumeric: "tabular-nums" }}
>
  <div>40° 36' N 75° 29' W</div>
  <div className="hidden xl:block">•</div>

  <div className="w-[90px] text-center">
    {time}
  </div>
</div>
</section>

{/* <section
  className="
    bg-black
    relative
    z-10
    w-full
    h-screen



    text-white

    overflow-hidden
  "
>


  <div className="flex items-center justify-center">
  <div className="overflow-hidden pb-[0.1em]">
    <h1
      className=" text-[32px] lg:text-[34px] font-canelathin text-center leading-[1.2]"
      ref={h1Ref}
    >
website coming soon

    </h1>
  </div>
  </div>



  <div className="flex items-start justify-center">
 <div
    className="
      flex flex-col
      w-[280px]
      text-center
      text-[14px] lg:text-[16px]
      font-neuehaas45 leading-relaxed
      max-w-[500px]
      w-full      
      gap-3
    "
  >

    <CopyButton 
      text="610-437-4748" 
      label="copy 610-437-4748" 
    />
    <CopyButton 
      text="info" 
      label="copy email" 
    />

</div>
  </div>

  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
    <div className="circle-loader relative">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className={`circle circle-${i}`} />
      ))}
    </div>
  </div>

<div
  className="relative z-10 flex flex-col items-center"
  ref={containerOneRef}
>


</div>

      <div className="font-neuehaas45 absolute top-[85%] right-16 py-2 px-4 z-10">
<button
  type="button"
  onClick={() => setOpen(true)}
  className="flex items-center gap-2"
>
  <span className="opacity-60 text-sm">→</span>
  Join Our Team
</button>
      </div>
{typeof window !== "undefined" &&
  createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
transition={{
  duration: 1,
  ease: [0.22, 1, 0.36, 1],
  exit: {
    opacity: {
      duration: 1.2, 
      ease: [0.22, 1, 0.36, 1]
    },
    backdropFilter: {
      duration: 0.4 
    }
  }
}}
          className="fixed inset-0 z-50 bg-black/80 
                     flex items-center justify-center
                     font-neuehaas45 tracking-wide"
          onClick={handleClose}
        >
        <motion.div
  key="panel"
  initial={{
    clipPath: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)",
    scale: 0.9,
    opacity: 0
  }}
  animate={{
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    scale: 1,
    opacity: 1
  }}
  exit={{
    clipPath: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)",
    scale: 0.92,
    opacity: 0
  }}
  transition={{
    duration: 1.2,
    ease: [0.16, 1, 0.3, 1],
    
    clipPath: { 
      duration: 1.4,
      ease: [0.34, 1.56, 0.64, 1]
    },
    
    scale: {
      duration: 0.8,
      ease: "backOut"
    },
    

    opacity: {
      duration: 1.0
    }
  }}

            className="relative w-full h-full 
                       bg-gradient-to-br
                       from-[#4E5353]
                       via-[#505456]
                       to-[#3E4243]
                       text-[#EDE5D7]
                       flex items-start justify-center
                       overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
    
          <div className="absolute inset-0 pointer-events-none z-[0]
                        bg-[radial-gradient(circle_at_45%_22%,rgba(140,130,170,0.10),transparent_55%)]" />

     
          <div className="absolute inset-0 pointer-events-none z-[1]">
            <CanvasBallsAnimation />
          </div>

          <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-noise z-[2]" />
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="relative z-[3] w-full"
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-8 right-8 text-sm opacity-70 hover:opacity-100 
                         transition-opacity focus:outline-none focus:ring-2 focus:ring-white/30 
                         rounded px-2 py-1 text-[#EDE5D7]"
            >
              ✕ Close
            </button>
            
            <div className="w-full px-12 md:px-20 pt-14 md:pt-20 mb-8">
              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[28px] font-canelathin mb-10"
              >
                Start Your Application
                <span className="opacity-50 font-canelathin mx-2">—</span>
                <span className="text-[14px] tracking-wide opacity-70 align-middle font-neuehaas45 text-[#FEB44A]">
                For open positions at Frey Smiles
                </span>
              </motion.h2>
              
              <form
                onSubmit={handleSubmit}
                className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-8"
              >
  
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                        Full Name
                      </label>
                      <input
                        name="name"
                        required
                        placeholder="Jane Doe"
                        className="w-full bg-transparent border border-white/20 rounded-lg 
                                 px-4 py-3 
                                 text-[12px] leading-relaxed
                                 text-white/85
                                 placeholder:text-white/35
                                 tracking-[0.01em]
                                 focus:outline-none focus:border-white/60
                                 transition-colors"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.65 }}
                    >
                      <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                        Best way to reach you
                      </label>
                      <input
                        name="contact"
                        required
                        placeholder="Email or phone number"
                        className="w-full bg-transparent border border-white/20 rounded-lg 
                                 px-4 py-3 
                                 text-[12px] leading-relaxed
                                 text-white/85
                                 placeholder:text-white/35
                                 tracking-[0.01em]
                                 focus:outline-none focus:border-white/60
                                 transition-colors"
                      />
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                        High school graduation year
                      </label>
                      <select
                        name="gradYear"
                        required
                        className="w-full bg-transparent border border-white/20 rounded-lg 
                                 px-4 py-3 
                                 text-[12px] leading-relaxed
                                 text-white/85
                                 placeholder:text-white/35
                                 tracking-[0.01em]
                                 focus:outline-none focus:border-white/60
                                 transition-colors"
                      >
                        <option value="">Select year</option>
                        {Array.from({ length: 40 }, (_, i) => {
                          const year = 2027 - i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </motion.div>

                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.75 }}
                    >
                      <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                        Do you have experience working in dentistry or orthodontics?
                      </label>
                      <select
                        name="experience"
                        required
                        className="w-full bg-transparent border border-white/20 rounded-lg 
                                 px-4 py-3 
                                 text-[12px] leading-relaxed
                                 text-white/85
                                 placeholder:text-white/35
                                 tracking-[0.01em]
                                 focus:outline-none focus:border-white/60
                                 transition-colors"
                      >
                        <option value="">Select</option>
                        <option value="no">No</option>
                        <option value="yes-dentistry">Yes — Dentistry</option>
                        <option value="yes-ortho">Yes — Orthodontics</option>
                        <option value="yes-both">Yes — Both</option>
                      </select>
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                        Position you're interested in
                      </label>
                      <select
                        name="role"
                        required
                        className="w-full bg-transparent border border-white/20 rounded-lg 
                                 px-4 py-3 
                                 text-[12px] leading-relaxed
                                 text-white/85
                                 placeholder:text-white/35
                                 tracking-[0.01em]
                                 focus:outline-none focus:border-white/60
                                 transition-colors"
                      >
                        <option value="">Select role</option>
                        <option value="assistant">Clinical Assistant</option>
                        <option value="front-desk">Front Desk / Admin</option>
                        <option value="coordinator">Treatment Coordinator</option>
                        <option value="sterilization">Sterilization / Lab</option>
                        <option value="open">Open / Unsure</option>
                      </select>
                    </motion.div>

                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.85 }}
                    >
                      <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                        How did you hear about us?
                      </label>
                      <select
                        name="source"
                        required
                        className="w-full bg-transparent border border-white/20 rounded-lg 
                                 px-4 py-3 
                                 text-[12px] leading-relaxed
                                 text-white/85
                                 placeholder:text-white/35
                                 tracking-[0.01em]
                                 focus:outline-none focus:border-white/60
                                 transition-colors"
                      >
                        <option value="">Select source</option>
                        <option value="website">Website</option>
                        <option value="social">Social Media</option>
                        <option value="friend">Friend / Employee</option>
                        <option value="other">Other</option>
                      </select>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                      When would you be available to start?
                    </label>
                    <input
                      name="availability"
                      required
                      placeholder="Immediately, in 2 weeks, next month…"
                      className="text-[12px] leading-relaxed
                               text-white/85
                               placeholder:text-white/35 opacity-70  
                               w-full bg-transparent border border-white/20 rounded-lg 
                               px-4 py-3 focus:outline-none focus:border-white/60
                               transition-colors"
                    />
                  </motion.div>
                </motion.div>

          
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="space-y-8"
                >
               
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.95 }}
                  >
                    <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                      Resume (PDF preferred)
                    </label>
                    <label className="flex items-center justify-center border border-white/30 
                                      rounded-lg px-6 py-4 cursor-pointer 
                                      hover:border-white transition-colors">
                      <input
                        type="file"
                        name="resume"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => setResumeName(e.target.files?.[0]?.name)}
                      />
                      {resumeName ? (
                        <span className="text-sm opacity-90">Selected: {resumeName}</span>
                      ) : (
                        <span className="text-[12px] leading-relaxed
                               text-white/85
                               placeholder:text-white/35 opacity-70">
                          Click to add resume
                        </span>
                      )}
                    </label>
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.0 }}
                  >
                    <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                      What interests you about working with our practice?
                    </label>
                    <textarea
                      name="motivation"
                      maxLength={300}
                      rows={5}
                      required
                      placeholder="max 300 characters"
                      className="text-[12px] leading-relaxed
                               text-white/85
                               placeholder:text-white/35 opacity-70 
                               w-full bg-transparent border border-white/20 rounded-lg 
                               px-4 py-3 focus:outline-none focus:border-white/60 
                               resize-none transition-colors"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.05 }}
                  >
                    <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                      Is there anything else you'd like us to know?
                    </label>
                    <textarea
                      name="notes"
                      rows={4}
                      placeholder="Optional"
                      className="text-[12px] leading-relaxed
                               text-white/85
                               placeholder:text-white/35 opacity-70  
                               w-full bg-transparent border border-white/20 rounded-lg 
                               px-4 py-3 focus:outline-none focus:border-white/60 
                               resize-none transition-colors"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="pt-2 flex justify-end"
                  >
<button
  type="submit"
  className="up border text-[13px] uppercase tracking-widest 
             border border-white/20 rounded-lg px-10 py-5 
             transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
>
  Submit
</button>
                  </motion.div>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>,
  document.getElementById("modal-root")
)}


</section> */}
{/* <div className="acuity-font w-full lg:w-1/2 h-[50vh] lg:h-full flex items-center justify-center">
  <div className="w-full h-full p-[5vh]">
    <div className="w-full h-full rounded-2xl overflow-hidden">
      <iframe
        src="https://app.acuityscheduling.com/schedule.php?owner=37690830"
        title="Schedule Appointment"
        className="w-full h-full"
        frameBorder="0"
        allow="payment"
      />
    </div>
  </div>
</div> */}
<section  className="relative w-full">
  {/* <div style={{ 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    width: '100vw', 
    height: '100vh', 
    zIndex: 0 
  }}>
    <Canvas>
      <RaymarchingShader />
    </Canvas>
  </div> */}


      </section>

    </>
  );
}
const SVGVerticalTransition = () => {
  const overlayPathRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);


  const paths = {
    step1: {
      unfilled: 'M 0 0 h 0 c 0 50 0 50 0 100 H 0 V 0 Z',
      inBetween: 'M 0 0 h 33 c -30 54 113 65 0 100 H 0 V 0 Z',
      filled: 'M 0 0 h 100 c 0 50 0 50 0 100 H 0 V 0 Z',
    },
    step2: {
      filled: 'M 100 0 H 0 c 0 50 0 50 0 100 h 100 V 50 Z',
      inBetween: 'M 100 0 H 50 c 28 43 4 81 0 100 h 50 V 0 Z',
      unfilled: 'M 100 0 H 100 c 0 50 0 50 0 100 h 0 V 0 Z',
    }
  };

  const switchPages = useCallback(() => {
    const view1 = document.querySelector('.view--1');
    const view2 = document.querySelector('.view--2');
    const frame = document.querySelector('.frame');

    if (currentPage === 2) {
      frame?.classList.add('frame--view-open');
      view2?.classList.add('view--open');
    } else {
      frame?.classList.remove('frame--view-open');
      view2?.classList.remove('view--open');
    }
  }, [currentPage]);

  const pageSwitchTimeline = useCallback(() => {
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => setIsAnimating(false)
    });

    tl.set(overlayPathRef.current, {
      attr: { d: paths.step1.unfilled }
    })
    .to(overlayPathRef.current, { 
      duration: 0.8,
      ease: 'power3.in',
      attr: { d: paths.step1.inBetween }
    }, 0)
    .to(overlayPathRef.current, { 
      duration: 0.2,
      ease: 'power1',
      attr: { d: paths.step1.filled },
      onComplete: () => switchPages()
    })
    .set(overlayPathRef.current, { 
      attr: { d: paths.step2.filled }
    })
    .to(overlayPathRef.current, { 
      duration: 0.15,
      ease: 'sine.in',
      attr: { d: paths.step2.inBetween }
    })
    .to(overlayPathRef.current, { 
      duration: 1,
      ease: 'power4',
      attr: { d: paths.step2.unfilled }
    });

    return tl;
  }, [switchPages, paths]);

  const reveal = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentPage(2);
    
    const timeline = pageSwitchTimeline();
    timeline.play(0);
  }, [isAnimating, pageSwitchTimeline]);

  const unreveal = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentPage(1);
    
    const timeline = pageSwitchTimeline();
    timeline.play(0);
  }, [isAnimating, pageSwitchTimeline]);

  return (
    <main>
      <div className="frame">
        <h1 className="frame__title">SVG Vertical Page Transition</h1>
        <nav className="frame__links">
          <a href="#">Link 1</a>
          <a href="#">Link 2</a>
        </nav>
      </div>

      <div className="view view--1">
        <button 
          className="unbutton button button--open" 
          onClick={reveal}
          aria-label="Open other view"
        >
          Page 2
        </button>
      </div>

      <div className="view view--2">
        <button 
          className="unbutton button button--close" 
          onClick={unreveal}
          aria-label="Close current view"
        >
          Page 1
        </button>
      </div>

      <svg 
        className="overlay" 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        <path 
          ref={overlayPathRef}
          className="overlay__path" 
          vectorEffect="non-scaling-stroke" 
          d="M 0 0 h 0 c 0 50 0 50 0 100 H 0 V 0 Z" 
        />
      </svg>
    </main>
  );
};
const CanvasBallsAnimation = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();


    const BALL_COUNT = 38;
    const R = 2;
    const maxDistance = 260;
    const lineWidth = 0.6;

const ballColor = { r: 254, g: 180, b: 74 };

    const speedRange = 0.35;  // slower 

    let balls = [];

    const random = (min, max) => Math.random() * (max - min) + min;

    const createBall = () => ({
      x: random(0, width),
      y: random(0, height),
      vx: random(-speedRange, speedRange),
      vy: random(-speedRange, speedRange),
      r: R,
      alpha: random(0.4, 0.8),
    });

    const initBalls = () => {
      balls = [];
      for (let i = 0; i < BALL_COUNT; i++) {
        balls.push(createBall());
      }
    };

    const distance = (a, b) => {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.hypot(dx, dy);
    };

    const updateBalls = () => {
      balls.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;

        // soft wrap
        if (b.x < -50) b.x = width + 50;
        if (b.x > width + 50) b.x = -50;
        if (b.y < -50) b.y = height + 50;
        if (b.y > height + 50) b.y = -50;
      });
    };

    const drawLines = () => {
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const b1 = balls[i];
          const b2 = balls[j];

          const dist = distance(b1, b2);
          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.2; 

            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = lineWidth;

            ctx.beginPath();
            ctx.moveTo(b1.x, b1.y);
            ctx.lineTo(b2.x, b2.y);
            ctx.stroke();
          }
        }
      }
    };

    const drawBalls = () => {
      balls.forEach((b) => {
        ctx.fillStyle = `rgba(${ballColor.r}, ${ballColor.g}, ${ballColor.b}, ${b.alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      drawLines();
      drawBalls();
      updateBalls();

      animationRef.current = requestAnimationFrame(animate);
    };

    initBalls();
    animate();

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[1] pointer-events-none"
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};

function App() {
  const footerRef = useRef(null);
  const mainRef = useRef(null);
  const svgPathsRef = useRef([]);
  const marqueeContentRef = useRef(null);


  const updateFooterMargin = () => {
    if (footerRef.current && mainRef.current) {
      const footerHeight = footerRef.current.offsetHeight;
      mainRef.current.style.marginBottom = `${footerHeight}px`;
    }
  };

  useEffect(() => {
    updateFooterMargin();
    if (svgPathsRef.current.length > 0 && marqueeContentRef.current) {
 
      const svgTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: mainRef.current,
          start: "bottom 80%",
          end: "bottom top",
          scrub: true,
          toggleActions: "play none none reverse",
          markers: false
        }
      });

      svgPathsRef.current.forEach((path, i) => {
        svgTimeline.fromTo(
          path,
          { opacity: 0, y: 75 },
          { opacity: 1, y: 0, ease: "power3.out" },
          i * 0.25
        );
      });
      ScrollTrigger.refresh();
    }


    const handleResize = () => {
      updateFooterMargin();
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);


  const addToSvgPathsRef = (el) => {
    if (el && !svgPathsRef.current.includes(el)) {
      svgPathsRef.current.push(el);
    }
  };

  return (
    <>

    <OfficeChat />
    {/* <OfficeMessage /> */}
      {/* <div className="creativity-main-wrapper" ref={mainRef}>
<ContactHero />
      </div> */}


      {/* <footer className="creativity-footer" ref={footerRef}>

           
                <div className="absolute inset-0">
  <Canvas
      orthographic
      camera={{ zoom: 1, position: [0, 0, 1] }}
      className="w-full h-full"
    >
      <ShaderBackground />
    </Canvas>

        </div>

          <div className="scene-layer">
    <Canvas
      camera={{ position: [0, 0, 1000], fov: 75 }}
      gl={{ alpha: true }}
    >
      <Scene />
    </Canvas>
  </div>
        
<div className="creativity-footer__marquee">
  
  <div className="creativity-footer__marquee-track" ref={marqueeContentRef}>
  <div className="creativity-footer__marquee-group">
      <span className="creativity-marquee-item">The</span>
      <span className="creativity-marquee-item">Future</span>
      <span className="creativity-marquee-item">Looks</span>
      <span className="creativity-marquee-item">Good</span>
      <span className="creativity-marquee-item">On</span>
        <span className="creativity-marquee-item">You</span>
    </div>

  <div className="creativity-footer__marquee-group">
      <span className="creativity-marquee-item">The</span>
      <span className="creativity-marquee-item">Future</span>
      <span className="creativity-marquee-item">Looks</span>
      <span className="creativity-marquee-item">Good</span>
      <span className="creativity-marquee-item">On</span>
        <span className="creativity-marquee-item">You</span>
    </div>
  <div className="creativity-footer__marquee-group">
      <span className="creativity-marquee-item">The</span>
      <span className="creativity-marquee-item">Future</span>
      <span className="creativity-marquee-item">Looks</span>
      <span className="creativity-marquee-item">Good</span>
      <span className="creativity-marquee-item">On</span>
        <span className="creativity-marquee-item">You</span>
    </div>
  </div>
</div>
        <div className="creativity-footer__center">
          
          <div className="creativity-footer__center-content">
      
            <p className="creativity-footer-text">
              
            <div className="relative z-10 flex flex-col justify-center h-full items-center">
        <div className="flex flex-col gap-6 text-sm uppercase">
                  <p className="text-[11px] text-white  uppercase font-ibmplex">
                    // Contact Us
                  </p>
                  <div>
<p className="text-[11px] text-white mb-1 font-ibmplex uppercase">
  <span className="block">
    <ScrambleText text="GENERAL" />
  </span>
</p>
                    <p className="text-[11px] text-white leading-[1.6] font-ibmplex">
                       <span className="block">
                      <ScrambleText text="info@freysmiles.com" />
                   </span>
                    </p>
                   <p className="text-[11px] text-white leading-[1.6] font-ibmplex">
                     <span className="block">
                                    <ScrambleText text="(610)437-4748" charsType="numbers" />
                     </span>
             
                           </p>
              
                  </div>

                  <div>
                    <p className="text-[11px] text-white mb-1 font-ibmplex uppercase">
                      <ScrambleText text="BOOKING" className="mr-10" />
                    </p>
                    <p className="text-[11px] text-white leading-[1.5] font-ibmplex">
                      <ScrambleText text="booking@freysmiles.com" charsType="numbers" />
                      <br />
                      <ScrambleText
                        text="FreySmiles"
                        charsType="numbers"
                      />
                      <br />
                      <ScrambleText text="Allentown PA" charsType="numbers" />
                    </p>
                  </div>
                </div>
      
              </div>
            </p>
          </div>
          
          <div className="creativity-footer__svg-animation">
<svg 
  width="100%" 
  viewBox="0 0 242 94" 
  fill="none" 
  xmlns="http://www.w3.org/2000/svg" 
  className="creativity-svg-animation"
>
  <g
    ref={addToSvgPathsRef}
    className="creativity-svg-path"
    transform="translate(6, 10) scale(2.5)"
  >
    <defs>
      <linearGradient id="glassGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#A3A8F0" stopOpacity="0.4" />
        <stop offset="50%" stopColor="#C6B5F7" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#A0EACF" stopOpacity="0.2" />
      </linearGradient>

    </defs>

<g fill="url(#glassGradient)">
      <path d="M0 8H8V34H0V24H8V16H0V8Z" />
      <rect x="8" width="20" height="8" />
      <rect x="8" y="16" width="16" height="8" />
    </g>
  </g>

 
  <image
    ref={addToSvgPathsRef}
    href="/images/sshape.svg"
    x="80"
    y="0"
    width="80"
    height="94"
    className="creativity-svg-path"
  />

  <image
    ref={addToSvgPathsRef}
    href="/images/oshape.svg"
    x="160"
    y="0"
    width="80"
    height="94"
    className="creativity-svg-path"
  />

</svg>
          </div>
        </div>
        
<div className="creativity-footer__bottom">
  <div className="creativity-footer__bottom-links">
    <a href="#" className="creativity-footer__link"> Allentown</a>
    <span className="creativity-footer__separator">/</span>
    <a href="#" className="creativity-footer__link">Bethlehem </a>
    <span className="creativity-footer__separator">/</span>
    <a href="#" className="creativity-footer__link"> Schnecksville </a>
    <span className="creativity-footer__separator">/</span>
    <a href="#" className="creativity-footer__link"> Lehighton </a>
  </div>
</div>
      </footer> */}

    </>
  );
}

function ContactHero() {
  return (
    <section className="relative h-screen overflow-hidden">

<div className="relative h-full rounded-2xl border border-white/30 overflow-hidden flex flex-col">

<div className="relative flex-1  flex">
  <div className="absolute inset-0 -z-10">
             <Canvas>
                      <RaymarchingShader />
          </Canvas>
  
  </div>

  <div className="relative w-1/2 p-12 flex flex-col justify-center">

<p className="text-white/70 mt-4 font-neuehaas45">Have a question? Send us a message or book a visit.</p>

<div className="grid grid-cols-2 gap-6 max-w-xl">

<div className="font-neuehaas45 flex flex-col gap-2">


  <span className="text-[10px] tracking-widest text-white/80 uppercase ml-1">
    Name
  </span>


  <div className="relative h-18 rounded-2xl border border-white/40 bg-white/20 backdrop-blur-xl px-6 flex items-center">
<input
  className="bg-transparent w-full text-lg text-black placeholder-black/60 outline-none border-none ring-0 focus:ring-0 focus:outline-none appearance-none"
/>
  </div>

</div>

<div className="font-neuehaas45 flex flex-col gap-2">


  <span className="text-[10px] tracking-widest text-white/80 uppercase ml-1">
    Email
  </span>

  <div className="relative h-18 rounded-2xl border border-white/40 bg-white/20 backdrop-blur-xl px-6 flex items-center">
<input

  className="bg-transparent w-full text-lg text-black placeholder-black/60 outline-none border-none ring-0 focus:ring-0 focus:outline-none appearance-none"
/>
  </div>

</div>


<div className="font-neuehaas45 flex flex-col gap-2 col-span-2">


  <span className="text-[10px] tracking-widest text-white/80 uppercase ml-1">
    Message
  </span>

  <div className="relative h-32 rounded-2xl border border-white/40 bg-white/20 backdrop-blur-xl px-6 flex items-center">
<input
  className="bg-transparent w-full text-lg text-black placeholder-black/60 outline-none border-none ring-0 focus:ring-0 focus:outline-none appearance-none"
/>
  </div>

</div>

</div>

    <div className="mt-10">
      <button className="w-20 h-20 rounded-full border border-white/50 flex items-center justify-center text-white text-3xl hover:bg-white/10 transition">
        ↗
      </button>
    </div>
  </div>

  <div className="w-1/2 h-full p-10 flex items-center justify-center acuity-font">
    <div className="w-full h-full rounded-2xl overflow-hidden backdrop-blur-xl border border-white/20 shadow-lg">
      <iframe
        src="https://freysmilesappointments.as.me/"
        title="Schedule Appointment"
        className="w-full h-full"
        frameBorder="0"
        allow="payment"
      />
    </div>
  </div>

</div>
      </div>
    </section>
  );
}

const OfficeChat = () => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [intent, setIntent] = useState(null);
  const [typing, setTyping] = useState(false);
  const [questionStep, setQuestionStep] = useState(0);
  const [question, setQuestion] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);
  const chatContainerRef = useRef(null);
  const [moderationMessage, setModerationMessage] = useState(null);
const [showTeamForm, setShowTeamForm] = useState(false);
const [messageStep, setMessageStep] = useState(0);
const [officeMessage, setOfficeMessage] = useState("");
const [officeEmail, setOfficeEmail] = useState("");
const [officePhone, setOfficePhone] = useState("");

  useEffect(() => {
    if (!chatContainerRef.current) return;

    requestAnimationFrame(() => {
      const container = chatContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    });

  }, [step, typing, questionStep, intent, contactMethod, contactValue, moderationMessage]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);
  
  // useEffect(() => {
  //   if (step !== 1) return;
  //   setTyping(true);
  //   const t = setTimeout(() => {
  //     setTyping(false);
  //     setStep(2);
  //   }, 900);
  //   return () => clearTimeout(t);
  // }, [step]);

const handleIntentSelect = (selectedIntent) => {
  setIntent(selectedIntent);
  
  if (selectedIntent === "book") {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setTimeout(() => {
        setShowScheduler(true);
      }, 500);
    }, 900);
  }
  
  if (selectedIntent === "job") {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setTimeout(() => {
        setShowTeamForm(true);
      }, 500);
    }, 900);
  }
  
  if (selectedIntent === "ai") {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setQuestionStep(1);
    }, 900);
  }

  if (selectedIntent === "message") {
  setTyping(true);
  setTimeout(() => {
    setTyping(false);
    setMessageStep(1);
  }, 900);
}
};
const handleQuestionSubmit = async () => {
  if (!question.trim()) return;
  console.log("Submitting question:", question);
  const res = await fetch("/api/moderate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: question })
  });

  const data = await res.json();
  console.log("Moderation response:", data);

  if (data.flagged) {
    setModerationMessage(
      "Let's keep it respectful. Mind rephrasing that?"
    );
    return;
  }


  setModerationMessage(null);

  setTyping(true);

  setTimeout(() => {
    setTyping(false);
    setQuestionStep(2);

    setTimeout(() => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setQuestionStep(3);
      }, 900);
    }, 600);
  }, 900);
};
const handleOfficeMessageSubmit = async () => {
  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(officeEmail);

  const phoneValid =
    officePhone.replace(/\D/g, "").length >= 10;

  if (
    !officeMessage.trim() ||
    !emailValid ||
    !phoneValid
  ) {
    return;
  }

  setTyping(true);

  setTimeout(() => {
    setTyping(false);
    setMessageStep(2);
  }, 900);
};
  const handleContactSubmit = () => {
    if (!contactValue.trim()) return;
    
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setQuestionStep(4); 
    }, 900);
  };

  return (
    <div className="fixed inset-0 bg-white overflow-hidden">
      <MouseTrail
        images={[
          "../images/mousetrail/flame.png",
          "../images/mousetrail/cat.png",
          "../images/mousetrail/pixelstar.png",
          "../images/mousetrail/avocado.png",
          "../images/mousetrail/ghost.png",
          "../images/mousetrail/pacman.png",
          "../images/mousetrail/evilrobot.png",
          "../images/mousetrail/thirdeye.png",
          "../images/mousetrail/alientcat.png",
          "../images/mousetrail/gotcha.png",
          "../images/mousetrail/karaokekawaii.png",
          "../images/mousetrail/mushroom.png",
          "../images/mousetrail/pixelcloud.png",
          "../images/mousetrail/pineapple.png",
          "../images/mousetrail/pixelsun.png",
          "../images/mousetrail/cherries.png",
          "../images/mousetrail/watermelon.png",
          "../images/mousetrail/dolphins.png",
          "../images/mousetrail/jellyfish.png",
          "../images/mousetrail/nyancat.png",
          "../images/mousetrail/donut.png",
          "../images/mousetrail/controller.png",
          "../images/mousetrail/dinosaur.png",
          "../images/mousetrail/headphones.png",
          "../images/mousetrail/porsche.png",
        ]}
      />  
 {visible && (
    <div className="relative w-full h-full">
   
      <div
        className={`
          absolute inset-0
          transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
             ${showScheduler || showTeamForm 
            ? "opacity-0 translate-y-6 pointer-events-none"
            : "opacity-100 translate-y-0"
          }
        `}
      >
        <div
          className="w-full h-full px-[12vw] pt-[10vh] pb-[15vh] overflow-y-auto scroll-smooth"
          ref={chatContainerRef}
        >
          <div className="flex flex-col gap-8 max-w-3xl min-h-full">

            <div className="flex justify-start">
              <OfficeMessage />
            </div>
            

            <div className="flex justify-end">
              <UserResponse
                name={name}
                setName={setName}
                submitted={step >= 1}
              onSubmit={() => {
  if (!name.trim()) return;

  setTyping(true);

  setTimeout(() => {
    setTyping(false);
    setStep(1);
    setTimeout(() => {
      setStep(2);
    }, 900);

  }, 900);
}}
              />
            </div>
            
  
            {typing && !showScheduler && !showTeamForm && (
              <div className="flex justify-start">
                <OfficeTyping />
              </div>
            )}
            
            {step >= 1 && !showScheduler && !showTeamForm && (
              <div className="flex justify-start">
                <OfficeGreeting name={name} />
              </div>
            )}
            

{step >= 2  && !showScheduler && !showTeamForm && (
  <div className="flex justify-start">
    <OfficeFollowUp 
      intent={intent} 
      setIntent={handleIntentSelect}
    />
  </div>
)}


{intent === "ai" &&
 questionStep >= 1 &&
 !showScheduler &&
 
 !showTeamForm && (
  <>
    <div className="flex justify-start">
      <OfficeQuestionPrompt />
    </div>

    <div className="flex justify-end">
      <UserQuestion
        question={question}
        setQuestion={setQuestion}
        setModerationMessage={setModerationMessage}
        onSubmit={handleQuestionSubmit}
        isSubmitted={questionStep >= 2}
      />
    </div>

    {moderationMessage && (
      <div className="flex justify-start mt-4">
        <OfficeMessage customText={moderationMessage} />
      </div>
    )}
  </>
)}


{intent === "ai" &&
 questionStep >= 2 &&
 !showScheduler &&
 !showTeamForm && (
  <div className="flex justify-start">
    <OfficeContactPrompt name={name} />
  </div>
)}
{intent === "message" &&
 messageStep >= 1 &&
 !showScheduler &&
 !showTeamForm && (
  <>
    <div className="flex justify-start">
      <OfficeMessage customText="This goes straight to our team. Leave us a note and we’ll personally follow up." />
    </div>

    <div className="flex justify-end">
<UserMessage
  message={officeMessage}
  setMessage={setOfficeMessage}
  email={officeEmail}
  setEmail={setOfficeEmail}
  phone={officePhone}
  setPhone={setOfficePhone}
  onSubmit={handleOfficeMessageSubmit}
  isSubmitted={messageStep >= 2}
/>
    </div>
  </>
)}

            {questionStep >= 3 && !showScheduler && !showTeamForm&& (
              <div className="flex justify-end">
                <UserContact
                  contactMethod={contactMethod}
                  setContactMethod={setContactMethod}
                  contactValue={contactValue}
                  setContactValue={setContactValue}
                  onSubmit={handleContactSubmit}
                  isSubmitted={questionStep >= 4}
                />
              </div>
            )}

    
            {questionStep >= 4 && !showScheduler && !showTeamForm && (
              <div className="flex justify-start">
                <OfficeFinalThankYou 
                  name={name} 
                  contactMethod={contactMethod} 
                />
              </div>
            )}
          </div>
        </div>
      </div>


<div
  className={`
    absolute inset-0 z-40
    transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
    ${showScheduler
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-6 pointer-events-none"}
  `}
>

  <div className="w-full h-full px-[6vw] py-[4vh] flex flex-col">

      <div className="flex flex-1 items-center justify-center">
   <div
  className="
    relative
    w-full max-w-[1100px]
    h-[90vh]
    rounded-2xl overflow-hidden
    backdrop-blur-xl border border-white/20 shadow-lg
    bg-white/60
  "
>
  <iframe
    src="https://app.acuityscheduling.com/schedule.php?owner=37690830"
    title="Schedule Appointment"
    className="w-full h-full z-10"
    frameBorder="0"
    allow="payment"
  />

  <button
    type="button"
    onClick={() =>{ setShowScheduler(false);  setIntent(null);
  setQuestionStep(0);}}
    className="
      absolute right-12 top-24 font-canelathin text-white z-50"
  >
     Back to chat
  </button>
</div>
      </div>


  </div>
</div>

<div
  className={`
    absolute inset-0 z-50
    transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
    ${showTeamForm 
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-6 pointer-events-none"
    }
  `}
>
  <div className="w-full h-full overflow-y-auto">

    <div className="font-neuehaas45 w-full h-full">
      <div className="relative w-full h-full bg-gradient-to-br from-[#4E5353] via-[#505456] to-[#3E4243] text-[#EDE5D7] overflow-y-auto p-12 md:p-20 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
        

        <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-noise z-[2]" />
        <div className="relative ">
                      <button
          type="button"
          onClick={() => {
  setShowTeamForm(false);
  setIntent(null);
  setQuestionStep(0);
}}
          className="absolute top-[1%] right-8 text-sm opacity-70 hover:opacity-100 
                     transition-opacity focus:outline-none rounded px-2 py-1 text-[#EDE5D7] z-10"
        >
          ✕ Close
        </button>
          <h2 className="text-[28px] font-canelathin mb-10">
            Start Your Application
            <span className="opacity-50 font-canelathin mx-2">—</span>
            <span className="text-[14px] tracking-wide opacity-70 align-middle font-neuehaas45 text-[#FEB44A]">
              For open positions at Frey Smiles
            </span>
          </h2>
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setTyping(true);
              setTimeout(() => {
                setTyping(false);
                setShowTeamForm(false);
              }, 900);
            }}
            className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-8"
          >

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                    Full Name
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="Jane Doe"
                    className="w-full bg-transparent border border-white/20 rounded-lg 
                             px-4 py-3 text-[12px] leading-relaxed text-white/85
                             placeholder:text-white/35 tracking-[0.01em]
                             focus:outline-none focus:border-white/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                    Best way to reach you
                  </label>
                  <input
                    name="contact"
                    required
                    placeholder="Email or phone number"
                    className="w-full bg-transparent border border-white/20 rounded-lg 
                             px-4 py-3 text-[12px] leading-relaxed text-white/85
                             placeholder:text-white/35 tracking-[0.01em]
                             focus:outline-none focus:border-white/60 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                    High school graduation year
                  </label>
                  <select
                    name="gradYear"
                    required
                    className="w-full bg-transparent border border-white/20 rounded-lg 
                             px-4 py-3 text-[12px] leading-relaxed text-white/85
                             placeholder:text-white/35 tracking-[0.01em]
                             focus:outline-none focus:border-white/60 transition-colors"
                  >
                    <option value="">Select year</option>
                    {Array.from({ length: 40 }, (_, i) => {
                      const year = 2027 - i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                    Do you have experience working in dentistry or orthodontics?
                  </label>
                  <select
                    name="experience"
                    required
                    className="w-full bg-transparent border border-white/20 rounded-lg 
                             px-4 py-3 text-[12px] leading-relaxed text-white/85
                             placeholder:text-white/35 tracking-[0.01em]
                             focus:outline-none focus:border-white/60 transition-colors"
                  >
                    <option value="">Select</option>
                    <option value="no">No</option>
                    <option value="yes-dentistry">Yes — Dentistry</option>
                    <option value="yes-ortho">Yes — Orthodontics</option>
                    <option value="yes-both">Yes — Both</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                    Position you're interested in
                  </label>
                  <select
                    name="role"
                    required
                    className="w-full bg-transparent border border-white/20 rounded-lg 
                             px-4 py-3 text-[12px] leading-relaxed text-white/85
                             placeholder:text-white/35 tracking-[0.01em]
                             focus:outline-none focus:border-white/60 transition-colors"
                  >
                    <option value="">Select role</option>
                    <option value="assistant">Clinical Assistant</option>
                    <option value="front-desk">Front Desk / Admin</option>
                    <option value="coordinator">Treatment Coordinator</option>
                    <option value="sterilization">Sterilization / Lab</option>
                    <option value="open">Open / Unsure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                    How did you hear about us?
                  </label>
                  <select
                    name="source"
                    required
                    className="w-full bg-transparent border border-white/20 rounded-lg 
                             px-4 py-3 text-[12px] leading-relaxed text-white/85
                             placeholder:text-white/35 tracking-[0.01em]
                             focus:outline-none focus:border-white/60 transition-colors"
                  >
                    <option value="">Select source</option>
                    <option value="website">Website</option>
                    <option value="social">Social Media</option>
                    <option value="friend">Friend / Employee</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                  When would you be available to start?
                </label>
                <input
                  name="availability"
                  required
                  placeholder="Immediately, in 2 weeks, next month…"
                  className="text-[12px] leading-relaxed text-white/85
                           placeholder:text-white/35 opacity-70  
                           w-full bg-transparent border border-white/20 rounded-lg 
                           px-4 py-3 focus:outline-none focus:border-white/60
                           transition-colors"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <div>
                <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                  Resume (PDF preferred)
                </label>
                <label className="flex items-center justify-center border border-white/30 
                                  rounded-lg px-6 py-4 cursor-pointer 
                                  hover:border-white transition-colors">
                  <input
                    type="file"
                    name="resume"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                    }}
                  />
                  <span className="text-[12px] leading-relaxed text-white/85 opacity-70">
                    Click to add resume
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                  What interests you about working with our practice?
                </label>
                <textarea
                  name="motivation"
                  maxLength={300}
                  rows={5}
                  required
                  placeholder="max 300 characters"
                  className="text-[12px] leading-relaxed text-white/85
                           placeholder:text-white/35 opacity-70  
                           w-full bg-transparent border border-white/20 rounded-lg 
                           px-4 py-3 focus:outline-none focus:border-white/60 
                           resize-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm opacity-70 mb-2 min-h-[38px] text-[#FEB44A]">
                  Is there anything else you'd like us to know?
                </label>
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Optional"
                  className="text-[12px] leading-relaxed text-white/85
                           placeholder:text-white/35 opacity-70  
                           w-full bg-transparent border border-white/20 rounded-lg 
                           px-4 py-3 focus:outline-none focus:border-white/60 
                           resize-none transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="border text-[13px] uppercase tracking-widest 
                           border-white/20 rounded-lg px-10 py-5 
                           transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                           hover:border-white/60"
                >
                  Submit
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>
    </div>
  )}
    </div>
  );
};

const UserQuestion = ({ question, setQuestion,  setModerationMessage, onSubmit, isSubmitted }) => {
  return (
    <div className="w-[420px]">
      <div className="bg-white rounded-[32px] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.05)]">
        <div className="text-sm font-canelathin text-neutral-700 mb-3">
          My question is...
        </div>
        <div className="relative">
          <input
            type="text"
            value={question}
              onChange={(e) => {
    setQuestion(e.target.value);
    setModerationMessage(null);
  }}

            onKeyDown={(e) => {
              if (e.key === "Enter" && !isSubmitted) onSubmit();
            }}
            placeholder={isSubmitted ? "Question sent" : "Type your question here..."}
            disabled={isSubmitted}
            className={`
              w-full bg-neutral-100 rounded-full px-4 py-3 font-neuehaas45 text-[13px] outline-none
              ${isSubmitted 
                ? 'text-neutral-500 placeholder:text-neutral-400 cursor-default' 
                : 'placeholder:text-neutral-400'
              }
            `}
          />
          <button
            onClick={onSubmit}
            disabled={isSubmitted || !question.trim()}
            className={`
              absolute right-1 top-1/2 -translate-y-1/2 
              w-10 h-10 rounded-full 
              flex items-center justify-center text-lg
              transition-all duration-200
              ${isSubmitted || !question.trim()
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-white shadow hover:shadow-md text-neutral-900'
              }
            `}
          >
            {isSubmitted ? '✓' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserContact = ({ 
  contactMethod, 
  setContactMethod, 
  contactValue, 
  setContactValue, 
  onSubmit,
  isSubmitted 
}) => {
  const contactOptions = [
    { value: "email", label: "📧 Email", placeholder: "your@email.com" },
    { value: "phone", label: "📱 Phone", placeholder: "(123) 456-7890" },
    { value: "other", label: "🕊️ Other", placeholder: "Instagram, LinkedIn, etc." }
  ];

  return (
    <div className="w-[420px]">
      <div className="bg-white rounded-[32px] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.05)]">
        <div className="text-sm font-canelathin text-neutral-700 mb-3">
          You can reach me via...
        </div>
        
        <div className="flex gap-2 mb-4">
          {contactOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => !isSubmitted && setContactMethod(option.value)}
              disabled={isSubmitted}
              className={`
                flex-1 px-3 py-2 rounded-full text-[11px] font-neuehaas45
                transition-all duration-200
                ${isSubmitted && contactMethod === option.value
                  ? 'bg-neutral-900 text-white'
                  : contactMethod === option.value 
                    ? 'bg-neutral-900 text-white' 
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }
                ${isSubmitted ? 'cursor-default opacity-80' : ''}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={contactValue}
            onChange={(e) => !isSubmitted && setContactValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isSubmitted) onSubmit();
            }}
            placeholder={isSubmitted 
              ? "Contact info saved!" 
              : (contactOptions.find(opt => opt.value === contactMethod)?.placeholder || "How can we reach you?")
            }
            disabled={isSubmitted}
            className={`
              w-full bg-neutral-100 rounded-full px-4 py-3 font-neuehaas45 text-[13px] outline-none
              ${isSubmitted 
                ? 'text-neutral-500 placeholder:text-neutral-400 cursor-default' 
                : 'placeholder:text-neutral-400'
              }
            `}
          />
          <button
            onClick={onSubmit}
            disabled={isSubmitted || !contactMethod || !contactValue.trim()}
            className={`
              absolute right-1 top-1/2 -translate-y-1/2 
              w-10 h-10 rounded-full 
              flex items-center justify-center text-lg
              transition-all duration-200
              ${isSubmitted || !contactMethod || !contactValue.trim()
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-white shadow hover:shadow-md text-neutral-900'
              }
            `}
          >
            {isSubmitted ? '✓' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserMessage = ({
  message,
  setMessage,
  email,
  setEmail,
  phone,
  setPhone,
  onSubmit,
  isSubmitted
}) => {
const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const phoneValid = phone.replace(/\D/g, "").length >= 10;

const isValid =
  message.trim() &&
  emailValid &&
  phoneValid;
  return (
    <div className="w-[520px]">
      <div className="bg-white rounded-[36px] p-8 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">

        <div className="text-sm font-canelathin text-neutral-700 mb-6">
          My message is…
        </div>


        <div className="flex flex-col gap-4 mb-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            disabled={isSubmitted}
            className="w-full font-neuehaas45 bg-neutral-100 rounded-full px-5 py-3 text-[12px] outline-none"
          />

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
            disabled={isSubmitted}
            className="w-full font-neuehaas45 bg-neutral-100 rounded-full px-5 py-3 text-[12px] outline-none"
          />
        </div>


        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            disabled={isSubmitted}
            placeholder={
              isSubmitted
                ? "Message sent"
                : "Type your message here..."
            }
            className="w-full font-neuehaas45 bg-neutral-100 rounded-[24px] px-5 py-4 text-[12px] outline-none resize-none"
          />

          <button
            onClick={onSubmit}
            disabled={!isValid || isSubmitted}
            className={`
              absolute right-3 bottom-3
              w-11 h-11 rounded-full
              flex items-center justify-center text-lg
              transition-all duration-200
              ${
                !isValid || isSubmitted
                  ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                  : "bg-white shadow hover:shadow-md text-neutral-900"
              }
            `}
          >
            {isSubmitted ? "✓" : "→"}
          </button>
        </div>
      </div>
    </div>
  );
};

const OfficeContactPrompt = ({ name }) => {
  return (
    <div className="max-w-[520px]">
        <div className="text-sm font-canelathin text-neutral-500 mb-2">
        <strong className="text-neutral-800">Concierge</strong>, Frey Smiles
      </div>
      <div className="bg-white rounded-full px-6 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.04)] font-neuehaas45 text-[13px] leading-snug">
        Got it{name ? `, ${name}` : ""}! 🤍<br />
        How should we reach you — email or phone?
      </div>
    </div>
  );
};



const OfficeFinalThankYou = ({ name, contactMethod }) => {
  const getContactEmoji = () => {
    switch(contactMethod) {
      case 'email': return '📧';
      case 'phone': return '📱';
      default: return '🕊️';
    }
  };

  return (
    <div className="max-w-[520px]">
        <div className="text-sm font-canelathin text-neutral-500 mb-2">
        <strong className="text-neutral-800">Concierge</strong>, Frey Smiles
      </div>
      <div className="bg-white rounded-full px-6 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.04)] font-neuehaas45 text-[12px] leading-snug">
        Perfect{name ? `, ${name}` : ""}! {getContactEmoji()}<br />
        We'll be in touch within 24 hours. 👋
      </div>
    </div>
  );
};


const OfficeFollowUp = ({ intent, setIntent }) => {
const options = [
  {
    id: "book",
    label: "Book an appointment",
  },
  {
    id: "job",
    label: "Apply for a job",
  },
  {
    id: "ai",
    label: "Ask our AI Smile Assistant",
    description: "Instant answers about treatment"
  },
  {
    id: "message",
    label: "Send a message to the office",
    description: "For patient-specific or urgent questions"
  }
];

  return (
    <div className="w-[520px]">
      <div className="bg-white rounded-[36px] px-8 py-7 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
        <div className="text-[13px] font-neuehaas45 mb-6">
          I would like to…
        </div>
        <div className="font-neuehaas45 text-[13px] flex flex-col gap-5">
      {options.map((option) => (
  <button
    key={option.id}
    onClick={() => setIntent(option.id)}
    className="flex items-start justify-between text-left text-neutral-500 hover:text-neutral-800 transition-colors"
  >
    <div className="flex flex-col">
      <span>{option.label}</span>
      <span className="text-[11px] text-neutral-400 mt-1">
        {option.description}
      </span>
    </div>

    <span
      className={`
        w-4 h-4 rounded-full border flex items-center justify-center mt-1
        ${intent === option.id ? "border-neutral-900" : "border-neutral-300"}
      `}
    >
      {intent === option.id && (
        <span className="w-2 h-2 rounded-full bg-neutral-900" />
      )}
    </span>
  </button>
))}
        </div>
      </div>
    </div>
  );
};

const OfficeQuestionPrompt = () => {
  return (
    <div className="max-w-[520px]">
            <div className="text-sm font-canelathin text-neutral-500 mb-2">
        <strong className="text-neutral-800">Concierge</strong>, Frey Smiles
      </div>
      <div className="bg-white rounded-full px-6 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.04)] font-neuehaas45
       text-[13px] leading-snug">
        What's on your mind?
      </div>
    </div>
  );
};

const OfficeGreeting = ({ name }) => {
  return (
    <div className="max-w-[520px]">
            <div className="text-sm font-canelathin text-neutral-500 mb-2">
        <strong className="text-neutral-800">Concierge</strong>, Frey Smiles
      </div>
      <div className="bg-white rounded-full px-6 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.04)] font-neuehaas45 text-[13px] leading-snug">
        Hi{name ? `, ${name}` : ""}! 👽 
        <br />
        What can we do for you today?
      </div>
    </div>
  );
};

const OfficeMessage = ({ customText }) => {
  const text = customText ?? "Hey there 👋 what should we call you?";

  return (
    <div className="max-w-[520px]">
      <div className="text-sm font-canelathin text-neutral-500 mb-2">
        <strong className="text-neutral-800">Concierge</strong>, Frey Smiles
      </div>
      <div className="font-neuehaas45 bg-white rounded-full px-6 py-4 text-[13px] leading-snug shadow-[0_12px_30px_rgba(0,0,0,0.04)]">
        {text}
      </div>
    </div>
  );
};

const UserResponse = ({ name, setName, onSubmit }) => {
  return (
    <div className="w-[420px]">
      <div className="bg-white rounded-[32px] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.05)]">
        <div className="text-sm font-canelathin text-neutral-700 mb-3">
          I go by...
        </div>
        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit();
            }}
            placeholder="Your name"
            className="w-full bg-neutral-100 rounded-full px-4 py-3 font-neuehaas45 text-[13px] outline-none placeholder:text-neutral-400"
          />
          <button
            onClick={onSubmit}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-lg"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

const OfficeTyping = () => {
  return (
    <div className="bg-white rounded-full px-6 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.04)] flex gap-2 items-center">
      <Dot delay="0ms" />
      <Dot delay="150ms" />
      <Dot delay="300ms" />
    </div>
  );
};

const Dot = ({ delay }) => (
  <span
    className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
    style={{ animationDelay: delay }}
  />
);


class MousePointer {
  constructor() {
    this.x = window.innerWidth * 0.5;
    this.y = window.innerHeight * 0.5;
    this.normal = { x: 0, y: 0 };
    this.isDown = false;

    this._setupListeners();
  }

  _setupListeners() {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const target = document.querySelector(".l-canvas") || window;

    if (isTouch) {
      target.addEventListener("touchstart", (e) => this._handleStart(e));
      target.addEventListener("touchend", () => this._handleEnd());
      target.addEventListener("touchmove", (e) => this._handleMove(e), {
        passive: false,
      });
    } else {
      window.addEventListener("mousedown", (e) => this._handleStart(e));
      window.addEventListener("mouseup", () => this._handleEnd());
      window.addEventListener("mousemove", (e) => this._handleMove(e));
    }
  }

  _handleStart(e) {
    this.isDown = true;
    this._updatePosition(e);
  }

  _handleEnd() {
    this.isDown = false;
  }

  _handleMove(e) {
    this._updatePosition(e);
  }

  _updatePosition(e) {
    const pos = this._getEventPosition(e);
    this.x = pos.x;
    this.y = pos.y;

    this.normal.x = this.x / window.innerWidth;
    this.normal.y = this.y / window.innerHeight;
  }

  _getEventPosition(e) {
    if (e.touches) {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
    return {
      x: e.clientX,
      y: e.clientY,
    };
  }
}

const mousePointer = new MousePointer();

const map = (num, toMin, toMax, fromMin, fromMax) => {
  if (num <= fromMin) return toMin;
  if (num >= fromMax) return toMax;
  const p = (toMax - toMin) / (fromMax - fromMin);
  return (num - fromMin) * p + toMin;
};

const useWindowSize = () => {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
};

     