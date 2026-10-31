"use client";
import FlutedGlassEffect from "/utils/glass";
import {
  vertexShader,
  splatShader,
  divergenceShader,
  pressureShader,
  gradientSubtractShader,
  advectionShader,
  displayShader,
} from "./gooeyshader";
import * as SunCalc from "suncalc";
import AsciiEffect from "./asciieffect.jsx";
import LocationCharacterReveal from "@/app/locations/[locationSlug]/LocationCharReveal";
import { KernelSize } from "postprocessing";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Line2, LineMaterial, LineGeometry } from "three-stdlib";
import { Water } from "three/examples/jsm/objects/Water";
import { Sky } from "three/examples/jsm/objects/Sky";
import { Curtains, Plane } from "curtainsjs";
import {
  Vector2,
  Vector4,
  TextureLoader,
  CatmullRomCurve3,
  Vector3,
} from "three";
import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore, { Keyboard, Mousewheel } from "swiper/core";
import { Navigation } from "swiper/modules";
import Link from "next/link";
import Matter from "matter-js";

import * as THREE from "three";
import { RectAreaLight } from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import React, {
  useMemo,
  useId,
  forwardRef,
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  Suspense,
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
import { Observer } from "gsap/Observer";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { SplitText } from "gsap/SplitText";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
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
  useTexture,
  Edges,
  CubeCamera,
  RoundedBox,
  Environment,
  Center,
  Clouds,
  Cloud,
  Stars,
} from "@react-three/drei";
import {
  Canvas,
  useFrame,
  useThree,
  extend,
  useLoader,
} from "@react-three/fiber";

if (typeof window !== "undefined") {
  gsap.registerPlugin(
    DrawSVGPlugin,
    ScrollTrigger,
    SplitText,
    useGSAP,
    CustomEase,
    MotionPathPlugin,
    MorphSVGPlugin,
    Observer,
  );
  CustomEase.create("hop", "0.6, 0, 0.2, 1");
}

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

extend({ Water, Sky });

import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";

extend({ MeshLambertMaterial: THREE.MeshLambertMaterial });

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
      [68.5, 185.5],
    ];

    const points = rawPoints.map(
      ([x, y]) => new Vector3((x - 150) * 0.05, 8, (y - 150) * 0.05 - 5), // tunnel camera height is 8 to match door
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
      (a) => a.name === "Action" || a.name === "Curve.006Action",
    );

    relevantClips.forEach((clip) => {
      const action = mixer.current.clipAction(clip);
      action.reset();
      action.paused = true;
      action.play();
      action.time = 0;
    });

    actionRef.current = relevantClips.map((clip) =>
      mixer.current.clipAction(clip),
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
        1,
      );

      const clampedTime = THREE.MathUtils.lerp(
        clipStart,
        clipEnd,
        openProgress,
      );

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
function InfiniteCorridor() {
  const group = useRef();
  const scroll = useThreeScroll();

  const segmentCount = 30;
  const segmentSpacing = 34;
  const panelDepth = 21;

  const panelOffset = 13;
  const corridorWidth = panelOffset * 2;

  const floorY = -6;
  const corridorHeight = 26;
  const ceilingY = floorY + corridorHeight;
  const wallCenterY = floorY + corridorHeight / 2;
  const corridorY = 4.6;

  const panelPalette = ["#4a4a55", "#756d72", "#aaa39c", "#d4a5a5"];

  useFrame(() => {
    if (!group.current) return;

    const progress = scroll.offset * segmentCount * segmentSpacing;

    group.current.position.z = progress * 0.8;
  });

  return (
    <group ref={group} position={[0, corridorY, 0]}>
      {Array.from({ length: segmentCount }).map((_, i) => {
        const z = -i * segmentSpacing;

        const opacity = Math.max(0, 1 - (i / segmentCount) * 1.2);

        // Each new rectangle rotates the complete
        // lighting arrangement clockwise by 90 degrees.
        const getPanelColor = (sideIndex) => {
          const paletteIndex = (sideIndex - i + 4) % 4;

          return panelPalette[paletteIndex];
        };

        return (
          <group key={i} position={[0, 0, z]}>
            {/* Left: side index 3 */}
            <mesh
              position={[-panelOffset, wallCenterY, 0]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <planeGeometry args={[panelDepth, corridorHeight]} />

              <meshStandardMaterial
                color={getPanelColor(3)}
                emissive="#222222"
                roughness={0.15}
                metalness={0.95}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Right: side index 1 */}
            <mesh
              position={[panelOffset, wallCenterY, 0]}
              rotation={[0, -Math.PI / 2, 0]}
            >
              <planeGeometry args={[panelDepth, corridorHeight]} />

              <meshStandardMaterial
                color={getPanelColor(1)}
                emissive="#222222"
                roughness={0.15}
                metalness={0.95}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Top: side index 0 */}
            <mesh position={[0, ceilingY, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[corridorWidth, panelDepth]} />

              <meshStandardMaterial
                color={getPanelColor(0)}
                emissive="#222222"
                roughness={0.15}
                metalness={0.95}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Bottom: side index 2 */}
            <mesh position={[0, floorY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[corridorWidth, panelDepth]} />

              <meshStandardMaterial
                color={getPanelColor(2)}
                emissive="#222222"
                roughness={0.15}
                metalness={0.95}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

const WATER_Y = -2;
const RING_RADIUS = 10;
const RING_SUBMERSION = 2.75;

const RING_CENTER_Y = WATER_Y + RING_RADIUS - RING_SUBMERSION;
function NeonRing({ waterY = -2, submersion = 0.75 }) {
  const group = useRef();
  const shaderRef = useRef();
  const scroll = useThreeScroll();

  const ringRadius = 10;

  const ringCenterY = waterY + ringRadius - submersion;

  const ringMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: "#ff5b9d",
      emissive: "#ff146f",
      emissiveIntensity: 4.1,

      roughness: 0.25,
      metalness: 0.03,

      transparent: true,
      opacity: 0.98,

      toneMapped: false,
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = {
        value: 0,
      };

      shader.vertexShader = `
        uniform float uTime;
        ${shader.vertexShader}
      `;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
            vec3 transformed =
              vec3(position);

            float ringAngle = atan(
              position.y,
              position.x
            );

            float slowWave =
              sin(
                ringAngle * 5.0 +
                uTime * 0.48
              ) * 0.032;

            float middleWave =
              sin(
                ringAngle * 13.0 -
                uTime * 0.9
              ) * 0.022;

            float fineWave =
              sin(
                ringAngle * 31.0 +
                uTime * 1.5
              ) * 0.01;

            float liquidPeak =
              pow(
                max(
                  0.0,
                  sin(
                    ringAngle * 4.0 -
                    uTime * 0.62
                  )
                ),
                12.0
              );

            vec2 radialDirection =
              normalize(position.xy);

            float radialMovement =
              slowWave +
              middleWave +
              fineWave +
              liquidPeak * 0.095;

            transformed.xy +=
              radialDirection *
              radialMovement;

            transformed +=
              normal *
              liquidPeak *
              0.035;
          `,
      );

      shaderRef.current = shader;
    };

    material.customProgramCacheKey = () => "animated-neon-ring-v2";

    return material;
  }, []);

  useEffect(() => {
    return () => {
      ringMaterial.dispose();
    };
  }, [ringMaterial]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = time * 2.9;
    }

    if (!group.current) return;

    group.current.rotation.z =
      scroll.offset * 0.22 + Math.sin(time * 0.13) * 0.008;

    const breath = 1 + Math.sin(time * 0.8) * 0.0015;

    group.current.scale.setScalar(breath);
  });

  return (
    <group ref={group} position={[0, ringCenterY, -8]}>
      <mesh>
        <torusGeometry args={[ringRadius, 0.028, 12, 512]} />

        <primitive object={ringMaterial} attach="material" />
      </mesh>
    </group>
  );
}

function ReflectionCard({ position, rotation, size, color, intensity = 1 }) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
    }),
    [color, intensity],
  );

  return (
    <mesh
      position={position}
      rotation={rotation}
      onUpdate={(mesh) => mesh.layers.set(1)}
    >
      <planeGeometry args={[size, size]} />
      <shaderMaterial
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
        vertexShader={`
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix
              * modelViewMatrix
              * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform float uIntensity;
          varying vec2 vUv;

          void main() {
            vec2 p = vUv * 2.0 - 1.0;
            float softness =
              1.0 - smoothstep(0.15, 0.95, length(p));

            gl_FragColor = vec4(
              uColor * uIntensity,
              softness * 0.85
            );
          }
        `}
      />
    </mesh>
  );
}
function FloatingCube({ waterY = WATER_Y, position = [-5, 0, 2], size = 2.4 }) {
  const floatRef = useRef();
  const cubeRef = useRef();
  const cameraRef = useRef();

  const restingY = waterY + size * 0.42;

  useEffect(() => {
    if (!cameraRef.current) return;

    cameraRef.current.traverse((object) => {
      if (object.isCamera) {
        object.layers.enable(1);
      }
    });
  }, []);

  useFrame(({ clock }, delta) => {
    if (!floatRef.current || !cubeRef.current) {
      return;
    }

    const time = clock.getElapsedTime();

    const targetY =
      restingY + Math.sin(time * 0.85) * 0.16 + Math.sin(time * 1.7) * 0.035;

    floatRef.current.position.y = THREE.MathUtils.damp(
      floatRef.current.position.y,
      targetY,
      3.5,
      delta,
    );

    cubeRef.current.rotation.x = Math.sin(time * 0.72) * 0.075;

    cubeRef.current.rotation.z = Math.sin(time * 0.58 + 1.2) * 0.095;

    cubeRef.current.rotation.y += delta * 0.035;
  });

  return (
    <group ref={floatRef} position={[position[0], restingY, position[2]]}>
      {/* Mauve frontal reflection */}
      <ReflectionCard
        position={[0, size * 0.45, size * 2]}
        rotation={[0, Math.PI, 0]}
        size={size * 2.7}
        color="#e2bfd2"
        intensity={2.0}
      />

      {/* Pale lilac highlight */}
      <ReflectionCard
        position={[-size * 1.8, size * 0.25, 0]}
        rotation={[0, Math.PI / 2, 0]}
        size={size * 2.2}
        color="#f5e3ed"
        intensity={2.6}
      />

      {/* Deeper purple-rose overhead reflection */}
      <ReflectionCard
        position={[0, size * 1.9, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        size={size * 2.5}
        color="#c696b2"
        intensity={1.6}
      />
      <CubeCamera
        ref={cameraRef}
        resolution={256}
        near={0.1}
        far={20000}
        frames={Infinity}
      >
        {(cubeEnvironment) => (
          <RoundedBox
            ref={cubeRef}
            args={[size, size, size]}
            radius={size * 0.008}
            smoothness={4}
          >
            <meshPhysicalMaterial
              color="#d9b4c7"
              envMap={cubeEnvironment}
              envMapIntensity={3.0}
              metalness={0.9}
              roughness={0.12}
              clearcoat={1}
              clearcoatRoughness={0.025}
              emissive="#684b65"
              emissiveIntensity={0.1}
              transparent={false}
              transmission={0}
            />
          </RoundedBox>
        )}
      </CubeCamera>
    </group>
  );
}
const OceanScene = () => {
  const scroll = useThreeScroll();
  const { scene, gl, camera } = useThree();

  const waterRef = useRef();
  const smoothedScroll = useRef(0);
  const enteredPortalRef = useRef(false);

  const [enteredPortal, setEnteredPortal] = useState(false);

  useEffect(() => {
    const previousFog = scene.fog;

    const previousEnvironment = scene.environment;

    const previousToneMapping = gl.toneMapping;

    const previousExposure = gl.toneMappingExposure;

    const previousClearColor = new THREE.Color();

    gl.getClearColor(previousClearColor);

    const previousClearAlpha = gl.getClearAlpha();

    const horizonColor = 0x66545c;

    scene.fog = new THREE.FogExp2(horizonColor, 0.0016);

    gl.setClearColor(0x000000, 0);

    gl.outputColorSpace = THREE.SRGBColorSpace;

    gl.toneMapping = THREE.ACESFilmicToneMapping;

    gl.toneMappingExposure = 0.95;

    const waterNormals = new THREE.TextureLoader().load(
      "https://threejs.org/examples/textures/waternormals.jpg",
    );

    waterNormals.wrapS = THREE.RepeatWrapping;

    waterNormals.wrapT = THREE.RepeatWrapping;

    const water = new Water(new THREE.PlaneGeometry(10000, 10000), {
      textureWidth: 512,
      textureHeight: 512,

      waterNormals,

      sunDirection: new THREE.Vector3(),

      sunColor: 0xffbdcc,
      waterColor: 0x242126,

      distortionScale: 3.2,
      fog: true,
    });

    water.rotation.x = -Math.PI / 2;

    water.position.y = WATER_Y;

    scene.add(water);
    waterRef.current = water;

    const sky = new Sky();

    sky.scale.setScalar(10000);

    const skyUniforms = sky.material.uniforms;

    skyUniforms.turbidity.value = 12;

    skyUniforms.rayleigh.value = 1.25;

    skyUniforms.mieCoefficient.value = 0.012;

    skyUniforms.mieDirectionalG.value = 0.86;

    sky.material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <tonemapping_fragment>",
        `
            float skyHeight = clamp(
              normalize(
                vWorldPosition
              ).y,
              0.0,
              1.0
            );

            float horizonInfluence =
              1.0 -
              smoothstep(
                0.0,
                0.38,
                skyHeight
              );

            float middleInfluence =
              1.0 -
              smoothstep(
                0.18,
                0.72,
                skyHeight
              );

            vec3 upperGray = vec3(
              0.245,
              0.235,
              0.240
            );

            vec3 middleGrayMauve =
              vec3(
                0.315,
                0.270,
                0.285
              );

            vec3 horizonPink = vec3(
              0.470,
              0.300,
              0.355
            );

            vec3 grayPinkSky = mix(
              upperGray,
              middleGrayMauve,
              middleInfluence
            );

            grayPinkSky = mix(
              grayPinkSky,
              horizonPink,
              horizonInfluence * 0.72
            );

            gl_FragColor.rgb = mix(
              gl_FragColor.rgb,
              grayPinkSky,
              0.88
            );

            #include <tonemapping_fragment>
          `,
      );
    };

    sky.material.needsUpdate = true;

    scene.add(sky);

    const sun = new THREE.Vector3();

    const theta = Math.PI * (0.495 - 0.47);

    const phi = 2 * Math.PI * (0.205 - 0.5);

    sun.x = Math.cos(phi);

    sun.y = Math.sin(phi) * Math.sin(theta);

    sun.z = Math.sin(phi) * Math.cos(theta);

    skyUniforms.sunPosition.value.copy(sun);
    RectAreaLightUniformsLib.init();

    const cubeCenter = new THREE.Vector3(-26.5, WATER_Y + 7.4 * 0.42, -27);

    const cubeKeyLight = new THREE.RectAreaLight(0xe1b4ca, 7.5, 18, 22);

    cubeKeyLight.position.set(-14, 11, -12);

    cubeKeyLight.lookAt(cubeCenter);

    const cubeFillLight = new THREE.RectAreaLight(0x9f899f, 2.2, 14, 18);

    cubeFillLight.position.set(-39, 5, -19);

    cubeFillLight.lookAt(cubeCenter);

    const cubeGlintLight = new THREE.PointLight(0xf6becf, 1.8, 35, 2);
    cubeGlintLight.position.set(-21, WATER_Y + 5, -19);

    scene.add(cubeKeyLight, cubeFillLight, cubeGlintLight);
    water.material.uniforms.sunDirection.value.copy(sun).normalize();

    const pmrem = new THREE.PMREMGenerator(gl);

    const environmentTarget = pmrem.fromScene(sky);

    scene.environment = environmentTarget.texture;

    return () => {
      scene.remove(water, sky, cubeKeyLight, cubeFillLight, cubeGlintLight);

      scene.fog = previousFog;

      scene.environment = previousEnvironment;

      gl.toneMapping = previousToneMapping;

      gl.toneMappingExposure = previousExposure;

      gl.setClearColor(previousClearColor, previousClearAlpha);

      waterRef.current = null;

      water.geometry.dispose();
      water.material.dispose();
      waterNormals.dispose();

      sky.geometry.dispose();
      sky.material.dispose();

      environmentTarget.dispose();
      pmrem.dispose();
    };
  }, [scene, gl]);

  useFrame((_, delta) => {
    smoothedScroll.current = THREE.MathUtils.damp(
      smoothedScroll.current,
      scroll.offset,
      6,
      delta,
    );

    const t = THREE.MathUtils.smoothstep(smoothedScroll.current, 0, 1);

    const cameraZ = THREE.MathUtils.lerp(35, -70, t);

    camera.position.set(0, RING_CENTER_Y, cameraZ);

    camera.lookAt(0, RING_CENTER_Y, cameraZ - 100);

    const shouldEnterPortal = cameraZ <= -5;

    if (shouldEnterPortal !== enteredPortalRef.current) {
      enteredPortalRef.current = shouldEnterPortal;

      setEnteredPortal(shouldEnterPortal);
    }

    if (waterRef.current) {
      waterRef.current.material.uniforms.time.value += delta * 0.18;
    }
  });

  return (
    <>
      <NeonRing waterY={WATER_Y} submersion={RING_SUBMERSION} />

      <FloatingCube waterY={WATER_Y} position={[-26.5, 0, -27]} size={7.4} />

      <EffectComposer multisampling={8}>
        <Bloom
          mipmapBlur
          intensity={2.9}
          luminanceThreshold={0.62}
          luminanceSmoothing={0.9}
          resolutionX={1024}
          resolutionY={1024}
        />
      </EffectComposer>
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
// const containerRef = useRef(null);

// useEffect(() => {
//   if (!containerRef.current) return;

//   const imgSize = [1250, 833];

//   const vertex = `
//     attribute vec2 uv;
//     attribute vec2 position;
//     varying vec2 vUv;
//     void main() {
//       vUv = uv;
//       gl_Position = vec4(position, 0, 1);
//     }
//   `;

//   const fragment = `
//     precision highp float;
//     uniform sampler2D tWater;
//     uniform sampler2D tFlow;
//     uniform float uTime;
//     varying vec2 vUv;
//     uniform vec4 res;
//     void main() {
//       vec3 flow = texture2D(tFlow, vUv).rgb;
//       vec2 uv = .5 * gl_FragCoord.xy / res.xy ;
//       vec2 myUV = (uv - vec2(0.5)) * res.zw + vec2(0.5);
//       myUV -= flow.xy * (0.15 * 0.7);
//       vec3 tex = texture2D(tWater, myUV).rgb;
//       gl_FragColor = vec4(tex, 1.0);
//     }
//   `;

//   // const renderer = new OGL.Renderer({ dpr: 2 });
//   // const gl = renderer.gl;
//   // containerRef.current.appendChild(gl.canvas);

//   const renderer = new OGL.Renderer({ dpr: 2 });
//   const gl = renderer.gl;
//   containerRef.current.appendChild(gl.canvas);

//   gl.canvas.style.borderRadius = "20px";
//   gl.canvas.style.clipPath = "inset(0% round 20px)";
//   // gl.canvas.style.clipPath = "none";
//   renderer.setSize(window.innerWidth, window.innerHeight);

//   let aspect = 1;
//   const mouse = new OGL.Vec2(-1);
//   const velocity = new OGL.Vec2();

//   function resize() {
//     if (!containerRef.current) return;

//     const containerWidth = containerRef.current.clientWidth;
//     const containerHeight = containerRef.current.clientHeight;

//     renderer.setSize(containerWidth, containerHeight);

//     let a1, a2;
//     var imageAspect = imgSize[1] / imgSize[0];
//     var containerAspect = containerHeight / containerWidth;

//     if (containerAspect < imageAspect) {
//       a1 = 1;
//       a2 = containerAspect / imageAspect;
//     } else {
//       a1 = imageAspect / containerAspect;
//       a2 = 1;
//     }

//     program.uniforms.res.value = new OGL.Vec4(
//       containerWidth,
//       containerHeight,
//       a1,
//       a2
//     );

//     aspect = containerWidth / containerHeight;
//   }

//   const flowmap = new OGL.Flowmap(gl);
//   const geometry = new OGL.Geometry(gl, {
//     position: {
//       size: 2,
//       data: new Float32Array([-1, -1, 3, -1, -1, 3]), // Covers full screen
//     },
//     uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
//   });

//   const texture = new OGL.Texture(gl, {
//     minFilter: gl.LINEAR,
//     magFilter: gl.LINEAR,
//   });

//   const img = new Image();
//   img.onload = () => (texture.image = img);
//   img.crossOrigin = "Anonymous";
//   // img.src = "../images/bubble.jpg";
//   img.src = "../images/test.png";

//   let a1, a2;
//   var imageAspect = imgSize[1] / imgSize[0];
//   if (window.innerHeight / window.innerWidth < imageAspect) {
//     a1 = 1;
//     a2 = window.innerHeight / window.innerWidth / imageAspect;
//   } else {
//     a1 = (window.innerWidth / window.innerHeight) * imageAspect;
//     a2 = 1;
//   }

//   const program = new OGL.Program(gl, {
//     vertex,
//     fragment,
//     uniforms: {
//       uTime: { value: 0 },
//       tWater: { value: texture },
//       res: {
//         value: new OGL.Vec4(window.innerWidth, window.innerHeight, a1, a2),
//       },
//       tFlow: flowmap.uniform,
//     },
//   });

//   const mesh = new OGL.Mesh(gl, { geometry, program });

//   window.addEventListener("resize", resize, false);
//   resize();

//   const isTouchCapable = "ontouchstart" in window;
//   if (isTouchCapable) {
//     window.addEventListener("touchstart", updateMouse, true);
//     window.addEventListener("touchmove", updateMouse, { passive: true });
//   } else {
//     window.addEventListener("mousemove", updateMouse, true);
//   }

//   let lastTime;
//   const lastMouse = new OGL.Vec2();

//   function updateMouse(e) {
//     e.preventDefault();

//     const rect = gl.canvas.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     mouse.set(x / rect.width, 1 - y / rect.height);

//     const minDimension = Math.min(window.innerWidth, window.innerHeight);
//     const baseFactor = 300;
//     const scaleFactor = minDimension / baseFactor;

//     if (!lastTime) {
//       lastTime = performance.now();
//       lastMouse.set(x, y);
//     }

//     const deltaX = (x - lastMouse.x) * scaleFactor * 0.3;
//     const deltaY = (y - lastMouse.y) * scaleFactor * 0.3;
//     lastMouse.set(x, y);

//     const time = performance.now();
//     const delta = Math.max(5, time - lastTime);
//     lastTime = time;

//     velocity.x = deltaX / delta;
//     velocity.y = deltaY / delta;
//     velocity.needsUpdate = true;
//   }

//   // function updateMouse(e) {
//   //   e.preventDefault();

//   //   const rect = gl.canvas.getBoundingClientRect();
//   //   const x = e.clientX - rect.left;
//   //   const y = e.clientY - rect.top;

//   //   mouse.set(x / rect.width, 1 - y / rect.height);

//   //   const sensitivity = (Math.min(rect.width, rect.height) / 300) * 3;

//   //   if (!lastTime) {
//   //     lastTime = performance.now();
//   //     lastMouse.set(x, y);
//   //   }

//   //   const deltaX = (x - lastMouse.x) * sensitivity;
//   //   const deltaY = (y - lastMouse.y) * sensitivity;
//   //   lastMouse.set(x, y);

//   //   const time = performance.now();
//   //   const delta = Math.max(5, time - lastTime);
//   //   lastTime = time;

//   //   velocity.x = deltaX / delta;
//   //   velocity.y = deltaY / delta;
//   //   velocity.needsUpdate = true;
//   // }
//   function update(t) {
//     requestAnimationFrame(update);

//     if (!velocity.needsUpdate) {
//       mouse.set(-1);
//       velocity.set(0);
//     }
//     velocity.needsUpdate = false;

//     flowmap.aspect = aspect;
//     flowmap.mouse.copy(mouse);
//     flowmap.velocity.lerp(velocity, velocity.len ? 0.25 : 0.15);
//     flowmap.update();

//     program.uniforms.uTime.value = t * 0.01;
//     renderer.render({ scene: mesh });
//   }
//   requestAnimationFrame(update);

//   return () => {
//     window.removeEventListener("resize", resize);
//     window.removeEventListener("mousemove", updateMouse);
//     window.removeEventListener("touchstart", updateMouse);
//     window.removeEventListener("touchmove", updateMouse);
//     if (containerRef.current && gl?.canvas) {
//       containerRef.current.removeChild(gl.canvas);
//     }
//   };
// }, []);

// const { scrollY } = useScroll();
// const y = useTransform(scrollY, (latest) => -latest * 0.5);
function FSMark({ x, y, size = 80, rotation = 0 }) {
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      overflow="visible"
    >
      <g fill="#000" transform={`rotate(${rotation} 8 8)`}>
        <path d="M3,4.75h0c.55,0,1,.45,1,1v1h-1c-.55,0-1-.45-1-1h0c0-.55.45-1,1-1Z" />
        <path d="M3,7h1v1c0,.55-.45,1-1,1h0c-.55,0-1-.45-1-1h0c0-.55.45-1,1-1Z" />
        <path d="M3,9.25h1v1c0,.55-.45,1-1,1h-1v-1c0-.55.45-1,1-1Z" />
        <path d="M5.25,4.75h1c.55,0,1,.45,1,1h0c0,.55-.45,1-1,1h-2v-1c0-.55.45-1,1-1Z" />
        <path d="M4.25,7h1c.55,0,1,.45,1,1h0c0,.55-.45,1-1,1h-1v-2h0Z" />
        <path d="M9.06,4.75h1.56v3.12h-1.56c-.86,0-1.56-.7-1.56-1.56h0c0-.86.7-1.56,1.56-1.56Z" />
        <path d="M10.87,4.75h1.56c.86,0,1.56.7,1.56,1.56v1.56h-1.56c-.86,0-1.56-.7-1.56-1.56v-1.56h0Z" />
        <path d="M7.5,8.12h1.56c.86,0,1.56.7,1.56,1.56v1.56h-1.56c-.86,0-1.56-.7-1.56-1.56v-1.56h0Z" />
        <path d="M10.87,8.12h1.56c.86,0,1.56.7,1.56,1.56h0c0,.86-.7,1.56-1.56,1.56h-1.56v-3.13h0Z" />
      </g>
    </svg>
  );
}
function FreyMobileSkyMarquee() {
  const skyRef = useRef(null);
  const [maskReady, setMaskReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function createTextMask() {
      await document.fonts.load('147px "OTF-Glusp"');

      if (cancelled) return;

    const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
if (!ctx) return;

const fontSize = 147;
const text = "FREY SMILES";
const spacing = -10;

ctx.font = `${fontSize}px "OTF-Glusp"`;
ctx.textBaseline = "alphabetic";

// Measure one complete wordmark
const letterWidths = [...text].map(
  (letter) => ctx.measureText(letter).width
);

const wordmarkWidth = Math.ceil(
  letterWidths.reduce((sum, width) => sum + width + spacing, 0)
);

canvas.width = wordmarkWidth;
canvas.height = 240;

// Canvas resize resets the drawing settings
ctx.font = `${fontSize}px "OTF-Glusp"`;
ctx.textBaseline = "alphabetic";
ctx.fillStyle = "#ffffff";

let x = 0;

[...text].forEach((letter, index) => {
  ctx.fillText(letter, x, 205);
  x += letterWidths[index] + spacing;
});

const maskURL = canvas.toDataURL("image/png");

      if (cancelled || !skyRef.current) return;

      skyRef.current.style.webkitMaskImage = `url("${maskURL}")`;
      skyRef.current.style.maskImage = `url("${maskURL}")`;
skyRef.current.style.webkitMaskSize = `${wordmarkWidth}px 240px`;
skyRef.current.style.maskSize = `${wordmarkWidth}px 240px`;

skyRef.current.style.setProperty(
  "--wordmark-width",
  `${wordmarkWidth}px`
);
      setMaskReady(true);
    }

    createTextMask().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="frey-mobile-sky-marquee">
      <div
        ref={skyRef}
        className="frey-mobile-sky-background"
        style={{ opacity: maskReady ? 1 : 0 }}
      >
     <FreyCloudScene moonScale={0.8} />
      </div>
    </div>
  );
}

function FloatingBookButton() {
  return (
    <div className="fixed right-6 top-6 z-[100] md:right-[4vw] md:top-[34px]">
      <Link
        href="/book-now"
        className="frey-orbit-button"
        aria-label="Book Now"
      >
        <span className="frey-orbit-button__loader" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <span
              key={index}
              className="frey-orbit-button__ball"
              style={{
                animationDelay: `${index * -0.25}s`,
              }}
            />
          ))}
        </span>

        <span className="frey-orbit-button__label">Book Now</span>
      </Link>
    </div>
  );
}
const COLORS = [
  ["0%", "#D596F0"],
  ["18.27%", "#D19DE8"],
  ["28.37%", "#CEA4DF"],
  ["41.35%", "#CBA8D9"],
  ["58.66%", "#C6ACD4"],
  ["68.27%", "#C6B0CE"],
  ["80.29%", "#C1B6C3"],
  ["100%", "#BCBCBC"],
];

function TestimonialSpectrum() {
  const containerRef = useRef(null);
  const spectrumRef = useRef(null);

  const rawId = useId().replace(/:/g, "");
  const blurId = `spectrum-blur-${rawId}`;

  useLayoutEffect(() => {
    const container = containerRef.current;
    const spectrum = spectrumRef.current;

    if (!container || !spectrum) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        spectrum,
        {
          scaleY: 0.05,
          opacity: 0,
          transformOrigin: "bottom center",
        },
        {
          scaleY: 1,
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: container,
            start: "top 85%",
            end: "bottom 70%",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        },
      );
    }, container);

    return () => ctx.revert();
  }, []);

  const heights = [290, 400, 480, 530, 584, 530, 480, 400, 290];

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Clip the spectrum to the four card rectangles */}
      <div
        className="
          absolute inset-0
          grid grid-cols-1 gap-4
          md:grid-cols-2
          lg:grid-cols-4
        "
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="relative overflow-hidden">
            <div
              ref={index === 0 ? spectrumRef : undefined}
              className="absolute inset-0"
            >
              {/* The shared SVG is positioned below */}
            </div>
          </div>
        ))}
      </div>

      <div
        ref={spectrumRef}
        className="absolute inset-0"
        style={{
          maskImage: "linear-gradient(#000, #000)",
        }}
      >
        <svg
          viewBox="0 0 1567 584"
          preserveAspectRatio="none"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter
              id={blurId}
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation="15" />
            </filter>

            {heights.map((height, index) => (
              <linearGradient
                key={index}
                id={`spectrum-gradient-${rawId}-${index}`}
                x1="0"
                y1="584"
                x2="0"
                y2={584 - height}
                gradientUnits="userSpaceOnUse"
              >
                {COLORS.map(([offset, color], i) => (
                  <stop
                    key={offset}
                    offset={offset}
                    stopColor={color}
                    stopOpacity={i === COLORS.length - 1 ? 0 : 1}
                  />
                ))}
              </linearGradient>
            ))}
          </defs>

          <g filter={`url(#${blurId})`}>
            {heights.map((height, index) => {
              const columnWidth = 1567 / 9;
              const x = index * columnWidth;

              return (
                <rect
                  key={index}
                  x={x}
                  y={584 - height}
                  width={columnWidth + 1}
                  height={height}
                  fill={`url(#spectrum-gradient-${rawId}-${index})`}
                />
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

const Hero = () => {
  const transitionRef = useRef(null);
  const videoStepRef = useRef(null);
  const videoRef = useRef(null);
  const sectionRef = useRef(null);

  const marqueeRef = useRef(null);
  const videoButtonRef = useRef(null);
  const editorialRef = useRef(null);
  const statsTextCharsRef = useRef([]);
  const [videoReady, setVideoReady] = useState(false);
  const notchPathRef = useRef(null);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) return;

      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useLayoutEffect(() => {
    const container = marqueeRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const letters = gsap.utils.toArray(".frey-sky-letter", container);

      const movingGroup = container.querySelector(".frey-sky-moving-letters");

      if (!letters.length || !movingGroup) return;

      const timeline = gsap.timeline();

      timeline.fromTo(
        letters,
        {
          clipPath: "inset(100% 0 0 0)",
        },
        {
          clipPath: "inset(0% 0 0 0)",
          duration: 0.85,
          ease: "power2.out",
          stagger: {
            each: 0.075,
            from: "end",
          },
        },
        0,
      );

      timeline.to(
        movingGroup,
        {
          x: -2700,
          duration: 75,
          ease: "none",
          repeat: -1,
        },
        0,
      );
    }, container);

    return () => ctx.revert();
  }, []);

  useLayoutEffect(() => {
    const button = videoButtonRef.current;
    if (!button) return;

    const label = button.querySelector(".frey-video-button-label");

    const ctx = gsap.context(() => {
      gsap.set(button, {
        scaleX: 0,
        transformOrigin: "left center",
      });

      gsap.set(label, {
        opacity: 0,
      });

      if (!videoReady) return;

      const timeline = gsap.timeline({
        delay: 1.35,
      });

      timeline.to(button, {
        scaleX: 1,
        duration: 0.85,
        ease: "power3.inOut",
      });

      timeline.to(
        label,
        {
          opacity: 1,
          duration: 0.35,
          ease: "power2.out",
        },
        0.55,
      );
    }, button);

    return () => ctx.revert();
  }, [videoReady]);

  useLayoutEffect(() => {
    const container = editorialRef.current;
    if (!container) return;

    const columns = container.querySelectorAll(".frey-editorial-column");

    const ctx = gsap.context(() => {
      gsap.set(columns, {
        opacity: 0,
        filter: "blur(20px)",
        y: 8,
      });

      if (!videoReady) return;

      gsap.to(columns, {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        duration: 1.6,
        stagger: 0.25,
        delay: 0.4,
        ease: "power2.out",
      });
    }, container);

    return () => ctx.revert();
  }, [videoReady]);

  useEffect(() => {
    ScrollTrigger.config({
      ignoreMobileResize: true,
    });
  }, []);

  useLayoutEffect(() => {
    const container = transitionRef.current;
    const step = videoStepRef.current;
    const section = sectionRef.current;

    if (!container || !step || !section) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isMobile: "(max-width: 767px)",
          isDesktop: "(min-width: 768px)",
        },
        (context) => {
          const { isMobile } = context.conditions;

          const initialClip =
            "polygon(0% 0%, 100% 0%, 100% 34%, 70% 34%, 70% 68%, 48% 68%, 48% 100%, 0% 100%)";

          const finalClip =
            "polygon(0% 0%, 100% 0%, 100% 34%, 100% 34%, 100% 68%, 100% 68%, 100% 100%, 0% 100%)";

          const timeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: container,
              start: "top top",
              end: isMobile ? "+=100%" : "+=250%",
             scrub: isMobile ? 0.35 : 1,

              pin: !isMobile,
              pinSpacing: !isMobile,

              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          // 1. Restore the video clip-path expansion
          timeline.fromTo(
            step,
            { clipPath: initialClip },
            { clipPath: finalClip, duration: 1 },
            0,
          );

          // 2. Restore the vertical parallax transition
          // timeline.fromTo(
          //   section,
          //   { yPercent: 100 },
          //   {
          //     yPercent: 0,
          //     duration: 0.8,
          //     immediateRender: true,
          //     force3D: true,
          //   },
          //   isMobile ? 0.25 : 0.5,
          // );// Keep the second section in place on mobile
          if (isMobile) {
            gsap.set(section, { yPercent: 0 });
          } else {
            timeline.fromTo(
              section,
              { yPercent: 100 },
              {
                yPercent: 0,
                duration: 0.8,
                immediateRender: true,
                force3D: true,
              },
              0.5,
            );
          }
          // 3. Restore the text color animation
          const chars = statsTextCharsRef.current;

          if (chars.length) {
            timeline.to(
              chars,
              {
                color: "#abff02",
                duration: 0.12,
                stagger: { each: 0.012 },
              },
              0.65,
            );

            timeline.to(
              chars,
              {
                color: "#000000",
                duration: 0.12,
                stagger: { each: 0.012 },
              },
              0.85,
            );
          }
        },
      );
    }, container);

    return () => ctx.revert();
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const path = notchPathRef.current;

    if (!section || !path) return;
    const H = 470;

    const notch = { y: 74.57 };

    const updatePath = () => {
      const shift = notch.y - 74.57;

      const d = `
      M -0.5,-0.5
      L 728.5,-0.5
      L 728.5,470.5
      L 473.49,470.02
      L 437.09,470
      L 182.29,470
      L 145.89,470
      L -0.5,470.5

      L -0.02,${314.97 + shift}

      A 22.39,22.39 0 0 1
        5.09,${300.8 + shift}

      L 24.91,${276.74 + shift}

      A 22.29,22.29 0 0 0
        30,${262.57 + shift}

      L 30,${126.97 + shift}

      A 22.29,22.29 0 0 0
        24.91,${112.8 + shift}

      L 5.09,${88.74 + shift}

      A 22.5,22.5 0 0 1
        -0.05,${74.57 + shift}

      L -0.5,-0.5
      Z
    `;

      path.setAttribute("d", d);
    };

    updatePath();

    const ctx = gsap.context(() => {
      gsap.to(notch, {
        y: 150,
        ease: "none",
        onUpdate: updatePath,

        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);
  useEffect(() => {
    if (window.innerWidth >= 768) return;

    const onRefresh = () => {
      console.log("GSAP REFRESH", {
        scrollY: window.scrollY,
        innerHeight: window.innerHeight,
        visualHeight: window.visualViewport?.height,
      });
    };

    ScrollTrigger.addEventListener("refresh", onRefresh);

    return () => {
      ScrollTrigger.removeEventListener("refresh", onRefresh);
    };
  }, []);
  return (
    <>
      <div ref={transitionRef} className="relative h-auto w-full md:h-screen">
        <section className="relative flex h-[100svh] w-full flex-col justify-end overflow-hidden bg-[#0F0F0F] md:h-screen">
          <div ref={videoStepRef} className="hero-main-video">
    
            <div className="hero-main-video-scene bg-[#0F0F0F]">
              <video
                ref={videoRef}
                src="/videos/boyholdingaligner-test.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onLoadedData={() => setVideoReady(true)}
                onCanPlay={() => setVideoReady(true)}
                className="hero-mobile-video h-full w-full object-cover"
              />
            </div>

            <div className="frey-video-overlay absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 px-8 text-center text-white">
              <h2 className="frey-video-headline -translate-x-20 max-w-[620px] font-neueroman text-[clamp(2.5rem,5vw,5.5rem)] leading-[0.95] tracking-[-0.025em]">
                <LocationCharacterReveal
                  ready={videoReady}
                  delay={0.35}
                  stagger={0.045}
                >
                  Where smiles
                </LocationCharacterReveal>

                <br />

                <LocationCharacterReveal
                  ready={videoReady}
                  delay={0.8}
                  stagger={0.045}
                >
                  take shape
                </LocationCharacterReveal>
              </h2>
            </div>
          </div>

          <div
            ref={editorialRef}
            className="
  absolute z-[5] hidden
  md:grid md:bottom-[66%] md:left-[56%] md:right-[6%]
  md:grid-cols-2 md:gap-10
"
          >
            <div className="frey-editorial-column flex flex-col gap-3 text-[#f5f5f5]">
              <span className="font-neuehaas45 text-[12px] uppercase leading-[1.35] tracking-[0.04em] md:text-[11px] md:tracking-[0.08em]">
                (01) — OUR PHILOSOPHY
              </span>

              <p className="max-w-[320px] font-neuehaas45 text-[11px] leading-[1.4] tracking-[0.01em] text-[#f5f5f5] md:text-[clamp(0.75rem,0.95vw,0.95rem)] md:leading-[1.35] md:tracking-[0.02em]">
                Every smile is a story. At our office, we guide you through
                every step of your orthodontic journey
              </p>
            </div>

            <div className="frey-editorial-column flex flex-col gap-3 text-white">
              <span className="font-neuehaas45 text-[12px] uppercase leading-[1.35] tracking-[0.04em] md:text-[11px] md:tracking-[0.08em]">
                (02) — OUR PRACTICE
              </span>

              <p className="max-w-[320px] font-neuehaas45 text-[11px] leading-[1.4] tracking-[0.01em] text-[#f5f5f5] md:text-[clamp(0.75rem,0.95vw,0.95rem)] md:leading-[1.35] md:tracking-[0.02em]">
                with advanced treatment, personalized care, and results that go
                beyond the ordinary.
              </p>
            </div>
          </div>

          <div
            className="
    absolute bottom-[36%] left-[56%] right-[4%] z-[5]
    hidden items-start gap-6 text-white
    md:flex
  "
          >
            <div className="shrink-0 scale-125 origin-center md:mt-[5px] md:scale-100">
              <DotMatrix />
            </div>

            <h1
              className="
      m-0 font-neuehaas45 lowercase
      text-[clamp(0.875rem,3.125vw,1.5625rem)]
      leading-[1.04]
      md:text-[clamp(1.25rem,2.1vw,2.75rem)]
    "
            >
              <div>
                <LocationCharacterReveal
                  ready={videoReady}
                  delay={0.1}
                  stagger={0.045}
                >
                  We understand the art
                </LocationCharacterReveal>
              </div>

              <div>
                <LocationCharacterReveal
                  ready={videoReady}
                  delay={1.45}
                  stagger={0.045}
                >
                  behind the smile.
                </LocationCharacterReveal>
              </div>
            </h1>
          </div>

          <div
            ref={marqueeRef}
            className="frey-hero-bottom-marquee pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden w-full md:block"
          >
            <div className="frey-sky-marquee">
              <div className="frey-sky-background">
                <FreyCloudScene />
              </div>

              <svg
                className="frey-sky-mask-definition"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 2700 240"
                aria-hidden="true"
              >
                <defs>
                  <mask
                    id="frey-sky-text-mask"
                    maskUnits="userSpaceOnUse"
                    maskContentUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width="2700"
                    height="240"
                  >
                    <rect width="100%" height="100%" fill="black" />

                    <g className="frey-sky-moving-letters">
                      {[0, 1].map((copyIndex) => (
                        <text
                          key={copyIndex}
                          x={copyIndex * 2700}
                          y="205"
                          fontFamily="OTF-Glusp"
                          fontSize="230"
                          letterSpacing="-10"
                          fill="white"
                          xmlSpace="preserve"
                        >
                          {"FREY SMILES".split("").map((letter, index) => (
                            <tspan key={index} className="frey-sky-letter">
                              {letter}
                            </tspan>
                          ))}
                        </text>
                      ))}
                    </g>
                  </mask>
                </defs>
              </svg>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 md:hidden">
            <FreyMobileSkyMarquee />
          </div>
        </section>

        <section
          ref={sectionRef}
          className="relative z-30 min-h-[100svh] md:h-screen w-full overflow-visible bg-[#F5F5F5] md:absolute md:inset-x-0 md:top-0 md:h-screen"
        >
          <svg
            width="0"
            height="0"
            className="absolute pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <clipPath
                id="moving-fluted-clip"
                clipPathUnits="objectBoundingBox"
                transform="scale(0.001373626 0.00212766)"
              >
                <path ref={notchPathRef} />
              </clipPath>

              {/* NEW TOP INDENTATION */}
              <clipPath id="videoClip" clipPathUnits="objectBoundingBox">
                <path
                  d="
          M0 0
          L0.156 0
          Q0.167 0.002 0.183 0.018
          Q0.194 0.022 0.806 0.022
          Q0.817 0.018 0.833 0.004
          Q0.844 0 1 0
          L1 1
          L0 1
          Z
        "
                />
              </clipPath>
            </defs>
          </svg>

          {/* MOBILE EDITORIAL CONTENT */}
          <div className="relative z-20 flex w-full flex-col gap-10 px-7 pt-12 pb-8 text-black md:hidden">
            {/* MAIN STATEMENT */}
            <div className="flex items-start gap-4">
              <div className="mt-1 shrink-0">
                <DotMatrix color="black" />
              </div>

              <h2 className="font-neuehaas45 text-[clamp(20px,5.5vw,28px)] font-normal lowercase leading-[1.1] tracking-[-0.025em]">
                We understand the art
                <br />
                behind the smile.
              </h2>
            </div>

            {/* EDITORIAL COLUMNS */}
            <div className="grid grid-cols-2 gap-6 border-t border-black/15 pt-6">
              <div className="flex flex-col gap-3">
                <span className="font-neuehaas45 text-[10px] uppercase leading-[1.35] tracking-[0.04em]">
                  (01) — OUR PHILOSOPHY
                </span>

                <p className="font-neuehaas45 text-[12px] leading-[1.5]">
                  Every smile is a story. At our office, we guide you through
                  every step of your orthodontic journey.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <span className="font-neuehaas45 text-[10px] uppercase leading-[1.35] tracking-[0.04em]">
                  (02) — OUR PRACTICE
                </span>

                <p className="font-neuehaas45 text-[12px] leading-[1.5]">
                  With advanced treatment, personalized care, and results that
                  go beyond the ordinary.
                </p>
              </div>
            </div>
          </div>
          <div className="relative flex h-auto w-full flex-col items-center justify-center gap-8 py-8 md:h-full md:flex-row md:gap-0 md:py-0">
            <div
              className="relative aspect-video w-[94vw] md:w-[75vw]"
              style={{
                clipPath: "url(#videoClip)",
              }}
            >
              <div
                className="relative h-full w-full overflow-hidden"
                style={{
                  clipPath: "url(#moving-fluted-clip)",
                }}
              >
                <FlutedGlassEffect
                  className="h-full w-full"
                  src="/videos/invisman.mp4"
                />
              </div>
            </div>

            <div className="pointer-events-none relative z-20 w-full px-7 md:absolute md:inset-0 md:flex md:items-center md:justify-end md:px-0">
              <div className="w-full md:w-[50%] md:pr-[18%]">
                <TransitionAnimatedCopy charsRef={statsTextCharsRef}>
                  <h2 className="font-neueroman text-[14px] font-[550] leading-[1.4] tracking-[-0.01em] text-black md:text-[15px] md:leading-[1.5]">
                    Our doctors are fully invested in treatment planning your
                    case correctly. Guided by board-certified standards and
                    decades of clinical practice, we approach every case with
                    the same rigor demanded in academic orthodontics.
                  </h2>
                </TransitionAnimatedCopy>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

function DotMatrix({ color = "white" }) {
  const svgRef = useRef(null);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.to(
        ".dot-column",
        {
          y: 11,
          duration: 1.5,
          ease: "sine.inOut",
          stagger: {
            amount: 3,
            repeat: -1,
            yoyo: true,
          },
        },
        0,
      );

      for (let i = 0; i < 10; i++) {
        tl.add(
          gsap.fromTo(
            `.dot-column-${i} circle`,
            {
              y: (j) => gsap.utils.interpolate(77, -77, j / 10),
              transformOrigin: "50% 50%",
              scale: 0.133,
            },
            {
              y: (j) => gsap.utils.interpolate(i, -i, j / 10),
              scale: 0.8,
              duration: 1,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            },
          ),
          i / 10,
        );
      }

      tl.seek(50);
    }, svg);

    return () => ctx.revert();
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      className="block h-[44px] w-[44px] overflow-hidden"
      fill={color}
      aria-hidden="true"
    >
      <defs>
        <mask id="contact-dot-mask">
          <rect width="10" height="10" fill="white" />
        </mask>
      </defs>

      {Array.from({ length: 10 }, (_, col) => (
        <g
          key={col}
          className={`dot-column dot-column-${col}`}
          transform={`translate(${col * 10}, 0)`}
        >
          {Array.from({ length: 10 }, (_, row) => (
            <g key={row} transform={`translate(0, ${row * 10})`}>
              <g mask="url(#contact-dot-mask)">
                <circle cx="5" cy="5" r="5" />
              </g>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

function TransitionAnimatedCopy({
  children,
  charsRef,
  colorInitial = "#999999",
}) {
  const headingRef = useRef(null);

  useLayoutEffect(() => {
    if (!headingRef.current) return;

    const split = SplitText.create(headingRef.current, {
      type: "words,chars",
      wordsClass: "transition-copy-word",
      charsClass: "transition-copy-char",
    });

    charsRef.current = split.chars;

    gsap.set(split.chars, {
      color: colorInitial,
    });

    return () => {
      charsRef.current = [];
      split.revert();
    };
  }, [charsRef, colorInitial]);

  return React.cloneElement(children, {
    ref: headingRef,
  });
}

{
  /* <div style={{ height: '100vh', width: '100vw' }}>
      <Canvas camera={{ position: [0, 5, 30], fov: 50 }}>
  <ambientLight intensity={0.5} />
<pointLight position={[0, 0, 7]} intensity={0.1} color="#ff6b35" />
    <ambientLight intensity={0.4} />
    <directionalLight
  position={[10, 15, 5]}
  intensity={1.2}
  color={"#ffe2c4"}  
  castShadow
/>
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
            right: "37%",
            transform: `translateY(${topTextTranslateY}px)`,
            opacity,
            zIndex: 10,
            color: "white",
            maxWidth: "350px",
            textAlign: "left",

            pointerEvents: "none",
            transition:
              "opacity 0.2s linear, transform 0.2s linear, filter 0.2s linear",
          }}
        >
          <p
            style={{
              fontSize: "16px",
              lineHeight: "1.4",
              marginBottom: "20px",
              fontFamily: "Canela-ThinItalic",
            }}
          >
            Every smile is a story. At our office, we guide
            you through every step of your orthodontic journey — with advanced
            treatment, personalized care, and results that go beyond the
            ordinary.
          </p>
<div className="flex items-center gap-3">
  <div className="text-[17px] font-canelathin">
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
    </div> */
}
{
  /* <div style={{ height: "200vh", margin: 0 }}>
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
      </div> */
}

const LOCATIONS = [
  {
    name: "Allentown",
    lat: 40.56587,
    lng: -75.516663,
    angle: 0,
  },
  {
    name: "Bethlehem",
    lat: 40.6639457,
    lng: -75.2956125,
    angle: Math.PI / 2,
  },
  {
    name: "Schnecksville",
    lat: 40.6608497,
    lng: -75.599212,
    angle: Math.PI,
  },
  {
    name: "Lehighton",
    lat: 40.817125,
    lng: -75.730209,
    angle: (Math.PI * 3) / 2,
  },
];

export default function LandingComponent() {
  const shapeRef = useRef(null);
  return (
    <div style={{ overflowX: "clip" }}>
      <div className="MainContainer">
        <FloatingBookButton />
        <Hero shapeRef={shapeRef} />
      </div>

      <NewSection />
            <CTA />
      {/* <HeroMinimapIntro /> */}

      {/* <Locations /> */}
      {/* <GiftCards /> */}
    </div>
  );
}

function Tooth() {
  const group = useRef();
  const { scene } = useGLTF("/models/maxillary_first_molar_right_centered.glb");

  const toothMesh = useMemo(() => {
    let largest = null;

    scene.updateMatrixWorld(true);

    scene.traverse((child) => {
      if (!child.isMesh) return;

      if (
        !largest ||
        child.geometry.attributes.position.count >
          largest.geometry.attributes.position.count
      ) {
        largest = child;
      }
    });

    if (!largest) return null;

    const geometry = largest.geometry.clone();
    geometry.applyMatrix4(largest.matrixWorld);
    geometry.center();

    return { geometry, material: largest.material };
  }, [scene]);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.3;
    }
  });

  if (!toothMesh) return null;

  return (
    <group ref={group}>
      {/* <axesHelper args={[1]} /> */}
      <mesh
        geometry={toothMesh.geometry}
        material={toothMesh.material}
        scale={3}
        // rotation={[Math.PI, 0, 0]}
      />
    </group>
  );
}

function FS() {
  const group = useRef();
  const { scene } = useGLTF(
    "/models/FreySmiles-logo-3D-spin-frosted-smoked-glass.glb",
  );

  const logo = useMemo(() => {
    const meshes = [];
    const combined = new THREE.Group();

    scene.updateMatrixWorld(true);

    scene.traverse((child) => {
      if (!child.isMesh) return;

      const geometry = child.geometry.clone();
      geometry.applyMatrix4(child.matrixWorld);

      const mesh = new THREE.Mesh(geometry, child.material);
      combined.add(mesh);
      meshes.push(mesh);
    });

    const box = new THREE.Box3().setFromObject(combined);
    const center = box.getCenter(new THREE.Vector3());

    meshes.forEach((mesh) => {
      mesh.geometry.translate(-center.x, -center.y, -center.z);
    });

    return combined;
  }, [scene]);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={group}>
      <primitive object={logo} scale={20} />
    </group>
  );
}
function FSScene() {
  return (
    <div className="relative h-[600px] w-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={1.5} />

        <directionalLight position={[3, 5, 5]} intensity={3} />

        <directionalLight position={[-4, 1, -3]} intensity={1.5} />

        <Suspense fallback={null}>
          <FS />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}
function ToothScene() {
  return (
    <div className="relative h-[600px] w-full">
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 35,
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={1.5} />

        <directionalLight position={[3, 5, 5]} intensity={3} />

        <directionalLight position={[-4, 1, -3]} intensity={1.5} />

        <Suspense fallback={null}>
          <Tooth />
          <Environment preset="studio" />
        </Suspense>

        <AsciiEffect />
      </Canvas>
    </div>
  );
}

const INTRO_IMAGES = [
  "/images/aligner.jpg",
  "/images/random.png",
  "/images/dentaltest.png",
  "/images/bwpatientcircle.png",
  "/images/iphone-duo-mockup.jpg",
];

function HeroMinimapIntro({ onComplete }) {
  const trackRef = useRef(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let cancelled = false;
    let ctx;

    const startAnimation = async () => {
      const images = Array.from(track.querySelectorAll("img"));

      await Promise.all(
        images.map(async (img) => {
          try {
            await img.decode();
          } catch {}
        }),
      );

      if (cancelled) return;

      ctx = gsap.context(() => {
        // gsap.fromTo(
        //   track,
        //   {
        //     yPercent: 0,
        //   },
        //   {
        //     yPercent: -80,
        //     duration: 1.5,
        //     ease: "none",
        //     force3D: true,
        //     onComplete: () => onComplete?.(),
        //   },
        // );
      }, track);
    };

    startAnimation();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [onComplete]);

  return (
    <div className="h-screen grid grid-cols-2 bg-[#f5f5f5]">
      {/* <LocationsOrbit /> */}
      <ToothScene />

      {/* <div className="hero-minimap">
      <div className="hero-minimap-left">
        <div className="flex items-center gap-[2px]" aria-label="01">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block h-[6px] w-[6px] rounded-full bg-[#f5f5f5]"
            />
          ))}
        </div>
        <span>FREYSMILES</span>
      </div>

      <div className="hero-minimap-preview">
        <svg
          className="hero-minimap-clip-def"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1827 721"
          aria-hidden="true"
        >
          <defs>
            <clipPath
              id="hero-minimap-oval-clip"
              clipPathUnits="objectBoundingBox"
              transform="scale(0.000547345, 0.001386963)"
            >
              <path d="M960.045 604.522C1392.6 523.179 1722.77 348.268 1697.49 213.848C1672.21 79.4279 1301.06 36.4008 868.505 117.744C435.948 199.087 105.784 373.998 131.062 508.418C156.34 642.838 527.488 685.865 960.045 604.522Z" />
            </clipPath>

            <clipPath
              id="hero-minimap-oval-clip-mobile"
              clipPathUnits="objectBoundingBox"
            >
              <path
                transform="matrix(0.000575 0 0 0.00143 -0.025 -0.015)"
                d="M960.045 604.522C1392.6 523.179 1722.77 348.268 1697.49 213.848C1672.21 79.4279 1301.06 36.4008 868.505 117.744C435.948 199.087 105.784 373.998 131.062 508.418C156.34 642.838 527.488 685.865 960.045 604.522Z"
              />
            </clipPath>
          </defs>
        </svg>

        <div className="hero-minimap-oval">
          <div className="hero-minimap-image-mask">
            <div ref={trackRef} className="hero-minimap-track">
              {INTRO_IMAGES.map((src) => (
                <div className="hero-minimap-slide" key={src}>
                  <img src={src} alt="" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hero-minimap-right">
        <span>ORTHODONTICS</span>
        <span>2026</span>
      </div>
    </div> */}
    </div>
  );
}

const SKY_PRESETS = {
  day: {
    background: "#90b1e3",
    ambient: 1.5,
    directional: 2,
    colors: ["#55BFFF", "#91D9FF", "#C5EEFF", "#78CAFF"],
  },
  night: {
    background: "#171C26",
    ambient: 0.35,
    directional: 0.5,
    colors: ["#263653", "#344362", "#202F4D", "#415071"],
  },

  sunset: {
    background: "#E99A92",
    ambient: 1.5,
    directional: 2.0,
    colors: ["#B97883", "#987B91", "#D58B88", "#F3BC91", "#AA7888", "#E9A59A"],
  },
};
function RealisticMoon({ scale = 1.7 }) {
  const moonRef = useRef();
  const { viewport } = useThree();

  const moonTexture = useTexture("/images/moon.png");
  moonTexture.colorSpace = THREE.SRGBColorSpace;

  const glowTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(128, 128, 30, 128, 128, 128);

    gradient.addColorStop(0, "rgba(235,242,255,0.45)");
    gradient.addColorStop(0.3, "rgba(215,230,255,0.22)");
    gradient.addColorStop(0.65, "rgba(195,215,255,0.07)");
    gradient.addColorStop(1, "rgba(195,215,255,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    return new THREE.CanvasTexture(canvas);
  }, []);

  useEffect(() => {
    return () => glowTexture.dispose();
  }, [glowTexture]);

  return (
    <group position={[viewport.width * 0.18, viewport.height * 0.05, -10]}>
    <group scale={scale}>
        <sprite scale={[42, 42, 1]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            opacity={0.8}
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>

        <mesh ref={moonRef} renderOrder={1} scale={[0.85, 1, 1]}>
          <sphereGeometry args={[8.5, 64, 64]} />

          <meshStandardMaterial
            map={moonTexture}
            roughness={1}
            metalness={0}
            emissive="#B5BED0"
            emissiveIntensity={0.18}
          />
        </mesh>
      </group>
    </group>
  );
}

function MovingClouds({ skyMode = "day" }) {
  const { viewport } = useThree();
  const preset = SKY_PRESETS[skyMode] ?? SKY_PRESETS.day;

  const cloudConfigs = [
    {
      x: 0.12,
      y: 0.15,
      z: -5,
      size: 32,
      opacity: 0.65,
    },
    {
      x: 0.52,
      y: -0.25,
      z: -6,
      size: 38,
      opacity: 0.58,
    },
    {
      x: 0.88,
      y: 0.25,
      z: -5,
      size: 33,
      opacity: 0.68,
    },
  ];
  return (
    <Clouds frustumCulled={false} limit={1000}>
      {cloudConfigs.map((cloud, index) => (
        <Cloud
          key={index}
          position={[(cloud.x - 0.5) * viewport.width, cloud.y, cloud.z]}
          bounds={[cloud.size, 3, 2]}
          volume={9}
          color={preset.colors[index % preset.colors.length]}
          opacity={cloud.opacity}
          speed={0.3 + index * 0.05}
          segments={14}
        />
      ))}
    </Clouds>
  );
}

const ALLENTOWN = {
  latitude: 40.6084,
  longitude: -75.4902,
};

function getPennsylvaniaSkyMode() {
  const now = new Date();

  const { sunrise, sunset, dusk } = SunCalc.getTimes(now, 40.6084, -75.4902);

  const currentTime = now.getTime();

  const sunriseTime = sunrise.getTime();
  const sunsetTime = sunset.getTime();
  const duskTime = dusk.getTime();

  const sunsetStart = sunsetTime - 45 * 60 * 1000;

  if (currentTime >= sunsetStart && currentTime < duskTime) {
    return "sunset";
  }

  if (currentTime >= duskTime || currentTime < sunriseTime) {
    return "night";
  }

  return "day";
}

function FreyCloudScene({ skyMode, moonScale = 1.7 }) {
  const [autoSkyMode, setAutoSkyMode] = useState("day");

  useEffect(() => {
    const updateSky = () => {
      setAutoSkyMode(getPennsylvaniaSkyMode());
    };

    updateSky();

    const interval = setInterval(updateSky, 60_000);

    return () => clearInterval(interval);
  }, []);

  const activeMode = skyMode ?? autoSkyMode;
  const preset = SKY_PRESETS[activeMode] ?? SKY_PRESETS.day;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        dpr={[1, 2]}
        camera={{
          position: [0, 0, 12],
          fov: 45,
        }}
        gl={{ alpha: false, antialias: true }}
      >
        <color attach="background" args={[preset.background]} />

        <ambientLight intensity={preset.ambient} />

        <directionalLight
          position={[5, 8, 10]}
          intensity={preset.directional}
        />
        <directionalLight position={[8, 5, 10]} intensity={2.5} />
        {activeMode === "night" ? (
          <>
            <Stars
              radius={80}
              depth={50}
              count={4200}
              factor={2.2}
              saturation={0}
              fade={false}
              speed={0.65}
            />

          <RealisticMoon scale={moonScale} />
          </>
        ) : (
          <MovingClouds skyMode={activeMode} />
        )}
      </Canvas>
    </div>
  );
}

{
  /* <div
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
        </div> */
}

{
  /* <svg
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
        </svg> */
}

{
  /* <div className="vision-dot-background" aria-hidden="true">
                      <WordmarkDots />
          </div> */
}

{
  /* <main ref={mainRef}>
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
          </main> */
}
{
  /* <div className="vision-glass">
  <div className="vision-glass-content text-[#1D64EF]">
    <p className="uppercase text-[12px] font-semibold font-helvetica-neue-light tracking-widest">
      Vision
    </p>

    <h2 className="font-neue-montreal text-[20px] md:text-[20px] font-neuehaas35 leading-none mt-4">
      At Frey Smiles, we blend artistry and precision to craft smiles as
      unique as the individuals who wear them. Guided by expertise and
      innovation—we shape confidence one smile at a time.
    </h2>
  </div>
</div> */
}

class FluidSimulation {
  constructor(canvas, { image, background = "#f5f5f5" }) {
    this.canvas = canvas;
    this.disposed = false;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.scene = new THREE.Scene();

    this.mesh = new THREE.Mesh(this.geometry);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);

    this.width = 1;
    this.height = 1;

    this.simWidth = 128;
    this.simHeight = 128;

    this.time = 0;

    this.pressureIterations = 16;

    this.pointer = new THREE.Vector2(0.5, 0.5);
    this.previousPointer = new THREE.Vector2(0.5, 0.5);

    this.pendingSplats = [];

    this.imageSize = new THREE.Vector2(1, 1);
    this.resolution = new THREE.Vector2(1, 1);

    const color = new THREE.Color(background);

    this.backgroundColor = new THREE.Vector3(color.r, color.g, color.b);

    // Floating-point render targets are required because
    // velocity and pressure contain negative values.
    this.targetOptions = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    };

    const makeMaterial = (fragmentShader, uniforms) =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        depthTest: false,
        depthWrite: false,
      });

    this.splatMaterial = makeMaterial(splatShader, {
      uTarget: { value: null },
      uPoint: { value: new THREE.Vector2() },
      uValue: { value: new THREE.Vector3() },
      uRadius: { value: 0.1 },
      uAspect: { value: 1 },
      uClampDye: { value: 0 },
    });

    this.divergenceMaterial = makeMaterial(divergenceShader, {
      uVelocity: { value: null },
      uTexelSize: { value: new THREE.Vector2() },
    });

    this.pressureMaterial = makeMaterial(pressureShader, {
      uPressure: { value: null },
      uDivergence: { value: null },
      uTexelSize: { value: new THREE.Vector2() },
    });

    this.gradientMaterial = makeMaterial(gradientSubtractShader, {
      uPressure: { value: null },
      uVelocity: { value: null },
      uTexelSize: { value: new THREE.Vector2() },
    });

    this.advectionMaterial = makeMaterial(advectionShader, {
      uVelocity: { value: null },
      uSource: { value: null },
      uTexelSize: { value: new THREE.Vector2() },
      uDt: { value: 0.016 },
      uDissipation: { value: 1 },
      uDrift: { value: new THREE.Vector2(0, 0) },
    });
    const placeholder = new THREE.DataTexture(
      new Uint8Array([245, 245, 245, 255]),
      1,
      1,
      THREE.RGBAFormat,
    );

    placeholder.colorSpace = THREE.SRGBColorSpace;
    placeholder.needsUpdate = true;

    this.placeholderTexture = placeholder;
    this.loadedTexture = null;

    this.displayMaterial = makeMaterial(displayShader, {
      uDye: { value: null },
      uImage: { value: placeholder },
      uResolution: { value: this.resolution },
      uImageSize: { value: this.imageSize },
      uBackgroundColor: { value: this.backgroundColor },
      uTime: { value: 0 },
      uTexelSize: {
        value: new THREE.Vector2(1, 1),
      },
    });

    // Render targets.
    this.velocity = this.createDoubleTarget(128, 128);
    this.pressure = this.createDoubleTarget(128, 128);
    this.divergence = this.createTarget(128, 128);
    this.dye = this.createDoubleTarget(512, 512);

    this.texelSize = new THREE.Vector2(1 / 128, 1 / 128);

    this.divergenceMaterial.uniforms.uTexelSize.value = this.texelSize;

    this.pressureMaterial.uniforms.uTexelSize.value = this.texelSize;

    this.gradientMaterial.uniforms.uTexelSize.value = this.texelSize;

    const loader = new THREE.TextureLoader();

    loader.load(
      image,
      (texture) => {
        if (this.disposed) {
          texture.dispose();
          return;
        }

        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        this.loadedTexture = texture;

        this.imageSize.set(texture.image.width, texture.image.height);

        this.displayMaterial.uniforms.uImage.value = texture;
      },
      undefined,
      (error) => {
        console.error("Fluid reveal image failed:", error);
      },
    );
  }

  createTarget(width, height) {
    return new THREE.WebGLRenderTarget(width, height, this.targetOptions);
  }

  createDoubleTarget(width, height) {
    return {
      read: this.createTarget(width, height),
      write: this.createTarget(width, height),

      swap() {
        const temp = this.read;
        this.read = this.write;
        this.write = temp;
      },

      setSize(w, h) {
        this.read.setSize(w, h);
        this.write.setSize(w, h);
      },

      dispose() {
        this.read.dispose();
        this.write.dispose();
      },
    };
  }

  renderMaterial(material, target = null) {
    this.mesh.material = material;

    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
  }

  clearTarget(target) {
    this.renderer.setRenderTarget(target);
    this.renderer.clear();
  }

  resize(width, height) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.displayMaterial.uniforms.uTexelSize.value.set(1 / width, 1 / height);
    this.renderer.setSize(this.width, this.height, false);

    this.resolution.set(this.width, this.height);

    const aspect = this.width / this.height;

    this.simWidth = Math.max(32, Math.round(128 * Math.max(aspect, 1)));

    this.simHeight = Math.max(32, Math.round(128 / Math.max(aspect, 1)));

    const dyeWidth = Math.max(128, Math.round(512 * Math.max(aspect, 1)));

    const dyeHeight = Math.max(128, Math.round(512 / Math.max(aspect, 1)));

    this.velocity.setSize(this.simWidth, this.simHeight);

    this.pressure.setSize(this.simWidth, this.simHeight);

    this.divergence.setSize(this.simWidth, this.simHeight);

    this.dye.setSize(dyeWidth, dyeHeight);

    this.texelSize.set(1 / this.simWidth, 1 / this.simHeight);

    this.splatMaterial.uniforms.uAspect.value = aspect;

    [
      this.velocity.read,
      this.velocity.write,
      this.pressure.read,
      this.pressure.write,
      this.divergence,
      this.dye.read,
      this.dye.write,
    ].forEach((target) => this.clearTarget(target));

    this.renderer.setRenderTarget(null);

    this.pendingSplats.length = 0;
  }

  addPointer(x, y, dx, dy) {
    const forceX = THREE.MathUtils.clamp(dx * 1.5, -0.6, 0.6);
    const forceY = THREE.MathUtils.clamp(dy * 1.5, -0.6, 0.6);
    const speed = Math.hypot(dx, dy);

    const radiusPx = THREE.MathUtils.lerp(
      28.93,
      61.99,
      THREE.MathUtils.clamp(speed * 0.15, 0, 1),
    );

    const radius = radiusPx / this.height;
    const marginX = radiusPx / this.width;
    const marginY = radiusPx / this.height;

    const safeX = THREE.MathUtils.clamp(x, marginX * 2, 1 - marginX * 2);

    const safeY = THREE.MathUtils.clamp(y, marginY * 2, 1 - marginY * 2);

    this.pendingSplats.push({
      x: safeX,
      y: safeY,
      dx: forceX,
      dy: forceY,
      radius,
    });

    // Avoid an unbounded queue if pointer events
    // arrive faster than animation frames.
    if (this.pendingSplats.length > 24) {
      this.pendingSplats.splice(0, this.pendingSplats.length - 24);
    }
  }

  splat(target, point, value, radius) {
    const uniforms = this.splatMaterial.uniforms;

    uniforms.uTarget.value = target.read.texture;
    uniforms.uPoint.value.set(point.x, point.y);
    uniforms.uValue.value.set(value.x, value.y, value.z);
    uniforms.uRadius.value = radius;
    uniforms.uClampDye.value = target === this.dye ? 1 : 0;

    this.renderMaterial(this.splatMaterial, target.write);

    target.swap();
  }
  update(delta, elapsed) {
    if (this.disposed) return;

    const dt = Math.min(delta, 0.033);

    this.time = elapsed;

    for (const splat of this.pendingSplats) {
      const point = {
        x: splat.x,
        y: splat.y,
      };

      this.splat(
        this.velocity,
        point,
        { x: splat.dx, y: splat.dy, z: 0 },
        splat.radius * 1.3,
      );

      this.splat(
        this.dye,
        point,
        { x: 0.45, y: 0.45, z: 0.45 },
        splat.radius * 1.5,
      );
    }

    this.pendingSplats.length = 0;

    // 2. Calculate divergence.
    this.divergenceMaterial.uniforms.uVelocity.value =
      this.velocity.read.texture;

    this.renderMaterial(this.divergenceMaterial, this.divergence);

    // 3. Solve pressure.
    for (let i = 0; i < this.pressureIterations; i++) {
      this.pressureMaterial.uniforms.uPressure.value =
        this.pressure.read.texture;

      this.pressureMaterial.uniforms.uDivergence.value =
        this.divergence.texture;

      this.renderMaterial(this.pressureMaterial, this.pressure.write);

      this.pressure.swap();
    }

    // 4. Remove pressure gradient from velocity.
    this.gradientMaterial.uniforms.uPressure.value = this.pressure.read.texture;

    this.gradientMaterial.uniforms.uVelocity.value = this.velocity.read.texture;

    this.renderMaterial(this.gradientMaterial, this.velocity.write);

    this.velocity.swap();

    // 5. Advect velocity.
    this.advectionMaterial.uniforms.uVelocity.value =
      this.velocity.read.texture;

    this.advectionMaterial.uniforms.uSource.value = this.velocity.read.texture;

    this.advectionMaterial.uniforms.uDt.value = dt;

    this.advectionMaterial.uniforms.uDissipation.value = Math.pow(
      0.93,
      dt * 60,
    );

    this.advectionMaterial.uniforms.uDrift.value.set(0.08, 0.12);

    this.renderMaterial(this.advectionMaterial, this.velocity.write);

    this.velocity.swap();

    // 6. Advect dye through the updated velocity.
    this.advectionMaterial.uniforms.uVelocity.value =
      this.velocity.read.texture;

    this.advectionMaterial.uniforms.uSource.value = this.dye.read.texture;

    this.advectionMaterial.uniforms.uDissipation.value = Math.pow(
      0.991,
      dt * 60,
    );

    // Drift toward the upper right.
    this.advectionMaterial.uniforms.uDrift.value.set(0.035, 0.055);

    this.renderMaterial(this.advectionMaterial, this.dye.write);

    this.dye.swap();

    this.displayMaterial.uniforms.uDye.value = this.dye.read.texture;

    this.displayMaterial.uniforms.uTime.value = elapsed;

    this.renderMaterial(this.displayMaterial, null);
  }

  dispose() {
    this.disposed = true;

    this.velocity.dispose();
    this.pressure.dispose();
    this.divergence.dispose();
    this.dye.dispose();

    this.splatMaterial.dispose();
    this.divergenceMaterial.dispose();
    this.pressureMaterial.dispose();
    this.gradientMaterial.dispose();
    this.advectionMaterial.dispose();
    this.displayMaterial.dispose();

    this.geometry.dispose();

    this.placeholderTexture.dispose();
    this.loadedTexture?.dispose();

    this.renderer.dispose();
  }
}

function GooeyReveal({
  image = "/images/benchmockup.png",
  background = "#f5f5f5",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const simulation = new FluidSimulation(canvas, {
      image,
      background,
    });

    const pointer = {
      initialized: false,
      x: 0.5,
      y: 0.5,
      lastTime: 0,
      vx: 0,
      vy: 0,
    };

    let frameId = null;
    let visible = true;

    function resize() {
      const rect = parent.getBoundingClientRect();

      simulation.resize(Math.max(1, rect.width), Math.max(1, rect.height));

      pointer.initialized = false;
    }

    function onPointerMove(event) {
      const rect = parent.getBoundingClientRect();

      if (!rect.width || !rect.height) return;

      const x = (event.clientX - rect.left) / rect.width;

      const y = 1 - (event.clientY - rect.top) / rect.height;

      if (x < 0 || x > 1 || y < 0 || y > 1) {
        pointer.initialized = false;
        return;
      }

      const now = performance.now();

      if (!pointer.initialized) {
        pointer.initialized = true;
        pointer.x = x;
        pointer.y = y;
        pointer.lastTime = now;

        simulation.addPointer(x, y, 0, 0);
        return;
      }

      const elapsed = Math.max((now - pointer.lastTime) / 1000, 0.008);

      const rawDx = (x - pointer.x) / elapsed;
      const rawDy = (y - pointer.y) / elapsed;

      const smoothing = 1 - Math.exp(-elapsed * 24);

      pointer.vx += (rawDx - pointer.vx) * smoothing;
      pointer.vy += (rawDy - pointer.vy) * smoothing;

      const dx = pointer.vx;
      const dy = pointer.vy;

      simulation.addPointer(x, y, dx * 0.08, dy * 0.08);

      pointer.x = x;
      pointer.y = y;
      pointer.lastTime = now;
    }

    function onPointerLeave() {
      pointer.initialized = false;
    }

    parent.addEventListener("pointermove", onPointerMove);

    parent.addEventListener("pointerleave", onPointerLeave);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      {
        threshold: 0,
      },
    );

    visibilityObserver.observe(parent);

    resize();

    let lastTime = performance.now();
    let elapsed = 0;

    function animate(now) {
      frameId = requestAnimationFrame(animate);

      const delta = Math.min((now - lastTime) / 1000, 0.033);

      lastTime = now;

      if (!visible || document.hidden) return;

      elapsed += delta;

      simulation.update(delta, elapsed);
    }

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);

      parent.removeEventListener("pointermove", onPointerMove);

      parent.removeEventListener("pointerleave", onPointerLeave);

      resizeObserver.disconnect();
      visibilityObserver.disconnect();

      simulation.dispose();
    };
  }, [image, background]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex: 0 }}
    />
  );
}

const ITEMS = [
  "Patient Stories",
  "Beautiful Smiles",
  "Real Experiences",
  "Our Community",
  "Patient Stories",
  "Beautiful Smiles",
  "Real Experiences",
  "Our Community",
];

function TestimonialMarquee() {
  const id = useId().replace(/:/g, "");
  const staticPathId = `testimonial-static-${id}`;
  const animatedPathId = `testimonial-animated-${id}`;

  const size = 1000;
  const center = size / 2;
  const radius = 470;

  const circlePath = `
    M ${center},${center}
    m -${radius},0
    a ${radius},${radius} 0 1,1 ${radius * 2},0
    a ${radius},${radius} 0 1,1 -${radius * 2},0
  `;

  const repeatingText = Array.from({ length: 3 }, () => ITEMS).flat();

  return (
    <div className="testimonial-marquee relative aspect-square w-full">
      <div className="testimonial-marquee-text-mask absolute inset-0 z-0">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="testimonial-marquee-rotate absolute inset-0 z-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <path id={animatedPathId} d={circlePath} />
          </defs>

          <text
            fill="black"
            className="font-neuehaas45"
            style={{
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <textPath
              href={`#${animatedPathId}`}
              textLength={2 * Math.PI * radius}
              lengthAdjust="spacing"
            >
              {repeatingText.map((item, index) => (
                <tspan key={index}>
                  {item}
                  <tspan fill="rgba(0,0,0,0.25)">{" •••• "}</tspan>
                </tspan>
              ))}
            </textPath>
          </text>
        </svg>
      </div>

      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="testimonial-marquee-static relative z-20 w-full overflow-visible"
        aria-label="Testimonials"
        role="img"
      >
        <defs>
          <path id={staticPathId} d={circlePath} />
        </defs>

        <text
          fill="black"
          className="font-canelathin"
          style={{
            fontSize: 20,
          }}
        >
          <textPath
            href={`#${staticPathId}`}
            startOffset="50%"
            textAnchor="middle"
          >
            Testimonials
          </textPath>
        </text>
      </svg>
    </div>
  );
}
function GooeyFlowerSVG() {
  return (
    <div className="pointer-events-none absolute right-0 top-0 z-0 w-[58vw] max-w-[300px] md:hidden">
      <svg
        viewBox="0 0 300 500"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <filter
            id="flower-goo"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 24 -11
              "
            />
          </filter>

          {/* The organic silhouette becomes an image mask */}
          <mask
            id="flower-mask"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="300"
            height="500"
          >
            <g filter="url(#flower-goo)" fill="white">
              <ellipse cx="160" cy="110" rx="65" ry="90" />
              <ellipse cx="115" cy="185" rx="55" ry="90" />
              <ellipse cx="195" cy="240" rx="85" ry="95" />
              <ellipse cx="165" cy="330" rx="70" ry="90" />
              <ellipse cx="235" cy="385" rx="60" ry="65" />

              {/* Smaller connected shapes */}
              <circle cx="100" cy="70" r="25" />
              <ellipse cx="245" cy="155" rx="35" ry="55" />

              {/* Detached droplets */}
              <ellipse
                cx="65"
                cy="35"
                rx="13"
                ry="22"
                transform="rotate(-35 65 35)"
              />
              <ellipse
                cx="130"
                cy="25"
                rx="27"
                ry="12"
                transform="rotate(-20 130 25)"
              />
              <circle cx="75" cy="260" r="7" />
            </g>
          </mask>
        </defs>

        {/* Flower image appears only inside the gooey shape */}
        <image
          href="/images/flower.jpeg"
          x="0"
          y="0"
          width="300"
          height="500"
          preserveAspectRatio="xMidYMid slice"
          mask="url(#flower-mask)"
        />
      </svg>
    </div>
  );
}

const GRID_ROWS = [
  ["#009E83", "#FF6156", "#E8E1D7", "#FFBE53", "#F0EEE8", "#B8BAA7", "#85C9E8"],
  ["#EAE4DA", "#F5F3EF", "#F5F3EF", "#F5F3EF", "#F5F3EF", "#F5F3EF"],
  ["#4EA6E8", "#8C9FD7", "#FF3055", "#E5D8C8", "#FF922E", "#FFDB62", "#161616"],
  ["#F4F1EC", "#F4F1EC", "#F4F1EC", "#F4F1EC", "#009E83", "#F4F1EC"],
  ["#E8E4DB", "#D6B98F", "#AEBB9B", "#008DC0", "#50A8DC", "#EAE2D9","#FF9463","#FF5053"],
  ["#F2EFEB", "#F2EFEB", "#FF941C", "#F2EFEB", "#F2EFEB", "#F2EFEB"],
  ["#FF9945", "#ED74A2", "#E5E2DC", "#FFCD00", "#E5CE80", "#F1EAE0", "#FFE18A"],
  ["#F0EDE8", "#FF6A57", "#F0EDE8", "#FFDB19", "#FF9B42", "#F0EDE8"],
  ["#E5DED4", "#F4EFE9", "#A6B8A5", "#69B6E0", "#F0E8DB", "#FFAF73", "#FF5759"],
];

const OFFICE_COPY = [
  "A DIFFERENT KIND OF ORTHODONTIC EXPERIENCE",
  "ALLENTOWN / BETHLEHEM / SCHNECKSVILLE / LEHIGHTON",
  "GET IN THE KNOW",
];

function OfficeColorGrid() {
  const sectionRef = useRef(null);
  const cellsRef = useRef([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray(".office-color-grid__row", section);

      // Each row starts above its final position
      gsap.set(rows, {
        y: -180,
        autoAlpha: 0,
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          once: true,
        },
      });

      // Bottom row lands first, then the next row stacks above it
      [...rows].reverse().forEach((row) => {
        timeline.to(row, {
          y: 0,
          autoAlpha: 1,
          duration: 0.32,
          ease: "power3.in",
        });

        // Small impact / settling motion
        timeline.to(row, {
          y: -7,
          duration: 0.09,
          ease: "power2.out",
        });

        timeline.to(row, {
          y: 0,
          duration: 0.13,
          ease: "power2.in",
        });
      });

      // Typography appears after construction
      timeline.from(
        ".office-color-grid__overlay",
        {
          autoAlpha: 0,
          y: 15,
          duration: 0.35,
          ease: "power2.out",
        },
        "-=0.25",
      );
    }, section);

    return () => ctx.revert();
  }, []);

  let cellIndex = 0;

  return (
    <section
      ref={sectionRef}
      className="office-color-grid relative w-full overflow-hidden lg:hidden"
      aria-label="About the FreySmiles experience"
    >
      <div className="office-color-grid__rows">
        {GRID_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="office-color-grid__row">
            {row.map((color, blockIndex) => {
              const index = cellIndex++;

              return (
                <div
                  key={blockIndex}
                  ref={(el) => {
                    cellsRef.current[index] = el;
                  }}
                  className="office-color-grid__cell"
                  style={{
                    backgroundColor: [
                      "#F5F3EF",
                      "#F4F1EC",
                      "#F2EFEB",
                      "#F0EDE8",
                    ].includes(color.toUpperCase())
                      ? "transparent"
                      : color,
                    flex: blockIndex % 3 === 0 ? 1.3 : 1,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="office-color-grid__overlay">
        <span className="office-color-grid__eyebrow">
          FREYSMILES / EST. 2004
        </span>

        <h2 className="office-color-grid__heading uppercase">
          Intentional
          <br />
          smiles
        </h2>

        <div className="office-color-grid__details">
          {OFFICE_COPY.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
const TESTIMONIALS = [
  {
    number: "01",
    quote:
      "Dr. Frey treated both me (as an adult with a complex bite issue) and my son, and we couldn’t be happier with the results. He is knowledgeable, thoughtful, and truly cares about achieving the best outcome for his patients. The entire staff is friendly and supportive. I highly recommend him.",
    name: "Michele",
  },
  {
    number: "02",
    quote:
      "Dr Frey and his team are amazing! They explain everything all the way through the process at every visit. Their Growth and Guidance program caught 2 significant issues my youngest had and we were able to address them early. They also work with you on finances. Highly recommend!",
    name: "Mary Ost",
  },
  {
    number: "03",
    quote:
      "Excellent service. I always get called in early to my appointments, they are very organized and put together, and they are always quick. Did great with my teeth - they look amazing.",
    name: "Meadow Phillips",
  },
  {
    number: "04",
    quote:
      "Absolutely love the team at FreySmiles in Lehighton. From day one they have been amazing and so sweet to my teen thru her braces and Invisalign journey. Dr Frey is wonderful to chat with and I highly recommend especially if you’re the nervous type.",
    name: "Christina Seo",
  },
];

function TestimonialCard({
  testimonial,
  index,
  activeTestimonial,
  cardRef,
    flipMode = false,
}) {
  return (
   <div
  ref={cardRef}
className={`
  testimonial-glass--flip
  relative flex
  shrink-0
  flex-col items-center
  overflow-hidden
  p-6 text-[#201509]
  ${
    flipMode
      ? "h-full w-full"
      : "h-[440px] w-[82vw] snap-start lg:h-[560px] lg:w-auto lg:shrink lg:snap-none lg:items-stretch lg:justify-between lg:p-6"
  }
`}
>
      {/* MOBILE — EXISTING DESIGN */}
      <div className="flex h-full w-full flex-col items-center lg:hidden">
        <div className="testimonial-holo-casing">
          <div
            className={`testimonial-holo-layer ${
              activeTestimonial === index ? "is-active" : ""
            }`}
          >
            <span className="testimonial-holo-initials">
              {testimonial.name
                .trim()
                .split(/\s+/)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </div>
        </div>

        <div
          className="
            flex min-h-0 flex-1
            flex-col items-center justify-center
            text-center
          "
        >
          <span className="mb-3 font-ibmplex text-[10px] tracking-[0.18em]">
            {testimonial.number} / PATIENT EXPERIENCE
          </span>

          <p
            className="
              mb-4 max-w-[320px]
              font-ibmplex text-[12px]
              uppercase leading-[1.35]
            "
          >
            “{testimonial.quote}”
          </p>

          <span className="font-ibmplex text-[11px] uppercase tracking-wider">
            {testimonial.name}
          </span>
        </div>
      </div>

      {/* DESKTOP — ORIGINAL DESIGN */}
      <span
        className="
          relative z-10 hidden
          font-ibmplex text-[12px] tracking-widest
          lg:block
        "
      >
        {testimonial.number}
      </span>

      <div className="relative z-10 hidden lg:block">
        <p
          className="
            mb-2 max-w-[320px]
            font-ibmplex
            text-[clamp(13px,1.1vw,14px)]
            uppercase leading-[1.15]
          "
        >
          “{testimonial.quote}”
        </p>

        <span className="font-ibmplex text-[12px] uppercase tracking-wider">
          {testimonial.name}
        </span>
      </div>
    </div>
  );
}
const IMAGE =
  "/images/iphone-duo-mockup.jpg";


  
function MobileTestimonialFlip() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const cardRefs = useRef([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const mm = gsap.matchMedia();

    mm.add("(max-width: 1023px)", () => {
      const cards = cardRefs.current.filter(Boolean);
      const fronts = cards.map((card) =>
        card.querySelector(".mobile-flip__front")
      );
      const backs = cards.map((card) =>
        card.querySelector(".mobile-flip__back")
      );

      const gap = 16;
      const finalWidth = window.innerWidth * 0.82;
      const initialWidth = Math.min(window.innerWidth - 40, 360);
      const sliceWidth = initialWidth / cards.length;

      gsap.set(track, {
        width: initialWidth,
        gap: 0,
        x: 0,
      });

      gsap.set(cards, {
        width: sliceWidth,
        flexBasis: sliceWidth,
        rotationY: 0,
        borderRadius: 0,
      });

      gsap.set(fronts, { autoAlpha: 1 });
      gsap.set(backs, { autoAlpha: 1 });


const timeline = gsap.timeline({
scrollTrigger: {
  trigger: section,
  start: "top top",
  end: () => `+=${window.innerHeight * 2.2}`,

  pin: true,
  pinSpacing: true,
  pinReparent: true, // TEST THIS
  anticipatePin: 0,
  scrub: true,
  invalidateOnRefresh: true,
  refreshPriority: 10,

  onUpdate(self) {
    const ready = self.progress >= 0.95;

    track.style.overflowX = ready ? "auto" : "hidden";
    track.style.touchAction = ready ? "pan-x" : "pan-y";
  },
},
});


      // First, reveal that the image consists of four slices.
      timeline.to(track, {
        gap: 8,
        duration: 0.7,
        ease: "none",
      }, 0.15);

      timeline.to(cards, {
        borderRadius: 12,
        duration: 0.7,
        ease: "none",
      }, 0.15);

      // Expand the cards WHILE they flip.
      timeline.to(track, {
        width: window.innerWidth,
        duration: 1.3,
        ease: "none",
      }, 1);

      timeline.to(cards, {
        width: finalWidth,
        flexBasis: finalWidth,
        rotationY: 180,
        duration: 1.3,
        stagger: 0.08,
        ease: "none",
      }, 1);

      timeline.to(track, {
        gap,
        duration: 1.3,
        ease: "none",
      }, 1);

      // Settle the cards into the swipeable track.
      timeline.to(cards, {
        rotationY: 180,
        duration: 0.4,
        ease: "none",
      }, 2.4);

      return () => {
        track.style.overflowX = "";
        track.style.touchAction = "";
      };
    });

    return () => mm.revert();
  }, []);

  return (

<section
  ref={sectionRef}
  className="mobile-flip-section lg:hidden"
>
  <div className="mobile-flip__stage">
    <div ref={trackRef} className="mobile-flip__track">
      {TESTIMONIALS.map((testimonial, index) => (
        <div
          key={testimonial.number}
          ref={(el) => {
            cardRefs.current[index] = el;
          }}
          className="mobile-flip__card"
        >
          {/* FRONT — ONE SLICE OF THE PHOTOGRAPH */}
          <div className="mobile-flip__front">
            <div
              className="mobile-flip__image"
              style={{
                backgroundImage: `url(${IMAGE})`,
                backgroundPosition: `${
                  (index / (TESTIMONIALS.length - 1)) * 100
                }% center`,
              }}
            />
          </div>

          {/* BACK — OUR EXISTING TESTIMONIAL DESIGN */}
          <div className="mobile-flip__back">
            <TestimonialCard
              testimonial={testimonial}
              index={index}
              activeTestimonial={0}
              flipMode
            />
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

  );
}
const NewSection = () => {
  const containerRef = useRef(null);
  const awardsHeadingRef = useRef(null);
  const lineRefs = useRef([]);
  const textRefs = useRef([]);

  const addToLineRefs = (el) => el && lineRefs.current.push(el);
  const addToTextRefs = (el) => el && textRefs.current.push(el);

  const squareSlotRef = useRef(null);
  const shapeRef = useRef(null);

  const testimonialContentRef = useRef(null);
  const testimonialCardsRef = useRef([]);
  const testimonialsSectionRef = useRef(null);

  const [logoPhysicsActive, setLogoPhysicsActive] = useState(false);
  const [physicsGeometry, setPhysicsGeometry] = useState(null);
  const physicsWrapperRef = useRef(null);

  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const mobileCarouselRef = useRef(null);
  const [testimonialsVisible, setTestimonialsVisible] = useState(false);
  useEffect(() => {
    const section = testimonialsSectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setTestimonialsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);
  const handleTestimonialScroll = () => {
    const carousel = mobileCarouselRef.current;
    if (!carousel || window.innerWidth >= 1024) return;

    const cards = Array.from(carousel.children);

    const carouselLeft = carousel.getBoundingClientRect().left;

    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
      const distance = Math.abs(
        card.getBoundingClientRect().left - carouselLeft,
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveTestimonial((previous) =>
      previous === closestIndex ? previous : closestIndex,
    );
  };

  useLayoutEffect(() => {
    const heading = awardsHeadingRef.current;
    const starPath = shapeRef.current;
    const circleSlot = squareSlotRef.current;
    const revealLayer = testimonialContentRef.current;
    const isMobile = window.innerWidth <= 768;

    const mobileViewportHeight = isMobile
      ? document.documentElement.clientHeight
      : null;

    const getViewportHeight = () =>
      isMobile ? mobileViewportHeight : window.innerHeight;
    if (!heading || !starPath || !circleSlot || !revealLayer) return;

    const circleSVG = starPath.ownerSVGElement;
    if (!circleSVG) return;

    const circlePath =
      "M80.5 2.5 C123.6 2.5 158.5 37.4 158.5 80.5 C158.5 123.6 123.6 158.5 80.5 158.5 C37.4 158.5 2.5 123.6 2.5 80.5 C2.5 37.4 37.4 2.5 80.5 2.5 Z";

    const expansion = { progress: 0 };
    const circleMovement = {
      x: 0,
      rotation: 0,
    };

    const getGeometry = () => {
      const slotRect = circleSlot.getBoundingClientRect();
      const layerRect = revealLayer.getBoundingClientRect();

      const centerX = slotRect.left + slotRect.width / 2 - layerRect.left;

      const centerY = slotRect.top + slotRect.height / 2 - layerRect.top;

      const initialRadius = (slotRect.width * 78) / 161;

      const viewportWidth = window.innerWidth;
      const viewportHeight = getViewportHeight();
      const isMobile = window.innerWidth <= 768;

      const finalRadius = isMobile
        ? Math.min(viewportWidth * 0.6, viewportHeight * 0.49)
        : viewportHeight * 0.52;

      return {
        centerX,
        centerY,
        initialRadius,
        finalRadius,
      };
    };

    let cachedGeometry = getGeometry();
    const updatePhysicsGeometry = () => {
    const { centerX, centerY, finalRadius } = cachedGeometry;

      const next = {
        centerX,
        centerY,
        radius: finalRadius,
        viewportHeight: getViewportHeight(),
      };

      setPhysicsGeometry((previous) => {
        if (
          previous &&
          previous.centerX === next.centerX &&
          previous.centerY === next.centerY &&
          previous.radius === next.radius &&
          previous.viewportHeight === next.viewportHeight
        ) {
          return previous;
        }

        return next;
      });
    };

    const renderExpansion = () => {
    const { centerX, centerY, initialRadius, finalRadius } = cachedGeometry;

      const progress = expansion.progress;

      const radius = initialRadius + (finalRadius - initialRadius) * progress;

      const svgOpacity = 1 - gsap.utils.clamp(0, 1, progress / 0.12);

      gsap.set(circleSVG, {
        scale: radius / initialRadius,
        transformOrigin: "50% 50%",
        opacity: svgOpacity,
      });

      gsap.set(revealLayer, {
        clipPath: `circle(${
          progress <= 0 ? 0 : radius
        }px at ${centerX + circleMovement.x}px ${centerY}px)`,
      });
    if (isMobile && physicsWrapperRef.current) {
        gsap.set(physicsWrapperRef.current, {
          x: circleMovement.x,
          rotation: circleMovement.rotation,
          transformOrigin: `${centerX}px ${centerY}px`,
        });
      }
    };

    const ctx = gsap.context(() => {
      let physicsStarted = false;

      const timeline = gsap.timeline({
        defaults: { ease: "none" },

        onUpdate: () => {
          renderExpansion();
const shouldRun = isMobile
  ? expansion.progress >= 0.85
  : expansion.progress > 0.05;
          if (shouldRun !== physicsStarted) {
            physicsStarted = shouldRun;

            if (shouldRun) {
              updatePhysicsGeometry();
            }

            setLogoPhysicsActive(shouldRun);
          }
        },

        scrollTrigger: {
          trigger: heading,

          start: () => (isMobile ? "top bottom" : "top 85%"),

          end: () => (isMobile ? `+=${getViewportHeight() * 0.8}` : "top 50%"),

          scrub: true,
          invalidateOnRefresh: true,
          onLeaveBack: () => {
            physicsStarted = false;
            setLogoPhysicsActive(false);
          },
          onRefresh: () => {
  cachedGeometry = getGeometry();
},
        },
      });

      // 1. STAR TO CIRCLE
      timeline.to(
        starPath,
        {
          morphSVG: {
            shape: circlePath,
            type: "rotational",
          },
          duration: 0.35,
        },
        0,
      );

      // 2. ROTATE
      timeline.fromTo(
        circleSVG,
        { rotation: 0 },
        {
          rotation: 180,
          transformOrigin: "50% 50%",
          duration: 0.35,
        },
        0,
      );

      // 3. EXPAND TO VIEWPORT-SIZED CIRCLE

      timeline.to(
        expansion,
        {
          progress: 1,
          duration: isMobile ? 0.35 : 0.45,
        },
        isMobile ? 0.15 : 0.2,
      );
      if (isMobile) {
        timeline.to(
          circleMovement,
          {
            x: () => {
              const slotRect = circleSlot.getBoundingClientRect();
              const starCenterX = slotRect.left + slotRect.width / 2;

              return window.innerWidth / 2 - starCenterX;
            },

            rotation: () => {
              const slotRect = circleSlot.getBoundingClientRect();
              const starCenterX = slotRect.left + slotRect.width / 2;

              const distance = window.innerWidth / 2 - starCenterX;

              const { finalRadius } = getGeometry();

              // Rolling angle = distance / radius, converted to degrees.
              return (distance / finalRadius) * (180 / Math.PI);
            },

            duration: 0.45,
            ease: "none",
          },
          0.55,
        );
      }
      if (isMobile) {
        timeline.set({}, {}, 1);
      }

      updatePhysicsGeometry();
      renderExpansion();
    }, heading);

const handleResize = () => {
  if (isMobile) return;

  cachedGeometry = getGeometry();
  ScrollTrigger.refresh();
  updatePhysicsGeometry();
  renderExpansion();
};

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const lines = lineRefs.current;
      const texts = textRefs.current;
      gsap.set(lines, {
        scaleX: 0,
        transformOrigin: "center center",
      });

      gsap.set(texts, {
        opacity: 0,
        y: 40,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top 75%",
          toggleActions: "play none none none",
        },
      });
      tl.to(lines, {
        scaleX: 1,
        duration: 1.9,
        ease: "power3.inOut",
        stagger: {
          amount: 0.65,
        },
      });

      // TEXT REVEAL
      tl.to(
        texts,
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power3.out",
          stagger: 0.06,
        },
        "-=1.4",
      );
    }, container);

    return () => ctx.revert();
  }, []);

  useLayoutEffect(() => {
    const section = testimonialsSectionRef.current;
    const cards = testimonialCardsRef.current.filter(Boolean);

    if (!section || !cards.length) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const startingHeights = [140, 95, 70, 45];

      const ctx = gsap.context(() => {
        gsap.fromTo(
          cards,
          {
            clipPath: (index, target) => {
              const fullHeight = target.offsetHeight;
              const visibleHeight = startingHeights[index] ?? 45;

              const hiddenHeight = Math.max(0, fullHeight - visibleHeight);

              return `inset(${hiddenHeight}px 0px 0px 0px)`;
            },
          },
          {
            clipPath: "inset(0px 0px 0px 0px)",
            duration: 1,
            stagger: 0.12,
            ease: "none",
            immediateRender: false,

            scrollTrigger: {
              trigger: section,
              start: "top 75%",
              end: "top 20%",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      }, section);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);
  const awards = [
    ["2026", "6× Winner Best Orthodontist", "Best of the Valley"],
    ["2026", "5× Winner Best Orthodontist", "Readers' Choice The Morning Call"],
    [
      "2026",
      "10× Cover Feature",
      "American Journal of Orthodontics & Dentofacial Orthopedics",
    ],
    ["2026", "Nationally Recognized Top Orthodontist", "Top Dentists"],
    ["2026", "Invisalign", "25+ Years of Experience"],
    ["2026", "Invisalign Teen", "5000+ Cases Treated"],
    ["2026", "Diamond Plus", "Top 1% of All Providers"],
  ];

  const mobileAwardGroups = [
    { year: "2026", awards: awards.slice(0, 2) },
    { year: "2025", awards: awards.slice(2, 3) },
    { year: "2024", awards: awards.slice(3, 4) },
    { year: "2023", awards: awards.slice(4, 6) },
    { year: "2022", awards: awards.slice(6, 7) },
  ];
  return (
    <>
      <div className="relative w-full isolate bg-[#f5f5f5]">
        <section className="relative isolate flex min-h-screen flex-col items-center px-8 pt-0 pb-20 md:px-16">
         <div className="hidden md:block">
  <GooeyReveal image="/images/flower.jpeg" background="#f5f5f5" />
</div>
          <div
            ref={containerRef}
            className="relative mx-auto w-full max-w-7xl text-[11px]"
          >
            {/* MOBILE — grouped awards */}
            <div className="relative z-10 mx-auto w-[94%] font-neueroman md:hidden">
              {mobileAwardGroups.map((group) => (
                <div
                  key={group.year}
                  className="grid grid-cols-[42px_minmax(0,1fr)] gap-x-5"
                >
                  {/* Year */}
                  <div className="pt-3 pb-2 text-[17px] font-[800] leading-none">
                    '{group.year.slice(-2)}
                  </div>

                  {/* Awards */}
                  <div className="min-w-0">
                    {group.awards.map(([, achievement, distinction], i) => (
                      <div
                        key={`${group.year}-${i}`}
                        className="grid grid-cols-2 items-start gap-x-4 border-b border-[#DEDEDE] py-3"
                      >
                        <div className="min-w-0 text-[12px] font-[800] leading-[1.25]">
                          {achievement}
                        </div>

                        <div className="min-w-0 text-[12px] font-[800] leading-[1.25]">
                          {distinction}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP  */}
            <div className="relative z-10 mx-auto hidden w-[85%] flex-col font-neueroman text-[1.15em] font-[800] tracking-wide md:flex">
              <div className="relative">
                {awards.map(([date, achievement, distinction], i) => (
                  <div
                    key={i}
                    className="relative grid grid-cols-[1fr_1.5fr_1.5fr] items-center gap-x-6 px-3 py-1"
                  >
                    <div
                      ref={addToLineRefs}
                      className="absolute inset-x-0 bottom-0 h-[.5px] origin-center bg-[#DEDEDE]"
                      style={{ transform: "scaleX(0)" }}
                    />

                    <div className="min-w-0 overflow-hidden">
                      <div ref={addToTextRefs}>{date}</div>
                    </div>

                    <div className="min-w-0 overflow-hidden">
                      <div ref={addToTextRefs}>{achievement}</div>
                    </div>

                    <div className="min-w-0 overflow-hidden">
                      <div ref={addToTextRefs}>{distinction}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            ref={awardsHeadingRef}
            className="relative mt-20 w-full -translate-x-3 pb-12 md:mt-32 md:translate-x-0 md:pb-20"
          >
            <h2 className="flex flex-col font-neueroman text-[clamp(3.825rem,10.2vw,11.05rem)] font-[800] leading-[0.78] tracking-[-0.015em] text-black">
              {/* AWARDS + STAR */}
              <span className="flex items-center gap-[0.12em] pl-[23%]">
                <span>Awards</span>

                <span
                  ref={squareSlotRef}
                  className="relative inline-block h-[0.65em] w-[0.65em] shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 161 161"
                    className="pointer-events-none block h-full w-full overflow-visible text-black"
                    aria-hidden="true"
                  >
                    <path
                      ref={shapeRef}
                      fill="currentColor"
                      d="M108 88.7c-10.8 0-19.7 8.8-19.7 19.7v47.4c0 1.9-1.5 3.4-3.4 3.4h-8.6c-1.9 0-3.4-1.5-3.4-3.4v-47.4c0-10.8-8.8-19.7-19.7-19.7H6.4c-1.9 0-3.4-1.5-3.4-3.4v-8c0-1.9 1.5-3.4 3.4-3.4h46.9c10.8 0 19.7-8.8 19.7-19.7V6.4c0-1.9 1.5-3.4 3.4-3.4H85c1.9 0 3.4 1.5 3.4 3.4v47.8c0 10.8 8.8 19.7 19.7 19.7h46.6c1.9 0 3.4 1.5 3.4 3.4v8c0 1.9-1.5 3.4-3.4 3.4H108z"
                    />
                  </svg>
                </span>
              </span>

              <span className="block pl-[3%]">&amp; Recog-</span>

              <span className="block pl-[43%]">nitions</span>
            </h2>
          </div>
        </section>
        {/* CIRCLE EXPANSION + TESTIMONIALS */}

     <div
  ref={testimonialContentRef}
  className="pointer-events-none absolute z-40 overflow-visible bg-black"
  style={{
    top: "-50vh",
    bottom: "-50vh",
    left: "-50vw",
    right: "-50vw",
    clipPath: "circle(0px at 0px 0px)",
    willChange: "clip-path",
  }}
>
          <div
            ref={physicsWrapperRef}
            className="pointer-events-auto absolute inset-0 z-10"
          >
            <LogoGrid
              active={logoPhysicsActive}
              circleGeometry={physicsGeometry}
            />
          </div>
        </div>
        <OfficeColorGrid />
        {/* <MobileTestimonialFlip /> */}

<section
  ref={testimonialsSectionRef}
  className="relative z-10 min-h-screen w-full bg-transparent px-4 pt-[15vh] lg:px-16"
>
  <div className="relative isolate z-20 mt-24 w-full">

    {/* DESKTOP — SPECTRUM BACKGROUND */}
    <div className="testimonial-background-mask pointer-events-none absolute inset-0 z-0 hidden lg:block">
      <TestimonialSpectrum />
    </div>

    {/* DESKTOP — CIRCULAR MARQUEE */}
    <div className="pointer-events-none absolute inset-0 z-10 hidden items-center justify-center overflow-visible lg:flex">
      <div className="w-[85vw] max-w-[1200px] shrink-0 translate-y-[80px]">
        <TestimonialMarquee />
      </div>
    </div>


  </div>
</section>


        {/* <div className="grid w-full grid-cols-1 gap-8 max-w-7xl md:grid-cols-2">

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
           


        </div> */}
      </div>
    </>
  );
};

const LOGO_SOURCES = [
  "/images/movingbannerfiles/diamondplus.svg",
  "/images/movingbannerfiles/readers.png",
  "/images/movingbannerfiles/damonsystem.svg",
  "/images/movingbannerfiles/topDentist_logo.png",
  "/images/movingbannerfiles/invisalign_invert.png",
  "/images/movingbannerfiles/ajodo.svg",
  "/images/movingbannerfiles/ABO_invert.png",
  "/images/movingbannerfiles/ABO_invert.png",
  "/images/movingbannerfiles/valley.png",
  "/images/movingbannerfiles/top-Dentist.png",
  "/images/movingbannerfiles/aao_invert.png",
];

const LogoGrid = ({ active = false, circleGeometry }) => {
  const containerRef = useRef(null);
  const runnerRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
const rendererRunningRef = useRef(false);
  const activeRef = useRef(active);
  const runnerRunningRef = useRef(false);
  activeRef.current = active;
  const [viewportSize, setViewportSize] = useState({
    width: 0,
    height: 0,
  });
  useEffect(() => {
    const updateSize = () => {
      setViewportSize((prev) => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (width <= 768 && prev.width === width) {
          return prev;
        }

        if (prev.width === width && prev.height === height) {
          return prev;
        }

        return { width, height };
      });
    };

    updateSize();

    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !circleGeometry) return;

    const {
      Engine,
      Render,
      Runner,
      Bodies,
      Composite,
      Events,
      Mouse,
      MouseConstraint,
    } = Matter;

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) return;
    const { centerX, centerY, radius: circleRadius } = circleGeometry;

    const viewportHeight = circleGeometry.viewportHeight ?? window.innerHeight;

    const isMobile = window.innerWidth <= 768;

    const ballRadius = isMobile ? Math.min(62, circleRadius * 0.2) : 80;

    const ballDiameter = ballRadius * 2;

    const engine = Engine.create();

    engine.gravity.x = 0;
    engine.gravity.y = 1;
    engine.gravity.scale = 0.00065;

    const runner = Runner.create();

    engineRef.current = engine;
    runnerRef.current = runner;
    runnerRunningRef.current = false;

    const render = Render.create({
      element: container,
      engine,
      options: {
        width,
        height,
       pixelRatio: isMobile
  ? 1.5
  : Math.min(window.devicePixelRatio || 1, 2),
        background: "transparent",
        wireframes: false,
      },
    });
    renderRef.current = render;

    const segments = isMobile ? 160 : 240;
    const wallThickness = isMobile ? 35 : 70;
    const wallRadius = circleRadius + wallThickness / 2;
    const walls = [];

    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;

      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      const x1 = centerX + Math.cos(angle1) * wallRadius;
      const y1 = centerY + Math.sin(angle1) * wallRadius;

      const x2 = centerX + Math.cos(angle2) * wallRadius;
      const y2 = centerY + Math.sin(angle2) * wallRadius;

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      const length = Math.hypot(x2 - x1, y2 - y1) + 4;

      const angle = Math.atan2(y2 - y1, x2 - x1);

      walls.push(
        Bodies.rectangle(midX, midY, length, wallThickness, {
          isStatic: true,
          angle,
          friction: 0.6,
          restitution: 0.08,
          render: {
            visible: false,
          },
        }),
      );
    }

    Composite.add(engine.world, walls);

    const entryAngle = -Math.PI / 6;
    const entryRadius = circleRadius - ballRadius - 6;

    const entryX = centerX + Math.cos(entryAngle) * entryRadius;
    const entryY = centerY + Math.sin(entryAngle) * entryRadius;

    const balls = LOGO_SOURCES.map((_, index) => {
      const count = LOGO_SOURCES.length;

      // Spread balls along the upper-right circumference.
      const t = index / Math.max(1, count - 1);

      const angle = -1.35 + t * 1.1;

      const placementRadius = circleRadius - ballRadius - 8;

      const x = centerX + Math.cos(angle) * placementRadius;
      const y = centerY + Math.sin(angle) * placementRadius;

      return Bodies.circle(x, y, ballRadius, {
        restitution: isMobile ? 0.3 : 0.04,
        friction: isMobile ? 0.15 : 0.4,
        frictionStatic: isMobile ? 0.2 : 0.6,
        frictionAir: 0.025,
        density: 0.001,
        render: {
          fillStyle: "#1e90ff",
          strokeStyle: "#1e90ff",
          lineWidth: 0,
        },
      });
    });

    Composite.add(engine.world, balls);

    const images = LOGO_SOURCES.map((src, index) => {
      const image = new Image();

      image.onload = () => {
        console.log(`Logo ${index} loaded:`, src);
      };

      image.onerror = () => {
        console.error(`Logo ${index} failed to load:`, src);
      };

      image.src = src;

      return image;
    });

    const drawLogos = () => {
      const ctx = render.context;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      balls.forEach((ball, index) => {
        const image = images[index];

        if (!image.complete || !image.naturalWidth || !image.naturalHeight) {
          return;
        }

        const aspect = image.naturalWidth / image.naturalHeight;

        const maxSize = ballRadius * (isMobile ? 1.85 : 1.6);

        const imageWidth = aspect >= 1 ? maxSize : maxSize * aspect;

        const imageHeight = aspect >= 1 ? maxSize / aspect : maxSize;

        ctx.save();

        ctx.translate(ball.position.x, ball.position.y);

        ctx.rotate(ball.angle);

        ctx.drawImage(
          image,
          -imageWidth / 2,
          -imageHeight / 2,
          imageWidth,
          imageHeight,
        );

        ctx.restore();
      });
    };

    Events.on(render, "afterRender", drawLogos);

    const mouse = Mouse.create(render.canvas);

    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.05,
        render: {
          visible: false,
        },
      },
    });

    if (!isMobile) {
      Composite.add(engine.world, mouseConstraint);
    }

    render.mouse = mouse;

    const cursor = {
      x: 0,
      y: 0,
      inside: false,
    };

    const touchVelocity = {
      x: 0,
      y: 0,
    };

    const handleMouseMove = (event) => {
      const rect = render.canvas.getBoundingClientRect();

      if (!rect.width || !rect.height) {
        cursor.inside = false;
        return;
      }

      const x = (event.clientX - rect.left) * (width / rect.width);

      const y = (event.clientY - rect.top) * (height / rect.height);

      if (event.pointerType === "touch" && cursor.inside) {
        touchVelocity.x = x - cursor.x;
        touchVelocity.y = y - cursor.y;
      }

      cursor.x = x;
      cursor.y = y;

      cursor.inside = x >= 0 && x <= width && y >= 0 && y <= height;
    };

    const handleMouseLeave = () => {
      cursor.inside = false;
    };
    const handleTouchEnd = () => {
      touchVelocity.x = 0;
      touchVelocity.y = 0;
      cursor.inside = false;
    };

    window.addEventListener("pointermove", handleMouseMove, { passive: true });

    window.addEventListener("blur", handleMouseLeave);
    window.addEventListener("pointerup", handleTouchEnd);
    window.addEventListener("pointercancel", handleTouchEnd);

    const repelNearbyBalls = () => {
      if (!cursor.inside || !activeRef.current) return;

      // Preserve the existing desktop behavior.
      if (!isMobile) {
        const hoveredBall = balls.find((ball) => {
          if (mouseConstraint.body === ball) return false;

          const dx = cursor.x - ball.position.x;
          const dy = cursor.y - ball.position.y;

          return Math.hypot(dx, dy) < ball.circleRadius;
        });

        if (!hoveredBall) return;

        const dx = hoveredBall.position.x - cursor.x;
        const dy = hoveredBall.position.y - cursor.y;
        const distance = Math.hypot(dx, dy);

        const directionX = distance > 0.001 ? dx / distance : 1;
        const directionY = distance > 0.001 ? dy / distance : 0;

        const nextVX = hoveredBall.velocity.x + directionX * 2.8;
        const nextVY = hoveredBall.velocity.y + directionY * 2.8;

        const speed = Math.hypot(nextVX, nextVY);
        const scale = speed > 14 ? 14 / speed : 1;

        Matter.Body.setVelocity(hoveredBall, {
          x: nextVX * scale,
          y: nextVY * scale,
        });

        return;
      }

      // Mobile: spread the impulse across nearby balls.
      const influenceRadius = ballRadius * 3.5;

      const swipeX = touchVelocity.x;
      const swipeY = touchVelocity.y;
      const swipeSpeed = Math.hypot(swipeX, swipeY);

      // Only apply a mobile impulse when a touch is actually moving.
      if (swipeSpeed < 0.5) return;

      balls.forEach((ball) => {
        const dx = ball.position.x - cursor.x;
        const dy = ball.position.y - cursor.y;

        const distance = Math.hypot(dx, dy);

        if (distance > influenceRadius) return;

        const falloff = Math.pow(1 - distance / influenceRadius, 0.65);

        const impulseStrength = 1.8 * falloff;

        const nextVX = ball.velocity.x + swipeX * impulseStrength;

        const nextVY = ball.velocity.y + swipeY * impulseStrength;

        const speed = Math.hypot(nextVX, nextVY);
        const maxSpeed = 34;

        const scale = speed > maxSpeed ? maxSpeed / speed : 1;

        Matter.Body.setVelocity(ball, {
          x: nextVX * scale,
          y: nextVY * scale,
        });
      });

      touchVelocity.x = 0;
      touchVelocity.y = 0;
    };

    Events.on(engine, "beforeUpdate", repelNearbyBalls);

    mouse.element.removeEventListener("mousewheel", mouse.mousewheel);

    mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);

if (!isMobile || activeRef.current) {
  Render.run(render);
  rendererRunningRef.current = true;
}

if (activeRef.current) {
  Runner.run(runner, engine);
  runnerRunningRef.current = true;
}

    return () => {
      Events.off(engine, "beforeUpdate", repelNearbyBalls);

      window.removeEventListener("pointermove", handleMouseMove);

      window.removeEventListener("blur", handleMouseLeave);
      window.removeEventListener("pointerup", handleTouchEnd);
      window.removeEventListener("pointercancel", handleTouchEnd);

      Mouse.clearSourceEvents(mouse);

      Runner.stop(runner);
      runnerRunningRef.current = false;

   Render.stop(render);
rendererRunningRef.current = false;

if (renderRef.current === render) {
  renderRef.current = null;
}

if (runnerRef.current === runner) {
  runnerRef.current = null;
  engineRef.current = null;
}

      Composite.clear(engine.world, false);
      Engine.clear(engine);

      render.canvas?.remove();

      render.textures = {};
    };
  }, [circleGeometry, viewportSize.width, viewportSize.height]);
useEffect(() => {
  const runner = runnerRef.current;
  const engine = engineRef.current;
  const render = renderRef.current;

  if (!runner || !engine || !render) return;

  const isMobile = window.innerWidth <= 768;

  if (active) {
    if (!rendererRunningRef.current) {
      Matter.Render.run(render);
      rendererRunningRef.current = true;
    }

    if (!runnerRunningRef.current) {
      Matter.Runner.run(runner, engine);
      runnerRunningRef.current = true;
    }
  } else {
    if (runnerRunningRef.current) {
      Matter.Runner.stop(runner);
      runnerRunningRef.current = false;
    }

    if (isMobile && rendererRunningRef.current) {
      Matter.Render.stop(render);
      rendererRunningRef.current = false;
    }
  }
}, [active]);
  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{
        opacity: active ? 1 : 0,
      }}
      aria-label="Interactive orthodontic award logos"
    />
  );
};
const DynamicBackground = ({ logoPath = "/images/fspetallogo.png" }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const programRef = useRef(null);
  const glRef = useRef(null);
  const geometryRef = useRef(null);
  const particleGridRef = useRef([]);
  const posArrayRef = useRef(null);
  const colorArrayRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const execCountRef = useRef(0);
  const isCleanedUpRef = useRef(false);
  const isMobileRef = useRef(false);
  const CONFIG = {
    logoSize: 800,
    logoColor: "#000000",
    distortionRadius: 144,
    forceStrength: 2.4,
    maxDisplacement: 56,
    returnForce: 0.045,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const checkMobile = () => window.innerWidth < 1000;
    isMobileRef.current = checkMobile();

    if (isMobileRef.current) {
      return;
    }

    isCleanedUpRef.current = false;
    const container = canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const rect = container.getBoundingClientRect();

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    canvas.style.width = "100%";
    canvas.style.height = "100%";

    const gl = canvas.getContext("webgl", {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: true,
      powerPreference: "high-performance",
      premultipliedAlpha: false,
    });

    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    glRef.current = gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
          }
        : { r: 1, g: 1, b: 1 };
    }

    const vertexShaderSource = `
      precision highp float;
      uniform vec2 u_resolution;
      attribute vec2 a_position;
      attribute vec4 a_color;
      varying vec4 v_color;
      void main() {
         vec2 zeroToOne = a_position / u_resolution;
         vec2 clipSpace = (zeroToOne * 2.0 - 1.0);
         v_color = a_color;
         gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
         gl_PointSize = 3.5;
     }
    `;

    const fragmentShaderSource = `
      precision highp float;
      varying vec4 v_color;
      void main() {
          if (v_color.a < 0.01) discard;
          
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          float alpha = 1.0 - smoothstep(0.46, 0.5, dist);
          
          gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
      }
    `;

    function createShader(gl, type, source) {
      if (!gl || isCleanedUpRef.current) return null;

      const shader = gl.createShader(type);
      if (!shader) return null;

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Error compiling shader:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    }

    function createProgram(gl, vertexShader, fragmentShader) {
      if (!gl || !vertexShader || !fragmentShader || isCleanedUpRef.current)
        return null;

      const program = gl.createProgram();
      if (!program) return null;

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Error linking program:", gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }

      return program;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );

    if (!vertexShader || !fragmentShader) return;

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    programRef.current = program;

    const positionAttributeLocation = gl.getAttribLocation(
      program,
      "a_position",
    );
    const colorAttributeLocation = gl.getAttribLocation(program, "a_color");
    const resolutionUniformLocation = gl.getUniformLocation(
      program,
      "u_resolution",
    );

    const loadLogo = () => {
      const image = new Image();
      image.crossOrigin = "anonymous";

      image.onload = () => {
        if (isCleanedUpRef.current) return;

        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        tempCanvas.width = CONFIG.logoSize;
        tempCanvas.height = CONFIG.logoSize;

        tempCtx.clearRect(0, 0, CONFIG.logoSize, CONFIG.logoSize);

        const scale = 0.9;
        const scaledSize = CONFIG.logoSize * scale;
        const offset = (CONFIG.logoSize - scaledSize) / 2;

        tempCtx.drawImage(image, offset, offset, scaledSize, scaledSize);
        const imageData = tempCtx.getImageData(
          0,
          0,
          CONFIG.logoSize,
          CONFIG.logoSize,
        );

        initParticleSystem(imageData.data, CONFIG.logoSize);
      };

      image.onerror = () => {
        console.error("Failed to load logo image:", logoPath);
      };

      image.src = logoPath;
    };

    function initParticleSystem(pixels, dim) {
      if (isCleanedUpRef.current) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      particleGridRef.current = [];
      const validParticles = [];
      const validPositions = [];
      const validColors = [];

      const logoTint = hexToRgb(CONFIG.logoColor);

      for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
          const pixelIndex = (i * dim + j) * 4;
          const alpha = pixels[pixelIndex + 3];

          if (alpha > 10) {
            const x = centerX + (j - dim / 2) * 1.0;
            const y = centerY + (i - dim / 2) * 1.0;

            validPositions.push(x, y);

            const originalR = pixels[pixelIndex] / 255;
            const originalG = pixels[pixelIndex + 1] / 255;
            const originalB = pixels[pixelIndex + 2] / 255;
            const originalA = pixels[pixelIndex + 3] / 255;

            validColors.push(logoTint.r, logoTint.g, logoTint.b, 1);

            validParticles.push({
              ox: x,
              oy: y,
              vx: 0,
              vy: 0,
            });
          }
        }
      }

      particleGridRef.current = validParticles;
      posArrayRef.current = new Float32Array(validPositions);
      colorArrayRef.current = new Float32Array(validColors);

      const positionBuffer = gl.createBuffer();
      const colorBuffer = gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, posArrayRef.current, gl.DYNAMIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, colorArrayRef.current, gl.STATIC_DRAW);

      geometryRef.current = {
        positionBuffer,
        colorBuffer,
        vertexCount: validParticles.length,
      };

      console.log(`Created ${validParticles.length} particles`);
      startAnimation();
    }

    function startAnimation() {
      function animate() {
        if (
          isCleanedUpRef.current ||
          !gl ||
          !programRef.current ||
          !geometryRef.current
        ) {
          return;
        }

        if (execCountRef.current > 0) {
          execCountRef.current -= 1;

          const mx = mouseRef.current.x;
          const my = mouseRef.current.y;

          for (let i = 0, len = particleGridRef.current.length; i < len; i++) {
            const x = posArrayRef.current[i * 2];
            const y = posArrayRef.current[i * 2 + 1];
            const d = particleGridRef.current[i];

            const dx = x - mx;
            const dy = y - my;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const radius =
              CONFIG.distortionRadius *
              Math.min(window.devicePixelRatio || 1, 2);

            if (distance > 0.001 && distance < radius) {
              const influence = 1 - distance / radius;
              const force = influence * CONFIG.forceStrength;

              d.vx += (dx / distance) * force;
              d.vy += (dy / distance) * force;
            }

            const newX = x + (d.vx *= 0.82) + (d.ox - x) * CONFIG.returnForce;
            const newY = y + (d.vy *= 0.82) + (d.oy - y) * CONFIG.returnForce;

            const dx_origin = newX - d.ox;
            const dy_origin = newY - d.oy;
            const distFromOrigin = Math.sqrt(
              dx_origin * dx_origin + dy_origin * dy_origin,
            );

            if (distFromOrigin > CONFIG.maxDisplacement) {
              const excess = distFromOrigin - CONFIG.maxDisplacement;
              const scale = CONFIG.maxDisplacement / distFromOrigin;
              const dampedScale =
                scale + (1 - scale) * Math.exp(-excess * 0.02);

              posArrayRef.current[i * 2] = d.ox + dx_origin * dampedScale;
              posArrayRef.current[i * 2 + 1] = d.oy + dy_origin * dampedScale;

              d.vx *= 0.7;
              d.vy *= 0.7;
            } else {
              posArrayRef.current[i * 2] = newX;
              posArrayRef.current[i * 2 + 1] = newY;
            }
          }

          gl.bindBuffer(gl.ARRAY_BUFFER, geometryRef.current.positionBuffer);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, posArrayRef.current);
        }

        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(programRef.current);

        gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

        gl.bindBuffer(gl.ARRAY_BUFFER, geometryRef.current.positionBuffer);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(
          positionAttributeLocation,
          2,
          gl.FLOAT,
          false,
          0,
          0,
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, geometryRef.current.colorBuffer);
        gl.enableVertexAttribArray(colorAttributeLocation);
        gl.vertexAttribPointer(
          colorAttributeLocation,
          4,
          gl.FLOAT,
          false,
          0,
          0,
        );

        gl.drawArrays(gl.POINTS, 0, geometryRef.current.vertexCount);

        animationFrameRef.current = requestAnimationFrame(animate);
      }

      animate();
    }

    const handleMouseMove = (event) => {
      if (isCleanedUpRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      mouseRef.current.x = (event.clientX - rect.left) * dpr;
      mouseRef.current.y = (event.clientY - rect.top) * dpr;
      execCountRef.current = 300;
    };

    const handleResize = () => {
      if (isCleanedUpRef.current) return;

      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      canvas.style.width = "100%";
      canvas.style.height = "100%";
    };

    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    loadLogo();

    return () => {
      isCleanedUpRef.current = true;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      if (gl && !gl.isContextLost()) {
        try {
          if (geometryRef.current) {
            if (geometryRef.current.positionBuffer) {
              gl.deleteBuffer(geometryRef.current.positionBuffer);
            }
            if (geometryRef.current.colorBuffer) {
              gl.deleteBuffer(geometryRef.current.colorBuffer);
            }
            geometryRef.current = null;
          }

          if (programRef.current) {
            const shaders = gl.getAttachedShaders(programRef.current);
            if (shaders) {
              shaders.forEach((shader) => {
                gl.detachShader(programRef.current, shader);
                gl.deleteShader(shader);
              });
            }
            gl.deleteProgram(programRef.current);
            programRef.current = null;
          }
        } catch (error) {
          console.warn("Error during WebGL cleanup:", error);
        }
      }

      particleGridRef.current = [];
      posArrayRef.current = null;
      colorArrayRef.current = null;
      mouseRef.current = { x: 0, y: 0 };
      execCountRef.current = 0;
    };
  }, [logoPath]);

  return (
    <div className="dynamic-background">
      <canvas ref={canvasRef} />
    </div>
  );
};

function CTAParagraphReveal({
  children,
  ready = true,
  delay = 0,
  duration = 0.8,
}) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      gsap.set(container, {
        autoAlpha: 0,
        filter: "blur(8px)",
      });

      if (ready) {
        gsap.to(container, {
          autoAlpha: 1,
          filter: "blur(0px)",
          duration,
          delay,
          ease: "power2.out",
        });
      }
    }, container);

    return () => ctx.revert();
  }, [ready, delay, duration]);

  return (
    <span ref={containerRef} className="cta-paragraph-reveal">
      {children}
    </span>
  );
}
  ScrollTrigger.config({ ignoreMobileResize: true }); 
function CTA() {

  const BLOCKS = [
    {
      title: "Beyond Board Standards",
      content:
        "We strive to attain finished results consistent with the American Board of Orthodontics (ABO) qualitative standards. Our doctors place great priority on the certification and recertification process, ensuring that all diagnostic records adhere to ABO standards.",
    },
    {
      title: "Board Certification Process",
      content:
        "Currently, Dr. Gregg Frey is a certified orthodontist and is preparing cases for recertification. Dr. Daniel Frey is in the final stages of obtaining his initial certification.",
    },
    {
      title: "Diagnostic Record Accuracy",
      content:
        "To complement our use of cutting-edge diagnostic technology, we uphold the highest standards for our records, ensuring accuracy and precision throughout the treatment process.",
    },
    {
      title: "Trusted Expertise",
      content:
        "Our office holds the distinction of being the longest-standing, active board-certified orthodontic office in the area. With four offices in the Lehigh Valley, we have been providing unparalleled orthodontic care for over four decades.",
    },
  ];
  const bookingContentRef = useRef(null);
  const sectionRef = useRef(null);
  const wheelRef = useRef(null);
  const wheelEntranceRef = useRef(null);
  const markerRefs = useRef([]);
  const contentRefs = useRef([]);
  const fourthPinRef = useRef(null);
  const transitionRef = useRef(null);
  const blueCircleRef = useRef(null);
  const whiteCircleRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const bookingInnerRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const wheel = wheelRef.current;

    if (!section || !wheel) return;

    const ctx = gsap.context(() => {
      gsap.set(wheel, { rotation: 0 });

      gsap.fromTo(
        wheelEntranceRef.current,
        {
          scale: 0.5,
        },
        {
          scale: 1,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      );

      gsap.set(contentRefs.current, {
        autoAlpha: 0,
        y: 16,
      });

      gsap.set(contentRefs.current[0], {
        autoAlpha: 1,
        y: 0,
      });

      let currentIndex = 0;
      let animating = false;
      let expanded = false;

      let transition;
      let expansion;
      let observer;
      let scrollTrigger;

      const handleBookingWheel = (event) => {
        if (!expanded || animating) return;

        const content = bookingContentRef.current;
        if (!content) return;

        if (event.deltaY < 0 && content.scrollTop <= 2) {
          event.preventDefault();

          content.scrollTop = 0;

          closeBookingSection();
        }
      };

      let touchStartY = null;
      let touchStartX = null;
      let touchTriggered = false;

      const handleBookingTouchStart = (event) => {
        if (!expanded || animating) return;
        if (event.touches.length !== 1) return;

        touchStartY = event.touches[0].clientY;
        touchStartX = event.touches[0].clientX;
        touchTriggered = false;
      };

      const handleBookingTouchMove = (event) => {
        if (!expanded || animating || touchTriggered) return;
        if (touchStartY === null || touchStartX === null) return;
        if (event.touches.length !== 1) return;

        const content = bookingContentRef.current;
        if (!content) return;

        const deltaY = event.touches[0].clientY - touchStartY;
        const deltaX = event.touches[0].clientX - touchStartX;

        if (Math.abs(deltaX) > Math.abs(deltaY)) return;

        if (content.scrollTop <= 1 && deltaY > 45) {
          event.preventDefault();

          touchTriggered = true;
          touchStartY = null;
          touchStartX = null;

          closeBookingSection();
        }
      };

      const handleBookingTouchEnd = () => {
        touchStartY = null;
        touchStartX = null;
        touchTriggered = false;
      };
      const releaseScroll = (direction) => {
        observer?.disable();

        const destination =
          direction > 0 ? scrollTrigger.end + 2 : scrollTrigger.start - 2;

        window.scrollTo({
          top: destination,
          behavior: "instant",
        });
      };
      const openBookingSection = () => {
        if (animating || expanded || !fourthPinRef.current) return;

        animating = true;

        const rect = fourthPinRef.current.getBoundingClientRect();

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const x = (centerX / window.innerWidth) * 100;
        const y = (centerY / window.innerHeight) * 100;

        const maxRadius = Math.hypot(
          Math.max(centerX, window.innerWidth - centerX),
          Math.max(centerY, window.innerHeight - centerY),
        );

        const initialClip = `circle(0px at ${x}% ${y}%)`;
        const finalClip = `circle(${maxRadius + 10}px at ${x}% ${y}%)`;

        gsap.set(transitionRef.current, {
          autoAlpha: 1,
        });

        gsap.set([blueCircleRef.current, whiteCircleRef.current], {
          clipPath: initialClip,
        });

        expansion?.kill();

        expansion = gsap.timeline({
          onComplete: () => {
            expanded = true;
            animating = false;

            observer?.disable();
          },

          onReverseComplete: () => {
            expanded = false;
            animating = false;

            gsap.set(transitionRef.current, {
              autoAlpha: 0,
            });

            observer?.enable();
          },
        });
        expansion.to(
          blueCircleRef.current,
          {
            clipPath: finalClip,
            duration: 1.35,
            ease: "power3.inOut",
          },
          0,
        );

        expansion.to(
          whiteCircleRef.current,
          {
            clipPath: finalClip,
            duration: 1.2,
            ease: "power3.inOut",
          },
          0.6,
        );


        expansion.to(
          bookingContentRef.current,
          {
            autoAlpha: 1,
            duration: 0.2,
            ease: "power2.out",
          },
          1.85,
        );
        const revealItems =
          bookingInnerRef.current.querySelectorAll(".locations-reveal");

        gsap.set(revealItems, {
          autoAlpha: 0,
          y: 20,
        });

        expansion.to(
          revealItems,
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.12,
            ease: "power3.out",
          },
          1.95,
        );
        expansion.call(
          () => {
            window.dispatchEvent(new Event("frey-pixel-reveal"));
          },
          [],
          2.19,
        );
      };
      const closeBookingSection = () => {
        if (animating || !expanded || !expansion) return;

        animating = true;

        if (bookingContentRef.current) {
          bookingContentRef.current.scrollTop = 0;
        }

        expansion.timeScale(1.8).reverse();
      };
const showStep = (direction) => {
// alert(
//   `direction: ${direction}
//    index: ${currentIndex}
//    animating: ${animating}
//    expanded: ${expanded}`
// );
        if (animating) return;

        if (expanded) {
          if (direction < 0) {
            closeBookingSection();
          }

          return;
        }

        const nextIndex = currentIndex + direction;

        if (nextIndex >= BLOCKS.length) {
          openBookingSection();
          return;
        }

        // Allow the user to scroll backward before pin 1.
        if (nextIndex < 0) {
          releaseScroll(-1);
          return;
        }

        animating = true;
        currentIndex = nextIndex;

        const outgoing = contentRefs.current[nextIndex - direction];
        const incoming = contentRefs.current[nextIndex];

        transition?.kill();

        transition = gsap.timeline({
          onComplete: () => {
            animating = false;
          },
        });

        // Hide the previous content.
        transition.to(
          outgoing,
          {
            autoAlpha: 0,
            y: -12,
            duration: 0.2,
            ease: "power2.in",
          },
          0,
        );

        // Rotate exactly 90 degrees.
        transition.to(
          wheel,
          {
            rotation: -90 * nextIndex,
            duration: 0.85,
            ease: "power3.inOut",
          },
          0,
        );

        // Start the character reveals as the pin arrives.
        transition.call(
          () => {
            setActiveIndex(nextIndex);
          },
          [],
          0.75,
        );

        // Reveal the incoming text.
        transition.fromTo(
          incoming,
          {
            autoAlpha: 0,
            y: 12,
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
            ease: "power3.out",
          },
          0.75,
        );
      };
      const bookingContent = bookingContentRef.current;

      if (bookingContent) {
        bookingContent.addEventListener("wheel", handleBookingWheel, {
          passive: false,
        });

        bookingContent.addEventListener("touchstart", handleBookingTouchStart, {
          passive: true,
        });

        bookingContent.addEventListener("touchmove", handleBookingTouchMove, {
          passive: false,
        });

        bookingContent.addEventListener("touchend", handleBookingTouchEnd);

        bookingContent.addEventListener("touchcancel", handleBookingTouchEnd);
      }
const mm = gsap.matchMedia();

mm.add("(min-width: 768px)", () => {
  observer = Observer.create({
    target: section,
    type: "wheel,touch",
    preventDefault: true,
    tolerance: 10,

    onDown: (self) => {
      showStep(self.event?.type === "wheel" ? 1 : -1);
    },

    onUp: (self) => {
      showStep(self.event?.type === "wheel" ? -1 : 1);
    },
  });

  observer.disable();

  const syncObserver = (self) => {
    if (self.isActive && !expanded) {
      observer.enable();
    } else {
      observer.disable();
    }
  };

  scrollTrigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "+=350%",
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,

    onToggle: syncObserver,
    onRefresh: syncObserver,
    onUpdate: syncObserver,
  });

  return () => {
    observer.kill();
  };
});

mm.add("(max-width: 767px)", () => {
  let displayedIndex = 0;

const updateMobileStep = (progress) => {
  if (expanded || animating) return;

  const nextIndex = Math.min(
    BLOCKS.length - 1,
    Math.max(0, Math.floor(progress * BLOCKS.length)),
  );

  if (nextIndex === displayedIndex) return;

  const previousIndex = displayedIndex;

  displayedIndex = nextIndex;
  currentIndex = nextIndex;
  animating = true;

  const outgoing = contentRefs.current[previousIndex];
  const incoming = contentRefs.current[nextIndex];

  transition?.kill();

  transition = gsap.timeline({
    onComplete: () => {
      animating = false;
    },
  });

  transition.to(
    outgoing,
    {
      autoAlpha: 0,
      y: -12,
      duration: 0.2,
      ease: "power2.in",
    },
    0,
  );

  transition.to(
    wheel,
    {
      rotation: -90 * nextIndex,
      duration: 0.85,
      ease: "power3.inOut",
    },
    0,
  );

  transition.call(
    () => {
      setActiveIndex(nextIndex);
    },
    [],
    0.75,
  );

  transition.fromTo(
    incoming,
    {
      autoAlpha: 0,
      y: 12,
    },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.45,
      ease: "power3.out",
    },
    0.75,
  );
};

  scrollTrigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "+=350%",
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
onLeave: () => {
  if (!expanded && !animating) {
    openBookingSection();
  }
},
    onUpdate: (self) => {
      updateMobileStep(self.progress);
    },
  });
});

      return () => {
        if (bookingContent) {
          bookingContent.removeEventListener("wheel", handleBookingWheel);

          bookingContent.removeEventListener(
            "touchstart",
            handleBookingTouchStart,
          );

          bookingContent.removeEventListener(
            "touchmove",
            handleBookingTouchMove,
          );

          bookingContent.removeEventListener("touchend", handleBookingTouchEnd);

          bookingContent.removeEventListener(
            "touchcancel",
            handleBookingTouchEnd,
          );

        }

mm.revert();
transition?.kill();
expansion?.kill();
      };
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <>

      <div ref={transitionRef} className="cta-expansion">
        <div ref={blueCircleRef} className="cta-expansion__blue" />

        <div ref={whiteCircleRef} className="cta-expansion__white" />
        {/* <div className="mb-12 flex flex-col items-center text-center">

<div className="relative h-[400px] w-full">
  <DynamicBackground logoPath="/images/fspetallogo.png" />
</div>


      </div> */}
        <div ref={bookingContentRef} className="cta-expansion__content">
          <div
            ref={bookingInnerRef}
            className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col justify-center px-[5vw] py-20"
          >
            <Locations scrollContainerRef={bookingContentRef} />
          </div>
        </div>
      </div>
      <section
        ref={sectionRef}
        className="cta-orbit relative h-screen w-full overflow-hidden bg-black text-white"
      >
        <div className="absolute left-[3vw] top-[9vh] z-20 w-[94vw]">
          <h2 className="flex flex-col font-neueroman text-[clamp(2.625rem,6vw,6.75rem)] font-[800] leading-[0.82] tracking-[-0.035em] text-white">
            <span className="block pl-[0%]">Excellence</span>

            <span className="block pl-[15%]">Is in the</span>

            <span className="block pl-[.6%]">Details.</span>
          </h2>
        </div>

        <div className="pointer-events-none absolute right-[3vw] top-[7vh] z-10">
          <ToothScene />
        </div>
        <div ref={wheelEntranceRef} className="cta-orbit__viewport">
          <div ref={wheelRef} className="cta-orbit__wheel">
            <div className="cta-orbit__ring" />

            {BLOCKS.map((block, index) => (
              <div
                key={block.title}
                className="cta-orbit__marker"
                style={{
                  transform: `
            translate(-50%, -50%)
            rotate(${index * 90}deg)
            translateY(calc(var(--orbit-radius) * -1))
          `,
                }}
              >
                <span
                  ref={index === BLOCKS.length - 1 ? fourthPinRef : null}
                  className="cta-orbit__marker-dot"
                />
                <span className="cta-orbit__marker-stem" />

                <span className="cta-orbit__marker-number">{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="cta-orbit__content">
          {BLOCKS.map((block, index) => (
            <div
              key={block.title}
              ref={(el) => {
                contentRefs.current[index] = el;
              }}
              className="cta-orbit__content-block"
            >
              <div className="mx-auto flex w-full max-w-[700px] flex-col items-center text-center">
                <h3 className="w-full font-neuehaas45 uppercase text-[clamp(16px,1.25vw,16px)] font-normal leading-[1.3] tracking-[0.05em]">
                  <CTAParagraphReveal
                    ready={activeIndex === index}
                    delay={0}
                    stagger={0.004}
                    duration={0.55}
                  >
                    {block.title}
                  </CTAParagraphReveal>
                </h3>

                <p className="mt-6 w-full max-w-[600px] font-neuehaas45 text-[clamp(14px,0.85vw,16px)] leading-[1.45] tracking-[0.04em] text-white">
                  <CTAParagraphReveal
                    ready={activeIndex === index}
                    delay={0}
                    stagger={0.004}
                    duration={0.55}
                  >
                    {block.content}
                  </CTAParagraphReveal>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* PROGRESS */}
        <div className="cta-orbit__progress">
          <span>0{activeIndex + 1}</span>
          <span className="text-white/35">/</span>
          <span>0{BLOCKS.length}</span>
        </div>
      </section>
    </>
  );
}

// function Locations() {
//   const ref = useRef(null);
//   const isInView = useInView(ref, { once: false });
//   const [scope, animate] = useAnimate();
//   const [selectedLocation, setSelectedLocation] = useState("All");
//   const [activeDisclosurePanel, setActiveDisclosurePanel] = useState(null);

//   function toggleDisclosurePanels(newPanel) {
//     if (activeDisclosurePanel) {
//       if (
//         activeDisclosurePanel.key !== newPanel.key &&
//         activeDisclosurePanel.open
//       ) {
//         activeDisclosurePanel.close();
//       }
//     }
//     setActiveDisclosurePanel({
//       ...newPanel,
//       open: !newPanel.open,
//     });
//   }

//   const locations = [
//     {
//       location: "Allentown",
//       addressLine1: "1251 S Cedar Crest Blvd",
//       addressLine2: "Suite 210 Allentown, PA 18103",
//       mapbox_map_title: "FreySmiles Allentown [w/ Colors]",
//       mapbox_iframe_url: process.env.NEXT_PUBLIC_MAPBOX_IFRAME_URL_ALLENTOWN,
//       hours: [
//         { Mon: "11:00 AM - 7:00 PM" },
//         { Tue: "11:00 AM - 7:00 PM" },
//         { Wed: "8:00 AM - 5:30 PM" },
//         { Thu: "7:00 AM - 4:30 PM" },
//       ],
//     },
//     {
//       location: "Bethlehem",
//       addressLine1: "2901 Emrick Boulevard",
//       addressLine2: "Bethlehem, PA 18020",
//       mapbox_map_title: "FreySmiles Bethlehem [w/ Colors]",
//       mapbox_iframe_url: process.env.NEXT_PUBLIC_MAPBOX_IFRAME_URL_BETHLEHEM,
//       hours: [{ Tue: "11:00 AM - 7:00 PM" }, { Thu: "7:00 AM - 4:30 PM" }],
//     },
//     {
//       location: "Schnecksville",
//       addressLine1: "4155 Independence Drive",
//       addressLine2: "Schnecksville, PA 18078",
//       mapbox_map_title: "FreySmiles Schnecksville [w/ Colors]",
//       mapbox_iframe_url:
//         process.env.NEXT_PUBLIC_MAPBOX_IFRAME_URL_SCHNECKSVILLE,
//       hours: [
//         { Mon: "11:00 AM - 7:00 PM" },
//         { Tue: "11:00 AM - 7:00 PM" },
//         { Thu: "7:00 AM - 4:30 PM" },
//       ],
//     },
//     {
//       location: "Lehighton",
//       addressLine1: "1080 Blakeslee Blvd Dr E",
//       addressLine2: "Lehighton, PA 18235",
//       mapbox_map_title: "FreySmiles Lehighton [w/ Colors]",
//       mapbox_iframe_url: process.env.NEXT_PUBLIC_MAPBOX_IFRAME_URL_LEHIGHTON,
//       hours: [{ Mon: "11:00 AM - 7:00 PM" }, { Thu: "7:00 AM - 4:30 PM" }],
//     },
//   ];

//   const handleShowAllLocations = () => {
//     activeDisclosurePanel.close();
//     setSelectedLocation("All");
//   };

//   useEffect(() => {
//     animate(
//       "div",
//       isInView
//         ? {
//             opacity: 1,
//             transform: "translateX(0px)",
//             scale: 1,
//             filter: "blur(0px)",
//           }
//         : {
//             opacity: 0,
//             transform: "translateX(-50px)",
//             scale: 0.3,
//             filter: "blur(2px)",
//           },
//       {
//         duration: 0.2,
//         delay: isInView ? stagger(0.1, { startDelay: 0.15 }) : 0,
//       },
//     );
//   }, [isInView]);

//   const DrawEllipse = (props) => {
//     useGSAP(() => {
//       gsap.from(".draw", {
//         drawSVG: "0%",
//         ease: "expo.out",
//         scrollTrigger: {
//           trigger: "#locations-section",
//           start: "clamp(top center)",
//           scrub: true,
//           pinSpacing: false,
//           markers: false,
//         },
//       });
//     });

//     return (
//       <svg
//         width="508"
//         height="122"
//         viewBox="0 0 508 122"
//         fill="none"
//         xmlns="http://www.w3.org/2000/svg"
//         {...props}
//       >
//         <path
//           className="draw"
//           d="M2 23.2421C28.9079 14.5835 113.098 -1.63994 234.594 2.73493C386.464 8.20351 515.075 37.5458 505.497 77.9274C503.774 85.1946 491.815 127.145 271.535 118.942C51.2552 110.739 32.8106 78.7919 45.7824 58.053C59.4644 36.1787 112.824 27.9758 193.548 27.9758"
//           stroke="#ff6432"
//           strokeWidth="3"
//           strokeLinecap="round"
//         />
//       </svg>
//     );
//   };

//   const BezierCurve = () => {
//     const container = useRef(null);
//     const path = useRef(null);
//     let progress = 0;
//     let time = Math.PI / 2; // want the initial time value to be 1; in sine graph y = 1 when x = pi / 2
//     let reqId = null; // everytime mouse enters and leaves line's bounding box, animation gets called causing simultaneous chains of it being called (this is bad), only want one request animation running at the same time
//     let x = 0.5; // middle point is 1/2

//     useEffect(() => {
//       setPath(progress);
//       window.addEventListener("resize", () => {
//         setPath(progress);
//       });
//     }, []);

//     {
//       /*
//       use svg container's width to get control point (center point) of quadratic bezier curve; control point = svg container's width / 2
//       30 ==> svg height(60) divided by 2 to align the path within the center of the svg
//     */
//     }
//     const setPath = (progress) => {
//       if (container.current) {
//         const width = container.current.offsetWidth;
//         path.current.setAttributeNS(
//           null,
//           "d",
//           `M 0 30 Q${width * x} ${30 + progress} ${width} 30`,
//         );
//       }
//     };

//     const manageMouseEnter = () => {
//       if (reqId) {
//         window.cancelAnimationFrame(reqId);
//         resetAnimation();
//       }
//     };

//     const manageMouseMove = (e) => {
//       const { movementY, clientX } = e;
//       const { left, width } = path.current.getBoundingClientRect();
//       // get value of x depending on where mouse is on the x-axis of the line
//       x = (clientX - left) / width;
//       progress += movementY;
//       setPath(progress);
//     };

//     const manageMouseLeave = () => {
//       animateOut();
//     };

//     {
//       /*
//       linear interpolation
//       x: The value we want to interpolate from (start) => 10
//       y: The target value we want to interpolate to (end) => 0
//       a: The amount by which we want x to be closer to y => 10% or 0.1
//       ex: value = lerp(value, 0, 0.1)
//       if value = 10, bring that value close to 0 by 10% which will give 9
//     */
//     }
//     const lerp = (x, y, a) => x * (1 - a) + y * a;

//     // sine function, linear interpolation, recursivity
//     const animateOut = () => {
//       // sine function creates the "wobbly" line animation when mouse leaves the line
//       const newProgress = progress * Math.sin(time);
//       time += 0.25; // speed of bounce animation
//       setPath(newProgress);
//       progress = lerp(progress, 0, 0.05); // change 3rd lerp argument to change curve's bounce exaggeration

//       // exit condition
//       if (Math.abs(progress) > 0.75) {
//         reqId = window.requestAnimationFrame(animateOut);
//       } else {
//         resetAnimation();
//       }
//     };

//     const resetAnimation = () => {
//       time = Math.PI / 2;
//       progress = 0;
//     };

//     return (
//       <>
//         {/* line */}
//         <div
//           ref={container}
//           className="mb-[30px] col-span-12 row-start-2 h-[1px] w-full relative"
//         >
//           {/* box for event listeners overlays the svg element */}
//           <div
//             onMouseEnter={manageMouseEnter}
//             onMouseMove={(e) => {
//               manageMouseMove(e);
//             }}
//             onMouseLeave={manageMouseLeave}
//             className="h-[30px] relative -top-[15px] z-10 hover:h-[60px] hover:-top-[30px]"
//           />
//           <svg className="w-full h-[60px] -top-[30px] absolute">
//             <path ref={path} strokeWidth={1} stroke="#000" fill="none" />
//           </svg>
//         </div>
//       </>
//     );
//   };

//   useEffect(() => {
//     const title = document.querySelector(".content__title");
//     const split = new SplitText(title, { type: "chars" });
//     const chars = split.chars;

//     gsap.fromTo(
//       chars,
//       {
//         "will-change": "opacity, transform",
//         transformOrigin: "50% 100%",
//         opacity: 0,
//         rotationX: 90,
//       },
//       {
//         ease: "power4",
//         opacity: 1,
//         stagger: 0.03,
//         rotationX: 0,
//         scrollTrigger: {
//           trigger: title,
//           start: "center bottom",
//           end: "bottom top+=20%",
//           scrub: true,
//         },
//       },
//     );
//   }, []);

//   useEffect(() => {
//     gsap.to(".marquee-track.r h1", {
//       scrollTrigger: {
//         trigger: ".marquee-track.r h1",
//         start: "top bottom",
//         end: "400% top",
//         scrub: 0.6,
//       },
//       xPercent: 25,
//       duration: 3,
//       ease: "linear",
//     });
//   }, []);

//   const targetRef = useRef(null);

//   useEffect(() => {
//     const observer = new IntersectionObserver((entries) => {
//       entries.forEach((entry) => {
//         if (entry.isIntersecting) {
//           const childSplit = new SplitText(".text-heading h1", {
//             type: "lines",
//             linesClass: "split-child",
//           });

//           gsap.from(childSplit.lines, {
//             duration: 2,
//             xPercent: 25,
//             autoAlpha: 0,
//             ease: "Expo.easeOut",
//             stagger: 0.12,
//             repeat: -1,
//           });

//           observer.unobserve(entry.target);
//         }
//       });
//     });

//     if (targetRef.current) {
//       observer.observe(targetRef.current);
//     }

//     return () => {
//       observer.disconnect();
//     };
//   }, []);

//   const pathRef = useRef(null);

//   useEffect(() => {
//     const path = pathRef.current;
//     if (!path) return;

//     const pathLength = path.getTotalLength();
//     path.style.strokeDasharray = pathLength;
//     path.style.strokeDashoffset = pathLength;
//     path.style.transition = "stroke-dashoffset 2s ease-out";

//     const observer = new IntersectionObserver(
//       (entries) => {
//         if (entries[0].isIntersecting) {
//           path.style.strokeDashoffset = "0";
//         } else {
//           path.style.strokeDashoffset = pathLength;
//         }
//       },
//       { threshold: 0.5 },
//     );

//     observer.observe(path);
//     return () => observer.disconnect();
//   }, []);

//   return (
//     <>

//       <section id="flex locations-section" className="relative ">
//         <div
//           id="locations-heading"
//           className="relative block max-w-2xl px-4 py-16 mx-auto sm:px-6 sm:py-24 lg:max-w-[100rem] lg:px-8 lg:py-32"
//         >
//           <h1 className="font-helvetica-neue-light lg:text-5xl">
//             Come see us at any of our{" "}
//             <span className="relative inline-block my-8 leading-tight lowercase font-editorial-new underline-offset-8">
//               four convenient locations
//               {/* <img className="absolute w-full h-auto -ml-2 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" src="/../../images/ellipse.svg" /> */}
//               <DrawEllipse className="absolute w-full h-auto -ml-2 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" />
//             </span>{" "}
//             or opt for a{" "}
//             <span className=" relative leading-tight lowercase font-editorial-new decoration-wavy underline-offset-8 decoration-[#000] underline inline-block">
//               virtual consultation
//             </span>
//           </h1>

//           <svg
//             className="hidden lg:block absolute bottom-0 translate-y-1/2 left-0 translate-x-64 w-36 h-36 rotate-[120deg] text-[#ff6432]"
//             viewBox="0 0 77 85"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               ref={pathRef}
//               d="M1.33755 84.3973C0.297616 62.7119 2.93494 39.8181 19.4192 23.8736C28.2211 15.3599 42.4944 12.5723 47.6281 26.2359C51.1245 35.5419 51.542 51.9945 41.0605 57.0865C29.486 62.7095 40.2945 35.2221 41.9942 32.4952C49.9497 19.7313 59.7772 11.6122 72.2699 3.78281C76.9496 0.849879 73.7108 0.477284 70.0947 1.13476C66.9572 1.7052 63.4035 2.43717 60.5291 3.81975C59.6524 4.24143 65.7349 2.73236 66.6827 2.44768C70.7471 1.22705 75.4874 -0.0219285 75.9527 5.60812C76.0274 6.5127 75.9956 14.9844 74.7481 15.2963C74.099 15.4586 71.0438 10.27 70.4642 9.65288C66.6996 5.64506 63.5835 4.42393 58.2726 5.11792"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//             />
//           </svg>
//         </div>

//         <div className="font-neue-montreal text-[#171616]" ref={ref}>
//           <motion.div
//             id="locations-map"
//             className="h-[60vh] overflow-hidden lg:absolute lg:right-0 lg:h-full lg:w-1/2"
//             style={{
//               opacity: isInView ? 1 : 0,
//               filter: isInView ? "blur(0px)" : "blur(16px)",
//               transition: "all 0.9s cubic-bezier(0.17, 0.55, 0.55, 1) 0.5s",
//             }}
//           >
//             <iframe
//               className="w-full h-full rounded-lg"
//               width="100%"
//               height="100%"
//               src={
//                 selectedLocation === "All"
//                   ? process.env.NEXT_PUBLIC_MAPBOX_IFRAME_URL_ALL_LOCATIONS
//                   : locations.find((l) => l.location === selectedLocation)
//                       .mapbox_iframe_url
//               }
//               title={
//                 selectedLocation === "All"
//                   ? "FreySmiles All Locations [w/ Colors]"
//                   : locations.find((l) => l.location === selectedLocation)
//                       .mapbox_map_title
//               }
//             />
//           </motion.div>

//           <div
//             className="font-neue-montreal text-[#171616]"
//             id="locations-details"
//           >
//             <div className="max-w-2xl px-4 py-16 mx-auto sm:px-6 sm:py-24 lg:mt-0 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8 xl:gap-x-24">
//               {/* LOCATIONS LIST */}
//               <motion.div
//                 className="flex flex-col mt-10"
//                 style={{
//                   transform: isInView ? "none" : "translateX(-50px)",
//                   opacity: isInView ? 1 : 0,
//                   transition: "all 0.9s cubic-bezier(0.17, 0.55, 0.55, 1) 0.5s",
//                 }}
//               >
//                 <button
//                   className={`${
//                     selectedLocation === "All" ? "" : ""
//                   } self-end transition-all duration-300 ease-linear w-max mr-6 mb-6 underline-offset-4 `}
//                   onClick={handleShowAllLocations}
//                 >
//                   {selectedLocation === "All"
//                     ? "Showing All Locations"
//                     : "Show All Locations"}
//                 </button>

//                 <dl ref={scope}>
//                   {locations.map((l, i) => (
//                     <Disclosure
//                       as="div"
//                       key={l.location}
//                       className={`${
//                         selectedLocation === l.location ? "" : ""
//                       } px-4 py-6 transition-all duration-300 ease-linear cursor-pointer hover:text-black group `}
//                     >
//                       {(panel) => {
//                         const { open, close } = panel;
//                         return (
//                           <>
//                             <BezierCurve />

//                             <Disclosure.Button
//                               className="grid w-full grid-cols-12 grid-rows-1 text-left sm:px-0"
//                               onClick={() => {
//                                 if (!open) close();
//                                 toggleDisclosurePanels({ ...panel, key: i });
//                                 setSelectedLocation(l.location);
//                               }}
//                             >
//                               <dt className="col-span-5 row-start-1">
//                                 <h6 className="text-xl font-neue-montreal">
//                                   {l.location}
//                                 </h6>
//                               </dt>
//                               <dd className="col-span-7 row-start-1">
//                                 <span className="flex items-center justify-between">
//                                   <p className="font-neue-montreal">
//                                     {l.addressLine1}
//                                     <br />
//                                     {l.addressLine2}
//                                   </p>
//                                   <ChevronRightIcon className="w-6 h-6 ui-open:rotate-90 ui-open:transform" />
//                                 </span>
//                               </dd>
//                             </Disclosure.Button>
//                             <Transition
//                               show={open}
//                               enter="transition-transform ease-out duration-300"
//                               enterFrom="transform scale-y-0 opacity-0"
//                               enterTo="transform scale-y-100 opacity-100"
//                               leave="transition-transform ease-in duration-200"
//                               leaveFrom="transform scale-y-100 opacity-100"
//                               leaveTo="transform scale-y-0 opacity-0"
//                             >
//                               <Disclosure.Panel
//                                 as="div"
//                                 className="grid grid-cols-12"
//                               >
//                                 <ul className="col-span-7 col-start-6 mt-4 mb-2 text-left">
//                                   <h6 className="font-medium uppercase">
//                                     Office Hours:
//                                   </h6>
//                                   {l.hours.map((hour, index) => (
//                                     <li key={index}>
//                                       {Object.keys(hour)[0]}:{" "}
//                                       {Object.values(hour)[0]}
//                                     </li>
//                                   ))}
//                                 </ul>
//                               </Disclosure.Panel>
//                             </Transition>
//                           </>
//                         );
//                       }}
//                     </Disclosure>
//                   ))}
//                 </dl>
//               </motion.div>
//             </div>
//           </div>
//         </div>
//       </section>
//     </>
//   );
// }

function PixelRevealImage({ src, alt, className = "" }) {
  const wrapperRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const image = imageRef.current;
    const canvas = canvasRef.current;

    if (!wrapper || !image || !canvas) return;

    const ctx = canvas.getContext("2d");
    const buffer = document.createElement("canvas");
    const bctx = buffer.getContext("2d");

    if (!ctx || !bctx) return;

    let tween;
    let fadeTween;
    let pending = false;
    let cancelled = false;

    let width = 0;
    let height = 0;

    const prepare = () => {
      width = wrapper.clientWidth;
      height = wrapper.clientHeight;

      if (!width || !height || !image.naturalWidth) return false;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      return true;
    };

    const drawPixelated = (pixelSize) => {
      const block = Math.max(1, pixelSize);

      const columns = Math.max(1, Math.ceil(width / block));
      const rows = Math.max(1, Math.ceil(height / block));

      if (buffer.width !== columns) buffer.width = columns;
      if (buffer.height !== rows) buffer.height = rows;

      const scale = Math.max(
        width / image.naturalWidth,
        height / image.naturalHeight,
      );

      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;

      bctx.clearRect(0, 0, columns, rows);

      bctx.drawImage(
        image,
        (width - drawWidth) / (2 * block),
        (height - drawHeight) / (2 * block),
        drawWidth / block,
        drawHeight / block,
      );

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(buffer, 0, 0, width, height);
    };

    const drawGlitch = (progress) => {
      if (progress < 0.38 || progress > 0.46) return;

      const bandY = height * 0.45;
      const bandHeight = 12;
      const offset = 12;

      ctx.drawImage(
        canvas,
        0,
        bandY,
        width,
        bandHeight,
        offset,
        bandY,
        width,
        bandHeight,
      );
    };

    const render = (progress) => {
      let pixelSize;

      if (progress < 0.2) {
        pixelSize = 50;
      } else {
        const t = (progress - 0.2) / 0.8;
        const eased = 1 - Math.pow(1 - t, 3);

        pixelSize = 50 - 49 * eased;
      }

      drawPixelated(pixelSize);
      drawGlitch(progress);
    };
    const start = () => {
      if (cancelled) return;

      if (!image.complete || !image.naturalWidth) {
        pending = true;
        return;
      }

      tween?.kill();
      fadeTween?.kill();

      if (!prepare()) return;

      pending = false;

      gsap.set(image, { opacity: 0 });
      gsap.set(canvas, { opacity: 1 });

      const state = { progress: 0 };

      render(0);

      tween = gsap.to(state, {
        progress: 1,
        duration: 0.8,
        ease: "none",
        onUpdate: () => render(state.progress),
        onComplete: () => {
          fadeTween = gsap.timeline();

          fadeTween.to(
            image,
            {
              opacity: 1,
              duration: 0.3,
            },
            0,
          );

          fadeTween.to(
            canvas,
            {
              opacity: 0,
              duration: 0.3,
            },
            0,
          );
        },
      });
    };

    const onReveal = () => start();

    const onLoad = () => {
      if (pending) start();
    };

    window.addEventListener("frey-pixel-reveal", onReveal);
    image.addEventListener("load", onLoad);

    return () => {
      cancelled = true;
      tween?.kill();
      fadeTween?.kill();

      window.removeEventListener("frey-pixel-reveal", onReveal);
      image.removeEventListener("load", onLoad);
    };
  }, [src]);

  return (
    <div ref={wrapperRef} className={className}>
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover opacity-0"
      />

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    </div>
  );
}

function Locations() {
  return (
    <main className="min-h-screen w-full bg-white text-[#111]">
      <div className="frey-consult-marquee locations-reveal">
        <div className="frey-consult-marquee__content">
          {[0, 1].map((group) => (
            <div
              key={group}
              className="frey-consult-marquee__group"
              aria-hidden={group === 1}
            >
              {[0, 1].map((i) => (
                <div key={i} className="frey-consult-marquee__sentence-pair">
                  <span className="frey-consult-marquee__text font-neueroman text-[clamp(20px,3vw,20px)] leading-none tracking-[-0.035em] text-black">
                    No referral needed.
                  </span>

                  <span className="frey-consult-marquee__text font-neueroman text-[clamp(20px,3vw,20px)] leading-none tracking-[-0.035em] text-black">
                    Your initial consultation is complimentary.
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <section className="px-[3vw] pt-5 pb-30">
        <div className="grid min-h-screen grid-cols-1 gap-y-16 border-t border-[#999] pt-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-x-[3vw]">
          {/* LEFT COLUMN */}
          <div className="flex flex-col items-start">
            <div className="locations-reveal flex flex-col items-start gap-8">
              <h1 className="m-0 max-w-[420px] font-neueroman text-[12px] leading-[1.4] uppercase">
                Find a FreySmiles location near you. We're proud to serve
                patients throughout the Lehigh Valley and surrounding
                communities.
              </h1>

              <Link
                href="#locations-list"
                className="font-neueroman text-[12px] uppercase underline underline-offset-4 transition-opacity duration-300 hover:opacity-50"
              >
                Explore Our Locations
              </Link>
            </div>

            <PixelRevealImage
              src="/images/signonmetalrack.png"
              alt="FreySmiles orthodontics office"
              className="locations-reveal relative mt-16 aspect-[4/5] w-full overflow-hidden md:mt-[40px] md:ml-[5%] md:w-[78%]"
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex w-full items-start">
            <div className="w-full">
              {/* <span className="mb-5 text-center font-neuehaas45 text-[12px] uppercase tracking-[0.14em] text-black">
          Your smile starts here
        </span> */}
              <div className="locations-reveal relative h-[750px] w-full overflow-hidden rounded-2xl bg-white md:h-[850px]">
                <iframe
                  src="https://app.acuityscheduling.com/schedule.php?owner=37690830"
                  title="Schedule Appointment"
                  className="block h-full w-full border-0"
                  allow="payment"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
const ease = (x) => x * x * (3 - 2 * x);

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
