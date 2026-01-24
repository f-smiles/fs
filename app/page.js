"use client";
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import {
  Line2,
  LineMaterial,
  LineGeometry,
} from "three-stdlib";
import { Water } from "three/examples/jsm/objects/Water";
import { Sky } from "three/examples/jsm/objects/Sky";
import { Curtains, Plane } from "curtainsjs";
import { Vector2, Vector4, TextureLoader, CatmullRomCurve3, Vector3  } from "three";
import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore, { Keyboard, Mousewheel } from "swiper/core";
import { Navigation } from "swiper/modules";
import Link from "next/link";
import Matter from "matter-js";
import * as THREE from "three";
import React, {
  useMemo,
  forwardRef,
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
} from "react";

import {
  motion,
  useAnimation,
  stagger,
  useAnimate,
  useInView,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";

import { Disclosure, Transition } from "@headlessui/react";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { SplitText } from "gsap/SplitText";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import ChevronRightIcon from "./_components/ui/ChevronRightIcon";
import * as OGL from "ogl";
import {
  ScrollControls,
  useScroll as useThreeScroll,
  Scroll,
  Text,
  OrbitControls,
  useGLTF,
  shaderMaterial,
  useFBO,
  Line,
  useTexture
} from "@react-three/drei";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";

if (typeof window !== "undefined") {
  gsap.registerPlugin(
    DrawSVGPlugin,
    ScrollTrigger,
    SplitText,
    useGSAP,
    CustomEase,
    MotionPathPlugin
  );
}

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

extend({ Water, Sky });

import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";

extend({ MeshLambertMaterial: THREE.MeshLambertMaterial });


function DoorModel() {
  const { scene, animations } = useGLTF("/models/openingclosingdoor3d.glb");
  const mixer = useRef();
  const actionRef = useRef();
  const scroll = useThreeScroll();

  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    const matcap = textureLoader.load("/images/matcap-green-yellow-pink.png");
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshMatcapMaterial({ matcap });
        child.material.needsUpdate = true;
      }
    });
  }, [scene]);

  useEffect(() => {
    if (!animations.length) return;

    mixer.current = new THREE.AnimationMixer(scene);

    const relevantClips = animations.filter(
      (a) => a.name === "Action" || a.name === "Curve.006Action"
    );

    relevantClips.forEach((clip) => {
      const action = mixer.current.clipAction(clip);
      action.reset();
      action.paused = true;
      action.play();
      action.time = 0;
    });

    actionRef.current = relevantClips.map((clip) =>
      mixer.current.clipAction(clip)
    );
    mixer.current.update(0);
  }, [animations, scene]);

  useFrame((_, delta) => {
    if (!mixer.current || !actionRef.current) return;
  
    const offset = scroll.offset;
  
    actionRef.current.forEach((action) => {
      const clip = action.getClip();
      const clipStart = 0;
      const clipEnd = clip.duration * 0.68;
  
      // Door starts opening at t = 0.15, finishes at t = 0.4
      const openStart = 0.15;
      const openEnd = 0.4;
  
      const openProgress = THREE.MathUtils.clamp(
        (offset - openStart) / (openEnd - openStart),
        0,
        1
      );
  
      const clampedTime = THREE.MathUtils.lerp(clipStart, clipEnd, openProgress);
  
      action.time = THREE.MathUtils.damp(action.time, clampedTime, 100, delta);
    });
  
    mixer.current.update(delta);
  });

  return (
    <group position={[0, -0.5, -5]} rotation={[0, Math.PI, 0]} scale={6.25}>
      <primitive object={scene} />
    </group>
  );
}


function Tunnel() {
  const { camera } = useThree();
  const scroll = useThreeScroll();

  const path = useMemo(() => {
    const rawPoints = [
      [68.5, 185.5],
      [1, 262.5],
      [270.9, 281.9],
      [345.5, 212.8],
      [178, 155.7],
      [240.3, 72.3],
      [153.4, 0.6],
      [52.6, 53.3],
      [68.5, 185.5]
    ];


    const points = rawPoints.map(([x, y]) =>
      new Vector3((x - 150) * 0.05, 8, (y - 150) * 0.05 - 5) // tunnel camera height is 8 to match door
    );

    return new THREE.CatmullRomCurve3(points, true);
  }, []);

  useFrame(() => {
    const t = scroll.offset;

    if (t < 0.4) return; // only control camera after door opens

    const tunnelProgress = THREE.MathUtils.clamp((t - 0.4) / 1.2, 0, 1); 
    const tunnelT = (tunnelProgress * 2) % 1; // 2 loops
    const p1 = path.getPointAt(tunnelT);
    const p2 = path.getPointAt((tunnelT + 0.01) % 1);

    camera.position.copy(p1);
    camera.lookAt(p2);
  });

  return (
    <group visible={scroll.offset > 0.39}>
      <mesh>
        <tubeGeometry args={[path, 300, 1.2, 20, true]} />
        <meshStandardMaterial color="hotpink" wireframe />
      </mesh>
    </group>
  );
}


function PortalScene() {
  return null;
}




//  function OceanScene() {
//   const { scene, camera, gl, size } = useThree();

//   // --- BLOOM COMPOSER ---
//   const composer = useMemo(() => {
//     const comp = new EffectComposer(gl);
//     comp.addPass(new RenderPass(scene, camera));
//     const bloom = new UnrealBloomPass(
//       new THREE.Vector2(size.width, size.height),
//       2.4, // strength
//       0.8, // radius
//       0.0  // threshold
//     );
//     comp.addPass(bloom);
//     return comp;
//   }, [scene, camera, gl, size]);

//   // --- CREATE INFINITY CUBE ---
//   const groupRef = useRef();

//   useEffect(() => {
//     scene.clear();

//     const baseGeo = new THREE.BoxGeometry(1, 1, 1);
//     const edgeGeo = new THREE.EdgesGeometry(baseGeo); // no diagonals
//     const baseMat = new THREE.LineBasicMaterial({
//       color: 0x00ccff,
//       toneMapped: false,
//     });

//     const group = new THREE.Group();
//     const layers = 8;
//     const spacing = 0.18;
//     const scaleStart = 1.0;

//     for (let i = 0; i < layers; i++) {
//       const line = new THREE.LineSegments(edgeGeo, baseMat.clone());
//       const scale = scaleStart + i * spacing;
//       line.scale.set(scale, scale, scale);
//       line.material.color = new THREE.Color(`hsl(${180 + i * 20}, 100%, 60%)`);
//       group.add(line);
//     }

//     group.position.set(0, 0, 0);
//     scene.add(group);
//     groupRef.current = group;

//     const light = new THREE.PointLight(0xffffff, 0.5);
//     light.position.set(3, 3, 5);
//     scene.add(light);

//     scene.background = new THREE.Color(0x000000);
//   }, [scene]);

//   useFrame((state) => {
//     const t = state.clock.getElapsedTime();
//     if (groupRef.current) {
//       groupRef.current.rotation.x = t * 0.4;
//       groupRef.current.rotation.y = t * 0.6;
//     }
//     composer.render();
//   }, 1);

//   return null;
// }


const OceanScene = () => {
  useFrame((state) => {
    state.gl.setClearColor(0x000000, 0);
  });

  const scroll = useThreeScroll();
  const { scene, gl, camera } = useThree();
  const waterRef = useRef();
  const meshRef = useRef();
  const [enteredPortal, setEnteredPortal] = useState(false);

  const tunnelStart = new THREE.Vector3(
    (68.5 - 150) * 0.05,
    0,
    (185.5 - 150) * 0.05 - 5
  );
  const tunnelNext = new THREE.Vector3(
    (1 - 150) * 0.05,
    0,
    (262.5 - 150) * 0.05 - 5
  );

  useEffect(() => {
    gl.outputEncoding = THREE.sRGBEncoding;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.85;

    const waterNormals = new THREE.TextureLoader().load(
      'https://threejs.org/examples/textures/waternormals.jpg'
    );
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

    const water = new Water(new THREE.PlaneGeometry(10000, 10000), {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined,
    });

    water.rotation.x = -Math.PI / 2;
    scene.add(water);
    waterRef.current = water;

    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    const U = sky.material.uniforms;
    U['turbidity'].value = 10;
    U['rayleigh'].value = 2;
    U['mieCoefficient'].value = 0.005;
    U['mieDirectionalG'].value = 0.8;

    const pmrem = new THREE.PMREMGenerator(gl);
    const sun = new THREE.Vector3();

    const updateSun = () => {
      const theta = Math.PI * (0.48 - 0.5);
      const phi = 2 * Math.PI * (0.205 - 0.5);

      sun.x = Math.cos(phi);
      sun.y = Math.sin(phi) * Math.sin(theta);
      sun.z = Math.sin(phi) * Math.cos(theta);

      U['sunPosition'].value.copy(sun);
      water.material.uniforms['sunDirection'].value.copy(sun).normalize();

      scene.environment = pmrem.fromScene(sky).texture;
    };
    updateSun();

    const ambient = new THREE.AmbientLight(0xffffff, 0.15);
    const point = new THREE.PointLight(0xffffff, 0.25);
    point.position.set(5, 5, 10);
    scene.add(ambient, point);

    return () => {
      scene.remove(water, sky, ambient, point);
      water.geometry.dispose();
      water.material.dispose();
    };
  }, [scene, gl]);

  useFrame(() => {
    const t = scroll.offset;
    const camY = 8;

    if (t < 0.4) {
      const ease = Math.pow(t / 0.4, 0.85);
      const targetZ = THREE.MathUtils.lerp(35, 5, ease);
      const targetY = THREE.MathUtils.lerp(5, camY, ease);
      const lookY = THREE.MathUtils.lerp(5, camY, ease);

      camera.position.set(0, targetY, targetZ);
      camera.lookAt(0, lookY, 0);
    }

    if (t >= 0.3 && !enteredPortal) setEnteredPortal(true);

    if (t >= 0.4 && t < 0.45) {
      const ease = (t - 0.4) / 0.05;
      const from = new THREE.Vector3(0, camY, 1);
      camera.position.lerpVectors(from, tunnelStart, ease);
      camera.lookAt(tunnelStart.clone().lerp(tunnelNext, ease));
    }

    if (waterRef.current) {
      waterRef.current.material.uniforms.time.value += 1 / 60;
    }
  });

  return (
    <>
      <PortalScene active={enteredPortal} intensity={enteredPortal ? 1 : 0} />

 <DoorModel />
    </>
  );
};
const ScrollTracker = ({ onScrollChange }) => {
  const scroll = useThreeScroll();

  useFrame(() => {
    onScrollChange(scroll.offset);
  });

  return null;
};



const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;  // pass UV coordinates to fragment shader
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
precision mediump float;

uniform float iTime;
uniform vec2 iResolution;
varying vec2 vUv;


float gold_noise(in vec2 xy, in float seed) {
  return fract(sin(dot(xy + seed, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {

vec2 jitter = vec2(
  sin(dot(vUv, vec2(12.9898, 78.233)) + iTime * 0.005),
  cos(dot(vUv, vec2(93.9898, 67.345)) + iTime * 0.005)
) * 0.2;

  vec2 xy = (vUv * iResolution) + jitter;

  float seed = fract(iTime);

  vec4 color = vec4(
    gold_noise(xy, seed + 0.1),
    gold_noise(xy, seed + 0.2),
    gold_noise(xy, seed + 0.3),
    gold_noise(xy, seed + 0.4)
  );

  gl_FragColor = color;
}
`;


const LiquidPortalMaterial = shaderMaterial(
  {
    iTime: 0,
    iResolution: new THREE.Vector2(),
  },
  vertexShader,
  fragmentShader
);

extend({ LiquidPortalMaterial });


function LiquidPortalPlane({ position, scale }) {
  const materialRef = useRef();

  useFrame(({ clock, size }) => {
    if (materialRef.current) {
      materialRef.current.iTime = clock.getElapsedTime();
      materialRef.current.iResolution.set(size.width, size.height);
    }
  });

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 2]} />
      <liquidPortalMaterial ref={materialRef} />
    </mesh>
  );
}


export default function LandingComponent() {
  const [scrollOffset, setScrollOffset] = useState(0);

  const fadeStart = 0;
  const fadeEnd = 0.3;

  const fadeProgress = Math.min(
    Math.max((scrollOffset - fadeStart) / (fadeEnd - fadeStart), 0),
    1
  );
  const opacity = 1 - fadeProgress;

  const progress = Math.min(
    Math.max((scrollOffset - fadeStart) / (fadeEnd - fadeStart), 0),
    1
  );

  const topTextTranslateY = -progress * window.innerHeight * 1.25;

  const bottomStartY = window.innerHeight * 1;
  const bottomTextTranslateY =
    bottomStartY - progress * (bottomStartY + window.innerHeight);
  const bottomTextOpacity = progress;

  return (
    <>
      <div style={{ height: '100vh', width: '100vw' }}>
      <Canvas camera={{ position: [0, 5, 30], fov: 50 }}>
  <ambientLight intensity={0.5} />
<pointLight position={[0, 0, 7]} intensity={0.1} color="#ff6b35" />
  <ScrollControls pages={5} damping={0.1}>
    <ScrollTracker onScrollChange={setScrollOffset} />

    <OceanScene />
    <Tunnel />
  </ScrollControls>
</Canvas>
<div
          style={{
            position: "fixed",
            top: "40%",
            right: "10%",
            transform: `translateY(${topTextTranslateY}px)`,
            opacity,
            zIndex: 10,
            color: "white",
            maxWidth: "400px",
            textAlign: "left",
            // textTransform: "uppercase",
            pointerEvents: "none",
            transition:
              "opacity 0.2s linear, transform 0.2s linear, filter 0.2s linear",
          }}
        >
          <p
            style={{
              fontSize: "15px",
              lineHeight: "1.4",
              marginBottom: "20px",
              fontFamily: "NeueHaasGroteskDisplayPro45Light",
            }}
          >
            Every smile is a story. At our office, we guide
            you through every step of your orthodontic journey — with advanced
            treatment, personalized care, and results that go beyond the
            ordinary.
          </p>
<div className="flex items-center gap-3">
  <div className="text-[17px] font-neuehaas45">
    Scroll To Discover
  </div>
  <div
    style={{
      width: "1.5em",
      height: "1.5em",
      borderRadius: "50%",
      overflow: "hidden",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <video
      id="holovideo"
      loop
      muted
      autoPlay
      playsInline
      preload="metadata"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.25)",
        boxShadow: "0 0 50px #ebe6ff80",
      }}
    >
      <source
        src="https://cdn.refokus.com/ttr/speaking-ball.mp4"
        type="video/mp4"
      />
      Your browser does not support the video tag.
    </video>
  </div>
</div>
        </div>

        <div
          style={{
            position: "fixed",
            top: "95%",
            right: "10%",
            transform: `translateY(${bottomTextTranslateY}px)`,
            opacity: bottomTextOpacity,
            transition: "all 0.2s linear",
            zIndex: 10,
            color: "white",
            maxWidth: "400px",
            textAlign: "left",
            textTransform: "uppercase",
            pointerEvents: "none",
            transition:
              "opacity 0.2s linear, transform 0.2s linear, filter 0.2s linear",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              lineHeight: "1.4",
              marginBottom: "20px",
              fontFamily: "KHTekaTrial-Light",
            }}
          >
     
     Modern care. Designed to move with you
          </p>
        </div>
    </div>
      {/* <div style={{ height: "200vh", margin: 0 }}>
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 0,
          }}
        >
          <Canvas>
            <ScrollControls pages={3} damping={0.1}>
              <ScrollTracker onScrollChange={setScrollOffset} />
              <OceanScene />
            </ScrollControls>
          </Canvas>
        </div>

        <div
          style={{
            position: "fixed",
            top: "50%",
            right: "10%",
            transform: `translateY(${topTextTranslateY}px)`,
            opacity,
            zIndex: 10,
            color: "white",
            maxWidth: "400px",
            textAlign: "left",
            textTransform: "uppercase",
            pointerEvents: "none",
            transition:
              "opacity 0.2s linear, transform 0.2s linear, filter 0.2s linear",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              lineHeight: "1.4",
              marginBottom: "20px",
              fontFamily: "KHTekaTrial-Light",
            }}
          >
            Behind every smile lies a story in progress. At our office, we guide
            you through every step of your orthodontic journey — with advanced
            treatment, personalized care, and results that go beyond the
            ordinary.
          </p>
          <div className="font-khteka">Scroll To Discover</div>
        </div>

        <div
          style={{
            position: "fixed",
            top: "95%",
            right: "10%",
            transform: `translateY(${bottomTextTranslateY}px)`,
            opacity: bottomTextOpacity,
            transition: "all 0.2s linear",
            zIndex: 10,
            color: "white",
            maxWidth: "400px",
            textAlign: "left",
            textTransform: "uppercase",
            pointerEvents: "none",
            transition:
              "opacity 0.2s linear, transform 0.2s linear, filter 0.2s linear",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              lineHeight: "1.4",
              marginBottom: "20px",
              fontFamily: "KHTekaTrial-Light",
            }}
          >
     
     Modern care. Designed to move with you
          </p>
        </div>
      </div> */}
      {/* <div style={{ overflowX: "hidden" }}>
        <div class="MainContainer">
          <div class="ParallaxContainer">
            <Hero />
          </div>
          <div class="StatsContainer">
            <Stats />
          </div>
        </div>
    
        <NewSection />
        <Testimonials />
        <LogoGrid />
        <Locations />
        <GiftCards />
      </div> */}
    </>
  );
}

const Hero = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const imgSize = [1250, 833];

    const vertex = `
      attribute vec2 uv;
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0, 1);
      }
    `;

    const fragment = `
      precision highp float;
      uniform sampler2D tWater;
      uniform sampler2D tFlow;
      uniform float uTime;
      varying vec2 vUv;
      uniform vec4 res;
      void main() {
        vec3 flow = texture2D(tFlow, vUv).rgb;
        vec2 uv = .5 * gl_FragCoord.xy / res.xy ;
        vec2 myUV = (uv - vec2(0.5)) * res.zw + vec2(0.5);
        myUV -= flow.xy * (0.15 * 0.7);
        vec3 tex = texture2D(tWater, myUV).rgb;
        gl_FragColor = vec4(tex, 1.0);
      }
    `;

    // const renderer = new OGL.Renderer({ dpr: 2 });
    // const gl = renderer.gl;
    // containerRef.current.appendChild(gl.canvas);

    const renderer = new OGL.Renderer({ dpr: 2 });
    const gl = renderer.gl;
    containerRef.current.appendChild(gl.canvas);

    gl.canvas.style.borderRadius = "20px";
    gl.canvas.style.clipPath = "inset(0% round 20px)";
    // gl.canvas.style.clipPath = "none";
    renderer.setSize(window.innerWidth, window.innerHeight);

    let aspect = 1;
    const mouse = new OGL.Vec2(-1);
    const velocity = new OGL.Vec2();

    function resize() {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      renderer.setSize(containerWidth, containerHeight);

      let a1, a2;
      var imageAspect = imgSize[1] / imgSize[0];
      var containerAspect = containerHeight / containerWidth;

      if (containerAspect < imageAspect) {
        a1 = 1;
        a2 = containerAspect / imageAspect;
      } else {
        a1 = imageAspect / containerAspect;
        a2 = 1;
      }

      program.uniforms.res.value = new OGL.Vec4(
        containerWidth,
        containerHeight,
        a1,
        a2
      );

      aspect = containerWidth / containerHeight;
    }

    const flowmap = new OGL.Flowmap(gl);
    const geometry = new OGL.Geometry(gl, {
      position: {
        size: 2,
        data: new Float32Array([-1, -1, 3, -1, -1, 3]), // Covers full screen
      },
      uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
    });

    const texture = new OGL.Texture(gl, {
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
    });

    const img = new Image();
    img.onload = () => (texture.image = img);
    img.crossOrigin = "Anonymous";
    // img.src = "../images/bubble.jpg";
    img.src = "../images/test.png";

    let a1, a2;
    var imageAspect = imgSize[1] / imgSize[0];
    if (window.innerHeight / window.innerWidth < imageAspect) {
      a1 = 1;
      a2 = window.innerHeight / window.innerWidth / imageAspect;
    } else {
      a1 = (window.innerWidth / window.innerHeight) * imageAspect;
      a2 = 1;
    }

    const program = new OGL.Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        tWater: { value: texture },
        res: {
          value: new OGL.Vec4(window.innerWidth, window.innerHeight, a1, a2),
        },
        tFlow: flowmap.uniform,
      },
    });

    const mesh = new OGL.Mesh(gl, { geometry, program });

    window.addEventListener("resize", resize, false);
    resize();

    const isTouchCapable = "ontouchstart" in window;
    if (isTouchCapable) {
      window.addEventListener("touchstart", updateMouse, true);
      window.addEventListener("touchmove", updateMouse, { passive: true });
    } else {
      window.addEventListener("mousemove", updateMouse, true);
    }

    let lastTime;
    const lastMouse = new OGL.Vec2();

    function updateMouse(e) {
      e.preventDefault();

      const rect = gl.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouse.set(x / rect.width, 1 - y / rect.height);

      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      const baseFactor = 300;
      const scaleFactor = minDimension / baseFactor;

      if (!lastTime) {
        lastTime = performance.now();
        lastMouse.set(x, y);
      }

      const deltaX = (x - lastMouse.x) * scaleFactor * 0.3;
      const deltaY = (y - lastMouse.y) * scaleFactor * 0.3;
      lastMouse.set(x, y);

      const time = performance.now();
      const delta = Math.max(5, time - lastTime);
      lastTime = time;

      velocity.x = deltaX / delta;
      velocity.y = deltaY / delta;
      velocity.needsUpdate = true;
    }

    // function updateMouse(e) {
    //   e.preventDefault();

    //   const rect = gl.canvas.getBoundingClientRect();
    //   const x = e.clientX - rect.left;
    //   const y = e.clientY - rect.top;

    //   mouse.set(x / rect.width, 1 - y / rect.height);

    //   const sensitivity = (Math.min(rect.width, rect.height) / 300) * 3;

    //   if (!lastTime) {
    //     lastTime = performance.now();
    //     lastMouse.set(x, y);
    //   }

    //   const deltaX = (x - lastMouse.x) * sensitivity;
    //   const deltaY = (y - lastMouse.y) * sensitivity;
    //   lastMouse.set(x, y);

    //   const time = performance.now();
    //   const delta = Math.max(5, time - lastTime);
    //   lastTime = time;

    //   velocity.x = deltaX / delta;
    //   velocity.y = deltaY / delta;
    //   velocity.needsUpdate = true;
    // }
    function update(t) {
      requestAnimationFrame(update);

      if (!velocity.needsUpdate) {
        mouse.set(-1);
        velocity.set(0);
      }
      velocity.needsUpdate = false;

      flowmap.aspect = aspect;
      flowmap.mouse.copy(mouse);
      flowmap.velocity.lerp(velocity, velocity.len ? 0.25 : 0.15);
      flowmap.update();

      program.uniforms.uTime.value = t * 0.01;
      renderer.render({ scene: mesh });
    }
    requestAnimationFrame(update);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", updateMouse);
      window.removeEventListener("touchstart", updateMouse);
      window.removeEventListener("touchmove", updateMouse);
      if (containerRef.current && gl?.canvas) {
        containerRef.current.removeChild(gl.canvas);
      }
    };
  }, []);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (latest) => -latest * 0.5);

  const sectionCircleRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionCircleRef,
    offset: ["start end", "end start"],
  });

  const strokeRef = useRef(null);
  const mainRef = useRef(null);

  useEffect(() => {
    if (strokeRef.current && mainRef.current) {
      const path = strokeRef.current;
      const pathLength = path.getTotalLength();

      gsap.set(path, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength,
      });

      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: mainRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    }
  }, []);

  return (
    <div className="relative">
      <motion.section
        style={{ y }}
        className="fixed top-0 left-0 z-0 flex items-center justify-center w-full h-screen bg-white"
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "4vw",
          }}
        >
          <div
            ref={containerRef}
            className="pointer-events-none"
            style={{
              width: "80%",
              height: "80%",
              overflow: "hidden",
              position: "relative",
            }}
          />
        </div>

        <svg
          viewBox="0 0 96 1332"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute top-0 h-full transform -translate-x-1/2 left-1/2"
        >
          <path
            d="M1.00003 1332L1.00006 726.469C1.00007 691.615 18.8257 659.182 48.25 640.5V640.5C77.6744 621.818 95.5 589.385 95.5 554.531L95.5 0"
            stroke="white"
            strokeOpacity="0.2"
            strokeWidth="1"
          ></path>

          <svg
            viewBox="0 0 96 1332"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute top-0 h-full transform -translate-x-1/2 left-1/2"
          >
            <defs>
              <filter
                id="glow-effect"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                <feFlood
                  floodColor="white"
                  floodOpacity="0.8"
                  result="glowColor"
                />
                <feComposite
                  in="glowColor"
                  in2="coloredBlur"
                  operator="in"
                  result="softGlow"
                />
                <feMerge>
                  <feMergeNode in="softGlow" />
                  <feMergeNode in="softGlow" />
                </feMerge>
              </filter>
            </defs>

            <motion.path
              d="M1.00003 1332L1.00006 726.469C1.00007 691.615 18.8257 659.182 48.25 640.5V640.5C77.6744 621.818 95.5 589.385 95.5 554.531L95.5 0"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeOpacity="0.4"
              filter="url(#glow-effect)"
              strokeDasharray="620, 1332"
              strokeDashoffset="1952"
              animate={{
                strokeDashoffset: [1952, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 4.5,
                ease: "linear",
              }}
            />
          </svg>
        </svg>

        <div className="absolute max-w-lg text-sm text-gray-300 font-neue-montreal top-60 right-56">
          <h1 className="text-6xl leading-none md:text-6xl font-neue-montreal">
            Because every <br /> smile is unique
          </h1>

          <div className="flex items-center gap-2 mt-6">
            <button className="font-helvetica-neue px-6 py-3 bg-[url('/images/buttongradipng')] bg-cover bg-center hover:bg-blue-600 text-[12px] rounded-full transition">
              START YOUR JOURNEY
            </button>

            <div className="flex items-center justify-center w-6 h-6 overflow-hidden rounded-full">
              <video
                id="holovideo"
                loop
                muted
                autoPlay
                playsInline
                preload="metadata"
                className="w-full h-full object-cover scale-125 shadow-[0_0_50px_#ebe6ff80]"
              >
                <source
                  src="https://cdn.refokus.com/ttr/speaking-ball.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>

        <div className="absolute max-w-xs text-sm text-gray-300 font-neue-montreal bottom-10 right-10">
          Frey Smiles is working at the intersection of technology and nature to
          transform your smile.
        </div>
      </motion.section>
      <section
        ref={sectionCircleRef}
        className="relative h-[160vh] w-full bg-[#F2F2F2] z-10 mt-[100vh]"
      >
        <section className="relative flex flex-col items-center justify-center h-full px-8 text-center">
          <main ref={mainRef}>
            <svg
              style={{ transform: "translateX(120px)" }}
              className="stroke_wide "
              preserveAspectRatio="xMidYMid slice"
              fill-rule="evenodd"
              stroke-miterlimit="1.5"
              clip-rule="evenodd"
              viewBox="0 1000 8500 14948.91"
            >
              <defs>
                <linearGradient
                  id="strokeGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#3339F1" />
                  <stop offset="50%" stopColor="#000AFF" />
                </linearGradient>
              </defs>
              <path
                ref={strokeRef}
                class="stroke_wide"
                d="M4462.32,625c0,0 14.613,622.459 -463.862,807.768c-481.301,186.404 -1447.09,-126.375 -1575.51,541.543c-124.818,649.224 959.032,311.455 1893.1,826.688c1089.01,600.699 -524.942,1127.57 -1302.17,1453.96c-951.997,399.786 -995.709,1421.16 -230.78,1308.47c1157.75,-170.555 2955.04,-369.639 2625.82,434.977c-258.167,630.956 -1834.68,308.013 -1915.59,964.376c-123.736,1003.78 785.635,859.091 1309.31,778.296c976.475,-150.654 1261.08,579.399 1203.78,1013.11c-62.259,471.302 -669.89,1009.61 -1534.75,1125.17c-1019.84,136.266 -2356.12,174.662 -2200.88,942.9c130.32,644.912 1957.69,378.097 2999.78,691.136c860.372,258.452 772.286,1223.59 346.923,1696.49c-769.812,855.852 -852.502,1355.35 -852.502,1355.35"
              />
            </svg>
          </main>
          <div className="max-w-3xl text-[#1D64EF]">
            {/* <p className="uppercase text-[12px] font-semibold font-helvetica-neue-light tracking-widest">
              Vision
            </p>
            <h2 className="font-neue-montreal text-[40px] md:text-[40px] font-medium leading-none mt-4">
              At Frey Smiles, we blend artistry and precision to craft smiles as
              unique as the individuals who wear them. Guided by expertise and
              innovation—we shape confidence one smile at a time.
            </h2> */}
          </div>
        </section>
      </section>
    </div>
  );
};

const Stats = () => {
  const colors = [
    ["#8ACBBA", "#E64627", "#AE74DC", "#2A286F"],
    ["#2A286F", "#F9931F", "#FD5CD0", "#F9E132"],
    ["#241F21", "#8ACBBA", "#E51932", "#006980"],
    ["#FD5CD0", "#F9931F", "#2A286F", "#E51932"],
    // ["#9BFFE3", "#C6FEF1", "#DAFFEF", "#F1FFEB"],
    // ["#8BE5C9", "#B4E5D8", "#C5E5D6", "#D9E4D7"],
    // ["#7FCCB7", "#A1CCBF", "#B1CCBE", "#C2CDC0"],
    // ["#6DB29D", "#86AFA4", "#99B4A8", "#A7B2A7"],
  ];

  // const projects = [
  //   {
  //     title: "Clear Aligners",
  //     subtitle: "Invisalign",
  //     image: "../images/handgrid.png",
  //   },
  //   {
  //     title: "Braces",
  //     subtitle: "Damon Ultima",
  //     image: "../images/mainsectionimage.jpg",
  //   },
  //   {
  //     title: "Advanced Technology",
  //     subtitle: "3D i-Cat Imaging, Digital Scans",
  //     image: "../images/handbackground.png",
  //   },
  // ];

  const [hoveredCard, setHoveredCard] = useState(null);

  const handleMouseEnter = (cardIndex) => {
    setHoveredCard(cardIndex);
  };

  const handleMouseLeave = () => {
    setHoveredCard(null);
  };
  const statRefs = useRef([]);

  useEffect(() => {
    statRefs.current.forEach((ref) => {
      if (!ref) return;

      const targetValue = parseInt(ref.dataset.target, 10);
      const digits = targetValue.toString().split("");

      ref.innerHTML = "";
      const containers = [];

      digits.forEach((digit) => {
        const wrapper = document.createElement("div");
        wrapper.style.overflow = "hidden";
        wrapper.style.height = "1em";
        wrapper.style.display = "inline-block";

        const digitContainer = document.createElement("div");
        digitContainer.style.position = "relative";
        digitContainer.style.transform = "translateY(0)";
        digitContainer.style.transition = "transform 0.5s ease-out";

        for (let i = 0; i <= 9; i++) {
          const digitElement = document.createElement("div");
          digitElement.innerText = i;
          digitElement.style.height = "1em";
          digitElement.style.lineHeight = "1em";
          digitElement.style.textAlign = "center";
          digitContainer.appendChild(digitElement);
        }
        wrapper.appendChild(digitContainer);
        ref.appendChild(wrapper);
        containers.push({ container: digitContainer, value: digit });
      });

      containers.forEach(({ container, value }, index) => {
        gsap.to(container, {
          y: -value * 1 + "em",
          duration: 4,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ref,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      });
    });
  }, []);

  const rows = 3;
  const cols = 6;
  const dx = 100;
  const dy = 100;
  const circleRefs = useRef([]);

  useEffect(() => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0 });

    // forward Animation, each circle will animate from (0,0) to its grid position.
    // each diagonal grouping is (row+col)*0.3 to animate together
    circleRefs.current.forEach((circle) => {
      const col = parseInt(circle.getAttribute("data-col"), 10);
      const row = parseInt(circle.getAttribute("data-row"), 10);
      const forwardDelay = (row + col) * 0.3;

      tl.to(
        circle,
        {
          duration: 1.5,
          x: col * dx,
          y: row * dy,
          ease: "power2.inOut",
        },
        forwardDelay
      );
    });

    // longest delay starts with circle from the highest row+col val.
    const maxSum = rows + cols - 2; // maximum diagonal value (0-index)
    const forwardTotalTime = maxSum * 0.3 + 1.5;

    // reverse Animation: for each circle, reverse delay =  (maxSum - (row+col)) * 0.3. (highest=7)
    circleRefs.current.forEach((circle) => {
      const col = parseInt(circle.getAttribute("data-col"), 10);
      const row = parseInt(circle.getAttribute("data-row"), 10);
      const diagonal = row + col;
      const reverseDelay = (maxSum - diagonal) * 0.3;

      tl.to(
        circle,
        {
          duration: 1.5,
          x: 0,
          y: 0,
          ease: "power2.inOut",
        },
        forwardTotalTime + reverseDelay
      );
    });
  }, [cols, rows, dx, dy]);

  const circles = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      circles.push({ id: `${row}-${col}`, row, col });
    }
  }

  const palette = [
    "#DFC0FC",
    "#E0FF65",
    // "#034CFF",
    // "#AE33FB",
  ];
  const getRandomColor = () =>
    palette[Math.floor(Math.random() * palette.length)];

  const paragraphRef = useRef(null);
  const [lineWidth, setLineWidth] = useState(0);
  const [lineFinished, setLineFinished] = useState(false);

  useEffect(() => {
    if (paragraphRef.current) {
      setLineWidth(paragraphRef.current.offsetWidth);
    }
  }, []);

  return (
    <section className="bg-[#F2F2F2] w-full min-h-screen flex items-center justify-center">
      <section className="grid grid-cols-12 px-12">
        <div className="flex col-span-4">
          <div className="flex flex-col items-start justify-start w-full lg:w-1/3 lg:pl-8 ">
            <svg
              className="pointer-events-none"
              width="1000"
              height="500"
              viewBox="-50 -50 1000 500"
            >
              <g id="multiply-circles">
                {circles.map((circle, index) => (
                  <circle
                    key={circle.id}
                    ref={(el) => (circleRefs.current[index] = el)}
                    cx={0}
                    cy={0}
                    r={50}
                    fill={getRandomColor()}
                    data-row={circle.row}
                    data-col={circle.col}
                  />
                ))}
              </g>
            </svg>

            {/* <div className="">
              {colors.map((row, rowIndex) => (
                <div key={rowIndex} className="flex ">
                  {row.map((color, circleIndex) => (
                    <div
                      key={circleIndex}
                      className={`w-[100px] h-[100px] ${
                        (rowIndex + circleIndex) % 3 === 0
                          ? "rounded-[40px]"
                          : "rounded-full"
                      } transition-transform duration-300 ease-in-out hover:scale-75`}
                      style={{ backgroundColor: color }}
                    ></div>
                  ))}
                </div>
              ))}
            </div> */}
          </div>
        </div>

        <div className="flex flex-col col-span-8">
          {/* Stats Section */}
          <div className="flex flex-wrap justify-end mt-8 space-x-4 sm:flex-nowrap sm:space-x-6 md:space-x-12">
            <div className="text-center">
              <p className="font-neue-montreal text-[12px] sm:text-[15px] mb-4 sm:mb-10 ">
                Years of Experience
              </p>
              <h2 className="font-neue-montreal text-[5rem] sm:text-[6rem] md:text-[7rem] font-light flex items-center gap-1 sm:gap-2">
                <span
                  data-target="60"
                  ref={(el) => (statRefs.current[0] = el)}
                  className="pointer-events-none"
                >
                  0
                </span>
                <span className="text-[2rem] sm:text-[3rem] align-center">
                  +
                </span>
              </h2>
            </div>
            <div className="text-center">
              <p className="font-neue-montreal text-[12px] sm:text-[15px] mb-4 sm:mb-10 ">
                Satisfied Patients
              </p>
              <h2 className="font-neue-montreal text-[5rem] sm:text-[6rem] md:text-[7rem] font-light flex items-center gap-1 sm:gap-2">
                <span
                  data-target="25"
                  ref={(el) => (statRefs.current[1] = el)}
                  className="flex pointer-events-none"
                >
                  0
                </span>
                <span className="text-[2rem] sm:text-[3rem]">k</span>
              </h2>
            </div>
            <div className="text-center">
              <p className="font-neue-montreal text-[12px] sm:text-[15px] mb-4 sm:mb-10">
                Locations
              </p>
              <h2 className="font-neue-montreal text-[5rem] sm:text-[6rem] md:text-[7rem] font-light">
                <span
                  data-target="4"
                  ref={(el) => (statRefs.current[2] = el)}
                  className="pointer-events-none"
                >
                  0
                </span>
              </h2>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};
const NewSection = () => {
  const splitTextInstances = useRef([]);

  const linkRef = useRef(null);

  useEffect(() => {
    const link = linkRef.current;

    const span1 = link.querySelector("[data-tha-span-1]");
    const span2 = link.querySelector("[data-tha-span-2]");

    const handleMouseEnter = () => {
      gsap.to([span1, span2], {
        yPercent: -100,
        duration: 0.8,
        ease: "power4.inOut",
      });
    };

    const handleMouseLeave = () => {
      gsap.to([span1, span2], {
        yPercent: 0,
        duration: 0.8,
        ease: "power4.inOut",
      });
    };

    link.addEventListener("mouseenter", handleMouseEnter);
    link.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      link.removeEventListener("mouseenter", handleMouseEnter);
      link.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const [hover, setHover] = useState(false);

  return (
    <>
      <section className="flex items-center justify-center min-h-screen px-8  md:px-16">
        <div className="grid w-full grid-cols-1 gap-8 max-w-7xl md:grid-cols-2">
          <div className=" text-black flex flex-col justify-center">
            <div className="relative flex items-center justify-center mx-auto max-w-[80vw]">
              <div className="absolute inset-0 bg-[#1d2120] h-full w-full" />
              <div className="relative w-[110%] bg-[#FFF] px-48 py-2 rounded-[100px] border-t border-b border-[#1d2120] overflow-hidden">
                <div className="py-2 font-neue-montreal text-center text-[18px] text-black">
                  <a
                    ref={linkRef}
                    href="/book-now"
                    data-tha
                    style={{
                      display: "inline-block",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <span
                      data-tha-span-1
                      style={{
                        fontSize: "1.25rem",
                        fontFamily: "HelveticaNeue-Light",
                        display: "inline-block",
                        position: "relative",
                      }}
                    >
                      BOOK NOW
                    </span>
                    <span
                      data-tha-span-2
                      style={{
                        fontSize: "1.25rem",
                        fontFamily: "HelveticaNeue-Light",
                        display: "inline-block",
                        position: "absolute",
                        top: "100%",
                        left: "0",
                      }}
                    >
                      BOOK NOW
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/*right*/}
          <div className="p-8 md:p-16 rounded-md flex flex-col justify-between">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
            >
              <defs>
                <clipPath id="clip0_224_605">
                  <path d="M50 50.5H50.5V50V49.5C23.2199 49.5 1.04241 27.6526 0.509799 0.5H199.491C198.957 27.6526 176.781 49.5 149.5 49.5V50V50.5H150C177.338 50.5 199.5 72.6619 199.5 100C199.5 125.033 180.918 145.726 156.795 149.038L156.791 150.028C180.949 153.556 199.5 174.363 199.5 199.5H0.5C0.5 174.363 19.0509 153.556 43.2094 150.028L43.2051 149.038C19.0823 145.726 0.5 125.033 0.5 100C0.5 72.6619 22.6619 50.5 50 50.5Z" />
                </clipPath>
              </defs>

              <image
                href="../images/nowbook.png"
                width="200"
                height="200"
                clipPath="url(#clip0_224_605)"
                preserveAspectRatio="xMidYMid slice"
              />

              <path
                d="M50 50.5H50.5V50V49.5C23.2199 49.5 1.04241 27.6526 0.509799 0.5H199.491C198.957 27.6526 176.781 49.5 149.5 49.5V50V50.5H150C177.338 50.5 199.5 72.6619 199.5 100C199.5 125.033 180.918 145.726 156.795 149.038L156.791 150.028C180.949 153.556 199.5 174.363 199.5 199.5H0.5C0.5 174.363 19.0509 153.556 43.2094 150.028L43.2051 149.038C19.0823 145.726 0.5 125.033 0.5 100C0.5 72.6619 22.6619 50.5 50 50.5Z"
                fill="none"
                stroke="none"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
      </section>
    </>
  );
};

const LogoGrid = () => {
  const logos = [
    [
      "../images/movingbannerfiles/diamondplus.svg",
      "../images/movingbannerfiles/readers.png",
      "../images/movingbannerfiles/damonsystem.svg",
      "../images/movingbannerfiles/damonsystem.svg",
    ],
    [
      "../images/movingbannerfiles/topDentist_logo.png",
      "../images/movingbannerfiles/invisalign_invert.png",
      "../images/movingbannerfiles/ajodo.svg",
      "../images/movingbannerfiles/ABO_invert.png",
      "../images/movingbannerfiles/ABO_invert.png",
    ],
    [
      "../images/movingbannerfiles/valley.png",
      "../images/movingbannerfiles/top-Dentist.png",
      "../images/movingbannerfiles/aao_invert.png",
      "../images/movingbannerfiles/aao_invert.png",
    ],
  ];

  let isSphereCreated = false;

  useEffect(() => {
    console.log("sphere");
    if (isSphereCreated) {
      return;
    }
    isSphereCreated = true;
    console.log("createsphere");
    const createSphere = async () => {
      let majorPlatformVersion;
      const canvasSphereWrapp = document.querySelector("#ballcanvas");

      if (navigator.userAgentData) {
        try {
          if (navigator.userAgentData.platform === "Windows") {
            let ua = await navigator.userAgentData.getHighEntropyValues([
              "platformVersion",
            ]);
            majorPlatformVersion = parseInt(ua.platformVersion.split(".")[0]);
          }
        } catch (error) {
          console.error("version", error);

          majorPlatformVersion = undefined;
        }
      }

      let sW = canvasSphereWrapp.offsetWidth;
      let halfsW = sW / 2;
      let circleW = sW / 12;

      let Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Body = Matter.Body,
        Bodies = Matter.Bodies,
        Common = Matter.Common,
        Composite = Matter.Composite,
        World = Matter.World,
        Mouse = Matter.Mouse,
        Events = Matter.Events,
        MouseConstraint = Matter.MouseConstraint;

      let engine = Engine.create();

      let render = Render.create({
        element: canvasSphereWrapp,
        engine: engine,
        options: {
          isSensor: true,
          width: canvasSphereWrapp.offsetWidth,
          pixelRatio: "auto",
          height: canvasSphereWrapp.offsetHeight,
          background: "transparent",
          wireframes: false,
        },
      });

      if (majorPlatformVersion >= 13) {
        engine.timing.timeScale = 0.35;
      }

      engine.gravity.y = 1;
      engine.gravity.x = 0;
      engine.gravity.scale = 0.0025;

      let stack = [];
      const texts = ["INVISALIGN", "DAMON", "DIAMOND 1%"];

      let ballsWithText = [];

      for (let i = 0; i < 12; i++) {
        const ball = Bodies.circle(halfsW, halfsW, circleW, {
          restitution: 0.3, // reduce bounces
          friction: 0.1, //

          density: 0.02,
          collisionFilter: {
            category: 0x0003,
            mask: 0x0003 | 0x0001,
          },
          render: {
            fillStyle: "#1e90ff",
          },
        });

        ballsWithText.push({ ball, text: texts[i] });
        Composite.add(engine.world, ball);
      }
      Events.on(render, "afterRender", function () {
        const ctx = render.context;
        ballsWithText.forEach(({ ball, text }, index) => {
          const position = ball.position;

          const image = new Image();
          image.src = logos[Math.floor(index / 4)][index % 4];
          const aspectRatio = image.width / image.height;

          let imageWidth, imageHeight;
          if (aspectRatio > 1) {
            imageWidth = circleW;
            imageHeight = circleW / aspectRatio;
          } else {
            imageWidth = circleW * aspectRatio;
            imageHeight = circleW;
          }

          const destX = position.x - imageWidth / 2;
          const destY = position.y - imageHeight / 2;

          ctx.drawImage(image, destX, destY, imageWidth, imageHeight);
        });
      });

      let mouse = Mouse.create(render.canvas),
        mouseConstraint = MouseConstraint.create(engine, {
          mouse: mouse,
          constraint: {
            stiffness: 0.2,
            render: {
              visible: false,
            },
          },
        });

      mouseConstraint.mouse.element.removeEventListener(
        "mousewheel",
        mouseConstraint.mouse.mousewheel
      );
      mouseConstraint.mouse.element.removeEventListener(
        "DOMMouseScroll",
        mouseConstraint.mouse.mousewheel
      );

      let shakeScene = function (engine, bodies) {
        let timeScale = 1000 / 60 / engine.timing.lastDelta;

        for (let i = 0; i < bodies.length; i++) {
          let body = bodies[i];

          if (!body.isStatic) {
            let forceMagnitude = 0.03 * body.mass * timeScale;

            Body.applyForce(body, body.position, {
              x:
                (forceMagnitude + Common.random() * forceMagnitude) *
                Common.choose([1, -1]),
              y: -forceMagnitude + Common.random() * -forceMagnitude,
            });
          }
        }
      };

      Events.on(mouseConstraint, "mousemove", function (event) {
        let foundPhysics = Matter.Query.point(stack, event.mouse.position);
        shakeScene(engine, foundPhysics);
      });

      Composite.add(engine.world, mouseConstraint);

      render.mouse = mouse;

      Render.run(render);
      let boxWidth = sW * 0.9;
      let boxHeight = sW * 0.8;
      let boxX = sW / 2;
      let boxY = sW / 2;
      let wallThickness = 50;

      let walls = [
        Bodies.rectangle(
          boxX,
          boxY - boxHeight / 2 - wallThickness / 2,
          boxWidth,
          wallThickness,
          {
            isStatic: true,
            render: { fillStyle: "transparent" },
          }
        ),

        Bodies.rectangle(boxX, boxY + boxHeight / 2, boxWidth, wallThickness, {
          isStatic: true,
          render: { fillStyle: "transparent" },
        }),

        // Left Wall
        Bodies.rectangle(
          boxX - boxWidth / 2 - wallThickness / 2,
          boxY,
          wallThickness,
          boxHeight,
          {
            isStatic: true,
            render: { fillStyle: "transparent" },
          }
        ),

        // Right Wall
        Bodies.rectangle(
          boxX + boxWidth / 2 + wallThickness / 2,
          boxY,
          wallThickness,
          boxHeight,
          {
            isStatic: true,
            render: { fillStyle: "transparent" },
          }
        ),
      ];

      Composite.add(engine.world, walls);

      // let r = sW / 2;
      // let parts = [];
      // let pegCount = 32;
      // let TAU = Math.PI * 2;
      // for (let i = 0; i < pegCount; i++) {
      //   const segment = TAU / pegCount;
      //   let angle2 = (i / pegCount) * TAU + segment / 2;
      //   let x2 = Math.cos(angle2);
      //   let y2 = Math.sin(angle2);
      //   let cx2 = x2 * r + sW / 2;
      //   let cy2 = y2 * r + sW / 2;
      //   let rect = addRect({
      //     x: cx2,
      //     y: cy2,
      //     w: (10 / 1000) * sW,
      //     h: (400 / 1000) * sW,
      //     options: {
      //       angle: angle2,
      //       isStatic: true,
      //       density: 1,
      //       render: {
      //         fillStyle: "transparent",
      //         strokeStyle: "transparent",
      //         lineWidth: 0,
      //       },
      //     },
      //   });
      //   parts.push(rect);
      // }

      function addBody(...bodies) {
        World.add(engine.world, ...bodies);
      }

      function addRect({ x = 0, y = 0, w = 10, h = 10, options = {} } = {}) {
        let body = Bodies.rectangle(x, y, w, h, options);
        addBody(body);
        return body;
      }

      let runner = Runner.create();

      Runner.run(runner, engine);
    };

    createSphere();

    return () => {};
  }, []);

  return (
    <div className="bg-[#F1F7FF] relative h-screen overflow-hidden">
      {/* <div className="grid grid-cols-2 gap-4">
        {logos.map((columnLogos, columnIndex) => (
          <div key={columnIndex} className="flex flex-col items-center">
            {columnLogos.map((logo, logoIndex) => (
              <div key={logoIndex} className="p-2">
                <img
                  src={logo}
                  alt={`Logo ${logoIndex + 1}`}
                  className="w-auto h-14"
                />
              </div>
            ))}
          </div>
        ))}
      </div> */}
      <div className="container flex flex-col-reverse items-center justify-center h-full gap-4 py-32 mx-auto overflow-hidden lg:py-0 lg:flex-row lg:overflow-visible">
        <div
          id="ballcanvas"
          className="z-10 w-full h-full lg:w-1/2 horizontal-item"
        />

        <div className="lg:w-1/2 ">
          <p className="font-neue-montreal text-[24px]">Awards & Recognition</p>
          <div className="flex items-center mt-10">
            <div className="w-48 h-px bg-black"></div>
            <p className=" font-neue-montreal text-[15px] pl-4">
              Our greatest award is the success of our patients
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Testimonials = ({ textureUrl, position }) => {
  const carouselItems = [
    {
      type: "image",
      src: "../images/beigegradient.png",
      name: "Lisa Moyer",
      description:
        "You will receive top-notch orthodontic care at Frey Smiles. Dr. Frey and his entire staff make every visit a pleasure. It is apparent at each appointment that Dr. Frey truly cares about his patients. He has treated both of our kids and my husband, and they all have beautiful smiles! I highly recommend!",
    },
    {
      type: "image",
      src: "../images/buttongradient.png",
      name: "Karen O'Neill",
      description:
        "I had an open bite and misaligned teeth most of my life. Dr. Frey fixed it and in record time. 1 1/2 years with Invisalign. Highly recommended! Friendly staff and easy to make appointments!",
    },
    {
      type: "image",
      src: "../images/gradient2.jpeg",
      name: "Karen Oneill",
      description:
        "I had an open bite and misaligned teeth most of my life. Dr. Frey fixed it and in record time. 1 1/2 years with Invisalign. Highly recommended! Friendly staff and easy to make appointments!",
    },
    {
      type: "image",
      src: "../images/radialgradient.png",
      name: "Tanya Burnhauser",
      description:
        "Dr. Frey was my orthodontist when I was 11 years old. I'm now 42. I still talk about how amazing he was and the great work he did with my teeth. Thank you so much for giving the most beautiful smile!",
    },
  ];

  const carouselRef = useRef(null);

  const controls = useAnimation();

  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? carouselItems.length - 1 : prevIndex - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === carouselItems.length - 1 ? 0 : prevIndex + 1
    );
  };

  const [maxDrag, setMaxDrag] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
      const containerWidth = carouselRef.current.scrollWidth;
      const viewportWidth = carouselRef.current.offsetWidth;
      setMaxDrag(-(containerWidth - viewportWidth));
    }
  }, [carouselItems]);

  return (
    <div className="relative sticky flex flex-col w-full h-screen overflow-hidden">
      <div className="w-full bg-[#666] h-[1px]"></div>

      <div className="relative flex flex-1 w-full overflow-hidden">
        {/* Left Column */}
        <div className="w-[25%] h-full flex flex-col justify-center items-center p-10 border-r border-[#666]">
          <div className="font-neue-montreal text-white text-[40px] leading-tight">
            Select Reviews
          </div>

          {/* Counter */}
          <div className="flex inline-flex items-center gap-6 mt-20 text-sm text-white font-neue-montreal">
            <div>{`${String(currentIndex + 1).padStart(2, "0")} / ${
              carouselItems.length
            }`}</div>
            <div className="flex gap-4">
              <button
                onClick={prevSlide}
                className="flex items-center justify-center "
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 100 267"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="white"
                  fill="none"
                  strokeWidth="10"
                  transform="rotate(-90)"
                >
                  <path d="M49.894 2.766v262.979" strokeLinecap="square"></path>
                  <path d="M99.75 76.596C73.902 76.596 52.62 43.07 49.895 0 47.168 43.07 25.886 76.596.036 76.596"></path>
                </svg>
              </button>
              <button
                onClick={nextSlide}
                className="flex items-center justify-center "
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 100 267"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="white"
                  fill="none"
                  strokeWidth="10"
                  transform="rotate(90)"
                >
                  <path d="M49.894 2.766v262.979" strokeLinecap="square"></path>
                  <path d="M99.75 76.596C73.902 76.596 52.62 43.07 49.895 0 47.168 43.07 25.886 76.596.036 76.596"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-[75%] relative flex overflow-hidden">
          <div
            className="flex w-full overflow-x-auto snap-mandatory snap-x"
            style={{
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <motion.div
              ref={carouselRef}
              className="flex w-full h-full cursor-grab active:cursor-grabbing gap-[2vw] pl-[2vw]"
              style={{ willChange: "transform" }}
              drag="x"
              dragConstraints={{ left: maxDrag, right: 0 }}
              dragElastic={0.1}
              dragMomentum={false}
              onDragEnd={(event, info) => {
                const offset = info.offset.x;
                const velocity = info.velocity.x;
                const threshold = 60;
                const velocityThreshold = 400;

                if (offset > threshold || velocity > velocityThreshold) {
                  prevSlide();
                } else if (
                  offset < -threshold ||
                  velocity < -velocityThreshold
                ) {
                  nextSlide();
                }
              }}
            >
              {carouselItems.map((item, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col items-center justify-center flex-none cursor-grab active:cursor-grabbing"
                  whileTap={{ scale: 0.98 }}
                >
                  {item.type === "image" ? (
                    <div className="relative w-[30vw] h-[70vh] flex items-center justify-center">
                      <img
                        src={item.src}
                        alt={item.name}
                        className="object-cover w-full h-full pointer-events-none"
                        draggable={false}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center font-neue-montreal text-[#17191A] text-[15px] p-4">
                        {item.description}
                      </div>
                    </div>
                  ) : (
                    <video
                      src={item.src}
                      autoPlay
                      loop
                      muted
                      className="w-auto h-full max-w-[40vw] max-h-[85vh] object-cover pointer-events-none"
                      draggable={false}
                      preload="auto"
                    />
                  )}
                  <p className="text-sm text-center font-neue-montreal">
                    {item.name}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

function Locations() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  const [scope, animate] = useAnimate();
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [activeDisclosurePanel, setActiveDisclosurePanel] = useState(null);

  function toggleDisclosurePanels(newPanel) {
    if (activeDisclosurePanel) {
      if (
        activeDisclosurePanel.key !== newPanel.key &&
        activeDisclosurePanel.open
      ) {
        activeDisclosurePanel.close();
      }
    }
    setActiveDisclosurePanel({
      ...newPanel,
      open: !newPanel.open,
    });
  }

  const locations = [
    {
      location: "Allentown",
      addressLine1: "1251 S Cedar Crest Blvd",
      addressLine2: "Suite 210 Allentown, PA 18103",
      mapbox_map_title: "FreySmiles Allentown [w/ Colors]",
      mapbox_iframe_url: process.env.NEXT_PUBLIC_MAPBOX_IFRAME_URL_ALLENTOWN,
      hours: [
        { Mon: "11:00 AM - 7:00 PM" },
        { Tue: "11:00 AM - 7:00 PM" },
        { Wed: "8:00 AM - 5:30 PM" },
        { Thu: "7:00 AM - 4:30 PM" },
      ],
    },
    {
      location: "Bethlehem",
      addressLine1: "2901 Emrick Boulevard",
      addressLine2: "Bethlehem, PA 18020",
      mapbox_map_title: "FreySmiles Bethlehem [w/ Colors]",
      mapbox_iframe_url: process.env.NEXT_PUBLIC_MAPBOX_IFRAME_URL_BETHLEHEM,
      hours: [{ Tue: "11:00 AM - 7:00 PM" }, { Thu: "7:00 AM - 4:30 PM" }],
    },
    {
      location: "Schnecksville",
      addressLine1: "4155 Independence Drive",
      addressLine2: "Schnecksville, PA 18078",
      mapbox_map_title: "FreySmiles Schnecksville [w/ Colors]",
      mapbox_iframe_url:
        process.env.NEXT_PUBLIC_MAPBOX_IFRAME_URL_SCHNECKSVILLE,
      hours: [
        { Mon: "11:00 AM - 7:00 PM" },
        { Tue: "11:00 AM - 7:00 PM" },
        { Thu: "7:00 AM - 4:30 PM" },
      ],
    },
    {
      location: "Lehighton",
      addressLine1: "1080 Blakeslee Blvd Dr E",
      addressLine2: "Lehighton, PA 18235",
      mapbox_map_title: "FreySmiles Lehighton [w/ Colors]",
      mapbox_iframe_url: process.env.NEXT_PUBLIC_MAPBOX_IFRAME_URL_LEHIGHTON,
      hours: [{ Mon: "11:00 AM - 7:00 PM" }, { Thu: "7:00 AM - 4:30 PM" }],
    },
  ];

  const handleShowAllLocations = () => {
    activeDisclosurePanel.close();
    setSelectedLocation("All");
  };

  useEffect(() => {
    animate(
      "div",
      isInView
        ? {
            opacity: 1,
            transform: "translateX(0px)",
            scale: 1,
            filter: "blur(0px)",
          }
        : {
            opacity: 0,
            transform: "translateX(-50px)",
            scale: 0.3,
            filter: "blur(2px)",
          },
      {
        duration: 0.2,
        delay: isInView ? stagger(0.1, { startDelay: 0.15 }) : 0,
      }
    );
  }, [isInView]);

  const DrawEllipse = (props) => {
    useGSAP(() => {
      gsap.from(".draw", {
        drawSVG: "0%",
        ease: "expo.out",
        scrollTrigger: {
          trigger: "#locations-section",
          start: "clamp(top center)",
          scrub: true,
          pinSpacing: false,
          markers: false,
        },
      });
    });

    return (
      <svg
        width="508"
        height="122"
        viewBox="0 0 508 122"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          className="draw"
          d="M2 23.2421C28.9079 14.5835 113.098 -1.63994 234.594 2.73493C386.464 8.20351 515.075 37.5458 505.497 77.9274C503.774 85.1946 491.815 127.145 271.535 118.942C51.2552 110.739 32.8106 78.7919 45.7824 58.053C59.4644 36.1787 112.824 27.9758 193.548 27.9758"
          stroke="#ff6432"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  const BezierCurve = () => {
    const container = useRef(null);
    const path = useRef(null);
    let progress = 0;
    let time = Math.PI / 2; // want the initial time value to be 1; in sine graph y = 1 when x = pi / 2
    let reqId = null; // everytime mouse enters and leaves line's bounding box, animation gets called causing simultaneous chains of it being called (this is bad), only want one request animation running at the same time
    let x = 0.5; // middle point is 1/2

    useEffect(() => {
      setPath(progress);
      window.addEventListener("resize", () => {
        setPath(progress);
      });
    }, []);

    {
      /*
      use svg container's width to get control point (center point) of quadratic bezier curve; control point = svg container's width / 2
      30 ==> svg height(60) divided by 2 to align the path within the center of the svg
    */
    }
    const setPath = (progress) => {
      if (container.current) {
        const width = container.current.offsetWidth;
        path.current.setAttributeNS(
          null,
          "d",
          `M 0 30 Q${width * x} ${30 + progress} ${width} 30`
        );
      }
    };

    const manageMouseEnter = () => {
      if (reqId) {
        window.cancelAnimationFrame(reqId);
        resetAnimation();
      }
    };

    const manageMouseMove = (e) => {
      const { movementY, clientX } = e;
      const { left, width } = path.current.getBoundingClientRect();
      // get value of x depending on where mouse is on the x-axis of the line
      x = (clientX - left) / width;
      progress += movementY;
      setPath(progress);
    };

    const manageMouseLeave = () => {
      animateOut();
    };

    {
      /*
      linear interpolation
      x: The value we want to interpolate from (start) => 10
      y: The target value we want to interpolate to (end) => 0
      a: The amount by which we want x to be closer to y => 10% or 0.1
      ex: value = lerp(value, 0, 0.1)
      if value = 10, bring that value close to 0 by 10% which will give 9
    */
    }
    const lerp = (x, y, a) => x * (1 - a) + y * a;

    // sine function, linear interpolation, recursivity
    const animateOut = () => {
      // sine function creates the "wobbly" line animation when mouse leaves the line
      const newProgress = progress * Math.sin(time);
      time += 0.25; // speed of bounce animation
      setPath(newProgress);
      progress = lerp(progress, 0, 0.05); // change 3rd lerp argument to change curve's bounce exaggeration

      // exit condition
      if (Math.abs(progress) > 0.75) {
        reqId = window.requestAnimationFrame(animateOut);
      } else {
        resetAnimation();
      }
    };

    const resetAnimation = () => {
      time = Math.PI / 2;
      progress = 0;
    };

    return (
      <>
        {/* line */}
        <div
          ref={container}
          className="mb-[30px] col-span-12 row-start-2 h-[1px] w-full relative"
        >
          {/* box for event listeners overlays the svg element */}
          <div
            onMouseEnter={manageMouseEnter}
            onMouseMove={(e) => {
              manageMouseMove(e);
            }}
            onMouseLeave={manageMouseLeave}
            className="h-[30px] relative -top-[15px] z-10 hover:h-[60px] hover:-top-[30px]"
          />
          <svg className="w-full h-[60px] -top-[30px] absolute">
            <path ref={path} strokeWidth={1} stroke="#000" fill="none" />
          </svg>
        </div>
      </>
    );
  };

  useEffect(() => {
    const title = document.querySelector(".content__title");
    const split = new SplitText(title, { type: "chars" });
    const chars = split.chars;

    gsap.fromTo(
      chars,
      {
        "will-change": "opacity, transform",
        transformOrigin: "50% 100%",
        opacity: 0,
        rotationX: 90,
      },
      {
        ease: "power4",
        opacity: 1,
        stagger: 0.03,
        rotationX: 0,
        scrollTrigger: {
          trigger: title,
          start: "center bottom",
          end: "bottom top+=20%",
          scrub: true,
        },
      }
    );
  }, []);

  useEffect(() => {
    gsap.to(".marquee-track.r h1", {
      scrollTrigger: {
        trigger: ".marquee-track.r h1",
        start: "top bottom",
        end: "400% top",
        scrub: 0.6,
      },
      xPercent: 25,
      duration: 3,
      ease: "linear",
    });
  }, []);

  const targetRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const childSplit = new SplitText(".text-heading h1", {
            type: "lines",
            linesClass: "split-child",
          });

          gsap.from(childSplit.lines, {
            duration: 2,
            xPercent: 25,
            autoAlpha: 0,
            ease: "Expo.easeOut",
            stagger: 0.12,
            repeat: -1,
          });

          observer.unobserve(entry.target);
        }
      });
    });

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const pathRef = useRef(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = pathLength;
    path.style.strokeDashoffset = pathLength;
    path.style.transition = "stroke-dashoffset 2s ease-out";

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          path.style.strokeDashoffset = "0";
        } else {
          path.style.strokeDashoffset = pathLength;
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(path);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section id="flex locations-section" className="relative ">
        <div
          id="locations-heading"
          className="relative block max-w-2xl px-4 py-16 mx-auto sm:px-6 sm:py-24 lg:max-w-[100rem] lg:px-8 lg:py-32"
        >
          <h1 className="font-helvetica-neue-light lg:text-5xl">
            Come see us at any of our{" "}
            <span className="relative inline-block my-8 leading-tight lowercase font-editorial-new underline-offset-8">
              four convenient locations
              {/* <img className="absolute w-full h-auto -ml-2 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" src="/../../images/ellipse.svg" /> */}
              <DrawEllipse className="absolute w-full h-auto -ml-2 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" />
            </span>{" "}
            or opt for a{" "}
            <span className=" relative leading-tight lowercase font-editorial-new decoration-wavy underline-offset-8 decoration-[#000] underline inline-block">
              virtual consultation
            </span>
          </h1>

          <svg
            className="hidden lg:block absolute bottom-0 translate-y-1/2 left-0 translate-x-64 w-36 h-36 rotate-[120deg] text-[#ff6432]"
            viewBox="0 0 77 85"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              ref={pathRef}
              d="M1.33755 84.3973C0.297616 62.7119 2.93494 39.8181 19.4192 23.8736C28.2211 15.3599 42.4944 12.5723 47.6281 26.2359C51.1245 35.5419 51.542 51.9945 41.0605 57.0865C29.486 62.7095 40.2945 35.2221 41.9942 32.4952C49.9497 19.7313 59.7772 11.6122 72.2699 3.78281C76.9496 0.849879 73.7108 0.477284 70.0947 1.13476C66.9572 1.7052 63.4035 2.43717 60.5291 3.81975C59.6524 4.24143 65.7349 2.73236 66.6827 2.44768C70.7471 1.22705 75.4874 -0.0219285 75.9527 5.60812C76.0274 6.5127 75.9956 14.9844 74.7481 15.2963C74.099 15.4586 71.0438 10.27 70.4642 9.65288C66.6996 5.64506 63.5835 4.42393 58.2726 5.11792"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="font-neue-montreal text-[#171616]" ref={ref}>
          {/* <motion.div
            id="locations-map"
            className="h-[60vh] overflow-hidden lg:absolute lg:right-0 lg:h-full lg:w-1/2"
            style={{
              opacity: isInView ? 1 : 0,
              filter: isInView ? "blur(0px)" : "blur(16px)",
              transition: "all 0.9s cubic-bezier(0.17, 0.55, 0.55, 1) 0.5s",
            }}
          >
            <iframe
              className="w-full h-full rounded-lg"
              width="100%"
              height="100%"
              src={
                selectedLocation === "All"
                  ? process.env.NEXT_PUBLIC_MAPBOX_IFRAME_URL_ALL_LOCATIONS
                  : locations.find((l) => l.location === selectedLocation)
                      .mapbox_iframe_url
              }
              title={
                selectedLocation === "All"
                  ? "FreySmiles All Locations [w/ Colors]"
                  : locations.find((l) => l.location === selectedLocation)
                      .mapbox_map_title
              }
            />
          </motion.div> */}

          <div
            className="font-neue-montreal text-[#171616]"
            id="locations-details"
          >
            <div className="max-w-2xl px-4 py-16 mx-auto sm:px-6 sm:py-24 lg:mt-0 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8 xl:gap-x-24">
              {/* LOCATIONS LIST */}
              <motion.div
                className="flex flex-col mt-10"
                style={{
                  transform: isInView ? "none" : "translateX(-50px)",
                  opacity: isInView ? 1 : 0,
                  transition: "all 0.9s cubic-bezier(0.17, 0.55, 0.55, 1) 0.5s",
                }}
              >
                <button
                  className={`${
                    selectedLocation === "All" ? "" : ""
                  } self-end transition-all duration-300 ease-linear w-max mr-6 mb-6 underline-offset-4 `}
                  onClick={handleShowAllLocations}
                >
                  {selectedLocation === "All"
                    ? "Showing All Locations"
                    : "Show All Locations"}
                </button>

                <dl ref={scope}>
                  {locations.map((l, i) => (
                    <Disclosure
                      as="div"
                      key={l.location}
                      className={`${
                        selectedLocation === l.location ? "" : ""
                      } px-4 py-6 transition-all duration-300 ease-linear cursor-pointer hover:text-black group `}
                    >
                      {(panel) => {
                        const { open, close } = panel;
                        return (
                          <>
                            <BezierCurve />

                            <Disclosure.Button
                              className="grid w-full grid-cols-12 grid-rows-1 text-left sm:px-0"
                              onClick={() => {
                                if (!open) close();
                                toggleDisclosurePanels({ ...panel, key: i });
                                setSelectedLocation(l.location);
                              }}
                            >
                              <dt className="col-span-5 row-start-1">
                                <h6 className="text-xl font-neue-montreal">
                                  {l.location}
                                </h6>
                              </dt>
                              <dd className="col-span-7 row-start-1">
                                <span className="flex items-center justify-between">
                                  <p className="font-neue-montreal">
                                    {l.addressLine1}
                                    <br />
                                    {l.addressLine2}
                                  </p>
                                  <ChevronRightIcon className="w-6 h-6 ui-open:rotate-90 ui-open:transform" />
                                </span>
                              </dd>
                            </Disclosure.Button>
                            <Transition
                              show={open}
                              enter="transition-transform ease-out duration-300"
                              enterFrom="transform scale-y-0 opacity-0"
                              enterTo="transform scale-y-100 opacity-100"
                              leave="transition-transform ease-in duration-200"
                              leaveFrom="transform scale-y-100 opacity-100"
                              leaveTo="transform scale-y-0 opacity-0"
                            >
                              <Disclosure.Panel
                                as="div"
                                className="grid grid-cols-12"
                              >
                                <ul className="col-span-7 col-start-6 mt-4 mb-2 text-left">
                                  <h6 className="font-medium uppercase">
                                    Office Hours:
                                  </h6>
                                  {l.hours.map((hour, index) => (
                                    <li key={index}>
                                      {Object.keys(hour)[0]}:{" "}
                                      {Object.values(hour)[0]}
                                    </li>
                                  ))}
                                </ul>
                              </Disclosure.Panel>
                            </Transition>
                          </>
                        );
                      }}
                    </Disclosure>
                  ))}
                </dl>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function GiftCards() {
  return (
    <>
      <section className="relative min-h-screen group hover:cursor-pointer">
        <div className="absolute inset-0 w-full h-full flex justify-start items-start bg-[#FFF560] bg-opacity-80 text-white [clip-path:circle(50%_at_0%_0%)] lg:[clip-path:circle(30%_at_0%_0%)] lg:group-hover:[clip-path:circle(35%_at_0%_0%)] group-hover:bg-opacity-100 motion-safe:transition-[clip-path] motion-safe:duration-[2s] ease-out" />
        <Link
          href={`${process.env.NEXT_PUBLIC_SQUARE_GIFT_CARDS_URL}`}
          target="_blank"
          className="text-2xl font-neue-montreal absolute inset-0 w-full h-full pl-[12%] pt-[18%] lg:pl-[6%] lg:pt-[8%] lg:group-hover:pl-[8%] lg:group-hover:pt-[12%] group-hover:duration-[1s]"
        >
          Send a Gift Card
        </Link>
        <img
          src="../images/mockupgiftcardtest.png"
          alt="gift cards mockup"
          className="absolute inset-0 object-cover object-center w-full h-full -z-10"
        />
      </section>
    </>
  );
}
