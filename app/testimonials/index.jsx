"use client";
import { easing, geometry } from "maath";
import { Flip } from "gsap/Flip";
import { Renderer, Program, Color, Mesh, Triangle, Vec2 } from "ogl";
import { motion } from "motion/react"
import {
  Canvas,
  useFrame,
  useThree,
  useLoader,
  extend,
} from "@react-three/fiber";
import React, {
  useEffect,
  useState,
  useRef,
  Suspense,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  EffectComposer,
  Bloom,
  Outline,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import ScrollTrigger from "gsap/ScrollTrigger";
import {
  OrbitControls,
  useGLTF,
  MeshTransmissionMaterial,
  Environment,
  shaderMaterial,
  Text,
  useTexture,
  Image,
  ScrollControls,
  useScroll,
} from "@react-three/drei";
import * as THREE from "three";
// import { useControls } from "leva";
import { MeshStandardMaterial } from "three";
import ScrollList from "./scroll-list.jsx";
import { ArrowRightIcon } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
}

// const FluidSimulation = ({ disabled }) => {
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     canvas.width = canvas.clientWidth;
//     canvas.height = canvas.clientHeight;

//     const config = {
//       TEXTURE_DOWNSAMPLE: 1,
//       DENSITY_DISSIPATION: 0.98,
//       VELOCITY_DISSIPATION: 0.99,
//       PRESSURE_DISSIPATION: 0.8,
//       PRESSURE_ITERATIONS: 25,
//       CURL: 28,
//       SPLAT_RADIUS: 0.0008,
//     };

//     let pointers = [];
//     let splatStack = [];

//     const { gl, ext } = getWebGLContext(canvas);

//     function getWebGLContext(canvas) {
//       const params = {
//         alpha: true,
//         depth: false,
//         stencil: false,
//         antialias: false,
//       };

//       let gl = canvas.getContext("webgl2", params);
//       const isWebGL2 = !!gl;
//       if (!isWebGL2)
//         gl =
//           canvas.getContext("webgl", params) ||
//           canvas.getContext("experimental-webgl", params);

//       let halfFloat;
//       let supportLinearFiltering;
//       if (isWebGL2) {
//         gl.getExtension("EXT_color_buffer_float");
//         supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
//       } else {
//         halfFloat = gl.getExtension("OES_texture_half_float");
//         supportLinearFiltering = gl.getExtension(
//           "OES_texture_half_float_linear",
//         );
//       }

//       gl.clearColor(0.0, 0.0, 0.0, 0.0);
//       gl.enable(gl.BLEND);
//       gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

//       const halfFloatTexType = isWebGL2
//         ? gl.HALF_FLOAT
//         : halfFloat.HALF_FLOAT_OES;
//       let formatRGBA;
//       let formatRG;
//       let formatR;

//       if (isWebGL2) {
//         formatRGBA = getSupportedFormat(
//           gl,
//           gl.RGBA16F,
//           gl.RGBA,
//           halfFloatTexType,
//         );
//         formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
//         formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
//       } else {
//         formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
//         formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
//         formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
//       }

//       return {
//         gl,
//         ext: {
//           formatRGBA,
//           formatRG,
//           formatR,
//           halfFloatTexType,
//           supportLinearFiltering,
//         },
//       };
//     }

//     function getSupportedFormat(gl, internalFormat, format, type) {
//       if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
//         switch (internalFormat) {
//           case gl.R16F:
//             return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
//           case gl.RG16F:
//             return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
//           default:
//             return null;
//         }
//       }

//       return {
//         internalFormat,
//         format,
//       };
//     }

//     function supportRenderTextureFormat(gl, internalFormat, format, type) {
//       let texture = gl.createTexture();
//       gl.bindTexture(gl.TEXTURE_2D, texture);
//       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
//       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
//       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//       gl.texImage2D(
//         gl.TEXTURE_2D,
//         0,
//         internalFormat,
//         4,
//         4,
//         0,
//         format,
//         type,
//         null,
//       );

//       let fbo = gl.createFramebuffer();
//       gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
//       gl.framebufferTexture2D(
//         gl.FRAMEBUFFER,
//         gl.COLOR_ATTACHMENT0,
//         gl.TEXTURE_2D,
//         texture,
//         0,
//       );

//       const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
//       if (status != gl.FRAMEBUFFER_COMPLETE) return false;
//       return true;
//     }

//     function pointerPrototype() {
//       this.id = -1;
//       this.x = 0;
//       this.y = 0;
//       this.dx = 0;
//       this.dy = 0;
//       this.down = false;
//       this.moved = false;
//       this.color = [30, 0, 300];
//     }

//     pointers.push(new pointerPrototype());

//     class GLProgram {
//       constructor(vertexShader, fragmentShader) {
//         this.uniforms = {};
//         this.program = gl.createProgram();

//         gl.attachShader(this.program, vertexShader);
//         gl.attachShader(this.program, fragmentShader);
//         gl.linkProgram(this.program);

//         if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
//           throw gl.getProgramInfoLog(this.program);

//         const uniformCount = gl.getProgramParameter(
//           this.program,
//           gl.ACTIVE_UNIFORMS,
//         );
//         for (let i = 0; i < uniformCount; i++) {
//           const uniformName = gl.getActiveUniform(this.program, i).name;
//           this.uniforms[uniformName] = gl.getUniformLocation(
//             this.program,
//             uniformName,
//           );
//         }
//       }

//       bind() {
//         gl.useProgram(this.program);
//       }
//     }

//     function compileShader(type, source) {
//       const shader = gl.createShader(type);
//       gl.shaderSource(shader, source);
//       gl.compileShader(shader);

//       if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
//         throw gl.getShaderInfoLog(shader);

//       return shader;
//     }

//     const baseVertexShader = compileShader(
//       gl.VERTEX_SHADER,
//       `
//       precision highp float;
//       precision mediump sampler2D;

//       attribute vec2 aPosition;
//       varying vec2 vUv;
//       varying vec2 vL;
//       varying vec2 vR;
//       varying vec2 vT;
//       varying vec2 vB;
//       uniform vec2 texelSize;

//       void main () {
//           vUv = aPosition * 0.5 + 0.5;
//           vL = vUv - vec2(texelSize.x, 0.0);
//           vR = vUv + vec2(texelSize.x, 0.0);
//           vT = vUv + vec2(0.0, texelSize.y);
//           vB = vUv - vec2(0.0, texelSize.y);
//           gl_Position = vec4(aPosition, 0.0, 1.0);
//       }
//     `,
//     );

//     const clearShader = compileShader(
//       gl.FRAGMENT_SHADER,
//       `
//       precision highp float;
//       precision mediump sampler2D;

//       varying vec2 vUv;
//       uniform sampler2D uTexture;
//       uniform float value;

//       void main () {
//           gl_FragColor = value * texture2D(uTexture, vUv);
//       }
//     `,
//     );

//     const displayShader = compileShader(
//       gl.FRAGMENT_SHADER,
//       `
//       precision highp float;
//       precision mediump sampler2D;

//       varying vec2 vUv;
//       uniform sampler2D uTexture;
// void main() {
//     vec3 rawColor = texture2D(uTexture, vUv).rgb;

//     // Tone down bright white centers
//     rawColor = clamp(rawColor, 0.0, 0.6);

//     // More pink, less orange: soft pastel pink
//     vec3 pinkTint = vec3(1.0, 0.75, 0.9);  // Reddish-pink tone

//     // Blend the raw color and pink tint
//     vec3 color = mix(rawColor, pinkTint, 0.4);  // Slightly more tinting

//     // Feathered alpha for a wispy look
//     float intensity = length(rawColor);
//     float alpha = pow(intensity, 1.2) * smoothstep(0.0, 0.4, intensity);
//     alpha = clamp(alpha, 0.0, 1.0);

//     gl_FragColor = vec4(color, alpha * 0.7);  // Slightly softer visibility
// }
//     `,
//     );

//     const splatShader = compileShader(
//       gl.FRAGMENT_SHADER,
//       `
//       precision highp float;
//       precision mediump sampler2D;

//       varying vec2 vUv;
//       uniform sampler2D uTarget;
//       uniform float aspectRatio;
//       uniform vec3 color;
//       uniform vec2 point;
//       uniform float radius;

//       void main () {
//           vec2 p = vUv - point.xy;
//           p.x *= aspectRatio;
//           vec3 splat = exp(-dot(p, p) / radius) * color;
//           vec3 base = texture2D(uTarget, vUv).xyz;
//           gl_FragColor = vec4(base + splat, 1.0);
//       }
//     `,
//     );

//     const advectionManualFilteringShader = compileShader(
//       gl.FRAGMENT_SHADER,
//       `
//       precision highp float;
//       precision mediump sampler2D;

//       varying vec2 vUv;
//       uniform sampler2D uVelocity;
//       uniform sampler2D uSource;
//       uniform vec2 texelSize;
//       uniform float dt;
//       uniform float dissipation;

//       vec4 bilerp (in sampler2D sam, in vec2 p) {
//           vec4 st;
//           st.xy = floor(p - 0.5) + 0.5;
//           st.zw = st.xy + 1.0;
//           vec4 uv = st * texelSize.xyxy;
//           vec4 a = texture2D(sam, uv.xy);
//           vec4 b = texture2D(sam, uv.zy);
//           vec4 c = texture2D(sam, uv.xw);
//           vec4 d = texture2D(sam, uv.zw);
//           vec2 f = p - st.xy;
//           return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
//       }

//       void main () {
//           vec2 coord = gl_FragCoord.xy - dt * texture2D(uVelocity, vUv).xy;
//           gl_FragColor = dissipation * bilerp(uSource, coord);
//           gl_FragColor.a = 1.0;
//       }
//     `,
//     );

//     const advectionShader = compileShader(
//       gl.FRAGMENT_SHADER,
//       `
//       precision highp float;
//       precision mediump sampler2D;

//       varying vec2 vUv;
//       uniform sampler2D uVelocity;
//       uniform sampler2D uSource;
//       uniform vec2 texelSize;
//       uniform float dt;
//       uniform float dissipation;

//       void main () {
//           vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
//           gl_FragColor = dissipation * texture2D(uSource, coord);
//           gl_FragColor.a = 1.0;
//       }
//     `,
//     );

//     const divergenceShader = compileShader(
//       gl.FRAGMENT_SHADER,
//       `
//       precision highp float;
//       precision mediump sampler2D;

//       varying vec2 vUv;
//       varying vec2 vL;
//       varying vec2 vR;
//       varying vec2 vT;
//       varying vec2 vB;
//       uniform sampler2D uVelocity;

//       vec2 sampleVelocity (in vec2 uv) {
//           vec2 multiplier = vec2(1.0, 1.0);
//           if (uv.x < 0.0) { uv.x = 0.0; multiplier.x = -1.0; }
//           if (uv.x > 1.0) { uv.x = 1.0; multiplier.x = -1.0; }
//           if (uv.y < 0.0) { uv.y = 0.0; multiplier.y = -1.0; }
//           if (uv.y > 1.0) { uv.y = 1.0; multiplier.y = -1.0; }
//           return multiplier * texture2D(uVelocity, uv).xy;
//       }

//       void main () {
//           float L = sampleVelocity(vL).x;
//           float R = sampleVelocity(vR).x;
//           float T = sampleVelocity(vT).y;
//           float B = sampleVelocity(vB).y;
//           float div = 0.5 * (R - L + T - B);
//           gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
//       }
//     `,
//     );

//     const curlShader = compileShader(
//       gl.FRAGMENT_SHADER,
//       `
//       precision highp float;
//       precision mediump sampler2D;

//       varying vec2 vUv;
//       varying vec2 vL;
//       varying vec2 vR;
//       varying vec2 vT;
//       varying vec2 vB;
//       uniform sampler2D uVelocity;

//       void main () {
//           float L = texture2D(uVelocity, vL).y;
//           float R = texture2D(uVelocity, vR).y;
//           float T = texture2D(uVelocity, vT).x;
//           float B = texture2D(uVelocity, vB).x;
//           float vorticity = R - L - T + B;
//           gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0);
//       }
//     `,
//     );

//     const vorticityShader = compileShader(
//       gl.FRAGMENT_SHADER,
//       `
//       precision highp float;
//       precision mediump sampler2D;

//       varying vec2 vUv;
//       varying vec2 vT;
//       varying vec2 vB;
//       uniform sampler2D uVelocity;
//       uniform sampler2D uCurl;
//       uniform float curl;
//       uniform float dt;

//       void main () {
//           float T = texture2D(uCurl, vT).x;
//           float B = texture2D(uCurl, vB).x;
//           float C = texture2D(uCurl, vUv).x;
//           vec2 force = vec2(abs(T) - abs(B), 0.0);
//           force *= 1.0 / length(force + 0.00001) * curl * C;
//           vec2 vel = texture2D(uVelocity, vUv).xy;
//           gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
//       }
//     `,
//     );

//     const pressureShader = compileShader(
//       gl.FRAGMENT_SHADER,
//       `
//       precision highp float;
//       precision mediump sampler2D;

//       varying vec2 vUv;
//       varying vec2 vL;
//       varying vec2 vR;
//       varying vec2 vT;
//       varying vec2 vB;
//       uniform sampler2D uPressure;
//       uniform sampler2D uDivergence;

//       vec2 boundary (in vec2 uv) {
//           uv = min(max(uv, 0.0), 1.0);
//           return uv;
//       }

//       void main () {
//           float L = texture2D(uPressure, boundary(vL)).x;
//           float R = texture2D(uPressure, boundary(vR)).x;
//           float T = texture2D(uPressure, boundary(vT)).x;
//           float B = texture2D(uPressure, boundary(vB)).x;
//           float C = texture2D(uPressure, vUv).x;
//           float divergence = texture2D(uDivergence, vUv).x;
//           float pressure = (L + R + B + T - divergence) * 0.25;
//           gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
//       }
//     `,
//     );

//     const gradientSubtractShader = compileShader(
//       gl.FRAGMENT_SHADER,
//       `
//       precision highp float;
//       precision mediump sampler2D;

//       varying vec2 vUv;
//       varying vec2 vL;
//       varying vec2 vR;
//       varying vec2 vT;
//       varying vec2 vB;
//       uniform sampler2D uPressure;
//       uniform sampler2D uVelocity;

//       vec2 boundary (in vec2 uv) {
//           uv = min(max(uv, 0.0), 1.0);
//           return uv;
//       }

//       void main () {
//           float L = texture2D(uPressure, boundary(vL)).x;
//           float R = texture2D(uPressure, boundary(vR)).x;
//           float T = texture2D(uPressure, boundary(vT)).x;
//           float B = texture2D(uPressure, boundary(vB)).x;
//           vec2 velocity = texture2D(uVelocity, vUv).xy;
//           velocity.xy -= vec2(R - L, T - B);
//           gl_FragColor = vec4(velocity, 0.0, 1.0);
//       }
//     `,
//     );

//     let textureWidth;
//     let textureHeight;
//     let density;
//     let velocity;
//     let divergence;
//     let curl;
//     let pressure;

//     function initFramebuffers() {
//       textureWidth = gl.drawingBufferWidth >> config.TEXTURE_DOWNSAMPLE;
//       textureHeight = gl.drawingBufferHeight >> config.TEXTURE_DOWNSAMPLE;

//       const texType = ext.halfFloatTexType;
//       const rgba = ext.formatRGBA;
//       const rg = ext.formatRG;
//       const r = ext.formatR;

//       density = createDoubleFBO(
//         2,
//         textureWidth,
//         textureHeight,
//         rgba.internalFormat,
//         rgba.format,
//         texType,
//         ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST,
//       );
//       velocity = createDoubleFBO(
//         0,
//         textureWidth,
//         textureHeight,
//         rg.internalFormat,
//         rg.format,
//         texType,
//         ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST,
//       );
//       divergence = createFBO(
//         4,
//         textureWidth,
//         textureHeight,
//         r.internalFormat,
//         r.format,
//         texType,
//         gl.NEAREST,
//       );
//       curl = createFBO(
//         5,
//         textureWidth,
//         textureHeight,
//         r.internalFormat,
//         r.format,
//         texType,
//         gl.NEAREST,
//       );
//       pressure = createDoubleFBO(
//         6,
//         textureWidth,
//         textureHeight,
//         r.internalFormat,
//         r.format,
//         texType,
//         gl.NEAREST,
//       );
//     }

//     function createFBO(texId, w, h, internalFormat, format, type, param) {
//       gl.activeTexture(gl.TEXTURE0 + texId);
//       let texture = gl.createTexture();
//       gl.bindTexture(gl.TEXTURE_2D, texture);
//       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
//       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
//       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//       gl.texImage2D(
//         gl.TEXTURE_2D,
//         0,
//         internalFormat,
//         w,
//         h,
//         0,
//         format,
//         type,
//         null,
//       );

//       let fbo = gl.createFramebuffer();
//       gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
//       gl.framebufferTexture2D(
//         gl.FRAMEBUFFER,
//         gl.COLOR_ATTACHMENT0,
//         gl.TEXTURE_2D,
//         texture,
//         0,
//       );
//       gl.viewport(0, 0, w, h);
//       gl.clear(gl.COLOR_BUFFER_BIT);

//       return [texture, fbo, texId];
//     }

//     function createDoubleFBO(texId, w, h, internalFormat, format, type, param) {
//       let fbo1 = createFBO(texId, w, h, internalFormat, format, type, param);
//       let fbo2 = createFBO(
//         texId + 1,
//         w,
//         h,
//         internalFormat,
//         format,
//         type,
//         param,
//       );

//       return {
//         get read() {
//           return fbo1;
//         },
//         get write() {
//           return fbo2;
//         },
//         swap() {
//           let temp = fbo1;
//           fbo1 = fbo2;
//           fbo2 = temp;
//         },
//       };
//     }

//     const blit = (() => {
//       gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
//       gl.bufferData(
//         gl.ARRAY_BUFFER,
//         new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
//         gl.STATIC_DRAW,
//       );
//       gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
//       gl.bufferData(
//         gl.ELEMENT_ARRAY_BUFFER,
//         new Uint16Array([0, 1, 2, 0, 2, 3]),
//         gl.STATIC_DRAW,
//       );
//       gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
//       gl.enableVertexAttribArray(0);

//       return (destination) => {
//         gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
//         gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
//       };
//     })();

//     const clearProgram = new GLProgram(baseVertexShader, clearShader);
//     const displayProgram = new GLProgram(baseVertexShader, displayShader);
//     const splatProgram = new GLProgram(baseVertexShader, splatShader);
//     const advectionProgram = new GLProgram(
//       baseVertexShader,
//       ext.supportLinearFiltering
//         ? advectionShader
//         : advectionManualFilteringShader,
//     );
//     const divergenceProgram = new GLProgram(baseVertexShader, divergenceShader);
//     const curlProgram = new GLProgram(baseVertexShader, curlShader);
//     const vorticityProgram = new GLProgram(baseVertexShader, vorticityShader);
//     const pressureProgram = new GLProgram(baseVertexShader, pressureShader);
//     const gradienSubtractProgram = new GLProgram(
//       baseVertexShader,
//       gradientSubtractShader,
//     );

//     initFramebuffers();

//     let lastTime = Date.now();
//     multipleSplats(parseInt(Math.random() * 20) + 5);

//     function update() {
//       resizeCanvas();

//       const dt = Math.min((Date.now() - lastTime) / 1000, 0.016);
//       lastTime = Date.now();

//       gl.viewport(0, 0, textureWidth, textureHeight);

//       if (splatStack.length > 0) multipleSplats(splatStack.pop());

//       advectionProgram.bind();
//       gl.uniform2f(
//         advectionProgram.uniforms.texelSize,
//         1.0 / textureWidth,
//         1.0 / textureHeight,
//       );
//       gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read[2]);
//       gl.uniform1i(advectionProgram.uniforms.uSource, velocity.read[2]);
//       gl.uniform1f(advectionProgram.uniforms.dt, dt);
//       gl.uniform1f(
//         advectionProgram.uniforms.dissipation,
//         config.VELOCITY_DISSIPATION,
//       );
//       blit(velocity.write[1]);
//       velocity.swap();

//       gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read[2]);
//       gl.uniform1i(advectionProgram.uniforms.uSource, density.read[2]);
//       gl.uniform1f(
//         advectionProgram.uniforms.dissipation,
//         config.DENSITY_DISSIPATION,
//       );
//       blit(density.write[1]);
//       density.swap();

//       for (let i = 0; i < pointers.length; i++) {
//         const pointer = pointers[i];
//         if (pointer.moved) {
//           splat(pointer.x, pointer.y, pointer.dx, pointer.dy, pointer.color);
//           pointer.moved = false;
//         }
//       }

//       curlProgram.bind();
//       gl.uniform2f(
//         curlProgram.uniforms.texelSize,
//         1.0 / textureWidth,
//         1.0 / textureHeight,
//       );
//       gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read[2]);
//       blit(curl[1]);

//       vorticityProgram.bind();
//       gl.uniform2f(
//         vorticityProgram.uniforms.texelSize,
//         1.0 / textureWidth,
//         1.0 / textureHeight,
//       );
//       gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read[2]);
//       gl.uniform1i(vorticityProgram.uniforms.uCurl, curl[2]);
//       gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
//       gl.uniform1f(vorticityProgram.uniforms.dt, dt);
//       blit(velocity.write[1]);
//       velocity.swap();

//       divergenceProgram.bind();
//       gl.uniform2f(
//         divergenceProgram.uniforms.texelSize,
//         1.0 / textureWidth,
//         1.0 / textureHeight,
//       );
//       gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read[2]);
//       blit(divergence[1]);

//       clearProgram.bind();
//       let pressureTexId = pressure.read[2];
//       gl.activeTexture(gl.TEXTURE0 + pressureTexId);
//       gl.bindTexture(gl.TEXTURE_2D, pressure.read[0]);
//       gl.uniform1i(clearProgram.uniforms.uTexture, pressureTexId);
//       gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE_DISSIPATION);
//       blit(pressure.write[1]);
//       pressure.swap();

//       pressureProgram.bind();
//       gl.uniform2f(
//         pressureProgram.uniforms.texelSize,
//         1.0 / textureWidth,
//         1.0 / textureHeight,
//       );
//       gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence[2]);
//       pressureTexId = pressure.read[2];
//       gl.uniform1i(pressureProgram.uniforms.uPressure, pressureTexId);
//       gl.activeTexture(gl.TEXTURE0 + pressureTexId);
//       for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
//         gl.bindTexture(gl.TEXTURE_2D, pressure.read[0]);
//         blit(pressure.write[1]);
//         pressure.swap();
//       }

//       gradienSubtractProgram.bind();
//       gl.uniform2f(
//         gradienSubtractProgram.uniforms.texelSize,
//         1.0 / textureWidth,
//         1.0 / textureHeight,
//       );
//       gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read[2]);
//       gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read[2]);
//       blit(velocity.write[1]);
//       velocity.swap();

//       gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
//       displayProgram.bind();
//       gl.uniform1i(displayProgram.uniforms.uTexture, density.read[2]);
//       blit(null);

//       requestAnimationFrame(update);
//     }

//     function splat(x, y, dx, dy, color) {
//       splatProgram.bind();
//       gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read[2]);
//       gl.uniform1f(
//         splatProgram.uniforms.aspectRatio,
//         canvas.width / canvas.height,
//       );
//       gl.uniform2f(
//         splatProgram.uniforms.point,
//         x / canvas.width,
//         1.0 - y / canvas.height,
//       );
//       gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 1.0);
//       gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS);
//       blit(velocity.write[1]);
//       velocity.swap();

//       gl.uniform1i(splatProgram.uniforms.uTarget, density.read[2]);
//       gl.uniform3f(
//         splatProgram.uniforms.color,
//         color[0] * 0.3,
//         color[1] * 0.3,
//         color[2] * 0.3,
//       );
//       blit(density.write[1]);
//       density.swap();
//     }

//     function multipleSplats(amount) {
//       for (let i = 0; i < amount; i++) {
//         const color = [
//           Math.random() * 10,
//           Math.random() * 10,
//           Math.random() * 10,
//         ];
//         const x = canvas.width * Math.random();
//         const y = canvas.height * Math.random();
//         const dx = 1000 * (Math.random() - 0.5);
//         const dy = 1000 * (Math.random() - 0.5);
//         splat(x, y, dx, dy, color);
//       }
//     }
//     function resizeCanvas() {
//       const width = window.innerWidth;
//       const height = window.innerHeight;

//       if (canvas.width !== width || canvas.height !== height) {
//         canvas.width = width;
//         canvas.height = height;
//         initFramebuffers();
//       }
//     }

//     window.addEventListener("resize", resizeCanvas);

//     const handleMouseMove = (e) => {
//       pointers[0].moved = true;
//       pointers[0].dx = (e.offsetX - pointers[0].x) * 10.0;
//       pointers[0].dy = (e.offsetY - pointers[0].y) * 10.0;
//       pointers[0].x = e.offsetX;
//       pointers[0].y = e.offsetY;

//       const hue = Math.random();
//       const sat = 0.6 + Math.random() * 0.3;
//       const val = 0.8 + Math.random() * 0.2;

//       function hsv2rgb(h, s, v) {
//         let r, g, b;
//         const i = Math.floor(h * 6);
//         const f = h * 6 - i;
//         const p = v * (1 - s);
//         const q = v * (1 - f * s);
//         const t = v * (1 - (1 - f) * s);
//         switch (i % 6) {
//           case 0:
//             r = v;
//             g = t;
//             b = p;
//             break;
//           case 1:
//             r = q;
//             g = v;
//             b = p;
//             break;
//           case 2:
//             r = p;
//             g = v;
//             b = t;
//             break;
//           case 3:
//             r = p;
//             g = q;
//             b = v;
//             break;
//           case 4:
//             r = t;
//             g = p;
//             b = v;
//             break;
//           case 5:
//             r = v;
//             g = p;
//             b = q;
//             break;
//         }
//         return [r, g, b];
//       }

//       pointers[0].color = hsv2rgb(hue, sat, val);
//     };

//     const handleTouchMove = (e) => {
//       e.preventDefault();
//       const touches = e.targetTouches;
//       for (let i = 0; i < touches.length; i++) {
//         let pointer = pointers[i];
//         pointer.moved = pointer.down;
//         pointer.dx = (touches[i].pageX - pointer.x) * 10.0;
//         pointer.dy = (touches[i].pageY - pointer.y) * 10.0;
//         pointer.x = touches[i].pageX;
//         pointer.y = touches[i].pageY;
//       }
//     };

//     const handleMouseDown = () => {
//       pointers[0].down = true;
//       pointers[0].color = [
//         Math.random() + 0.2,
//         Math.random() + 0.2,
//         Math.random() + 0.2,
//       ];
//     };

//     const handleTouchStart = (e) => {
//       e.preventDefault();
//       const touches = e.targetTouches;
//       for (let i = 0; i < touches.length; i++) {
//         if (i >= pointers.length) pointers.push(new pointerPrototype());

//         pointers[i].id = touches[i].identifier;
//         pointers[i].down = true;
//         pointers[i].x = touches[i].pageX;
//         pointers[i].y = touches[i].pageY;
//         pointers[i].color = [
//           Math.random() + 0.2,
//           Math.random() + 0.2,
//           Math.random() + 0.2,
//         ];
//       }
//     };

//     const handleMouseLeave = () => {
//       pointers[0].down = false;
//     };

//     const handleTouchEnd = (e) => {
//       const touches = e.changedTouches;
//       for (let i = 0; i < touches.length; i++)
//         for (let j = 0; j < pointers.length; j++)
//           if (touches[i].identifier == pointers[j].id) pointers[j].down = false;
//     };

//     canvas.addEventListener("mousemove", handleMouseMove);
//     canvas.addEventListener("touchmove", handleTouchMove, false);
//     canvas.addEventListener("mousedown", handleMouseDown);
//     canvas.addEventListener("touchstart", handleTouchStart);
//     window.addEventListener("mouseleave", handleMouseLeave);
//     window.addEventListener("touchend", handleTouchEnd);

//     const animationId = requestAnimationFrame(update);

//     return () => {
//       cancelAnimationFrame(animationId);
//       canvas.removeEventListener("mousemove", handleMouseMove);
//       canvas.removeEventListener("touchmove", handleTouchMove);
//       canvas.removeEventListener("mousedown", handleMouseDown);
//       canvas.removeEventListener("touchstart", handleTouchStart);
//       window.removeEventListener("mouseleave", handleMouseLeave);
//       window.removeEventListener("touchend", handleTouchEnd);
//     };
//   }, []);

//   return (
//     <canvas
//       ref={canvasRef}
//       style={{
//         width: "100vw",
//         height: "100vh",
//         position: "fixed",
//         top: 0,
//         left: 0,
//         zIndex: 1,

//         pointerEvents: disabled ? "none" : "auto",

//         height: "-webkit-fill-available",
//         minHeight: "-webkit-fill-available",
//       }}
//     />
//   );
// };

function Background() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    const renderer = new Renderer({
      dpr: isMobile ? 0.75 : Math.min(window.devicePixelRatio, 1.5),

      canvas: canvasRef.current,

      width: window.innerWidth,

      height: window.innerHeight,
    });

    const { gl } = renderer;

    gl.clearColor(0.93, 0.94, 0.96, 1);

    const geometry = new Triangle(gl);

    const vertex = `
      attribute vec2 uv;
      attribute vec2 position;
      uniform vec2 uResolution;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragment = `
  precision mediump float;

  uniform float uTime;
  uniform float uScroll;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;

    float wave =
      sin(uv.x * 5.0 + uTime * 0.35) *
      cos(uv.y * 4.0 - uTime * 0.2);

    float blend = uv.y + wave * 0.06 + uScroll;

    vec3 warm = vec3(0.96, 0.56, 0.25);
    vec3 pearl = vec3(0.82, 0.84, 0.91);
    vec3 light = vec3(0.96, 0.95, 0.94);

    vec3 color = mix(warm, pearl, smoothstep(0.0, 0.8, blend));
    color = mix(color, light, smoothstep(0.55, 1.0, uv.x + wave * 0.1));

    gl_FragColor = vec4(color, 1.0);
  }
`;

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uColor1: { value: new Color("#F68128") },
        uColor2: { value: new Color("#AAAEC3") },
        uColor3: { value: new Color("#CFC8BE") },
        uColor4: { value: new Color("#E9E4DC") },

        uResolution: {
          value: new Vec2(gl.canvas.offsetWidth, gl.canvas.offsetHeight),
        },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      renderer.setSize(width, height);
      program.uniforms.uResolution.value.set(width, height);
    };

    let targetScroll = 0;
    let currentScroll = 0;
    let frameId = null;
    let previousTime = 0;
    let destroyed = false;

    const handleScroll = () => {
      targetScroll = window.scrollY * 0.00015;
    };

    const loop = (time) => {
      if (destroyed) return;

      frameId = requestAnimationFrame(loop);

      const minimumFrameTime = isMobile ? 1000 / 30 : 0;

      if (time - previousTime < minimumFrameTime) return;

      previousTime = time;

      program.uniforms.uTime.value = time * 0.001;

      currentScroll += (targetScroll - currentScroll) * 0.06;
      program.uniforms.uScroll.value = currentScroll;

      renderer.render({ scene: mesh });
    };

    handleResize();
    handleScroll();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });

    frameId = requestAnimationFrame(loop);

    return () => {
      destroyed = true;

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10"
    />
  );
}

const TerminalPreloader = () => {
  const [isMobile, setIsMobile] = useState(null);
  const containerRef = useRef(null);

useLayoutEffect(() => {
  const mediaQuery = window.matchMedia("(max-width: 768px)");

  const updateViewport = () => {
    setIsMobile(mediaQuery.matches);
  };

  updateViewport();

  mediaQuery.addEventListener("change", updateViewport);

  return () => {
    mediaQuery.removeEventListener("change", updateViewport);
  };
}, []); 

const lines = isMobile
    ? [
        {
          id: "mobile",
          text: "We are committed to setting the highest standard through exceptional service. That commitment is supported by our use of state-of-the-art technology and strengthened by the expertise that comes from unmatched experience",
          top: 0,
        },
      ]
    : [
        {
          id: 1,
          text: "We are committed to setting the highest standard through exceptional service",
          top: 0,
        },
        {
          id: 2,
          text: "That commitment is supported by our use of state-of-the-art technology",
          top: 20,
        },
        {
          id: 3,
          text: "And strengthened by the expertise that comes from unmatched experience",
          top: 40,
        },
      ];

  const MAX_CELL_ITERATIONS = 30;
  const CELL_INTERVAL = 20;
  const LINE_DELAY = 180;

useLayoutEffect(() => {
  if (isMobile === null) return;

  const container = containerRef.current;
  if (!container) return;

  let frameId;
  let startTimeout;
  let cancelled = false;

  const cellElements = Array.from(
    container.querySelectorAll(".terminal-cell")
  );

  const cells = cellElements.map((cellElement) => ({
    element: cellElement,
    original: cellElement.dataset.character ?? "",
    signal: "",
    iterations: 0,
    finished: false,
  }));

  const renderCell = (cell, value) => {
    if (cell.original === " ") {
      cell.element.textContent = " ";
      return;
    }

    cell.element.textContent = value || "\u00A0";
  };


  cells.forEach((cell) => {
    cell.signal = "";
    cell.iterations = 0;
    cell.finished = false;
    renderCell(cell, "");
  });

  const previousSignals = new Array(cells.length);

  const startAnimation = () => {
    if (cancelled) return;

    let lastStepTime = performance.now();

    const tick = (now) => {
      if (cancelled) return;

      if (now - lastStepTime >= CELL_INTERVAL) {
        lastStepTime = now;

        for (let i = 0; i < cells.length; i++) {
          previousSignals[i] = cells[i].signal;
        }

        for (let index = 0; index < cells.length; index++) {
          const cell = cells[index];

          const nextSignal =
            index === 0
              ? Math.random() < 0.5
                ? "*"
                : ":"
              : previousSignals[index - 1];

          cell.signal = nextSignal;

          if (cell.finished) continue;

          renderCell(cell, nextSignal);

          if (nextSignal) {
            cell.iterations += 1;
          }

          if (cell.iterations >= MAX_CELL_ITERATIONS) {
            cell.finished = true;
            cell.element.textContent = cell.original;
          }
        }
      }

      const allFinished = cells.every((cell) => cell.finished);

      if (!allFinished) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
  };

  startTimeout = window.setTimeout(startAnimation, 700);

  return () => {
    cancelled = true;
    window.clearTimeout(startTimeout);

    if (frameId) {
      cancelAnimationFrame(frameId);
    }
  };
}, [isMobile]);

  const renderLine = (line) => {
    const words = line.text.split(" ");
    let characterPosition = 0;

    return words.map((word, wordIndex) => {
      const wordCharacters = Array.from(word);

      const renderedWord = (
        <span
          key={`${line.id}-word-${wordIndex}`}
          className="terminal-word"
        >
          {wordCharacters.map((character) => {
            const position = characterPosition;
            characterPosition += 1;

            return (
              <span
                key={`${line.id}-${position}`}
                className="terminal-cell"
                data-character={character}
                aria-hidden="true"
              >
                {character}
              </span>
            );
          })}
        </span>
      );

      if (wordIndex === words.length - 1) {
        return renderedWord;
      }

      const spacePosition = characterPosition;
      characterPosition += 1;

      return (
        <React.Fragment key={`${line.id}-group-${wordIndex}`}>
          {renderedWord}

          <span
            className="terminal-cell terminal-space"
            data-character=" "
            aria-hidden="true"
            key={`${line.id}-${spacePosition}`}
          >
            {" "}
          </span>
        </React.Fragment>
      );
    });
  };
if (isMobile === null) {
  return (
    <div className="terminal-preloader">
      <div className="terminal-container" />
    </div>
  );
}
  return (
    <div className="terminal-preloader">
      <div ref={containerRef} className="terminal-container">
        {lines.map((line) => (
          <div
            key={line.id}
            className="terminal-line"
            style={{ top: `${line.top}px` }}
            aria-label={line.text}
          >
            {renderLine(line)}
          </div>
        ))}
      </div>
    </div>
  );
};

const testimonials = [
  {
    name: "Lainie",
    image: "../images/testimonials/lainielandscape.png",
    type: "20 months",
    project: "Lainie",
  },
  {
    name: "James",
    image: "../images/testimonials/jamescontrast.png",
    type: "20 months",
    project: "Sabrinas",
  },
  {
    name: "Ron L.",
    image: "../images/testimonials/Ronlandscape.png",
    type: "Invisalign",
    project: "Ron L.",
  },
  {
    name: "Elizabeth",
    image: "../images/testimonials/elizabethmask.png",
    type: "Invisalign",
    project: "Elizabeth",
  },
  {
    name: "Kinzie",
    image: "../images/testimonials/kinzie.jpg",
    type: "Braces, 24 months",
    project: "Kinzie",
  },
  {
    name: "Kasprenski",
    image: "../images/testimonials/Kasprenski.png",
    type: undefined,
    project: "Kasprenski",
  },
  {
    name: "Leanne",
    image: "../images/testimonials/Leannelandscape.png",
    type: "12 months",
    project: "Leanne",
  },
  {
    name: "Harold",
    image: "../images/testimonials/harold.png",
    type: "Invisalign",
    project: "Harold",
  },
  {
    name: "Abigail",
    image: "../images/testimonials/Abigailportrait.png",
    type: undefined,
    project: "Abigail",
  },
  {
    name: "Madi",
    image: "../images/testimonials/Madi.png",
    type: "",
    project: "Madi",
  },
  {
    name: "Justin",
    image: "../images/testimonials/hurlburt.png",
    type: "Invisalign, 2 years",
    project: "Justin",
  },
  {
    name: "Natalia",
    image: "../images/testimonials/Natalia.png",
    type: undefined,
    project: "Natalia",
  },
  {
    name: "Breanna",
    image: "../images/testimonials/Breanna.png",
    type: "2 years, Braces",
    project: "Breanna",
  },
  {
    name: "Ibis",
    image: "../images/testimonials/Ibis_Subero.jpg",
    type: undefined,
    project: "Ibis",
  },
  {
    name: "Natasha",
    image: "../images/testimonials/Natasha.png",
    type: undefined,
    project: "Natasha",
  },
  {
    name: "Alex",
    image: "../images/testimonials/Alex.png",
    type: "2 years, Braces",
    project: "Alex",
  },
  {
    name: "Nicolle",
    image: "../images/testimonials/Nicolle.png",
    type: "Braces",
    project: "Nilaya",
  },
  {
    name: "Maria A.",
    image: "../images/testimonials/Maria.png",
    type: undefined,
    project: "Maria A.",
  },
];

const List = ({ onInteractionChange }) => {
  const testimonialsSectionRef = useRef(null);
  const testimonialsListRef = useRef(null);
  const testimonialPreviewRef = useRef(null);
  const lastStackedIndex = useRef(null);
  const testimonialRefs = useRef([]);
  const nameRefs = useRef([]);
  const typeRefs = useRef([]);
  const nameHighlightRefs = useRef([]);
  const typeHighlightRefs = useRef([]);
  const outroRef = useRef(null);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const activeTestimonial = useRef(null);
  const zCounter = useRef(1);
  const ticking = useRef(false);
  const isHovering = useRef(false);
  const lastScrollActive = useRef(null);
  const highlighterColors = ["neon", "pink", "green"];
  const scrollTicking = useRef(false);

  const scrambleText = (idx) => {
    const scramble = {
      characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      speed: 0.8,
      newChars: 0.3,
      revealDelay: 0,
      tweenLength: true,
    };

    const testimonialData = testimonials[idx];

    if (nameRefs.current[idx]) {
      gsap.to(nameRefs.current[idx], {
        duration: 1.5,
        ease: "power2.out",
        scrambleText: { text: testimonialData.name, ...scramble },
      });
    }

    if (typeRefs.current[idx] && testimonialData.type) {
      gsap.to(typeRefs.current[idx], {
        duration: 1.5,
        ease: "power2.out",
        scrambleText: { text: testimonialData.type, ...scramble },
      });
    }
  };

  const getRandomColorClass = () => {
    const colors = highlighterColors;
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const highlightText = (idx, activate = true) => {
    if (nameHighlightRefs.current[idx]) {
      const nameEl = nameHighlightRefs.current[idx];
      if (activate) {
        const colorClass = getRandomColorClass();
        nameEl.classList.add("active", colorClass);
        nameEl.dataset.color = colorClass;
      } else {
        nameEl.classList.remove("active", "neon", "pink", "green");
        delete nameEl.dataset.color;
      }
    }

    if (typeHighlightRefs.current[idx] && testimonials[idx].type) {
      const typeEl = typeHighlightRefs.current[idx];
      if (activate) {
        const colorClass =
          nameHighlightRefs.current[idx]?.dataset.color ||
          getRandomColorClass();
        typeEl.classList.add("active", colorClass);
      } else {
        typeEl.classList.remove("active", "neon", "pink", "green");
      }
    }
  };

  const stackImage = (index, source = "scroll") => {
    const container = testimonialPreviewRef.current;
    const data = testimonials[index];
    if (!container || !data?.image) return;

    if (lastStackedIndex.current === index) return;

    const mask = document.createElement("div");
    mask.className = "preview-mask";

    const img = document.createElement("img");
    img.src = data.image;

    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.transform = "scale(0)";
    img.style.transformOrigin = "center center";
    img.style.zIndex = zCounter.current++;

    img.style.clipPath = `
      polygon(
        16px 0%,
        calc(100% - 16px) 0%,
        calc(100% - 16px) 16px,
        calc(100% - 16px) 32px,
        100% 32px,
        100% calc(100% - 48px),
        calc(100% - 16px) calc(100% - 48px),
        calc(100% - 16px) calc(100% - 32px),
        100% calc(100% - 32px),
        100% calc(100% - 16px),
        calc(100% - 16px) calc(100% - 16px),
        calc(100% - 32px) calc(100% - 16px),
        calc(100% - 32px) calc(100% - 32px),
        calc(100% - 16px) calc(100% - 32px),
        calc(100% - 16px) 100%,
        0% 100%,
        0% 16px,
        16px 16px
      )
    `;
    mask.appendChild(img);
    container.appendChild(mask);

    gsap.to(img, {
      scale: 1,
      duration: 0.35,
      ease: "power2.out",
    });

    const images = container.querySelectorAll("img");
    if (images.length > 6) images[0].remove();

    lastStackedIndex.current = index;
  };

  const isTestimonialsListActive = () => {
    const list = testimonialsListRef.current;
    if (!list) return false;

    const rect = list.getBoundingClientRect();

    const activeTop = window.innerHeight * 0.75;
    const activeBottom = window.innerHeight * 0.25;

    return rect.top < activeTop && rect.bottom > activeBottom;
  };

  const updatePreviewOnScroll = () => {
    if (!isTestimonialsListActive()) {
      clearPreview();
      return;
    }
    if (isHovering.current) return;

    const sectionTop = testimonialsSectionRef.current.offsetTop;
    const centerY = window.scrollY + window.innerHeight / 2 - sectionTop;

    let closestIndex = null;
    let closestDistance = Infinity;

    rowCenters.current.forEach((rowCenter, index) => {
      if (!rowCenter) return;
      const distance = Math.abs(rowCenter - centerY);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (
      closestIndex !== null &&
      closestIndex !== lastScrollActive.current &&
      closestDistance < 120
    ) {
      if (lastScrollActive.current !== null) {
        highlightText(lastScrollActive.current, false);
      }
      highlightText(closestIndex, true);
      stackImage(closestIndex, "scroll");

      lastScrollActive.current = closestIndex;
    }
  };

  const mouseTicking = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      lastMousePosition.current.x = e.clientX;
      lastMousePosition.current.y = e.clientY;

      if (!isHovering.current) return;

      if (!mouseTicking.current) {
        requestAnimationFrame(() => {
          mouseTicking.current = false;
        });
        mouseTicking.current = true;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!isTestimonialsVisible()) {
        const images = testimonialPreviewRef.current?.querySelectorAll("img");
        images?.forEach((img) => {
          gsap.killTweensOf(img);
          gsap.to(img, {
            scale: 0,
            opacity: 0,
            duration: 0.35,
            ease: "power2.inOut",
            onComplete: () => img.remove(),
          });
        });

        lastStackedIndex.current = null;
        zCounter.current = 1;

        activeTestimonial.current = null;
        isHovering.current = false;
        lastScrollActive.current = null;

        testimonials.forEach((_, index) => {
          highlightText(index, false);
        });

        return;
      }

      if (!scrollTicking.current) {
        requestAnimationFrame(() => {
          updatePreviewOnScroll();
          scrollTicking.current = false;
        });
        scrollTicking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    testimonialRefs.current.forEach((testimonial, index) => {
      if (!testimonial) return;

      const enter = () => {
        activeTestimonial.current = index;
        isHovering.current = true;

        lastStackedIndex.current = null;

        highlightText(index, true);
        scrambleText(index);
        stackImage(index, "hover");
      };

      const leave = () => {
        activeTestimonial.current = null;
        isHovering.current = false;

        highlightText(index, false);

        lastStackedIndex.current = null;
      };
      testimonial.addEventListener("mouseenter", enter);
      testimonial.addEventListener("mouseleave", leave);

      return () => {
        testimonial.removeEventListener("mouseenter", enter);
        testimonial.removeEventListener("mouseleave", leave);
      };
    });
  }, []);

  const rowCenters = useRef([]);
  useEffect(() => {
    const computeCenters = () => {
      rowCenters.current = testimonialRefs.current.map((el) =>
        el ? el.offsetTop + el.offsetHeight / 2 : null,
      );
    };

    computeCenters();
    window.addEventListener("resize", computeCenters);
    return () => window.removeEventListener("resize", computeCenters);
  }, []);

  const isTestimonialsVisible = () => {
    if (!testimonialsSectionRef.current) return false;

    const rect = testimonialsSectionRef.current.getBoundingClientRect();

    return rect.bottom > 0 && rect.top < window.innerHeight;
  };

  const clearPreview = () => {
    const images =
      testimonialPreviewRef.current?.querySelectorAll("img");

    images?.forEach((img) => {
      gsap.killTweensOf(img);

      gsap.to(img, {
        scale: 0.8,
        opacity: 0,
        duration: 0.18,
        ease: "power2.in",
        overwrite: true,
        onComplete: () => img.remove(),
      });
    });

    lastStackedIndex.current = null;
    lastScrollActive.current = null;
    zCounter.current = 1;
  };

  useEffect(() => {
    const list = testimonialsListRef.current;
    if (!list) return;

    const trigger = ScrollTrigger.create({
      trigger: list,
      start: "top 75%",
      end: "bottom 25%",

      onLeave: clearPreview,
      onLeaveBack: clearPreview,

      onEnter: updatePreviewOnScroll,
      onEnterBack: updatePreviewOnScroll,
    });

    return () => trigger.kill();
  }, []);

  useEffect(() => {
    if (!testimonialsSectionRef.current || !onInteractionChange) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        onInteractionChange(entry.isIntersecting);
      },
      {
        threshold: 0.4,
      },
    );

    observer.observe(testimonialsSectionRef.current);

    return () => observer.disconnect();
  }, [onInteractionChange]);

  useEffect(() => {
    const quotes = gsap.utils.toArray(".SplitText-Reveal")

    function setupSplits() {
      quotes.forEach((quote) => {
        if (quote.anim) {
          quote.anim.progress(1).kill()
          quote.split.revert()
        }

        quote.split = SplitText.create(quote, {
          type: "words, chars",
          linesClass: "split-line",
        })

        quote.anim = gsap.from(quote.split.chars, {
          scrollTrigger: {
            trigger: quote,
            toggleActions: "restart pause resume reverse",
            start: "center center",
          },
          duration: 0.6,
          ease: "power2.in",
          y: 10,
          opacity: 0.3,
          stagger: 0.02,
        })
      })
    }

    setupSplits()
    ScrollTrigger.addEventListener("refresh", setupSplits)
    
    return () => {
      ScrollTrigger.removeEventListener("refresh", setupSplits)
      quotes.forEach((quote) => {
        quote.anim?.kill()
        quote.split?.revert()
      })
      ScrollTrigger.refresh()
    }
  }, [])

  return (
    <div className="testimonialsPage">
      <section className="intro relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <JanusFace />
        </div>

        <div className="relative max-w-[1400px] mx-auto w-full flex flex-col md:flex-row">
          <div className="hidden md:block md:w-1/2 min-h-screen" />

          <div className="w-full md:w-1/2 min-h-screen flex items-center justify-center px-6 md:px-0">
            <div className="max-w-[1200px] w-full">
              <div>
                <TerminalPreloader />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="testimonials" ref={testimonialsSectionRef}>
        <div className="flex flex-col items-center text-center mb-10 gap-1">
          <div className="SplitText-Reveal flex font-neuehaas35 text-[22px] gap-2 text-[#e30ad8]">
            Select Cases
          </div>

          <span className="SplitText-Reveal text-[18px] font-canela italic text-[#e30ad8] opacity-60">
            A visual archive of selected treatment outcomes
          </span>
        </div>
        <div className="flex items-center justify-between w-full">
          <span className="inline-block w-3 h-3 transition-transform duration-300 ease-in-out hover:rotate-180">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 13 12"
              fill="none"
              className="w-full h-full"
            >
              <path
                d="M0.5 6.46154V5.53846H6.03846V0H6.96154V5.53846H12.5V6.46154H6.96154V12H6.03846V6.46154H0.5Z"
                fill="#000"
              />
            </svg>
          </span>

          <div className="flex-1 mx-2 border-b border-[#595252]/20"></div>
          <span className="inline-block w-3 h-3 transition-transform duration-300 ease-in-out hover:rotate-180">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 13 12"
              fill="none"
              className="w-full h-full"
            >
              <path
                d="M0.5 6.46154V5.53846H6.03846V0H6.96154V5.53846H12.5V6.46154H6.96154V12H6.03846V6.46154H0.5Z"
                fill="#000"
              />
            </svg>
          </span>
        </div>
        <div className="testimonials-list" ref={testimonialsListRef}>
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="testimonial"
              ref={(el) => (testimonialRefs.current[index] = el)}
            >
              <div className="testimonial-content">
                <div className="testimonial-name">
                  <span
                    className="highlighted-text col-left"
                    ref={(el) => (nameHighlightRefs.current[index] = el)}
                  >
                    <h1 ref={(el) => (nameRefs.current[index] = el)}>
                      {testimonial.name}
                    </h1>
                  </span>
                  <span
                    className="highlighted-text col-right"
                    ref={(el) => (typeHighlightRefs.current[index] = el)}
                  >
                    <h1 ref={(el) => (typeRefs.current[index] = el)}>
                      {testimonial.type || ""}
                    </h1>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div ref={outroRef} className="testimonials-outro-spacer" />
      <div className="testimonial-preview" ref={testimonialPreviewRef} />
    </div>
  );
};

const reviews = [
  {
    name: "James Pica",
    text: "Frey Smiles has made the whole process from start to finish incredibly pleasant and sooo easy on my kids to follow. They were able to make a miracle happen with my son's tooth that was coming in sideways. He now has a perfect smile and I couldn't be happier. My daughter is halfway through her treatment and the difference already has been great. I 100% recommend this place to anyone!!!",
    color: "bg-[#9482A3]",
    image: "/images/_mesh_gradients/lightblue.png",

    height: "h-[320px]",
    width: "w-[320px]",
  },
  {
    name: "Thomas StPierre",
    text: "I had a pretty extreme case and it took some time, but FreySmiles gave me the smile I had always hoped for. Thank you!",
    color: "bg-[#EB7104]",
    image: "/images/_mesh_gradients/purplegrey.png",
    height: "h-[240px]",
    width: "w-[240px]",
  },
  {
    name: "Fei Zhao",
    text: "Our whole experience for the past 10 years of being under Dr. Gregg Frey’s care and his wonderful staff has been amazing. My son and my daughter have most beautiful smiles, and they received so many compliments on their teeth. It has made a dramatic and positive change in their lives. Dr. Frey is a perfectionist, and his treatment is second to none. I recommend Dr. Frey highly and without any reservation.",
    color: "bg-[#80A192]",
    image: "/images/_mesh_gradients/pantonepinkblue.png",
    height: "h-[320px]",
    width: "w-[320px]",
  },
  {
    name: "Shelby Loucks",
    text: "THEY ARE AMAZING!! Great staff and wonderful building. HIGHLY recommend to anyone looking for an orthodontist.",
    color: "bg-[#A81919]",
    image: "/images/_mesh_gradients/LilyWhite.jpg",

    height: "h-[240px]",
    width: "w-[240px]",
  },
  {
    name: "Diana Gomez",
    text: "After arriving at my sons dentist on a Friday, his dentist office now informs me that they don’t have a referral. I called the Frey smiles office when they were closed and left a message. I received a call back within minutes from Dr. Frey himself who sent the referral over immediately ( on his day off!!!) how amazing! Not to mention the staff was amazing when were were there and my children felt so comfortable! Looking forward to a wonderful smile for my son!!",
    color: "bg-[#F3B700]",
    image: "/images/_mesh_gradients/pinkwhite.png",
    height: "h-[320px]",
    width: "w-[320px]",
  },
  {
    name: "Tracee Benton",
    text: "Dr. Frey and his orthodontist techs are the absolute best! The team has such an attention to detail I absolutely love my new smile and my confidence has significantly grown! The whole process of using Invisalign has been phenomenal. I highly recommend Dr. Frey and his team to anyone considering orthodontic work!",
    color: "bg-[#036523]",
    image: "/images/_mesh_gradients/purpledred.png",
  },
  {
    name: "Brandi Moyer",
    text: "My experience with Dr. Frey orthodontics has been nothing but great. The staff is all so incredibly nice and willing to help. And better yet, today I found out I may be ahead of my time line to greater aligned teeth!.",
    color: "bg-[#4C90B3]",
    image: "/images/_mesh_gradients/purpleyellow.png",
  },

  {
    name: "Andrew Cornell",
    text: "Over 20 years ago, I went to Dr. Frey to fix my cross bite and get braces. Since then, my smile looks substantially nicer. My entire mouth feels better as well. The benefits of orthodontics under Dr. Frey continue paying dividends.",
    color: "bg-[#56A0FC]",
    image: "/images/_mesh_gradients/greenwhite.png",
  },

  {
    name: "Vicki Weaver",
    text: "We have had all four of our children receive orthodontic treatment from Dr. Frey. Dr. Frey is willing to go above and beyond for his patients before, during, and after the treatment is finished. It shows in their beautiful smiles!! We highly recommend FreySmiles to all of our friends and family!",
    color: "bg-[#EA9CBE]",
    image: "/images/_mesh_gradients/blueyellowgradient.png",
  },

  {
    name: "Sara Moyer",
    text: "We are so happy that we picked Freysmiles in Lehighton for both of our girls Invisalign treatment. Dr. Frey and all of his staff are always so friendly and great to deal with. My girls enjoy going to their appointments and love being able to see the progress their teeth have made with each tray change. We are 100% confident that we made the right choice when choosing them as our orthodontist!",
    image: "/images/_mesh_gradients/turquoisegradient.png",
    height: "h-[320px]",
    width: "w-[320px]",
  },

  {
    name: "Mandee Kaur",
    image: "/images/_mesh_gradients/pinkparty.png",
    text: "I would highly recommend FreySmiles! Excellent orthodontic care, whether it’s braces or Invisalign, Dr. Frey and his team pay attention to detail in making sure your smile is flawless! I would not trust anyone else for my daughter’s care other than FreySmiles.",
    color: "bg-[#49ABA3]",
  },
];

class BentRoundedPlaneGeometry extends geometry.RoundedPlaneGeometry {
  constructor(
    bend = 0.1,
    width = 1,
    height = 1,
    cornerRadius = 0.12,
    segments = 20,
  ) {
    super(width, height, cornerRadius, segments);

    const halfWidth = width * 0.5;

    const a = new THREE.Vector2(-halfWidth, 0);
    const b = new THREE.Vector2(0, bend);
    const c = new THREE.Vector2(halfWidth, 0);

    const ab = new THREE.Vector2().subVectors(a, b);
    const bc = new THREE.Vector2().subVectors(b, c);
    const ac = new THREE.Vector2().subVectors(a, c);

    const circleRadius =
      (ab.length() * bc.length() * ac.length()) / (2 * Math.abs(ab.cross(ac)));

    const center = new THREE.Vector2(0, bend - circleRadius);
    const baseVector = new THREE.Vector2().subVectors(a, center);
    const baseAngle = baseVector.angle() - Math.PI * 0.5;
    const arc = baseAngle * 2;

    const position = this.attributes.position;
    const mainVector = new THREE.Vector2();

    for (let i = 0; i < position.count; i++) {
      const originalX = position.getX(i);
      const originalY = position.getY(i);

      const ratio = 1 - (originalX + halfWidth) / width;

      mainVector.copy(c).rotateAround(center, arc * ratio);

      position.setXYZ(i, mainVector.x, originalY, -mainVector.y);
    }

    position.needsUpdate = true;

    this.computeVertexNormals();
    this.computeBoundingBox();
    this.computeBoundingSphere();
  }
}
class MeshSineMaterial extends THREE.MeshBasicMaterial {
  constructor(parameters = {}) {
    super(parameters);
    this.setValues(parameters);
    this.time = { value: 0 };
  }
  onBeforeCompile(shader) {
    shader.uniforms.time = this.time;
    shader.vertexShader = `
      uniform float time;
      ${shader.vertexShader}
    `;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `vec3 transformed = vec3(position.x, position.y + sin(time + uv.x * PI * 4.0) / 4.0, position.z);`,
    );
  }
}

extend({ MeshSineMaterial, BentRoundedPlaneGeometry });

const CarouselComponent = () => (
  <div className="carousel-canvas">
    <Canvas camera={{ position: [0, 0, 100], fov: 15 }}>
      <ResponsiveCamera />

      <ScrollControls pages={2}>
        <Rig rotation={[0, 0, 0.15]}>
          <ResponsiveCarousel />
        </Rig>

        <ResponsiveBanner />
      </ScrollControls>
    </Canvas>
  </div>
);

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const isSmallMobile = size.width < 480;
    const isMobile = size.width < 768;

camera.fov = isSmallMobile ? 16 : isMobile ? 16 : 15;
    camera.updateProjectionMatrix();
  }, [camera, size.width]);

  return null;
}

function Rig(props) {
  const ref = useRef();
  const scroll = useScroll();
  const { size } = useThree();

  useFrame((state, delta) => {
    if (!ref.current) return;

    const isMobile = size.width < 768;

    ref.current.rotation.y = -scroll.offset * Math.PI * 2;

    state.events.update();

    if (isMobile) {
      easing.damp3(
        state.camera.position,
        [0, 1, 12],
        0.3,
        delta,
      );
    } else {
      easing.damp3(
        state.camera.position,
        [
          -state.pointer.x * 2,
          state.pointer.y + 1.5,
          10,
        ],
        0.3,
        delta,
      );
    }

    state.camera.lookAt(0, 0, 0);
  });

  return <group ref={ref} {...props} />;
}

function Carousel({ radius = 1.9 }) {
  const count = reviews.length;

  return reviews.map((review, i) => (
    <Card
      key={`${review.name}-${i}`}
      url={review.image}
      name={review.name}
      text={review.text}
      position={[
        Math.sin((i / count) * Math.PI * 2) * radius,
        0,
        Math.cos((i / count) * Math.PI * 2) * radius,
      ]}
      rotation={[0, Math.PI + (i / count) * Math.PI * 2, 0]}
    />
  ));
}
function ResponsiveCarousel() {
  const { size } = useThree();

  const isMobile = size.width < 768;
  const isSmallMobile = size.width < 480;

  const radius = isSmallMobile ? 1.85 : isMobile ? 1.95 : 1.9;

  return <Carousel radius={radius} />;
}

function drawTileOverlay(ctx, width, height) {
  ctx.save();

  ctx.fillStyle = "rgba(255, 255, 255, 0.24)";
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    width * 0.3,
    height * 0.2,
    0,
    width * 0.3,
    height * 0.2,
    width * 0.65,
  );

  glow.addColorStop(0, "rgba(255,255,255,0.28)");
  glow.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const tileSize = 150;

  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      const even = (x / tileSize + y / tileSize) % 2 === 0;

      ctx.fillStyle = even
        ? "rgba(255,255,255,0.18)"
        : "rgba(255,255,255,0.055)";

      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }

  ctx.restore();
}
function useCardTexture(imageUrl, name, reviewText) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let canvasTexture;

    const createTexture = async () => {
      await document.fonts.load('italic 44px "Canela"');
      await document.fonts.load('italic 30px "Canela"');

      const image = new window.Image();

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () =>
          reject(new Error(`Could not load image: ${imageUrl}`));

        image.src = imageUrl;
      });

      if (cancelled) return;

      const canvas = document.createElement("canvas");
      canvas.width = 2048;
      canvas.height = 2048;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not create canvas context");
      }

      ctx.save();

      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      ctx.save();
      
const isMobile = window.innerWidth < 768;

ctx.save();

ctx.filter = isMobile
  ? "blur(32px)"
  : "blur(64px)";

ctx.drawImage(
  image,
  -30,
  -30,
  canvas.width + 60,
  canvas.height + 60
);

ctx.restore();

drawTileOverlay(ctx, canvas.width, canvas.height);

ctx.textAlign = "center";
ctx.textBaseline = "middle";

ctx.fillStyle = "#000";
ctx.font = isMobile
  ? 'italic 98px "Canela"'
  : 'italic 88px "Canela"';

ctx.fillText(
  name,
  canvas.width / 2,
  isMobile ? 380 : 360
);

ctx.fillStyle = "#000";
ctx.font = isMobile
  ? 'italic 84px "Canela"'
  : 'italic 88px "Canela"';

drawWrappedText({
  ctx,
  text: reviewText,
  x: canvas.width / 2,
  y: isMobile ? 690 : 650,
  maxWidth: isMobile ? 1550 : 1450,
  lineHeight: isMobile ? 94 : 86,
  maxLines: 13,
});

canvasTexture = new THREE.CanvasTexture(canvas);
canvasTexture.colorSpace = THREE.SRGBColorSpace;
canvasTexture.anisotropy = 16;
canvasTexture.needsUpdate = true;

if (!cancelled) {
  setTexture(canvasTexture);
}
    };

    createTexture().catch((error) => {
      console.error(`Texture failed for "${name}"`, {
        imageUrl,
        error,
      });
    });

    return () => {
      cancelled = true;
      canvasTexture?.dispose();
    };
  }, [imageUrl, name, reviewText]);

  return texture;
}
function drawWrappedText({ ctx, text, x, y, maxWidth, lineHeight, maxLines }) {
  const words = text.split(/\s+/);
  const lines = [];

  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    const width = ctx.measureText(testLine).width;

    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;

      if (lines.length === maxLines - 1) {
        break;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  const renderedText = lines.join(" ");
  if (renderedText.length < text.length && lines.length) {
    lines[lines.length - 1] =
      `${lines[lines.length - 1].replace(/[.,;:!?]$/, "")}…`;
  }

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}
function Card({ url, name, text, ...props }) {
  const texture = useCardTexture(url, name, text);
  const { size } = useThree();

  if (!texture) return null;

  const isMobile = size.width < 768;
  const cardSize = isMobile ? 0.9 : 1;

  return (
    <group {...props}>
      <mesh>
        <bentRoundedPlaneGeometry args={[0.1, cardSize, cardSize, 0.12, 20]} />

        <meshBasicMaterial
          map={texture}
          transparent
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function Banner({ depthTest = true, depthWrite = true, ...props }) {
  const ref = useRef();
  const texture = useTexture("/images/fslogostrip.png");

  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 16;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const scroll = useScroll();

  useFrame((state, delta) => {
    if (!ref.current) return;

    ref.current.material.time.value += Math.abs(scroll.delta) * 4;
    ref.current.material.map.offset.x += delta / 2;
  });

  return (
    <mesh ref={ref} {...props}>
      <cylinderGeometry args={[2.1, 2.1, 0.18, 128, 16, true]} />

      <meshSineMaterial
        map={texture}
        map-anisotropy={16}
        map-repeat={[18, 1]}
        side={THREE.DoubleSide}
        toneMapped={false}
        depthTest={depthTest}
        depthWrite={depthWrite}
      />
    </mesh>
  );
}
function ResponsiveBanner() {
  const { size } = useThree();

  const isMobile = size.width < 768;
  const isSmallMobile = size.width < 480;

  const carouselRadius = isSmallMobile
    ? 1.85
    : isMobile
      ? 1.95
      : 1.9;

  const bannerRadius = carouselRadius + 0.2;

  return (
    <Banner
      radius={bannerRadius}
      position={[0, isMobile ? -0.1 : -0.15, 0]}
      depthTest
      depthWrite
    />
  );
}

function JanusFace() {
  const [leftShapes, setLeftShapes] = useState([]);
  const [rightShapes, setRightShapes] = useState([]);

  const symbols = [
    "□", "▢", "▭", "▯",
    "○", "◯", "◌",
    "△", "▽", "▷", "◁",
    "◇", "◊",
    "◅", "▻",
  ];

  const r = (from, to) => Math.random() * (to - from) + from;
  const ri = (from, to) => ~~r(from, to);
  const pick = (...args) => args[ri(0, args.length)];

  const generateText = (length = 60, rowIndex = 0, isMobile = false) => {
    return Array.from({ length }, (_, i) => {
      const shouldBlink =
        !isMobile && (i + rowIndex) % 4 === 0;
      return (
        <span
          key={i}
          className={shouldBlink ? "symbol symbol-blink" : "symbol"}
          style={
            shouldBlink
              ? {
                  "--blink-delay": `${
                    (i * 0.09 + rowIndex * 0.17) % 4
                  }s`,
                  "--blink-duration": `${
                    3.5 + ((i + rowIndex) % 4) * 0.4
                  }s`,
                }
              : undefined
          }
        >
          {pick(...symbols)}
        </span>
      );
    });
  };
const generateBaseParagraphs = (isMobile = false) => {
  const paragraphs = [];

  const rowCount = 50;

  for (let i = 0; i < rowCount; i++) {
    const offset = r(45, 95);
const t = i / (rowCount - 1);
const shade = Math.round(175 + t * 80);
const color = `rgb(${shade}, ${shade}, ${shade})`;

    const textLength = isMobile ? ri(18, 34) : ri(25, 95);

    paragraphs.push({
      offset,
      color,
      textLength,
      key: i,
    });
  }

  return paragraphs;
};
  const build = () => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    const baseData = generateBaseParagraphs(isMobile);

    const leftParas = baseData.map((data, i) => (
      <div
        key={i}
        className="text-line"
        style={{
          "--offset": data.offset,
          color: data.color,
          textAlign: "left",
          mask: `linear-gradient(
          to right,
          #fff,
          transparent calc(var(--offset) * 1%)
        )`,
        }}
      >
        {generateText(data.textLength, i, isMobile)}
      </div>
    ));

    const rightParas = baseData.map((data, i) => (
      <div
        key={`r${i}`}
        className="text-line"
        style={{
          "--offset": data.offset,
          color: data.color,
          textAlign: "right",
          mask: `linear-gradient(
          to left,
          #fff,
          transparent calc(var(--offset) * 1%)
        )`,
        }}
      >
        {generateText(data.textLength, i, isMobile)}
      </div>
    ));

    setLeftShapes(leftParas);
    setRightShapes(rightParas);
  };

  useEffect(() => {
    build();
  }, []);

  const shapePath =
    "0.25% 2px, 99.94% 0.27%, 99.75% 100%, 19.87% 100.03%, 0 100%, 30.61% 100.07%, 37.38% 99.82%, 44.21% 99.38%, 50.92% 99.34%, 71.39% 98.43%, 76.61% 98.79%, 82.65% 97.6%, 85.9% 95.73%, 90.12% 93.85%, 88.45% 89.91%, 87.41% 87.1%, 85.48% 85.09%, 84.96% 82.33%, 88.66% 81.41%, 90.55% 79.29%, 91.75% 77.23%, 91.23% 75.11%, 88.48% 73.75%, 90.93% 72.26%, 92.34% 70.16%, 91.59% 67.66%, 89.87% 64.91%, 87.01% 63.42%, 89.87% 62.01%, 93.04% 60.71%, 96.53% 58.57%, 97.8% 55.26%, 95.36% 53.2%, 91.46% 51.56%, 86.6% 49.21%, 83.43% 47%, 79.27% 44.12%, 77.05% 40.66%, 75.51% 37.07%, 75.49% 33.04%, 76.3% 28.93%, 75.99% 25.46%, 74.57% 22.25%, 72.88% 18.96%, 69.97% 15.51%, 66.59% 12.23%, 62.29% 9.2%, 57.33% 7.06%, 52.77% 5.2%, 46.55% 3.55%, 38.59% 1.5%, 27.73% 0.92%";

  const mirrorPolygon = (poly) => {
    return poly
      .split(",")
      .map((pt) => pt.trim())
      .map((pt) => {
        const [xRaw, y] = pt.split(/\s+/);
        const xPercent = parseFloat(xRaw);
        const mirroredX = (100 - xPercent).toFixed(2) + "%";
        return `${mirroredX} ${y}`;
      })
      .join(", ");
  };

  const leftShapePath = mirrorPolygon(shapePath);

  return (
    <div className="janus-main" onClick={build} style={{ cursor: "pointer" }}>
      <div className="janus-container">
        {/* Left Face */}
        <div className="face-container left-face">
          <div
            className="janus-shape left-shape"
            style={{ shapeOutside: `polygon(${leftShapePath})` }}
          />
          <div className="text-container left-text">{leftShapes}</div>
        </div>

        {/* Right Face */}
        <div className="face-container right-face">
          <div
            className="janus-shape right-shape"
            style={{ shapeOutside: `polygon(${shapePath})` }}
          />
          <div className="text-container right-text">{rightShapes}</div>
        </div>
      </div>
    </div>
  );
}

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

const Testimonials = () => {
  const cardsRef = useRef(null);
  const bannerRef = useRef(null);
  const textRef = useRef(null);
  const bgTextColor = "#CECED3";
  const fgTextColor = "#161818";

  const [disableFluid, setDisableFluid] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    if (!textRef.current) return;

    const split = new SplitText(textRef.current, { type: "words, chars" });

    gsap.fromTo(
      split.chars,
      { color: bgTextColor },
      {
        color: fgTextColor,
        stagger: 0.03,
        duration: 1,
        ease: "power2.out",
      },
    );

    return () => split.revert();
  }, []);



  const listRefs = useRef([]);

  useEffect(() => {
    listRefs.current.forEach((el, i) => {
      gsap.fromTo(
        el,
        { filter: "blur(8px)", opacity: 0 },
        {
          filter: "blur(0px)",
          opacity: 1,
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
          duration: 0.6,
          ease: "power2.out",
        },
      );
    });
  }, []);

  useEffect(() => {
    const lines = gsap.utils.toArray("#smile-scroll-section .line");

    lines.forEach((line, index) => {
      const direction = index % 2 === 0 ? -1 : 1;

      gsap.to(line, {
        xPercent: direction * 50,
        ease: "none",
        scrollTrigger: {
          trigger: "#smile-scroll-section",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });
  }, []);

  const textRefs = useRef([]);

  useEffect(() => {
    textRefs.current.forEach((el, i) => {
      gsap.fromTo(
        el,
        { filter: "blur(8px)", opacity: 0 },
        {
          filter: "blur(0px)",
          opacity: 1,
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
          duration: 0.6,
          ease: "power2.out",
        },
      );
    });
  }, []);



useLayoutEffect(() => {
  if (!cardsRef.current || !bannerRef.current) return;
 gsap.set(cardsRef.current, { clearProps: "all" });
  gsap.set(bannerRef.current, { clearProps: "all" });
  const ctx = gsap.context(() => {
  gsap.set(cardsRef.current, {
  scale: 1,
  x: 0,
  y: 0,
  transformOrigin: "50% 50%",
});

gsap.set(bannerRef.current, {
  scale: 0.65,
  x: 0,
  y: 0,
  opacity: 0,
  
  transformOrigin: "50% 50%",
});

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: cardsRef.current.parentElement,
        start: "top top",
        end: "+=100%",
        scrub: 0.8,
        pin: true,
      },
    });

    tl.to(cardsRef.current, {
      // scale: 0.8,
      opacity: 0,
      ease: "none",

        transformOrigin: "50% 50%",
    },  );

    tl.to(
      bannerRef.current,
      {
        scale: 1,
        opacity: 1,
        ease: "none",
        transformOrigin: "50% 50%",
      },
      "<0.15",
    );

  });

  return () => ctx.revert();
}, []);

  return (
    <>
      {/* <FluidSimulation disabled={disableFluid} /> */}
      <List onInteractionChange={setDisableFluid} />

      <Background />

      <section className="w-full py-12">
        <section className="relative overflow-hidden mx-auto max-w-[1400px] ">
          <div className="flex items-center justify-between py-10 w-full">
            <span className="inline-block w-3 h-3 transition-transform duration-300 ease-in-out hover:rotate-180">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 13 12"
                fill="none"
                className="w-full h-full"
              >
                <path
                  d="M0.5 6.46154V5.53846H6.03846V0H6.96154V5.53846H12.5V6.46154H6.96154V12H6.03846V6.46154H0.5Z"
                  fill="#000"
                />
              </svg>
            </span>

            <div className="flex-1 mx-2 border-b border-[#595252]/20"></div>
            <span className="inline-block w-3 h-3 transition-transform duration-300 ease-in-out hover:rotate-180">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 13 12"
                fill="none"
                className="w-full h-full"
              >
                <path
                  d="M0.5 6.46154V5.53846H6.03846V0H6.96154V5.53846H12.5V6.46154H6.96154V12H6.03846V6.46154H0.5Z"
                  fill="#000"
                />
              </svg>
            </span>
          </div>

          <div className="font-neuehaas45 absolute top-28 left-10 text-xs uppercase tracking-widest text-black/70">
            Every smile tells a story — these are some of our favorites.
          </div>

        </section>

      </section>
<section className="relative w-full h-screen overflow-hidden">
  <div
    ref={cardsRef}
    className="
      absolute inset-0 m-auto
      w-full h-full
      flex items-center justify-center
    
    "
  >
    <CarouselComponent />
  </div>

  <div
    ref={bannerRef}
    className="
      absolute inset-0
      w-full h-full
      flex items-center justify-center
      pointer-events-none
    "
  >
    <div className="TestimonialsBookNow-banner container pointer-events-auto">
      <h2 className="font-canela italic text-5xl text-zinc-800">
        Let's Get Moving.
      </h2>

      <button
        className="TestimonialsBookNow-banner button font-ibmplex-extralight tracking-wide uppercase"
        onClick={() => setShowScheduler(true)}
      >
        <ScrambleText text="Schedule Your Visit" />
      </button>
    </div>
  </div>
</section>
      {/* Scheduler Panel */}
      <div
        className={`
          fixed top-0 left-0 right-0 z-[900]
          transform transition-all duration-500 ease-[cubic-bezier(0.34,1.2,0.64,1)]
          ${showScheduler ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <div className="relative">
          <div className="bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden">
            <div className="relative w-full h-[100vh]">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/40 to-transparent z-40 pointer-events-none">
                <div className="flex justify-end p-6 pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowScheduler(false)
                    }}
                    className="font-neuehaas35 text-[14px] xl:text-[16px] tracking-wide text-white hover:opacity-70 transition-opacity bg-black/20 px-5 rounded-full backdrop-blur-sm cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              <iframe
                src="https://freysmilesappointments.as.me/"
                title="Schedule Appointment"
                className="w-full h-full"
                allow="payment"
                style={{ marginTop: 0 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop overlay */}
      <div
        className={`
          fixed inset-0 bg-black/20 backdrop-blur-sm z-[99]
          transition-all duration-500 ease-in-out
          ${showScheduler ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setShowScheduler(false)}
      />
    </>
  );
};

export default Testimonials;