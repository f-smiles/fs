"use client";
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
import { Color } from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import Copy from "@/utils/Copy.jsx";
import normalizeWheel from "normalize-wheel";
import {
  Renderer,
  Camera,
  Transform,
  Mesh,
  // Program,
  Texture,
  Plane,
} from "ogl";
import { Fluid } from "/utils/FluidCursorTemp.js";
import { EffectComposer, Bloom, ChromaticAberration, DepthOfField } from "@react-three/postprocessing";
import { useControls } from "leva";
import Splitting from "splitting";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import React, {
  useState,
  useLayoutEffect,
  useEffect,
  useRef,
  forwardRef,
  Suspense,
  useCallback
} from "react";
import Link from "next/link";
// import DotPattern from "../svg/DotPattern";
import {
  motion,
  // useScroll,
  useSpring,
  useAnimation,
  useTransform,
  useInView
} from "framer-motion";
import gsap from "gsap";

import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/all";
import * as THREE from "three";
import { Vector2 } from "three";
import { Canvas, useLoader, useFrame, useThree, extend } from "@react-three/fiber";
import { useMemo } from "react";
import { Environment, OrbitControls, useTexture, shaderMaterial, useGLTF, Text, Center, Stars, ScrollControls, useScroll
} from "@react-three/drei";
import { TextureLoader, CubeTextureLoader } from "three";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);



const DistortedImage = ({ imageSrc, xOffset = 0, yOffset = 0 }) => {
  const ref = useRef();
  const texture = useTexture(imageSrc);
  const { viewport, size } = useThree();

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const scrollOffset = (scrollY / size.height) * viewport.height;
      ref.current.position.y = yOffset + scrollOffset;
    };

    window.addEventListener("scroll", onScroll);
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [viewport.height, size.height, yOffset]);

  return (
    <mesh ref={ref} position={[xOffset, 0, 0]} scale={[2.5, 2, 1]}>
      <planeGeometry args={[2, 3]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
};

const MorphingSphere = ({sectionRef}) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const groupRef = useRef(null);
  const leftSphereRef = useRef(null);
  const rightSphereRef = useRef(null);
  const materialsRef = useRef([]);
  const clockRef = useRef(new THREE.Clock());
  const scrollProgressRef = useRef(0);

  const settingsRef = useRef({
    lineCount: 35,
    lineWidth: 0.02,
    lineSharpness: 25.0,
    rimEffect: 0.8,
    rimIntensity: 3.0,
    rimWidth: 0.6,
    offset: 0.0,
    sphereDetail: 96,
    gap: 0.3,
    distortion: 0.4,
    twist: 1.2,
    useHighlights: true,
    highlightIntensity: 0.7,
    occlusion: 0.3,
    glowIntensity: 0.6,
    glowColor: new THREE.Color(0x3388ff),
    colorShift: 0.3,
    pulseSpeed: 0.5,
    lineColorA: new THREE.Color(0x88ccff),
    lineColorB: new THREE.Color(0x44aaff),
  });

  const helperFunctions = `
    float hash(float n) { 
      return fract(sin(n) * 43758.5453123); 
    }
    
    float hash(vec3 p) {
      p = fract(p * 0.3183099 + .1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    
    float smootherstep(float edge0, float edge1, float x, float smoothness) {
      x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
      return pow(x, smoothness) * (smoothness + 1.0) - pow(x, smoothness + 1.0) * smoothness;
    }
    
    float contour(float val, float width, float sharpness) {
      float contourVal = abs(fract(val) - 0.5);
      return pow(smoothstep(0.0, width, contourVal), sharpness);
    }
    
    float fresnel(vec3 normal, vec3 viewDir, float power) {
      return pow(1.0 - abs(dot(normal, viewDir)), power);
    }
    
    // More complex noise functions for organic shapes
    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f*f*(3.0-2.0*f);
      
      float n = i.x + i.y*157.0 + 113.0*i.z;
      return mix(
        mix(mix(hash(n+0.0), hash(n+1.0), f.x),
            mix(hash(n+157.0), hash(n+158.0), f.x), f.y),
        mix(mix(hash(n+113.0), hash(n+114.0), f.x),
            mix(hash(n+270.0), hash(n+271.0), f.x), f.y), f.z);
    }
    
    float fbm(vec3 p, int octaves) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for (int i = 0; i < octaves; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
        if (amplitude < 0.01) break;
      }
      
      return value;
    }
    
    // New: Worley noise for cellular patterns
    float worleyNoise(vec3 p) {
      float d = 1.0;
      for (int xo = -1; xo <= 1; xo++) {
        for (int yo = -1; yo <= 1; yo++) {
          for (int zo = -1; zo <= 1; zo++) {
            vec3 tp = floor(p) + vec3(xo, yo, zo);
            tp += hash(tp.x + hash(tp.y + hash(tp.z)));
            d = min(d, length(p - tp));
          }
        }
      }
      return d;
    }
    
    vec3 mixColor(vec3 colorA, vec3 colorB, float t) {
      return mix(colorA, colorB, t);
    }
  `;

  const vertexShader = `
    ${helperFunctions}
    
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vPosition;
    varying vec3 vOrigPosition;
    varying vec3 vWorldPosition;
    varying float vFresnel;
    varying float vElevation;
    varying float vDistortion;
    
    uniform float uRimEffect;
    uniform float uRimIntensity;
    uniform float uScrollProgress;
    uniform float uDistortion;
    uniform float uTwist;
    uniform float uTime;
    uniform float uPulseSpeed;
    uniform float uTentacleAmount;
    uniform float uSpikeAmount;
    
    vec3 twist(vec3 p, float strength) {
      float c = cos(strength * p.y);
      float s = sin(strength * p.y);
      mat2 m = mat2(c, -s, s, c);
      return vec3(m * p.xz, p.y).xzy;
    }
    
    float pulseEffect(float time, float speed) {
      return 0.5 * sin(time * speed) + 0.5;
    }
    
    // New: Create tentacle-like protrusions
    vec3 addTentacles(vec3 p, float amount) {
      if (amount < 0.001) return p;
      
      float tentacleNoise = worleyNoise(p * 3.0 + vec3(0.0, uTime * 0.1, 0.0));
      float tentacleMask = smoothstep(0.3, 0.7, tentacleNoise);
      vec3 tentacleDir = normalize(p + vec3(sin(p.y * 10.0), cos(p.z * 10.0), sin(p.x * 10.0)));
      return p + tentacleDir * tentacleMask * amount * 0.3;
    }
    
    // New: Create spike-like features
    vec3 addSpikes(vec3 p, float amount) {
      if (amount < 0.001) return p;
      
      float spikeNoise = noise(p * 10.0 + vec3(0.0, uTime * 0.05, 0.0));
      float spikeMask = step(0.7, spikeNoise);
      vec3 spikeDir = normalize(p);
      return p + spikeDir * spikeMask * amount * 0.2;
    }
    
    void main() {
      vOrigPosition = position;
      vec3 pos = position;
      
      // Apply initial organic deformation
      float organicNoise = fbm(pos * 2.0, 3) * 2.0 - 1.0;
      pos += normal * organicNoise * 0.2;
      
      // Add tentacles and spikes
      pos = addTentacles(pos, uTentacleAmount);
      pos = addSpikes(pos, uSpikeAmount);
      
      // Apply twist and distortion
      float pulse = pulseEffect(uTime, uPulseSpeed);
      float twistAmount = uTwist * (1.0 + pulse * 0.1);
      pos = twist(pos, twistAmount);
      
      float distortionAmount = uDistortion;
      float noiseValue = 0.0;
      
      if (distortionAmount > 0.0) {
        noiseValue = fbm(pos * 3.0 + vec3(0.0, uTime * 0.1, uScrollProgress * 10.0), 3) * 2.0 - 1.0;
        pos += normal * noiseValue * distortionAmount;
        vDistortion = noiseValue * distortionAmount;
      } else {
        vDistortion = 0.0;
      }
      
      // Calculate normals with all deformations
      vec3 transformedNormal = normalize(normal);
      float delta = 0.01;
      vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
      vec3 bitangent = normalize(cross(normal, tangent));
      
      vec3 posP1 = position + tangent * delta;
      vec3 posP2 = position + bitangent * delta;
      
      // Apply same deformations to neighbor points for normal calculation
      float organicNoiseP1 = fbm(posP1 * 2.0, 3) * 2.0 - 1.0;
      posP1 += normal * organicNoiseP1 * 0.2;
      posP1 = addTentacles(posP1, uTentacleAmount);
      posP1 = addSpikes(posP1, uSpikeAmount);
      posP1 = twist(posP1, twistAmount);
      
      float organicNoiseP2 = fbm(posP2 * 2.0, 3) * 2.0 - 1.0;
      posP2 += normal * organicNoiseP2 * 0.2;
      posP2 = addTentacles(posP2, uTentacleAmount);
      posP2 = addSpikes(posP2, uSpikeAmount);
      posP2 = twist(posP2, twistAmount);
      
      if (distortionAmount > 0.0) {
        float n1 = fbm(posP1 * 3.0 + vec3(0.0, uTime * 0.1, uScrollProgress * 10.0), 2) * 2.0 - 1.0;
        float n2 = fbm(posP2 * 3.0 + vec3(0.0, uTime * 0.1, uScrollProgress * 10.0), 2) * 2.0 - 1.0;
        posP1 += normal * n1 * distortionAmount;
        posP2 += normal * n2 * distortionAmount;
      }
      
      vec3 newTangent = normalize(posP1 - pos);
      vec3 newBitangent = normalize(posP2 - pos);
      transformedNormal = normalize(cross(newTangent, newBitangent));
      
      vNormal = normalMatrix * transformedNormal;
      vPosition = pos;
      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
      vec3 worldCameraPos = cameraPosition;
      vec3 worldViewDir = normalize(worldCameraPos - vWorldPosition);
      vViewDir = worldViewDir;
      vFresnel = fresnel(normalize((modelMatrix * vec4(transformedNormal, 0.0)).xyz), worldViewDir, uRimIntensity * (1.0 + pulse * 0.2));
      vElevation = length(pos);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;


  const fragmentShader = `
  ${helperFunctions}

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPosition;
  varying vec3 vOrigPosition;
  varying vec3 vWorldPosition;
  varying float vFresnel;
  varying float vElevation;
  varying float vDistortion;
  
  uniform float uLineCount;
  uniform float uLineWidth;
  uniform float uLineSharpness;
  uniform float uRimEffect;
  uniform float uRimWidth;
  uniform float uOffset;
  uniform bool uUseHighlights;
  uniform float uHighlightIntensity;
  uniform float uOcclusion;
  uniform float uScrollProgress;
  uniform float uDistortion;
  uniform float uTime;
  uniform float uGlowIntensity;
  uniform vec3 uGlowColor;
  uniform float uColorShift;
  uniform vec3 uLineColorA;
  uniform vec3 uLineColorB;
  
  void main() {
    vec3 dir = normalize(vPosition);
    float elevation = vElevation;
  
    elevation += (vDistortion * 0.5 + dot(normalize(vNormal), dir) * 0.1 + 
                  sin(vPosition.x * 5.0 + uTime * 0.2) * 0.05 +
                  cos(vPosition.y * 7.0 + uTime * 0.15) * 0.05 +
                  sin(vPosition.z * 3.0 + uTime * 0.1) * 0.05);
  
    float timeOffset = sin(uTime * 0.3) * 0.1;
    float rimFactorRaw = vFresnel * uRimEffect;
    float rimFactor = clamp(rimFactorRaw, 0.0, 1.0); // less clamping now
  
    float gradient = 1.0 + pow(rimFactor, 2.0) * (5.0 + sin(uTime * 0.5) * 2.0);
  
    float contourValue;
  
    if (uScrollProgress < 0.33) {
      float noisePattern = fbm(vPosition * 2.0 + vec3(0.0, uTime * 0.1, 0.0), 2);
      contourValue = (elevation + uOffset + noisePattern * 0.3 + timeOffset) *
                     uLineCount * mix(1.0, gradient, uRimWidth);
    } else if (uScrollProgress < 0.66) {
      float localProgress = (uScrollProgress - 0.33) * 3.0;
      float pulseEffect = 0.3 + 0.2 * sin(uTime * 0.7);
      vec3 localPos = vPosition * (1.0 + sin(localProgress * 6.28) * pulseEffect);
      contourValue = length(localPos.xz) * uLineCount * (2.0 + sin(uTime * 0.3) * 0.5);
    } else {
      float localProgress = (uScrollProgress - 0.66) * 3.0;
      float noise1 = fbm(vPosition * 5.0 + vec3(uTime * 0.2, 0.0, uScrollProgress), 3);
      float noise2 = fbm(vPosition * 2.0 - vec3(0.0, uTime * 0.3, uScrollProgress * 3.0), 2);
      contourValue = (elevation * (noise1 * 0.7 + 0.3) + noise2 * 2.0) * uLineCount;
    }
  
    float lineVal = 1.0 - contour(contourValue, uLineWidth * (1.0 + sin(uTime * 0.4) * 0.15),
                                  uLineSharpness * (1.0 + cos(uTime * 0.2) * 0.3));
  
    lineVal = mix(lineVal, step(uLineWidth * (1.5 + sin(uTime * 0.5) * 0.5),
                                abs(fract(contourValue) - 0.5)),
                  rimFactor * 0.8); 
  

    vec3 lineColor = mix(vec3(0.7, 0.9, 1.4), vec3(0.3, 0.5, 1.0), sin(uTime * 0.3 + elevation * 5.0) * 0.5 + 0.5);
    vec3 color = lineColor * lineVal;
  
    //  Extra bloom from rim edges (like powder halo)
    float halo = smoothstep(0.2, 0.9, rimFactor);
    color += vec3(0.65, 0.8, 1.2) * halo * 0.1;
  

    // float ao = 1.0 - uOcclusion * (1.0 - dot(vNormal, vec3(0.0, 1.0, 0.0))) *
    //           (0.9 + 0.1 * sin(vPosition.y * 10.0 + uTime * 0.2));
    // color *= ao;
  
    //  Stronger glow
    float glowPulse = 0.9 + 0.2 * sin(uTime * 0.8);
    vec3 glowColor = vec3(0.5, 0.75, 1.4) * pow(rimFactor, 1.25) * uGlowIntensity * glowPulse;
    color += glowColor;
  
    //  Slight shimmer noise
    color *= (0.97 + hash(vPosition * 1000.0) * 0.1);
  
    // Clamp and output
    color = clamp(color, 0.0, 1.0);
    float alpha = lineVal * 0.7 + rimFactor * 0.35;
    gl_FragColor = vec4(color, alpha);
  }
  
  `;
  // const fragmentShader = `
  //   ${helperFunctions}
    
  //   varying vec3 vNormal;
  //   varying vec3 vViewDir;
  //   varying vec3 vPosition;
  //   varying vec3 vOrigPosition;
  //   varying vec3 vWorldPosition;
  //   varying float vFresnel;
  //   varying float vElevation;
  //   varying float vDistortion;
    
  //   uniform float uLineCount;
  //   uniform float uLineWidth;
  //   uniform float uLineSharpness;
  //   uniform float uRimEffect;
  //   uniform float uRimWidth;
  //   uniform float uOffset;
  //   uniform bool uUseHighlights;
  //   uniform float uHighlightIntensity;
  //   uniform float uOcclusion;
  //   uniform float uScrollProgress;
  //   uniform float uDistortion;
  //   uniform float uTime;
  //   uniform float uGlowIntensity;
  //   uniform vec3 uGlowColor;
  //   uniform float uColorShift;
  //   uniform vec3 uLineColorA;
  //   uniform vec3 uLineColorB;
    
  //   void main() {
  //     vec3 dir = normalize(vPosition);
  //     float elevation = vElevation;
      
  //     // Add organic variation based on distortion and position
  //     elevation += (vDistortion * 0.5 + dot(normalize(vNormal), dir) * 0.1 + 
  //                 sin(vPosition.x * 5.0 + uTime * 0.2) * 0.05 +
  //                 cos(vPosition.y * 7.0 + uTime * 0.15) * 0.05 +
  //                 sin(vPosition.z * 3.0 + uTime * 0.1) * 0.05);
      
  //     float timeOffset = sin(uTime * 0.3) * 0.1;
  //     float rimFactor = vFresnel * uRimEffect;
      
  //     // Dynamic gradient that changes with time
  //     float gradient = 1.0 + pow(rimFactor, 2.0) * (5.0 + sin(uTime * 0.5) * 2.0);
      
  //     float contourValue;
      
  //     // Enhanced contour patterns with more organic feel
  //     if (uScrollProgress < 0.33) {
  //       // Starting with more complex organic pattern
  //       float noisePattern = fbm(vPosition * 2.0 + vec3(0.0, uTime * 0.1, 0.0), 2);
  //       contourValue = (elevation + uOffset + noisePattern * 0.3 + timeOffset) * 
  //                     uLineCount * mix(1.0, gradient, uRimWidth);
  //     } else if (uScrollProgress < 0.66) {
  //       float localProgress = (uScrollProgress - 0.33) * 3.0;
  //       float pulseEffect = 0.3 + 0.2 * sin(uTime * 0.7);
  //       vec3 localPos = vPosition * (1.0 + sin(localProgress * 6.28) * pulseEffect);
  //       contourValue = length(localPos.xz) * uLineCount * (2.0 + sin(uTime * 0.3) * 0.5);
  //     } else {
  //       float localProgress = (uScrollProgress - 0.66) * 3.0;
  //       float noise1 = fbm(vPosition * 5.0 + vec3(uTime * 0.2, 0.0, uScrollProgress), 3);
  //       float noise2 = fbm(vPosition * 2.0 - vec3(0.0, uTime * 0.3, uScrollProgress * 3.0), 2);
  //       contourValue = (elevation * (noise1 * 0.7 + 0.3) + noise2 * 2.0) * uLineCount;
  //     }
      
  //     // Sharper lines with organic variation
  //     float lineVal = 1.0 - contour(contourValue, uLineWidth * (0.9 + sin(uTime * 0.4) * 0.1), 
  //                                  uLineSharpness * (1.0 + cos(uTime * 0.2) * 0.2));
      
  //     // Rim enhancement with organic variation
  //     lineVal = mix(lineVal, step(uLineWidth * (1.5 + sin(uTime * 0.5) * 0.5), 
  //                                abs(fract(contourValue) - 0.5)), 
  //                  rimFactor * (0.7 + sin(uTime * 0.6) * 0.1));
      
  //     // Dynamic color mixing with more variation
  //     float colorMix = 0.5 + 0.5 * sin(vElevation * 7.0 + uTime * 0.5 + vDistortion * 3.0);
  //     colorMix = mix(colorMix, rimFactor, uColorShift * (1.0 + sin(uTime * 0.4) * 0.2));
      
  //     vec3 lineColor = mixColor(uLineColorA, uLineColorB, colorMix);
      
  //     // Base color with organic highlights
  //     vec3 color = lineColor * lineVal;
      
  //     // Enhanced lighting effects
  //     if (uUseHighlights) {
  //       // Dynamic lighting direction
  //       vec3 lightDir = normalize(vec3(
  //         sin(uScrollProgress * 6.28 + uTime * 0.3), 
  //         0.8 + 0.2 * cos(uTime * 0.4),
  //         cos(uScrollProgress * 6.28 + uTime * 0.25)
  //       ));
        
  //       // Specular highlight with organic variation
  //       vec3 halfVector = normalize(lightDir + vViewDir);
  //       float specular = pow(max(0.0, dot(vNormal, halfVector)), 
  //                    16.0 + sin(uTime * 0.5) * 4.0);
        
  //       color += vec3(specular) * lineVal * uHighlightIntensity * (1.0 + sin(uTime * 0.7) * 0.2);
        
  //       // Organic ambient occlusion
  //       float ao = 1.0 - uOcclusion * (1.0 - dot(vNormal, vec3(0.0, 1.0, 0.0))) * 
  //                 (0.9 + 0.1 * sin(vPosition.y * 10.0 + uTime * 0.2));
  //       color *= ao;
  //     }
      
  //     // Organic noise to break up perfection
  //     color *= (0.95 + hash(vPosition * 500.0) * 0.1);
      
  //     // Enhanced glow with pulse effect
  //     float glowPulse = 0.8 + 0.2 * sin(uTime * 0.8);
  //     vec3 glowColor = uGlowColor * pow(rimFactor, 1.5) * uGlowIntensity * glowPulse;
  //     color += glowColor;
      
  //     // Alpha with organic variation
  //     float alpha = lineVal * (0.7 + 0.1 * sin(uTime * 0.9)) + 
  //                  rimFactor * (0.3 + 0.1 * cos(uTime * 0.6));
      
  //     gl_FragColor = vec4(color, alpha);
  //   }
  // `;

  const createGeometry = () => {
    if (leftSphereRef.current) {
      groupRef.current.remove(leftSphereRef.current);
      groupRef.current.remove(rightSphereRef.current);
    }

    const sphereDetail = parseInt(settingsRef.current.sphereDetail);
    const radius = 1;
    const leftGeometry = new THREE.SphereGeometry(
      radius,
      sphereDetail,
      sphereDetail,
      0,
      Math.PI,
      0,
      Math.PI
    );

    const rightGeometry = new THREE.SphereGeometry(
      radius,
      sphereDetail,
      sphereDetail,
      Math.PI,
      Math.PI,
      0,
      Math.PI
    );

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uLineCount: { value: settingsRef.current.lineCount },
        uLineWidth: { value: settingsRef.current.lineWidth },
        uLineSharpness: { value: settingsRef.current.lineSharpness },
        uRimEffect: { value: settingsRef.current.rimEffect },
        uRimIntensity: { value: settingsRef.current.rimIntensity },
        uRimWidth: { value: settingsRef.current.rimWidth },
        uOffset: { value: settingsRef.current.offset },
        uUseHighlights: { value: settingsRef.current.useHighlights },
        uHighlightIntensity: { value: settingsRef.current.highlightIntensity },
        uOcclusion: { value: settingsRef.current.occlusion },
        uScrollProgress: { value: 0.0 },
        uDistortion: { value: 0.5 },
        uTwist: { value: 1.5 },
        uTime: { value: 0.0 },
        uGlowIntensity: { value: 0.7 },
        uGlowColor: {
          value: new THREE.Color(
            0.2 + 0.4 * 0.3,
            0.5 + 0.4 * 0.2,
            0.8 + 0.4 * 0.1
          ),
        },
        uColorShift: { value: 0.4 },
        uPulseSpeed: { value: settingsRef.current.pulseSpeed },
        uLineColorA: { value: settingsRef.current.lineColorA },
        uLineColorB: { value: settingsRef.current.lineColorB },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const leftMaterial = material.clone();
    const rightMaterial = material.clone();

    leftSphereRef.current = new THREE.Mesh(leftGeometry, leftMaterial);
    rightSphereRef.current = new THREE.Mesh(rightGeometry, rightMaterial);

    const gap = 0.3 / 2;
    leftSphereRef.current.position.x = -gap;
    rightSphereRef.current.position.x = gap;

    groupRef.current.add(leftSphereRef.current);
    groupRef.current.add(rightSphereRef.current);

    materialsRef.current = [leftMaterial, rightMaterial];

    groupRef.current.rotation.x = 0.1;
    groupRef.current.rotation.y = Math.PI * 0.2;
  };

  const containerRef = useRef(null);
  const isActiveRef = useRef(false);
  const setupScrollAnimations = () => {
    scrollProgressRef.current = 0;
    updateForScrollProgress(0);

ScrollTrigger.create({
  trigger: sectionRef.current,
  start: "top top",
  end: "bottom bottom",
  scrub: true,
  onUpdate: (self) => {
    scrollProgressRef.current = self.progress;
    updateForScrollProgress(self.progress);
  },
});
  };

  const animate = () => {
    requestAnimationFrame(animate);

    const elapsedTime = clockRef.current.getElapsedTime();
    materialsRef.current.forEach((mat) => {
      mat.uniforms.uTime.value = elapsedTime;
    });

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const updateForScrollProgress = (progress) => {
    materialsRef.current.forEach((mat) => {
      mat.uniforms.uScrollProgress.value = progress;
    });
  

    if (scrollProgressRef.current < 0.25) {
      const localProgress = scrollProgressRef.current * 4.0;
      settingsRef.current.gap = gsap.utils.interpolate(0.3, 0.4, localProgress);
      settingsRef.current.distortion = gsap.utils.interpolate(0.5, 0.4, localProgress);
      settingsRef.current.twist = gsap.utils.interpolate(1.5, 1.8, localProgress);
      settingsRef.current.lineCount = gsap.utils.interpolate(35, 45, localProgress);
      settingsRef.current.lineWidth = gsap.utils.interpolate(0.02, 0.025, localProgress);
      settingsRef.current.colorShift = gsap.utils.interpolate(0.4, 0.5, localProgress);
      settingsRef.current.glowIntensity = gsap.utils.interpolate(0.7, 0.6, localProgress);
  
      groupRef.current.rotation.x = gsap.utils.interpolate(0.1, 0.3, localProgress);
      groupRef.current.rotation.y = gsap.utils.interpolate(Math.PI * 0.2, Math.PI * 0.5, localProgress);
  
    } else if (scrollProgressRef.current < 0.5) {
      const localProgress = (scrollProgressRef.current - 0.25) * 4.0;
      settingsRef.current.gap = gsap.utils.interpolate(0.4, 0.35, localProgress);
      settingsRef.current.distortion = gsap.utils.interpolate(0.4, 0.5, localProgress);
      settingsRef.current.twist = gsap.utils.interpolate(1.8, 1.6, localProgress);
      settingsRef.current.lineCount = gsap.utils.interpolate(45, 50, localProgress);
      settingsRef.current.lineWidth = gsap.utils.interpolate(0.025, 0.03, localProgress);
      settingsRef.current.colorShift = gsap.utils.interpolate(0.5, 0.7, localProgress);
      settingsRef.current.glowIntensity = gsap.utils.interpolate(0.6, 0.7, localProgress);
  
      groupRef.current.rotation.x = gsap.utils.interpolate(0.3, Math.PI * 0.25, localProgress);
      groupRef.current.rotation.y = gsap.utils.interpolate(Math.PI * 0.5, Math.PI * 0.75, localProgress);
  
    } else if (scrollProgressRef.current < 0.75) {
      const localProgress = (scrollProgressRef.current - 0.5) * 4.0;
      settingsRef.current.gap = gsap.utils.interpolate(0.35, 0.3, localProgress);
      settingsRef.current.distortion = gsap.utils.interpolate(0.5, 0.4, localProgress);
      settingsRef.current.twist = gsap.utils.interpolate(1.6, 1.4, localProgress);
      settingsRef.current.lineCount = gsap.utils.interpolate(50, 55, localProgress);
      settingsRef.current.lineWidth = gsap.utils.interpolate(0.03, 0.035, localProgress);
      settingsRef.current.colorShift = gsap.utils.interpolate(0.7, 0.8, localProgress);
      settingsRef.current.glowIntensity = gsap.utils.interpolate(0.7, 0.8, localProgress);
  
      groupRef.current.rotation.x = Math.PI * 0.25;
      groupRef.current.rotation.y = gsap.utils.interpolate(Math.PI * 0.75, Math.PI, localProgress);
  
    } else {
      const localProgress = (scrollProgressRef.current - 0.75) * 4.0;
      settingsRef.current.gap = gsap.utils.interpolate(0.3, 0.25, localProgress);
      settingsRef.current.distortion = gsap.utils.interpolate(0.4, 0.35, localProgress);
      settingsRef.current.twist = gsap.utils.interpolate(1.4, 1.2, localProgress); 
      settingsRef.current.lineCount = gsap.utils.interpolate(55, 60, localProgress); 
      settingsRef.current.lineWidth = gsap.utils.interpolate(0.035, 0.04, localProgress); 
      settingsRef.current.colorShift = gsap.utils.interpolate(0.8, 0.9, localProgress);
      settingsRef.current.glowIntensity = gsap.utils.interpolate(0.8, 0.9, localProgress);
  
      groupRef.current.rotation.x = gsap.utils.interpolate(Math.PI * 0.25, 0.1, localProgress); 
      groupRef.current.rotation.y = gsap.utils.interpolate(Math.PI, Math.PI * 1.5, localProgress); 
    }
  

    materialsRef.current.forEach((mat) => {
      mat.uniforms.uDistortion.value = settingsRef.current.distortion;
      mat.uniforms.uTwist.value = settingsRef.current.twist;
      mat.uniforms.uLineCount.value = settingsRef.current.lineCount;
      mat.uniforms.uLineWidth.value = settingsRef.current.lineWidth;
      mat.uniforms.uColorShift.value = settingsRef.current.colorShift;
      mat.uniforms.uGlowIntensity.value = settingsRef.current.glowIntensity;
      mat.uniforms.uGlowColor.value = new THREE.Color(
        0.2 + settingsRef.current.colorShift * 0.3,
        0.5 + settingsRef.current.colorShift * 0.2,
        0.8 + settingsRef.current.colorShift * 0.1
      );
    });
  
    if (leftSphereRef.current && rightSphereRef.current) {
      const gap = settingsRef.current.gap / 2;
      leftSphereRef.current.position.x = -gap;
      rightSphereRef.current.position.x = gap;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 3.5);
    cameraRef.current = camera;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    group.rotation.y = Math.PI * 0.2;
    group.rotation.x = Math.PI * 0.1;

    createGeometry();
    setupScrollAnimations();
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (renderer) renderer.dispose();
      if (scene) {
        scene.traverse((object) => {
          if (object.isMesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (object.material.isShaderMaterial) {
                object.material.dispose();
              }
            }
          }
        });
      }
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} />
    </>
  );
};

const Invisalign = () => {

  const controls = useAnimation();

  const handleHover = (index) => {
    controls.start({
      y: `${index * 100}%`,
      transition: { type: "tween", duration: 0.3 },
    });
  };

  const [isVisible, setIsVisible] = useState(false);

  const meshRef = useRef();
  useEffect(() => {
    const amplitudeProxy = { value: 0.2 };
    const dummyRotation = {
      x: -Math.PI * 0.4,
      y: 0.3,
      z: Math.PI / 2,
    };

    const positionProxy = { z: 1 };

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".canvas-section",
        start: "top top",
        end: "+=1200",
        scrub: 2,
        pin: true,
      },
    });

    // Rotation Animation
    tl.to(dummyRotation, {
      x: 0,
      y: 0,
      z: 0,
      ease: "none",
      onUpdate: () => {
        if (meshRef.current) {
          meshRef.current.rotation.set(
            dummyRotation.x,
            dummyRotation.y,
            dummyRotation.z
          );
          meshRef.current.position.z = positionProxy.z;
        }
        if (uniformsRef.current) {
          uniformsRef.current.uAmplitude.value = gsap.getProperty(
            amplitudeProxy,
            "value"
          );
        }
      },
    });

    // Amplitude Flattening
    tl.to(
      amplitudeProxy,
      {
        value: 0,
        ease: "none",
        onUpdate: () => {
          if (uniformsRef.current) {
            uniformsRef.current.uAmplitude.value = amplitudeProxy.value;
          }
        },
      },
      "<"
    );

    tl.to(
      positionProxy,
      {
        z: 2,
        ease: "none",
      },
      "<"
    );

    tl.to({}, { duration: 0.5 });
  }, []);

  const uniformsRef = useRef();
  const sectionRef = useRef(null);
  const sphereRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(sphereRef.current, {
        yPercent: 100,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top center',
          end: 'bottom center',
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

useEffect(() => {


  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#scroll-zone",
      start: "top top",
      end: "+=900%",
      scrub: 1,
      pin: true,
      anticipatePin: 1,
    }
  });

  tl.to(".block-1", { opacity: 0, y: -60, duration: 1 });
  tl.fromTo(".block-2", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1 });
  tl.to(".block-2", { opacity: 0, y: -60, duration: 1 });

  tl.to(".model-wrapper", { opacity: 1, duration: 2 }, "-=0.5");

  tl.to(".portal-model", {
    z: -1.2,
    scale: 1.1,
    duration: 3,
    ease: "power2.out"
  });

  tl.add("lockRotation");
  gsap.killTweensOf(".portal-model");
  tl.to(".portal-model", {
    rotationY: 0,
    rotationX: 0,
    rotationZ: 0,
    duration: 1.2,
    ease: "power2.inOut"
  }, "lockRotation");

  tl.to({}, {
    duration: 9,
    ease: "power2.inOut",
    onUpdate() {
      const p = this.progress();
      const cam = window.myCamera;
      if (!cam) return;

      cam.position.z = gsap.utils.interpolate(3, -5, p);
      cam.rotation.set(0, 0, 0);
      cam.fov = gsap.utils.interpolate(45, 8, p < 0.7 ? p : 0.7);
      cam.updateProjectionMatrix();
    }
  }, "-=2");

  tl.to(".model-wrapper", { opacity: 0, duration: 1.2 });

  const idleSpin = gsap.to(".portal-model", {
    rotationY: "+=360",
    duration: 40,
    repeat: -1,
    ease: "none"
  });

  return () => idleSpin.kill();
}, []);

  return (
    <>

{/* 
<section className="mind-mapped">

  <div className="mind-mapped__layout">
    <div className="flow-zone">
       <svg
    viewBox="0 0 96 1332"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flow-line"
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
          floodColor="black"
          floodOpacity="0.9"
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


    <path
      d="M1.00003 1332L1.00006 726.469C1.00007 691.615 18.8257 659.182 48.25 640.5V640.5C77.6744 621.818 95.5 589.385 95.5 554.531L95.5 0"
      stroke="black"
      strokeOpacity="0.2"
      strokeWidth="1"
    />


    <motion.path
      d="M1.00003 1332L1.00006 726.469C1.00007 691.615 18.8257 659.182 48.25 640.5V640.5C77.6744 621.818 95.5 589.385 95.5 554.531L95.5 0"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.4"
      filter="url(#glow-effect)"
      strokeDasharray="620, 1332"
      initial={{ strokeDashoffset: 1952 }}
      animate={{ strokeDashoffset: 0 }}
      transition={{
        repeat: Infinity,
        duration: 4.5,
        ease: "linear",
      }}
    />
  </svg>
    </div>

    <div className="mind-mapped__content">
                    <p className="font-neuehaas45 tracking-wide text-[15px] leading-[1.2] max-w-[650px] mb-20">
                  Trusted by <span className="font-canelathin">millions</span>  around the world, Invisalign is a clear,
                  comfortable, and confident choice for straightening smiles.
                  We've proudly ranked among the top 1% of certified Invisalign
                  providers nationwide — every year since 2000.
                </p>
    </div>
  </div>

  <div className="orb orb--right" />
</section> */}


    <AtmosphereBackground />


<div className="h-screen w-full">


    <Canvas
  camera={{ fov: 42, position: [0, 0, 12] }}
  gl={{
    toneMapping: THREE.ACESFilmicToneMapping,
    outputColorSpace: THREE.SRGBColorSpace,
  }}
        onCreated={({ scene }) => {

        scene.fog = new THREE.FogExp2(0x000000, 0.001);
      }}
>
  <ExposureControl exposure={2} />
  
  <Environment files="/images/qwantani_dusk_2_puresky_4k.hdr" />
  <ambientLight intensity={0.3} />

  <ScrollControls pages={3} damping={0.1}>
    <PortalJourneyModel />
    
  </ScrollControls>
</Canvas>

</div>

      {/* <div className=" font-neuehaas35 min-h-screen px-8 pt-32 relative text-black "> */}

<section className="relative min-h-screen flex flex-col">
  <div className="flex flex-col md:flex-row justify-between items-start px-8 md:px-16 gap-12">


{/* 
    <div id="text-holder" className="text-container max-w-[500px] px-6">

      <div className="text-block block-1">
        <p className="text-[#353839]/90 leading-[1.2] font-neuehaas35 text-[.83em]">
                              The power of Invisalign lies not just in the clear aligners, but in the precision of digitally guided treatment planning. Each case is custom-designed by our doctors using comprehensive, board-eligible diagnostic records. It represents a departure from conventional orthodontics—never before have we been able to prescribe such targeted and controlled tooth movements.
        </p>
        <div className="text-[#353839]/70 font-neuehaas35 text-[26px] flex justify-center pt-[10vh]">
          experience that matters
        </div>
      </div>

      <div className="text-block block-2 opacity-0 absolute inset-0">
        <p className="text-[#353839] leading-[1.2] font-neuehaas35 text-[.83em]">
         Trusted by millions around the world, Invisalign is a clear,
                  comfortable, and confident choice for straightening smiles.
                  We've proudly ranked among the top 1% of certified Invisalign
                  providers nationwide — every year since 2000.
        </p>
      </div>
      
    </div> */}


  {/* <div id="scroll-zone" className="h-[200vh]"></div> */}

  {/* The science of Invisalign is not in the clear aligners, but in overall design and prescription for tooth movement by our doctors based on the full facial evaluation to craft the smile that is perfect for you. Our experienced doctors are top experts and providers in clear aligner treatment. */}
    {/* <h2 className="text-5xl md:text-6xl leading-tight text-[#0f172a]">
            <Copy>
              <div className="relative ml-10 text-[26px] sm:text-[26px] leading-tight text-black font-neuehaasdisplaythin">
                <span className="font-normal">Our doctors </span>{" "}
                <span className="font-light">have treated</span>{" "}
                <span className="font-saolitalic">thousands</span>{" "}
                <span className="font-medium">of patients</span> <br />
                <span className="font-normal">with the </span>{" "}
                <span className="font-light font-saolitalic">industry's leading</span>{" "}
                <span className="font-light ">appliance</span>{" "}
                <span className="font-normal">system.</span>{" "}
              </div>
            </Copy>
          </h2> */}



  </div>
</section>

        {/* <Canvas
          className="pointer-events-none"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            zIndex: 0,
          }}
        >
          <Suspense fallback={null}>
            <DistortedImage
              imageSrc="/images/invisalign_mockup_3.jpg"
              xOffset={-3.5}
              yOffset={0}
            />
            <DistortedImage
              imageSrc="/images/invisalign_mockup_3.jpg"
              xOffset={3.5}
              yOffset={-2.5}
            />
            <EffectComposer>
              <Fluid backgroundColor="#FFF" />
            </EffectComposer>
          </Suspense>
        </Canvas> */}
     
      {/* </div> */}
      <div className="relative">
        <section className="mt-[20vh] relative min-h-screen">

            {/* <div className="py-20 relative flex flex-col items-center w-full">
<div className="relative w-[75%]">
    <img
      src="/images/ipadoutline.png"
      className="w-full h-auto rounded-md"
      alt="iPad outline"
    />
<div
  style={{
    position: "absolute",
    top: "10%",
    left: "50%",
    transform: "translateX(-57%)",
    fontFamily: "Mantranaga",
    textAlign: "center",
    pointerEvents: "none",
    display: "flex",
    gap: "0.4em"
  }}
  className="text-black uppercase text-[clamp(50px,5vw,72px)]"
>
      <span>Smile</span>
      <span></span>
      <img
        src="/images/brutalistshape.png"
        alt="symbol"
        style={{
          height: "1.3em",
          verticalAlign: "-0.15em",
          transform: "scale(0.85)",
          display: "inline-block"
        }}
      />
      <span>Club</span>
    </div>
</div>
<div
  style={{
    position: "absolute",
    top: "33%",
    left: "25%",
    transform: "translate(-20%, -10%)", 
    pointerEvents: "none",
    display: "flex",
    gap: "0.4em"
  }}
  className="font-neuehaas45 text-black text-[14px] max-w-[400px]"
>
With over 40 years of combined experience, our doctors were the first in the region to offer Invisalign—setting the benchmark well before it became the industry standard.
</div>
  <div
    style={{
      position: "absolute",
      width: "65%",
      maxWidth: "700px",
      height: "50%",
      top: "60%",
      left: "55%",
      transform: "translate(-70%, -50%)",
      backgroundColor: "transparent",
      pointerEvents: "none"
    }}
  >
    <svg
      viewBox="0 0 1800 840"
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      style={{ display: "block" }}
    >
      <defs>
        <mask id="ipad-mask">
          <rect width="100%" height="100%" fill="black" />
          <path
            fill="white"
            d="M1800,60V420c0,33.14-26.86,60-60,60h-360c-33.14,0-60,26.86-60,60h0c0,33.14-26.86,60-60,60h-240c-33.14,0-60,26.86-60,60h0c0,33.14,26.86,60,60,60h120c33.14,0,60,26.86,60,60h0c0,33.14-26.86,60-60,60H180c-33.14,0-60-26.86-60-60h0c0-33.14-26.86-60-60-60h0c-33.14,0-60-26.86-60-60V180c0-33.14,26.86-60,60-60H1140c33.14,0,60-26.86,60-60h0c0-33.14,26.86-60,60-60h480c33.14,0,60,26.86,60,60Z"
          />
        </mask>
      </defs>

      <foreignObject
        width="100%"
        height="100%"
        style={{
          mask: "url(#ipad-mask)",
          WebkitMask: "url(#ipad-mask)"
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative"
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
            src="/videos/swirlymarblevideosaturated.mp4"
          />
        </div>
      </foreignObject>
    </svg>
  </div>
  <div
  style={{
    position: "absolute",
    top: "50%",
    left: "80%",
    transform: "translate(-50%, -50%) rotate(7deg)",
    width: "140px",
    height: "auto",
    pointerEvents: "none",
    zIndex: 10,
  }}
>
  <img
    src="/images/brutalistarrow.png"
    alt="arrowshape"
    style={{
      width: "100%",
      height: "auto",
      display: "block"
    }}
  />
</div>
  <div
    style={{
      position: "absolute",
      width: "25%",
      maxWidth: "260px",
      height: "50%",
      top: "72%",
      left: "70%",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none"
    }}
  >
    <img
      src="/images/capsuleshapetext.png"
      alt="Capsule"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain"
      }}
    />
  </div>
</div> */}

              {/* <img
             
                src="/images/ipadmockup.png"
                className="max-w-[90%] sm:max-w-[90%] lg:max-w-[90%] h-auto"
                alt="Man holding laptop"
              /> */}

 
<section ref={sectionRef} className="relative w-full overflow-hidden">
{/* <div ref={sphereRef} className="absolute top-0 left-0 w-full h-[600px] pointer-events-none z-0">
        <MorphingSphere sectionRef={sectionRef} />
      </div> */}


<div className="z-10">
<div className="relative flex flex-col items-center justify-center">

              <h4 className=" text-sm mb-6 font-neuehaas35">Synopsis</h4>
              <Copy>
                <p className="font-neuehaas45 text-[18px] leading-[1.2] max-w-[650px] mb-20">
                  Trusted by millions around the world, Invisalign is a clear,
                  comfortable, and confident choice for straightening smiles.
                  We've proudly ranked among the top 1% of certified Invisalign
                  providers nationwide — every year since 2000.
                </p>
              </Copy>
            </div>
<div   className="relative border-t border-gray-300">
<div className="relative py-8 md:py-10">

    <div className="grid grid-cols-12 gap-6 px-6 md:px-10 lg:px-16">
      <div className="hidden md:block md:col-span-6 lg:col-span-7" />
      <div className="col-span-12 md:col-span-6 lg:col-span-5 justify-self-end max-w-[760px] pt-8 md:pt-10">
        <h2 className="text-[20px] md:text-[20px] font-neuehaas45 text-black mb-4 text-left">
          Teeth Remain Completely Visible
        </h2>
        <p className="text-[13px] md:text-[15px] font-neuehaas45 leading-relaxed text-gray-800 text-left">
          Unlike braces, Invisalign doesn’t obscure your smile with wires or brackets. That means early progress is easier to see and appreciate.
        </p>
      </div>
    </div>
  </div>
</div>
 <div  className="relative border-t border-gray-300">
  <div className="relative py-8 md:py-10">

 
    <div className="grid grid-cols-12 gap-6 px-6 md:px-10 lg:px-16">
      <div className="hidden md:block md:col-span-6 lg:col-span-7" /> 
      
      <div className="col-span-12 md:col-span-6 lg:col-span-5 justify-self-end max-w-[760px]">
        <h2 className="text-[20px] md:text-[20px] font-neuehaas45 text-black mb-4 text-left">
          Designed for Comfort
        </h2>
        <p className="text-[13px] md:text-[15px] font-neuehaas45 leading-relaxed text-gray-800 text-left">
          Invisalign aligners are crafted using one of the most advanced
          and researched fabrication processes in the world. Each aligner is
          engineered to fit complex tooth arrangements with precision and is
          continuously updated to maintain accuracy throughout the course of treatment.
        </p>
      </div>
    </div>
  </div>
</div>
      <div className="relative border-t border-gray-300">
  <div className="relative py-8 md:py-10">


 
    <div className="grid grid-cols-12 gap-6 px-6 md:px-10 lg:px-16">
      <div className="hidden md:block md:col-span-6 lg:col-span-7" /> 
      
      <div className="col-span-12 md:col-span-6 lg:col-span-5 justify-self-end max-w-[760px]">
        <h2 className="text-[20px] md:text-[20px] font-neuehaas45 text-black mb-4 text-left">
    Tailored to You
        </h2>
        <p className="text-[13px] md:text-[15px] font-neuehaas45 leading-relaxed text-gray-800 text-left">
 While our team has extensive expertise in placing braces,
                  traditional brackets are ultimately prefabricated based on
                  average tooth morphology. With Invisalign, your treatment
                  begins in our office using advanced 3D scanning technology to
                  capture the precise contours of your teeth. From this data,
                  our doctors develop a fully customized plan, guiding a
                  sequence of aligners engineered to move your teeth into
                  alignment with exacting precision.
        </p>
      </div>
    </div>
  </div>
</div>
      <div  className="relative border-t border-gray-300">
  <div className="relative py-8 md:py-10">


 
    <div className="grid grid-cols-12 gap-6 px-6 md:px-10 lg:px-16">
      <div className="hidden md:block md:col-span-6 lg:col-span-7" /> 
      
      <div className="col-span-12 md:col-span-6 lg:col-span-5 justify-self-end max-w-[760px]">
        <h2 className="text-[20px] md:text-[20px] font-neuehaas45 text-black mb-4 text-left">
    Ease of Cleaning
        </h2>
        <p className="text-[13px] md:text-[15px] font-neuehaas45 leading-relaxed text-gray-800 text-left">
                 Traditional braces complicate even the most basic oral
                  hygiene. With Invisalign, your aligners come off
                  completely—allowing unrestricted access for brushing and
                  flossing around every surface of every tooth.

        </p>
      </div>
    </div>
  </div>
</div>
      <div className="relative border-t border-gray-300">
  <div className="relative py-8 md:py-10">


 
    <div className="grid grid-cols-12 gap-6 px-6 md:px-10 lg:px-16">
      <div className="hidden md:block md:col-span-6 lg:col-span-7" /> 
      
      <div className="col-span-12 md:col-span-6 lg:col-span-5 justify-self-end max-w-[760px]">
        <h2 className="text-[20px] md:text-[20px] font-neuehaas45 text-black mb-4 text-left">
 Removable and Flexible
        </h2>
        <p className="text-[13px] md:text-[15px] font-neuehaas45 leading-relaxed text-gray-800 text-left">
                  No wires or brackets. No dietary limitations. No
                  interruptions. Just a treatment that fits your life.
        </p>
      </div>
    </div>
  </div>
</div>
                <div className="relative border-t border-gray-300">
  <div className="relative py-8 md:py-10">

 
    <div className="grid grid-cols-12 gap-6 px-6 md:px-10 lg:px-16">
      <div className="hidden md:block md:col-span-6 lg:col-span-7" /> 
      
      <div className="col-span-12 md:col-span-6 lg:col-span-5 justify-self-end max-w-[760px]">
        <h2 className="text-[20px] md:text-[20px] font-neuehaas45 text-black mb-4 text-left">
Treatment Duration
        </h2>
        <p className="text-[13px] md:text-[15px] font-neuehaas45 leading-relaxed text-gray-800 text-left">
               Because Invisalign is precisely engineered to your exact tooth
                  morphology, movement in all three dimensions can begin as
                  early as the first week. This level of control allows for
                  greater efficiency—and in many cases, a shorter overall
                  treatment time compared to braces.
        </p>
      </div>
    </div>
  </div>
</div>
            </div>
      </section>
            <div className="flex justify-center gap-6 p-6">
              <img
                src="/images/manholdinglaptop.png"
                className="max-w-[45%] h-auto rounded-md"
              />

            </div>

            <div className="font-neuehaas45 flex justify-center items-center mx-auto max-w-[650px] relative min-h-screen">
              The power of Invisalign lies not just in the clear aligners, but
              in the precision of digitally guided treatment planning. Each case
              is custom-designed by our doctors using comprehensive,
              board-eligible diagnostic records. It represents a departure from
              conventional orthodontics—never before have we been able to
              prescribe such targeted and controlled tooth movements.
            </div>
            <div className="font-neuehaas45 flex justify-center items-center mx-auto max-w-[650px] relative min-h-screen">
              While mail-order aligner companies may promise convenience, they
              often overlook critical aspects of dental malocclusion—such as
              bite alignment, arch coordination, and skeletal discrepancies.
              Additionally, these systems lack high-quality diagnostic records,
              bypass 3D imaging, and rely on generic assumptions with remote
              planning by providers you’ll never meet. You won’t have the
              opportunity to choose who oversees your treatment or assess their
              qualifications. These systems often produce oversimplified plans
              that can result in more complex issues down the line.
            </div>
            <div className=" font-neuehaas35 min-h-screen px-8 pt-32 relative text-black ">
              <div className="flex justify-center items-center text-center text-[30px] pb-20">
                Introducing two treatment approaches, built around your needs
              </div>
              <div className="flex items-center justify-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-8xl w-full">
                  <div className="flex flex-col items-center gap-[10px]">
                    <div className="flex flex-col items-center justify-center relative w-full overflow-hidden px-0 py-[70px] min-h-fit rounded-[8px] border border-solid border-[rgba(240,240,240)] bg-[rgba(240,240,240,0.19)] opacity-100">
                      <div className="relative w-[86%] aspect-[1.6] overflow-hidden rounded-[8px] border border-solid border-[rgb(240,240,240)]">
                        <img
                          src="/images/invisbox.png"
                          alt="Frysta"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="font-neuehaas45 flex items-center justify-between w-[100%]">
                      <div>
                        <h3 className="text-[16px]  text-gray-800">
                          Flex Plan
                        </h3>
                        <p className="font-neuehaas45 text-sm text-gray-500 max-w-5xl">
                          Designed for adult patients seeking a streamlined
                          treatment with fewer in-office visits—resulting in a
                          lower overall investment. Includes 6–8 total
                          appointments spaced for optimal efficiency, without
                          compromising results. These cases span 8–14 months and
                          must meet certain clinical qualifications. Treatment
                          includes two sets of aligners. Every qualifying
                          patient can expect results that are satisfactory to
                          both them and the treating doctor.
                        </p>
                      </div>
                      <span className="text-xs font-semibold bg-green-100 text-green-600 px-2 py-1 rounded-full">
                        New
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-[10px]">
                    <div className="flex flex-col items-center justify-center relative w-full overflow-hidden px-0 py-[70px] min-h-fit rounded-[8px] border border-solid border-[rgba(240,240,240)] bg-[rgba(240,240,240,0.19)] opacity-100">
                      <div className="relative w-[86%] aspect-[1.6] overflow-hidden rounded-[8px] border border-solid border-[rgb(240,240,240)]">
                        <img
                          src="/images/invisalign_mockup_3.jpg"
                          alt="Folium"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="font-neuehaas45 flex items-center justify-between w-[100%]">
                      <div>
                        <h3 className="text-[16px]  text-gray-800">
                          Unlimited Smiles
                        </h3>
                        <p className="font-neuehaas45 text-sm text-gray-500">
                          Offers more hands-on support throughout your smile
                          journey, with extended appointment access and tailored
                          adjustments at every step.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
   
        </section>

    
        {/* <div className="min-h-screen relative">
            <div className="font-neuehaas45 perspective-1500 text-[#0414EA]">
              <div className="flip-wrapper">
                <div className="flip-container">
                  <div className="face front">Teeth remain completely visible</div>
                  <div className="face back">
                    Initial results are more readily apparent than with braces. Wires and brackets obscure positioning you can not only view results faster. 
                  </div>
                </div>

                <div className="flip-container">
                  <div className="face front">Designed for Comfort</div>
                  <div className="face back">
                   Invisalign manufacturing is the most researched and advanced fabrication process in the world. Your aligners will accurately fit any complex tooth arrangement and will continue to through the course of treatment. 
                  </div>
                </div>

                <div className="flip-container">
                  <div className="face front">Tailored to You</div>
                  <div className="face back">
                    Although our doctors and our team are experts at placing braces, the braces are ultimately prefabricated based on average tooth morphology. Invisalign is made specifically to your tooth shape with our advanced 3d scanners. Your journey starts with advanced 3D imaging. From there,
                    doctor-personalized plans guide a series of custom
                    aligners—engineered to move your teeth perfectly into place.
                  </div>
                </div>

                <div className="flip-container">
                  <div className="face front">Removable & Flexible</div>
                  <div className="face back">No wires. No food limitations. </div>
                </div>

                <div className="flip-container">
                  <div className="face front">Ease of cleaning</div>
                  <div className="face back">
                    Not only can you completely clean your aligners, you can completely clean your teeth and floss between every tooth.
                  </div>
                </div>
                <div className="flip-container">
                  <div className="face front">Treatment duration</div>
                  <div className="face back">
                    Because Invisalign is made for your exact tooth shape and position, movement of all three dimensions can begin in the first week of treatment which can lead to shorter treatment time.dfg
                  </div>
                </div>
              </div>
            </div>
          </div> */}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* <Suspense fallback={null}>
          <BulgeGallery
            slides={[
              { image: "/images/invisalignphonemockup.png" },
              { image: "/images/totebag2.jpg" },
            ]}
          />
        </Suspense> */}
     
      </div>
    </>
  );
};

export default Invisalign;

function ExposureControl({ exposure = 2 }) {
  const { gl } = useThree()

  useEffect(() => {
    gl.toneMappingExposure = exposure
  }, [gl, exposure])

  return null
}

function EnvMap() {
  const { scene, gl } = useThree()
  const texture = useLoader(THREE.TextureLoader, "/images/environment-map.jpg")

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    pmrem.compileEquirectangularShader()

    const envMap = pmrem.fromEquirectangular(texture).texture

    scene.environment = envMap

    texture.dispose()
    pmrem.dispose()
  }, [texture, scene, gl])

  return null
}
function PortalJourneyModel() {
  const { scene } = useGLTF("/models/femalehead.glb")
  const { camera, gl } = useThree()
  const anomalyRef = useRef()
  const groupRef = useRef(null)
  const materialRef = useRef(null)

  useEffect(() => {
    scene.updateMatrixWorld(true)
  scene.position.set(0, 0, 0)
  scene.scale.set(1, 1, 1)

    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())

    scene.position.x -= center.x
    scene.position.z -= center.z
    scene.position.y -= center.y

    const desiredHeight = 14; 
    const scaleFactor = desiredHeight / size.y;
    scene.scale.setScalar(scaleFactor);

    scene.position.y = -5;
scene.updateMatrixWorld(true)

const finalBox = new THREE.Box3().setFromObject(scene)
const finalCenter = finalBox.getCenter(new THREE.Vector3())
const finalSize = finalBox.getSize(new THREE.Vector3())

console.log("FINAL CENTER", finalCenter)
console.log("FINAL SIZE", finalSize)
  if (anomalyRef.current) {
    anomalyRef.current.position.set(
      finalCenter.x - finalSize.x * 0.2,
      finalCenter.y + finalSize.y * 0.26,
      finalCenter.z - finalSize.z * -.1
    )

    anomalyRef.current.scale.setScalar(finalSize.y * 0.025)
  }
    scene.traverse((child) => {
      if (child.isMesh) {
        
        if (!child.geometry.attributes.normal) {
          child.geometry.computeVertexNormals();
        }

        const material = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            viewVector: { value: camera.position.clone() },
            
            baseColorVec: { value: new THREE.Color(0xFFF5FA) }, // Pale pinkish white
            fresnelColorVec: { value: new THREE.Color(0xC8B3FF) }, // Soft Violet/Blue
            rimColorVec: { value: new THREE.Color(0xFFCD80) }, // Warm Orange/Yellow
            

            iridIntensity: { value: 0.2 },
            iridMix: { value: 0.7 },
            fresnelPower: { value: 3.0 },
            fresnelMix: { value: 1.5 },
            rimPower: { value: 4.0 },
            rimMix: { value: 0.8 },
            timeSpeed: { value: 0.2 },
            rotationSpeed: { value: 0.01 },
          },
          
          vertexShader: `
            uniform float time;
            uniform float rotationSpeed;
            
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec3 vWorldPosition;
            varying vec3 vPosition;
            varying vec3 vOriginalNormal;

            // Rotation matrix functions
            mat3 rotationX(float angle) {
              float s = sin(angle);
              float c = cos(angle);
              return mat3(
                1.0, 0.0, 0.0,
                0.0, c, -s,
                0.0, s, c
              );
            }

            mat3 rotationY(float angle) {
              float s = sin(angle);
              float c = cos(angle);
              return mat3(
                c, 0.0, s,
                0.0, 1.0, 0.0,
                -s, 0.0, c
              );
            }

            mat3 rotationZ(float angle) {
              float s = sin(angle);
              float c = cos(angle);
              return mat3(
                c, -s, 0.0,
                s, c, 0.0,
                0.0, 0.0, 1.0
              );
            }

            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                vec3 objectNormal = normal;      
         float angle = time * 0.05;
mat3 rotation = rotationY(angle);
vec3 rotatedNormal = rotation * normal;
vNormal = normalize(normalMatrix * rotatedNormal);
                vOriginalNormal = normalize(normalMatrix * objectNormal);
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                vPosition = position;
                gl_Position = projectionMatrix * mvPosition;
            }
          `,
          
          fragmentShader: `
            uniform float time;
            uniform float timeSpeed;
            uniform vec3 viewVector;

            uniform vec3 baseColorVec;
            uniform float iridIntensity;
            uniform float iridMix;

            uniform vec3 fresnelColorVec;
            uniform float fresnelPower;
            uniform float fresnelMix;

            uniform vec3 rimColorVec;
            uniform float rimPower;
            uniform float rimMix;

            uniform float rotationSpeed;

            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec3 vWorldPosition;
            varying vec3 vPosition;
            varying vec3 vOriginalNormal;

            void main() {
                // Normalize inputs - use the rotated normal from vertex shader
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                
                float dotNV = abs(dot(normal, viewDir));
                dotNV = clamp(dotNV, 0.0, 1.0);
                
                float posVariation = sin(vPosition.x * 10.0 + time * 2.0) * 
                                    cos(vPosition.y * 8.0 + time * 1.5) * 0.15;

             // Mid-range spectral separation (between chrome and pearl)
vec3 hueShift = 0.5 + 0.5 * cos(
  time * timeSpeed +
  dotNV * 6.0 +
  vec3(0.0, 0.8, 1.6)   // middle ground offsets
);
                
                vec3 irid = baseColorVec + hueShift * iridIntensity;
                
                vec3 finalColor = irid * iridMix;
                
                // Fresnel edge glow - will now shift and flow across the surface
                float fresnel = pow(1.0 - dotNV, fresnelPower);
                finalColor += fresnel * fresnelColorVec * fresnelMix;
                
                // Rim lighting - will create flowing highlights
                float rim = pow(1.0 - dotNV, rimPower);
                finalColor += rim * rimColorVec * rimMix;
                
                finalColor += posVariation * 0.2;
                
                float normalShift = sin(normal.x * 5.0 + time) * 
                                   cos(normal.y * 5.0 + time * 0.8) * 
                                   sin(normal.z * 5.0 + time * 1.2);
                finalColor += vec3(normalShift * 0.1, normalShift * 0.05, normalShift * 0.15);
                
                finalColor = max(finalColor, vec3(0.0));
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
          `,
          side: THREE.DoubleSide,
        });

        child.material = material;
        materialRef.current = material;
      
        material.needsUpdate = true;
      }
    });

    camera.position.set(-22, 2, 10);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

  }, [scene, camera]);


const scroll = useScroll()
const camStart = new THREE.Vector3(-22, 2, 10)
const camNearSkull = new THREE.Vector3(-8, 1.5, 8)
const camInside = new THREE.Vector3(0, 0, -2)
useFrame((state) => {
  const t = scroll.offset

  scene.traverse((child) => {
    if (child.isMesh && child.material.uniforms?.time) {
      child.material.uniforms.time.value = state.clock.elapsedTime
    }
  })

  if (t < 0.5) {
    const ease = Math.pow(t / 0.5, 0.9)

    camera.position.lerpVectors(
      camStart,
      camNearSkull,
      ease
    )

    camera.lookAt(0, 0, 0)
  } else {
    const ease = (t - 0.5) / 0.5

    camera.position.lerpVectors(
      camNearSkull,
      camInside,
      ease
    )

    camera.lookAt(0, 0, -3)
  }
})
  return (
<group ref={groupRef}>
  <primitive object={scene} />
  <group ref={anomalyRef}>
    <CosmicField />
  </group>
  
</group>
  );
}
const createPointMaterial = (mouseRef) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      uMouse: { value: new THREE.Vector2(-10, -10) }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 randomDir;
      varying vec3 vColor;
      varying float vDistance;
      varying float vMouseEffect;
      uniform float time;
      uniform vec2 uMouse;
      
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
      void main() {
        vColor = color;
        
        float noiseFrequency = 0.7;
        float noiseAmplitude = (0.8 + vMouseEffect * 3.5);
        vec3 noiseInput = position * noiseFrequency + time * 0.15;
        vec3 displacement = vec3(snoise(noiseInput), snoise(noiseInput + vec3(10.0)), snoise(noiseInput + vec3(20.0)));
        vec3 finalPos = position + displacement * noiseAmplitude;
        
        vec4 projectedVertex = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec2 screenPos = projectedVertex.xy / projectedVertex.w;
        float mouseDist = distance(screenPos, uMouse);
        float mouseEffect = 1.0 - smoothstep(0.0, 0.25, mouseDist);
        vMouseEffect = mouseEffect;
        
        float pulse = sin(time + length(position)) * 0.1 + 1.0;
        
        vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
        vDistance = -mvPosition.z;
        gl_PointSize = size * (400.0 / -mvPosition.z) * pulse * (1.0 + vMouseEffect * 0.5);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vMouseEffect;
      uniform float time;
      
      float rand(vec2 co){ return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); }
      void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        float r = dot(cxy, cxy);
        if (r > 1.0) discard;
        
        float glow = exp(-r * 3.5) + vMouseEffect * 0.5;
        float twinkle = rand(gl_PointCoord + time) * 0.5 + 0.5;
        
        vec3 finalColor = vColor * (1.1 + sin(time * 0.8) * 0.2 + vMouseEffect * 0.5) * glow * twinkle;
        gl_FragColor = vec4(finalColor, smoothstep(0.0, 1.0, glow));
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
};

const defaultTheme = {
  sphere: [
    new THREE.Color().setHSL(0.45, 0.8, 0.6), 
    new THREE.Color().setHSL(0.50, 0.8, 0.6), 
    new THREE.Color().setHSL(0.55, 0.8, 0.6), 
    new THREE.Color().setHSL(0.60, 0.8, 0.6), 
    new THREE.Color().setHSL(0.65, 0.8, 0.6), 
  ],
  rings: (i, count, j, pCount) => {
    const baseHue = 0.45 + (i / count) * 0.15; 
    const variation = (j / pCount) * 0.03; 
    const hue = Math.min(baseHue + variation, 0.65);
    return new THREE.Color().setHSL(hue, 0.8, 0.6);
  }
};

const LensflareSprite = () => {
  const texture = useTexture('https://threejs.org/examples/textures/lensflare/lensflare0.png');
  
  return (
    <sprite position={[0, 0, 0]} scale={[2, 2, 1]}>
      <spriteMaterial 
        map={texture} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false}
        transparent
        opacity={0.8}
      />
    </sprite>
  );
};

const SpiralSphere = ({ mouseRef }) => {
  const pointsRef = useRef();
  const materialRef = useRef(createPointMaterial(mouseRef));
  
  const [geometry] = useMemo(() => {
    const particleCount = 40000;
    const radius = 5;
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const randomDirs = new Float32Array(particleCount * 3).fill(0);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      
      positions[i3] = radius * Math.cos(theta) * Math.sin(phi);
      positions[i3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      sizes[i] = Math.random() * 0.2 + 0.1;
    }

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const colorPos = (i / particleCount) * (defaultTheme.sphere.length - 1);
      const c1 = defaultTheme.sphere[Math.floor(colorPos)];
      const c2 = defaultTheme.sphere[Math.min(Math.floor(colorPos) + 1, defaultTheme.sphere.length - 1)];
      const color = new THREE.Color().copy(c1).lerp(c2, colorPos - Math.floor(colorPos));
      
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('randomDir', new THREE.BufferAttribute(randomDirs, 3));

    return [geom];
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uMouse.value.copy(mouseRef.current);
    }
    if (pointsRef.current) {
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      pointsRef.current.scale.set(breathe, breathe, breathe);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={materialRef.current} />
  );
};

const OrbitRings = ({ mouseRef }) => {
  const groupRef = useRef();
  const materialsRef = useRef([]);

  const rings = useMemo(() => {
    const rings = [];
    const count = 8;
    const radius = 7.5;
    const thickness = 0.6;

    for (let i = 0; i < count; i++) {
      const particleCount = 4000;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const randomDirs = new Float32Array(particleCount * 3);
      const randomVec = new THREE.Vector3();

      for (let j = 0; j < particleCount; j++) {
        const j3 = j * 3;
        const angle = (j / particleCount) * Math.PI * 2;
        const radiusVariation = radius + (Math.random() - 0.5) * thickness;
        
        positions[j3] = Math.cos(angle) * radiusVariation;
        positions[j3 + 1] = (Math.random() - 0.5) * (thickness * 0.5);
        positions[j3 + 2] = Math.sin(angle) * radiusVariation;
        
        sizes[j] = Math.random() * 0.15 + 0.08;
        
        randomVec.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
        randomDirs[j3] = randomVec.x;
        randomDirs[j3 + 1] = randomVec.y;
        randomDirs[j3 + 2] = randomVec.z;

        const color = defaultTheme.rings(i, count, j, particleCount);
        colors[j3] = color.r;
        colors[j3 + 1] = color.g;
        colors[j3 + 2] = color.b;
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geom.setAttribute('randomDir', new THREE.BufferAttribute(randomDirs, 3));

      const material = createPointMaterial(mouseRef);
      materialsRef.current.push(material);

      rings.push(
        <points 
          key={i} 
          geometry={geom} 
          material={material}
          rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
        />
      );
    }
    return rings;
  }, [mouseRef]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    materialsRef.current.forEach(mat => {
      mat.uniforms.time.value = time;
      mat.uniforms.uMouse.value.copy(mouseRef.current);
    });

    if (groupRef.current) {
      groupRef.current.children.forEach((ring, index) => {
        const speed = 0.0005 * (index + 1);
        ring.rotation.z += speed;
        ring.rotation.x += speed * 0.3;
        ring.rotation.y += speed * 0.2;
        ring.scale.y = 1.0 + Math.sin(time * 3.0 + index * 0.5) * 0.2;
      });
    }
  });

  return <group ref={groupRef}>{rings}</group>;
};

const CosmicField = ({ 
  mouseRef: externalMouseRef,
  enableBloom = true,
  enableFog = true,
  enableRotation = true 
}) => {
  const internalMouseRef = useRef(new THREE.Vector2(-10, -10));
  const groupRef = useRef();
  const { scene } = useThree();

  const mouseRef = externalMouseRef || internalMouseRef;

  useEffect(() => {
    if (enableFog) {
      scene.fog = new THREE.FogExp2(0x000000, 0.008);
    }

    return () => {
      if (enableFog) {
        scene.fog = null;
      }
    };
  }, [scene, enableFog]);

  useEffect(() => {
    if (!externalMouseRef) {
      const handleMouseMove = (event) => {
        mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [externalMouseRef, mouseRef]);

  useFrame(() => {
    if (enableRotation && groupRef.current) {
      groupRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <group ref={groupRef}>
      <SpiralSphere mouseRef={mouseRef} />
      <OrbitRings mouseRef={mouseRef} />

      
      <pointLight position={[0, 0, 0]} intensity={2} distance={0} />
      {/* <LensflareSprite /> */}
    </group>
  );
};

function Atmosphere() {
  const vertexShader = `
attribute float randomAmp;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;


const fragmentShader = `
  uniform vec2 uResolution;   
  uniform float uTime;      
  uniform vec2 uMouse;  
  varying vec2 vUv;  

  #define PI 3.14159265359

  mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
  }


float wave(vec2 p, float phase, float freq) {
    return sin(p.x * freq + phase) * 0.05;  
}


  float glowLine(float dist, float thickness, float intensity) {
    return intensity * thickness / (abs(dist) + thickness * 0.5);
  }

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                   + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float rand1(float n) { return fract(sin(n * 91.3458) * 47453.5453); }

  float ribbonBody(float yDist) { return smoothstep(1.2, 0.0, abs(yDist)); }

  void main() {

    vec2 worldUV = (vUv - 0.5) * 2.0; 
    worldUV.x *= uResolution.x / uResolution.y;       
    vec2 uv = worldUV;
    vec2 uv0 = worldUV;

vec3 baseGray = vec3(0.72, 0.74, 0.76);
vec3 softGray = vec3(0.68, 0.70, 0.72);

vec3 bg = mix(softGray, baseGray, vUv.x);


vec3 etherealBlue = vec3(0.78, 0.84, 0.90);  
vec3 creamEdge    = vec3(0.88, 0.92, 0.96);  

float arc = smoothstep(
    1.35,
    0.15,
    length(vec2(uv0.x * 0.75 - 0.35, uv0.y * 1.15))
);

bg = mix(bg, etherealBlue, arc * 0.35);


float verticalBand = exp(-abs(uv0.x - 0.12) * 4.0);
bg = mix(bg, creamEdge, verticalBand * 0.24);

float verticalFalloff = smoothstep(1.0, -0.5, uv0.y);
bg = mix(bg, vec3(0.80, 0.83, 0.87), verticalFalloff * 0.12);


float fog = snoise(uv0 * 0.35 + uTime * 0.02) * 0.025;
bg += fog;


float luma = dot(bg, vec3(0.299, 0.587, 0.114));
bg = mix(vec3(luma), bg, 0.95);

bg *= 1.04;

vec3 col = bg;

float bandNoise = snoise(uv0 * 0.25 + vec2(uTime * 0.01, 0.0));
bandNoise = bandNoise * 0.5 + 0.5;

float orangeBand = smoothstep(0.2, 0.8, abs(uv0.x + 0.15));
orangeBand *= smoothstep(0.8, 0.2, abs(uv0.x - 0.4));

float bandMask = bandNoise * orangeBand;

vec3 softPeach = vec3(0.96, 0.78, 0.68);  // desaturated orange
vec3 mutedApricot = vec3(0.94, 0.72, 0.62);

vec3 orangeTone = mix(softPeach, mutedApricot, bandNoise * 0.4);


col = mix(col, orangeTone, bandMask * 0.10);


float milkCloud1 = snoise(uv0 * 0.6 + vec2(uTime * 0.01, 0.0));
float milkCloud2 = snoise(uv0 * 1.2 + vec2(0.0, uTime * 0.015));

float milkCloud = (milkCloud1 * 0.6 + milkCloud2 * 0.4);
milkCloud = milkCloud * 0.5 + 0.5; // normalize

milkCloud = smoothstep(0.35, 0.85, milkCloud);

float creamField = snoise(uv0 * 0.45 + vec2(uTime * 0.01, 0.0));
creamField = creamField * 0.5 + 0.5;
creamField = smoothstep(0.4, 0.8, creamField);

vec3 softCream = vec3(0.98, 0.96, 0.92);
vec3 warmWhite = vec3(1.0, 0.99, 0.97);

// vertical bias 
float creamLift = smoothstep(-0.2, 0.8, uv0.y);

vec3 creamTone = mix(softCream, warmWhite, creamLift * 0.5);

col = mix(col, creamTone, creamField * 0.18);

vec3 pearlBase = vec3(0.985, 0.99, 1.0);
vec3 pearlCool = vec3(0.96, 0.98, 1.0);

float pearlShift = sin(uTime * 0.05) * 0.5 + 0.5;
vec3 pearlTone = mix(pearlBase, pearlCool, pearlShift * 0.4);

col = mix(col, pearlTone, milkCloud * 0.25);
    vec2 mouse_uv = (uMouse - 0.5) * 2.0;
    mouse_uv.x *= uResolution.x / uResolution.y;
    float mouseDist = length(uv - mouse_uv);

    uv += (mouse_uv - uv) * (0.3 / (mouseDist + 0.5));  // warp space toward cursor

    vec2 uvNoise = uv * rot(uTime * 0.05);
    float waveNoise = snoise(uvNoise * 2.0 + uTime * 0.2) * 0.1;

vec3 ribbonDark     = vec3(0.30, 0.55, 0.85);
vec3 ribbonMid      = vec3(0.40, 0.70, 1.00);
vec3 ribbonLight    = vec3(0.65, 0.85, 1.00);
vec3 ribbonCoreGlow = vec3(0.55, 0.90, 1.00);

    float segLen = 10.0;  // lifetime of ribbon
float milkLuma = dot(col, vec3(0.299, 0.587, 0.114));
col = mix(vec3(milkLuma), col, 0.92);


float brightness = dot(col, vec3(0.299, 0.587, 0.114));
col += vec3(1.0) * pow(brightness, 2.2) * 0.035;
    for (int i = 0; i < 2; i++) {
      float slotIndex = float(i);
      float slotTime = uTime + slotIndex * 5.17;       
      float lifeIndex = floor(slotTime / segLen);
      float tNorm = fract(slotTime / segLen);  

      // starts above screen, falls below
      float centerY = mix(2.4, -2.4, tNorm);
      float yRel = worldUV.y - centerY;

      float bodyMask = 1.0 - smoothstep(1.4, 1.8, abs(yRel));
      float timeMask = smoothstep(0.05, 0.15, tNorm) * (1.0 - smoothstep(0.85, 0.95, tNorm));
      float visibility = bodyMask * timeMask;

      if (visibility > 0.001) {
        float seed = lifeIndex + slotIndex * 23.71;
        float xCenter = mix(-0.9, 0.9, rand1(seed * 1.3));
       float freq = mix(0.25, 0.55, rand1(seed * 2.1));
        float phase   = rand1(seed * 3.7) * 6.28318;
        float ampMod  = mix(0.7, 1.2, rand1(seed * 4.9));

        float waveVal = wave(vec2(worldUV.y * ampMod + phase, worldUV.y * 0.5),
                             uTime * 1.2 + phase, freq);
      waveVal += waveNoise * 0.35;

        float distX = (worldUV.x - xCenter) - waveVal;

float thickness = 0.2;  // slightly tighter
float intensity = 0.18;  // much brighter
        

float core = smoothstep(thickness, 0.0, abs(distX)) * intensity * visibility;

float body = exp(-pow(distX / (thickness * 1.4), 2.0))
             * intensity * 0.7 * visibility;

        float haze = exp(-abs(distX) * 8.0) * 0.025 * visibility; // Tighter

float innerCore = exp(-pow(distX / (thickness * 0.45), 2.0)) 
                  * intensity * 0.9 * visibility;

        float grad = smoothstep(-0.25, 0.25, distX);
        grad = pow(grad, 1.1);     // soften
        float edge = smoothstep(0.15, 0.75, abs(distX));

        vec3 coreTone = mix(ribbonDark, ribbonMid, grad * 1.2);

        vec3 ribbonColor = mix(coreTone, ribbonLight, edge * 0.8);

        // Add the inner core glow with the special glow color
  col += ribbonCoreGlow * innerCore * 0.35;
col += ribbonColor * body * 0.6;
col += ribbonColor * haze * 0.4;
        
        float ribbonArea = max(core, body) * 0.5; // Reduced from 0.7
        col = mix(col, mix(col, vec3(0.75, 0.88, 0.98), 0.1), ribbonArea); // Reduced
      }
    }


float orangeField = snoise(uv0 * 0.18 + vec2(uTime * 0.01, 0.0));
orangeField = orangeField * 0.5 + 0.5;

// bias toward right side
float rightBias = smoothstep(-0.2, 0.6, uv0.x);

float orangeMask = orangeField * rightBias;


vec3 peachTone = vec3(0.98, 0.72, 0.58);


col = mix(col, peachTone, orangeMask * 0.18);
float milkNoise = snoise(vUv * 0.4 + uTime * 0.01);
milkNoise = milkNoise * 0.5 + 0.5;
milkNoise = smoothstep(0.3, 0.9, milkNoise);

vec3 babyBlue = mix(ribbonLight, vec3(1.0), 0.8);  
vec3 iceMilk  = mix(vec3(0.94, 0.97, 1.0), babyBlue, 0.4);

col = mix(col, iceMilk, 0.07 + milkNoise * 0.06);
    col = clamp(col, 0.0, 1.0);
    col = pow(col, vec3(0.97)); // Slightly less contrast
    gl_FragColor = vec4(col, 1.0);
  }
`;

  const materialRef = useRef();
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));

  useEffect(() => {
    const handleMove = (e) => {
      const x = (e.touches ? e.touches[0].clientX : e.clientX) / window.innerWidth;
      const y = 1 - (e.touches ? e.touches[0].clientY : e.clientY) / window.innerHeight;
      targetMouse.current.set(x, y);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
    };
  }, []);

  useFrame((state) => {
    if (!materialRef.current) return;
    mouse.current.lerp(targetMouse.current, 0.05);

    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    materialRef.current.uniforms.uMouse.value.copy(mouse.current);

    const { width, height } = state.size;
    materialRef.current.uniforms.uResolution.value.set(
      width * state.viewport.dpr,
      height * state.viewport.dpr
    );
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2() },      //  Vector2
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },   // Vector2
        }}
      />
    </mesh>
  );
}

 function AtmosphereBackground() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas orthographic camera={{ zoom: 1, position: [0, 0, 1] }}>
        <Atmosphere />
      </Canvas>
    </div>
  );
}

// const BulgeGallery = ({ slides }) => {
//   const canvasWrapperRef = useRef();

//   const vertexShader = `
// varying vec2 vUv;
// uniform float uScrollIntensity;

// void main() {
//   vUv = uv;
//   vec3 pos = position;

//   float wave = sin(uv.y * 3.1416); // 0 at top & bottom, 1 in center
//   float zOffset = wave * uScrollIntensity * 1.0;
//   pos.z += zOffset;

//   gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
// }

//   `;

//   const fragmentShader = `
//     varying vec2 vUv;
//     uniform sampler2D uTexture;

//     void main() {
//       gl_FragColor = texture2D(uTexture, vUv);
//     }
//   `;

//   useEffect(() => {
//     if (!canvasWrapperRef.current || !slides.length) return;

//     const scene = new THREE.Scene();
//     const camera = new THREE.PerspectiveCamera(
//       45,
//       window.innerWidth / window.innerHeight,
//       0.1,
//       1000
//     );
//     camera.position.z = 10;

//     const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//     renderer.setSize(window.innerWidth, window.innerHeight);
//     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
//     canvasWrapperRef.current.appendChild(renderer.domElement);

//     const calculatePlaneDimensions = () => {
//       const fov = (camera.fov * Math.PI) / 180;
//       const viewHeight = 2 * Math.tan(fov / 2) * camera.position.z;
//       const height = viewHeight * 0.7;
//       const width = height * (8 / 11);
//       return { width, height };
//     };

//     const dimensions = calculatePlaneDimensions();
//     const loader = new THREE.TextureLoader();
//     const planes = [];
//     const textures = [];

//     slides.forEach((slide, index) => {
//       const texture = loader.load(slide.image);
//       texture.minFilter = THREE.LinearFilter;
//       textures.push(texture);

//       const material = new THREE.ShaderMaterial({
//         vertexShader,
//         fragmentShader,
//         uniforms: {
//           uScrollIntensity: { value: 0 },
//           uTexture: { value: texture },
//         },
//         side: THREE.DoubleSide,
//         transparent: true,
//       });

//       const geometry = new THREE.PlaneGeometry(
//         dimensions.width,
//         dimensions.height,
//         32,
//         32
//       );
//       const mesh = new THREE.Mesh(geometry, material);
//       mesh.position.y = -index * (dimensions.height + 1); // space out
//       scene.add(mesh);
//       planes.push(mesh);
//     });

//     let scrollY = 0;
//     let lastScroll = 0;
//     let scrollIntensity = 0;
//     let animationId;

//     const handleScroll = () => {
//       scrollY = (window.scrollY / window.innerHeight) * (dimensions.height + 1);
//     };

//     const animate = () => {
//       animationId = requestAnimationFrame(animate);

//       const delta = scrollY - lastScroll;
//       lastScroll = THREE.MathUtils.lerp(lastScroll, scrollY, 0.1);
//       scrollIntensity = THREE.MathUtils.lerp(
//         scrollIntensity,
//         Math.abs(delta) * 0.25,
//         0.2
//       );

//       camera.position.y = -lastScroll;

//       planes.forEach((plane) => {
//         plane.material.uniforms.uScrollIntensity.value = scrollIntensity;
//       });

//       renderer.render(scene, camera);
//     };

//     handleScroll();
//     animate();
//     window.addEventListener("scroll", handleScroll);

//     return () => {
//       cancelAnimationFrame(animationId);
//       window.removeEventListener("scroll", handleScroll);
//       renderer.dispose();
//       planes.forEach((p) => {
//         p.geometry.dispose();
//         p.material.dispose();
//       });
//       textures.forEach((t) => t.dispose());
//       canvasWrapperRef.current?.removeChild(renderer.domElement);
//     };
//   }, [slides]);

//   return (
//     <div className="relative w-full">
//       {slides.map((_, i) => (
//         <div key={i} className="h-screen w-full" />
//       ))}

//       <div
//         ref={canvasWrapperRef}
//         className="fixed top-0 left-0 w-full h-full z-10 pointer-events-none"
//       />
//     </div>
//   );
// };

// const FluidSimulation = () => {
//   const canvasRef = useRef(null);
//   const config = {
//     SIM_RESOLUTION: 128,
//     DYE_RESOLUTION: 1440,
//     CAPTURE_RESOLUTION: 512,
//     DENSITY_DISSIPATION: 2.5,
//     VELOCITY_DISSIPATION: 2,
//     PRESSURE: 0.1,
//     PRESSURE_ITERATIONS: 20,
//     CURL: 2,
//     SPLAT_RADIUS: 0.5,
//     SPLAT_FORCE: 6000,
//     SHADING: true,
//     COLOR_UPDATE_SPEED: 6,
//     BACK_COLOR: { r: 0, g: 0, b: 0 },
//   };

//   // Variables that need to persist between renders
//   const stateRef = useRef({
//     gl: null,
//     ext: null,
//     pointers: [],
//     dye: null,
//     velocity: null,
//     divergence: null,
//     curl: null,
//     pressure: null,
//     ditheringTexture: null,
//     lastUpdateTime: Date.now(),
//     colorUpdateTimer: 0.0,
//     programs: {},
//     displayMaterial: null,
//   });

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const { gl, ext } = getWebGLContext(canvas);

//     stateRef.current.gl = gl;
//     stateRef.current.ext = ext;

//     if (!ext.supportLinearFiltering) {
//       config.DYE_RESOLUTION = 512;
//       config.SHADING = false;
//     }

//     // Initialize pointers
//     function pointerPrototype() {
//       this.id = -1;
//       this.texcoordX = 0;
//       this.texcoordY = 0;
//       this.prevTexcoordX = 0;
//       this.prevTexcoordY = 0;
//       this.deltaX = 0;
//       this.deltaY = 0;
//       this.down = false;
//       this.moved = false;
//       this.color = [30, 0, 300];
//     }

//     stateRef.current.pointers = [new pointerPrototype()];

//     // Initialize shaders and programs
//     initShadersAndPrograms();

//     // Initialize framebuffers
//     initFramebuffers();

//     // Start animation loop
//     const animationId = requestAnimationFrame(update);

//     // Set up event listeners
//     const handleMouseDown = (e) => handlePointerDown(e.clientX, e.clientY);
//     const handleMouseMove = (e) => handlePointerMove(e.clientX, e.clientY);
//     const handleMouseUp = () => handlePointerUp();
//     const handleTouchStart = (e) => {
//       e.preventDefault();
//       const touch = e.touches[0];
//       handlePointerDown(touch.clientX, touch.clientY);
//     };
//     const handleTouchMove = (e) => {
//       e.preventDefault();
//       const touch = e.touches[0];
//       handlePointerMove(touch.clientX, touch.clientY);
//     };
//     const handleTouchEnd = () => handlePointerUp();

//     canvas.addEventListener('mousedown', handleMouseDown);
//     canvas.addEventListener('mousemove', handleMouseMove);
//     canvas.addEventListener('mouseup', handleMouseUp);
//     canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
//     canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
//     canvas.addEventListener('touchend', handleTouchEnd);

//     // Initial splash
//     setTimeout(() => {
//       const pointer = stateRef.current.pointers[0];
//       pointer.texcoordX = 0.5;
//       pointer.texcoordY = 0.5;
//       clickSplat(pointer);
//     }, 0);

//     return () => {
//       cancelAnimationFrame(animationId);
//       canvas.removeEventListener('mousedown', handleMouseDown);
//       canvas.removeEventListener('mousemove', handleMouseMove);
//       canvas.removeEventListener('mouseup', handleMouseUp);
//       canvas.removeEventListener('touchstart', handleTouchStart);
//       canvas.removeEventListener('touchmove', handleTouchMove);
//       canvas.removeEventListener('touchend', handleTouchEnd);
//     };
//   }, []);

//   const getWebGLContext = (canvas) => {
//     const params = {
//       alpha: true,
//       depth: false,
//       stencil: false,
//       antialias: false,
//       preserveDrawingBuffer: false
//     };

//     let gl = canvas.getContext('webgl2', params);

//     const isWebGL2 = !!gl;
//     if (!isWebGL2) {
//       gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);
//     }

//     let halfFloat;
//     let supportLinearFiltering;
//     if (isWebGL2) {
//       gl.getExtension('EXT_color_buffer_float');
//       supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
//     } else {
//       halfFloat = gl.getExtension('OES_texture_half_float');
//       supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
//     }

//     gl.clearColor(0.0, 0.0, 0.0, 1.0);

//     const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
//     let formatRGBA;
//     let formatRG;
//     let formatR;

//     if (isWebGL2) {
//       formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
//       formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
//       formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
//     } else {
//       formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
//       formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
//       formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
//     }

//     return {
//       gl,
//       ext: {
//         formatRGBA,
//         formatRG,
//         formatR,
//         halfFloatTexType,
//         supportLinearFiltering
//       }
//     };
//   };

//   const getSupportedFormat = (gl, internalFormat, format, type) => {
//     if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
//       switch (internalFormat) {
//         case gl.R16F:
//           return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
//         case gl.RG16F:
//           return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
//         default:
//           return null;
//       }
//     }

//     return {
//       internalFormat,
//       format
//     };
//   };

//   const supportRenderTextureFormat = (gl, internalFormat, format, type) => {
//     let texture = gl.createTexture();
//     gl.bindTexture(gl.TEXTURE_2D, texture);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//     gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

//     let fbo = gl.createFramebuffer();
//     gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
//     gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

//     let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
//     return status == gl.FRAMEBUFFER_COMPLETE;
//   };

//   const initShadersAndPrograms = () => {
//     const { gl } = stateRef.current;

//     const compileShader = (type, source, keywords) => {
//       source = addKeywords(source, keywords);

//       const shader = gl.createShader(type);
//       gl.shaderSource(shader, source);
//       gl.compileShader(shader);

//       if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
//         console.trace(gl.getShaderInfoLog(shader));
//       }

//       return shader;
//     };

//     const addKeywords = (source, keywords) => {
//       if (keywords == null) return source;
//       let keywordsString = '';
//       keywords.forEach(keyword => {
//         keywordsString += '#define ' + keyword + '\n';
//       });
//       return keywordsString + source;
//     };

//     const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
//       precision highp float;
//       attribute vec2 aPosition;
//       varying vec2 vUv;
//       varying vec2 vL;
//       varying vec2 vR;
//       varying vec2 vT;
//       varying vec2 vB;
//       uniform vec2 texelSize;
//       void main () {
//         vUv = aPosition * 0.5 + 0.5;
//         vL = vUv - vec2(texelSize.x, 0.0);
//         vR = vUv + vec2(texelSize.x, 0.0);
//         vT = vUv + vec2(0.0, texelSize.y);
//         vB = vUv - vec2(0.0, texelSize.y);
//         gl_Position = vec4(aPosition, 0.0, 1.0);
//       }
//     `);

//     const blurVertexShader = compileShader(gl.VERTEX_SHADER, `
//       precision highp float;
//       attribute vec2 aPosition;
//       varying vec2 vUv;
//       varying vec2 vL;
//       varying vec2 vR;
//       uniform vec2 texelSize;
//       void main () {
//         vUv = aPosition * 0.5 + 0.5;
//         float offset = 1.33333333;
//         vL = vUv - texelSize * offset;
//         vR = vUv + texelSize * offset;
//         gl_Position = vec4(aPosition, 0.0, 1.0);
//       }
//     `);

//     const createProgram = (vertexShader, fragmentShader) => {
//       let program = gl.createProgram();
//       gl.attachShader(program, vertexShader);
//       gl.attachShader(program, fragmentShader);
//       gl.linkProgram(program);

//       if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
//         console.trace(gl.getProgramInfoLog(program));
//       }

//       return program;
//     };

//     const getUniforms = (program) => {
//       let uniforms = [];
//       let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
//       for (let i = 0; i < uniformCount; i++) {
//         let uniformName = gl.getActiveUniform(program, i).name;
//         uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
//       }
//       return uniforms;
//     };

//     class Program {
//       constructor(vertexShader, fragmentShader) {
//         this.program = createProgram(vertexShader, fragmentShader);
//         this.uniforms = getUniforms(this.program);
//       }

//       bind() {
//         gl.useProgram(this.program);
//       }
//     }

//     class Material {
//       constructor(vertexShader, fragmentShaderSource) {
//         this.vertexShader = vertexShader;
//         this.fragmentShaderSource = fragmentShaderSource;
//         this.programs = [];
//         this.activeProgram = null;
//         this.uniforms = [];
//       }

//       setKeywords(keywords) {
//         let hash = 0;
//         for (let i = 0; i < keywords.length; i++) {
//           hash += hashCode(keywords[i]);
//         }

//         let program = this.programs[hash];
//         if (program == null) {
//           let fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
//           program = createProgram(this.vertexShader, fragmentShader);
//           this.programs[hash] = program;
//         }

//         if (program == this.activeProgram) return;

//         this.uniforms = getUniforms(program);
//         this.activeProgram = program;
//       }

//       bind() {
//         gl.useProgram(this.activeProgram);
//       }
//     }

//     const displayShaderSource = `
//       precision highp float;
//       precision highp sampler2D;
//       varying vec2 vUv;
//       varying vec2 vL;
//       varying vec2 vR;
//       varying vec2 vT;
//       varying vec2 vB;
//       uniform sampler2D uTexture;
//       uniform sampler2D uDithering;
//       uniform vec2 ditherScale;
//       uniform vec2 texelSize;
//       vec3 linearToGamma (vec3 color) {
//         color = max(color, vec3(0));
//         return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
//       }
//       void main () {
//         vec3 c = texture2D(uTexture, vUv).rgb;
//       #ifdef SHADING
//         vec3 lc = texture2D(uTexture, vL).rgb;
//         vec3 rc = texture2D(uTexture, vR).rgb;
//         vec3 tc = texture2D(uTexture, vT).rgb;
//         vec3 bc = texture2D(uTexture, vB).rgb;
//         float dx = length(rc) - length(lc);
//         float dy = length(tc) - length(bc);
//         vec3 n = normalize(vec3(dx, dy, length(texelSize)));
//         vec3 l = vec3(0.0, 0.0, 1.0);
//         float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
//         c *= diffuse;
//       #endif
//         float a = max(c.r, max(c.g, c.b));
//         gl_FragColor = vec4(c, a);
//       }
//     `;

//     stateRef.current.displayMaterial = new Material(baseVertexShader, displayShaderSource);

//     const blurProgram = new Program(blurVertexShader, compileShader(gl.FRAGMENT_SHADER, `
//       precision mediump float;
//       precision mediump sampler2D;
//       varying vec2 vUv;
//       varying vec2 vL;
//       varying vec2 vR;
//       uniform sampler2D uTexture;
//       void main () {
//         vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
//         sum += texture2D(uTexture, vL) * 0.35294117;
//         sum += texture2D(uTexture, vR) * 0.35294117;
//         gl_FragColor = sum;
//       }
//     `));

//     const copyProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, `
//       precision mediump float;
//       precision mediump sampler2D;
//       varying highp vec2 vUv;
//       uniform sampler2D uTexture;
//       void main () {
//         gl_FragColor = texture2D(uTexture, vUv);
//       }
//     `));

//     const clearProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, `
//       precision mediump float;
//       precision mediump sampler2D;
//       varying highp vec2 vUv;
//       uniform sampler2D uTexture;
//       uniform float value;
//       void main () {
//         gl_FragColor = value * texture2D(uTexture, vUv);
//       }
//     `));

//     const colorProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, `
//       precision mediump float;
//       uniform vec4 color;
//       void main () {
//         gl_FragColor = color;
//       }
//     `));

//     const splatProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, `
//       precision highp float;
//       precision highp sampler2D;
//       varying vec2 vUv;
//       uniform sampler2D uTarget;
//       uniform float aspectRatio;
//       uniform vec3 color;
//       uniform vec2 point;
//       uniform float radius;
//       void main () {
//         vec2 p = vUv - point.xy;
//         p.x *= aspectRatio;
//         vec3 splat = exp(-dot(p, p) / radius) * color;
//         vec3 base = texture2D(uTarget, vUv).xyz;
//         gl_FragColor = vec4(base + splat, 1.0);
//       }
//     `));

//     const advectionProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, `
//       precision highp float;
//       precision highp sampler2D;
//       varying vec2 vUv;
//       uniform sampler2D uVelocity;
//       uniform sampler2D uSource;
//       uniform vec2 texelSize;
//       uniform vec2 dyeTexelSize;
//       uniform float dt;
//       uniform float dissipation;
//       vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
//         vec2 st = uv / tsize - 0.5;
//         vec2 iuv = floor(st);
//         vec2 fuv = fract(st);
//         vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
//         vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
//         vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
//         vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
//         return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
//       }
//       void main () {
//       #ifdef MANUAL_FILTERING
//         vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
//         vec4 result = bilerp(uSource, coord, dyeTexelSize);
//       #else
//         vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
//         vec4 result = texture2D(uSource, coord);
//       #endif
//         float decay = 1.0 + dissipation * dt;
//         gl_FragColor = result / decay;
//       }`,
//       stateRef.current.ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']
//     ));

//     const divergenceProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, `
//       precision mediump float;
//       precision mediump sampler2D;
//       varying highp vec2 vUv;
//       varying highp vec2 vL;
//       varying highp vec2 vR;
//       varying highp vec2 vT;
//       varying highp vec2 vB;
//       uniform sampler2D uVelocity;
//       void main () {
//         float L = texture2D(uVelocity, vL).x;
//         float R = texture2D(uVelocity, vR).x;
//         float T = texture2D(uVelocity, vT).y;
//         float B = texture2D(uVelocity, vB).y;
//         vec2 C = texture2D(uVelocity, vUv).xy;
//         if (vL.x < 0.0) { L = -C.x; }
//         if (vR.x > 1.0) { R = -C.x; }
//         if (vT.y > 1.0) { T = -C.y; }
//         if (vB.y < 0.0) { B = -C.y; }
//         float div = 0.5 * (R - L + T - B);
//         gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
//       }
//     `));

//     const curlProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, `
//       precision mediump float;
//       precision mediump sampler2D;
//       varying highp vec2 vUv;
//       varying highp vec2 vL;
//       varying highp vec2 vR;
//       varying highp vec2 vT;
//       varying highp vec2 vB;
//       uniform sampler2D uVelocity;
//       void main () {
//         float L = texture2D(uVelocity, vL).y;
//         float R = texture2D(uVelocity, vR).y;
//         float T = texture2D(uVelocity, vT).x;
//         float B = texture2D(uVelocity, vB).x;
//         float vorticity = R - L - T + B;
//         gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
//       }
//     `));

//     const vorticityProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, `
//       precision highp float;
//       precision highp sampler2D;
//       varying vec2 vUv;
//       varying vec2 vL;
//       varying vec2 vR;
//       varying vec2 vT;
//       varying vec2 vB;
//       uniform sampler2D uVelocity;
//       uniform sampler2D uCurl;
//       uniform float curl;
//       uniform float dt;
//       void main () {
//         float L = texture2D(uCurl, vL).x;
//         float R = texture2D(uCurl, vR).x;
//         float T = texture2D(uCurl, vT).x;
//         float B = texture2D(uCurl, vB).x;
//         float C = texture2D(uCurl, vUv).x;
//         vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
//         force /= length(force) + 0.0001;
//         force *= curl * C;
//         force.y *= -1.0;
//         vec2 velocity = texture2D(uVelocity, vUv).xy;
//         velocity += force * dt;
//         velocity = min(max(velocity, -1000.0), 1000.0);
//         gl_FragColor = vec4(velocity, 0.0, 1.0);
//       }
//     `));

//     const pressureProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, `
//       precision mediump float;
//       precision mediump sampler2D;
//       varying highp vec2 vUv;
//       varying highp vec2 vL;
//       varying highp vec2 vR;
//       varying highp vec2 vT;
//       varying highp vec2 vB;
//       uniform sampler2D uPressure;
//       uniform sampler2D uDivergence;
//       void main () {
//         float L = texture2D(uPressure, vL).x;
//         float R = texture2D(uPressure, vR).x;
//         float T = texture2D(uPressure, vT).x;
//         float B = texture2D(uPressure, vB).x;
//         float C = texture2D(uPressure, vUv).x;
//         float divergence = texture2D(uDivergence, vUv).x;
//         float pressure = (L + R + B + T - divergence) * 0.25;
//         gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
//       }
//     `));

//     const gradienSubtractProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, `
//       precision mediump float;
//       precision mediump sampler2D;
//       varying highp vec2 vUv;
//       varying highp vec2 vL;
//       varying highp vec2 vR;
//       varying highp vec2 vT;
//       varying highp vec2 vB;
//       uniform sampler2D uPressure;
//       uniform sampler2D uVelocity;
//       void main () {
//         float L = texture2D(uPressure, vL).x;
//         float R = texture2D(uPressure, vR).x;
//         float T = texture2D(uPressure, vT).x;
//         float B = texture2D(uPressure, vB).x;
//         vec2 velocity = texture2D(uVelocity, vUv).xy;
//         velocity.xy -= vec2(R - L, T - B);
//         gl_FragColor = vec4(velocity, 0.0, 1.0);
//       }
//     `));

//     stateRef.current.programs = {
//       blur: blurProgram,
//       copy: copyProgram,
//       clear: clearProgram,
//       color: colorProgram,
//       splat: splatProgram,
//       advection: advectionProgram,
//       divergence: divergenceProgram,
//       curl: curlProgram,
//       vorticity: vorticityProgram,
//       pressure: pressureProgram,
//       gradientSubtract: gradienSubtractProgram,
//     };

//     // Initialize blit
//     gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
//     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
//     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
//     gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
//     gl.enableVertexAttribArray(0);

//     stateRef.current.blit = (target, clear = false) => {
//       if (target == null) {
//         gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
//         gl.bindFramebuffer(gl.FRAMEBUFFER, null);
//       } else {
//         gl.viewport(0, 0, target.width, target.height);
//         gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
//       }
//       if (clear) {
//         gl.clearColor(0.0, 0.0, 0.0, 1.0);
//         gl.clear(gl.COLOR_BUFFER_BIT);
//       }
//       gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
//     };
//   };

//  // --- Framebuffer Utilities ---

// const createFBO = (w, h, internalFormat, format, type, param) => {
//   const gl = stateRef.current.gl;
//   gl.activeTexture(gl.TEXTURE0);

//   const texture = gl.createTexture();
//   gl.bindTexture(gl.TEXTURE_2D, texture);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//   gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

//   const fbo = gl.createFramebuffer();
//   gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
//   gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
//   gl.viewport(0, 0, w, h);
//   gl.clear(gl.COLOR_BUFFER_BIT);

//   return {
//     texture,
//     fbo,
//     width: w,
//     height: h,
//     texelSizeX: 1.0 / w,
//     texelSizeY: 1.0 / h,
//     attach(id) {
//       gl.activeTexture(gl.TEXTURE0 + id);
//       gl.bindTexture(gl.TEXTURE_2D, texture);
//       return id;
//     }
//   };
// };

// const resizeFBO = (target, w, h, internalFormat, format, type, param) => {
//   const gl = stateRef.current.gl;
//   const newFBO = createFBO(w, h, internalFormat, format, type, param);
//   stateRef.current.programs.copy.bind();
//   gl.uniform1i(stateRef.current.programs.copy.uniforms.uTexture, target.attach(0));
//   stateRef.current.blit(newFBO);
//   return newFBO;
// };

// const createDoubleFBO = (w, h, internalFormat, format, type, param) => {
//   let fbo1 = createFBO(w, h, internalFormat, format, type, param);
//   let fbo2 = createFBO(w, h, internalFormat, format, type, param);

//   return {
//     width: w,
//     height: h,
//     texelSizeX: fbo1.texelSizeX,
//     texelSizeY: fbo1.texelSizeY,
//     get read() {
//       return fbo1;
//     },
//     set read(value) {
//       fbo1 = value;
//     },
//     get write() {
//       return fbo2;
//     },
//     set write(value) {
//       fbo2 = value;
//     },
//     swap() {
//       const temp = fbo1;
//       fbo1 = fbo2;
//       fbo2 = temp;
//     }
//   };
// };

// const resizeDoubleFBO = (target, w, h, internalFormat, format, type, param) => {
//   if (target.width === w && target.height === h) return target;

//   target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
//   target.write = createFBO(w, h, internalFormat, format, type, param);
//   target.width = w;
//   target.height = h;
//   target.texelSizeX = 1.0 / w;
//   target.texelSizeY = 1.0 / h;

//   return target;
// };

// // --- Init Framebuffers ---

// const initFramebuffers = () => {
//   const { gl, ext } = stateRef.current;
//   const simRes = getResolution(config.SIM_RESOLUTION);
//   const dyeRes = getResolution(config.DYE_RESOLUTION);

//   const texType = ext.halfFloatTexType;
//   const rgba = ext.formatRGBA;
//   const rg = ext.formatRG;
//   const r = ext.formatR;
//   const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

//   gl.disable(gl.BLEND);

//   if (!stateRef.current.dye) {
//     stateRef.current.dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
//   } else {
//     stateRef.current.dye = resizeDoubleFBO(stateRef.current.dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
//   }

//   if (!stateRef.current.velocity) {
//     stateRef.current.velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
//   } else {
//     stateRef.current.velocity = resizeDoubleFBO(stateRef.current.velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
//   }

//   stateRef.current.divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
//   stateRef.current.curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
//   stateRef.current.pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
// };
//   const updateKeywords = () => {
//     let displayKeywords = [];
//     if (config.SHADING) displayKeywords.push("SHADING");
//     stateRef.current.displayMaterial.setKeywords(displayKeywords);
//   };

//   const update = () => {
//     const dt = calcDeltaTime();
//     if (resizeCanvas()) {
//       initFramebuffers();
//     }
//     updateColors(dt);
//     applyInputs();
//     step(dt);
//     render(null);
//     stateRef.current.animationId = requestAnimationFrame(update);
//   };

//   const calcDeltaTime = () => {
//     let now = Date.now();
//     let dt = (now - stateRef.current.lastUpdateTime) / 1000;
//     dt = Math.min(dt, 0.016666);
//     stateRef.current.lastUpdateTime = now;
//     return dt;
//   };

//   const resizeCanvas = () => {
//     const canvas = canvasRef.current;
//     let width = scaleByPixelRatio(canvas.clientWidth);
//     let height = scaleByPixelRatio(canvas.clientHeight);
//     if (canvas.width != width || canvas.height != height) {
//       canvas.width = width;
//       canvas.height = height;
//       return true;
//     }
//     return false;
//   };

//   const updateColors = (dt) => {
//     stateRef.current.colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
//     if (stateRef.current.colorUpdateTimer >= 1) {
//       stateRef.current.colorUpdateTimer = wrap(stateRef.current.colorUpdateTimer, 0, 1);
//       stateRef.current.pointers.forEach(p => {
//         p.color = generateColor();
//       });
//     }
//   };

//   const applyInputs = () => {
//     stateRef.current.pointers.forEach(p => {
//       if (p.moved) {
//         p.moved = false;
//         splatPointer(p);
//       }
//     });
//   };
//   const step = (dt) => {
//     const { gl, programs, velocity, curl, divergence, pressure, dye, ext } = stateRef.current;

//     gl.disable(gl.BLEND);

//     // Curl
//     programs.curl.bind();
//     gl.uniform2f(programs.curl.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
//     gl.uniform1i(programs.curl.uniforms.uVelocity, velocity.read.attach(0));
//     stateRef.current.blit(curl);

//     // Vorticity
//     programs.vorticity.bind();
//     gl.uniform2f(programs.vorticity.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
//     gl.uniform1i(programs.vorticity.uniforms.uVelocity, velocity.read.attach(0));
//     gl.uniform1i(programs.vorticity.uniforms.uCurl, curl.attach(1));
//     gl.uniform1f(programs.vorticity.uniforms.curl, config.CURL);
//     gl.uniform1f(programs.vorticity.uniforms.dt, dt);
//     stateRef.current.blit(velocity.write);
//     velocity.swap();

//     // Divergence
//     programs.divergence.bind();
//     gl.uniform2f(programs.divergence.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
//     gl.uniform1i(programs.divergence.uniforms.uVelocity, velocity.read.attach(0));
//     stateRef.current.blit(divergence);

//     // Clear pressure
//     programs.clear.bind();
//     gl.uniform1i(programs.clear.uniforms.uTexture, pressure.read.attach(0));
//     gl.uniform1f(programs.clear.uniforms.value, config.PRESSURE);
//     stateRef.current.blit(pressure.write);
//     pressure.swap();

//     // Pressure
//     programs.pressure.bind();
//     gl.uniform2f(programs.pressure.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
//     gl.uniform1i(programs.pressure.uniforms.uDivergence, divergence.attach(0));
//     for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
//       gl.uniform1i(programs.pressure.uniforms.uPressure, pressure.read.attach(1));
//       stateRef.current.blit(pressure.write);
//       pressure.swap();
//     }

//     // Gradient subtract
//     programs.gradientSubtract.bind();
//     gl.uniform2f(programs.gradientSubtract.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
//     gl.uniform1i(programs.gradientSubtract.uniforms.uPressure, pressure.read.attach(0));
//     gl.uniform1i(programs.gradientSubtract.uniforms.uVelocity, velocity.read.attach(1));
//     stateRef.current.blit(velocity.write);
//     velocity.swap();

//     // Advection
//     programs.advection.bind();
//     gl.uniform2f(programs.advection.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
//     if (!ext.supportLinearFiltering) {
//       gl.uniform2f(programs.advection.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
//     }
//     let velocityId = velocity.read.attach(0);
//     gl.uniform1i(programs.advection.uniforms.uVelocity, velocityId);
//     gl.uniform1i(programs.advection.uniforms.uSource, velocityId);
//     gl.uniform1f(programs.advection.uniforms.dt, dt);
//     gl.uniform1f(programs.advection.uniforms.dissipation, config.VELOCITY_DISSIPATION);
//     stateRef.current.blit(velocity.write);
//     velocity.swap();

//     // Dye advection
//     if (!ext.supportLinearFiltering) {
//       gl.uniform2f(programs.advection.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
//     }
//     gl.uniform1i(programs.advection.uniforms.uVelocity, velocity.read.attach(0));
//     gl.uniform1i(programs.advection.uniforms.uSource, dye.read.attach(1));
//     gl.uniform1f(programs.advection.uniforms.dissipation, config.DENSITY_DISSIPATION);
//     stateRef.current.blit(dye.write);
//     dye.swap();
//   };

//   const render = (target) => {
//     const { gl } = stateRef.current;
//     gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
//     gl.enable(gl.BLEND);
//     drawDisplay(target);
//   };

//   const drawDisplay = (target) => {
//     const { gl, displayMaterial, dye } = stateRef.current;
//     let width = target == null ? gl.drawingBufferWidth : target.width;
//     let height = target == null ? gl.drawingBufferHeight : target.height;

//     displayMaterial.bind();
//     if (config.SHADING) {
//       gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / width, 1.0 / height);
//     }
//     gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
//     stateRef.current.blit(target);
//   };

//   const splatPointer = (pointer) => {
//     const dx = pointer.deltaX * config.SPLAT_FORCE;
//     const dy = pointer.deltaY * config.SPLAT_FORCE;
//     splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
//   };

//   const clickSplat = (pointer) => {
//     const color = generateColor();
//     color.r *= 10.0;
//     color.g *= 10.0;
//     color.b *= 10.0;
//     const dx = 10 * (Math.random() - 0.5);
//     const dy = 30 * (Math.random() - 0.5);
//     splat(pointer.texcoordX, pointer.texcoordY, dx, dy, color);
//   };

//   const splat = (x, y, dx, dy, color) => {
//     const { gl, programs, velocity, dye } = stateRef.current;
//     const canvas = canvasRef.current;

//     programs.splat.bind();
//     gl.uniform1i(programs.splat.uniforms.uTarget, velocity.read.attach(0));
//     gl.uniform1f(programs.splat.uniforms.aspectRatio, canvas.width / canvas.height);
//     gl.uniform2f(programs.splat.uniforms.point, x, y);
//     gl.uniform3f(programs.splat.uniforms.color, dx, dy, 0.0);
//     gl.uniform1f(programs.splat.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
//     stateRef.current.blit(velocity.write);
//     velocity.swap();

//     gl.uniform1i(programs.splat.uniforms.uTarget, dye.read.attach(0));
//     gl.uniform3f(programs.splat.uniforms.color, color.r, color.g, color.b);
//     stateRef.current.blit(dye.write);
//     dye.swap();
//   };

//   const correctRadius = (radius) => {
//     const canvas = canvasRef.current;
//     const aspectRatio = canvas.width / canvas.height;
//     if (aspectRatio > 1) {
//       radius *= aspectRatio;
//     }
//     return radius;
//   };

//   const handlePointerDown = (clientX, clientY) => {
//     const canvas = canvasRef.current;
//     const pointer = stateRef.current.pointers[0];
//     const posX = scaleByPixelRatio(clientX);
//     const posY = scaleByPixelRatio(clientY);
//     updatePointerDownData(pointer, -1, posX, posY);
//     clickSplat(pointer);
//   };

//   const handlePointerMove = (clientX, clientY) => {
//     const canvas = canvasRef.current;
//     const pointer = stateRef.current.pointers[0];
//     const posX = scaleByPixelRatio(clientX);
//     const posY = scaleByPixelRatio(clientY);
//     const color = pointer.color;
//     updatePointerMoveData(pointer, posX, posY, color);
//   };

//   const handlePointerUp = () => {
//     const pointer = stateRef.current.pointers[0];
//     updatePointerUpData(pointer);
//   };

//   const updatePointerDownData = (pointer, id, posX, posY) => {
//     const canvas = canvasRef.current;
//     pointer.id = id;
//     pointer.down = true;
//     pointer.moved = false;
//     pointer.texcoordX = posX / canvas.width;
//     pointer.texcoordY = 1.0 - posY / canvas.height;
//     pointer.prevTexcoordX = pointer.texcoordX;
//     pointer.prevTexcoordY = pointer.texcoordY;
//     pointer.deltaX = 0;
//     pointer.deltaY = 0;
//     pointer.color = generateColor();
//   };

//   const updatePointerMoveData = (pointer, posX, posY, color) => {
//     const canvas = canvasRef.current;
//     pointer.prevTexcoordX = pointer.texcoordX;
//     pointer.prevTexcoordY = pointer.texcoordY;
//     pointer.texcoordX = posX / canvas.width;
//     pointer.texcoordY = 1.0 - posY / canvas.height;
//     pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
//     pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
//     pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
//     pointer.color = color;
//   };

//   const updatePointerUpData = (pointer) => {
//     pointer.down = false;
//   };

//   const correctDeltaX = (delta) => {
//     const canvas = canvasRef.current;
//     const aspectRatio = canvas.width / canvas.height;
//     if (aspectRatio < 1) {
//       delta *= aspectRatio;
//     }
//     return delta;
//   };

//   const correctDeltaY = (delta) => {
//     const canvas = canvasRef.current;
//     const aspectRatio = canvas.width / canvas.height;
//     if (aspectRatio > 1) {
//       delta /= aspectRatio;
//     }
//     return delta;
//   };

//   const generateColor = () => {
//     const c = HSVtoRGB(Math.random(), 1.0, 1.0);
//     c.r *= 0.0015;
//     c.g *= 0.0015;
//     c.b *= 0.0015;
//     return c;
//   };

//   const HSVtoRGB = (h, s, v) => {
//     const i = Math.floor(h * 3);
//     let r, g, b;

//     switch (i % 3) {
//       case 0: r = 60; g = 184; b = 211; break;
//       case 1: r = 194; g = 112; b = 243; break;
//       case 2: r = 255; g = 39; b = 119; break;
//     }

//     return { r, g, b };
//   };

//   const wrap = (value, min, max) => {
//     const range = max - min;
//     if (range === 0) return min;
//     return ((value - min) % range) + min;
//   };

//   const getResolution = (resolution) => {
//     const { gl } = stateRef.current;
//     let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
//     if (aspectRatio < 1) {
//       aspectRatio = 1.0 / aspectRatio;
//     }

//     const min = Math.round(resolution);
//     const max = Math.round(resolution * aspectRatio);

//     if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
//       return { width: max, height: min };
//     } else {
//       return { width: min, height: max };
//     }
//   };

//   const scaleByPixelRatio = (input) => {
//     const pixelRatio = window.devicePixelRatio || 1;
//     return Math.floor(input * pixelRatio);
//   };

//   const hashCode = (s) => {
//     if (s.length === 0) return 0;
//     let hash = 0;
//     for (let i = 0; i < s.length; i++) {
//       hash = ((hash << 5) - hash) + s.charCodeAt(i);
//       hash |= 0; // Convert to 32bit integer
//     }
//     return hash;
//   };

//   return (
//     <canvas
//       ref={canvasRef}

//     />
//   );
// };



