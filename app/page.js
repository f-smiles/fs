"use client";
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

const Hero = () => {
  const transitionRef = useRef(null);
  const videoStepRef = useRef(null);
  const videoRef = useRef(null);
  const sectionRef = useRef(null);
  const shapeTrackRef = useRef(null);

  // Hero refs
  const marqueeRef = useRef(null);
  const videoButtonRef = useRef(null);
  const editorialRef = useRef(null);

  // Statistics refs
  const statRefs = useRef([]);
  const statDigitRefs = useRef([]);
  const statsTextCharsRef = useRef([]);
  const shapeRef = useRef(null);

  const [videoReady, setVideoReady] = useState(false);

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

  useLayoutEffect(() => {
    const originalContents = [];

    statDigitRefs.current = [];

    statRefs.current.forEach((ref) => {
      if (!ref) return;

      originalContents.push({
        ref,
        html: ref.innerHTML,
      });

      const targetValue = parseInt(ref.dataset.target, 10);

      const digits = targetValue.toString().split("");

      ref.innerHTML = "";

      digits.forEach((digit) => {
        const wrapper = document.createElement("div");

        wrapper.style.overflow = "hidden";
        wrapper.style.height = "1em";
        wrapper.style.display = "inline-block";
        wrapper.style.verticalAlign = "top";

        const digitContainer = document.createElement("div");

        digitContainer.style.position = "relative";

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

        gsap.set(digitContainer, {
          y: "0em",
        });

        statDigitRefs.current.push({
          element: digitContainer,
          value: Number(digit),
        });
      });
    });

    return () => {
      originalContents.forEach(({ ref, html }) => {
        ref.innerHTML = html;
      });

      statDigitRefs.current = [];
    };
  }, []);


useLayoutEffect(() => {
  const container = transitionRef.current;
  const step = videoStepRef.current;
  const section = sectionRef.current;
  const shape = shapeRef.current;

  if (!container || !step || !section || !shape) return;

  const ctx = gsap.context(() => {
    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: "+=200%",
        scrub: true,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Video stepped clip-path
    timeline.fromTo(
      step,
      {
        clipPath:
          "polygon(0% 0%, 100% 0%, 100% 34%, 70% 34%, 70% 68%, 48% 68%, 48% 100%, 0% 100%)",
      },
      {
        clipPath:
          "polygon(0% 0%, 100% 0%, 100% 34%, 100% 34%, 100% 68%, 100% 68%, 100% 100%, 0% 100%)",
        duration: 1,
      },
      0
    );

    // Statistics panel enters
    timeline.fromTo(
      section,
      { yPercent: 100 },
      {
        yPercent: 0,
        duration: 0.8,
        immediateRender: true,
        force3D: true,
      },
      0.5
    );

    // Editorial copy
    const chars = statsTextCharsRef.current;

    let textEnd = 1.3;

    if (chars.length) {
      const stagger = 0.012;
      const passDuration = 0.12;

      timeline.to(
        chars,
        {
          color: "#abff02",
          duration: passDuration,
          stagger: { each: stagger },
        },
        0.65
      );

      timeline.to(
        chars,
        {
          color: "#000000",
          duration: passDuration,
          stagger: { each: stagger },
        },
        0.85
      );

      textEnd =
        0.85 + (chars.length - 1) * stagger + passDuration;
    }

    // Rolling statistics
    let countersEnd = 1.3;

    statDigitRefs.current.forEach(({ element, value }, index) => {
      const start = 0.75 + index * 0.06;

      timeline.to(
        element,
        {
          y: `${-value}em`,
          duration: 0.7,
          ease: "power3.out",
        },
        start
      );

      countersEnd = Math.max(countersEnd, start + 0.7);
    });
const animationEnd = Math.max(textEnd, countersEnd);

timeline.to({}, {
  duration: Math.max(0.01, animationEnd - timeline.duration()),
});
    // Nothing happens to the SVG until the copy and counters finish
    const shapeStart = Math.max(textEnd, countersEnd) + 0.15;

    timeline.addLabel("shapeExpansion", shapeStart);

    // Expansion without rotation
    timeline.fromTo(
      shape,
      {
        scale: 1,
        rotation: 0,
        transformOrigin: "50% 50%",
      },
      {
        scale: () => {
          const width = shape.offsetWidth;

          const diagonal = Math.hypot(
            window.innerWidth,
            window.innerHeight
          );

          return (diagonal / width) * 5;
        },
        rotation: 0,
        duration: 1.6,
        ease: "power2.in",
        immediateRender: false,
      },
      "shapeExpansion"
    );
  }, container);

  return () => ctx.revert();
}, []);


  return (
    <>

    <div ref={transitionRef} className="relative h-screen w-full">
      <section className="relative flex h-screen w-full flex-col justify-end overflow-hidden bg-[#0F0F0F]">
        <div ref={videoStepRef} className="hero-main-video">
          <div
            className="hero-main-video-scene"
            style={{
              backgroundImage: "url('/images/boyholdingaligner-poster.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <video
              ref={videoRef}
              src="/videos/boyholdingaligner.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onLoadedData={() => setVideoReady(true)}
              className={`h-full w-full object-cover transition-opacity duration-700 ease-out ${
                videoReady ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>

          <div className="frey-video-overlay absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 px-8 text-center text-white">
            <h2 className="frey-video-headline m-0 max-w-[620px] font-neueroman text-[clamp(2.5rem,5vw,5.5rem)] leading-[0.95] tracking-[-0.025em]">
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

            <a
              ref={videoButtonRef}
              href="/book-now"
              className="
                frey-video-button
                inline-flex min-h-[56px] items-center justify-center
                rounded-full border border-white/25
                bg-white/25 px-12
                font-neuehaas45 text-[14px] text-white
                backdrop-blur-[24px] backdrop-saturate-[140%]
                shadow-[0_4px_24px_rgba(0,0,0,0.08)]
                transition-colors duration-300
                hover:bg-white/40 hover:border-white/40
              "
            >
              <span className="frey-video-button-label whitespace-nowrap">
                Book Now
              </span>
            </a>
          </div>
        </div>

        <div
          ref={editorialRef}
          className="absolute bottom-[66%] left-[56%] right-[6%] z-[5] grid grid-cols-2 gap-10 text-[#111820] max-md:bottom-[55%] max-md:left-[53%] max-md:gap-4"
        >
          <div className="frey-editorial-column flex flex-col gap-3 text-[#f5f5f5]">
            <span className="font-neuehaas45 text-[11px] uppercase tracking-[0.08em]">
              (01) — OUR PHILOSOPHY
            </span>

            <p className="max-w-[320px] font-neuehaas45 text-[clamp(0.75rem,0.95vw,0.95rem)] leading-[1.35] tracking-[0.02em] text-[#f5f5f5]">
              Every smile is a story. At our office, we guide you through every
              step of your orthodontic journey
            </p>
          </div>

          <div className="frey-editorial-column flex flex-col gap-3 text-white">
            <span className="font-neuehaas45 text-[11px] uppercase tracking-[0.08em]">
              (02) — OUR PRACTICE
            </span>

            <p className="max-w-[320px] font-neuehaas45 text-[clamp(0.75rem,0.95vw,0.95rem)] leading-[1.35] tracking-[0.02em]">
              with advanced treatment, personalized care, and results that go
              beyond the ordinary.
            </p>
          </div>
        </div>

        <div className="absolute bottom-[36%] left-[56%] right-[4%] z-[5] flex items-start gap-6 text-white max-md:bottom-[24%] max-md:left-[53%] max-md:gap-3">
          <div className="mt-[5px] shrink-0">
            <DotMatrix />
          </div>

          <h1 className="m-0 font-neuehaas45 text-[clamp(1.25rem,2.1vw,2.75rem)] lowercase leading-[1.04] max-md:text-[clamp(0.7rem,2.5vw,1.25rem)]">
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
          className="frey-hero-bottom-marquee pointer-events-none absolute inset-x-0 bottom-0 z-10 w-full"
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
      </section>

      <section
        ref={sectionRef}
className="absolute inset-x-0 top-0 z-30 h-screen w-full bg-[#F5F5F5]"
      >
        <ShrimpFlow />

        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col lg:flex-row">
          {/* LEFT — EDITORIAL COPY */}
          <div className="flex w-full items-center px-8 lg:w-1/2 lg:px-16">
            <TransitionAnimatedCopy charsRef={statsTextCharsRef}>
              <h2 className="w-full max-w-[520px] font-neueroman text-[15px] font-[550] leading-[1.5] tracking-[-0.01em]">
                Our doctors are fully invested in treatment planning your case
                correctly. Guided by board-certified standards and decades of
                clinical practice, we approach every case with the same rigor
                demanded in academic orthodontics.
              </h2>
            </TransitionAnimatedCopy>
          </div>

          {/* RIGHT — STATISTICS */}
          <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16">
            <div className="w-[75%]">
              {/* STAT 1 */}
              <div className="relative flex items-center justify-between gap-4 py-5 before:absolute before:left-0 before:top-0 before:h-[1px] before:w-full before:bg-gradient-to-r before:from-black/10 before:via-black/30 before:to-black/80">
                <div className="flex items-end font-ibmplex text-[clamp(1.75rem,2.75vw,2.5rem)] font-light leading-none tracking-[-0.06em]">
                  <span
                    ref={(el) => (statRefs.current[0] = el)}
                    data-target="60"
                  >
                    0
                  </span>
                  <span className="mb-[3px] ml-1 text-[0.45em]">+</span>
                </div>

                <p className="text-right font-ibmplex text-[13px] uppercase text-black/60">
                  Years of Experience
                </p>
              </div>

              {/* STAT 2 */}
              <div className="relative flex items-center justify-between gap-4 py-5 before:absolute before:left-0 before:top-0 before:h-[1px] before:w-full before:bg-gradient-to-r before:from-black/10 before:via-black/30 before:to-black/80">
                <div className="flex items-end font-ibmplex text-[clamp(1.75rem,2.75vw,2.5rem)] font-light leading-none tracking-[-0.06em]">
                  <span
                    ref={(el) => (statRefs.current[1] = el)}
                    data-target="25"
                  >
                    0
                  </span>
                  <span className="mb-[3px] ml-1 text-[0.45em]">k</span>
                </div>

                <p className="text-right font-ibmplex text-[13px] uppercase text-black/60">
                  Satisfied Patients
                </p>
              </div>

              {/* STAT 3 */}
              <div className="relative flex items-center justify-between gap-4 py-5 before:absolute before:left-0 before:top-0 before:h-[1px] before:w-full before:bg-gradient-to-r before:from-black/10 before:via-black/30 before:to-black/80">
                <div className="font-ibmplex text-[clamp(1.75rem,2.75vw,2.5rem)] font-light leading-none tracking-[-0.06em]">
                  <span
                    ref={(el) => (statRefs.current[2] = el)}
                    data-target="4"
                  >
                    0
                  </span>
                </div>

                <p className="text-right font-ibmplex text-[13px] uppercase text-black/60">
                  Locations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM HEADLINE + EXPANDING SHAPE */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 px-8 lg:px-16">
          <h2 className="flex flex-wrap items-center gap-x-[0.25em] gap-y-2 font-neueroman text-[clamp(2rem,5.5vw,7rem)] leading-[0.9] tracking-[-0.005em] text-black">
            <span>Clearly simple</span>

        <span
  ref={shapeRef}
  className="inline-block h-[0.65em] w-[0.65em] shrink-0 bg-black"
  aria-hidden="true"
/>
            <span>clearly yours</span>
          </h2>
        </div>
      </section>
    </div>

    <div
      ref={shapeTrackRef}
      className="relative h-[150vh] w-full"
      aria-hidden="true"
    />
  </>
);


};

function DotMatrix() {
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
      fill="white"
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

function AnimatedCopy({
  children,
  colorInitial = "#dddddd",
  colorAccent = "#abff02",
  colorFinal = "#000000",
}) {
  const containerRef = useRef(null);
  const splitRefs = useRef([]);
  const lastScrollProgress = useRef(0);
  const colorTransitionTimers = useRef(new Map());
  const completedChars = useRef(new Set());

  useGSAP(
    () => {
      if (!containerRef.current) return;

      splitRefs.current = [];
      lastScrollProgress.current = 0;
      colorTransitionTimers.current.clear();
      completedChars.current.clear();

      let elements = [];
      if (containerRef.current.hasAttribute("data-copy-wrapper")) {
        elements = Array.from(containerRef.current.children);
      } else {
        elements = [containerRef.current];
      }

      elements.forEach((element) => {
        const charSplit = SplitText.create(element, {
          type: "chars",
          charsClass: "char",
        });

        elements.forEach((element) => {
          const charSplit = SplitText.create(element, {
            type: "chars",
            charsClass: "char",
          });

          splitRefs.current.push({
            wordSplit: null,
            charSplit,
          });
        });
      });

      const allChars = splitRefs.current.flatMap(
        ({ charSplit }) => charSplit.chars,
      );

      gsap.set(allChars, { color: colorInitial });

      const scheduleFinalTransition = (char, index) => {
        if (colorTransitionTimers.current.has(index)) {
          clearTimeout(colorTransitionTimers.current.get(index));
        }

        const timer = setTimeout(() => {
          if (!completedChars.current.has(index)) {
            gsap.to(char, {
              duration: 0.1,
              ease: "none",
              color: colorFinal,
              onComplete: () => {
                completedChars.current.add(index);
              },
            });
          }
          colorTransitionTimers.current.delete(index);
        }, 100);

        colorTransitionTimers.current.set(index, timer);
      };

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 90%",
        end: "top 10%",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const totalChars = allChars.length;
          const isScrollingDown = progress >= lastScrollProgress.current;
          const currentCharIndex = Math.floor(progress * totalChars);

          allChars.forEach((char, index) => {
            if (!isScrollingDown && index >= currentCharIndex) {
              if (colorTransitionTimers.current.has(index)) {
                clearTimeout(colorTransitionTimers.current.get(index));
                colorTransitionTimers.current.delete(index);
              }
              completedChars.current.delete(index);
              gsap.set(char, { color: colorInitial });
              return;
            }

            if (completedChars.current.has(index)) {
              return;
            }

            if (index <= currentCharIndex) {
              gsap.set(char, { color: colorAccent });
              if (!colorTransitionTimers.current.has(index)) {
                scheduleFinalTransition(char, index);
              }
            } else {
              gsap.set(char, { color: colorInitial });
            }
          });

          lastScrollProgress.current = progress;
        },
      });

      return () => {
        colorTransitionTimers.current.forEach((timer) => clearTimeout(timer));
        colorTransitionTimers.current.clear();
        completedChars.current.clear();

        splitRefs.current.forEach(({ wordSplit, charSplit }) => {
          if (charSplit) charSplit.revert();
          if (wordSplit) wordSplit.revert();
        });
      };
    },
    {
      scope: containerRef,
      dependencies: [colorInitial, colorAccent, colorFinal],
    },
  );

  if (React.Children.count(children) === 1) {
    return React.cloneElement(children, { ref: containerRef });
  }

  return (
    <div ref={containerRef} data-copy-wrapper="true">
      {children}
    </div>
  );
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
export default function LandingComponent() {
  return (
    <div style={{ overflowX: "clip" }}>
      <div className="MainContainer">
        <Hero />
      </div>

      <NewSection />
      <LogoGrid />
      <Locations />
      <GiftCards />
    </div>
  );
}

const PATH_SUB =
  "M-10 913H634C645.046 913 654 904.046 654 893V482.5C654 471.454 662.954 462.5 674 462.5H935C946.046 462.5 955 453.546 955 442.5V227.5C955 216.454 963.954 207.5 975 207.5H1573.5C1584.55 207.5 1593.5 216.454 1593.5 227.5V325.5C1593.5 336.546 1602.45 345.5 1613.5 345.5H1734.5C1745.55 345.5 1754.5 336.546 1754.5 325.5V20.5C1754.5 9.4543 1763.45 0.5 1774.5 0.5H2092.5";

const PATH_MAIN =
  "M-40 913.5H604C615.046 913.5 624 904.546 624 893.5V483C624 471.954 632.954 463 644 463H905C916.046 463 925 454.046 925 443V228C925 216.954 933.954 208 945 208H1543.5C1554.55 208 1563.5 216.954 1563.5 228V326C1563.5 337.046 1572.45 346 1583.5 346H1704.5C1715.55 346 1724.5 337.046 1724.5 326V21C1724.5 9.9543 1733.45 1 1744.5 1H2062.5";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function ShrimpFlow({ className = "" }) {
  const containerRef = useRef(null);
  const mainRef = useRef(null);
  const subRef = useRef(null);

  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  useGSAP(
    () => {
      const container = containerRef.current;
      const main = mainRef.current;
      const sub = subRef.current;

      if (!container || !main || !sub) return;

      const trigger = container.parentElement;

      if (!trigger) return;

      gsap.set(main, {
        strokeDashoffset: -1000,
        opacity: 1,
      });

      gsap.set(sub, {
        strokeDashoffset: -1040,
        opacity: 1,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        main,
        {
          strokeDashoffset: 0,
          ease: "none",
          duration: 1,
        },
        0,
      );

      tl.to(
        sub,
        {
          strokeDashoffset: -60,
          ease: "none",
          duration: 1,
        },
        0,
      );

      tl.to(
        [main, sub],
        {
          opacity: 0,
          ease: "none",
          duration: 0.18,
        },
        0.82,
      );
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className={`shrimp-flow ${className}`}
      aria-hidden="true"
    >
      <svg
        className="shrimp-svg shrimp-svg--sub"
        viewBox="0 0 1920 914"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
      >
        <defs>
          <linearGradient
            id={`shrimpGradSub-${uid}`}
            x1="1926"
            y1="-47.4999"
            x2="43.5"
            y2="937"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity="0" />
            <stop offset="0.5" stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d={PATH_SUB}
          stroke={`url(#shrimpGradSub-${uid})`}
          strokeOpacity="0.15"
        />

        <path
          ref={subRef}
          d={PATH_SUB}
          className="shrimp-pulse"
          strokeOpacity="0.55"
          pathLength="1000"
          strokeDasharray="90 910"
          strokeDashoffset="-1040"
        />
      </svg>

      <svg
        className="shrimp-svg shrimp-svg--main"
        viewBox="0 0 1920 915"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
      >
        <defs>
          <linearGradient
            id={`shrimpGradMain-${uid}`}
            x1="1896"
            y1="-46.9999"
            x2="13.5"
            y2="937.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity="0" />
            <stop offset="0.5" stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d={PATH_MAIN}
          stroke={`url(#shrimpGradMain-${uid})`}
          strokeOpacity="0.35"
          strokeWidth="1"
        />

        <path
          ref={mainRef}
          d={PATH_MAIN}
          className="shrimp-pulse"
          strokeOpacity="0.9"
          pathLength="1000"
          strokeDasharray="120 880"
          strokeDashoffset="-1000"
        />
      </svg>
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
    <div className="hero-minimap">
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

function RealisticMoon() {
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
      <group scale={1.7}>
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

function FreyCloudScene({ skyMode }) {
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

            <RealisticMoon />
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
        forwardDelay,
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
        forwardTotalTime + reverseDelay,
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
        {/* <div className="flex col-span-4">
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

            <div className="">
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
            </div>
          </div>
        </div> */}

        <div className="flex flex-col col-span-8">
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

    // Low-resolution fluid simulation.
    this.simWidth = Math.max(32, Math.round(128 * Math.max(aspect, 1)));

    this.simHeight = Math.max(32, Math.round(128 / Math.max(aspect, 1)));

    // Higher-resolution reveal mask.
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

  // --------------------------------------------------
  // MOUSE INPUT
  // --------------------------------------------------

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

  // --------------------------------------------------
  // SIMULATION
  // --------------------------------------------------

  update(delta, elapsed) {
    if (this.disposed) return;

    const dt = Math.min(delta, 0.033);

    this.time = elapsed;

    // 1. Inject mouse movement into velocity and dye.
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
        splat.radius * 1.15,
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

    this.renderMaterial(this.advectionMaterial, this.dye.write);

    this.dye.swap();

    // 7. Display sharp photograph through fluid mask.
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

      const smoothing = 1 - Math.exp(-elapsed * 12);

      pointer.vx += (rawDx - pointer.vx) * smoothing;
      pointer.vy += (rawDy - pointer.vy) * smoothing;

      const dx = pointer.vx;
      const dy = pointer.vy;
      const distance = Math.hypot(x - pointer.x, y - pointer.y);

      const steps = Math.min(4, Math.max(1, Math.ceil(distance / 0.12)));

      for (let i = 1; i <= steps; i++) {
        const t = i / steps;

        simulation.addPointer(
          pointer.x + (x - pointer.x) * t,
          pointer.y + (y - pointer.y) * t,
          dx / steps,
          dy / steps,
        );
      }

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
const NewSection = () => {
  const containerRef = useRef();
  const lineRefs = useRef([]);
  const textRefs = useRef([]);

  const addToLineRefs = (el) => el && lineRefs.current.push(el);
  const addToTextRefs = (el) => el && textRefs.current.push(el);

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

      // ROW DIVIDERS
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

  return (
    <>
      <div className="relative isolate bg-[#f5f5f5]">
        <GooeyReveal
          image="/images/ajomockupchairupdated.png"
          background="#f5f5f5"
        />
        <section className="relative z-10 flex min-h-screen flex-col items-center px-8 pt-0 pb-20 md:px-16">
          <div
            ref={containerRef}
            className="relative w-full max-w-7xl mx-auto text-[11px]"
          >
            <div className="relative z-10 mx-auto w-[94%] md:w-[85%] font-neueroman font-[800] tracking-wide flex flex-col text-[1.15em]">
              <div className="relative">
                {[
                  ["2026", "6× Winner Best Orthodontist", "Best of the Valley"],
                  [
                    "2026",
                    "5× Winner Best Orthodontist",
                    "Readers' Choice The Morning Call",
                  ],
                  [
                    "2026",
                    "10× Cover Feature",
                    "American Journal of Orthodontics & Dentofacial Orthopedics",
                  ],
                  [
                    "2026",
                    "Nationally Recognized Top Orthodontist",
                    "Top Dentists",
                  ],
                  ["2026", "Invisalign", "25+ Years of Experience"],
                  ["2026", "Invisalign Teen", "5000+ Cases Treated"],
                  ["2026", "Diamond Plus", "Top 1% of All Providers"],
                ].map(([date, achievement, distinction], i) => (
                  <div
                    key={i}
                    className="
    relative grid
    grid-cols-[1fr_1.5fr_1.5fr]
    items-center
    gap-x-3 md:gap-x-6
    px-2 md:px-3
    py-1 md:py-1
  "
                  >
                    <div
                      ref={addToLineRefs}
                      className="absolute inset-x-0 bottom-0 h-[.5px] bg-[#DEDEDE] origin-center"
                      style={{ transform: "scaleX(0)" }}
                    />

                    {/* Column 1 — Date */}
                    <div className="min-w-0 overflow-hidden">
                      <div ref={addToTextRefs}>{date}</div>
                    </div>

                    {/* Column 2 — Achievement */}
                    <div className="min-w-0 overflow-hidden">
                      <div ref={addToTextRefs}>{achievement}</div>
                    </div>

                    {/* Column 3 — Distinction */}
                    <div className="min-w-0 overflow-hidden">
                      <div ref={addToTextRefs}>{distinction}</div>
                    </div>
                  </div>
                ))}

                <div className="pointer-events-none absolute left-full -top-[70px] ml-6 hidden md:block">
                  <div className="flex flex-col items-end">
                    <span className="font-neueroman text-[#C5C6C7] text-[36px] font-[600] uppercase tracking-[0.08em]">
                      Awards
                    </span>
                    <span
                      className="mt-2 ml-auto translate-x-[10px] font-neueroman text-[#C5C6C7] text-[36px] font-[600] uppercase tracking-[0.08em]"
                      style={{
                        writingMode: "vertical-rl",
                        textOrientation: "mixed",
                      }}
                    >
                      Recognitions
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
        </section>

        {/* Awards / Recognition typography */}
        <div className="pointer-events-none absolute left-full top-0 ml-6 hidden md:block">
          <div className="flex flex-col items-start">
            <span className="font-neueroman text-[12px] font-[600] uppercase tracking-[0.08em]">
              Awards
            </span>

            <span
              className="mt-2 font-neueroman text-[12px] font-[600] uppercase tracking-[0.08em]"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
              }}
            >
              Recognition
            </span>
          </div>
        </div>
        {/* Stats — directly beneath awards */}
        <div className="mx-auto mt-16 flex w-[94%] flex-wrap items-center justify-center gap-10 sm:gap-16 md:mt-20 md:w-[85%] md:gap-24">
          {/* Years of Experience */}
          <div className="flex flex-col items-center text-center">
            <p className="mb-4 font-neueroman text-[#C5C6C7] text-[12px] sm:text-[15px]">
              Years of Experience
            </p>

            <h2 className="flex items-center gap-1 font-neue-montreal text-[5rem] font-neueroman text-[#C5C6C7] leading-none sm:text-[6rem] md:text-[7rem]">
              <span
                data-target="60"
                ref={(el) => (statRefs.current[0] = el)}
                className="pointer-events-none"
              >
                0
              </span>
              <span className="text-[2rem] sm:text-[3rem]">+</span>
            </h2>
          </div>

          {/* Satisfied Patients */}
          <div className="flex flex-col items-center text-center">
            <p className="mb-4 font-neueroman text-[#C5C6C7] text-[12px] sm:text-[15px]">
              Satisfied Patients
            </p>

            <h2 className="flex items-center gap-1 font-neueroman text-[#C5C6C7] text-[5rem] leading-none sm:text-[6rem] md:text-[7rem]">
              <span
                data-target="25"
                ref={(el) => (statRefs.current[1] = el)}
                className="pointer-events-none"
              >
                0
              </span>
              <span className="text-[2rem] sm:text-[3rem]">k</span>
            </h2>
          </div>

          {/* Locations */}
          <div className="flex flex-col items-center text-center">
            <p className="mb-4 font-neueroman text-[#C5C6C7] text-[12px] sm:text-[15px]">
              Locations
            </p>

            <h2 className="font-neueroman text-[#C5C6C7] text-[5rem] leading-none sm:text-[6rem] md:text-[7rem]">
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
        mouseConstraint.mouse.mousewheel,
      );
      mouseConstraint.mouse.element.removeEventListener(
        "DOMMouseScroll",
        mouseConstraint.mouse.mousewheel,
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
          },
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
          },
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
          },
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
      },
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
          `M 0 30 Q${width * x} ${30 + progress} ${width} 30`,
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
      },
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
      { threshold: 0.5 },
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
          <motion.div
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
          </motion.div>

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
