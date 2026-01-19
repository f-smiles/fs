"use client";
import { createPortal } from "react-dom";
import { Renderer, Program, Mesh, Plane, Uniform } from "wtc-gl";
import { Vec2, Mat2 } from "wtc-math";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import React, { useRef, useEffect, useState, useMemo, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import "tw-elements";
import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import ScrollTrigger from "gsap/ScrollTrigger";
import { Text, OrbitControls } from "@react-three/drei";
import { useThree, useFrame, extend, Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { NormalBlending } from 'three';
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { SplitText } from 'gsap/SplitText';
import { AnimatePresence } from "framer-motion";

gsap.registerPlugin(MorphSVGPlugin, ScrollTrigger, ScrambleTextPlugin, SplitText);


extend({ OrbitControls, EffectComposer });

const ParticleSystem = () => {
  const particlesCount = 27000;
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef();

  const positions = useMemo(() => new Float32Array(particlesCount * 3), []);
  const velocities = useMemo(() => new Float32Array(particlesCount * 3), []);

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

      velocities[i * 3] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
  };

  useEffect(() => {
    createSphere(particlesCount, 400);
    if (particlesRef.current) {
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  }, []);

  const { size, gl } = useThree();
  const boundsRef = useRef();

  useEffect(() => {
    const canvasEl = gl.domElement;
    const handleMove = (e) => {
      const rect = canvasEl.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouseRef.current.x = x;
      mouseRef.current.y = y;
    };
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [gl]);

  useFrame(() => {
    if (!particlesRef.current) return;
    const pos = particlesRef.current.geometry.attributes.position.array;

    for (let i = 0; i < pos.length; i += 3) {
      pos[i] += velocities[i];
      pos[i + 1] += velocities[i + 1];
      pos[i + 2] += velocities[i + 2];

      const dist = Math.sqrt(pos[i] ** 2 + pos[i + 1] ** 2 + pos[i + 2] ** 2);
      const radius = 400;
if (dist > radius) {
  const nx = pos[i] / dist;
  const ny = pos[i + 1] / dist;
  const nz = pos[i + 2] / dist;

  // snap to surface
  pos[i] = nx * radius;
  pos[i + 1] = ny * radius;
  pos[i + 2] = nz * radius;

  // reflect velocity inward
  const dot =
    velocities[i] * nx +
    velocities[i + 1] * ny +
    velocities[i + 2] * nz;

  velocities[i] -= 2 * dot * nx;
  velocities[i + 1] -= 2 * dot * ny;
  velocities[i + 2] -= 2 * dot * nz;

  // optional damping
  velocities[i] *= 0.6;
  velocities[i + 1] *= 0.6;
  velocities[i + 2] *= 0.6;
}
const dx = mouseRef.current.x - pos[i];
const dy = -mouseRef.current.y - pos[i + 1];
const distance = Math.sqrt(dx * dx + dy * dy);

const MOUSE_RADIUS = 120;
const MOUSE_STRENGTH = 0.04;

if (distance > 0 && distance < MOUSE_RADIUS) {
  const force =
    (1 - distance / MOUSE_RADIUS) * MOUSE_STRENGTH;

  velocities[i] -= (dx / distance) * force;
  velocities[i + 1] -= (dy / distance) * force;
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
  size={2.6}
  sizeAttenuation
  transparent
  opacity={0.4}
  depthWrite={false}
  blending={NormalBlending}
/>

    </points>
  );
};

const Scene = () => {
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
  

  if (document.body) {
    document.body.appendChild(el);
  }

  return () => {

    if (typeof document !== "undefined" && 
        document.body && 
        document.body.contains(el)) {
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
      } catch (err) {
        console.warn("Clipboard API failed:", err);
      }
    }

    if (!success && textareaRef.current) {
      const el = textareaRef.current;
      el.value = text;
el.setSelectionRange(0, text.length);
      try {
        success = document.execCommand("copy");
      } catch (err) {
        console.warn("execCommand fallback failed:", err);
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="
        relative px-5 py-2 rounded-full text-[12px] tracking-wider
        border-[0.2px] border-white transition-all duration-300
        text-white bg-transparent
        overflow-hidden
      "
    >

      <span
        className={`
          transition-opacity duration-300
          ${copied ? "opacity-0" : "opacity-100"}
        `}
      >
        {label}
      </span>

      <span
        className={`
          font-neuehaas45 absolute inset-0 flex items-center justify-center
          transition-opacity duration-300
          ${copied ? "opacity-100" : "opacity-0"}
        `}
      >
        COPIED
      </span>
    </button>
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

  const starRef = useRef(null);
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  // useEffect(() => {
  //   const width = window.innerWidth;
  //   const height = window.innerHeight;
  //   const maxSize = Math.max(width, height);

  //   const starRect = starRef.current.getBoundingClientRect();
  //   const starWidth = starRect.width;
  //   const targetScale = (maxSize * 4) / starWidth;

  //   gsap.set(contentRef.current, { opacity: 0 });

  //   const tl = gsap.timeline({
  //     defaults: { duration: 2.8, ease: "power2.inOut" },
  //   });

  //   tl.set(starRef.current, {
  //     scale: 0.1,
  //     transformOrigin: "50% 50%",
  //   })
  //   .to(starRef.current, {
  //     scale: targetScale,
  //     duration: 2.5,
  //   })
  //   .to(contentRef.current, {
  //     opacity: 1,
  //     duration: 1.8,
  //   }, "-=2.6")
  //   .set(containerRef.current, { zIndex: -1 });
  // }, []);

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

  const sectionRef = useRef(null);
  const panelRef = useRef(null);

  // useEffect(() => {
  //   const ctx = gsap.context(() => {
  //     gsap.to(panelRef.current, {
  //       rotate: 7,
  //       ease: "none",
  //       scrollTrigger: {
  //         trigger: sectionRef.current,
  //         start: "top top",
  //         end: "+=1000",
  //         scrub: true,
  //         pin: true,
  //       },
  //     })
  //   }, sectionRef)

  //   return () => ctx.revert()
  // }, [])
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

  return (
    <>

 {/* <div className="absolute inset-0 -z-10">
    <Canvas
      orthographic
      camera={{ zoom: 1, position: [0, 0, 1] }}
      className="w-full h-full"
    >
      <ShaderBackground />
    </Canvas>
  </div> */}

<div className="flex flex-col lg:flex-row w-full h-screen">
            {/* <div className="w-1/2 relative h-screen"> */}
              {/* <Canvas
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
              </Canvas> */}

              {/* <div className="relative z-10 flex flex-col justify-center h-full items-center">
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
              </div> */}
            {/* </div> */}

<section
  className="relative z-10 w-full lg:w-1/2 h-[50vh] lg:h-full 
             flex flex-col items-center justify-center text-white p-8 overflow-hidden"
>

  <div className="absolute inset-0 -z-10">
    <Canvas
      orthographic
      camera={{ zoom: 1, position: [0, 0, 1] }}
      className="w-full h-full"
    >
      <ShaderBackground />
    </Canvas>
  </div>

  <div className="pointer-events-none absolute inset-0 z-0">
    <div
      className="
        absolute 
        w-[400px] h-[400px]
        border border-white/35 
        rounded-full
        top-[100px]     
        right-[40px]   
      "
    />
    <div
      className="
        absolute 
        w-[450px] h-[450px]
        border border-white/30
        rounded-full
        bottom-[60px] 
        left-[0px]    
      "
    />
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

  <div className="overflow-hidden pb-[0.1em]">
    <h1
      className=" text-[32px] lg:text-[34px] font-canelathin text-center leading-[1.2]"
      ref={h1Ref}
    >
website coming soon

    </h1>
  </div>
</div>
  {/* Button */}
      <div className="font-neuehaas45 absolute top-[85%] right-16 border border-white rounded-[10px] py-2 px-4 z-10">
        <button
          type="button"
          onClick={() => setOpen(true)}
        >
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
                       text-white 
                       flex items-start justify-center
                       overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Lavender gradient */}
          {/* <div className="absolute inset-0 pointer-events-none z-[0]
                        bg-[radial-gradient(circle_at_45%_22%,rgba(140,130,170,0.10),transparent_55%)]" /> */}

     
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
                         rounded px-2 py-1"
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
                Start Your Application{" "}
                <span className="opacity-50 font-canelathin mx-2">—</span>
                <span className="text-[14px] tracking-wide opacity-70 align-middle font-neuehaas45 text-[#FEB44A]">
                  Drop us your info and we'll reach out
                </span>
              </motion.h2>
              
              <form
                onSubmit={handleSubmit}
                className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-8"
              >
                {/* LEFT COLUMN */}
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

                {/* RIGHT COLUMN */}
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="space-y-8"
                >
                  {/* Resume */}
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
<div
  className="
     text-[14px] lg:text-[16px]
    font-neuehaas45 leading-relaxed
    absolute top-[72%] right-8 z-10 text-left
    -translate-y-1/2
  "
>
  <div className="flex flex-col gap-3 items-start">
    <CopyButton 
      text="610-437-4748" 
      label="copy 610-437-4748" 
    />
    <CopyButton 
      text="info@freysmiles.com" 
      label="copy email" 
    />
  </div>
</div>

</section>

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
</div>
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

        <div className="relative z-10 ">
          
          <div
 
            className="flex justify-between w-full p-10 lg:p-20"
          >

            {/* <div className="acuity-font flex items-center justify-center w-1/2">
            <iframe src="https://app.acuityscheduling.com/schedule.php?owner=37685601&ref=embedded_csp" title="Schedule Appointment" width="100%" height="800" frameBorder="0" allow="payment"></iframe>
            
              <iframe
                src="https://app.acuityscheduling.com/schedule.php?owner=35912720"
                title="Schedule Appointment"
                className="w-full max-w-[820px] min-h-[90vh] "
              />
            </div> */}
          </div>
        </div>
      </section>

      {/* <div ref={containerRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black">
<svg ref={starRef} width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"> <g clip-path="url(#clip0_116_153)"> <path d="M100 0C103.395 53.7596 146.24 96.6052 200 100C146.24 103.395 103.395 146.24 100 200C96.6052 146.24 53.7596 103.395 0 100C53.7596 96.6052 96.6052 53.7596 100 0Z" fill="url(#paint0_linear_116_153)"/> </g> <defs> <linearGradient id="paint0_linear_116_153" x1="100" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse"> <stop stop-color="#DF99F7"/> <stop offset="1" stop-color="#FFDBB0"/> </linearGradient> <clipPath id="clip0_116_153"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
</div> */}
    </>
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