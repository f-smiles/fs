"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { CopyButton } from "@/components/ui/shadcn-io/copy-button";
import { ChevronDown } from "lucide-react";

gsap.registerPlugin(SplitText);

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

  mat2 Rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
  }

  vec2 hash( vec2 p ) {
    p = vec2( dot(p,vec2(2127.1,81.17)), dot(p,vec2(1269.5,283.37)) );
    return fract(sin(p)*43758.5453);
  }

  float noise( in vec2 p ) {
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

    // vec3 warm1 = vec3(1.00, 0.68, 0.90); // airy blush
    // vec3 warm2 = vec3(0.95, 0.82, 1.00); // lavender-white

    // vec3 warm1 = vec3(1.00, 0.55, 0.85); // hot pink
    // vec3 warm2 = vec3(0.95, 0.77, 1.00); // lavender pink

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

export default function BookNow() {
  const containerOneRef = useRef(null);
  const h1Ref = useRef(null);
  const telephone = "610-437-4748";
  const email = "info@freysmiles.com";
  
  useEffect(() => {
    if (!h1Ref.current) return;
    
    const split = SplitText.create(h1Ref.current, { types: "chars" });
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

  return (
    <div className="flex flex-col w-full md:flex-row">
      <section className="relative z-10 w-full h-[100dvh] flex flex-col items-center justify-center text-white p-8 overflow-hidden">

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
          <div className="absolute w-[400px] h-[400px] border border-white/35 rounded-full top-[100px] right-10" />
          <div className="absolute w-[450px] h-[450px] border border-white/30 rounded-full bottom-[60px] left-0" />
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-0">
          <div className="circle-loader relative">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`circle circle-${i}`} />
            ))}
          </div>
        </div>

        <div ref={containerOneRef} className="z-10 absolute top-1/2 -translate-y-1/2 pb-[0.1em] overflow-hidden">
          <h1 ref={h1Ref} className="text-[32px] font-canela-italic italic text-center leading-[1.2em] lowercase lg:text-[34px]">Website Coming Soon</h1>
          <Link prefetch={false} href="#acuity-calendar" className="mt-[14px] flex flex-col items-center justify-center text-center font-canela uppercase text-[16px] md:hidden">
            Book Now
            <ChevronDown className="animate-bounce size-5" />
          </Link>
        </div>

        <div className="absolute top-[80%] right-8 -translate-y-1/2 font-neuehaas35 text-[14px] text-left leading-relaxed z-10 lg:text-[16px]">
          <div className="flex flex-col gap-3 items-start">
            <div className="flex items-center justify-between rounded-full border border-zinc-50/50 pr-1">
              <input 
                value={telephone}
                readOnly 
                className="flex-1 px-3 py-2 bg-transparent font-neuehaas45 tracking-wider text-zinc-50"
              />
              <CopyButton
                content={telephone}
                onCopy={() => console.log("Number copied!")}
                className="rounded-full bg-zinc-50/50 text-zinc-950/50 hover:bg-zinc-50/100"
              />
            </div>
            <div className="flex items-center justify-between rounded-full border border-zinc-50/50/50 pr-1">
              <input 
                value={email} 
                readOnly 
                className="flex-1 px-3 py-2 bg-transparent font-neuehaas45 tracking-wider text-zinc-50"
              />
              <CopyButton
                content={email}
                onCopy={() => console.log("Email copied!")}
                className="rounded-full bg-zinc-50/50 text-zinc-950/50 hover:bg-zinc-50/100"
              />
            </div>
          </div>
        </div>
      </section>

      <div id="acuity-calendar" className="acuity-font w-full h-[100dvh] flex items-center justify-center bg-white">
        <iframe
          src={process.env.NEXT_PUBLIC_ACUITY_SCHEDULING_SRC}
          title="Schedule Appointment"
          width="100%"
          height="100%"
          frameBorder="0"
          allow="payment"
          className="border-0"
        ></iframe>
      </div>
    </div>
  );
}