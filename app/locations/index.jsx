"use client";
import "./style.css";
import * as THREE from "three";
import  React, { useCallback, useEffect,useImperativeHandle, useRef,forwardRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText, ScrollTrigger);
const DEFAULTS = {
  mode: "ordered",
  pixelSize: 2,

  gridSize: 3,
  threshold: 0.5,
  brightness: 0,
  contrast: 1,
  darkColor: "#1757e8",
  lightColor: "#e8e6e0",

  matrixSize: 4,
  lumPixelSize: 1,
  pixelSizeMultiplier: 5,
  scaleResolution: 1,
  ditherAmount: 1,
  bias: 0,
  biasNoiseScale: 10,
  biasNoiseSpeed: 0.75,
  biasPulseSpeed: 0.5,
  biasNoiseWeight: 0.5,
  biasPulseWeight: 0.05,
  biasAnimationStrength: 1.25,
  trailDecay: 0.85,
  trailRadius: 0.15,
  trailIntensityMultiplier: 5,
};

let sharedRenderer = null;
const pointerEffects = new Set();
let pointerBound = false;

function handleSharedPointerMove(e) {
  pointerEffects.forEach((effect) => {
    if (!effect.visible) return;
    effect.onPointerMove(e);
  });
}

function watchPointer(effect) {
  pointerEffects.add(effect);
  if (pointerBound) return;
  pointerBound = true;
  window.addEventListener("pointermove", handleSharedPointerMove, {
    passive: true,
  });
}

function unwatchPointer(effect) {
  pointerEffects.delete(effect);
  if (pointerEffects.size || !pointerBound) return;
  pointerBound = false;
  window.removeEventListener("pointermove", handleSharedPointerMove);
}

function getRenderer() {
  if (!sharedRenderer) {
    sharedRenderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
    });
    sharedRenderer.setPixelRatio(1);
  }
  return sharedRenderer;
}

const VERTEX = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

function diffusionFragment(grid) {
  return `
precision highp float;

#define GRID_X ${grid}.0
#define GRID_Y ${grid}.0

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uCoverScale;
uniform float uThreshold;
uniform float uBrightness;
uniform float uContrast;
uniform vec3 uDarkColor;
uniform vec3 uLightColor;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform float uMouseRadius;
uniform float uTime;

out vec4 fragColor;

const vec2 gridSize = vec2(GRID_X, GRID_Y);
const int arrSize = int(GRID_X * GRID_Y);
float errAcc[arrSize];

int getIndex(vec2 p) {
  int x = int(p.x);
  int y = int(p.y);
  if (x < 0 || y < 0 || x >= int(GRID_X) || y >= int(GRID_Y)) return -1;
  return x + y * int(GRID_X);
}

vec4 sampleTex(vec2 pix) {
  vec2 uv = (pix + 0.5) / uResolution;
  uv = (uv - 0.5) * uCoverScale + 0.5;
  return texture(uTexture, uv);
}

float sampleLuma(vec2 pix) {
  vec3 c = sampleTex(pix).rgb;
  float g = dot(c, vec3(0.2126, 0.7152, 0.0722));
  g += uBrightness;
  g = (g - 0.5) * uContrast + 0.5;
  return g;
}

vec2 dispersion(vec2 p) {
  vec2 toP = p - uMouse;
  float d = length(toP);
  vec2 dir = d > 1e-4 ? toP / d : vec2(0.0);
  float falloff = exp(-(d * d) / (uMouseRadius * uMouseRadius));
  float ripple = 0.85 + 0.15 * sin(d * 0.18 - uTime * 5.0);

  return -dir * falloff * uMouseStrength * uMouseRadius * 0.3 * ripple;
}

void main() {

  vec2 pix = floor(vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y));
  vec2 topLeft = floor(pix / gridSize) * gridSize;
  vec2 myPos = pix - topLeft;

  for (int i = 0; i < arrSize; i++) errAcc[i] = 0.0;

  vec2 disp = dispersion(topLeft + gridSize * 0.5);

  float outColor = 0.0;
  for (float y = 0.0; y < GRID_Y; y += 1.0) {
    for (float x = 0.0; x < GRID_X; x += 1.0) {
      vec2 cell = vec2(x, y);
      vec2 srcPix = topLeft + cell + disp;

      if (sampleTex(srcPix).a < 0.01) continue;
      float ideal = sampleLuma(srcPix) + errAcc[int(x) + int(y) * int(GRID_X)];
      float value = step(uThreshold, ideal);
      float err = ideal - value;

      int r = getIndex(cell + vec2(1.0, 0.0));  if (r >= 0) errAcc[r] += err * (7.0 / 16.0);
      int bl = getIndex(cell + vec2(-1.0, 1.0)); if (bl >= 0) errAcc[bl] += err * (3.0 / 16.0);
      int b = getIndex(cell + vec2(0.0, 1.0));  if (b >= 0) errAcc[b] += err * (5.0 / 16.0);
      int br = getIndex(cell + vec2(1.0, 1.0));  if (br >= 0) errAcc[br] += err * (1.0 / 16.0);
      if (cell == myPos) outColor = value;
    }
  }

  fragColor = vec4(mix(uDarkColor, uLightColor, outColor), sampleTex(pix + disp).a);
}
`;
}

const TRAIL_FRAGMENT = `
precision highp float;

uniform sampler2D uPrev;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec2 uPrevMouse;
uniform float uTrailDecay;
uniform float uTrailRadius;
uniform float uBrushStrength;

out vec4 fragColor;

float distToSegment(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
  return length(p - (a + ab * t));
}

void main() {
  vec2 p = gl_FragCoord.xy;

  float prev = texture(uPrev, p / uResolution).r * uTrailDecay;

  float d = distToSegment(p, uPrevMouse, uMouse);
  float brush = smoothstep(uTrailRadius, 0.0, d) * uBrushStrength;
  fragColor = vec4(clamp(prev + brush, 0.0, 1.0), 0.0, 0.0, 1.0);
}
`;

const CNOISE = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

float cnoise(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}
`;

function orderedFragment(matrix) {
  return `
precision highp float;

#define MATRIX_SIZE ${matrix}

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uCoverScale;
uniform float uBrightness;
uniform float uContrast;
uniform float uThreshold;
uniform vec3 uDarkColor;
uniform vec3 uLightColor;
uniform float uTime;
uniform sampler2D uTrail;
uniform float uTrailIntensityMultiplier;
uniform float uPixelSize;
uniform float uPixelSizeMultiplier;
uniform float uScaleResolution;
uniform float uDitherAmount;
uniform float uBias;
uniform float uBiasNoiseScale;
uniform float uBiasNoiseSpeed;
uniform float uBiasPulseSpeed;
uniform float uBiasNoiseWeight;
uniform float uBiasPulseWeight;
uniform float uBiasAnimationStrength;

out vec4 fragColor;

${CNOISE}

const float bayer2[4] = float[4](0.0, 2.0, 3.0, 1.0);
const float bayer4[16] = float[16](
  0.0, 8.0, 2.0, 10.0,
  12.0, 4.0, 14.0, 6.0,
  3.0, 11.0, 1.0, 9.0,
  15.0, 7.0, 13.0, 5.0
);
const float bayer8[64] = float[64](
  0.0, 32.0, 8.0, 40.0, 2.0, 34.0, 10.0, 42.0,
  48.0, 16.0, 56.0, 24.0, 50.0, 18.0, 58.0, 26.0,
  12.0, 44.0, 4.0, 36.0, 14.0, 46.0, 6.0, 38.0,
  60.0, 28.0, 52.0, 20.0, 62.0, 30.0, 54.0, 22.0,
  3.0, 35.0, 11.0, 43.0, 1.0, 33.0, 9.0, 41.0,
  51.0, 19.0, 59.0, 27.0, 49.0, 17.0, 57.0, 25.0,
  15.0, 47.0, 7.0, 39.0, 13.0, 45.0, 5.0, 37.0,
  63.0, 31.0, 55.0, 23.0, 61.0, 29.0, 53.0, 21.0
);

float bayerThreshold(vec2 p, int size) {
  int x = int(mod(p.x, float(size)));
  int y = int(mod(p.y, float(size)));
  int idx = y * size + x;
  if (size == 2) return (bayer2[idx] + 0.5) / 4.0;
  if (size == 4) return (bayer4[idx] + 0.5) / 16.0;
  return (bayer8[idx] + 0.5) / 64.0;
}

vec4 sampleTex(vec2 centerPix) {
  vec2 uv = centerPix / uResolution;
  uv = (uv - 0.5) * uCoverScale + 0.5;
  return texture(uTexture, uv);
}

vec3 adjust(vec3 c) {
  c += uBrightness;
  return (c - 0.5) * uContrast + 0.5;
}

void main() {
  vec2 frag = gl_FragCoord.xy;

  float trail = clamp(texture(uTrail, frag / uResolution).r * uTrailIntensityMultiplier, 0.0, 1.0);

  vec2 up = vec2(frag.x, uResolution.y - frag.y);

  vec2 colorCenter = (floor(up / uPixelSize) + 0.5) * uPixelSize;
  vec4 src = sampleTex(colorCenter);
  vec3 sourceColor = adjust(src.rgb);

  float dynPx = mix(uPixelSize, uPixelSize * uPixelSizeMultiplier, trail);
  vec2 lumCenter = (floor(up / dynPx) + 0.5) * dynPx;
  vec4 ls = sampleTex(lumCenter);
  float lum = dot(ls.rgb, vec3(0.2126, 0.7152, 0.0722));
  lum += uBrightness;
  lum = (lum - 0.5) * uContrast + 0.5;

  vec2 uvN = up / uResolution;
  float n = cnoise(vec3(uvN * uBiasNoiseScale, uTime * uBiasNoiseSpeed));
  float pulse = sin(uTime * uBiasPulseSpeed) * 0.5 + 0.5;
  float bias = uBias + (n * uBiasNoiseWeight + pulse * uBiasPulseWeight) * uBiasAnimationStrength;

  int size = trail >= 0.5 ? 8 : MATRIX_SIZE;
  float threshold = bayerThreshold(floor(frag / uScaleResolution), size);

  float value = threshold + bias * (1.0 + 2.0 * trail) + (uThreshold - 0.5);
  vec3 dithered = mix(uDarkColor, uLightColor, step(value, lum));

  fragColor = vec4(mix(sourceColor, dithered, uDitherAmount), src.a);
}
`;
}

class DitherEffect {
  constructor(canvas, img) {
    this.canvas = canvas;
    this.img = img;
    this.ctx = canvas.getContext("2d");
    this.settings = { ...DEFAULTS };
    this.width = 0;
    this.height = 0;
    this.texture = null;
    this.mode = null;
    this.grid = null;
    this.matrix = null;

    this.time = 0;
    this.raf = 0;
    this.visible = true;

    this.mouse = new THREE.Vector2();
    this.strength = 0;

    this.prevMouse = new THREE.Vector2();
    this.hasMouse = false;
    this.trailFrames = 0;
    this.trailA = null;
    this.trailB = null;
    this.trailMaterial = null;
    this.trailMesh = null;
    this.scene = new THREE.Scene();
    this.trailScene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
    this.createMaterial();
  }

  createMaterial() {
    if (this.mode !== this.settings.mode) {

      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.material?.dispose();
    this.mode = this.settings.mode;
    const common = {
      uTexture: { value: this.texture },
      uResolution: { value: new THREE.Vector2(this.width, this.height) },
      uCoverScale: { value: new THREE.Vector2(1, 1) },
      uBrightness: { value: this.settings.brightness },
      uContrast: { value: this.settings.contrast },
      uThreshold: { value: this.settings.threshold },

      uDarkColor: {
        value: new THREE.Color().setStyle(
          this.settings.darkColor,
          THREE.NoColorSpace,
        ),
      },
      uLightColor: {
        value: new THREE.Color().setStyle(
          this.settings.lightColor,
          THREE.NoColorSpace,
        ),
      },
      uTime: { value: this.time },
    };

    if (this.mode === "ordered") {
      this.matrix = this.settings.matrixSize;
      this.material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms: {
          ...common,
          uTrail: { value: null },
          uTrailIntensityMultiplier: { value: 1 },
          uPixelSize: { value: 1 },
          uPixelSizeMultiplier: { value: 3 },
          uScaleResolution: { value: 1 },
          uDitherAmount: { value: 1 },
          uBias: { value: 0 },
          uBiasNoiseScale: { value: 3 },
          uBiasNoiseSpeed: { value: 0.3 },
          uBiasPulseSpeed: { value: 1 },
          uBiasNoiseWeight: { value: 0.15 },
          uBiasPulseWeight: { value: 0.05 },
          uBiasAnimationStrength: { value: 1 },
        },
        vertexShader: VERTEX,
        fragmentShader: orderedFragment(this.matrix),
      });
      this.ensureTrailMaterial();
    } else {
      this.grid = this.settings.gridSize;
      this.material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms: {
          ...common,
          uMouse: { value: new THREE.Vector2() },
          uMouseStrength: { value: 0 },
          uMouseRadius: { value: 1 },
        },
        vertexShader: VERTEX,
        fragmentShader: diffusionFragment(this.grid),
      });
    }
    this.mesh.material = this.material;
  }

  ensureTrailMaterial() {
    if (this.trailMaterial) return;
    this.trailMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        uPrev: { value: null },
        uResolution: { value: new THREE.Vector2() },
        uMouse: { value: new THREE.Vector2() },
        uPrevMouse: { value: new THREE.Vector2() },
        uTrailDecay: { value: 0.94 },
        uTrailRadius: { value: 1 },
        uBrushStrength: { value: 0 },
      },
      vertexShader: VERTEX,
      fragmentShader: TRAIL_FRAGMENT,
    });
    this.trailMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.trailMaterial,
    );
    this.trailMesh.frustumCulled = false;
    this.trailScene.add(this.trailMesh);
  }

  load(onReady) {
    const setup = () => {
      this.texture?.dispose();
      const tex = new THREE.Texture(this.img);
      tex.flipY = false;
      tex.premultiplyAlpha = false;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;
      this.texture = tex;
      this.material.uniforms.uTexture.value = tex;
      onReady();
    };
    if (this.img.complete && this.img.naturalWidth > 0) setup();
    else this.img.addEventListener("load", setup, { once: true });
  }

  resize() {
    const px = this.settings.pixelSize;
    const w = Math.max(1, Math.round(this.canvas.clientWidth / px));
    const h = Math.max(1, Math.round(this.canvas.clientHeight / px));
    if (w === this.width && h === this.height && this.canvas.width === w)
      return false;
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
    if (this.mode === "ordered") this.ensureTargets();
    return true;
  }

  coverScale() {
    const imgAspect =
      (this.img.naturalWidth || 1) / (this.img.naturalHeight || 1);
    const canvasAspect = this.width / this.height;
    return imgAspect > canvasAspect
      ? new THREE.Vector2(canvasAspect / imgAspect, 1)
      : new THREE.Vector2(1, imgAspect / canvasAspect);
  }

  makeTarget() {
    const r = getRenderer();
    const type = r.capabilities.isWebGL2
      ? THREE.HalfFloatType
      : THREE.UnsignedByteType;
    return new THREE.WebGLRenderTarget(this.width, this.height, {
      type,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    });
  }

  ensureTargets() {
    if (
      this.trailA &&
      this.trailA.width === this.width &&
      this.trailA.height === this.height
    )
      return;
    this.disposeTargets();
    this.trailA = this.makeTarget();
    this.trailB = this.makeTarget();
    const r = getRenderer();
    r.setRenderTarget(this.trailA);
    r.setClearColor(0x000000, 1);
    r.clear();
    r.setRenderTarget(this.trailB);
    r.clear();
    r.setRenderTarget(null);
  }

  disposeTargets() {
    this.trailA?.dispose();
    this.trailB?.dispose();
    this.trailA = null;
    this.trailB = null;
  }

  renderTrail(r) {
    const tu = this.trailMaterial.uniforms;
    tu.uResolution.value.set(this.width, this.height);
    tu.uPrev.value = this.trailA.texture;

    tu.uMouse.value.set(this.mouse.x, this.height - this.mouse.y);
    tu.uPrevMouse.value.set(this.prevMouse.x, this.height - this.prevMouse.y);
    tu.uTrailDecay.value = this.settings.trailDecay;
    tu.uTrailRadius.value =
      Math.min(this.width, this.height) * this.settings.trailRadius;

    const dist = this.mouse.distanceTo(this.prevMouse);
    const speed = Math.min(
      1,
      dist / (Math.min(this.width, this.height) * 0.05),
    );
    tu.uBrushStrength.value = speed;

    r.setRenderTarget(this.trailB);
    r.render(this.trailScene, this.camera);
    const t = this.trailA;
    this.trailA = this.trailB;
    this.trailB = t;
    this.prevMouse.copy(this.mouse);
  }

  needsRebuild() {
    if (this.mode !== this.settings.mode) return true;
    if (this.settings.mode === "diffusion")
      return this.grid !== this.settings.gridSize;
    return this.matrix !== this.settings.matrixSize;
  }

  render() {
    if (!this.texture) return;
    if (this.needsRebuild()) this.createMaterial();

    const r = getRenderer();
    r.setSize(this.width, this.height, false);
    const u = this.material.uniforms;

    u.uResolution.value.set(this.width, this.height);
    u.uCoverScale.value.copy(this.coverScale());
    u.uBrightness.value = this.settings.brightness;
    u.uContrast.value = this.settings.contrast;
    u.uThreshold.value = this.settings.threshold;
    u.uDarkColor.value.setStyle(this.settings.darkColor, THREE.NoColorSpace);
    u.uLightColor.value.setStyle(this.settings.lightColor, THREE.NoColorSpace);
    u.uTime.value = this.time;

    if (this.mode === "ordered") {
      this.ensureTargets();
      this.renderTrail(r);
      u.uTrail.value = this.trailA.texture;
      u.uTrailIntensityMultiplier.value =
        this.settings.trailIntensityMultiplier;
      u.uPixelSize.value = this.settings.lumPixelSize;
      u.uPixelSizeMultiplier.value = this.settings.pixelSizeMultiplier;
      u.uScaleResolution.value = this.settings.scaleResolution;
      u.uDitherAmount.value = this.settings.ditherAmount;
      u.uBias.value = this.settings.bias;
      u.uBiasNoiseScale.value = this.settings.biasNoiseScale;
      u.uBiasNoiseSpeed.value = this.settings.biasNoiseSpeed;
      u.uBiasPulseSpeed.value = this.settings.biasPulseSpeed;
      u.uBiasNoiseWeight.value = this.settings.biasNoiseWeight;
      u.uBiasPulseWeight.value = this.settings.biasPulseWeight;
      u.uBiasAnimationStrength.value = this.settings.biasAnimationStrength;
    } else {
      u.uMouse.value.copy(this.mouse);
      u.uMouseStrength.value = this.strength;
      u.uMouseRadius.value = Math.min(this.width, this.height) * 0.35;
    }

    r.setClearColor(0x000000, 0);
    r.setRenderTarget(null);
    r.render(this.scene, this.camera);

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.drawImage(r.domElement, 0, 0);
  }

  visibleHoverRect() {
    const canvasRect = this.canvas.getBoundingClientRect();
    let left = canvasRect.left;
    let top = canvasRect.top;
    let right = canvasRect.right;
    let bottom = canvasRect.bottom;
    if (right <= left || bottom <= top) return null;

    let el = this.canvas.parentElement;
    while (el && el !== document.body && el !== document.documentElement) {
      const { overflow, overflowX, overflowY } = getComputedStyle(el);
      if (
        overflow !== "visible" ||
        overflowX !== "visible" ||
        overflowY !== "visible"
      ) {
        const cr = el.getBoundingClientRect();
        if (cr.width > 0 && cr.height > 0) {
          left = Math.max(left, cr.left);
          top = Math.max(top, cr.top);
          right = Math.min(right, cr.right);
          bottom = Math.min(bottom, cr.bottom);
          if (right <= left || bottom <= top) return null;
        }
      }
      el = el.parentElement;
    }
    return { left, top, right, bottom };
  }

  onPointerMove(e) {
    if (!this.visible) return;
    const vis = this.visibleHoverRect();
    if (!vis) return;
    if (
      e.clientX < vis.left ||
      e.clientX > vis.right ||
      e.clientY < vis.top ||
      e.clientY > vis.bottom
    )
      return;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.mouse.set(
      (x / rect.width) * this.width,
      (y / rect.height) * this.height,
    );
    if (!this.hasMouse) {
      this.prevMouse.copy(this.mouse);
      this.hasMouse = true;
    }
    this.visible = true;
    this.strength = 1;
    this.trailFrames = 120;
    this.animate();
  }

  animate() {
    if (this.raf) return;
    const orderedAnim =
      this.mode === "ordered" && this.settings.biasAnimationStrength !== 0;
    const needLoop =
      (this.mode === "diffusion" && this.strength > 0) ||
      (this.mode === "ordered" && (orderedAnim || this.trailFrames > 0));
    if (!needLoop) {
      this.render();
      return;
    }
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!this.visible) {
        this.raf = 0;
        return;
      }
      if (this.mode === "diffusion") {

        this.time += dt;
        this.strength *= Math.exp(-dt * 2.5);
        this.render();
        if (this.strength > 0.02) {
          this.raf = requestAnimationFrame(tick);
        } else {
          this.strength = 0;
          this.raf = 0;
          this.render();
        }
      } else {

        this.time += dt;
        if (this.trailFrames > 0) this.trailFrames -= 1;
        this.render();
        const running =
          this.settings.biasAnimationStrength !== 0 ||
          this.trailFrames > 0;
        if (running) {
          this.raf = requestAnimationFrame(tick);
        } else {
          this.raf = 0;
          this.render();
        }
      }
    };
    this.raf = requestAnimationFrame(tick);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.visible = false;
    this.texture?.dispose();
    this.material?.dispose();
    this.trailMaterial?.dispose();
    this.trailMesh?.geometry.dispose();
    this.disposeTargets();
    this.mesh.geometry.dispose();
  }
}

const instances = new Set();
let gui = null;
let debugSettings = null;
const STORAGE_KEY = "ditherImageDebug";

function isDebug() {
  return (
    new URLSearchParams(window.location.search).get("debugDitherImage") ===
    "true"
  );
}

function formatDefaults(s) {
  return `const DEFAULTS = {
  mode: "${s.mode}",
  pixelSize: ${s.pixelSize},
  gridSize: ${s.gridSize},
  threshold: ${s.threshold},
  brightness: ${s.brightness},
  contrast: ${s.contrast},
  darkColor: "${s.darkColor}",
  lightColor: "${s.lightColor}",
  matrixSize: ${s.matrixSize},
  lumPixelSize: ${s.lumPixelSize},
  pixelSizeMultiplier: ${s.pixelSizeMultiplier},
  scaleResolution: ${s.scaleResolution},
  ditherAmount: ${s.ditherAmount},
  bias: ${s.bias},
  biasNoiseScale: ${s.biasNoiseScale},
  biasNoiseSpeed: ${s.biasNoiseSpeed},
  biasPulseSpeed: ${s.biasPulseSpeed},
  biasNoiseWeight: ${s.biasNoiseWeight},
  biasPulseWeight: ${s.biasPulseWeight},
  biasAnimationStrength: ${s.biasAnimationStrength},
  trailDecay: ${s.trailDecay},
  trailRadius: ${s.trailRadius},
  trailIntensityMultiplier: ${s.trailIntensityMultiplier},
};`;
}

async function ensureGui() {
  if (gui) return;
  gui = {};
  const saved = localStorage.getItem(STORAGE_KEY);
  debugSettings = { ...DEFAULTS, ...(saved ? JSON.parse(saved) : {}) };

  const { GUI } = await import("lil-gui");
  gui = new GUI({ title: "DitherImage" });

  const onChange = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(debugSettings));
    instances.forEach((i) => i.redraw());
  };

  const general = gui.addFolder("General");
  general.add(debugSettings, "mode", ["diffusion", "ordered"]).onChange(() => {
    updateFolders();
    onChange();
  });
  general.add(debugSettings, "pixelSize", 1, 16, 1).onChange(onChange);
  general.add(debugSettings, "brightness", -1, 1).onChange(onChange);
  general.add(debugSettings, "contrast", 0, 3).onChange(onChange);
  general.addColor(debugSettings, "darkColor").onChange(onChange);
  general.addColor(debugSettings, "lightColor").onChange(onChange);

  const dither = gui.addFolder("Dither");
  const cThresh = dither
    .add(debugSettings, "threshold", 0, 1)
    .onChange(onChange);
  const cGrid = dither
    .add(debugSettings, "gridSize", 2, 8, 1)
    .onChange(onChange);
  const cMatrix = dither
    .add(debugSettings, "matrixSize", { "2x2": 2, "4x4": 4 })
    .onChange(onChange);
  const cLumPx = dither
    .add(debugSettings, "lumPixelSize", 1, 8, 1)
    .onChange(onChange);
  const cPxMul = dither
    .add(debugSettings, "pixelSizeMultiplier", 1, 8, 0.1)
    .onChange(onChange);
  const cScale = dither
    .add(debugSettings, "scaleResolution", 1, 8, 1)
    .onChange(onChange);
  const cAmt = dither
    .add(debugSettings, "ditherAmount", 0, 1, 0.01)
    .onChange(onChange);
  const cBias = dither
    .add(debugSettings, "bias", -1, 1, 0.01)
    .onChange(onChange);

  const biasF = gui.addFolder("Bias animation");
  biasF.add(debugSettings, "biasNoiseScale", 0, 10, 0.1).onChange(onChange);
  biasF.add(debugSettings, "biasNoiseSpeed", 0, 2, 0.01).onChange(onChange);
  biasF.add(debugSettings, "biasPulseSpeed", 0, 5, 0.01).onChange(onChange);
  biasF.add(debugSettings, "biasNoiseWeight", 0, 1, 0.01).onChange(onChange);
  biasF.add(debugSettings, "biasPulseWeight", 0, 1, 0.01).onChange(onChange);
  biasF
    .add(debugSettings, "biasAnimationStrength", 0, 2, 0.01)
    .onChange(onChange);

  const trailF = gui.addFolder("Trail");
  trailF.add(debugSettings, "trailDecay", 0.8, 0.995, 0.001).onChange(onChange);
  trailF.add(debugSettings, "trailRadius", 0.01, 0.3, 0.005).onChange(onChange);
  trailF
    .add(debugSettings, "trailIntensityMultiplier", 0, 3, 0.05)
    .onChange(onChange);

  function updateFolders() {
    const ordered = debugSettings.mode === "ordered";
    cGrid.show(!ordered);
    cMatrix.show(ordered);
    cLumPx.show(ordered);
    cPxMul.show(ordered);
    cScale.show(ordered);
    cAmt.show(ordered);
    cBias.show(ordered);
    cThresh.show(true);
    ordered ? biasF.show() : biasF.hide();
    ordered ? trailF.show() : trailF.hide();
  }
  updateFolders();

  const actions = {
    showOriginal: false,
    copyDefaults: () =>
      navigator.clipboard.writeText(formatDefaults(debugSettings)),
    reset: () => {
      Object.assign(debugSettings, DEFAULTS);
      gui.controllersRecursive().forEach((c) => c.updateDisplay());
      updateFolders();
      onChange();
    },
  };
  gui
    .add(actions, "showOriginal")
    .name("show original")
    .onChange((v) => instances.forEach((i) => i.showOriginal(v)));
  gui.add(actions, "copyDefaults").name("copy defaults");
  gui.add(actions, "reset");

  instances.forEach((i) => i.redraw());
}

const DitherImage = forwardRef(function DitherImage(
  { src, alt = "", className, style, onReady, ...props },
  ref,
) {
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);

  const propsRef = useRef(props);
  const onReadyRef = useRef(onReady);
  const onReadyFired = useRef(false);
  const srcReady = useRef(false);
  propsRef.current = props;
  onReadyRef.current = onReady;

  useImperativeHandle(ref, () => ({
    setSrc(next) {
      const img = imgRef.current;
      if (!img || img.getAttribute("src") === next) return;
      img.src = next;
      instanceRef.current?.reload();
    },
    redraw: () => instanceRef.current?.redraw(),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const effect = new DitherEffect(canvas, img);

    const showOriginal = (show) => {
      canvas.style.visibility = show ? "hidden" : "";
      img.style.opacity = show ? "1" : "0";
    };
    let ready = false;

    function applySettings() {
      effect.settings = { ...DEFAULTS, ...propsRef.current };
      if (debugSettings)
        effect.settings = { ...effect.settings, ...debugSettings };
    }

 function draw() {
  if (!ready) return;

  applySettings();
  effect.resize();
  effect.render();
  effect.animate();

  canvas.classList.replace("opacity-0", "opacity-100");
  img.style.opacity = "0";

  if (!onReadyFired.current) {
    onReadyFired.current = true;
    onReadyRef.current?.();
  }
}
    function reload() {
      effect.load(() => {
        ready = true;
        draw();
      });
    }

    instanceRef.current = { redraw: draw, showOriginal, reload };
    reload();

    const observer = new ResizeObserver(() => {
      if (!ready) return;
      applySettings();
      if (effect.resize()) {
        effect.render();
        effect.animate();
      }
    });
    observer.observe(canvas);

    const io = new IntersectionObserver(
      (entries) => {
        effect.visible = entries[0].isIntersecting;
        if (effect.visible && ready) draw();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    watchPointer(effect);

    instances.add(instanceRef.current);
    if (isDebug()) ensureGui();

    return () => {
      observer.disconnect();
      io.disconnect();
      unwatchPointer(effect);
      instances.delete(instanceRef.current);
      effect.dispose();
    };
  }, []);

  useEffect(() => {
    if (!srcReady.current) {
      srcReady.current = true;
      return;
    }
    instanceRef.current?.reload?.();
  }, [src]);

  useEffect(() => {
    instanceRef.current?.redraw();
  }, [JSON.stringify(props)]);

return (
  <div
    className={`relative w-full h-full overflow-hidden ${className || ""}`}
    style={style}
  >
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300"
    />

    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full opacity-0 transition-opacity duration-300 [image-rendering:pixelated]"
    />
  </div>
);
});

// const BLUR_START = "blur(0.18em)";
// const BLUR_END = "blur(0em)";
// function wrapLineForBlur(line) {
//   const inner = document.createElement("span");
//   inner.className = "gooey-copy-line-inner";

//   while (line.firstChild) {
//     inner.appendChild(line.firstChild);
//   }

//   line.appendChild(inner);
//   return inner;
// }

// function AnimatedCopy({ children, mode = "default", delay = 0 }) {
//   const containerRef = useRef(null);

//   useGSAP(
//     () => {
//       if (!containerRef.current) return;

//       let targets = [];
//       if (containerRef.current.hasAttribute("data-copy-wrapper")) {
//         targets = Array.from(containerRef.current.children);
//       } else {
//         targets = [containerRef.current];
//       }

//       const splits = [];
//       const blurLayers = [];

//       targets.forEach((target) => {
//      const split = SplitText.create(target, {
//   type: "lines",
//   linesClass: "gooey-copy-line",
// });

//       split.lines.forEach((line) => {
//   // Gooey/threshold filter stays on the outer SplitText line
//   line.style.filter = 'url("#blur-matrix")';

//   // Animated blur goes on the inner wrapper
//   const inner = wrapLineForBlur(line);
//   blurLayers.push(inner);
// });
//         splits.push(split);
//       });

//       gsap.set(blurLayers, { filter: BLUR_START });

//       if (mode === "scrub") {
//         gsap.to(blurLayers, {
//           filter: BLUR_END,
//           ease: "power3.out",
//           stagger: 0.1,
//           scrollTrigger: {
//             trigger: containerRef.current,
//             start: "top 75%",
//             end: "bottom 75%",
//             scrub: true,
//           },
//         });
//       } else if (mode === "scroll") {
//         gsap.to(blurLayers, {
//           filter: BLUR_END,
//           duration: 1.5,
//           ease: "power3.out",
//           stagger: 0.1,
//           delay: delay,
//           scrollTrigger: {
//             trigger: containerRef.current,
//             start: "top 80%",
//             once: true,
//           },
//         });
//       } else {
//         gsap.to(blurLayers, {
//           filter: BLUR_END,
//           duration: 1.5,
//           ease: "power3.out",
//           stagger: 0.1,
//           delay: delay,
//         });
//       }

//       return () => {
//         splits.forEach((split) => split.revert());
//       };
//     },
//     { scope: containerRef, dependencies: [mode, delay] },
//   );

//   if (React.Children.count(children) === 1) {
//     return React.cloneElement(children, { ref: containerRef });
//   }

//   return (
//     <div ref={containerRef} data-copy-wrapper="true">
//       {children}
//     </div>
//   );
// }
// function GooeyFilter() {
//   return (
//     <svg
//       aria-hidden="true"
//       style={{
//         position: "absolute",
//         width: 0,
//         height: 0,
//         pointerEvents: "none",
//       }}
//     >
//       <defs>
//         <filter id="blur-matrix" x="-50%" y="-50%" width="200%" height="200%">
//        <feColorMatrix
//   in="SourceGraphic"
//   type="matrix"
//   values="
//     1 0 0 0 0
//     0 1 0 0 0
//     0 0 1 0 0
//     0 0 0 12 -4
//   "
// />
//         </filter>
//       </defs>
//     </svg>
//   );
// }

const DEFAULT_PIXEL_SIZE = 8;
const DEFAULT_COLOR = [23, 87, 232];
const DEFAULT_STRENGTH = 0.04;
const DEFAULT_RADIUS = 0.04;
const DEFAULT_DECAY_RATE = 0.5;
const DEFAULT_DECAY_DURATION = 250;

function resolveColor(color) {
  if (Array.isArray(color)) return color;

  let hex = color.trim().replace(/^#/, "");

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (hex.length !== 6 || /[^0-9a-fA-F]/.test(hex)) {
    return DEFAULT_COLOR;
  }

  const value = parseInt(hex, 16);

  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
  ];
}

function getSize() {
  return [window.innerWidth, window.innerHeight];
}

/* -------------------------------------------------------
   SHADERS
------------------------------------------------------- */

const VERTEX_SHADER = `#version 300 es

in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = 0.5 * (a_position + 1.0);
  gl_Position = vec4(a_position.xy, 0.0, 1.0);
}
`;

const SPLAT_FRAGMENT = `#version 300 es

precision highp float;

in vec2 v_uv;

uniform sampler2D u_velocity;
uniform vec2 u_vector;
uniform vec2 u_cursor;
uniform vec2 u_resolution;
uniform float u_strength;
uniform float u_radius;

out vec2 FragColor;

void main() {
  float strength = u_strength;
  float radius = u_radius;

  vec2 uv = v_uv;
  vec2 velocity = texture(u_velocity, uv).rg;

  vec2 pq = uv.xy;
  vec2 cursor = u_cursor / u_resolution;
  vec2 correction = cursor - pq.xy;

  correction.x *= u_resolution.x / u_resolution.y;

  float mouse_pct = length(correction);

  float influence =
    exp(-mouse_pct * mouse_pct / (radius * radius));

  velocity += influence * u_vector * strength;

  FragColor = velocity;
}
`;

const DECAY_FRAGMENT = `#version 300 es

precision highp float;

in vec2 v_uv;

uniform sampler2D u_previous;
uniform float u_delta;
uniform float u_decay_rate;
uniform float u_decay_duration;

out vec2 FragColor;

void main() {
  FragColor =
    texture(u_previous, v_uv).rg *
    (1.0 - min(
      u_decay_rate,
      u_delta / u_decay_duration
    ));
}
`;

const COMPOSITE_FRAGMENT = `#version 300 es

precision highp float;

in vec2 v_uv;

uniform sampler2D u_cursor;
uniform vec2 u_resolution;
uniform float u_pixel_size;
uniform vec3 u_cursor_theme;

out vec4 FragColor;

float checkEqual(float first, float second) {
  float difference = abs(first - second);
  float inverted_number =
    ceil(1.0 * difference / 20.0);

  return 1.0 - inverted_number;
}

float drawLLLogo(
  vec2 rect,
  float opacity,
  float full
) {
  float x =
    mod(
      round(mod(rect.x, 1.0) * 4.0 + 0.5 + 1.0),
      4.0
    );

  float y =
    mod(
      round(mod(rect.y, 1.0) * 4.0 + 0.5),
      4.0
    );

  float divider = 7.0 + 9.0 * full;
  float progress = 1.0 / divider;
  float offset = 0.0;
  float output_opacity = 0.0;

  float block_1 =
    step(1.0 - opacity, progress * (0.0 + offset));

  float block_2 =
    step(1.0 - opacity, progress * (1.0 + offset));

  float block_3 =
    step(1.0 - opacity, progress * (2.0 + offset));

  float block_4 =
    step(1.0 - opacity, progress * (3.0 + offset));

  float block_5 =
    step(1.0 - opacity, progress * (4.0 + offset));

  float block_6 =
    step(1.0 - opacity, progress * (5.0 + offset));

  float block_7 =
    step(1.0 - opacity, progress * (6.0 + offset));

  float block_8 =
    full *
    step(1.0 - opacity, progress * (7.0 + offset));

  float block_9 =
    full *
    step(1.0 - opacity, progress * (8.0 + offset));

  float block_10 =
    full *
    step(1.0 - opacity, progress * (9.0 + offset));

  float block_11 =
    full *
    step(1.0 - opacity, progress * (10.0 + offset));

  float block_12 =
    full *
    step(1.0 - opacity, progress * (11.0 + offset));

  float block_13 =
    full *
    step(1.0 - opacity, progress * (12.0 + offset));

  float block_14 =
    full *
    step(1.0 - opacity, progress * (13.0 + offset));

  float block_15 =
    full *
    step(1.0 - opacity, progress * (14.0 + offset));

  float block_16 =
    full *
    step(1.0 - opacity, progress * (15.0 + offset));

  output_opacity +=
    block_1 *
    checkEqual(0.0, x) *
    checkEqual(0.0, y);

  output_opacity +=
    block_2 *
    checkEqual(0.0, x) *
    checkEqual(2.0, y);

  output_opacity +=
    block_3 *
    checkEqual(2.0, x) *
    checkEqual(1.0, y);

  output_opacity +=
    block_4 *
    checkEqual(3.0, x) *
    checkEqual(3.0, y);

  output_opacity +=
    block_5 *
    checkEqual(1.0, x) *
    checkEqual(3.0, y);

  output_opacity +=
    block_6 *
    checkEqual(0.0, x) *
    checkEqual(1.0, y);

  output_opacity +=
    block_7 *
    checkEqual(2.0, x) *
    checkEqual(0.0, y);

  output_opacity +=
    block_8 *
    checkEqual(0.0, x) *
    checkEqual(3.0, y);

  output_opacity +=
    block_9 *
    checkEqual(1.0, x) *
    checkEqual(2.0, y);

  output_opacity +=
    block_10 *
    checkEqual(3.0, x) *
    checkEqual(2.0, y);

  output_opacity +=
    block_11 *
    checkEqual(3.0, x) *
    checkEqual(0.0, y);

  output_opacity +=
    block_12 *
    checkEqual(2.0, x) *
    checkEqual(3.0, y);

  output_opacity +=
    block_13 *
    checkEqual(2.0, x) *
    checkEqual(2.0, y);

  output_opacity +=
    block_14 *
    checkEqual(1.0, x) *
    checkEqual(0.0, y);

  output_opacity +=
    block_15 *
    checkEqual(1.0, x) *
    checkEqual(1.0, y);

  output_opacity +=
    block_16 *
    checkEqual(3.0, x) *
    checkEqual(1.0, y);

  return min(1.0, output_opacity);
}

void main() {
  vec2 screenUV = v_uv;

  float fullColumns =
    u_resolution.x / u_pixel_size;

  float fullRows =
    u_resolution.y / u_pixel_size;

  vec2 roundedScreenUV = vec2(
    round(screenUV.x * fullColumns) / fullColumns,
    round(screenUV.y * fullRows) / fullRows
  );

  vec2 vectorField =
    texture(u_cursor, roundedScreenUV).rg;

  vec2 uv_resolution = vec2(
    screenUV.x * fullColumns,
    screenUV.y * fullRows
  );

  float cursor_f =
    drawLLLogo(
      uv_resolution,
      length(vectorField),
      0.0
    );

  float a =
    min(1.0, max(0.0, cursor_f));

  FragColor =
    vec4(
      (u_cursor_theme / 255.0) * a,
      a
    );
}
`;

/* -------------------------------------------------------
   WEBGL HELPERS
------------------------------------------------------- */

const isDev = process.env.NODE_ENV !== "production";

function createShader(gl, type, source) {
  const shader = gl.createShader(type);

  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (isDev) {
      const kind =
        type === gl.VERTEX_SHADER
          ? "vertex"
          : "fragment";

      console.error(
        `[DitherCursorTrail] ${kind} shader compile error:\n`,
        gl.getShaderInfoLog(shader)
      );
    }

    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(
  gl,
  vertexSource,
  fragmentSource
) {
  const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexSource
  );

  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentSource
  );

  if (!vertexShader || !fragmentShader) {
    if (vertexShader) {
      gl.deleteShader(vertexShader);
    }

    if (fragmentShader) {
      gl.deleteShader(fragmentShader);
    }

    return null;
  }

  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.bindAttribLocation(
    program,
    0,
    "a_position"
  );

  gl.linkProgram(program);

  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (
    !gl.getProgramParameter(
      program,
      gl.LINK_STATUS
    )
  ) {
    if (isDev) {
      console.error(
        "[DitherCursorTrail] program link error:\n",
        gl.getProgramInfoLog(program)
      );
    }

    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function DitherCursorTrail({
  pixelSize = DEFAULT_PIXEL_SIZE,
  color = DEFAULT_COLOR,
  strength = DEFAULT_STRENGTH,
  radius = DEFAULT_RADIUS,
  decayRate = DEFAULT_DECAY_RATE,
  decayDuration = DEFAULT_DECAY_DURATION,
}) {
  const canvasRef = useRef(null);

  const pixelSizeRef = useRef(pixelSize);
  const colorRef = useRef(resolveColor(color));
  const strengthRef = useRef(strength);
  const radiusRef = useRef(radius);
  const decayRateRef = useRef(decayRate);
  const decayDurationRef = useRef(decayDuration);

  pixelSizeRef.current = pixelSize;
  colorRef.current = resolveColor(color);
  strengthRef.current = strength;
  radiusRef.current = radius;
  decayRateRef.current = decayRate;
  decayDurationRef.current = decayDuration;

  useEffect(() => {
    const isTouch =
      (typeof window.matchMedia === "function" &&
        window.matchMedia("(hover: none)").matches) ||
      "ontouchstart" in window;

    if (isTouch) return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });

    if (!gl) return;

    if (
      !gl.getExtension(
        "EXT_color_buffer_float"
      )
    ) {
      return;
    }

    const splatProgram = createProgram(
      gl,
      VERTEX_SHADER,
      SPLAT_FRAGMENT
    );

    const decayProgram = createProgram(
      gl,
      VERTEX_SHADER,
      DECAY_FRAGMENT
    );

    const compositeProgram = createProgram(
      gl,
      VERTEX_SHADER,
      COMPOSITE_FRAGMENT
    );

    if (
      !splatProgram ||
      !decayProgram ||
      !compositeProgram
    ) {
      if (splatProgram) {
        gl.deleteProgram(splatProgram);
      }

      if (decayProgram) {
        gl.deleteProgram(decayProgram);
      }

      if (compositeProgram) {
        gl.deleteProgram(compositeProgram);
      }

      return;
    }

    const splatUniforms = {
      u_velocity:
        gl.getUniformLocation(
          splatProgram,
          "u_velocity"
        ),

      u_vector:
        gl.getUniformLocation(
          splatProgram,
          "u_vector"
        ),

      u_cursor:
        gl.getUniformLocation(
          splatProgram,
          "u_cursor"
        ),

      u_resolution:
        gl.getUniformLocation(
          splatProgram,
          "u_resolution"
        ),

      u_strength:
        gl.getUniformLocation(
          splatProgram,
          "u_strength"
        ),

      u_radius:
        gl.getUniformLocation(
          splatProgram,
          "u_radius"
        ),
    };

    const decayUniforms = {
      u_previous:
        gl.getUniformLocation(
          decayProgram,
          "u_previous"
        ),

      u_delta:
        gl.getUniformLocation(
          decayProgram,
          "u_delta"
        ),

      u_decay_rate:
        gl.getUniformLocation(
          decayProgram,
          "u_decay_rate"
        ),

      u_decay_duration:
        gl.getUniformLocation(
          decayProgram,
          "u_decay_duration"
        ),
    };

    const compositeUniforms = {
      u_cursor:
        gl.getUniformLocation(
          compositeProgram,
          "u_cursor"
        ),

      u_resolution:
        gl.getUniformLocation(
          compositeProgram,
          "u_resolution"
        ),

      u_pixel_size:
        gl.getUniformLocation(
          compositeProgram,
          "u_pixel_size"
        ),

      u_cursor_theme:
        gl.getUniformLocation(
          compositeProgram,
          "u_cursor_theme"
        ),
    };

    const quadBuffer = gl.createBuffer();

    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      quadBuffer
    );

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    const vao = gl.createVertexArray();

    gl.bindVertexArray(vao);

    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      quadBuffer
    );

    gl.enableVertexAttribArray(0);

    gl.vertexAttribPointer(
      0,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.bindVertexArray(null);

    let fieldWidth = 0;
    let fieldHeight = 0;

    let fields = null;
    let read = 0;

    function createField(width, height) {
      const texture = gl.createTexture();

      if (!texture) return null;

      gl.bindTexture(
        gl.TEXTURE_2D,
        texture
      );

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RG16F,
        width,
        height,
        0,
        gl.RG,
        gl.HALF_FLOAT,
        null
      );

      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR
      );

      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER,
        gl.LINEAR
      );

      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_S,
        gl.CLAMP_TO_EDGE
      );

      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_T,
        gl.CLAMP_TO_EDGE
      );

      const framebuffer =
        gl.createFramebuffer();

      if (!framebuffer) {
        gl.deleteTexture(texture);
        return null;
      }

      gl.bindFramebuffer(
        gl.FRAMEBUFFER,
        framebuffer
      );

      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
      );

      gl.viewport(
        0,
        0,
        width,
        height
      );

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      return {
        texture,
        framebuffer,
      };
    }

    function destroyFields() {
      if (!fields) return;

      for (const field of fields) {
        gl.deleteTexture(field.texture);

        gl.deleteFramebuffer(
          field.framebuffer
        );
      }

      fields = null;
    }

    function allocateFields() {
      destroyFields();

      const [w, h] = getSize();

      fieldWidth = Math.max(
        1,
        Math.floor(w)
      );

      fieldHeight = Math.max(
        1,
        Math.floor(h)
      );

      const a = createField(
        fieldWidth,
        fieldHeight
      );

      const b = createField(
        fieldWidth,
        fieldHeight
      );

      if (!a || !b) {
        if (a) {
          gl.deleteTexture(a.texture);
          gl.deleteFramebuffer(
            a.framebuffer
          );
        }

        if (b) {
          gl.deleteTexture(b.texture);
          gl.deleteFramebuffer(
            b.framebuffer
          );
        }

        fields = null;
        return;
      }

      fields = [a, b];
      read = 0;
    }

    function resize() {
      const dpr =
        window.devicePixelRatio || 1;

      const cssWidth =
        window.innerWidth;

      const cssHeight =
        window.innerHeight;

      const backingWidth = Math.max(
        1,
        Math.floor(cssWidth * dpr)
      );

      const backingHeight = Math.max(
        1,
        Math.floor(cssHeight * dpr)
      );

      if (
        canvas.width !== backingWidth
      ) {
        canvas.width = backingWidth;
      }

      if (
        canvas.height !== backingHeight
      ) {
        canvas.height = backingHeight;
      }

      allocateFields();
    }

    resize();

    let current = null;
    let last = null;

    function splat(vector, cursor) {
      if (!fields) return;

      const source = fields[read];
      const target = fields[1 - read];

      gl.disable(gl.BLEND);

      gl.useProgram(splatProgram);

      gl.bindVertexArray(vao);

      gl.bindFramebuffer(
        gl.FRAMEBUFFER,
        target.framebuffer
      );

      gl.viewport(
        0,
        0,
        fieldWidth,
        fieldHeight
      );

      gl.activeTexture(gl.TEXTURE0);

      gl.bindTexture(
        gl.TEXTURE_2D,
        source.texture
      );

      gl.uniform1i(
        splatUniforms.u_velocity,
        0
      );

      gl.uniform2f(
        splatUniforms.u_vector,
        vector[0],
        vector[1]
      );

      gl.uniform2f(
        splatUniforms.u_cursor,
        cursor[0],
        cursor[1]
      );

      gl.uniform2f(
        splatUniforms.u_resolution,
        window.innerWidth,
        window.innerHeight
      );

      gl.uniform1f(
        splatUniforms.u_strength,
        strengthRef.current
      );

      gl.uniform1f(
        splatUniforms.u_radius,
        radiusRef.current
      );

      gl.drawArrays(
        gl.TRIANGLE_STRIP,
        0,
        4
      );

      read = 1 - read;
    }

    function handleMouseMove(event) {
      last = current;

      current = [
        event.clientX,
        window.innerHeight -
          event.clientY,
      ];

      if (!last) return;

      const vector = [
        current[0] - last[0],
        current[1] - last[1],
      ];

      splat(vector, current);
    }

    function decay(delta) {
      if (!fields) return;

      const source = fields[read];
      const target = fields[1 - read];

      gl.disable(gl.BLEND);

      gl.useProgram(decayProgram);

      gl.bindVertexArray(vao);

      gl.bindFramebuffer(
        gl.FRAMEBUFFER,
        target.framebuffer
      );

      gl.viewport(
        0,
        0,
        fieldWidth,
        fieldHeight
      );

      gl.activeTexture(gl.TEXTURE0);

      gl.bindTexture(
        gl.TEXTURE_2D,
        source.texture
      );

      gl.uniform1i(
        decayUniforms.u_previous,
        0
      );

      gl.uniform1f(
        decayUniforms.u_delta,
        delta
      );

      gl.uniform1f(
        decayUniforms.u_decay_rate,
        decayRateRef.current
      );

      gl.uniform1f(
        decayUniforms.u_decay_duration,
        decayDurationRef.current
      );

      gl.drawArrays(
        gl.TRIANGLE_STRIP,
        0,
        4
      );

      read = 1 - read;
    }

    function composite() {
      if (!fields) return;

      const dpr =
        window.devicePixelRatio || 1;

      const source = fields[read];

      gl.bindFramebuffer(
        gl.FRAMEBUFFER,
        null
      );

      gl.viewport(
        0,
        0,
        canvas.width,
        canvas.height
      );

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.enable(gl.BLEND);

      gl.blendFunc(
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
      );

      gl.useProgram(
        compositeProgram
      );

      gl.bindVertexArray(vao);

      gl.activeTexture(gl.TEXTURE0);

      gl.bindTexture(
        gl.TEXTURE_2D,
        source.texture
      );

      gl.uniform1i(
        compositeUniforms.u_cursor,
        0
      );

      gl.uniform2f(
        compositeUniforms.u_resolution,
        canvas.width,
        canvas.height
      );

      gl.uniform1f(
        compositeUniforms.u_pixel_size,
        pixelSizeRef.current * dpr
      );

      const themeColor =
        colorRef.current;

      gl.uniform3f(
        compositeUniforms.u_cursor_theme,
        themeColor[0],
        themeColor[1],
        themeColor[2]
      );

      gl.drawArrays(
        gl.TRIANGLE_STRIP,
        0,
        4
      );
    }

    let rafId = 0;

    let previousTime =
      performance.now();

    function frame(now) {
      const delta =
        now - previousTime;

      previousTime = now;

      decay(delta);
      composite();

      rafId =
        window.requestAnimationFrame(
          frame
        );
    }

    rafId =
      window.requestAnimationFrame(
        frame
      );

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener(
      "resize",
      resize
    );

    return () => {
      window.cancelAnimationFrame(
        rafId
      );

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "resize",
        resize
      );

      destroyFields();

      gl.deleteBuffer(quadBuffer);
      gl.deleteVertexArray(vao);

      gl.deleteProgram(
        splatProgram
      );

      gl.deleteProgram(
        decayProgram
      );

      gl.deleteProgram(
        compositeProgram
      );
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className=" fixed inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}

const LOCATION_CARDS = [
  {
    name: "Allentown",
    description: "Our original location",
    image: "/images/allentown.png",
    href: "/locations/allentown",
  },
  {
    name: "Bethlehem",
    description: "FreySmiles Bethlehem",
    image: "/images/beth.png",
    href: "/locations/bethlehem",
  },
  {
    name: "Lehighton",
    description: "FreySmiles Lehighton",
    image: "/images/lehightonphoto.jpg",
    href: "/locations/lehighton",
  },
    {
    name: "Schnecksville",
    description: "FreySmiles Schnecksville",
    image: "../images/sch.png",
    href: "/locations/schnecksville",
  }
];

const LOCATION_CARD_PARALLAX = 40;

function LocationCard({ location }) {
  const wrapperRef = useRef(null);
  const cubeRef = useRef(null);

  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      const cube = cubeRef.current;

      if (!wrapper || !cube) return;

      const cardDepth = parseFloat(
        getComputedStyle(wrapper).getPropertyValue(
          "--location-card-depth"
        )
      );

      const rotation = {
        flip: 0,
        tiltX: 0,
        tiltY: 0,
      };

      let isFlipped = false;

      const render = () => {
        gsap.set(cube, {
          rotationX: rotation.flip + rotation.tiltX,
          rotationY: rotation.tiltY,
          z: -cardDepth / 2,
        });
      };

      render();

      const handleMouseEnter = () => {
        isFlipped = false;

        gsap.to(rotation, {
          flip: 180,
          duration: 0.5,
          ease: "power2.inOut",
          overwrite: "flip",
          onUpdate: render,
          onComplete: () => {
            isFlipped = true;
          },
        });
      };

      const handleMouseLeave = () => {
        isFlipped = false;

        gsap.to(rotation, {
          flip: 0,
          tiltX: 0,
          tiltY: 0,
          duration: 0.6,
          ease: "power3.out",
          overwrite: true,
          onUpdate: render,
        });
      };

      const handleMouseMove = (event) => {
        if (!isFlipped) return;

        const bounds = cube.getBoundingClientRect();

        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;

        const offsetX =
          (event.clientX - centerX) / bounds.width;

        const offsetY =
          (event.clientY - centerY) / bounds.height;

        gsap.to(rotation, {
          tiltY: offsetX * LOCATION_CARD_PARALLAX,
          tiltX: -offsetY * LOCATION_CARD_PARALLAX,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "tilt",
          onUpdate: render,
        });
      };

      cube.addEventListener("mouseenter", handleMouseEnter);
      cube.addEventListener("mouseleave", handleMouseLeave);
      cube.addEventListener("mousemove", handleMouseMove);

      return () => {
        cube.removeEventListener("mouseenter", handleMouseEnter);
        cube.removeEventListener("mouseleave", handleMouseLeave);
        cube.removeEventListener("mousemove", handleMouseMove);

        gsap.killTweensOf(rotation);
      };
    },
    { scope: wrapperRef }
  );

  const faceContent = (
    <>
      <img
        className="location-card-thumb"
        src={location.image}
        alt={`${location.name} FreySmiles location`}
      />

      <h2 className="location-card-title">
        {location.name}
      </h2>

      <div className="location-card-meta">
        <p className="location-card-description">
          {location.description}
        </p>
<div className="location-card-direction" aria-hidden="true">
  <span className="location-card-direction-horizontal" />
  <span className="location-card-direction-vertical" />
  <span className="location-card-direction-extra" />
</div>
      </div>
    </>
  );

  return (
    <Link
      ref={wrapperRef}
      className="location-card"
      href={location.href}
      aria-label={`View FreySmiles ${location.name}`}
    >
      <div ref={cubeRef} className="location-card-cube">
        <div className="location-card-face location-card-face-front">
          {faceContent}
        </div>

        <div className="location-card-face location-card-face-back">
          {faceContent}
        </div>

        <div className="location-card-face location-card-face-right" />
        <div className="location-card-face location-card-face-left" />
        <div className="location-card-face location-card-face-top" />
        <div className="location-card-face location-card-face-bottom" />
      </div>
    </Link>
  );
}

function LocationsCards() {
  return (
    <section className="locations-spotlight">
      {LOCATION_CARDS.map((location) => (
        <LocationCard
          key={location.name}
          location={location}
        />
      ))}
    </section>
  );
}
export default function LocationsPage() {
  return (
    <>
<DitherCursorTrail
  pixelSize={8}
  color="#1757e8"
  strength={0.04}
  radius={0.04}
  decayRate={0.5}
  decayDuration={250}
/>

      <div className="bg-[#e9eae9] text-black">


        <header className="relative h-[260px] px-12 py-10">
          <nav className="absolute left-0 right-0 top-[90px] overflow-hidden pointer-events-none">
            <div className="marquee">
              <div className="marquee-content">
                <span className="marquee-track font-neuehaas35 text-[11px] tracking-[0.25em] uppercase text-black/70">
                  Over 5,000 Invisalign Cases &nbsp;•&nbsp; Diamond Plus
                  Invisalign Provider &nbsp;•&nbsp; Top 1% Nationwide
                  &nbsp;•&nbsp; Board-Driven Diagnostic Standards &nbsp;•&nbsp;
                  Decades of Clinical Experience &nbsp;•&nbsp; Thousands of
                  Successful Outcomes &nbsp;•&nbsp;
                </span>
                <span
                  className="marquee-track font-neuehaas35 text-[11px] tracking-[0.25em] uppercase text-black/70"
                  aria-hidden="true"
                >
                  Over 5,000 Invisalign Cases &nbsp;•&nbsp; Diamond Plus
                  Invisalign Provider &nbsp;•&nbsp; Top 1% Nationwide
                  &nbsp;•&nbsp; Board-Driven Diagnostic Standards &nbsp;•&nbsp;
                  Decades of Clinical Experience &nbsp;•&nbsp; Thousands of
                  Successful Outcomes
                </span>
              </div>
            </div>
          </nav>

          <div className="absolute tracking-tight font-neuehaas35 right-12 bottom-8 text-left font-serif text-[20px] leading-tight text-black/70">
            <div>Backed By Over 60 Years of </div>
            <div>
              Combined Orthodontic{" "}
              <em className="font-canelathin">Experience.</em>
            </div>
          </div>
        </header>
      </div>

            <LocationsCards />
            <PartnerList />
        <div className="mt-12 grid grid-cols-2 gap-16 px-12 pt-10">
          {/* <p className="text-lg leading-relaxed">
            <h1 className="font-neuehaas35 text-[11px] tracking-[0.1em] uppercase text-black/70 mb-4">
              Board-Driven Diagnostic Standards
            </h1>

            <h2 className="max-w-[550px] font-neuehaas45 text-black/70 text-[17px] leading-tight">
              Our doctors are fully invested in treatment planning your case
              correctly. Guided by board-certified standards and decades of
              clinical practice, we approach every case with the same rigor
              demanded in academic orthodontics.
            </h2>
          </p> */}
        </div>



      {/* <GooeyFilter /> */}

      {/* <section className="hero">
        <AnimatedCopy delay={1}>
          <h1>The Weight of Old Light</h1>
        </AnimatedCopy>
      </section>



      <section className="room">
        <AnimatedCopy mode="scroll">
          <h3>
            Allentown - Our original location, Located across from Lehigh Valley
            Hospital. Equipped with iCat 3D imaging technology and multiple
            itero scanners for precise and convenient treatment. Private
            consultation rooms and an open bay clinic offer both breathy and
            discreet appointment experience. Beverages always available upon
            request.
          </h3>
        </AnimatedCopy>

        <AnimatedCopy mode="scroll">
          <h3>
            Allentown - Our original location, Located across from Lehigh Valley
            Hospital. Equipped with iCat 3D imaging technology and multiple
            itero scanners for precise and convenient treatment. Private
            consultation rooms and an open bay clinic offer both breathy and
            discreet appointment experience. Beverages always available upon
            request.
          </h3>
        </AnimatedCopy>
      </section>

      <section className="index">
        <AnimatedCopy mode="scrub">
          <h1>Backed By Over</h1>
          <h1>60 Years Of </h1>
          <h1>Combined Orthodontic</h1>
          <h1>Experience</h1>
        </AnimatedCopy>
      </section>



      <section className="collection">
        <AnimatedCopy mode="scrub">
          <h3>
            Allentown - Our original location, Located across from Lehigh Valley
            Hospital. Equipped with iCat 3D imaging technology and multiple
            itero scanners for precise and convenient treatment. Private
            consultation rooms and an open bay clinic offer both breathy and
            discreet appointment experience. Beverages always available upon
            request.
          </h3>
        </AnimatedCopy>
      </section>

      <div className="banner-img">
        <img src="/images/img4.jpg" alt="" />
      </div>

      <section className="outro">
        <AnimatedCopy mode="scroll">
          <h1>Step Closer</h1>
        </AnimatedCopy>
      </section> */}
    </>
  );
}

const MOBILE_QUERY = "(max-width: 1000px)";

const ROWS = [
  [
    "Lehigh Valley",
    "Four Locations",
    "Local Orthodontics",
    "FreySmiles",
  ],
  [
    "Allentown",
    "Bethlehem",
    "Schnecksville",
    "Lehighton",
    "Eastern Pennsylvania",
  ],
  [
    "Braces",
    "Invisalign",
    "3D Imaging",
    "Digital Scanning",
  ],
  [
    "Personalized Care",
    "Modern Offices",
    "Orthodontic Treatment",
    "Smile Planning",
    "FreySmiles Near You",
  ],
];

const NAMES = ROWS.flat();

function PartnerList() {
  const containerRef = useRef(null);
  const highlightRef = useRef(null);
  const itemRefs = useRef([]);
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

const placeHighlight = useCallback((index) => {
  const highlight = highlightRef.current;
  const container = containerRef.current;
  const item = itemRefs.current[index];

  if (!highlight || !container || !item) return;

  const itemRect = item.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  highlight.style.transform = `translate(
    ${itemRect.left - containerRect.left}px,
    ${itemRect.top - containerRect.top}px
  )`;

  highlight.style.width = `${itemRect.width}px`;
  highlight.style.height = `${itemRect.height}px`;
}, []);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    placeHighlight(active);

    const onResize = () => placeHighlight(active);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, isMobile, placeHighlight]);

  return (
<div className="locations-partner-list">
  <div
    className="container locations-inner"
    ref={containerRef}
  >
    <div className="locations-grid">
      {ROWS.map((row, rowIndex) => (
        <div
          key={row.join("-")}
          className="locations-row"
        >
          {row.map((name) => {
            const index = NAMES.indexOf(name);

            return (
       <div
  key={name}
  ref={(node) => {
    itemRefs.current[index] = node;
  }}
  className={`locations-item ${
    !isMobile && active === index
      ? "locations-item-active"
      : ""
  }`}
  onMouseEnter={() => {
    if (!isMobile) setActive(index);
  }}
>
  <p>{name}</p>

  {!isMobile && active === index && (
    <div
      className="locations-highlight"
      aria-hidden="true"
    >
      <span className="locations-corner locations-corner-tl" />
      <span className="locations-corner locations-corner-tr" />
      <span className="locations-corner locations-corner-bl" />
      <span className="locations-corner locations-corner-br" />
    </div>
  )}
</div>
            );
          })}
        </div>
      ))}
    </div>


  </div>
</div>
  );
}
