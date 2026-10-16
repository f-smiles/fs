"use client";
import AsciiEffect from "./asciieffect.jsx";
import LocationCharacterReveal from "@/app/locations/[locationSlug]/LocationCharReveal";
import {
  KernelSize,
} from "postprocessing"
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
import { RectAreaLight } from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import React, {
  useMemo,
  useId,
  forwardRef,
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  Suspense
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
  Environment, Center 
} from "@react-three/drei";
import { Canvas, useFrame, useThree, extend, useLoader } from "@react-three/fiber";

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
function InfiniteCorridor() {
  const group = useRef()
  const scroll = useThreeScroll()

  const segmentCount = 30
  const segmentSpacing = 34
  const panelDepth = 21

  const panelOffset = 13
  const corridorWidth = panelOffset * 2

  const floorY = -6
  const corridorHeight = 26
  const ceilingY = floorY + corridorHeight
  const wallCenterY = floorY + corridorHeight / 2
  const corridorY = 4.6

  const panelPalette = [
    "#4a4a55", 
    "#756d72", 
    "#aaa39c", 
    "#d4a5a5", 
  ]

  useFrame(() => {
    if (!group.current) return

    const progress =
      scroll.offset *
      segmentCount *
      segmentSpacing

    group.current.position.z = progress * 0.8
  })

  return (
    <group
      ref={group}
      position={[0, corridorY, 0]}
    >
      {Array.from({ length: segmentCount }).map((_, i) => {
        const z = -i * segmentSpacing

        const opacity = Math.max(
          0,
          1 - (i / segmentCount) * 1.2
        )

        // Each new rectangle rotates the complete
        // lighting arrangement clockwise by 90 degrees.
        const getPanelColor = (sideIndex) => {
          const paletteIndex =
            (sideIndex - i + 4) % 4

          return panelPalette[paletteIndex]
        }

        return (
          <group
            key={i}
            position={[0, 0, z]}
          >
            {/* Left: side index 3 */}
            <mesh
              position={[
                -panelOffset,
                wallCenterY,
                0,
              ]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <planeGeometry
                args={[panelDepth, corridorHeight]}
              />

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
              position={[
                panelOffset,
                wallCenterY,
                0,
              ]}
              rotation={[0, -Math.PI / 2, 0]}
            >
              <planeGeometry
                args={[panelDepth, corridorHeight]}
              />

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
            <mesh
              position={[0, ceilingY, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <planeGeometry
                args={[corridorWidth, panelDepth]}
              />

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
            <mesh
              position={[0, floorY, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry
                args={[corridorWidth, panelDepth]}
              />

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
        )
      })}
    </group>
  )
}

const WATER_Y = -2
const RING_RADIUS = 10
const RING_SUBMERSION = 2.75

const RING_CENTER_Y =
  WATER_Y +
  RING_RADIUS -
  RING_SUBMERSION
function NeonRing({
  waterY = -2,
  submersion = 0.75,
}) {
  const group = useRef()
  const shaderRef = useRef()
  const scroll = useThreeScroll()

  const ringRadius = 10

  const ringCenterY =
    waterY +
    ringRadius -
    submersion

  const ringMaterial = useMemo(() => {
    const material =
      new THREE.MeshStandardMaterial({
        color: "#ff5b9d",
        emissive: "#ff146f",
        emissiveIntensity: 4.1,

        roughness: 0.25,
        metalness: 0.03,

        transparent: true,
        opacity: 0.98,

        toneMapped: false,
      })

    material.onBeforeCompile = (
      shader
    ) => {
      shader.uniforms.uTime = {
        value: 0,
      }

      shader.vertexShader = `
        uniform float uTime;
        ${shader.vertexShader}
      `

      shader.vertexShader =
        shader.vertexShader.replace(
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
          `
        )

      shaderRef.current = shader
    }

    material.customProgramCacheKey =
      () =>
        "animated-neon-ring-v2"

    return material
  }, [])

  useEffect(() => {
    return () => {
      ringMaterial.dispose()
    }
  }, [ringMaterial])

  useFrame(({ clock }) => {
    const time =
      clock.getElapsedTime()

    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value =
        time * 2.9
    }

    if (!group.current) return

    group.current.rotation.z =
      scroll.offset * 0.22 +
      Math.sin(time * 0.13) *
        0.008

    const breath =
      1 +
      Math.sin(time * 0.8) *
        0.0015

    group.current.scale.setScalar(
      breath
    )
  })

  return (
    <group
      ref={group}
      position={[
        0,
        ringCenterY,
        -8,
      ]}
    >
      <mesh>
        <torusGeometry
          args={[
            ringRadius,
            0.028,
            12,
            512,
          ]}
        />

        <primitive
          object={ringMaterial}
          attach="material"
        />
      </mesh>
    </group>
  )
}

function ReflectionCard({
  position,
  rotation,
  size,
  color,
  intensity = 1,
}) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
    }),
    [color, intensity]
  )

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
  )
}
function FloatingCube({
  waterY = WATER_Y,
  position = [-5, 0, 2],
  size = 2.4,
}) {
  const floatRef = useRef()
  const cubeRef = useRef()
  const cameraRef = useRef()

  const restingY =
    waterY + size * 0.42



  useEffect(() => {
    if (!cameraRef.current) return

    cameraRef.current.traverse(
      (object) => {
        if (object.isCamera) {
          object.layers.enable(1)
        }
      }
    )
  }, [])

  useFrame(({ clock }, delta) => {
    if (
      !floatRef.current ||
      !cubeRef.current
    ) {
      return
    }

    const time =
      clock.getElapsedTime()

    const targetY =
      restingY +
      Math.sin(time * 0.85) *
        0.16 +
      Math.sin(time * 1.7) *
        0.035

    floatRef.current.position.y =
      THREE.MathUtils.damp(
        floatRef.current.position.y,
        targetY,
        3.5,
        delta
      )

    cubeRef.current.rotation.x =
      Math.sin(time * 0.72) *
      0.075

    cubeRef.current.rotation.z =
      Math.sin(
        time * 0.58 + 1.2
      ) * 0.095

    cubeRef.current.rotation.y +=
      delta * 0.035
  })

  return (
    <group
      ref={floatRef}
      position={[
        position[0],
        restingY,
        position[2],
      ]}
    >
{/* Mauve frontal reflection */}
<ReflectionCard
  position={[
    0,
    size * 0.45,
    size * 2,
  ]}
  rotation={[
    0,
    Math.PI,
    0,
  ]}
  size={size * 2.7}
  color="#e2bfd2"
  intensity={2.0}
/>

{/* Pale lilac highlight */}
<ReflectionCard
  position={[
    -size * 1.8,
    size * 0.25,
    0,
  ]}
  rotation={[
    0,
    Math.PI / 2,
    0,
  ]}
  size={size * 2.2}
  color="#f5e3ed"
  intensity={2.6}
/>

{/* Deeper purple-rose overhead reflection */}
<ReflectionCard
  position={[
    0,
    size * 1.9,
    0,
  ]}
  rotation={[
    Math.PI / 2,
    0,
    0,
  ]}
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
      args={[
        size,
        size,
        size,
      ]}
      radius={size * 0.008}
      smoothness={4}
    >
<meshPhysicalMaterial
  color="#d9b4c7"

  envMap={cubeEnvironment}
  envMapIntensity={3.0}

  // Still convincingly metallic, but permits
  // a little more illuminated surface color.
  metalness={0.9}
  roughness={0.12}

  clearcoat={1}
  clearcoatRoughness={0.025}

  // Stable purple floor during dark rotations.
  emissive="#684b65"
  emissiveIntensity={0.1}

  transparent={false}
  transmission={0}
/>
    </RoundedBox>
  )}
</CubeCamera>
    </group>
  )
}
const OceanScene = () => {
  const scroll = useThreeScroll()
  const { scene, gl, camera } =
    useThree()

  const waterRef = useRef()
  const smoothedScroll = useRef(0)
  const enteredPortalRef =
    useRef(false)

  const [
    enteredPortal,
    setEnteredPortal,
  ] = useState(false)

  useEffect(() => {
    const previousFog = scene.fog

    const previousEnvironment =
      scene.environment

    const previousToneMapping =
      gl.toneMapping

    const previousExposure =
      gl.toneMappingExposure

    const previousClearColor =
      new THREE.Color()

    gl.getClearColor(
      previousClearColor
    )

    const previousClearAlpha =
      gl.getClearAlpha()

    const horizonColor =
      0x66545c

    scene.fog =
      new THREE.FogExp2(
        horizonColor,
        0.0016
      )

    gl.setClearColor(
      0x000000,
      0
    )

    gl.outputEncoding =
      THREE.sRGBEncoding

    gl.toneMapping =
      THREE.ACESFilmicToneMapping

    gl.toneMappingExposure =
      0.95

    const waterNormals =
      new THREE.TextureLoader().load(
        "https://threejs.org/examples/textures/waternormals.jpg"
      )

    waterNormals.wrapS =
      THREE.RepeatWrapping

    waterNormals.wrapT =
      THREE.RepeatWrapping

    const water = new Water(
      new THREE.PlaneGeometry(
        10000,
        10000
      ),
      {
        textureWidth: 512,
        textureHeight: 512,

        waterNormals,

        sunDirection:
          new THREE.Vector3(),

        sunColor: 0xffbdcc,
        waterColor: 0x242126,

        distortionScale: 3.2,
        fog: true,
      }
    )

    water.rotation.x =
      -Math.PI / 2

    water.position.y =
      WATER_Y

    scene.add(water)
    waterRef.current = water

    const sky = new Sky()

    sky.scale.setScalar(10000)

    const skyUniforms =
      sky.material.uniforms

    skyUniforms.turbidity.value =
      12

    skyUniforms.rayleigh.value =
      1.25

    skyUniforms.mieCoefficient.value =
      0.012

    skyUniforms.mieDirectionalG.value =
      0.86

    sky.material.onBeforeCompile = (
      shader
    ) => {
      shader.fragmentShader =
        shader.fragmentShader.replace(
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
          `
        )
    }

    sky.material.needsUpdate =
      true

    scene.add(sky)

    const sun =
      new THREE.Vector3()

    const theta =
      Math.PI *
      (0.495 - 0.47)

    const phi =
      2 *
      Math.PI *
      (0.205 - 0.5)

    sun.x = Math.cos(phi)

    sun.y =
      Math.sin(phi) *
      Math.sin(theta)

    sun.z =
      Math.sin(phi) *
      Math.cos(theta)

    skyUniforms.sunPosition.value.copy(
      sun
    )
RectAreaLightUniformsLib.init()

const cubeCenter = new THREE.Vector3(
  -26.5,
  WATER_Y + 7.4 * 0.42,
  -27
)

const cubeKeyLight =
  new THREE.RectAreaLight(
    0xe1b4ca,
    7.5,
    18,
    22
  )

cubeKeyLight.position.set(
  -14,
  11,
  -12
)

cubeKeyLight.lookAt(cubeCenter)

const cubeFillLight =
  new THREE.RectAreaLight(
    0x9f899f,
    2.2,
    14,
    18
  )

cubeFillLight.position.set(
  -39,
  5,
  -19
)

cubeFillLight.lookAt(cubeCenter)

const cubeGlintLight =
  new THREE.PointLight(
    0xf6becf,
    1.8,
    35,
    2
  )
cubeGlintLight.position.set(
  -21,
  WATER_Y + 5,
  -19
)

scene.add(
  cubeKeyLight,
  cubeFillLight,
  cubeGlintLight
)
    water.material.uniforms.sunDirection.value
      .copy(sun)
      .normalize()

    const pmrem =
      new THREE.PMREMGenerator(gl)

    const environmentTarget =
      pmrem.fromScene(sky)

    scene.environment =
      environmentTarget.texture

    return () => {
scene.remove(
  water,
  sky,
  cubeKeyLight,
  cubeFillLight,
  cubeGlintLight
)

      scene.fog = previousFog

      scene.environment =
        previousEnvironment

      gl.toneMapping =
        previousToneMapping

      gl.toneMappingExposure =
        previousExposure

      gl.setClearColor(
        previousClearColor,
        previousClearAlpha
      )

      waterRef.current = null

      water.geometry.dispose()
      water.material.dispose()
      waterNormals.dispose()

      sky.geometry.dispose()
      sky.material.dispose()

      environmentTarget.dispose()
      pmrem.dispose()
    }
  }, [scene, gl])

  useFrame((_, delta) => {
    smoothedScroll.current =
      THREE.MathUtils.damp(
        smoothedScroll.current,
        scroll.offset,
        6,
        delta
      )

    const t =
      THREE.MathUtils.smoothstep(
        smoothedScroll.current,
        0,
        1
      )

    const cameraZ =
      THREE.MathUtils.lerp(
        35,
        -70,
        t
      )

    camera.position.set(
      0,
      RING_CENTER_Y,
      cameraZ
    )

    camera.lookAt(
      0,
      RING_CENTER_Y,
      cameraZ - 100
    )

    const shouldEnterPortal =
      cameraZ <= -5

    if (
      shouldEnterPortal !==
      enteredPortalRef.current
    ) {
      enteredPortalRef.current =
        shouldEnterPortal

      setEnteredPortal(
        shouldEnterPortal
      )
    }

    if (waterRef.current) {
      waterRef.current.material.uniforms
        .time.value +=
        delta * 0.18
    }
  })

  return (
    <>
    <NeonRing
  waterY={WATER_Y}
  submersion={RING_SUBMERSION}
/>

<FloatingCube
  waterY={WATER_Y}
  position={[-26.5, 0, -27]}
  size={7.4}
/>

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
  )
}
const ScrollTracker = ({ onScrollChange }) => {
  const scroll = useThreeScroll();

  useFrame(() => {
    onScrollChange(scroll.offset);
  });

  return null;
};



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
      {/* <div style={{ height: '100vh', width: '100vw' }}>
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
    </div> */}
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
      <div style={{ overflowX: "hidden" }}>
        <div class="MainContainer">
          <div class="ParallaxContainer">
            <Hero/>
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
      </div>
    </>
  );
}

// Each entry: [turno, pathData, optionalTransform] — order preserved from the original SVG
const DOTS = [
  [0.122, "M78.5717 69.0132C87.533 74.3884 92.0136 80.4671 92.0136 87.2339C92.0136 94.406 87.533 100.584 78.5717 105.761C69.6104 110.945 58.7529 113.529 46.0068 113.529C33.2607 113.529 21.8985 111.044 13.1437 106.059C4.38124 101.081 0 94.8112 0 87.2339C0 80.0618 4.38124 73.8914 13.1437 68.7073C21.8985 63.5385 32.8631 60.9388 46.0068 60.9388C59.1505 60.9388 69.6104 63.6303 78.5717 69.0055V69.0132Z"],
  [0.8415, "M78.5717 129.364C87.533 134.739 92.0136 140.818 92.0136 147.585C92.0136 154.757 87.533 160.935 78.5717 166.111C69.6104 171.296 58.7529 173.88 46.0068 173.88C33.2607 173.88 21.8985 171.395 13.1437 166.41C4.37359 161.432 0 155.162 0 147.585C0 140.413 4.38124 134.242 13.1437 129.058C21.8985 123.889 32.8631 121.29 46.0068 121.29C59.1505 121.29 69.6104 123.981 78.5717 129.356V129.364Z"],
  [0.3415, "M78.5717 311.006C87.533 316.381 92.0136 322.46 92.0136 329.226C92.0136 336.399 87.533 342.577 78.5717 347.753C69.6104 352.937 58.7529 355.522 46.0068 355.522C33.2607 355.522 21.8985 353.037 13.1437 348.051C4.37359 343.074 0 336.804 0 329.226C0 322.054 4.38124 315.884 13.1437 310.7C21.8985 305.531 32.8631 302.931 46.0068 302.931C59.1505 302.931 69.6104 305.623 78.5717 310.998V311.006Z"],
  [0.6341, "M182.842 8.66221C192.002 14.0374 196.582 20.1161 196.582 26.883C196.582 34.055 191.995 40.2331 182.842 45.4095C173.674 50.5936 162.725 53.178 149.979 53.178C137.233 53.178 126.375 50.693 117.414 45.7077C108.453 40.7301 103.972 34.4603 103.972 26.883C103.972 19.7109 108.453 13.5404 117.414 8.35637C126.375 3.18758 137.225 0.587891 149.979 0.587891C162.733 0.587891 173.674 3.27933 182.842 8.65456V8.66221Z"],
  [0.7073, "M182.842 189.715C192.002 195.09 196.582 201.169 196.582 207.936C196.582 215.108 191.995 221.286 182.842 226.462C173.674 231.647 162.725 234.231 149.979 234.231C137.233 234.231 126.375 231.746 117.414 226.761C108.453 221.783 103.972 215.513 103.972 207.936C103.972 200.764 108.453 194.593 117.414 189.409C126.375 184.24 137.225 181.641 149.979 181.641C162.733 181.641 173.674 184.332 182.842 189.707V189.715Z"],
  [0.0244, "M182.842 371.655C192.002 377.237 196.582 383.407 196.582 390.182C196.582 396.956 191.995 402.935 182.842 408.104C173.674 413.288 162.725 415.873 149.979 415.873C137.233 415.873 126.375 413.388 117.414 408.402C108.453 403.425 103.972 397.346 103.972 390.182C103.972 383.017 108.453 376.74 117.414 371.357C126.375 365.981 137.225 363.29 149.979 363.29C162.733 363.29 173.674 366.081 182.842 371.655Z"],
  [0.8537, "M287.112 8.66221C296.074 14.0374 300.554 20.1161 300.554 26.883C300.554 34.055 296.074 40.2331 287.112 45.4095C278.151 50.5936 267.294 53.178 254.548 53.178C241.801 53.178 230.439 50.693 221.684 45.7077C212.914 40.7301 208.541 34.4603 208.541 26.883C208.541 19.7109 212.922 13.5404 221.684 8.35637C230.439 3.18758 241.404 0.587891 254.548 0.587891C267.691 0.587891 278.151 3.27933 287.112 8.65456V8.66221Z"],
  [0.4756, "M287.112 189.715C296.074 195.09 300.554 201.169 300.554 207.936C300.554 215.108 296.074 221.286 287.112 226.462C278.151 231.647 267.294 234.231 254.548 234.231C241.801 234.231 230.439 231.746 221.684 226.761C212.914 221.783 208.541 215.513 208.541 207.936C208.541 200.764 212.922 194.593 221.684 189.409C230.439 184.24 241.404 181.641 254.548 181.641C267.691 181.641 278.151 184.332 287.112 189.707V189.715Z"],
  [0.9268, "M287.112 371.655C296.074 377.237 300.554 383.407 300.554 390.182C300.554 396.956 296.074 402.935 287.112 408.104C278.151 413.288 267.294 415.873 254.548 415.873C241.801 415.873 230.439 413.388 221.684 408.402C212.914 403.425 208.541 397.346 208.541 390.182C208.541 383.017 212.922 376.74 221.684 371.357C230.439 365.981 241.404 363.29 254.548 363.29C267.691 363.29 278.151 366.081 287.112 371.655Z"],
  [0.6463, "M391.077 8.66221C400.428 14.0374 405.115 20.1161 405.115 26.883C405.115 34.055 400.428 40.2331 391.077 45.4095C381.71 50.5936 370.654 53.178 357.916 53.178C345.177 53.178 334.404 50.693 325.649 45.7077C316.879 40.7301 312.505 34.4603 312.505 26.883C312.505 19.7109 316.886 13.5404 325.649 8.35637C334.404 3.18758 345.162 0.587891 357.916 0.587891C370.669 0.587891 381.71 3.27933 391.077 8.65456V8.66221Z"],
  [0.2195, "M391.077 189.715C400.428 195.09 405.115 201.169 405.115 207.936C405.115 215.108 400.428 221.286 391.077 226.462C381.71 231.647 370.654 234.231 357.916 234.231C345.177 234.231 334.404 231.746 325.649 226.761C316.879 221.783 312.505 215.513 312.505 207.936C312.505 200.764 316.886 194.593 325.649 189.409C334.404 184.24 345.162 181.641 357.916 181.641C370.669 181.641 381.71 184.332 391.077 189.707V189.715Z"],
  [0.439, "M391.077 371.655C400.428 377.237 405.115 383.407 405.115 390.182C405.115 396.956 400.428 402.935 391.077 408.104C381.71 413.288 370.654 415.873 357.916 415.873C345.177 415.873 334.404 413.388 325.649 408.402C316.879 403.425 312.505 397.346 312.505 390.182C312.505 383.017 316.886 376.74 325.649 371.357C334.404 365.981 345.162 363.29 357.916 363.29C370.669 363.29 381.71 366.081 391.077 371.655Z"],
  [0.4878, "M496.242 69.0132C505.203 74.3884 509.684 80.4671 509.684 87.2339C509.684 94.406 505.203 100.584 496.242 105.761C487.281 110.945 476.423 113.529 463.677 113.529C450.931 113.529 439.569 111.044 430.814 106.059C422.051 101.081 417.67 94.8112 417.67 87.2339C417.67 80.0618 422.051 73.8914 430.814 68.7073C439.569 63.5385 450.533 60.9388 463.677 60.9388C476.821 60.9388 487.281 63.6303 496.242 69.0055V69.0132Z"],
  [0.6951, "M496.242 250.662C505.203 256.038 509.684 262.116 509.684 268.883C509.684 276.055 505.203 282.233 496.242 287.41C487.281 292.594 476.423 295.178 463.677 295.178C450.931 295.178 439.569 292.693 430.814 287.708C422.051 282.73 417.67 276.461 417.67 268.883C417.67 261.711 422.051 255.541 430.814 250.357C439.569 245.188 450.533 242.588 463.677 242.588C476.821 242.588 487.281 245.28 496.242 250.655V250.662Z"],
  [0.9024, "M496.242 311.006C505.203 316.381 509.684 322.46 509.684 329.226C509.684 336.399 505.203 342.577 496.242 347.753C487.281 352.937 476.423 355.522 463.677 355.522C450.931 355.522 439.569 353.037 430.814 348.051C422.051 343.074 417.67 336.804 417.67 329.226C417.67 322.054 422.051 315.884 430.814 310.7C439.569 305.531 450.533 302.931 463.677 302.931C476.821 302.931 487.281 305.623 496.242 310.998V311.006Z"],
  [0.7927, "M601.396 8.36487C607.567 13.9466 610.656 20.117 610.656 26.8915C610.656 34.0635 607.666 40.2416 601.694 45.4181C595.723 50.6021 588.742 53.1865 580.782 53.1865C572.417 53.1865 565.543 50.7015 560.168 45.7163C554.793 40.7386 552.102 34.4688 552.102 26.8915C552.102 19.7194 554.885 13.4496 560.466 8.06667C566.04 2.69144 572.807 0 580.782 0C588.344 0 595.218 2.79084 601.396 8.36487Z"],
  [0.0122, "M601.396 68.7158C607.567 74.2975 610.656 80.4679 610.656 87.2424C610.656 94.4145 607.666 100.593 601.694 105.769C595.723 110.953 588.742 113.537 580.782 113.537C572.417 113.537 565.543 111.052 560.168 106.067C554.793 101.09 552.102 94.8197 552.102 87.2424C552.102 80.0703 554.885 73.8005 560.466 68.4176C566.04 63.0424 572.807 60.351 580.782 60.351C588.344 60.351 595.218 63.1418 601.396 68.7158Z"],
  [0.0854, "M601.396 129.067C607.567 134.648 610.656 140.819 610.656 147.593C610.656 154.765 607.666 160.944 601.694 166.12C595.723 171.304 588.742 173.888 580.782 173.888C572.417 173.888 565.543 171.403 560.168 166.418C554.793 161.441 552.102 155.171 552.102 147.593C552.102 140.421 554.885 134.151 560.466 128.769C566.04 123.393 572.807 120.702 580.782 120.702C588.344 120.702 595.218 123.493 601.396 129.067Z"],
  [0, "M601.396 189.418C607.567 194.999 610.656 201.17 610.656 207.944C610.656 215.116 607.666 221.294 601.694 226.471C595.723 231.655 588.742 234.239 580.782 234.239C572.417 234.239 565.543 231.754 560.168 226.769C554.793 221.791 552.102 215.522 552.102 207.944C552.102 200.772 554.885 194.502 560.466 189.12C566.04 183.744 572.807 181.053 580.782 181.053C588.344 181.053 595.218 183.844 601.396 189.418Z"],
  [0.3171, "M601.396 250.365C607.567 255.947 610.656 262.117 610.656 268.892C610.656 276.064 607.666 282.242 601.694 287.418C595.723 292.602 588.742 295.187 580.782 295.187C572.417 295.187 565.543 292.702 560.168 287.716C554.793 282.739 552.102 276.469 552.102 268.892C552.102 261.72 554.885 255.45 560.466 250.067C566.04 244.692 572.807 242 580.782 242C588.344 242 595.218 244.791 601.396 250.365Z"],
  [0.1098, "M601.396 310.708C607.567 316.29 610.656 322.461 610.656 329.235C610.656 336.407 607.666 342.585 601.694 347.762C595.723 352.946 588.742 355.53 580.782 355.53C572.417 355.53 565.543 353.045 560.168 348.06C554.793 343.082 552.102 336.812 552.102 329.235C552.102 322.063 554.885 315.793 560.466 310.41C566.04 305.035 572.807 302.344 580.782 302.344C588.344 302.344 595.218 305.134 601.396 310.708Z"],
  [0.7439, "M601.396 371.656C607.567 377.237 610.656 383.408 610.656 390.182C610.656 397.354 607.666 403.533 601.694 408.709C595.723 413.893 588.742 416.477 580.782 416.477C572.417 416.477 565.543 413.992 560.168 409.007C554.793 404.03 552.102 397.76 552.102 390.182C552.102 383.01 554.885 376.74 560.466 371.358C566.04 365.982 572.807 363.291 580.782 363.291C588.344 363.291 595.218 366.082 601.396 371.656Z"],
  [0.1341, "M669.814 8.36487C675.785 13.9466 678.775 20.117 678.775 26.8915C678.775 34.0635 675.877 40.2416 670.112 45.4181C664.332 50.6021 657.465 53.1865 649.498 53.1865C641.133 53.1865 634.16 50.7015 628.586 45.7163C623.004 40.7386 620.221 34.4688 620.221 26.8915C620.221 19.7194 623.104 13.4496 628.884 8.06667C634.657 2.69144 641.523 0 649.498 0C657.06 0 663.842 2.79084 669.814 8.36487Z"],
  [0.939, "M669.814 189.418C675.785 194.999 678.775 201.17 678.775 207.944C678.775 215.116 675.877 221.294 670.112 226.471C664.332 231.655 657.465 234.239 649.498 234.239C641.133 234.239 634.16 231.754 628.586 226.769C623.004 221.791 620.221 215.522 620.221 207.944C620.221 200.772 623.104 194.502 628.884 189.12C634.657 183.744 641.523 181.053 649.498 181.053C657.06 181.053 663.842 183.844 669.814 189.418Z"],
  [0.0976, "M737.635 8.36487C743.805 13.9466 746.895 20.117 746.895 26.8915C746.895 34.0635 743.905 40.2416 737.933 45.4181C731.962 50.6021 724.79 53.1865 716.425 53.1865C708.06 53.1865 701.186 50.7015 695.811 45.7163C690.435 40.7386 687.744 34.4688 687.744 26.8915C687.744 19.7194 690.527 13.4496 696.109 8.06667C701.683 2.69144 708.45 0 716.425 0C724.4 0 731.457 2.79084 737.635 8.36487Z"],
  [0.4146, "M737.635 189.418C743.805 194.999 746.895 201.17 746.895 207.944C746.895 215.116 743.905 221.294 737.933 226.471C731.962 231.655 724.79 234.239 716.425 234.239C708.06 234.239 701.186 231.754 695.811 226.769C690.435 221.791 687.744 215.522 687.744 207.944C687.744 200.772 690.527 194.502 696.109 189.12C701.683 183.744 708.45 181.053 716.425 181.053C724.4 181.053 731.457 183.844 737.635 189.418Z"],
  [0.2683, "M804.852 8.36487C810.824 13.9466 813.814 20.117 813.814 26.8915C813.814 34.0635 810.916 40.2416 805.15 45.4181C799.37 50.6021 792.504 53.1865 784.537 53.1865C776.172 53.1865 769.198 50.7015 763.624 45.7163C758.043 40.7386 755.259 34.4688 755.259 26.8915C755.259 19.7194 758.142 13.4496 763.922 8.06667C769.695 2.69144 776.562 0 784.537 0C792.099 0 798.881 2.79084 804.852 8.36487Z"],
  [0.7195, "M804.852 189.418C810.824 194.999 813.814 201.17 813.814 207.944C813.814 215.116 810.916 221.294 805.15 226.471C799.37 231.655 792.504 234.239 784.537 234.239C776.172 234.239 769.198 231.754 763.624 226.769C758.043 221.791 755.259 215.522 755.259 207.944C755.259 200.772 758.142 194.502 763.922 189.12C769.695 183.744 776.562 181.053 784.537 181.053C792.099 181.053 798.881 183.844 804.852 189.418Z"],
  // F: top bar extends one column further (the P's upper bowl dot moved up to row 1);
  // the P's lower bowl dot is removed, so the middle bar stays shorter than the top bar.
  [0.1951, "M873.568 68.7158C879.54 74.2975 882.529 80.4679 882.529 87.2424C882.529 94.4145 879.632 100.593 873.866 105.769C868.086 110.953 861.22 113.537 853.252 113.537C844.49 113.537 837.417 111.052 832.042 106.067C826.667 101.09 823.975 94.8197 823.975 87.2424C823.975 80.0703 826.758 73.8005 832.34 68.4176C837.914 63.0424 844.887 60.351 853.252 60.351C860.814 60.351 867.596 63.1418 873.568 68.7158Z", "translate(0 -60.351)"],
  [0.0366, "M933.917 9.26199C936.311 14.6372 937.503 20.5247 937.503 26.8863C937.503 34.0584 936.402 40.2365 934.215 45.4129C932.021 50.597 929.33 53.1814 926.149 53.1814C922.968 53.1814 920.368 50.597 918.38 45.4129C916.385 40.2441 915.391 34.0584 915.391 26.8863C915.391 20.1195 916.484 14.1402 918.679 8.96379C920.865 3.795 923.358 1.19531 926.149 1.19531C928.94 1.19531 931.524 3.88675 933.917 9.26199Z"],
  [0.8659, "M933.917 69.6129C936.311 74.9882 937.503 80.8757 937.503 87.2373C937.503 94.4094 936.402 100.587 934.215 105.764C932.021 110.948 929.33 113.532 926.149 113.532C922.968 113.532 920.368 110.948 918.38 105.764C916.385 100.595 915.391 94.4094 915.391 87.2373C915.391 80.4705 916.484 74.4912 918.679 69.3147C920.865 64.146 923.358 61.5463 926.149 61.5463C928.94 61.5463 931.524 64.2377 933.917 69.6129Z"],
  [0.4634, "M933.917 129.964C936.311 135.339 937.503 141.227 937.503 147.588C937.503 154.76 936.402 160.938 934.215 166.115C932.021 171.299 929.33 173.883 926.149 173.883C922.968 173.883 920.368 171.299 918.38 166.115C916.385 160.946 915.391 154.76 915.391 147.588C915.391 140.821 916.484 134.842 918.679 129.666C920.865 124.497 923.358 121.897 926.149 121.897C928.94 121.897 931.524 124.589 933.917 129.964Z"],
  [0.5122, "M933.917 190.315C936.311 195.69 937.503 201.578 937.503 207.939C937.503 215.111 936.402 221.289 934.215 226.466C932.021 231.65 929.33 234.234 926.149 234.234C922.968 234.234 920.368 231.65 918.38 226.466C916.385 221.297 915.391 215.111 915.391 207.939C915.391 201.172 916.484 195.193 918.679 190.017C920.865 184.848 923.358 182.248 926.149 182.248C928.94 182.248 931.524 184.94 933.917 190.315Z"],
  [0.1585, "M933.917 251.262C936.311 256.637 937.503 262.525 937.503 268.887C937.503 276.059 936.402 282.237 934.215 287.413C932.021 292.597 929.33 295.182 926.149 295.182C922.968 295.182 920.368 292.597 918.38 287.413C916.385 282.244 915.391 276.059 915.391 268.887C915.391 262.12 916.484 256.14 918.679 250.964C920.865 245.795 923.358 243.196 926.149 243.196C928.94 243.196 931.524 245.887 933.917 251.262Z"],
  [0.8171, "M933.917 311.613C936.311 316.988 937.503 322.876 937.503 329.238C937.503 336.41 936.402 342.588 934.215 347.764C932.021 352.948 929.33 355.533 926.149 355.533C922.968 355.533 920.368 352.948 918.38 347.764C916.385 342.595 915.391 336.41 915.391 329.238C915.391 322.471 916.484 316.491 918.679 311.315C920.865 306.146 923.358 303.546 926.149 303.546C928.94 303.546 931.524 306.238 933.917 311.613Z"],
  [0.2317, "M933.917 372.262C936.311 377.844 937.503 383.823 937.503 390.185C937.503 396.959 936.402 402.939 934.215 408.107C932.021 413.292 929.33 415.876 926.149 415.876C922.968 415.876 920.368 413.292 918.38 408.107C916.385 402.939 915.391 396.959 915.391 390.185C915.391 383.41 916.484 377.339 918.679 371.964C920.865 366.589 923.358 363.897 926.149 363.897C928.94 363.897 931.524 366.688 933.917 372.262Z"],
  [0.6585, "M962.896 9.26199C965.083 14.6372 966.184 20.5247 966.184 26.8863C966.184 34.0584 965.182 40.2365 963.194 45.4129C961.199 50.597 958.607 53.1814 955.426 53.1814C952.245 53.1814 949.546 50.597 947.359 45.4129C945.165 40.2441 944.071 34.0584 944.071 26.8863C944.071 20.1195 945.264 14.1402 947.657 8.96379C950.051 3.795 952.635 1.19531 955.426 1.19531C958.217 1.19531 960.702 3.88675 962.896 9.26199Z"],
  [0.3659, "M962.896 190.315C965.083 195.69 966.184 201.578 966.184 207.939C966.184 215.111 965.182 221.289 963.194 226.466C961.199 231.65 958.607 234.234 955.426 234.234C952.245 234.234 949.546 231.65 947.359 226.466C945.165 221.297 944.071 215.111 944.071 207.939C944.071 201.172 945.264 195.193 947.657 190.017C950.051 184.848 952.635 182.248 955.426 182.248C958.217 182.248 960.702 184.94 962.896 190.315Z"],
  [0.9634, "M991.875 9.26199C994.268 14.6372 995.461 20.5247 995.461 26.8863C995.461 34.0584 994.36 40.2365 992.173 45.4129C989.979 50.597 987.287 53.1814 984.106 53.1814C980.926 53.1814 978.326 50.597 976.338 45.4129C974.342 40.2441 973.348 34.0584 973.348 26.8863C973.348 20.1195 974.442 14.1402 976.636 8.96379C978.823 3.795 981.316 1.19531 984.106 1.19531C986.897 1.19531 989.482 3.88675 991.875 9.26199Z"],
  [0.2439, "M991.875 190.315C994.268 195.69 995.461 201.578 995.461 207.939C995.461 215.111 994.36 221.289 992.173 226.466C989.979 231.65 987.287 234.234 984.106 234.234C980.926 234.234 978.326 231.65 976.338 226.466C974.342 221.297 973.348 215.111 973.348 207.939C973.348 201.172 974.442 195.193 976.636 190.017C978.823 184.848 981.316 182.248 984.106 182.248C986.897 182.248 989.482 184.94 991.875 190.315Z"],
  [0.7317, "M991.875 251.262C994.268 256.637 995.461 262.525 995.461 268.887C995.461 276.059 994.36 282.237 992.173 287.413C989.979 292.597 987.287 295.182 984.106 295.182C980.926 295.182 978.326 292.597 976.338 287.413C974.342 282.244 973.348 276.059 973.348 268.887C973.348 262.12 974.442 256.14 976.636 250.964C978.823 245.795 981.316 243.196 984.106 243.196C986.897 243.196 989.482 245.887 991.875 251.262Z"],
  [0.4512, "M1020.56 9.26199C1022.95 14.6372 1024.14 20.5247 1024.14 26.8863C1024.14 34.0584 1023.04 40.2365 1020.85 45.4129C1018.66 50.597 1015.97 53.1814 1012.79 53.1814C1009.61 53.1814 1007.01 50.597 1005.02 45.4129C1003.02 40.2441 1002.03 34.0584 1002.03 26.8863C1002.03 20.1195 1003.12 14.1402 1005.32 8.96379C1007.5 3.795 1010 1.19531 1012.79 1.19531C1015.58 1.19531 1018.16 3.88675 1020.56 9.26199Z"],
  [0.9146, "M1020.56 190.315C1022.95 195.69 1024.14 201.578 1024.14 207.939C1024.14 215.111 1023.04 221.289 1020.85 226.466C1018.66 231.65 1015.97 234.234 1012.79 234.234C1009.61 234.234 1007.01 231.65 1005.02 226.466C1003.02 221.297 1002.03 215.111 1002.03 207.939C1002.03 201.172 1003.12 195.193 1005.32 190.017C1007.5 184.848 1010 182.248 1012.79 182.248C1015.58 182.248 1018.16 184.94 1020.56 190.315Z"],
  [0.9756, "M1020.56 311.613C1022.95 316.988 1024.14 322.876 1024.14 329.238C1024.14 336.41 1023.04 342.588 1020.85 347.764C1018.66 352.948 1015.97 355.533 1012.79 355.533C1009.61 355.533 1007.01 352.948 1005.02 347.764C1003.02 342.595 1002.03 336.41 1002.03 329.238C1002.03 322.471 1003.12 316.491 1005.32 311.315C1007.5 306.146 1010 303.546 1012.79 303.546C1015.58 303.546 1018.16 306.238 1020.56 311.613Z"],
  [0.5976, "M1049.83 69.6129C1052.23 74.9882 1053.42 80.8757 1053.42 87.2373C1053.42 94.4094 1052.32 100.587 1050.13 105.764C1047.94 110.948 1045.25 113.532 1042.06 113.532C1038.88 113.532 1036.28 110.948 1034.3 105.764C1032.3 100.595 1031.31 94.4094 1031.31 87.2373C1031.31 80.4705 1032.4 74.4912 1034.59 69.3147C1036.78 64.146 1039.27 61.5463 1042.06 61.5463C1044.86 61.5463 1047.44 64.2377 1049.83 69.6129Z"],
  [0.2927, "M1049.83 129.964C1052.23 135.339 1053.42 141.227 1053.42 147.588C1053.42 154.76 1052.32 160.938 1050.13 166.115C1047.94 171.299 1045.25 173.883 1042.06 173.883C1038.88 173.883 1036.28 171.299 1034.3 166.115C1032.3 160.946 1031.31 154.76 1031.31 147.588C1031.31 140.821 1032.4 134.842 1034.59 129.666C1036.78 124.497 1039.27 121.897 1042.06 121.897C1044.86 121.897 1047.44 124.589 1049.83 129.964Z"],
  [0.622, "M1049.83 372.262C1052.23 377.844 1053.42 383.823 1053.42 390.185C1053.42 396.959 1052.32 402.939 1050.13 408.107C1047.94 413.292 1045.25 415.876 1042.06 415.876C1038.88 415.876 1036.28 413.292 1034.3 408.107C1032.3 402.939 1031.31 396.959 1031.31 390.185C1031.31 383.41 1032.4 377.339 1034.59 371.964C1036.78 366.589 1039.27 363.897 1042.06 363.897C1044.86 363.897 1047.44 366.688 1049.83 372.262Z"],
  [0.2561, "M1089.27 9.26199C1090.86 14.6372 1091.66 20.5247 1091.66 26.8863C1091.66 33.6608 1090.96 39.7318 1089.57 45.1071C1088.17 50.4823 1086.48 53.1738 1084.49 53.1738C1082.1 53.1738 1080.31 50.4823 1079.12 45.1071C1077.92 39.7318 1077.33 33.6608 1077.33 26.8863C1077.33 20.5171 1078.02 14.6372 1079.42 9.26199C1080.81 3.88675 1082.5 1.19531 1084.5 1.19531C1086.09 1.19531 1087.68 3.88675 1089.28 9.26199H1089.27Z"],
  [0.4024, "M1089.27 69.613C1090.86 74.9882 1091.66 80.8757 1091.66 87.2373C1091.66 94.0118 1090.96 100.083 1089.57 105.458C1088.17 110.833 1086.48 113.525 1084.49 113.525C1082.1 113.525 1080.31 110.833 1079.12 105.458C1077.92 100.083 1077.33 94.0118 1077.33 87.2373C1077.33 80.8681 1078.02 74.9882 1079.42 69.613C1080.81 64.2377 1082.5 61.5463 1084.5 61.5463C1086.09 61.5463 1087.68 64.2377 1089.28 69.613H1089.27Z"],
  [0.561, "M1089.27 129.964C1090.86 135.339 1091.66 141.227 1091.66 147.588C1091.66 154.363 1090.96 160.434 1089.57 165.809C1088.17 171.184 1086.48 173.876 1084.49 173.876C1082.1 173.876 1080.31 171.184 1079.12 165.809C1077.92 160.434 1077.33 154.363 1077.33 147.588C1077.33 141.219 1078.02 135.339 1079.42 129.964C1080.81 124.589 1082.5 121.897 1084.5 121.897C1086.09 121.897 1087.68 124.589 1089.28 129.964H1089.27Z"],
  [0.6829, "M1089.27 190.315C1090.86 195.69 1091.66 201.578 1091.66 207.939C1091.66 214.714 1090.96 220.785 1089.57 226.16C1088.17 231.535 1086.48 234.227 1084.49 234.227C1082.1 234.227 1080.31 231.535 1079.12 226.16C1077.92 220.785 1077.33 214.714 1077.33 207.939C1077.33 201.57 1078.02 195.69 1079.42 190.315C1080.81 184.94 1082.5 182.248 1084.5 182.248C1086.09 182.248 1087.68 184.94 1089.28 190.315H1089.27Z"],
  [0.8293, "M1089.27 251.262C1090.86 256.637 1091.66 262.525 1091.66 268.887C1091.66 275.661 1090.96 281.732 1089.57 287.107C1088.17 292.483 1086.48 295.174 1084.49 295.174C1082.1 295.174 1080.31 292.483 1079.12 287.107C1077.92 281.732 1077.33 275.661 1077.33 268.887C1077.33 262.517 1078.02 256.637 1079.42 251.262C1080.81 245.887 1082.5 243.196 1084.5 243.196C1086.09 243.196 1087.68 245.887 1089.28 251.262H1089.27Z"],
  [0.878, "M1089.27 311.613C1090.86 316.988 1091.66 322.876 1091.66 329.238C1091.66 336.012 1090.96 342.083 1089.57 347.458C1088.17 352.834 1086.48 355.525 1084.49 355.525C1082.1 355.525 1080.31 352.834 1079.12 347.458C1077.92 342.083 1077.33 336.012 1077.33 329.238C1077.33 322.868 1078.02 316.988 1079.42 311.613C1080.81 306.238 1082.5 303.547 1084.5 303.547C1086.09 303.547 1087.68 306.238 1089.28 311.613H1089.27Z"],
  [0.2073, "M1089.27 371.957C1090.86 377.332 1091.66 383.41 1091.66 390.177C1091.66 396.944 1090.96 402.931 1089.57 408.1C1088.17 413.284 1086.48 415.868 1084.49 415.868C1082.1 415.868 1080.31 413.284 1079.12 408.1C1077.92 402.931 1077.33 396.952 1077.33 390.177C1077.33 383.403 1078.02 377.332 1079.42 371.957C1080.81 366.581 1082.5 363.89 1084.5 363.89C1086.09 363.89 1087.68 366.581 1089.28 371.957H1089.27Z"],
  [0.5732, "M1110.18 371.957C1111.77 377.332 1112.57 383.41 1112.57 390.177C1112.57 396.944 1111.87 402.931 1110.48 408.1C1109.08 413.284 1107.39 415.868 1105.4 415.868C1103.01 415.868 1101.22 413.284 1100.03 408.1C1098.84 402.931 1098.24 396.952 1098.24 390.177C1098.24 383.403 1098.93 377.332 1100.34 371.957C1101.73 366.581 1103.42 363.89 1105.41 363.89C1107 363.89 1108.59 366.581 1110.19 371.957H1110.18Z"],
  [0.4268, "M1131.1 371.957C1132.69 377.332 1133.49 383.41 1133.49 390.177C1133.49 396.944 1132.79 402.931 1131.4 408.1C1130 413.284 1128.31 415.868 1126.32 415.868C1123.93 415.868 1122.14 413.284 1120.95 408.1C1119.76 402.931 1119.16 396.952 1119.16 390.177C1119.16 383.403 1119.85 377.332 1121.26 371.957C1122.65 366.581 1124.34 363.89 1126.33 363.89C1127.92 363.89 1129.51 366.581 1131.11 371.957H1131.1Z"],
  [0.3049, "M1151.71 371.957C1153.5 377.332 1154.4 383.41 1154.4 390.177C1154.4 396.944 1153.6 402.931 1152.01 408.1C1150.41 413.284 1148.62 415.868 1146.63 415.868C1144.64 415.868 1143.05 413.284 1141.85 408.1C1140.66 402.931 1140.06 396.952 1140.06 390.177C1140.06 383.403 1140.75 377.332 1142.16 371.957C1143.55 366.581 1145.04 363.89 1146.64 363.89C1148.24 363.89 1149.93 366.581 1151.72 371.957H1151.71Z"],
  [0.6098, "M1172.62 371.957C1174.41 377.332 1175.31 383.41 1175.31 390.177C1175.31 396.944 1174.51 402.931 1172.92 408.1C1171.32 413.284 1169.53 415.868 1167.54 415.868C1165.56 415.868 1163.96 413.284 1162.77 408.1C1161.57 402.931 1160.98 396.952 1160.98 390.177C1160.98 383.403 1161.67 377.332 1163.06 371.957C1164.46 366.581 1165.95 363.89 1167.54 363.89C1169.14 363.89 1170.83 366.581 1172.62 371.957Z"],
  [0.5244, "M1216.54 69.3126C1218.93 74.4967 1220.12 80.4683 1220.12 87.2352C1220.12 94.002 1219.02 100.081 1216.84 105.456C1214.64 110.831 1212.15 113.523 1209.36 113.523C1206.17 113.523 1203.69 110.938 1201.89 105.754C1200.11 100.585 1199.2 94.3996 1199.2 87.2275C1199.2 80.4607 1200.19 74.4814 1202.19 69.305C1204.18 64.1362 1206.57 61.5365 1209.36 61.5365C1211.76 61.5365 1214.14 64.1285 1216.54 69.305V69.3126Z"],
  [0.2805, "M1216.54 129.664C1218.93 134.848 1220.12 140.819 1220.12 147.586C1220.12 154.353 1219.02 160.432 1216.84 165.807C1214.64 171.182 1212.15 173.874 1209.36 173.874C1206.17 173.874 1203.69 171.289 1201.89 166.105C1200.11 160.936 1199.2 154.751 1199.2 147.578C1199.2 140.812 1200.19 134.832 1202.19 129.656C1204.18 124.487 1206.57 121.887 1209.36 121.887C1211.76 121.887 1214.14 124.48 1216.54 129.656V129.664Z"],
  [0.1829, "M1216.54 190.015C1218.93 195.199 1220.12 201.17 1220.12 207.937C1220.12 214.704 1219.02 220.783 1216.84 226.158C1214.64 231.533 1212.15 234.225 1209.36 234.225C1206.17 234.225 1203.69 231.64 1201.89 226.456C1200.11 221.287 1199.2 215.102 1199.2 207.929C1199.2 201.163 1200.19 195.183 1202.19 190.007C1204.18 184.838 1206.57 182.238 1209.36 182.238C1211.76 182.238 1214.14 184.83 1216.54 190.007V190.015Z"],
  [0.1707, "M1216.54 250.962C1218.93 256.146 1220.12 262.118 1220.12 268.884C1220.12 275.651 1219.02 281.73 1216.84 287.105C1214.64 292.48 1212.15 295.172 1209.36 295.172C1206.17 295.172 1203.69 292.587 1201.89 287.403C1200.11 282.235 1199.2 276.049 1199.2 268.877C1199.2 262.11 1200.19 256.131 1202.19 250.954C1204.18 245.785 1206.57 243.186 1209.36 243.186C1211.76 243.186 1214.14 245.778 1216.54 250.954V250.962Z"],
  [0.378, "M1216.54 311.313C1218.93 316.497 1220.12 322.469 1220.12 329.235C1220.12 336.002 1219.02 342.081 1216.84 347.456C1214.64 352.831 1212.15 355.523 1209.36 355.523C1206.17 355.523 1203.69 352.938 1201.89 347.754C1200.11 342.586 1199.2 336.4 1199.2 329.228C1199.2 322.461 1200.19 316.482 1202.19 311.305C1204.18 306.136 1206.57 303.537 1209.36 303.537C1211.76 303.537 1214.14 306.129 1216.54 311.305V311.313Z"],
  [0.5, "M1244.62 8.96167C1247.01 14.1457 1248.21 20.1174 1248.21 26.8842C1248.21 33.651 1247.11 39.7297 1244.92 45.105C1242.72 50.4802 1240.23 53.1716 1237.45 53.1716C1234.25 53.1716 1231.78 50.5872 1229.98 45.4032C1228.19 40.2344 1227.29 34.0486 1227.29 26.8766C1227.29 20.1097 1228.27 14.1305 1230.28 8.95402C1232.27 3.78523 1234.66 1.18555 1237.45 1.18555C1239.84 1.18555 1242.23 3.77759 1244.62 8.95402V8.96167Z"],
  [0.7805, "M1244.62 371.656C1247.01 376.84 1248.21 382.812 1248.21 389.579C1248.21 396.346 1247.11 402.424 1244.92 407.799C1242.72 413.175 1240.23 415.866 1237.45 415.866C1234.25 415.866 1231.78 413.282 1229.98 408.098C1228.19 402.929 1227.29 396.743 1227.29 389.571C1227.29 382.804 1228.27 376.825 1230.28 371.649C1232.27 366.48 1234.66 363.88 1237.45 363.88C1239.84 363.88 1242.23 366.472 1244.62 371.649V371.656Z"],
  [0.6707, "M1272.41 8.96167C1274.59 14.1457 1275.7 20.1174 1275.7 26.8842C1275.7 33.651 1274.69 39.7297 1272.71 45.105C1270.71 50.4802 1268.12 53.1716 1264.94 53.1716C1261.76 53.1716 1259.26 50.5872 1257.47 45.4032C1255.68 40.2344 1254.78 34.0486 1254.78 26.8766C1254.78 20.1097 1255.76 14.1305 1257.76 8.95402C1259.75 3.78523 1262.15 1.18555 1264.94 1.18555C1267.73 1.18555 1270.21 3.77759 1272.41 8.95402V8.96167Z"],
  [0.5488, "M1272.41 371.656C1274.59 376.84 1275.7 382.812 1275.7 389.579C1275.7 396.346 1274.69 402.424 1272.71 407.799C1270.71 413.175 1268.12 415.866 1264.94 415.866C1261.76 415.866 1259.26 413.282 1257.47 408.098C1255.68 402.929 1254.78 396.743 1254.78 389.571C1254.78 382.804 1255.76 376.825 1257.76 371.649C1259.75 366.48 1262.15 363.88 1264.94 363.88C1267.73 363.88 1270.21 366.472 1272.41 371.649V371.656Z"],
  [0.3537, "M1300.49 8.96167C1302.68 14.1457 1303.78 20.1174 1303.78 26.8842C1303.78 33.651 1302.78 39.7297 1300.79 45.105C1298.79 50.4802 1296.2 53.1716 1293.02 53.1716C1289.84 53.1716 1287.35 50.5872 1285.55 45.4032C1283.76 40.2344 1282.86 34.0486 1282.86 26.8766C1282.86 20.1097 1283.85 14.1305 1285.85 8.95402C1287.84 3.78523 1290.23 1.18555 1293.02 1.18555C1295.81 1.18555 1298.3 3.77759 1300.49 8.95402V8.96167Z"],
  [0.0732, "M1300.49 371.656C1302.68 376.84 1303.78 382.812 1303.78 389.579C1303.78 396.346 1302.78 402.424 1300.79 407.799C1298.79 413.175 1296.2 415.866 1293.02 415.866C1289.84 415.866 1287.35 413.282 1285.55 408.098C1283.76 402.929 1282.86 396.743 1282.86 389.571C1282.86 382.804 1283.85 376.825 1285.85 371.649C1287.84 366.48 1290.23 363.88 1293.02 363.88C1295.81 363.88 1298.3 366.472 1300.49 371.649V371.656Z"],
  [0.9512, "M1328.58 69.3126C1330.76 74.4967 1331.86 80.4683 1331.86 87.2352C1331.86 94.002 1330.86 100.081 1328.87 105.456C1326.88 110.831 1324.29 113.523 1321.11 113.523C1317.92 113.523 1315.43 110.938 1313.64 105.754C1311.85 100.585 1310.94 94.3996 1310.94 87.2275C1310.94 80.4607 1311.93 74.4814 1313.93 69.305C1315.92 64.1362 1318.31 61.5365 1321.11 61.5365C1323.9 61.5365 1326.38 64.1285 1328.58 69.305V69.3126Z"],
  [0.8902, "M1328.58 311.313C1330.76 316.497 1331.86 322.469 1331.86 329.235C1331.86 336.002 1330.86 342.081 1328.87 347.456C1326.88 352.831 1324.29 355.523 1321.11 355.523C1317.92 355.523 1315.43 352.938 1313.64 347.754C1311.85 342.586 1310.94 336.4 1310.94 329.228C1310.94 322.461 1311.93 316.482 1313.93 311.305C1315.92 306.136 1318.31 303.537 1321.11 303.537C1323.9 303.537 1326.38 306.129 1328.58 311.305V311.313Z"],
  [0.3902, "M1358.44 9.26199C1359.04 14.6372 1359.34 20.5247 1359.34 26.8863C1359.34 33.6608 1359.04 39.7318 1358.44 45.1071C1357.85 50.4823 1357.34 53.1738 1356.95 53.1738C1356.15 53.1738 1355.36 50.4823 1354.56 45.1071C1353.76 39.7318 1353.37 33.6608 1353.37 26.8863C1353.37 20.5171 1353.76 14.6372 1354.56 9.26199C1355.36 3.88675 1356.15 1.19531 1356.95 1.19531C1357.34 1.19531 1357.85 3.88675 1358.44 9.26199Z"],
  [0.5854, "M1358.44 69.613C1359.04 74.9882 1359.34 80.8757 1359.34 87.2373C1359.34 94.0118 1359.04 100.083 1358.44 105.458C1357.85 110.833 1357.34 113.525 1356.95 113.525C1356.15 113.525 1355.36 110.833 1354.56 105.458C1353.76 100.083 1353.37 94.0118 1353.37 87.2373C1353.37 80.8681 1353.76 74.9882 1354.56 69.613C1355.36 64.2377 1356.15 61.5463 1356.95 61.5463C1357.34 61.5463 1357.85 64.2377 1358.44 69.613Z"],
  [1, "M1358.44 129.964C1359.04 135.339 1359.34 141.227 1359.34 147.588C1359.34 154.363 1359.04 160.434 1358.44 165.809C1357.85 171.184 1357.34 173.876 1356.95 173.876C1356.15 173.876 1355.36 171.184 1354.56 165.809C1353.76 160.434 1353.37 154.363 1353.37 147.588C1353.37 141.219 1353.76 135.339 1354.56 129.964C1355.36 124.589 1356.15 121.897 1356.95 121.897C1357.34 121.897 1357.85 124.589 1358.44 129.964Z"],
  [0.1463, "M1358.44 190.315C1359.04 195.69 1359.34 201.578 1359.34 207.939C1359.34 214.714 1359.04 220.785 1358.44 226.16C1357.85 231.535 1357.34 234.227 1356.95 234.227C1356.15 234.227 1355.36 231.535 1354.56 226.16C1353.76 220.785 1353.37 214.714 1353.37 207.939C1353.37 201.57 1353.76 195.69 1354.56 190.315C1355.36 184.94 1356.15 182.248 1356.95 182.248C1357.34 182.248 1357.85 184.94 1358.44 190.315Z"],
  [0.0488, "M1358.44 251.262C1359.04 256.637 1359.34 262.525 1359.34 268.887C1359.34 275.661 1359.04 281.732 1358.44 287.107C1357.85 292.483 1357.34 295.174 1356.95 295.174C1356.15 295.174 1355.36 292.483 1354.56 287.107C1353.76 281.732 1353.37 275.661 1353.37 268.887C1353.37 262.517 1353.76 256.637 1354.56 251.262C1355.36 245.887 1356.15 243.196 1356.95 243.196C1357.34 243.196 1357.85 245.887 1358.44 251.262Z"],
  [0.8049, "M1358.44 311.613C1359.04 316.988 1359.34 322.876 1359.34 329.238C1359.34 336.012 1359.04 342.083 1358.44 347.458C1357.85 352.834 1357.34 355.525 1356.95 355.525C1356.15 355.525 1355.36 352.834 1354.56 347.458C1353.76 342.083 1353.37 336.012 1353.37 329.238C1353.37 322.868 1353.76 316.988 1354.56 311.613C1355.36 306.238 1356.15 303.547 1356.95 303.547C1357.34 303.547 1357.85 306.238 1358.44 311.613Z"],
  [0.7561, "M1358.44 371.957C1359.04 377.332 1359.34 383.219 1359.34 389.581C1359.34 396.355 1359.04 402.426 1358.44 407.802C1357.85 413.177 1357.34 415.868 1356.95 415.868C1356.15 415.868 1355.36 413.177 1354.56 407.802C1353.76 402.426 1353.37 396.355 1353.37 389.581C1353.37 383.212 1353.76 377.332 1354.56 371.957C1355.36 366.581 1356.15 363.89 1356.95 363.89C1357.34 363.89 1357.85 366.581 1358.44 371.957Z"],
  [0.7683, "M1370.1 371.957C1370.89 377.332 1371.29 383.219 1371.29 389.581C1371.29 396.355 1370.88 402.426 1370.1 407.802C1369.29 413.177 1368.7 415.868 1368.31 415.868C1367.5 415.868 1366.82 413.177 1366.21 407.802C1365.61 402.426 1365.32 396.355 1365.32 389.581C1365.32 383.212 1365.62 377.332 1366.21 371.957C1366.81 366.581 1367.5 363.89 1368.31 363.89C1368.7 363.89 1369.29 366.581 1370.1 371.957Z"],
  [0.5366, "M1381.75 371.957C1382.35 377.332 1382.64 383.219 1382.64 389.581C1382.64 396.355 1382.35 402.426 1381.75 407.802C1381.15 413.177 1380.65 415.868 1380.26 415.868C1379.46 415.868 1378.66 413.177 1377.87 407.802C1377.07 402.426 1376.68 396.355 1376.68 389.581C1376.68 383.212 1377.07 377.332 1377.87 371.957C1378.67 366.581 1379.46 363.89 1380.26 363.89C1380.65 363.89 1381.15 366.581 1381.75 371.957Z"],
  [0.9878, "M1393.4 371.957C1394.2 377.332 1394.6 383.219 1394.6 389.581C1394.6 396.355 1394.19 402.426 1393.4 407.802C1392.6 413.177 1392 415.868 1391.61 415.868C1390.81 415.868 1390.12 413.177 1389.52 407.802C1388.91 402.426 1388.62 396.355 1388.62 389.581C1388.62 383.212 1388.92 377.332 1389.52 371.957C1390.11 366.581 1390.8 363.89 1391.61 363.89C1392 363.89 1392.6 366.581 1393.4 371.957Z"],
  [0.061, "M1404.76 371.957C1405.55 377.332 1405.95 383.219 1405.95 389.581C1405.95 396.355 1405.54 402.426 1404.76 407.802C1403.95 413.177 1403.36 415.868 1402.97 415.868C1402.58 415.868 1401.97 413.177 1401.18 407.802C1400.38 402.426 1399.99 396.355 1399.99 389.581C1399.99 383.212 1400.38 377.332 1401.18 371.957C1401.97 366.581 1402.57 363.89 1402.97 363.89C1403.37 363.89 1403.95 366.581 1404.76 371.957Z"],
];

function WordmarkDots() {
  return (
    <svg
      viewBox="0 0 1405.95 416.47"
      preserveAspectRatio="xMidYMid meet"
      fill="#1D64EF"
      aria-hidden="true"
      className="vision-dots-svg"
    >
      {DOTS.map(([turno, d], i) => (
        <path
          key={i}
          className="mark-dot"
          style={{ "--turno": turno }}
          d={d}
        />
      ))}
    </svg>
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
        0
      );

      tl.to(
        sub,
        {
          strokeDashoffset: -60,
          ease: "none",
          duration: 1,
        },
        0
      );

      tl.to(
        [main, sub],
        {
          opacity: 0,
          ease: "none",
          duration: 0.18,
        },
        0.82
      );
    },
    { scope: containerRef }
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
  const { scene } = useGLTF(
    "/models/maxillary_first_molar_right_centered.glb"
  );

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
      <axesHelper args={[1]} />
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
  const { scene } = useGLTF("/models/FreySmiles-logo-3D-spin-frosted-smoked-glass.glb");

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

        <directionalLight
          position={[3, 5, 5]}
          intensity={3}
        />

        <directionalLight
          position={[-4, 1, -3]}
          intensity={1.5}
        />

        <Suspense fallback={null}>
          <Tooth />
          <Environment preset="studio" />
        </Suspense>

        <AsciiEffect />
      </Canvas>
    </div>
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
    <>
    
           {/* <div className="flex items-center justify-center w-6 h-6 overflow-hidden rounded-full">
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
            </div> */}
    <div className="relative">
      <motion.section
        style={{ y }}
        className="fixed top-0 left-0 z-0 flex items-center justify-center w-full h-screen bg-white"
      >
         <section
  className="relative flex min-h-screen w-full flex-col justify-end overflow-hidden
bg-[#222222]"
>
  


<div className="pointer-events-none absolute inset-x-0 top-0 z-10 w-full pt-[1vw]">
  <div className="marquee">
    <div className="marquee-content">
      {[0, 1].map((index) => (
        <div
          key={index}
          className="marquee-track"
          aria-hidden={index === 1}
        >
<svg
  viewBox="0 0 2700 240"
  className="block h-auto w-[2700px] max-w-none"
  xmlns="http://www.w3.org/2000/svg"
  aria-label="Frey Smiles"
  role="img"
>
            <defs>
<mask
  id={`frey-video-mask-${index}`}
  maskUnits="userSpaceOnUse"
  x="0"
  y="0"
  width="2700"
  height="240"
>
  <rect width="2700" height="240" fill="black" />

                <text
                  x="0"
                  y="205"
                  textAnchor="start"
                  fontFamily="OTF-Glusp"
                  fontSize="230"
                  letterSpacing="-10"
                  fill="white"
                >
                  FREY SMILES
                </text>
              </mask>
            </defs>

<foreignObject
  x="0"
  y="0"
  width="2700"
  height="240"
  mask={`url(#frey-video-mask-${index})`}
>
              <video
                autoPlay
                muted
                loop
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              >
                <source
                  src="/videos/clouds.mp4"
                  type="video/mp4"
                />
              </video>
            </foreignObject>
          </svg>
        </div>
      ))}
    </div>
  </div>
</div>
{/* <div className="pointer-events-none absolute inset-x-0 top-[180px] z-0">
  <FSScene />
</div> */}
<div className="pointer-events-none absolute inset-x-0 top-[180px] z-0 translate-x-[100px]">
  <ToothScene />
</div>
<div

  className="venn-diagram w-full max-w-[500px]"
/>
  {/* <div className="frosted-donut">
    <div className="frosted-donut-surface" />
  </div> */}

  <div className="relative z-10 max-w-[850px] px-8 pb-12 md:px-16 md:pb-20">
    <h2 className="text-[clamp(2rem,5vw,5rem)] leading-[0.95] font-neuehaas45 text-[#263746]">
...The art behind your smile
    </h2>

    <p className="font-neuehaas35 mt-8 max-w-[460px] uppercase text-[12px] tracking-[.05em] leading-relaxed text-white md:text-[#12px]">
 Every smile is a story. At our office, we guide
            you through every step of your orthodontic journey — with advanced
            treatment, personalized care, and results that go beyond the
            ordinary.
    </p>
  </div>
</section>
        {/* <div
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
        </div> */}

        {/* <svg
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
        </svg> */}

        <div className="absolute max-w-lg text-sm text-gray-300 font-neue-montreal top-60 right-56">


          <div className="flex items-center gap-2 mt-6">

 
          </div>
        </div>

     
      </motion.section>
      <section
        ref={sectionCircleRef}
        className="relative h-[160vh] w-full bg-[#AB63E6] z-10 mt-[100vh]"
      >
            
              <ShrimpFlow />

        <section className="relative flex flex-col items-center justify-center h-full px-8 text-center">
          {/* <div className="vision-dot-background" aria-hidden="true">
                      <WordmarkDots />
          </div> */}

          {/* <main ref={mainRef}>
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
          </main> */}
{/* <div className="vision-glass">
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
</div> */}
        </section>
      </section>
    </div>
    </>
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
        </div>

        <div className="flex flex-col col-span-8">
  \
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
    const containerRef = useRef();
    const lineRefs = useRef([]);
    const textRefs = useRef([]);
    const sectionLineRefs = useRef([]);
  
    const addToLineRefs = (el) => el && lineRefs.current.push(el);
    const addToTextRefs = (el) => el && textRefs.current.push(el);
    const addToSectionLineRefs = (el) => el && sectionLineRefs.current.push(el); 
  
  useEffect(() => {
    const [topLine, bottomLine] = sectionLineRefs.current;
  
    // INITIAL STATE
    gsap.set([topLine, bottomLine, ...lineRefs.current], {
      scaleX: 0,
      transformOrigin: "center center",
    });
  
    gsap.set(textRefs.current, {
      opacity: 0,
      y: 40,
    });
  
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 75%",
        toggleActions: "play none none none",
      },
    });
  
    tl.to(topLine, {
      scaleX: 1,
      duration: 1.9,      
      ease: "power3.inOut",
    });
  
    tl.to(
      lineRefs.current,
      {
        scaleX: 1,
        duration: 1.9,            
        ease: "power3.inOut",
        stagger: {
          amount: 0.65,           
        },
      },
      "-=1.45"            
    );
  
  
    tl.to(
      bottomLine,
      {
        scaleX: 1,
        duration: 1.9,
        ease: "power3.inOut",
      },
      "-=1.45"
    );
  
    tl.addPause("+=0.08");       
  
    tl.to(
      textRefs.current,
      {
        opacity: 1,
        y: 0,
        duration: .5,  
        ease: "power3.out",
        stagger: 0.06,            
      },
      "-=1.4"
    );
  
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);
  // const splitTextInstances = useRef([]);

  // const linkRef = useRef(null);

  // useEffect(() => {
  //   const link = linkRef.current;

  //   const span1 = link.querySelector("[data-tha-span-1]");
  //   const span2 = link.querySelector("[data-tha-span-2]");

  //   const handleMouseEnter = () => {
  //     gsap.to([span1, span2], {
  //       yPercent: -100,
  //       duration: 0.8,
  //       ease: "power4.inOut",
  //     });
  //   };

  //   const handleMouseLeave = () => {
  //     gsap.to([span1, span2], {
  //       yPercent: 0,
  //       duration: 0.8,
  //       ease: "power4.inOut",
  //     });
  //   };

  //   link.addEventListener("mouseenter", handleMouseEnter);
  //   link.addEventListener("mouseleave", handleMouseLeave);

  //   return () => {
  //     link.removeEventListener("mouseenter", handleMouseEnter);
  //     link.removeEventListener("mouseleave", handleMouseLeave);
  //   };
  // }, []);

  // const [hover, setHover] = useState(false);

  return (
    <>
         <div className="accolades-section">
  <div className="flex justify-start px-10 font-canelathin text-[18px]">
    Accolades
  </div>

  <div
    ref={containerRef}
    className="mt-[6vh] w-full max-w-7xl mx-auto text-[11px] relative"
  >
    <div
      ref={addToSectionLineRefs}
      className="absolute top-0 left-0 right-0 h-[.5px] bg-black origin-left"
    />

    <div className="font-canelathin tracking-wide flex flex-col text-[1.25em]">
      {[
        ["6× Winner Best Orthodontist", "Best of the Valley"],
        ["5× Winner Best Orthodontist", "Readers' Choice The Morning Call"],
         ["10× Cover Feature", "American Journal of Orthodontics & Dentofacial Orthopedics"],
        ["Nationally Recognized Top Orthodontist", "Top Dentists"],
        ["Invisalign", "25+ Years of Experience"],
        ["Invisalign Teen", "5000+ Cases Treated"],
        ["Diamond Plus", "Top 1% of All Providers"],
      ].map(([left, right], i) => (
        <div key={i} className="flex py-3.5 items-center px-5 relative">
          {i < 6 && (
            <div
              ref={addToLineRefs}
              className="absolute inset-x-0 bottom-0 h-[.5px] bg-black origin-center"
              style={{ transform: "scaleX(0)" }}
            />
          )}


<div className="flex-1 pr-8 overflow-hidden">
  <div ref={addToTextRefs}>
    {left}
  </div>
</div>


<div className="w-[350px] pr-6 overflow-hidden">
  <div ref={addToTextRefs}>
    {right}
  </div>
</div>

<div className="w-[80px] text-right opacity-50 overflow-hidden">
  <div ref={addToTextRefs}>
    Date
  </div>
</div>
        </div>
      ))}
    </div>

    <div
      ref={addToSectionLineRefs}
      className="absolute bottom-0 left-0 right-0 h-[.5px] bg-black origin-left"
    />
  </div>
</div>
      {/* <section className="flex items-center justify-center min-h-screen px-8  md:px-16">
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
      </section> */}
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
