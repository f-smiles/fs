"use client";
import Lenis from "@studio-freight/lenis";
import { Item } from "../../utils/Item";
import Copy from "@/utils/Copy.jsx";
import * as PIXI from "pixi.js";
import { Application, Filter, Graphics, Rectangle } from "pixi.js";
import FlutedGlassEffect from "/utils/glass";
// gsap
import {
  Canvas,
  useFrame,
  useThree,
  useLoader,
  extend,
} from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  MeshTransmissionMaterial,
  Environment,
  Text,
  shaderMaterial,
  useTexture,
  Lightformer,
  ScrollControls,
} from "@react-three/drei";
import * as THREE from "three";
import { Observer } from "gsap/Observer";
import { Curtains, useCurtains, Plane } from "react-curtains";
import { Vec2 } from "curtainsjs";
import SimplePlane from "./curtains";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  motion,
  useScroll,
  useTransform,
  stagger,
  useAnimate,
  useInView,
} from "framer-motion";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import SwiperCore, { Keyboard, Mousewheel } from "swiper/core";
import React, {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  Suspense,
  forwardRef,
  useReducer,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/all";
// framer motion
import GalaxyShape from "../_components/shapes/galaxy";
import Shape03 from "../_components/shapes/shape03";
import Shape05 from "../_components/shapes/shape05";
import Shape06 from "../_components/shapes/shape06";
import VennDiagram1 from "./vennDiagramleft";
import RightFloatingCircle from "./vennDiagramright.js";

import { GUI } from "dat.gui";
import {
  CuboidCollider,
  BallCollider,
  Physics,
  RigidBody,
} from "@react-three/rapier";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import { easing } from "maath";
if (typeof window !== "undefined") {
  gsap.registerPlugin(
    ScrollSmoother,
    ScrollTrigger,
    SplitText,
    DrawSVGPlugin,
    useGSAP
  );
}

const FluidSimulation = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const config = {
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 1440,
      CAPTURE_RESOLUTION: 512,
      DENSITY_DISSIPATION: 2.5,
      VELOCITY_DISSIPATION: 2,
      PRESSURE: 0.1,
      PRESSURE_ITERATIONS: 20,
      CURL: 2,
      SPLAT_RADIUS: 0.25,
      SPLAT_FORCE: 3000,
      SHADING: true,
      COLOR_UPDATE_SPEED: 6,
      BACK_COLOR: { r: 0, g: 0, b: 0 },
    };

    let gl, ext, dye, velocity, divergence, curl, pressure;
    let blurProgram, copyProgram, clearProgram, colorProgram, splatProgram;
    let advectionProgram, divergenceProgram, curlProgram, vorticityProgram;
    let pressureProgram, gradientSubtractProgram;
    let displayMaterial;
    let lastUpdateTime = Date.now();
    let colorUpdateTimer = 0.0;
    const pointers = [new PointerPrototype()];
    let blit;
    let animationId = null;
    let initAttempts = 0;
    const maxInitAttempts = 3;
    let splatRetryAttempts = 0;
    const maxSplatRetryAttempts = 3;
    let isInitialized = false;
    let splatsDone = false; 
    let firstFrame = true;

    const baseVertexShaderSource = `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;
      void main () {
          vUv = aPosition * 0.5 + 0.5;
          vL = vUv - vec2(texelSize.x, 0.0);
          vR = vUv + vec2(texelSize.x, 0.0);
          vT = vUv + vec2(0.0, texelSize.y);
          vB = vUv - vec2(0.0, texelSize.y);
          gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;
    const blurVertexShaderSource = `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      uniform vec2 texelSize;
      void main () {
          vUv = aPosition * 0.5 + 0.5;
          float offset = 1.33333333;
          vL = vUv - texelSize * offset;
          vR = vUv + texelSize * offset;
          gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;
    const blurShaderSource = `
      precision mediump float;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      uniform sampler2D uTexture;
      void main () {
          vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
          sum += texture2D(uTexture, vL) * 0.35294117;
          sum += texture2D(uTexture, vR) * 0.35294117;
          gl_FragColor = sum;
      }
    `;
    const copyShaderSource = `
      precision mediump float;
      varying highp vec2 vUv;
      uniform sampler2D uTexture;
      void main () {
          gl_FragColor = texture2D(uTexture, vUv);
      }
    `;
    const clearShaderSource = `
      precision mediump float;
      varying highp vec2 vUv;
      uniform sampler2D uTexture;
      uniform float value;
      void main () {
          gl_FragColor = value * texture2D(uTexture, vUv);
      }
    `;
    const colorShaderSource = `
      precision mediump float;
      uniform vec4 color;
      void main () {
          gl_FragColor = color;
      }
    `;
    const displayShaderSource = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uTexture;
      uniform vec2 texelSize;
      vec3 linearToGamma (vec3 color) {
          color = max(color, vec3(0));
          return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
      }
      void main () {
          vec3 c = texture2D(uTexture, vUv).rgb;
      #ifdef SHADING
          vec3 lc = texture2D(uTexture, vL).rgb;
          vec3 rc = texture2D(uTexture, vR).rgb;
          vec3 tc = texture2D(uTexture, vT).rgb;
          vec3 bc = texture2D(uTexture, vB).rgb;
          float dx = length(rc) - length(lc);
          float dy = length(tc) - length(bc);
          vec3 n = normalize(vec3(dx, dy, length(texelSize)));
          vec3 l = vec3(0.0, 0.0, 1.0);
          float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
          c *= diffuse;
      #endif
          float a = max(c.r, max(c.g, c.b));
          gl_FragColor = vec4(c, a);
      }
    `;
    const splatShaderSource = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;
      void main () {
          vec2 p = vUv - point.xy;
          p.x *= aspectRatio;
          vec3 splat = exp(-dot(p, p) / radius) * color;
          vec3 base = texture2D(uTarget, vUv).xyz;
          gl_FragColor = vec4(base + splat, 1.0);
      }
    `;
    const advectionShaderSource = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform vec2 dyeTexelSize;
      uniform float dt;
      uniform float dissipation;
      vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
          vec2 st = uv / tsize - 0.5;
          vec2 iuv = floor(st);
          vec2 fuv = fract(st);
          vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
          vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
          vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
          vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
          return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
      }
      void main () {
      #ifdef MANUAL_FILTERING
          vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
          vec4 result = bilerp(uSource, coord, dyeTexelSize);
      #else
          vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
          vec4 result = texture2D(uSource, coord);
      #endif
          float decay = 1.0 + dissipation * dt;
          gl_FragColor = result / decay;
      }
    `;
    const divergenceShaderSource = `
      precision mediump float;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
          float L = texture2D(uVelocity, vL).x;
          float R = texture2D(uVelocity, vR).x;
          float T = texture2D(uVelocity, vT).y;
          float B = texture2D(uVelocity, vB).y;
          vec2 C = texture2D(uVelocity, vUv).xy;
          if (vL.x < 0.0) { L = -C.x; }
          if (vR.x > 1.0) { R = -C.x; }
          if (vT.y > 1.0) { T = -C.y; }
          if (vB.y < 0.0) { B = -C.y; }
          float div = 0.5 * (R - L + T - B);
          gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `;
    const curlShaderSource = `
      precision mediump float;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
          float L = texture2D(uVelocity, vL).y;
          float R = texture2D(uVelocity, vR).y;
          float T = texture2D(uVelocity, vT).x;
          float B = texture2D(uVelocity, vB).x;
          float vorticity = R - L - T + B;
          gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
      }
    `;
    const vorticityShaderSource = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;
      void main () {
          float L = texture2D(uCurl, vL).x;
          float R = texture2D(uCurl, vR).x;
          float T = texture2D(uCurl, vT).x;
          float B = texture2D(uCurl, vB).x;
          float C = texture2D(uCurl, vUv).x;
          vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
          force /= length(force) + 0.0001;
          force *= curl * C;
          force.y *= -1.0;
          vec2 velocity = texture2D(uVelocity, vUv).xy;
          velocity += force * dt;
          velocity = min(max(velocity, -1000.0), 1000.0);
          gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `;
    const pressureShaderSource = `
      precision mediump float;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;
      void main () {
          float L = texture2D(uPressure, vL).x;
          float R = texture2D(uPressure, vR).x;
          float T = texture2D(uPressure, vT).x;
          float B = texture2D(uPressure, vB).x;
          float C = texture2D(uPressure, vUv).x;
          float divergence = texture2D(uDivergence, vUv).x;
          float pressure = (L + R + B + T - divergence) * 0.25;
          gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `;
    const gradientSubtractShaderSource = `
      precision mediump float;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;
      void main () {
          float L = texture2D(uPressure, vL).x;
          float R = texture2D(uPressure, vR).x;
          float T = texture2D(uPressure, vT).x;
          float B = texture2D(uPressure, vB).x;
          vec2 velocity = texture2D(uVelocity, vUv).xy;
          velocity.xy -= vec2(R - L, T - B);
          gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `;

    function PointerPrototype() {
      this.id = -1;
      this.texcoordX = 0;
      this.texcoordY = 0;
      this.prevTexcoordX = 0;
      this.prevTexcoordY = 0;
      this.deltaX = 0;
      this.deltaY = 0;
      this.down = false;
      this.moved = false;
      this.color = [0.3, 0.0, 1.0];
    }

    function getWebGLContext(canvas) {
      const params = {
        alpha: true,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: false,
      };

      let gl = canvas.getContext("webgl2", params);
      const isWebGL2 = !!gl;
      if (!isWebGL2)
        gl = canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params);

      let halfFloat;
      let supportLinearFiltering;
      if (isWebGL2) {
        gl.getExtension("EXT_color_buffer_float");
        supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
      } else {
        halfFloat = gl.getExtension("OES_texture_half_float");
        supportLinearFiltering = gl.getExtension("OES_texture_half_float_linear");
      }

      gl.clearColor(0.0, 0.0, 0.0, 0);

      const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
      let formatRGBA, formatRG, formatR;

      if (isWebGL2) {
        formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
      } else {
        formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      }

      console.log("WebGL formats:", { formatRGBA, formatRG, formatR });

      return {
        gl,
        ext: {
          formatRGBA,
          formatRG,
          formatR,
          halfFloatTexType,
          supportLinearFiltering,
        },
      };
    }

    function getSupportedFormat(gl, internalFormat, format, type) {
      if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
        switch (internalFormat) {
          case gl.R16F:
            return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
          case gl.RG16F:
            return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
          default:
            return null;
        }
      }

      return { internalFormat, format };
    }

    function supportRenderTextureFormat(gl, internalFormat, format, type) {
      let texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

      let fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

      let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      console.log("Framebuffer status for format", internalFormat, ":", status === gl.FRAMEBUFFER_COMPLETE ? "Complete" : status);
      return status === gl.FRAMEBUFFER_COMPLETE;
    }

    class Material {
      constructor(vertexShader, fragmentShaderSource) {
        this.vertexShader = vertexShader;
        this.fragmentShaderSource = fragmentShaderSource;
        this.programs = [];
        this.activeProgram = null;
        this.uniforms = [];
      }

      setKeywords(keywords) {
        let hash = 0;
        for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i]);

        let program = this.programs[hash];
        if (program == null) {
          let fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
          program = createProgram(this.vertexShader, fragmentShader);
          this.programs[hash] = program;
        }

        if (program == this.activeProgram) return;

        this.uniforms = getUniforms(program);
        this.activeProgram = program;
      }

      bind() {
        gl.useProgram(this.activeProgram);
      }
    }

    class Program {
      constructor(vertexShader, fragmentShader) {
        this.uniforms = {};
        this.program = createProgram(vertexShader, fragmentShader);
        this.uniforms = getUniforms(this.program);
      }

      bind() {
        gl.useProgram(this.program);
      }
    }

    function createProgram(vertexShader, fragmentShader) {
      if (!vertexShader || !fragmentShader) {
        console.error("createProgram failed: shader missing");
        return null;
      }

      let program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
      }

      return program;
    }

    function getUniforms(program) {
      let uniforms = [];
      let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        let uniformName = gl.getActiveUniform(program, i).name;
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
      }
      return uniforms;
    }

    function compileShader(type, source, keywords) {
      source = addKeywords(source, keywords);

      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        return null;
      }

      return shader;
    }

    function addKeywords(source, keywords) {
      if (keywords == null) return source;
      let keywordsString = "";
      keywords.forEach((keyword) => {
        keywordsString += "#define " + keyword + "\n";
      });
      return keywordsString + source;
    }

    function checkFramebuffers() {
      const fbos = [
        { name: "dye.read", fbo: dye?.read?.fbo },
        { name: "dye.write", fbo: dye?.write?.fbo },
        { name: "velocity.read", fbo: velocity?.read?.fbo },
        { name: "velocity.write", fbo: velocity?.write?.fbo },
        { name: "divergence", fbo: divergence?.fbo },
        { name: "curl", fbo: curl?.fbo },
        { name: "pressure.read", fbo: pressure?.read?.fbo },
        { name: "pressure.write", fbo: pressure?.write?.fbo },
      ];
      let allComplete = true;
      fbos.forEach(({ name, fbo }) => {
        if (fbo) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
          const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
          console.log(`Framebuffer ${name} status:`, status === gl.FRAMEBUFFER_COMPLETE ? "Complete" : status);
          if (status !== gl.FRAMEBUFFER_COMPLETE) allComplete = false;
        } else {
          console.warn(`Framebuffer ${name} not initialized`);
          allComplete = false;
        }
      });
      return allComplete;
    }

    function initFramebuffers() {
      let simRes = getResolution(config.SIM_RESOLUTION);
      let dyeRes = getResolution(config.DYE_RESOLUTION);

      const texType = ext.halfFloatTexType;
      const rgba = ext.formatRGBA;
      const rg = ext.formatRG;
      const r = ext.formatR;
      const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

      gl.disable(gl.BLEND);

      if (dye == null)
        dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
      else
        dye = resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);

      if (velocity == null)
        velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
      else
        velocity = resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);

      divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    }

    function createFBO(w, h, internalFormat, format, type, param) {
      gl.activeTexture(gl.TEXTURE0);
      let texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

      let fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);

      let texelSizeX = 1.0 / w;
      let texelSizeY = 1.0 / h;

      return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX,
        texelSizeY,
        attach(id) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        },
      };
    }

    function createDoubleFBO(w, h, internalFormat, format, type, param) {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(w, h, internalFormat, format, type, param);

      return {
        width: w,
        height: h,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read() {
          return fbo1;
        },
        set read(value) {
          fbo1 = value;
        },
        get write() {
          return fbo2;
        },
        set write(value) {
          fbo2 = value;
        },
        swap() {
          let temp = fbo1;
          fbo1 = fbo2;
          fbo2 = temp;
        },
      };
    }

    function resizeFBO(target, w, h, internalFormat, format, type, param) {
      let newFBO = createFBO(w, h, internalFormat, format, type, param);
      copyProgram.bind();
      gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
      blit(newFBO);
      return newFBO;
    }

    function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
      if (target.width == w && target.height == h) return target;
      target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
      target.write = createFBO(w, h, internalFormat, format, type, param);
      target.width = w;
      target.height = h;
      target.texelSizeX = 1.0 / w;
      target.texelSizeY = 1.0 / h;
      return target;
    }

    function createTextureAsync(url) {
      let texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255]));

      let obj = {
        texture,
        width: 1,
        height: 1,
        attach(id) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        },
      };

      let image = new Image();
      image.onload = () => {
        obj.width = image.width;
        obj.height = image.height;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      };
      image.src = url;

      return obj;
    }

    function updateKeywords() {
      let displayKeywords = [];
      if (config.SHADING) displayKeywords.push("SHADING");
      displayMaterial.setKeywords(displayKeywords);
    }

    function calcDeltaTime() {
      let now = Date.now();
      let dt = (now - lastUpdateTime) / 1000;
      dt = Math.min(dt, firstFrame ? 0.008 : 0.016666); // Cap at 8ms for first frame, 16.67ms otherwise
      lastUpdateTime = now;
      firstFrame = false;
      console.log(`Delta time: ${dt}s, firstFrame: ${firstFrame}`);
      return dt;
    }

    function resizeCanvas() {
      let width = scaleByPixelRatio(canvas.clientWidth || window.innerWidth);
      let height = scaleByPixelRatio(canvas.clientHeight || window.innerHeight);
      if (canvas.width != width || canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
        console.log("Canvas resized:", width, height);
        return true;
      }
      return false;
    }

    function updateColors(dt) {
      colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
      if (colorUpdateTimer >= 1) {
        colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
        pointers.forEach((p) => {
          p.color = generateColor();
        });
      }
    }

    function splat(x, y, dx, dy, color) {
      if (!gl || !splatProgram || !velocity || !dye) {
        console.warn("Splat failed: WebGL not fully initialized");
        return false;
      }
      splatProgram.bind();
      gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
      gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(splatProgram.uniforms.point, x, y);
      gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
      gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
      gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
      blit(dye.write);
      dye.swap();
      return true;
    }

    function splatPointer(pointer) {
      let dx = pointer.deltaX * config.SPLAT_FORCE;
      let dy = pointer.deltaY * config.SPLAT_FORCE;
      return splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    }

    function applyInputs() {
      pointers.forEach((p) => {
        if (p.moved) {
          p.moved = false;
          splatPointer(p);
        }
      });
    }

    function correctRadius(radius) {
      let aspectRatio = canvas.width / canvas.height;
      if (aspectRatio > 1) radius *= aspectRatio;
      return radius;
    }

    function updatePointerDownData(pointer, id, posX, posY) {
      pointer.id = id;
      pointer.down = true;
      pointer.moved = false;
      pointer.texcoordX = posX / canvas.width;
      pointer.texcoordY = 1.0 - posY / canvas.height;
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.deltaX = 0;
      pointer.deltaY = 0;
      pointer.color = generateColor();
    }

    function updatePointerMoveData(pointer, posX, posY, color) {
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = posX / canvas.width;
      pointer.texcoordY = 1.0 - posY / canvas.height;
      pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
      pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
      pointer.color = color;
    }

    function updatePointerUpData(pointer) {
      pointer.down = false;
    }

    function correctDeltaX(delta) {
      let aspectRatio = canvas.width / canvas.height;
      if (aspectRatio < 1) delta *= aspectRatio;
      return delta;
    }

    function correctDeltaY(delta) {
      let aspectRatio = canvas.width / canvas.height;
      if (aspectRatio > 1) delta /= aspectRatio;
      return delta;
    }

    function generateColor() {
      let c = HSVtoRGB(Math.random(), 1.0, 1.0);
      c.r *= 0.0015;
      c.g *= 0.0015;
      c.b *= 0.0015;
      return c;
    }

    function HSVtoRGB(h, s, v) {
      let r, g, b, i;
      i = Math.floor(h * 3);
      switch (i % 3) {
        case 0:
          (r = 60), (g = 184), (b = 211);
          break;
        case 1:
          (r = 194), (g = 112), (b = 243);
          break;
        case 2:
          (r = 255), (g = 39), (b = 119);
          break;
      }
      return { r, g, b };
    }

    function wrap(value, min, max) {
      let range = max - min;
      if (range == 0) return min;
      return ((value - min) % range) + min;
    }

    function getResolution(resolution) {
      let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;

      let min = Math.round(resolution);
      let max = Math.round(resolution * aspectRatio);

      if (gl.drawingBufferWidth > gl.drawingBufferHeight)
        return { width: max, height: min };
      else return { width: min, height: max };
    }

    function scaleByPixelRatio(input) {
      let pixelRatio = window.devicePixelRatio || 1;
      return Math.floor(input * pixelRatio);
    }

    function hashCode(s) {
      if (s.length == 0) return 0;
      let hash = 0;
      for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    }

    function clickSplat(pointer) {
      const color = generateColor();
      color.r *= 10.0;
      color.g *= 10.0;
      color.b *= 10.0;
      let dx = 10 * (Math.random() - 0.5);
      let dy = 30 * (Math.random() - 0.5);
      splat(pointer.texcoordX, pointer.texcoordY, dx, dy, color);
    }

    const multipleSplats = (amount) => {
      if (!gl || !dye || !velocity || !splatProgram) {
        console.warn("multipleSplats failed: WebGL not fully initialized");
        return false;
      }
gl.disable(gl.BLEND);
      gl.enable(gl.BLEND);
      let success = true;
      for (let i = 0; i < amount; i++) {
        const color = generateColor();
        color.r *= 10.0;
        color.g *= 10.0;
        color.b *= 10.0;
        const x = canvas.width * Math.random();
        const y = canvas.height * Math.random();
        const dx = 1000 * (Math.random() - 0.5);
        const dy = 1000 * (Math.random() - 0.5);
        if (!splat(x / canvas.width, y / canvas.height, dx, dy, color)) {
          success = false;
        }
      }
      render(null);
      console.log(`multipleSplats(${amount}) ${success ? "succeeded" : "failed"}`);
      return success;
    };

    const trySplats = () => {
      if (splatRetryAttempts >= maxSplatRetryAttempts) {
        console.error("Max splat retry attempts reached");
        return;
      }
      splatRetryAttempts++;
      // Reset pointer state
      pointers[0].moved = false;
      pointers[0].deltaX = 0;
      pointers[0].deltaY = 0;
      pointers[0].down = false;
      // Initialize pointer at canvas center
      pointers[0].texcoordX = 0.5;
      pointers[0].texcoordY = 0.5;
      pointers[0].prevTexcoordX = 0.5;
      pointers[0].prevTexcoordY = 0.5;
      pointers[0].color = generateColor();
      console.log(`trySplats: pointer initialized at texcoordX=${pointers[0].texcoordX}, texcoordY=${pointers[0].texcoordY}`);
      const success = multipleSplats(4);
      console.log(`Splat attempt ${splatRetryAttempts}/${maxSplatRetryAttempts}: ${success ? "succeeded" : "failed"}`);
      if (success && !isInitialized) {
        isInitialized = true;
        splatsDone = true; // Mark initial splats as complete
        render(null); // Force render to ensure splats are visible
        attachListeners();
      } else if (!success) {
        setTimeout(trySplats, 300);
      }
    };

    function initWebGL() {
      if (initAttempts >= maxInitAttempts) {
        console.error("Max WebGL initialization attempts reached");
        return;
      }
      initAttempts++;

      const rect = canvas.getBoundingClientRect();
      console.log("Canvas size (attempt", initAttempts, "):", rect.width, rect.height, "Visible:", canvas.offsetParent !== null, "Styles:", getComputedStyle(canvas));

      if (rect.width <= 0 || rect.height <= 0) {
        console.warn("Invalid canvas size, retrying...");
        requestAnimationFrame(initWebGL);
        return;
      }

      canvas.width = scaleByPixelRatio(rect.width || window.innerWidth);
      canvas.height = scaleByPixelRatio(rect.height || window.innerHeight);

      const context = getWebGLContext(canvas);
      gl = context.gl;
      ext = context.ext;

      if (!gl) {
        console.error("WebGL not supported, retrying...");
        requestAnimationFrame(initWebGL);
        return;
      }

      if (!ext.supportLinearFiltering) {
        config.DYE_RESOLUTION = 512;
        config.SHADING = false;
      }

      const baseVertexShader = compileShader(gl.VERTEX_SHADER, baseVertexShaderSource);
      const blurVertexShader = compileShader(gl.VERTEX_SHADER, blurVertexShaderSource);
      const blurShader = compileShader(gl.FRAGMENT_SHADER, blurShaderSource);
      const copyShader = compileShader(gl.FRAGMENT_SHADER, copyShaderSource);
      const clearShader = compileShader(gl.FRAGMENT_SHADER, clearShaderSource);
      const colorShader = compileShader(gl.FRAGMENT_SHADER, colorShaderSource);
      const splatShader = compileShader(gl.FRAGMENT_SHADER, splatShaderSource);
      const advectionShader = compileShader(gl.FRAGMENT_SHADER, advectionShaderSource);
      const divergenceShader = compileShader(gl.FRAGMENT_SHADER, divergenceShaderSource);
      const curlShader = compileShader(gl.FRAGMENT_SHADER, curlShaderSource);
      const vorticityShader = compileShader(gl.FRAGMENT_SHADER, vorticityShaderSource);
      const pressureShader = compileShader(gl.FRAGMENT_SHADER, pressureShaderSource);
      const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, gradientSubtractShaderSource);

      blurProgram = new Program(blurVertexShader, blurShader);
      copyProgram = new Program(baseVertexShader, copyShader);
      clearProgram = new Program(baseVertexShader, clearShader);
      colorProgram = new Program(baseVertexShader, colorShader);
      splatProgram = new Program(baseVertexShader, splatShader);
      advectionProgram = new Program(baseVertexShader, advectionShader);
      divergenceProgram = new Program(baseVertexShader, divergenceShader);
      curlProgram = new Program(baseVertexShader, curlShader);
      vorticityProgram = new Program(baseVertexShader, vorticityShader);
      pressureProgram = new Program(baseVertexShader, pressureShader);
      gradientSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);

      displayMaterial = new Material(baseVertexShader, displayShaderSource);

      initFramebuffers();
      if (!checkFramebuffers()) {
        console.warn("Framebuffer initialization incomplete, retrying...");
        requestAnimationFrame(initWebGL);
        return;
      }

      updateKeywords();

      blit = (() => {
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl. enableVertexAttribArray(0);

        return (target, clear = false) => {
          if (target == null) {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          } else {
            gl.viewport(0, 0, target.width, target.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
          }
          if (clear) {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
          }
          gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        };
      })();

      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);

      setTimeout(() => {
        trySplats();
      }, 300);

      const update = () => {
        if (!blurProgram || !dye || !velocity || !splatsDone) {
          animationId = requestAnimationFrame(update);
          console.log(`Update delayed: blurProgram=${!!blurProgram}, dye=${!!dye}, velocity=${!!velocity}, splatsDone=${splatsDone}`);
          return;
        }

        const dt = calcDeltaTime();
        if (resizeCanvas()) {
          initFramebuffers();
          if (checkFramebuffers() && isInitialized) trySplats();
        }

        updateColors(dt);
        applyInputs();
        step(dt);
        render(null);

        animationId = requestAnimationFrame(update);
      };

      update();
    }

    function step(dt) {
      gl.disable(gl.BLEND);

      curlProgram.bind();
      gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl);

      vorticityProgram.bind();
      gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
      gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
      gl.uniform1f(vorticityProgram.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      divergenceProgram.bind();
      gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);

      clearProgram.bind();
      gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
      gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
      blit(pressure.write);
      pressure.swap();

      pressureProgram.bind();
      gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      gradientSubtractProgram.bind();
      gl.uniform2f(gradientSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gradientSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
      gl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      advectionProgram.bind();
      gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
      let velocityId = velocity.read.attach(0);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
      gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
      gl.uniform1f(advectionProgram.uniforms.dt, dt);
      gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
      gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();
    }

    function render(target) {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      drawDisplay(target);
    }

    function drawDisplay(target) {
      let width = target == null ? gl.drawingBufferWidth : target.width;
      let height = target == null ? gl.drawingBufferHeight : target.height;

      displayMaterial.bind();
      if (config.SHADING)
        gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / width, 1.0 / height);
      gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
      blit(target);
    }

    function onContextLost(e) {
      e.preventDefault();
      console.warn("WebGL context lost");
      if (animationId) cancelAnimationFrame(animationId);
      isInitialized = false;
      splatsDone = false;
      firstFrame = true;
    }

    function onContextRestored() {
      console.log("WebGL context restored, reinitializing...");
      disposeGL(true);
      initWebGL();
    }

    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const posX = scaleByPixelRatio(e.clientX - rect.left);
      const posY = scaleByPixelRatio(e.clientY - rect.top);
      updatePointerDownData(pointers[0], -1, posX, posY);
      clickSplat(pointers[0]);
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const posX = scaleByPixelRatio(e.clientX - rect.left);
      const posY = scaleByPixelRatio(e.clientY - rect.top);
      console.log(`Mouse move: posX=${posX}, posY=${posY}, initialized=${isInitialized}`);
      if (!isInitialized) return;
      updatePointerMoveData(pointers[0], posX, posY, pointers[0].color);
      if (pointers[0].down) {
        splatPointer(pointers[0]);
      }
    };

    const handleMouseUp = () => {
      if (pointers[0]) {
        updatePointerUpData(pointers[0]);
      }
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touches = e.targetTouches;
      for (let i = 0; i < touches.length; i++) {
        const posX = scaleByPixelRatio(touches[i].clientX - canvas.getBoundingClientRect().left);
        const posY = scaleByPixelRatio(touches[i].clientY - canvas.getBoundingClientRect().top);
        updatePointerDownData(pointers[0], touches[i].identifier, posX, posY);
        clickSplat(pointers[0]);
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touches = e.targetTouches;
      for (let i = 0; i < touches.length; i++) {
        const posX = scaleByPixelRatio(touches[i].clientX - canvas.getBoundingClientRect().left);
        const posY = scaleByPixelRatio(touches[i].clientY - canvas.getBoundingClientRect().top);
        if (!isInitialized) return;
        updatePointerMoveData(pointers[0], posX, posY, pointers[0].color);
        if (pointers[0].down) {
          splatPointer(pointers[0]);
        }
      }
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      updatePointerUpData(pointers[0]);
    };

    const handleResize = () => {
      if (resizeCanvas()) {
        initFramebuffers();
        if (checkFramebuffers() && isInitialized) multipleSplats(4);
      }
    };

    const attachListeners = () => {
      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
      canvas.addEventListener("touchend", handleTouchEnd);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("resize", handleResize);
      canvas.addEventListener("webglcontextlost", onContextLost, false);
      canvas.addEventListener("webglcontextrestored", onContextRestored, false);
      console.log("Event listeners attached");
    };

    const detachListeners = () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      console.log("Event listeners detached");
    };

    function disposeGL(skipLose = false) {
      try {
        if (animationId) cancelAnimationFrame(animationId);
        detachListeners();

        if (!gl) return;

        const delTarget = (t) => { if (t?.texture) gl.deleteTexture(t.texture); };
        const delDoubleFBO = (pair) => {
          if (!pair) return;
          delTarget(pair.read);
          delTarget(pair.write);
          if (pair.read?.fbo) gl.deleteFramebuffer(pair.read.fbo);
          if (pair.write?.fbo) gl.deleteFramebuffer(pair.write.fbo);
        };
        delDoubleFBO(dye);
        delDoubleFBO(velocity);
        if (divergence?.fbo) gl.deleteFramebuffer(divergence.fbo);
        if (curl?.fbo) gl.deleteFramebuffer(curl.fbo);
        delDoubleFBO(pressure);

        const delProgram = (p) => { if (p?.program) gl.deleteProgram(p.program); };
        delProgram(blurProgram);
        delProgram(copyProgram);
        delProgram(clearProgram);
        delProgram(colorProgram);
        delProgram(splatProgram);
        delProgram(advectionProgram);
        delProgram(divergenceProgram);
        delProgram(curlProgram);
        delProgram(vorticityProgram);
        delProgram(pressureProgram);
        delProgram(gradientSubtractProgram);

        if (displayMaterial?.programs) {
          displayMaterial.programs.forEach(prg => prg && gl.deleteProgram(prg));
          displayMaterial.programs.length = 0;
        }

        if (!skipLose) gl.getExtension('WEBGL_lose_context')?.loseContext();
      } catch (e) {
        console.warn('disposeGL error', e);
      } finally {
        gl = null;
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log("Canvas is visible, initializing WebGL");
          initWebGL();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    return () => {
      disposeGL();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "auto",
        background: "transparent",
        zIndex: 1,
      }}
    />
  );
}

function LivingLine() {
  const svgRef = useRef(null);
  const pathRef = useRef(null);

  const pointsRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  /* ----------------------------------
     Geometry helpers
  ---------------------------------- */

  function sCurve(t) {
    if (t < 0.5) {
      const u = t * 2;
      return -1 + 2 * (u * u * (3 - 2 * u));
    } else {
      const u = (t - 0.5) * 2;
      return 1 - 2 * (u * u * (3 - 2 * u));
    }
  }

  function generateBasePoints() {
    const width = window.innerWidth;
    const height = document.documentElement.scrollHeight;

    const COUNT = Math.floor(height * 0.35);
    const CENTER_X = width * 0.5;
    const AMPLITUDE = width * 0.35;

    return Array.from({ length: COUNT }, (_, i) => {
      const t = i / (COUNT - 1);
      const y = t * height;
      const x = CENTER_X + sCurve((y / window.innerHeight) % 1) * AMPLITUDE;

      return {
        base: { x, y },
        current: { x, y },
        target: { x, y },
        velocity: { x: 0, y: 0 },

        angular: 0,
        angularTarget: 0,
        hoverForce: { x: 0, y: 0 },

        loop: {
          active: false,
          center: { x: 0, y: 0 },
          radius: 0,
          strength: 0,
        },
      };
    });
  }

  /* ----------------------------------
     Interaction forces
  ---------------------------------- */

  function applyHover(points) {
    const mouse = mouseRef.current;
    const RADIUS = 140;

    points.forEach((p) => {
      const dx = p.current.x - mouse.x;
      const dy = p.current.y - mouse.y;
      const dist = Math.hypot(dx, dy);

      if (dist > RADIUS || dist < 2) return;

      const falloff = Math.pow(1 - dist / RADIUS, 2);
      const px = -dy / dist;
      const py = dx / dist;

      p.hoverForce.x += px * falloff * 0.8;
      p.hoverForce.y += py * falloff * 0.8;
    });
  }

  function updatePoints(points) {
    const STIFFNESS = 0.012;
    const DAMPING = 0.84;
    const SPREAD = 0.25;

    points.forEach((p) => {
      p.velocity.x =
        (p.velocity.x + (p.target.x - p.current.x) * STIFFNESS) * DAMPING;
      p.velocity.y =
        (p.velocity.y + (p.target.y - p.current.y) * STIFFNESS) * DAMPING;

      // Syrupy hover response
      p.velocity.x += p.hoverForce.x * 0.025;
      p.velocity.y += p.hoverForce.y * 0.025;
      p.hoverForce.x *= 0.97;
      p.hoverForce.y *= 0.97;

      if (p.loop.active) {
        const dx = p.current.x - p.loop.center.x;
        const dy = p.current.y - p.loop.center.y;
        const dist = Math.hypot(dx, dy) || 0.0001;

        const err = dist - p.loop.radius;
        p.velocity.x += (-dx / dist) * err * 0.04;
        p.velocity.y += (-dy / dist) * err * 0.04;

        p.velocity.x += (-dy / dist) * p.loop.strength * dist;
        p.velocity.y += (dx / dist) * p.loop.strength * dist;

        p.loop.radius *= 0.998;
        p.loop.strength *= 0.995;
        if (p.loop.strength < 0.001) p.loop.active = false;
      }
    });

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const next = points[i + 1];
      points[i].velocity.x +=
        ((prev.current.x + next.current.x) / 2 -
          points[i].current.x) *
        SPREAD;
    }

    points.forEach((p) => {
      p.current.x += p.velocity.x;
      p.current.y += p.velocity.y;
    });
  }

  /* ----------------------------------
     Path builder
  ---------------------------------- */

  function buildPath(points) {
    let d = `M -40 ${points[0].current.y}`;
    points.forEach((p) => (d += ` L ${p.current.x} ${p.current.y}`));
    return d;
  }

  /* ----------------------------------
     Animation loop
  ---------------------------------- */

  useEffect(() => {
    pointsRef.current = generateBasePoints();

    const animate = () => {
      const pts = pointsRef.current;
      applyHover(pts);
      updatePoints(pts);

      if (pathRef.current) {
        pathRef.current.setAttribute("d", buildPath(pts));
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  /* ----------------------------------
     Mouse + scroll reveal
  ---------------------------------- */

  useEffect(() => {
    const svg = svgRef.current;
    const path = pathRef.current;

    const onMouseMove = (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const local = pt.matrixTransform(svg.getScreenCTM().inverse());
      mouseRef.current = { x: local.x, y: local.y };
    };

    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;

    const onScroll = () => {
      const progress =
        window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight);
      path.style.strokeDashoffset = length * (1 - progress);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("scroll", onScroll);
    onScroll();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  /* ---------------------------------- */

  return (
<svg
  ref={svgRef}
  className="fixed top-0 left-0 w-full pointer-events-none"
  style={{ height: document.documentElement.scrollHeight }}
>
      <path
        ref={pathRef}
        fill="none"
        stroke="red"
        strokeWidth="0.4"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function WhyChooseUs() {
  const imageRef = useRef();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth <= 800);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return (
    <>

      <div className="relative ">

<LivingLine />
             {/* <FluidSimulation /> */}

          {/* <div className="relative w-full h-screen" style={{ zIndex: 1 }}>
            <Canvas
              className="absolute inset-0"
              camera={{ position: [0, 6, 12], fov: 45 }}
              style={{ pointerEvents: "none" }}
            >
              <color attach="background" args={["#ffffff"]} />
              <ambientLight intensity={0.86} color={0xffffff} />
              <directionalLight
                position={[0, -10, -10]}
                intensity={1}
                color={0xffffff}
              />
              <RibbonAroundSphere />
            </Canvas>
          </div> */}

            <div>
              <ScrollPanels />
            </div>


     
           <StackCards />
         
          <CardStack />
          <WorkGrid />
          {/* <MoreThanSmiles /> */}
          <CircleReveal />
          {/* <About /> */}
         
          <Marquee />

      </div>
    </>
  );
}

function CircleReveal() {
useLayoutEffect(() => {
  const ctx = gsap.context(() => {
    const section = document.querySelector(".circle-section");
    const circle = document.querySelector(".circle.yellow");
    const panels = gsap.utils.toArray(".panel");
    const panelTrack = document.querySelector(".panel-track");
    const numPanels = panels.length;

    if (!circle || !panelTrack) return;


    const scrollTween = gsap.to(panelTrack, {
      xPercent: -100 * (numPanels - 1),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=6000",
        scrub: 1,
        pin: true,
      },
    });

    // circle color transitions
    const circleWidth = circle.offsetWidth;
    const colors = [".circle.red", ".circle.blue", ".circle.purple", ".circle.green", ".circle.pink"];

    colors.forEach((selector, i) => {
      const colorCircle = document.querySelector(selector);
      const triggerPanel = panels[i];
      if (!colorCircle || !triggerPanel) return;

      ScrollTrigger.create({
        trigger: triggerPanel,
        containerAnimation: scrollTween,
        scrub: true,
        start: () => `left center+=${circleWidth / 2}`,
        end: () => `left center-=${circleWidth / 2}`,
        onUpdate: (self) => {
          const pct = 100 - self.progress * 100;
          gsap.set(colorCircle, { clipPath: `inset(0% 0% 0% ${pct}%)` });
        },
      });
    });


    panels.forEach((panel) => {
      const el = panel.querySelector("h2");
      if (!el) return;

      const split = new SplitText(el, { type: "chars, words", charsClass: "chars" });

      gsap.from(split.chars, {
        scrollTrigger: {
          trigger: el,
          containerAnimation: scrollTween, 
          start: "left 80%",
          end: "left 20%",
          toggleActions: "play none none none",
          markers: false,
        },
        y: 15,
        opacity: 0,
        stagger: 0.06,
        duration: 1.2,
        ease: "power3.out",
      });
    });
  });

  return () => ctx.revert();
}, []);
    const panelsRef = useRef(null);
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
};

const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const colorLerp = (color1, color2, amount) => {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  const r = Math.round(r1 + (r2 - r1) * amount);
  const g = Math.round(g1 + (g2 - g1) * amount);
  const b = Math.round(b1 + (b2 - b1) * amount);
  return rgbToHex(r, g, b);
};

  return (
    <section className="circle-section">
      <div className="pinned-content">
     

        <div className="left-text">
          Your glow-up deserves better than basic. 
        </div>

        <div className="circle-wrapper">
          <div className="circle yellow" > 

            
          </div>
          <div className="circle red" > 
            <VennDiagram1 /> 
            </div>
          <div className="circle blue" >
             <RightFloatingCircle /> 
               
             </div>
<div className="circle purple">
            <svg
              viewBox="0 0 400 400"
              className="ring-svg"
              xmlns="http://www.w3.org/2000/svg"
            >
              {Array.from({ length: 40 }).map((_, i) => {
                const r = 200 - i * 4;
                const t = i / 39;
                const colors = ["#B8E3E9", "#E6E6FA", "#FFDAB9"]; // blue, lavender, peach
                const segment = Math.floor(t * 3);
                const localT = (t * 3) % 1;
                const startColor = colors[segment % 3];
                const endColor = colors[(segment + 1) % 3];
                const stroke = colorLerp(startColor, endColor, localT);

                return (
                  <circle
                    key={i}
                    cx="200"
                    cy="200"
                    r={r}
                    stroke={stroke}
                    strokeWidth="1.3"
                    fill="none"
                    opacity={1 - t * 0.1}
                    style={{ filter: `drop-shadow(0 0 ${1 + t * 2}px rgba(255, 182, 193, 0.2))` }} // subtle pinkish glow for inner spiral vibe
                  />
                );
              })}
            </svg>
          </div>
          <div className="circle green" />
          <div className="circle pink" />
        </div>

 <div className="panel-track" ref={panelsRef}>
      <div className="panel">
        <h2>Our office never takes shortcuts when it comes to patient care. </h2>
       
      </div>
      <div className="panel">
        <h2>We can't guarantee whether you'll get that transparency elsewhere.</h2>
     
      </div>
      <div className="panel">
        <h2>Total Flexibility</h2>

      </div>
      <div className="panel">
        <h2>Transparency</h2>
   
      </div>
      <div className="panel">
        <h2>Support</h2>

      </div>
    </div>
      </div>

      <style jsx>{`
        .circle-section {
          position: relative;
          height: 300vh;
   background: #FEF9F8;
          overflow: hidden;
        }
.ring-svg {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 100%;
  height: 100%;
  // filter: drop-shadow(0 0 10px rgba(170, 130, 255, 0.3))
  //         drop-shadow(0 0 20px rgba(60, 214, 210, 0.2));

}

        .pinned-content {
          position: relative;
          height: 100vh;
          width: 100%;
          overflow: hidden;
          z-index: 0;
        }

     


        .left-text {
          position: absolute;
          left: 5%;
          top: 50%;
          transform: translateY(-50%);
          z-index: 5;
          width: 20vw;
          font-family: "NeueHaasGroteskDisplayPro45Light";
          font-size: 16px;
          line-height: 1.2;
          letter-spacing: .1rem
        }

    

        .circle-wrapper {
          position: sticky;
          top: 0;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .circle {
          position: absolute;
          width: 560px;
          height: 560px;
          border-radius: 50%;
          clip-path: inset(0% 0% 0% 100%);
        }

        .circle.yellow {
          background: #ff4d4d;
          z-index: 1;
          clip-path: inset(0% 0% 0% 0%);
        }

        .circle.red {
          background: #ff4d4d;
          z-index: 2;
        }

        .circle.blue {
          background: #4d7dff;
          z-index: 3;
        }

        .circle.purple {
          width: 400px;
  height: 400px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
          background: #FEF9F8;
  z-index: 4;
        }

        .circle.green {
          background: #91ff91;
          z-index: 5;
        }

        .circle.pink {
          background: #ff7fbf;
          z-index: 6;
        }
.panel-track,
.panel {
  pointer-events: none;
}
        .panel-track {
          position: absolute;
          top: 0;
          right: 0;
          height: 100vh;
          display: flex;
          flex-direction: row;
          z-index: 5;
          transform: translateX(100%);
          will-change: transform;
        }

        .panel {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          height: 100vh;
          width: 40vw;
          padding: 3rem;
          border-left: 1px solid rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
      // background: rgba(255, 255, 255, 0.3); 
          justify-content: flex-start;
          padding-top: calc(33vh);
        }

.panel h2 {
  font-size: 1rem;
  font-family: "NeueHaasGroteskDisplayPro45Light";
  margin-top: 0.5rem;
  color: #111;
  padding: 0.8rem .2rem;
  // border-radius: 12px;
  // background: rgba(255, 255, 255, 0.35);
  // backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  // box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.panel h2:hover {
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}


      `}</style>
    </section>
  );
}
function WorkGrid() {
  const workRef = useRef(null);

  const sectionRef = useRef(null);
  const headingRefs = useRef([]);

  useGSAP(
    () => {
      gsap.set(headingRefs.current, { opacity: 0 });
    },
    { scope: sectionRef }
  );

  useGSAP(
    () => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              headingRefs.current.forEach((el) => {
                if (!el) return;

                gsap.set(el, { opacity: 0 });

                const childSplit = new SplitText(el, {
                  type: "lines",
                  linesClass: "split-child",
                });

                new SplitText(el, {
                  type: "lines",
                  linesClass: "split-parent",
                });

                gsap.set(childSplit.lines, {
                  yPercent: 100,
                  opacity: 1,
                });

                gsap.to(childSplit.lines, {
                  yPercent: 0,
                  duration: 1.5,
                  ease: "power4.out",
                  stagger: 0.1,
                  onStart: () => {
                    gsap.set(el, { opacity: 1 });
                  },
                });
              });
              observer.disconnect();
            }
          });
        },
        { threshold: 0.2 }
      );

      if (sectionRef.current) observer.observe(sectionRef.current);
      return () => observer.disconnect();
    },
    { scope: sectionRef }
  );
  const projects = [
     {
      id: 1,
      name: "Setting the benchmark for modern orthodontic treatment",
      img: "/images/ajomockupchair.png",
      route: "#",
    },
  
    {
      id: 2,
      name: "We don't do goopy impressions and neither should you",
      img: "/images/iteroposter.png",
      route: "#",
    },
     {
      id: 3,
      name: "3D printing for appliance fabrication",
      img: "/images/3dprinting.png",
      route: "#",
    },
    {
      id: 4,
      name: "Our office supports real-time texting for fast, personal support",
      img: "/images/officetexting.png",
      route: "#",
    },
  ];


  const gridProjects = [...projects,];

  useEffect(() => {


    const rows = workRef.current.querySelectorAll(".row");

    rows.forEach((row) => {
      const items = row.querySelectorAll(".work-item");

      // initial rotation + offset
      items.forEach((item, index) => {
        const isLeft = index === 0;
        gsap.set(item, {
          y: 1000,
          rotation: isLeft ? -60 : 60,
          transformOrigin: "center center",
        });
      });

      ScrollTrigger.create({
        trigger: row,
        start: "top 70%",
        onEnter: () => {
          gsap.to(items, {
            y: 0,
            rotation: 0,
            duration: 1.2,
            ease: "power4.out",
            stagger: 0.25,
          });
        },
      });
    });

    return () => {

      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <>
      <header className="-mt-[40vh] w-full h-[400px] flex items-center justify-center text-center p-6">
               <ImageGrid />
      </header>

    <div ref={sectionRef}  className="px-6 py-4 md:px-12">

                 <div   className="font-neuehaas45 flex flex-wrap items-center gap-x-4 gap-y-2 text-[clamp(1rem,2vw,1.75rem)] font-neue">
            <span>All.</span>
            <span>
              — Invisalign. <sup className="text-xs align-super">(10k)</sup>
            </span>
            <span>— Accelerated Treatment. </span>
            <span>— Low-Dose Digital 3D Radiographs. </span>
            <span>
              — Damon Braces. <sup className="text-xs align-super">(15k)</sup>
            </span>
            <span>— iTero Lumina.</span>
            <span>— 3D Printing.</span>
            <span>— Laser Therapy.</span>
            <span>
              — Live Text Support.{" "}
              <sup className="text-xs align-super">(8)</sup>
            </span>
          </div>
          
      <VideoAnimation />
               <div className="mb-16">
              <p className="font-neuehaas45 text-xs tracking-widest text-gray-600 uppercase mb-4">
                Pioneering Digital Orthodontics
              </p>
              <h2 className="max-w-3xl font-neuehaas45 text-[26px] leading-tight">
                Our office was the first in the region to go fully digital—
                leveraging iTero 3D scanning and in-house printing to lead a new
                era of appliance design and fabrication.
              </h2>
            </div>

    </div>

         
       <div className="min-h-screen bg-[#F9F9F9] text-[#0f0f0f] font-[Manrope] overflow-x-hidden">
      <section
        ref={workRef}
        className="relative w-full h-full p-6 flex flex-col gap-12 md:gap-16 overflow-hidden"
      >
        {Array.from({ length: Math.ceil(gridProjects.length / 2) }).map((_, i) => {
          const left = gridProjects[i * 2 % gridProjects.length];
          const right = gridProjects[(i * 2 + 1) % gridProjects.length];
          return (
        <div
    key={i}
    className="row flex gap-6 md:gap-8 flex-col md:flex-row w-full"
  >
    {[left, right].map((proj, idx) => (
      <div
        key={proj.id + idx}
        className="work-item flex-1 flex flex-col gap-3"
      >
        <a
          href={proj.route}
          className="work-item-link flex flex-col gap-3 text-[#0f0f0f] no-underline hover:opacity-90 transition"
        >
          <div className="work-item-img aspect-[4/3] overflow-hidden">
            <img
              src={proj.img}
              alt={proj.name}
              className="w-full h-full object-cover scale-90"
            />
          </div>
          <div className="work-item-copy pl-[5%]">
            <h3 className="text-[14px] font-neuehaas35 tracking-wide ">
              {proj.name}
            </h3>
          </div>
        </a>
      </div>
    ))}
  </div>
          );
        })}
      </section>
    </div>
    </>
   
  );
}

const INPUTS = {
  color: 0xffffff,
  count: 10000,
  mainFreq: 24,
  maxSize: 180,
  minSize: 130,
  speed: 2e-4,
  subFreq: 300,
  subLen: 0.2,
};

const SIZE = 600;

function map(v, s1, e1, s2, e2) {
  return s2 + ((v - s1) / (e1 - s1)) * (e2 - s2);
}

class EffectFilter extends PIXI.Filter {
  constructor() {
    super(
      null,
      `
precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;

void main(void) {
  vec4 tex = texture2D(uSampler, vTextureCoord);


  vec3 lavender = vec3(0.8, 0.6, 1.0); // light purple
  vec3 tinted = tex.rgb * lavender;

  gl_FragColor = vec4(tinted, tex.a);
}
      `,
      {
        abberation: 0.015,
        screenSize: [SIZE, SIZE],
      }
    );
  }

  get abberation() {
    return this.uniforms.abberation;
  }

  set abberation(value) {
    this.uniforms.abberation = value;
  }

  get screenSize() {
    return this.uniforms.screenSize;
  }

  set screenSize(value) {
    this.uniforms.screenSize = value;
  }
}



function ScrollPanels() {
  useEffect(() => {
    gsap.to(".textslide", {
      y: "0%",
      duration: 1,
      stagger: 0.2,
      ease: "none",
    });
  }, []);
  const sectionRef = useRef(null);
  const imgRef = useRef(null);
  const heroRef = useRef(null);
  const standardRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imgRef.current,
        { 
          scale: 0.35, 
          y: "-100vh" 
        },
        {
          scale: .85,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            endTrigger: standardRef.current,
            end: "top center",
            scrub: 1, 
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);



  return (
    <div ref={sectionRef} className="bg-[#F9F9F9]">

      <div className="relative">
        <section ref={heroRef} className="w-full h-screen text-black flex flex-col justify-between font-neuehaas35 relative ">
          <div className="flex justify-between px-8 md:px-16 pt-8 h-full relative">
            <div className="flex flex-col justify-between w-1/2 relative">
              <div className="absolute top-[65%] left-0 -translate-y-1/2 text-left">
                <h1 className="text-xs tracking-widest text-gray-600 uppercase font-neuehaas45">
                  Backed By over 60 Years Of <br /> Combined Orthodontic Experience
                </h1>
              </div>
            </div>

            <div className="flex flex-col w-1/2 relative">
              <div className="max-w-[500px] absolute top-[50%] right-0 -translate-y-1/2 text-left">
                 <h1 className="text-[15px] tracking-wider text-gray-600 font-canelathinstraight">
Our doctors rank in the top 1% nationally and have completed thousands of Invisalign cases. As Diamond Plus providers, we focus on precision — in planning, execution, and results that last.

                </h1>
              </div>
            </div>
          </div>

          <footer className="absolute bottom-[8%] left-0 w-full px-4 md:px-16 flex items-center justify-between text-xs tracking-widest text-gray-600 uppercase">
            <span>Welcome</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex w-4 h-4">

</span>
              <span>Scroll to Explore</span>
            </div>
            <span className="w-[4px] h-auto">
     
              </span>
          </footer>
        </section>
        



        <section className="w-full flex flex-col items-center">
          <div className="w-full px-[6vw]">
            {/* <div className="border-t border-black/10 w-full" /> */}
          </div>
          <div ref={standardRef} className="w-full px-[6vw] py-[10vh]">
<div className="flex flex-col lg:flex-row items-center justify-between px-8 md:px-16 pt-8 relative">
              <div className="w-full lg:w-[40vw] flex justify-center">
        
                <img
                  ref={imgRef}
                  src="/images/excellence.png"
                  alt="poster"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="flex flex-col text-left">
                <h1 className="text-[8vw] lg:text-[3.5vw] leading-[1] font-neuehaas45">
                  Redefining
                  <span className="block">Excellence</span>
                </h1>
                <p className="text-[16px] mt-4 font-neuehaas45 text-xs tracking-widest text-gray-600 uppercase">
                  Since 1977
                </p>
              </div>
            </div>
          </div>
          <div className="w-full px-[6vw]">
            {/* <div className="border-t border-black/10 w-full" /> */}
          </div>

          <div className="w-full px-[6vw] py-[10vh]">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex flex-col text-left">
              <h1 className="text-[8vw] lg:text-[3.5vw] leading-[1] font-neuehaas45">
  Smart
  <span className="block">Orthodontics</span>
</h1>
                <p className="text-[16px] mt-4 text-xs tracking-widest text-gray-600 uppercase font-neuehaas45">
                  Built around your life
                </p>
              </div>
              <div className="w-full lg:w-[40vw]">
                <img
                  src="/images/signonmetalrack.png"
                  alt="sign"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>

          <div className="w-full px-[6vw]">
            {/* <div className="border-t border-black/10 w-full" /> */}
          </div>

          <div className="w-full px-[6vw] py-[10vh]">
            <div className="flex flex-col lg:flex-row-reverse items-center justify-between gap-12">
              <div className="flex flex-col text-left">
                <h1 className="text-[8vw] lg:text-[3.5vw] leading-[1] font-neuehaas45">
                  3D 
                  <span className="block">Imaging</span>
                </h1>
                <p className="max-w-[400px] mt-4 text-xs tracking-widest text-gray-600 uppercase font-neuehaas45">
                  3D technology is reshaping modern orthodontics. Expect
                  different information from our competitors
                </p>
              </div>
              <div className="w-full lg:w-[50vw]">
                <img
                  src="/images/table_mockup.jpg"
                  alt="table"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>

          <div className="w-full px-[6vw]">
            {/* <div className="border-t border-black/10 w-full" /> */}
          </div>
        </section>
        {/* <div className="image-grid px-16 grid grid-cols-1 md:grid-cols-2 ">
  {images.map((img, i) => (
    <div
      key={i}
      className="relative w-full overflow-hidden"
      style={{
        height: i % 2 === 0 ? '550px' : '500px', 
        marginTop: i % 4 === 0 || i % 4 === 3 ? '0px' : '60px',
      }}
    >
      <img
        src={img.src}
        alt={img.alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  ))}
</div> */}
      </div>
    </div>
  );
}

const ImageGrid = () => {
  const headerRef = useRef(null);

  useEffect(() => {
    if (headerRef.current) {
      const tl = gsap.timeline();
      gsap.set(bodyRef.current, { autoAlpha: 1 });
      const scroll = new LocomotiveScroll({
        el: bodyRef.current,
        smooth: true,
      });

      setTimeout(() => {
        scroll.update();
      }, 1000);
    }
  }, []);

  const createItems = () => {
    const elements = document.querySelectorAll(".gtext");

    return [...elements].map((el) => new Item(el, 6));
  };

  const textExpertiseRef = useRef(null);

  useEffect(() => {
    if (!textExpertiseRef.current) return;

    let items = createItems();

    items.forEach((item, index) => {
      gsap
        .timeline({
          defaults: { ease: "power1" },
          scrollTrigger: {
            trigger: item.DOM.el,
            start: "top 90%",
            end: "top 20%",
            scrub: true,
          },
        })
        .fromTo(
          item.DOM.inner,
          { xPercent: (pos) => (pos % 2 === 0 ? 30 : -30), opacity: 0.6 },
          { xPercent: 0, opacity: 1 },
          index * 0.1
        )
        .fromTo(
          item.DOM.innerWrap,
          { xPercent: (pos) => 2 * (pos + 1) * 10 },
          { xPercent: 0 },
          index * 0.1
        );
    });
  }, []);

  return (
    <div className="bg-[#F9F9F9] px-10 py-10">
      <div className="content content--full">
        <h1
          ref={textExpertiseRef}
          className="gtext size-xl font-neuehaas45 spaced"
          data-text="Expertise"
          data-effect="2"
        >
          Expertise
        </h1>
      </div>
    </div>
  );
};
function VideoAnimation() {
  const videoRef   = useRef(null);
  const wrapperRef = useRef(null);
  const inset      = useRef({ x: 0, y: 0, r: 50 });

  useEffect(() => {
    if (!wrapperRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const snap  = gsap.utils.snap(2);

    let w = video.offsetWidth;
    let h = video.offsetHeight;

    const handleResize = () => {
      w = video.offsetWidth;
      h = video.offsetHeight;
      ScrollTrigger.refresh();   
    };
    window.addEventListener("resize", handleResize);


    const extra = wrapperRef.current.offsetHeight * 0.2; 

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapperRef.current,
        start: "top top",
        end: "bottom top",   
        scrub: 0.6,
        pin: true,
        pinSpacing: true,
        anticipatePin: 0,   
        ease: "none",
        invalidateOnRefresh: true,
        // markers: true,
      }
    });

    tl.fromTo(
      inset.current,
      { x: 0, y: 0, r: 50 },
      {
        x: 25,
        y: 18,
        r: 80,
        onUpdate() {
          video.style.clipPath = `inset(${
            Math.round((inset.current.x * w) / 200)
          }px ${
            Math.round((inset.current.y * h) / 200)
          }px round ${snap(inset.current.r)}px)`;
        },
      }
    );

    return () => {
      window.removeEventListener("resize", handleResize);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="bg-[#F9F9F9]"
      style={{ margin: "5vh 0", height: "100vh" }}
    >
      <video
        ref={videoRef}
        src="/videos/cbctscan.mp4"
        autoPlay
        loop
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}
const globalClock = new THREE.Clock(true);
function GooeyMesh({ imageRef }) {
  const vertexShader = `varying vec2 v_uv;

void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

  const fragmentShader = `
uniform vec2 u_mouse;
uniform vec2 u_res;
uniform sampler2D u_image;
uniform sampler2D u_imagehover;
uniform float u_time;
varying vec2 v_uv;

float circle(in vec2 _st, in float _radius, in float blurriness){
    vec2 dist = _st;
    return 1.-smoothstep(_radius-(_radius*blurriness), _radius+(_radius*blurriness), dot(dist,dist)*4.0);
}

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise3(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0);
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);


  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 =   v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
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


  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;


  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  float aspect = u_res.x / u_res.y;
  vec2 st = v_uv - vec2(0.5);
  st.x *= aspect;

  // get mouse position in same coordinate space
  vec2 mouse = u_mouse * vec2(aspect, 1.0);
  
  //circle's position relative to mouse
  vec2 circlePos = st - mouse;
  
  float c = circle(circlePos, 0.3, 2.0) * 2.5;
  float offx = v_uv.x + sin(v_uv.y + u_time * 0.1);
  float offy = v_uv.y - u_time * 0.1 - cos(u_time * 0.001) * 0.01;
  float n = snoise3(vec3(offx, offy, u_time * 0.1) * 8.0) - 1.0;
  float finalMask = smoothstep(0.4, 0.5, n + pow(c, 2.0));
  vec4 image = texture2D(u_image, v_uv);
  vec4 hover = texture2D(u_imagehover, v_uv);
  vec4 finalImage = mix(image, hover, finalMask);
  gl_FragColor = finalImage;
}`;
  const meshRef = useRef();
  const mouse = useRef(new THREE.Vector2());
  const { size, viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      u_image: { value: null },
      u_imagehover: { value: null },
      u_mouse: { value: mouse.current },
      u_time: { value: 0 },
      u_res: { value: new THREE.Vector2(size.width, size.height) },
    }),
    [size]
  );

  useEffect(() => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const loader = new THREE.TextureLoader();
    loader.load(img.src, (tex) => {
      uniforms.u_image.value = tex;
    });
    loader.load(img.dataset.hover, (tex) => {
      uniforms.u_imagehover.value = tex;
    });

    img.style.opacity = 0;
  }, [imageRef, uniforms]);

  useEffect(() => {
    const onMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;

      gsap.to(mouse.current, {
        x,
        y,
        duration: 0.5,
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  useEffect(() => {
    if (!imageRef.current || !meshRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const offset = new THREE.Vector2(
      rect.left - window.innerWidth / 2 + rect.width / 2,
      -rect.top + window.innerHeight / 2 - rect.height / 2
    );

    meshRef.current.position.set(offset.x, offset.y, 0);
    meshRef.current.scale.set(rect.width, rect.height, 1);
  }, [imageRef]);

  useFrame(() => {
    uniforms.u_time.value += 0.01;

    if (!imageRef.current || !meshRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();

    const x = rect.left - window.innerWidth / 2 + rect.width / 2;
    const y = -rect.top + window.innerHeight / 2 - rect.height / 2;

    meshRef.current.position.set(x, y, 0);
    meshRef.current.scale.set(rect.width, rect.height, 1);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        defines={{ PR: window.devicePixelRatio.toFixed(1) }}
        transparent
      />
    </mesh>
  );
}

function HoverScene({ imageRef }) {
  return (
    <Canvas
      frameloop="always"
      gl={{ alpha: true }}
      camera={{ fov: 75, near: 1, far: 1000, position: [0, 0, 800] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <ambientLight intensity={2} />
      <GooeyMesh imageRef={imageRef} />
    </Canvas>
  );
}

const accents = ["#f4b9b2", "#cfc1ff", "#f0d8c9"];

const shuffle = (accent = 0) => [
  { color: "#f4b9b2", roughness: 0.2 },
  { color: "#f0d8c9", roughness: 0.3 },
  { color: "#cfc1ff", roughness: 0.15 },
  { color: "#f4b9b2", roughness: 0.75 },
  { color: "#cfc1ff", roughness: 0.5 },
  { color: "#f0d8c9", roughness: 0.75 },
  { color: accents[accent], roughness: 0.2, accent: true },
  { color: accents[accent], roughness: 0.5, accent: true },
  { color: accents[accent], roughness: 0.1, accent: true },
];

function Scene(props) {
  const [accent, click] = useReducer((state) => ++state % accents.length, 0);
  const connectors = useMemo(() => shuffle(accent), [accent]);
  return (
    <Canvas
      onClick={click}
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: false }}
      camera={{ position: [0, 0, 15], fov: 17.5, near: 1, far: 20 }}
      {...props}
    >
      <color attach="background" args={["#000"]} />
      <ambientLight intensity={0.4} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        intensity={1}
        castShadow
      />
      <Physics gravity={[0, 0, 0]}>
        <Pointer />
        {connectors.map((props, i) => (
          <Connector key={i} {...props} />
        ))}
        <Connector position={[10, 10, 5]}>
          <Model>
            <MeshTransmissionMaterial
              clearcoat={1}
              thickness={0.1}
              anisotropicBlur={0.1}
              chromaticAberration={0.1}
              samples={8}
              resolution={512}
            />
          </Model>
        </Connector>
      </Physics>
      <EffectComposer disableNormalPass multisampling={8}>
        <N8AO distanceFalloff={1} aoRadius={1} intensity={4} />
      </EffectComposer>
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer
            form="circle"
            intensity={4}
            rotation-x={Math.PI / 2}
            position={[0, 5, -9]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, 1, -1]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, -1, -1]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={-Math.PI / 2}
            position={[10, 1, 0]}
            scale={8}
          />
        </group>
      </Environment>
    </Canvas>
  );
}

function Connector({
  position,
  children,
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  accent,
  ...props
}) {
  const api = useRef();
  const pos = useMemo(() => position || [r(10), r(10), r(10)], []);
  useFrame((state, delta) => {
    delta = Math.min(0.1, delta);
    api.current?.applyImpulse(
      vec.copy(api.current.translation()).negate().multiplyScalar(0.2)
    );
  });
  return (
    <RigidBody
      linearDamping={4}
      angularDamping={1}
      friction={0.1}
      position={pos}
      ref={api}
      colliders={false}
    >
      <BallCollider args={[0.38, 1.27, 0.38]} />
      <BallCollider args={[1.27, 0.38, 0.38]} />
      <BallCollider args={[0.38, 0.38, 1.27]} />
      {children ? children : <Model {...props} />}
      {accent && (
        <pointLight intensity={4} distance={2.5} color={props.color} />
      )}
    </RigidBody>
  );
}

function Pointer({ vec = new THREE.Vector3() }) {
  const ref = useRef();
  useFrame(({ mouse, viewport }) => {
    ref.current?.setNextKinematicTranslation(
      vec.set(
        (mouse.x * viewport.width) / 2,
        (mouse.y * viewport.height) / 2,
        0
      )
    );
  });
  return (
    <RigidBody
      position={[0, 0, 0]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[1]} />
    </RigidBody>
  );
}

function Model({ children, color = "white", roughness = 0, ...props }) {
  const ref = useRef();

  const { nodes, materials } = useGLTF("/models/lego_head.glb");
  console.log(Object.keys(nodes));

  useFrame((state, delta) => {
    easing.dampC(ref.current.material.color, color, 0.2, delta);
  });
  return (
    <mesh
      ref={ref}
      castShadow
      receiveShadow
      scale={1}
      geometry={nodes.defaultMaterial.geometry}
    >
      <meshStandardMaterial
        metalness={0.2}
        roughness={roughness}
        map={materials.base?.map}
      />
      {children}
    </mesh>
  );
}

const ImageShaderMaterial = shaderMaterial(
  {
    uTexture: null,
    uDataTexture: null,
    resolution: new THREE.Vector4(),
  },
  // vertex shader
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // fragment shader
  `
  uniform sampler2D uTexture;
  uniform sampler2D uDataTexture;
  uniform vec4 resolution;
  varying vec2 vUv;

  void main() {

    float gridSize = 20.0;
    vec2 snappedUV = floor(vUv * gridSize) / gridSize;
    
    // get distortion values
    vec2 offset = texture2D(uDataTexture, snappedUV).rg;
    
    // apply distortion strenthg here
    vec2 distortedUV = vUv - 0.1 * offset; 
    

    vec4 color = texture2D(uTexture, distortedUV);
    
    gl_FragColor = color;
  }
  `
);

extend({ ImageShaderMaterial });

const PixelImage = ({ imgSrc, containerRef }) => {
  const materialRef = useRef();
  const { size, viewport } = useThree();
  const [textureReady, setTextureReady] = useState(false);
  const textureRef = useRef();
  const dataTextureRef = useRef();

  const mouseRef = useRef({
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vX: 0,
    vY: 0,
  });

  const grid = 20;
  const settings = {
    mouseRadius: 0.2,
    strength: 0.9,
    relaxation: 0.9,
  };

  useEffect(() => {
    new THREE.TextureLoader().load(imgSrc, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      textureRef.current = tex;
      setTextureReady(true);
    });

    const data = new Float32Array(4 * grid * grid);
    for (let i = 0; i < grid * grid; i++) {
      const stride = i * 4;
      data[stride] = 0; // R (X distortion)
      data[stride + 1] = 0; // G (Y distortion)
      data[stride + 2] = 0; // B (not unused)
      data[stride + 3] = 1; // A
    }

    const dataTex = new THREE.DataTexture(
      data,
      grid,
      grid,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    dataTex.needsUpdate = true;
    dataTextureRef.current = dataTex;
  }, [imgSrc]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef?.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouse = mouseRef.current;

      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = 1 - (e.clientY - rect.top) / rect.height;

      mouse.vX = (mouse.x - mouse.prevX) * 10;
      mouse.vY = (mouse.y - mouse.prevY) * 10;

      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [containerRef]);

  useFrame(() => {
    const texture = dataTextureRef.current;
    if (!texture) return;

    const data = texture.image.data;
    const mouse = mouseRef.current;
    const maxDist = grid * settings.mouseRadius;

    for (let i = 0; i < data.length; i += 4) {
      data[i] *= settings.relaxation; // R
      data[i + 1] *= settings.relaxation; // G
    }

    const gridMouseX = mouse.x * grid;
    const gridMouseY = mouse.y * grid;

    for (let i = 0; i < grid; i++) {
      for (let j = 0; j < grid; j++) {
        const dx = gridMouseX - i;
        const dy = gridMouseY - j;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDist) {
          const index = 4 * (i + j * grid);
          const power = (1 - distance / maxDist) * settings.strength;

          data[index] += mouse.vX * power; // R channel (X distortion)
          data[index + 1] += mouse.vY * power; // G channel (Y distortion)
        }
      }
    }

    texture.needsUpdate = true;
  });

  if (!textureReady) return null;

  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <imageShaderMaterial
        ref={materialRef}
        uTexture={textureRef.current}
        uDataTexture={dataTextureRef.current}
      />
    </mesh>
  );
};

function RibbonAroundSphere() {
  const ribbonRef = useRef();
  const segments = 1000;

  const frontTexture = useLoader(THREE.TextureLoader, "/images/front.png");
  const backTexture = useLoader(THREE.TextureLoader, "/images/back.png");

  useEffect(() => {
    [frontTexture, backTexture].forEach((t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(1, 1);
      t.offset.setX(0.5);
      t.flipY = false;
    });
    backTexture.repeat.set(-1, 1);
  }, [frontTexture, backTexture]);

  useFrame(() => {
    if (frontTexture) frontTexture.offset.x += 0.001;
    if (backTexture) backTexture.offset.x -= 0.001;
  });

  const frontMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: frontTexture,
        side: THREE.BackSide,
        transparent: true,
        roughness: 0.65,
        metalness: 0.25,
        alphaTest: 0.1,
        flatShading: true,
      }),
    [frontTexture]
  );

  const backMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: backTexture,
        side: THREE.FrontSide,
        transparent: true,
        roughness: 0.65,
        metalness: 0.25,
        alphaTest: 0.1,
        flatShading: true,
      }),
    [backTexture]
  );

  const geometry = useMemo(() => {
    const numPoints = 7;
    const radius = 5;

    // const curvePoints = Array.from({ length: numPoints }, (_, i) => {
    //   const theta = (i / numPoints) * Math.PI * 2;
    //   return new THREE.Vector3().setFromSphericalCoords(
    //     radius,
    //     Math.PI / 2 + 0.9 * (Math.random() - 0.5),
    //     theta
    //   );
    // });

    // console.log("Froze:", curvePoints.map((v) => v.toArray()));

    const curvePoints = [
      new THREE.Vector3(5, 0, 0),
      new THREE.Vector3(3.5, 2, 2.5),
      new THREE.Vector3(0, 3, 0),
      new THREE.Vector3(-3.5, 2, -2.5),
      new THREE.Vector3(-5, 0, 0),
      new THREE.Vector3(-3.5, -2, 2.5),
      new THREE.Vector3(0, -3, 0),
      new THREE.Vector3(3.5, -2, -2.5),
    ];

    const curve = new THREE.CatmullRomCurve3(curvePoints, true);
    curve.tension = 0.7;

    const spacedPoints = curve.getSpacedPoints(segments);
    const frames = curve.computeFrenetFrames(segments, true);

    const dimensions = [-0.7, 0.7];
    const finalVertices = [];

    // build ribbon vertices along binormals
    dimensions.forEach((d) => {
      for (let i = 0; i <= segments; i++) {
        const base = spacedPoints[i];
        const offset = frames.binormals[i].clone().multiplyScalar(d);
        finalVertices.push(base.clone().add(offset));
      }
    });

    finalVertices[0].copy(finalVertices[segments]);
    finalVertices[segments + 1].copy(finalVertices[2 * segments + 1]);

    const geom = new THREE.BufferGeometry().setFromPoints(finalVertices);

    const indices = [];
    for (let i = 0; i < segments; i++) {
      const a = i;
      const b = i + segments + 1;
      const c = i + 1;
      const d = i + segments + 2;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
    geom.setIndex(indices);
    geom.computeVertexNormals();
    const uvs = [];
    for (let i = 0; i <= 1; i++) {
      for (let j = 0; j <= segments; j++) {
        uvs.push(1 - j / segments, i);
      }
    }
    geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

    geom.clearGroups();
    geom.addGroup(0, indices.length, 0); // front material
    geom.addGroup(0, indices.length, 1); // back material

    return geom;
  }, []);

  return (
    <mesh
      ref={ribbonRef}
      geometry={geometry}
      material={[frontMaterial, backMaterial]}
    />
  );
}

const CardStack = () => {
  const list1Ref = useRef(null);

  useEffect(() => {
    const container = list1Ref.current;
    const listChilds = container.querySelectorAll(".list-child");

    listChilds.forEach((el, i) => {
      gsap.set(el, {
        x: 0,
        y: 0,
        rotate: 0,
        zIndex: listChilds.length - i,
      });
    });

    const offsets = [
      { x: 100, y: -200, rotate: 17 },
      { x: -160, y: -280, rotate: -12 },
      { x: 200, y: -400, rotate: -12 },
      { x: -100, y: -500, rotate: 10 },
    ];

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top+=100 center",
        end: "+=800",
        scrub: true,
        pin: true,
      },
    });

    tl.add("animate");
    listChilds.forEach((el, i) => {
      tl.to(el, offsets[i], "animate");
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <>
      <div className="bg-[#F9F9F9]">
        <div className="l-wrapper ">
          <div className="list1" id="list1" ref={list1Ref}>
            <ul className="card-list list">
              <li className="list-child bg-[#c3531d] ">
                <div className="card-inner">
                  <h2 className="card-title">Tech-Savvy Teeth Things</h2>
                  <p className="card-subtitle">Goopless</p>
                  <div className="card-caption-box">
                    3D iTero scanning /<br />
                    low-dose Radiographs /<br />
                    3D printing
                  </div>
                </div>
              </li>
              <li className="list-child text-type1 bg-[#8dca9c]">
                <div className="card-inner">
                  <h2 className="card-title">Outcomes</h2>
                  <p className="card-subtitle">Over 25,000 patients</p>
                  <div className="card-caption-box">
                    Web Design & Dev /<br />
                    Art Direction /<br />
                    Illustration
                  </div>
                </div>
              </li>
              <li className="list-child text-type1 bg-[#E5AB38]">
                <div className="card-inner">
                  <h2 className="card-title">Specialists, not generalists</h2>
                  <p className="card-subtitle">
                    You wouldn’t hire a generalist surgeon
                  </p>
                  <div className="card-caption-box">
                    Board certified /<br />
                    ABO certified /<br />
                    Combined 50+ years experience
                  </div>
                </div>
              </li>
              <li className="list-child text-type1 bg-[#D6B6D1]">
                <div className="card-inner">
                  <h2 className="card-title">4 Locations</h2>
                  <p className="card-subtitle">IRL + URL</p>
              
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

const RepeatText = ({ text = "MTS", totalLayers = 7 }) => {
  const containerRef = useRef();

  useEffect(() => {
    const containers = gsap.utils.toArray(".stack-word-layer");

    containers.forEach((el, i) => {
      const inner = el.querySelector(".stack-word-inner");

      gsap.fromTo(
        inner,
        { yPercent: 0 },
        {
          yPercent: 140,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: `top center`,
            end: "bottom top+=30%",
            scrub: true,
          },
        }
      );
    });
  }, []);

  return (
    <section
      className="relative w-full bg-[#FAFAFA] overflow-hidden"
      data-animation="stack-words"
      ref={containerRef}
    >
      {new Array(totalLayers).fill(0).map((_, i) => {
        const isLast = i === totalLayers - 1;

        return (
          <div
            key={i}
            className="overflow-hidden stack-word-layer"
            style={{
              height: isLast ? "20vw" : `${5 + i * 1.25}vw`,
              marginTop: i === 0 ? 0 : "-.5vw",
            }}
          >
            <div
              className="flex justify-center overflow-visible stack-word-inner will-change-transform"
              style={{ height: "100%" }}
            >
              <span
                className="text-[48vw] font-bold text-black leading-none block"
                style={{
                  transform: `translateY(calc(-60% + ${i * 3}px))`,
                }}
              >
                {text}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
};

function StackCards() {


  useEffect(() => {
    let activeCard = null;
    let mouseX = 0;
    let mouseY = 0;

    const updateHoverState = () => {
      const blocks = document.querySelectorAll(".card-block");
      let hoveredCard = null;

      blocks.forEach((block) => {
        const rect = block.getBoundingClientRect();
        const isHovering =
          mouseX >= rect.left &&
          mouseX <= rect.right &&
          mouseY >= rect.top &&
          mouseY <= rect.bottom;

        if (isHovering) hoveredCard = block;
      });

      if (hoveredCard !== activeCard) {
        if (activeCard) {
          gsap.to(activeCard, {
            "--br": "0px",
            duration: 0.2,
            ease: "power2.out",
            overwrite: true,
          });
        }

        if (hoveredCard) {
          gsap.to(hoveredCard, {
            "--br": "100px",
            duration: 0.4,
            ease: "power2.out",
            overwrite: true,
          });
        }

        activeCard = hoveredCard;
      }
    };

    const handlePointerMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      updateHoverState();
    };

    const handleScroll = () => {
      updateHoverState();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const svgRef = useRef(null);
  const hitAreaRef = useRef(null);
  const [mPos, setMPos] = useState({ x: 50, y: 50 });
  const dotsRef = useRef([]);

  useEffect(() => {
    const stage = svgRef.current;
    const dots = [];

    for (let x = 1; x <= 5; x++) {
      for (let y = 1; y <= 5; y++) {
        const eye = makeEye(x * 10, y * 10, stage);
        dots.push(eye);
      }
    }

    dotsRef.current = dots;

    return () => {
      gsap.globalTimeline.getChildren().forEach((t) => t.kill());
    };
  }, []);

  useEffect(() => {
    dotsRef.current.forEach((t) => redraw(t));
  }, [mPos]);

  const makeEye = (x, y, stage) => {
    const ns = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(ns, "g");
    const c1 = document.createElementNS(ns, "circle");
    const c2 = document.createElementNS(ns, "circle");

    gsap.set([c1, c2], {
      x: x,
      y: y,
      attr: {
        r: (i) => [4, 1.5][i],

        fill: (i) => ["#FF98FB", "#1C7412"][i],
      },
    });

    g.appendChild(c1);
    g.appendChild(c2);
    stage.appendChild(g);

    return { g, c1, c2, x, y };
  };

  const redraw = (eye) => {
    const { x, y, c2 } = eye;
    const c2x = (x * 29 + mPos.x) / 30;
    const c2y = (y * 29 + mPos.y) / 30;
    gsap.to(c2, { x: c2x, y: c2y });
  };

  const handlePointerMove = (e) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    setMPos({ x: svgPt.x, y: svgPt.y });
  };

  const handlePointerLeave = () => {
    setMPos({ x: 50, y: 50 });
  };



  return (
    <>

<div className="bg-[#F9F9F9] w-full flex justify-center">

            <div className="flex flex-row gap-x-12 items-center">
            
            <div className=" flex flex-col justify-center">
              <div
                style={{
                  fontSize: "2.4rem",
                  lineHeight: 1,
                  fontFamily: "NeueHaasDisplay35",
                  textTransform: "uppercase",

                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                }}
              >
                Orthodontics isn't just a{" "}
              </div>

              <div
                style={{
                  fontSize: "2.4rem",
                  lineHeight: 1,
                  fontFamily: "NeueHaasDisplay35",
                  textTransform: "uppercase",

                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                }}
              >
                <span style={{ fontFamily: "SaolDisplay-LightItalic" }}>
                  treatment
                </span>
                , it's a phase shift.
              </div>

              <div
                style={{
                  fontSize: "2.4rem",
                  lineHeight: 1,
                  fontFamily: "NeueHaasDisplay35",
                  textTransform: "uppercase",

                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                }}
              >
                Your{" "}
                <span style={{ fontFamily: "SaolDisplay-LightItalic" }}>
                  future
                </span>{" "}
                self says thanks.
              </div>
            </div>
            <div
              style={{
                width: "min(50vw, 50vh)",
                aspectRatio: "1 / 1",
                margin: 0,
                padding: 0,
                overflow: "hidden",
                background: "#1C7412",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
              }}
            >
              <svg
                ref={svgRef}
                viewBox="5.5 5.5 50 50"
                preserveAspectRatio="xMidYMid meet"
                style={{ width: "90%", height: "90%" }}
              />

              <div
                ref={hitAreaRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
              />
            </div>
          </div>
</div>


          {/* <div className="blockcontainer">
          <p>
            <span></span>
            <span></span>
          </p>
          <p>
            <span></span>
            <span></span>
          </p>
          <p>
            <span></span>
            <span></span>
          </p>
        </div> */}

 
        <div className="mt-20 font-neuehaas45 text-gray-600 uppercase min-h-screen leading-none px-2">
          {[
            {
              title: "ABO Treatment Standards",
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
          ].map((block, i) => (
            <div key={i} className="w-full border-t border-black">
              <div
                className="relative grid grid-cols-4 gap-x-10 px-10 py-16 overflow-hidden bg-black card-block"
                style={{ "--br": "0px" }}
              >
                <div className="absolute inset-0 z-0 before:absolute before:inset-0 before:bg-[#F9F9F9] before:transition-none before:rounded-[var(--br)]" />
                <div className="tracking-wider text-[12px] relative z-10 flex items-center justify-center col-span-1 text-[#fe019a]">
                  {block.title}
                </div>
                <div className="tracking-widest text-[11px] relative z-10 col-span-3 max-w-4xl text-black leading-relaxed">
                  <div>{block.content}</div>
                </div>
              </div>
            </div>
          ))}
          <div className="w-full border-b border-black" />
        </div>

    </>
  );
}

const About = () => {
  const timelineRef = useRef(null);
  const [swiper, setSwiper] = useState(null); // (vertical) swiper
  const [swiper2, setSwiper2] = useState(null); // (horizontal) swiper

  useEffect(() => {
    gsap.fromTo(
      ".lines__line.mod--timeline-1",
      { width: "0" },
      {
        width: "340px",
        duration: 1,
        scrollTrigger: {
          trigger: ".timeline-section",
          start: "top center",
          toggleActions: "play none none none",
        },
      }
    );

    gsap.fromTo(
      ".lines__line.mod--timeline-2",
      { width: "0" },
      {
        width: "980px",
        duration: 1,
        scrollTrigger: {
          trigger: ".timeline-section",
          start: "top center",
          toggleActions: "play none none none",
        },
      }
    );

    gsap.fromTo(
      ".timeline__line2",
      { width: "0" },
      {
        width: "100%",
        duration: 1,
        scrollTrigger: {
          trigger: ".timeline-section",
          start: "top center",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  useEffect(() => {
    if (swiper2) {
      swiper2.slideTo(0, 0);
    }

    const handleScroll = () => {
      const timelineElement = timelineRef.current;
      if (timelineElement) {
        const offset = timelineElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (offset.top < 0 && offset.bottom - windowHeight > 0) {
          const perc = Math.round(
            (100 * Math.abs(offset.top)) / (offset.height - windowHeight)
          );

          if (perc > 10 && perc < 30) {
            swiper?.slideTo(0, 1000);
            swiper2?.slideTo(0, 1000);
          } else if (perc >= 30 && perc < 55) {
            swiper?.slideTo(1, 1000);
            swiper2?.slideTo(1, 1000);
          } else if (perc >= 55) {
            swiper?.slideTo(2, 1000);
            swiper2?.slideTo(2, 1000);
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [swiper, swiper2]);

  return (
    <section
      className="bg-[#FAFAFA] timeline-section timeline-section--timeline"
      ref={timelineRef}
    >
      <div className="timeline_sticky">
        <div className="content-timeline">
          <div className="timeline__lines-wrap">
            <div className="lines mod--timeline">
              <div className="lines__line mod--timeline-1"></div>
              <div className="lines__line mod--timeline-2"></div>
            </div>
          </div>

          {/* (Horizontal Swiper) */}
          <div className="timeline-grid mod--timeline">
            <div className="timeline__col mod--2">
              <Swiper
                onSwiper={(swiper) => setSwiper2(swiper)}
                mousewheel={true}
                slidesPerView={1}
                spaceBetween={20}
                speed={800}
                allowTouchMove={false}
                initialSlide={2}
                wrapperClass="horizontal-wrapper"
                className="swiper swiper-reviews-numb"
              >
                <SwiperSlide className="swiper-slide slide--reviews-numb">
                  <div className="timeline__year">2001</div>
                </SwiperSlide>
                <SwiperSlide className="swiper-slide slide--reviews-numb">
                  <div className="timeline__year">2009</div>
                </SwiperSlide>
                <SwiperSlide className="swiper-slide slide--reviews-numb">
                  <div className="timeline__year">2024</div>
                </SwiperSlide>
              </Swiper>
            </div>
          </div>

          <div className="timeline__line2"></div>
          <Swiper
            onSwiper={setSwiper}
            mousewheel={true}
            slidesPerView={1}
            speed={1000}
            allowTouchMove={false}
            initialSlide={0}
            direction="vertical"
            wrapperClass="vertical-wrapper"
            breakpoints={{
              992: {
                spaceBetween: 0,
                centeredSlides: false,
                slidesPerView: 1,
              },
              320: {
                spaceBetween: 48,
                centeredSlides: true,
                slidesPerView: 1,
              },
            }}
            className="swiper swiper--reviews"
          >
            <SwiperSlide className="swiper-slide slide--reviews">
              <div className="timeline-grid mod--timeline2">
                <div className="timeline__col mod--1">
                  <img
                    src="../images/diamondinvismockup1.png"
                    loading="lazy"
                    alt=""
                    className="timeline__ico"
                  />
                  {/* <div className="timeline__ico-title">
                    Invisalign <br />
                    Pioneers
                  </div> */}
                </div>
                <div className="timeline__col mod--4">
                  <div className="timeline__txt-block">
                    <p className="timeline__p">
                      Lehigh Valley&apos;s first Invisalign provider. Continuing
                      to hone our skill-set while testing new aligner systems.
                    </p>
                    <div className="timeline__tags">
                      <div className="btn-tag">
                        <span className="btn-tag__star"></span>Top 1%
                      </div>
                      <div className="btn-tag">
                        <span className="btn-tag__star"></span>Diamond Plus
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* Second Slide - Innovation */}

            <SwiperSlide className="swiper-slide slide--reviews">
              <div className="timeline-grid mod--timeline2">
                <div className="timeline__col mod--1">
                  <img
                    src="../images/doctorphotomasked.png"
                    loading="lazy"
                    alt=""
                    className="timeline__ico"
                  />
                  {/* <div className="timeline__ico-title">
                    Expertise <br />
                    Defined
                  </div> */}
                </div>
                <div className="timeline__col mod--4">
                  <div className="timeline__txt-block">
                    <p className="timeline__p">
                      Our doctors bring a combined 60 years of experience.
                    </p>
                    <div className="timeline__tags">
                      <div className="btn-tag">
                        <span className="btn-tag__star"></span>Board
                        Certification
                      </div>
                      <div className="btn-tag">
                        <span className="btn-tag__star"></span>ABO
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
            {/* Third Slide - Board Certification (1995) */}
            <SwiperSlide className="swiper-slide slide--reviews">
              <div className="timeline-grid mod--timeline2">
                <div className="timeline__col mod--1">
                  <img
                    src="../images/fsajo.png"
                    loading="lazy"
                    alt=""
                    className="timeline__ico"
                  />
                  {/* <div className="timeline__ico-title">
                    Leading <br />
                    Recognition
                  </div> */}
                </div>
                <div className="timeline__col mod--4">
                  <div className="timeline__txt-block">
                    <p className="timeline__p">
                      We’ve had more patients featured on the cover of the
                      American Journal of Orthodontics than any other practice.
                    </p>
                    <div className="timeline__tags">
                      <div className="btn-tag">
                        <span className="btn-tag__star"></span>i-Tero
                      </div>
                      <div className="btn-tag">
                        <span className="btn-tag__star"></span>3D Fabrication
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </section>
  );
};

const ProjectImage = ({
  imageUrl,
  elems = 4,
  index = 0,
  stagger = -0.12,
  initialScale = 1.2,
  ease = "power2.inOut",
  duration = 0.8,
  animate = "scale",
  origin = "50% 50%",
  className = "project-img-wrapper",
}) => {
  const containerRef = useRef(null);
  const innerElemsRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    const innerElems = innerElemsRef.current;

    if (!container || innerElems.length === 0) return;

    gsap.set([container, innerElems[0]], { transformOrigin: origin });

    const hoverTimeline = gsap.timeline({ paused: true });

    gsap.set(innerElems[0], {
      [animate]: initialScale,
    });

    hoverTimeline.to(
      innerElems,
      {
        [animate]: (i) => +!i,
        duration,
        ease,
        stagger,
      },
      0
    );

    const handleMouseEnter = () => hoverTimeline.play();
    const handleMouseLeave = () => hoverTimeline.reverse();

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [elems, stagger, initialScale, ease, duration, animate, origin]);

  return (
    <div ref={containerRef} className={className}>
      {Array.from({ length: elems }).map((_, i) =>
        i === 0 ? (
          <div key={i} className="image-element__wrap">
            <div
              ref={(el) => (innerElemsRef.current[i] = el)}
              className="image__element"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          </div>
        ) : (
          <div
            key={i}
            ref={(el) => (innerElemsRef.current[i] = el)}
            className="image__element"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        )
      )}
    </div>
  );
};

function MoreThanSmiles() {
  // const imagesContainerRef = useRef(null);

  // const [images, setImages] = useState([
  //   "../images/morethansmiles1.png",
  //   "../images/morethansmiles2.png",
  //   "../images/morethansmiles3.png",
  //   "../images/morethansmiles4.png",
  //   "../images/morethansmiles5.png",
  //   "../images/morethansmiles6.png",
  // ]);

  // useEffect(() => {
  //   if (!imagesContainerRef.current) return;

  //   const imageElements =
  //     imagesContainerRef.current.querySelectorAll(".gallery-img");
  //   const timeline = gsap.timeline({ ease: "none" });

  //   let z = 100000000000;
  //   let moveLeft = true;

  //   // last image=highest z-index
  //   const observer = new IntersectionObserver(
  //     (entries) => {
  //       entries.forEach((entry) => {
  //         if (entry.isIntersecting) {
  //           imageElements.forEach((image, index) => {
  //             gsap.set(image, { zIndex: z - index });
  //           });

  //           timeline.fromTo(
  //             imageElements,
  //             {
  //               x: (i) => (i % 2 === 0 ? -400 : 400),
  //               y: "300%",
  //             },
  //             {
  //               x: 0,
  //               y: 0,
  //               duration: 1.5,
  //               stagger: -0.4,
  //               rotation: () => 20 * Math.random() - 10,
  //             }
  //           );

  //           timeline.play();
  //           observer.disconnect();
  //         }
  //       });
  //     },
  //     { threshold: 0.2 } // Trigger when 20% of the container is visible
  //   );

  //   observer.observe(imagesContainerRef.current);

  //   // Move clicked image to the back of the stack
  //   imageElements.forEach((image) => {
  //     image.addEventListener("click", () => {
  //       const moveDirection = moveLeft ? "-125%" : "125%";
  //       moveLeft = !moveLeft; // alternate direction each click

  //       // lowest index in stack
  //       let minZIndex = Infinity;
  //       imageElements.forEach((img) => {
  //         let zIndex = parseInt(img.style.zIndex, 10);
  //         if (zIndex < minZIndex) {
  //           minZIndex = zIndex;
  //         }
  //       });

  //       // the clicked image becomes the lowest index
  //       z = minZIndex - 1;

  //       timeline
  //         .to(image, { x: moveDirection, duration: 0.5 }) // move out
  //         .to(image, { zIndex: z, duration: 0.01 }) // update z-index when it's away from stack
  //         .to(image, { x: 0, duration: 0.5 }); // move back under the stack
  //     });
  //   });

  //   return () => {
  //     imageElements.forEach((image) =>
  //       image.removeEventListener("click", () => {})
  //     );
  //   };
  // }, [images]);

  const cardRefs = useRef([]);

  useEffect(() => {
    const updateScales = () => {
      const centerX = window.innerWidth / 2;

      cardRefs.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance = Math.abs(centerX - cardCenter);

        const scale = gsap.utils.clamp(0.9, 1.2, 1.2 - distance / 600);
        gsap.to(el, {
          scale,
          duration: 0.3,
          ease: "power2.out",
        });
      });
    };

    window.addEventListener("scroll", updateScales);
    window.addEventListener("resize", updateScales);
    updateScales();

    return () => {
      window.removeEventListener("scroll", updateScales);
      window.removeEventListener("resize", updateScales);
    };
  }, []);

  const itemsRef = useRef([]);
  const [scrollY, setScrollY] = useState(0);

  const textRef = useRef(null);
  const blockRef = useRef(null);

  useEffect(() => {
    if (!textRef.current) return;

    const split = new SplitText(textRef.current, { type: "words, chars" });

    const tl = gsap.fromTo(
      split.chars,
      { color: "#d4d4d4" },
      {
        color: "#000000",
        stagger: 0.03,
        ease: "power2.out",
        scrollTrigger: {
          trigger: textRef.current,
          start: "top center",
          end: "bottom bottom",
          scrub: true,
        },
      }
    );

    return () => {
      tl.scrollTrigger?.kill();
      split.revert();
    };
  }, []);

  const canvasContainerRef = useRef();

  const sectionRef = useRef(null);
  const imageRefs = useRef([]);
  const images = [
    "/images/morethansmiles1.png",
    "/images/morethansmiles2.png",
    "/images/morethansmiles3.png",
    "/images/morethansmiles4.png",
    "/images/morethansmiles5.png",
    "/images/morethansmiles6.png",
  ];

  useEffect(() => {
    if (!sectionRef.current || imageRefs.current.length === 0) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "+=1500",
        scrub: true,
        pin: true,
      },
    });

    const customOrder = [0, 4, 1, 5, 2, 3];

    customOrder.forEach((index, i) => {
      const img = imageRefs.current[index];
      if (!img) return;

      tl.fromTo(
        img,
        { yPercent: 100 },
        {
          yPercent: -200,

          ease: "power2.out",
          duration: 1,
        },
        i * 0.2
      );
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  const cardsRef = useRef([]);

  useEffect(() => {
    const cards = cardsRef.current;

    cards.forEach((card, index) => {
      gsap.set(card, {
        y: window.innerHeight,
        rotate: rotations[index] || 0,
      });
    });

    ScrollTrigger.create({
      trigger: ".sticky-cards",
      start: "top top",
      end: `+=${window.innerHeight * 8}`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const totalCards = cards.length;
        const progressPerCard = 1 / totalCards;

        cards.forEach((card, index) => {
          const cardStart = index * progressPerCard;
          let cardProgress = (progress - cardStart) / progressPerCard;
          cardProgress = Math.min(Math.max(cardProgress, 0), 1);

          let yPos = window.innerHeight * (1 - cardProgress);
          let xPos = 0;

          if (cardProgress === 1 && index < totalCards - 1) {
            const remainingProgress =
              (progress - (cardStart + progressPerCard)) /
              (1 - (cardStart + progressPerCard));
            if (remainingProgress > 0) {
              const distanceMultiplier = 1 - index * 0.15;
              xPos =
                -window.innerWidth *
                0.3 *
                distanceMultiplier *
                remainingProgress;
              yPos =
                -window.innerHeight *
                0.3 *
                distanceMultiplier *
                remainingProgress;
            }
          }

          gsap.to(card, {
            y: yPos,
            x: xPos,
            duration: 0,
            ease: "none",
          });
        });
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const colors = [
    "#f6b12d",
    "#eb4f2f",
    "#b26e5e",
    "#c588bb",
    "#699ef6",
    "#858B3F",
  ];
  const sectionStyle = {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
  };

  const centerTextStyle = {
    position: "relative",
    height: "100%",
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "2vw",
    padding: "0 3vw",
  };

  const stickyStyle = {
    ...sectionStyle,
    backgroundColor: "#f9f9f9",
  };

  const cardStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    willChange: "transform",
    width: "330px",
    height: "460px",
    padding: "1.5em",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    borderRadius: "20px",
    color: "#000",
  };
  const cardImgStyle = {
    width: "100%",
    height: "66%",
    borderRadius: "16px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const imgStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  };

  const cardContentStyle = {
    flex: "0 0 12px",
    display: "flex",
    alignItems: "center",
  };
  const rotations = [-12, 10, -5, 5, -5, -2];

  return (
    <>
      <div className="bg-[#F9F9F9] relative min-h-screen w-full">
        <div className="min-h-screen w-full bg-white font-sans text-black grid grid-cols-12 gap-4 p-8">
          <div className="col-span-5 flex flex-col gap-8">
            <div>
              <div className="text-[12px] mb-8 font-neueroman uppercase">
                Non-Profit
              </div>
              <h1 className="text-[4rem] leading-[4rem] font-neuehaas45">
                <span className="text-[#FFBE8D] font-saolitalic">More</span>
                <div className="flex gap-4">
                  <span className="text-[3.5rem]">Than</span>{" "}
                  <span className="text-[3.5rem]">Smiles</span>
                </div>
              </h1>
                            {/* <a
  href="https://morethansmiles.org/"
  target="_blank"
  rel="noopener noreferrer"
  className="relative w-32 h-32 flex items-center justify-center"
>

  <svg
    className="absolute inset-0 w-full h-full"
    viewBox="0 0 100 100"
  >
    <circle
      cx="50"
      cy="50"
      r="48"
      fill="none"
      stroke="black"
      strokeWidth=".5"
    />
  </svg>


  <div className="w-24 h-24 bg-[#F8FC00] rounded-full flex items-center justify-center">
    <span className="text-black text-sm font-neuehaas45">
      NOMINATE
    </span>
  </div>
</a> */}
            </div>

            <div className="border-t border-black mt-8 pt-4">
              <div className="flex items-start gap-6">

                <p className="text-[15px] tracking-wide font-neuehaas45 leading-snug max-w-[500px]">
                  We’re committed to making world-class orthodontic care
                  accessible to all. In 2011, we launched More Than Smiles to
                  provide treatment and promote community education around
                  dental and orthodontic health. 
                </p>
           
              </div>
              <p className="text-[13px] uppercase tracking-wide font-neueroman leading-snug max-w-[500px]">
                Nominate someone who deserves a
                  confident smile here
               </p>
            </div>
          </div>

          <div className="col-span-7 grid grid-cols-3 gap-4 relative">
            {Array(6)
              .fill()
              .map((_, i) => (
                <div>
                  <img
                    src="/images/mtscard1.png"
                    alt="Card back"
                    className="h-full"
                  />
                  {i === 2 && <div className="absolute pointer-events-none" />}
                </div>
              ))}
          </div>
        </div>
        <section className="sticky-cards" style={stickyStyle}>
          {images.map((src, i) => (
            <div
              key={i}
              ref={(el) => (cardsRef.current[i] = el)}
              style={{
                ...cardStyle,
                backgroundColor: colors[i % colors.length],
              }}
            >
              <div style={cardImgStyle}>
                <img src={src} alt={`card-${i}`} style={imgStyle} />
              </div>
              <div style={cardContentStyle}>
                <p className="font-khteka">Card {i + 1}</p>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "26px",
                    height: "26px",
                    marginLeft: "0.5em",
                  }}
                >
                  <img src="/images/fspetallogo.png" />
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>

      <div
        ref={canvasContainerRef}
        style={{
          position: "absolute",
          // inset: 0,
          // zIndex: 0,
          width: "50vw",
          height: "100vh",
        }}
      >
        <Canvas orthographic camera={{ zoom: 1, position: [0, 0, 5] }}>
          <PixelImage
            containerRef={canvasContainerRef}
            imgSrc="/images/portraitglass.jpg"
          />
        </Canvas>
      </div>
      {/* <section className="px-20 py-20 bg-[#FEF9F8] text-black flex flex-col justify-between">
        <div className="flex justify-between items-end text-[14px]">
          <div className="space-y-2">
            <section className="morethansmiles">
              <div ref={imagesContainerRef} className="imagestack">
                {images.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    className="gallery-img"
                    alt="gallery"
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </section> */}
    </>
  );
}

function GridLayout() {
  useGSAP(() => {
    const isTouchDevice = "ontouchstart" in window;

    let targetMedias = gsap.utils.toArray(".media");

    const parallaxMouse = () => {
      document.addEventListener("mousemove", (e) => {
        targetMedias.forEach((targetMedia, i) => {
          const deltaX = (e.clientX - window.innerWidth / 2) * 0.01;
          const deltaY = (e.clientY - window.innerHeight / 2) * 0.01;

          gsap.to(targetMedia, {
            x: deltaX,
            y: deltaY,
            scale: 1.02,
            duration: 0.75,
            ease: "power4",
          });
        });
      });

      document.addEventListener("mouseleave", (e) => {
        targetMedias.forEach((targetMedia) => {
          gsap.to(targetMedia, {
            x: 0,
            y: 0,
            scale: 1.02,
            duration: 0.75,
            ease: "power4",
          });
        });
      });
    };

    if (!isTouchDevice) {
      parallaxMouse();
    }
  });

  return (
    <section>
      <div className="grid grid-cols-8 h-[60dvh]">
        <div className="relative col-span-4 lg:col-span-5 h-full place-content-center place-items-center bg-[#20282D] text-center flex gap-2 p-8">
          <h2 className="text-2xl break-words lg:text-4xl xl:text-6xl font-editorial-new text-[#1d1f1b]">
            <span
              className="text-4xl lg:text-6xl xl:text-8xl font-nautica"
              style={{
                color: "#434840",
                WebkitTextFillColor: "#6a7265",
                WebkitTextStroke: "1px #434840",
              }}
            >
              We{" "}
            </span>
            have 50+ years of experience
          </h2>
          <GalaxyShape className="absolute inset-0 hidden object-cover object-center w-full h-full p-8 lg:block lg:p-16 text-[#444941]" />
        </div>
        <div className="relative h-full col-span-4 overflow-hidden lg:col-span-3">
          <img
            src="/../../images/pexels-cedric-fauntleroy-4269276_1920x2880.jpg"
            alt="dental chair"
            className="absolute inset-0 object-cover object-center w-full h-full media"
          />
        </div>
      </div>
      <div className="grid grid-cols-9 lg:h-[50vh]">
        <div className="min-h-[50vh] h-full col-span-9 bg-[#988193] text-[#f4f4f4] lg:col-span-3 place-content-center place-items-center p-8">
          <p className="text-2xl tracking-wide text-center font-editorial-new">
            <span className="block uppercase font-agrandir-grandheavy">
              25,000+{" "}
            </span>
            patients treated
          </p>
        </div>
        <div className="relative min-h-[50vh] h-full col-span-9 lg:col-span-3 place-content-center overflow-hidden">
          <img
            src="/../../images/aurela-redenica-VuN-RYI4XU4-unsplash_2400x3600.jpg"
            alt="invisalign aligners and case"
            className="absolute inset-0 object-cover object-bottom w-full h-full media"
          />
        </div>
        <div className="min-h-[50vh] h-full col-span-9 bg-[#988193] text-[#f4f4f4] lg:col-span-3 place-content-center place-items-center p-8">
          <p className="text-2xl tracking-wide text-center font-editorial-new">
            <span className="block uppercase font-agrandir-grandheavy">
              ABO{" "}
            </span>
            certified
          </p>
        </div>
      </div>
      <div className="grid grid-cols-9 lg:h-[50vh]">
        <div className="relative min-h-[50vh] h-full col-span-9 lg:col-span-3 place-content-center overflow-hidden">
          <img
            src="/../../images/goby-D0ApR8XZgLI-unsplash_2400x1467.jpg"
            alt="hand reaching towards another hand offering pink toothbrush"
            className="absolute inset-0 object-cover object-right w-full h-full media"
          />
        </div>
        <div className="min-h-[50vh] h-full col-span-9 bg-[#988193] text-[#f4f4f4] lg:col-span-3 place-content-center place-items-center p-8">
          <p className="text-2xl tracking-wide text-center font-editorial-new">
            <span className="block uppercase font-agrandir-grandheavy">
              10+{" "}
            </span>
            members
          </p>
        </div>
        <div className="relative min-h-[50vh] h-full col-span-9 lg:col-span-3 place-content-center overflow-hidden">
          <img
            src="/../../images/pexels-cedric-fauntleroy-4269491_1920x2880.jpg"
            alt="dental equipment"
            className="absolute inset-0 object-cover object-center w-full h-full media"
          />
        </div>
      </div>
      <div className="grid grid-cols-9 lg:h-[50vh]">
        <div className="min-h-[50vh] h-full col-span-9 bg-[#988193] text-[#f4f4f4] lg:col-span-3 place-content-center place-items-center p-8">
          <p className="text-2xl tracking-wide text-center font-editorial-new">
            <span className="block uppercase font-agrandir-grandheavy">4 </span>
            locations
          </p>
        </div>
        <div className="relative min-h-[50vh] h-full col-span-9 lg:col-span-3 place-content-center overflow-hidden">
          <img
            src="/../../images/tony-litvyak-glPVwPr1FKo-unsplash_2400x3600.jpg"
            alt="woman smiling"
            className="absolute inset-0 object-cover object-center w-full h-full media"
          />
        </div>
        <div className="min-h-[50vh] h-full col-span-9 bg-[#988193] text-[#f4f4f4] lg:col-span-3 place-content-center place-items-center p-8">
          <p className="text-2xl tracking-wide text-center font-editorial-new">
            <span className="block uppercase font-agrandir-grandheavy">
              advanced{" "}
            </span>
            technology
          </p>
        </div>
      </div>
    </section>
  );
}

const Marquee = ({ texts = [], onFinished }) => {
  const wrapperRef = useRef(null);
  const circleTextRefs = useRef([]);

  useEffect(() => {
    const circleEls = circleTextRefs.current;
    gsap.set(circleEls, { transformOrigin: "50% 50%" });

    const introTL = gsap
      .timeline()
      .addLabel("start", 0)
      .to(
        circleEls,
        {
          duration: 30,
          ease: "linear",
          rotation: (i) => (i % 2 ? 360 : -360),
          repeat: -1,
          transformOrigin: "50% 50%",
        },
        "start"
      );

    return () => {
      introTL.kill();
    };
  }, [onFinished]);

  return (
    <main ref={wrapperRef} className="relative w-full h-screen overflow-hidden">
<footer className="w-full bg-white text-black px-8 md:px-24 py-20 grid md:grid-cols-2 gap-16">
      {/* Left column */}
      <div className="flex flex-col justify-between">
      
      </div>

      {/* Right column */}
      <div className="flex flex-col justify-between text-gray-700 font-neuehaas35">

        <div className="grid grid-cols-2 gap-12">
          <div>
            <h3 className="text-black text-lg">Schnecksville</h3>
            <p className="mt-2 text-gray-700 font-neuehaas35">
              4155 Independence Dr<br />
              PA 18078
            </p>
          </div>
          <div>
           <h3 className="text-black text-lg">Schnecksville</h3>
            <p className="mt-2 text-gray-700 font-neuehaas35">
              4155 Independence Dr<br />
              PA 18078
            </p>
          </div>
        </div>

    
        <div className="mt-10 grid grid-cols-2 gap-12">
      
          <div>
            <h3 className="text-black text-lg">Schnecksville</h3>
            <p className="mt-2 text-gray-700 font-neuehaas35">
              4155 Independence Dr<br />
              PA 18078
            </p>
            <a
              href="#"
              className="mt-4 inline-flex items-center gap-2 text-black hover:opacity-70 transition"
            >
              <span className="text-xl">→</span> Learn more
            </a>
          </div>

         
          <div>
            <h3 className="text-black text-lg">Schnecksville</h3>
            <p className="mt-2 text-gray-700 font-neuehaas35">
              4155 Independence Dr<br />
              PA 18078
            </p>
            <a
              href="#"
              className="mt-4 inline-flex items-center gap-2 text-black hover:opacity-70 transition"
            >
              <span className="text-xl">→</span> Explore work
            </a>
          </div>
        </div>


        <div className="mt-10 flex flex-wrap gap-8 text-black">
          <a href="#" className="flex items-center gap-2 hover:opacity-70">
            <span className="text-lg">↗</span> Twitter
          </a>
          <a href="#" className="flex items-center gap-2 hover:opacity-70">
            <span className="text-lg">↗</span> Instagram
          </a>
          <a href="#" className="flex items-center gap-2 hover:opacity-70">
            <span className="text-lg">↗</span> Linkedin
          </a>
        </div>

    
        <div className="mt-16 flex items-center justify-between">
          <a href="#" className="text-sm text-gray-600 hover:text-black transition">
            Terms
          </a>
          <button className="flex items-center gap-2 bg-white border border-gray-300 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition">
            <span className="text-gray-800">Chat with us</span>
            <div className="relative w-8 h-8 flex items-center justify-center bg-black rounded-full">
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                1
              </span>
              💬
            </div>
          </button>
        </div>
      </div>
    </footer>
      <svg className="w-full h-full circles" viewBox="0 0 1400 1400">
        <defs>
          <path
            id="circle-0"
            d="M150,700.5A550.5,550.5 0 1 11251,700.5A550.5,550.5 0 1 1150,700.5"
          />
          <path
            id="circle-1"
            d="M250,700.5A450.5,450.5 0 1 11151,700.5A450.5,450.5 0 1 1250,700.5"
          />
          <path
            id="circle-2"
            d="M382,700.5A318.5,318.5 0 1 11019,700.5A318.5,318.5 0 1 1382,700.5"
          />
          <path
            id="circle-3"
            d="M487,700.5A213.5,213.5 0 1 1914,700.5A213.5,213.5 0 1 1487,700.5"
          />
        </defs>

        <path
          d="M100,700.5A600,600 0 1 11301,700.5A600,600 0 1 1100,700.5"
          fill="none"
          stroke="black"
          strokeWidth="1"
        />
        <path
          d="M250,700.5A450.5,450.5 0 1 11151,700.5A450.5,450.5 0 1 1250,700.5"
          fill="none"
          stroke="black"
          strokeWidth="1"
        />
        <path
          d="M382,700.5A318.5,318.5 0 1 11019,700.5A318.5,318.5 0 1 1382,700.5"
          fill="none"
          stroke="black"
          strokeWidth="1"
        />
        <path
          d="M487,700.5A213.5,213.5 0 1 1914,700.5A213.5,213.5 0 1 1487,700.5"
          fill="none"
          stroke="black"
          strokeWidth="1"
        />

        <text
          dy="-20"
          ref={(el) => (circleTextRefs.current[1] = el)}
          className="circles__text circles__text--1"
        >
          <textPath
            xlinkHref="#circle-1"
            textLength="2800"
            lengthAdjust="spacing"
          >
            Low-dose&nbsp; 3D&nbsp; digital&nbsp; radiographs&nbsp;
            Low-dose&nbsp; 3D&nbsp; digital&nbsp; radiographs&nbsp;
          </textPath>
        </text>
        <text
          dy="-20"
          ref={(el) => (circleTextRefs.current[2] = el)}
          className="circles__text circles__text--2"
        >
          <textPath xlinkHref="#circle-2" textLength="2000">
            Accelerated&nbsp;&nbsp;&nbsp; Treatment&nbsp;&nbsp;&nbsp;Accelerated
            &nbsp;&nbsp;&nbsp;Treatment&nbsp;&nbsp;&nbsp;
          </textPath>
        </text>
        <text
          dy="-20"
          ref={(el) => (circleTextRefs.current[3] = el)}
          className="circles__text circles__text--3"
        >
          <textPath xlinkHref="#circle-3" textLength="1341">
            Invisalign &nbsp;&nbsp;&nbsp;Invisalign&nbsp;&nbsp;&nbsp;
            Invisalign&nbsp;&nbsp;&nbsp; Invisalign&nbsp;&nbsp;&nbsp;
          </textPath>
        </text>
      </svg>
    </main>
  );
};
function Rays() {
  const numRays = 10;
  const rays = Array.from({ length: numRays });

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const minHeight = 0.5;
      const maxHeight = 110;
      const spacing = 36;

      Array.from({ length: numRays }).forEach((_, i) => {
        const baseHeight = maxHeight;
        const shrinkRatio = 0.85;
        const finalHeight = baseHeight * Math.pow(shrinkRatio, i);

        const offset = 24;
        const initialTop = offset + i * minHeight;
        const finalTop = Array.from({ length: i }).reduce((sum, _, j) => {
          const prevHeight = baseHeight * Math.pow(shrinkRatio, j);
          const spread = spacing * 1.25;
          return sum + prevHeight + spread;
        }, 0);

        gsap.fromTo(
          `.ray-${i}`,
          {
            height: minHeight,
            top: initialTop,
          },
          {
            height: finalHeight,
            top: finalTop,
            scrollTrigger: {
              trigger: ".sun-section",
              start: "top+=70% bottom",
              end: "+=160%",
              scrub: true,
            },
            ease: "none",
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);
  return (
    <section className="bg-[#F1F1F1] sun-section">
      <div className="sun-wrapper">
        <div className="sun-content leading-none">
          <div className="frame-line line-1">Benefits</div>

          <div className="frame-connector connector-1" />
          <div className="frame-line line-2">of working</div>
          <div className="frame-connector connector-2" />
          <div className="frame-line line-3">with us</div>
        </div>

        <div className="sun-mask">
          <div className="rays">
            {rays.map((_, i) => (
              <div className={`ray ray-${i}`} key={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

{
  /* <div className="mt-10 w-full flex justify-center flex-row gap-6">
          <div className="w-[540px] ">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 792 792"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <mask id="mask-inverse-2">
                  <rect width="792" height="792" fill="white" />

                  <path
                    d="M268.094 181.48V-220.57H455.044V181.67L268.094 181.48Z"
                    fill="black"
                  />
                  <path
                    d="M457.805 339.69H824.685V613.44L457.825 613.52C457.825 613.52 457.825 613.52 457.815 613.52V770.55H1010.1V-220.24H824.685V182.58L457.805 182.65V339.68V339.69Z"
                    fill="black"
                  />
                  <path
                    d="M433.78 295.93C333.76 295.93 252.68 377.01 252.68 477.03C252.68 577.05 333.76 658.13 433.78 658.13"
                    fill="black"
                  />
                  <path
                    d="M432.105 658.129H457.805L457.805 295.949H432.105L432.105 658.129Z"
                    fill="black"
                  />
                  <path
                    d="M0.8125 0V792H791.193V0H0.8125ZM765.773 766.62H26.2225V25.38H765.773V766.62Z"
                    fill="black"
                  />
                  <path
                    d="M12.3712 -1360.27H-273.219V2200.43H12.3712V-1360.27Z"
                    fill="black"
                  />
                  <path
                    d="M1068.04 -1360.27H775.172V2228.28H1068.04V-1360.27Z"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect width="792" height="792" fill="#E3C3DA" />

              <image
                href="../images/freysmiles_insta.gif"
                width="792"
                height="792"
                preserveAspectRatio="xMidYMid slice"
                mask="url(#mask-inverse-2)"
              />
            </svg>
          </div>
          <div className="w-[540px]">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 792 792"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <mask id="shape-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <path
                    d="M219.628 401.77C219.628 303.71 299.398 224.2 397.838 224.09C397.838 224.09 397.908 224.09 397.938 224.09C397.967 224.09 398.007 224.09 398.037 224.09C496.477 224.2 576.247 303.71 576.247 401.77C576.247 499.83 496.477 579.34 398.037 579.45C398.037 579.45 397.967 579.45 397.938 579.45C397.908 579.45 397.868 579.45 397.838 579.45C299.398 579.34 219.628 499.83 219.628 401.77ZM520.588 164.38H767.898V1063.42H1015.84V-268.16H767.898V-47.4501H520.588V164.39V164.38ZM-218.062 -268.16V1063.43H29.8775V842.89H276.487V631.05H29.8775V-268.16H-218.062Z"
                    fill="black"
                  />
                </mask>
              </defs>

              <rect width="100%" height="100%" fill="#AA4032" />

              <foreignObject width="100%" height="100%" mask="url(#shape-mask)">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  width="792"
                  height="792"
                  style={{ display: "block" }}
                >
                  <source src="../images/retaintracing.mp4" type="video/mp4" />
                </video>
              </foreignObject>
            </svg>
          </div>
        </div> */
}
{
  /* <div className="flex justify-center items-center" style={{ width:'500px', position: 'relative'}}>

  <svg
  className="masksvgshape"
        width="100%"
        height="100%"
  
          viewBox="0 0 792 792"
   >
    <defs>

      <clipPath id="svg-path" clipPathUnits="userSpaceOnUse">
        <path d="M219.628 401.77C219.628 303.71 299.398 224.2 397.838 224.09C397.838 224.09 397.908 224.09 397.938 224.09C397.967 224.09 398.007 224.09 398.037 224.09C496.477 224.2 576.247 303.71 576.247 401.77C576.247 499.83 496.477 579.34 398.037 579.45C398.037 579.45 397.967 579.45 397.938 579.45C397.908 579.45 397.868 579.45 397.838 579.45C299.398 579.34 219.628 499.83 219.628 401.77ZM520.588 164.38H767.898V1063.42H1015.84V-268.16H767.898V-47.4501H520.588V164.39V164.38ZM-218.062 -268.16V1063.43H29.8775V842.89H276.487V631.05H29.8775V-268.16H-218.062Z"/>
      </clipPath>
    </defs>
  </svg>


  <video
    src="../images/retaintracing.mp4"
    autoPlay
    muted
    loop
    playsInline
    style={{
      // width: '100%',
      // height: 'auto',
  
      clipPath: 'url(#svg-path)',
      WebkitClipPath: 'url(#svg-path)',
    }}
  />
</div> */
}

{
  /* <div className="w-2/3 ml-auto">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-32 min-h-screen">

    <div className="rounded-3xl overflow-hidden bg-[#FAFF00] flex flex-col">
      <div className="aspect-[3/4] w-full">
        <Curtains pixelRatio={Math.min(1.5, window.devicePixelRatio)}>
          <SimplePlane />
        </Curtains>
      </div>
      <div className="p-4 bg-white flex justify-between items-end text-black">
        <div>
          <p className="text-sm font-medium">Lorem Ipsum</p>
          <p className="text-xs text-gray-500">Dolor sit amet consectetur</p>
        </div>
        <p className="text-xs text-gray-500">10MG</p>
      </div>
    </div>

    <div className="rounded-3xl overflow-hidden bg-[#8B5E3C] flex flex-col">
      <div className="aspect-[3/4] w-full">
        <img
          src="https://source.unsplash.com/600x800/?cbd,box"
          alt="Placeholder"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 bg-white flex justify-between items-end text-black">
        <div>
          <p className="text-sm font-medium">Lorem Ipsum</p>
          <p className="text-xs text-gray-500">Adipiscing elit sed do</p>
        </div>
        <p className="text-xs text-gray-500">10MG</p>
      </div>
    </div>
  </div>
</div> */
}
