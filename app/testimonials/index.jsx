"use client";
import { easing, geometry } from "maath";
import { Flip } from "gsap/Flip";
import { Renderer, Program, Color, Mesh, Triangle, Vec2 } from "ogl";

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
import { SplitText } from "gsap/all";
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
import { useControls } from "leva";
import { MeshStandardMaterial } from "three";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import ScrollList from "./scroll-list.jsx";

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

gl.clearColor(
  0.74,
  0.745,
  0.75,
  1
)

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
  uniform vec2 uResolution;

  uniform vec3 uPeach;
  uniform vec3 uRose;
  uniform vec3 uGray;
  uniform vec3 uPearl;

  varying vec2 vUv;

  float random(vec2 point) {
    return fract(
      sin(
        dot(
          point,
          vec2(127.1, 311.7)
        )
      ) * 43758.5453123
    );
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);

    local =
      local *
      local *
      (3.0 - 2.0 * local);

    float bottomLeft =
      random(cell);

    float bottomRight =
      random(
        cell +
        vec2(1.0, 0.0)
      );

    float topLeft =
      random(
        cell +
        vec2(0.0, 1.0)
      );

    float topRight =
      random(
        cell +
        vec2(1.0, 1.0)
      );

    return mix(
      mix(
        bottomLeft,
        bottomRight,
        local.x
      ),
      mix(
        topLeft,
        topRight,
        local.x
      ),
      local.y
    );
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.5;

    for (
      int octave = 0;
      octave < 4;
      octave++
    ) {
      value +=
        amplitude *
        noise(point);

      point =
        point * 2.03 +
        vec2(4.1, 2.7);

      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec2 uv = vUv;

    float aspect =
      uResolution.x /
      uResolution.y;

    vec2 point =
      uv - 0.5;

    point.x *= aspect;

    float time =
      uTime * 0.16;

    /*
     * Large, slowly moving field.
     */
    float organicField =
      fbm(
        point * 1.75 +
        vec2(
          time * 0.16,
          -time * 0.11
        )
      );

    /*
     * Smaller-scale surface movement.
     */
    float fineField =
      fbm(
        point * 3.8 +
        vec2(
          -time * 0.12,
          time * 0.15
        )
      );
float verticalLight =
  smoothstep(
    -0.7,
    0.8,
    point.y +
    organicField * 0.16
  );

vec3 color = mix(
  uGray,
  uPearl,
  0.18 +
  verticalLight * 0.42
);

/*
 * Stronger white mist creates visible
 * cloudy areas without adding saturation.
 */
float mist =
  fbm(
    point * 1.2 +
    vec2(
      time * 0.05,
      time * 0.035
    )
  );

float mistStrength =
  smoothstep(
    0.48,
    0.9,
    mist
  );

color = mix(
  color,
  vec3(0.94, 0.94, 0.93),
  mistStrength * 0.28
);

/*
 * Main flowing current.
 */
float peachAxis =
  point.y +
  0.19 *
  sin(
    point.x * 2.4 +
    time +
    organicField * 2.0
  ) +
  0.07 *
  sin(
    point.x * 6.5 -
    time * 0.8
  ) +
  uScroll * 0.28;

float peachRibbon =
  exp(
    -pow(
      (
        peachAxis +
        0.06
      ) / 0.14,
      2.0
    )
  );

peachRibbon *=
  0.62 +
  fineField * 0.38;

/*
 * Secondary current.
 */
float roseAxis =
  point.y -
  0.22 *
  sin(
    point.x * 1.8 -
    time * 0.7 +
    organicField * 1.7
  ) +
  0.13 +
  uScroll * 0.2;

float roseRibbon =
  exp(
    -pow(
      roseAxis / 0.085,
      2.0
    )
  );

/*
 * White ribbon beside the warmer current.
 */
float whiteRibbon =
  exp(
    -pow(
      (
        peachAxis -
        0.16
      ) / 0.075,
      2.0
    )
  );

color = mix(
  color,
  uPeach,
  peachRibbon * 0.24
);

color = mix(
  color,
  uRose,
  roseRibbon * 0.11
);

color = mix(
  color,
  vec3(0.97, 0.97, 0.96),
  whiteRibbon * 0.24
);

/*
 * More visible surface variation.
 */
color +=
  (
    fineField - 0.5
  ) * 0.02;

color = clamp(
  color,
  0.0,
  1.0
);

gl_FragColor =
  vec4(color, 1.0);
  }
`;

const program = new Program(gl, {
  vertex,
  fragment,
  uniforms: {
    uTime: {
      value: 0,
    },

    uScroll: {
      value: 0,
    },
 uPeach: {
  value: new Color(
    "#d5b7b2"
  ),
},

uRose: {
  value: new Color(
    "#e4dae0"
  ),
},

uGray: {
  value: new Color(
    "#b2b7be"
  ),
},

uPearl: {
  value: new Color(
    "#e5e5e3"
  ),
},

    uResolution: {
      value: new Vec2(
        gl.canvas.offsetWidth,
        gl.canvas.offsetHeight
      ),
    },
  },
})

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
  const [isMobile, setIsMobile] = useState(false);
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
  const CELL_INTERVAL = 15;
  const LINE_DELAY = 180;

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const lineElements = Array.from(
      container.querySelectorAll(".terminal-line"),
    );

    const animatedLines = lineElements.map((lineElement, lineIndex) => {
      const cellElements = Array.from(
        lineElement.querySelectorAll(".terminal-cell"),
      );

      return {
        startDelay: lineIndex * LINE_DELAY,
        lastTick: 0,
        finished: false,

        cells: cellElements.map((element) => ({
          element,
          original: element.dataset.character ?? "",
          signal: "",
          displayedValue: null,
          iterations: 0,
          finished: false,
        })),
      };
    });

    const renderCell = (cell, value) => {
      const displayedValue =
        cell.original === " " ? " " : value || "\u00A0";

      // Avoid rewriting the DOM when the value hasn't changed.
      if (cell.displayedValue === displayedValue) return;

      cell.element.textContent = displayedValue;
      cell.displayedValue = displayedValue;
    };

    const finishCell = (cell) => {
      cell.finished = true;
      cell.signal = cell.original;
      renderCell(cell, cell.original);
    };

    // Immediately display the final text for reduced-motion users.
    if (reduceMotion) {
      animatedLines.forEach(({ cells }) => {
        cells.forEach(finishCell);
      });

      return;
    }

    // Clear all characters before starting.
    animatedLines.forEach(({ cells }) => {
      cells.forEach((cell) => {
        cell.signal = "";
        cell.iterations = 0;
        cell.finished = false;
        renderCell(cell, "");
      });
    });

    let frameId = null;
    let startTime = null;
    let cancelled = false;

    const updateLine = (line, time) => {
      const previousSignals = line.cells.map((cell) => cell.signal);

      line.cells.forEach((cell, index) => {
        if (cell.finished) return;

        const nextSignal =
          index === 0
            ? Math.random() < 0.5
              ? "*"
              : ":"
            : previousSignals[index - 1];

        cell.signal = nextSignal;
        renderCell(cell, nextSignal);

        if (nextSignal) {
          cell.iterations += 1;
        }

        if (cell.iterations >= MAX_CELL_ITERATIONS) {
          finishCell(cell);
        }
      });

      line.finished = line.cells.every((cell) => cell.finished);
      line.lastTick = time;
    };

    const animate = (time) => {
      if (cancelled) return;

      if (startTime === null) {
        startTime = time;
      }

      const elapsed = time - startTime;

      animatedLines.forEach((line) => {
        if (line.finished || elapsed < line.startDelay) return;

        if (
          line.lastTick === 0 ||
          time - line.lastTick >= CELL_INTERVAL
        ) {
          updateLine(line, time);
        }
      });

      const allLinesFinished = animatedLines.every(
        (line) => line.finished,
      );

      if (!allLinesFinished) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelled = true;

      if (frameId !== null) {
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
            key={`${line.id}-${spacePosition}`}
            className="terminal-cell terminal-space"
            data-character=" "
            aria-hidden="true"
          >
            {" "}
          </span>
        </React.Fragment>
      );
    });
  };

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
    type: "Mild deep bite and class 2 on left side and crowding corrected in 18 months with braces and elastics.",
    project: "Lainie",
  },
  {
    name: "James",
    image: "../images/testimonials/Jamescontrast.png",
    type: "Severe deep bite and upper spacing corrected in 2 years with Invisalign and orthodontic elastics.",
    project: "James",
  },
  {
    name: "Ron L.",
    image: "../images/testimonials/Ronlandscape.png",
    type: "Crossbite and crowding corrected in twelve months with Invisalign. Minor aesthetic bonding performed on front tooth.",
    project: "Ron L.",
  },
  {
    name: "Elizabeth",
    image: "../images/testimonials/elizabethmask.png",
    type: "Mandibular retrognathia corrected in 30 months with functional appliance, braces, and Invisalign",
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
    image: "../images/testimonials/kasprenski.png",
    type: undefined,
    project: "Kasprenski",
  },
  {
    name: "Leanne",
    image: "../images/testimonials/Leannelandscape.png",
    type: "Adult crowding and arch constriction corrected in 12 months with Invisalign",
    project: "Leanne",
  },
  {
    name: "Harold",
    image: "../images/testimonials/harold.png",
    type: "Overbite and spacing corrected in 14 months with Invisalign",
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
    type: "12 months, Invisalign",
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
    type: "Invisalign",
    project: "Nilaya",
  },
  {
    name: "Maria A.",
    image: "../images/testimonials/Maria.png",
    type: undefined,
    project: "Maria A.",
  },
];

const List = ({
  onInteractionChange,
}) => {
  const [activeIndex, setActiveIndex] =
    useState(0)

  const [
    displayedIndex,
    setDisplayedIndex,
  ] = useState(0)
const introSectionRef = useRef(null);
const testimonialsSectionRef =
  useRef(null);

const galleryViewportRef = useRef(null)
const thumbnailRefs = useRef([])

const activeIndexRef = useRef(0)
const requestedIndexRef = useRef(0)

const galleryScrollTimeoutRef =
  useRef(null)
  const backgroundRefs = useRef([])
  const titleRef = useRef(null)
  const infoRef = useRef(null)
  const creditsRef = useRef(null)
  const patientRef = useRef(null)

  const projectImageRef = useRef(null)
  const projectImageElementRef =
    useRef(null)

  const infoSplitRef = useRef(null)
  const isAnimating = useRef(false)
  const shouldAnimateIn =
    useRef(false)

  const displayedTestimonial =
    testimonials[displayedIndex]

  const getTextTargets = () => {
    return [
      titleRef.current,
      ...(
        infoSplitRef.current
          ?.lines ?? []
      ),
      creditsRef.current,
      patientRef.current,
    ].filter(Boolean)
  }

useLayoutEffect(() => {
  const intro =
    introSectionRef.current;

  const main =
    testimonialsSectionRef.current;

  if (!intro || !main) {
    return undefined;
  }

  const context = gsap.context(() => {
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: intro,

        start: "top top",

        end: () =>
          `+=${window.innerHeight}`,

        pin: intro,
        pinSpacing: false,

        /*
         * Follow scroll position directly.
         * Lenis already supplies smoothing.
         */
        scrub: true,

        anticipatePin: 1,
      },
    });

    timeline.fromTo(
      main,
      {
        rotationX: 8,

        transformOrigin:
          "50% 100%",

        transformPerspective:
          1600,

        backfaceVisibility:
          "hidden",

        force3D: true,
      },
      {
        rotationX: 0,

        ease: "none",
        force3D: true,
      },
      0
    );
  });

  const refreshFrame =
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

  return () => {
    cancelAnimationFrame(
      refreshFrame
    );

    context.revert();
  };
}, []);
  useLayoutEffect(() => {
    if (!infoRef.current) {
      return undefined
    }

    const context = gsap.context(
      () => {
        infoSplitRef.current =
          SplitText.create(
            infoRef.current,
            {
              type: "lines",
              linesClass:
                "project-info-line",
              mask: "lines",
            }
          )

        const textTargets =
          getTextTargets()

        /*
         * Establish the initial state
         * without playing an entrance.
         */
        if (
          !shouldAnimateIn.current
        ) {
          gsap.set(textTargets, {
            y: 0,
          })

          gsap.set(
            projectImageRef.current,
            {
              scale: 1,
              bottom: "1em",
            }
          )

          gsap.set(
            projectImageElementRef.current,
            {
              scale: 1,
            }
          )

          return
        }

        const timeline = gsap.timeline({
  onComplete: () => {
    shouldAnimateIn.current =
      false

    isAnimating.current =
      false

    const requestedIndex =
      requestedIndexRef.current

    if (
      requestedIndex !==
      activeIndexRef.current
    ) {
      requestAnimationFrame(() => {
        handleItemClick(
          requestedIndex
        )
      })
    }
  },
})

        timeline.fromTo(
          textTargets,
          {
            y: 40,
          },
          {
            y: 0,
            duration: 1,
            ease: "power4.out",
            stagger: 0.05,
          },
          0
        )

        timeline.fromTo(
          projectImageRef.current,
          {
            scale: 0,
            bottom: "-10em",
          },
          {
            scale: 1,
            bottom: "1em",
            duration: 1,
            ease: "power4.out",
          },
          0
        )

        timeline.fromTo(
          projectImageElementRef.current,
          {
            scale: 2,
          },
          {
            scale: 1,
            duration: 1,
            ease: "power4.out",
          },
          0
        )
      },
      testimonialsSectionRef
    )

    return () => {
      context.revert()
      infoSplitRef.current?.revert()
      infoSplitRef.current = null
    }
  }, [displayedIndex])

  /*
   * Stop background animations if
   * the component is removed.
   */
  useLayoutEffect(() => {
    return () => {
      gsap.killTweensOf(
        backgroundRefs.current
      )
    }
  }, [])

  /*
   * Notify the parent when this new
   * gallery is visible.
   */
  useEffect(() => {
    const section =
      testimonialsSectionRef.current

    if (
      !section ||
      !onInteractionChange
    ) {
      return undefined
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          onInteractionChange(
            entry.isIntersecting
          )
        },
        {
          threshold: 0.4,
        }
      )

    observer.observe(section)

    return () => {
      observer.disconnect()
    }
  }, [onInteractionChange])
useEffect(() => {
  let isProgrammaticScroll = false
  const viewport =
    galleryViewportRef.current

  const section =
    testimonialsSectionRef.current

  if (!viewport || !section) {
    return undefined
  }

  let wheelAccumulator = 0
  let wheelLocked = false
  let wheelUnlockTimer = null

  const getIsHorizontal = () =>
    window.matchMedia(
      "(max-width: 900px)"
    ).matches

  const selectClosestThumbnail =
    () => {
      const isHorizontal =
        getIsHorizontal()

      const viewportRect =
        viewport.getBoundingClientRect()

      /*
       * Match snap-start instead of
       * measuring from the center.
       */
      const viewportStart =
        isHorizontal
          ? viewportRect.left + 12
          : viewportRect.top + 12

      let closestIndex = 0
      let closestDistance =
        Infinity

      thumbnailRefs.current.forEach(
        (thumbnail, index) => {
          if (!thumbnail) return

          const rect =
            thumbnail.getBoundingClientRect()

          const thumbnailStart =
            isHorizontal
              ? rect.left
              : rect.top

          const distance = Math.abs(
            thumbnailStart -
              viewportStart
          )

          if (
            distance <
            closestDistance
          ) {
            closestDistance =
              distance

            closestIndex = index
          }
        }
      )

      requestedIndexRef.current =
        closestIndex

      handleItemClick(
        closestIndex
      )
    }

const scrollToThumbnail = (
  index
) => {
  const thumbnail =
    thumbnailRefs.current[index]

  if (!thumbnail) return

  const isHorizontal =
    getIsHorizontal()

  const viewportRect =
    viewport.getBoundingClientRect()

  const thumbnailRect =
    thumbnail.getBoundingClientRect()

  const targetPosition =
    isHorizontal
      ? viewport.scrollLeft +
        thumbnailRect.left -
        viewportRect.left -
        12
      : viewport.scrollTop +
        thumbnailRect.top -
        viewportRect.top -
        12

  isProgrammaticScroll = true

  /*
   * Prevent CSS snapping from fighting
   * the controlled tween.
   */
  viewport.style.scrollSnapType =
    "none"

  gsap.killTweensOf(viewport)

  gsap.to(viewport, {
    ...(isHorizontal
      ? {
          scrollLeft:
            targetPosition,
        }
      : {
          scrollTop:
            targetPosition,
        }),

    duration: 0.55,
    ease: "power2.inOut",
    overwrite: true,

    onComplete: () => {
      /*
       * Removing the inline value lets
       * the Tailwind snap class take over.
       */
      viewport.style.removeProperty(
        "scroll-snap-type"
      )

      isProgrammaticScroll =
        false

      selectClosestThumbnail()
    },
  })
}

const handleGalleryScroll = () => {
  if (isProgrammaticScroll) {
    return
  }

  window.clearTimeout(
    galleryScrollTimeoutRef.current
  )

  galleryScrollTimeoutRef.current =
    window.setTimeout(
      selectClosestThumbnail,
      120
    )
}

  const keepWheelLocked = () => {
    window.clearTimeout(
      wheelUnlockTimer
    )

    /*
     * Unlock only after the current
     * trackpad gesture has ended.
     */
    wheelUnlockTimer =
      window.setTimeout(() => {
        wheelLocked = false
        wheelAccumulator = 0
      }, 180)
  }

  const handleSectionWheel = (
    event
  ) => {
    const sectionRect =
      section.getBoundingClientRect()

    const sectionIsActive =
      sectionRect.top <= 1 &&
      sectionRect.bottom >=
        window.innerHeight - 1

    if (!sectionIsActive) return

    const delta =
      Math.abs(event.deltaY) >=
      Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX

    if (delta === 0) return

    const currentIndex =
      requestedIndexRef.current

    const isFirst =
      currentIndex === 0

    const isLast =
      currentIndex ===
      testimonials.length - 1

    /*
     * Absorb momentum belonging to the
     * current wheel gesture.
     */
    if (wheelLocked) {
      event.preventDefault()
      event.stopPropagation()

      keepWheelLocked()
      return
    }

    /*
     * Allow a fresh gesture to leave the
     * gallery at either boundary.
     */
    if (
      (delta < 0 && isFirst) ||
      (delta > 0 && isLast)
    ) {
      wheelAccumulator = 0
      return
    }

    event.preventDefault()
    event.stopPropagation()

    wheelAccumulator += delta

    /*
     * Ignore tiny trackpad noise.
     */
    if (
      Math.abs(
        wheelAccumulator
      ) < 35
    ) {
      return
    }

    const direction =
      wheelAccumulator > 0
        ? 1
        : -1

    const nextIndex = Math.max(
      0,
      Math.min(
        testimonials.length - 1,
        currentIndex + direction
      )
    )

    wheelAccumulator = 0
    wheelLocked = true

    requestedIndexRef.current =
      nextIndex

    scrollToThumbnail(nextIndex)
    handleItemClick(nextIndex)

    keepWheelLocked()
  }

  viewport.addEventListener(
    "scroll",
    handleGalleryScroll,
    {
      passive: true,
    }
  )

const handleGalleryScrollEnd =
  () => {
    if (!isProgrammaticScroll) {
      selectClosestThumbnail()
    }
  }

viewport.addEventListener(
  "scroll",
  handleGalleryScroll,
  {
    passive: true,
  }
)

viewport.addEventListener(
  "scrollend",
  handleGalleryScrollEnd
)

section.addEventListener(
  "wheel",
  handleSectionWheel,
  {
    passive: false,
    capture: true,
  }
)

return () => {
  window.clearTimeout(
    galleryScrollTimeoutRef.current
  )

  window.clearTimeout(
    wheelUnlockTimer
  )

  gsap.killTweensOf(viewport)

  viewport.style.removeProperty(
    "scroll-snap-type"
  )

  viewport.removeEventListener(
    "scroll",
    handleGalleryScroll
  )

  viewport.removeEventListener(
    "scrollend",
    handleGalleryScrollEnd
  )

  section.removeEventListener(
    "wheel",
    handleSectionWheel,
    true
  )
}
}, [])
const handleItemClick = (nextIndex) => {
  requestedIndexRef.current =
    nextIndex

  if (
    nextIndex ===
      activeIndexRef.current ||
    isAnimating.current
  ) {
    return
  }

  isAnimating.current = true

  const previousIndex =
    activeIndexRef.current

  activeIndexRef.current =
    nextIndex

  const previousBackground =
    backgroundRefs.current[
      previousIndex
    ]

  const nextBackground =
    backgroundRefs.current[
      nextIndex
    ]

  setActiveIndex(nextIndex)

  gsap.killTweensOf([
    previousBackground,
    nextBackground,
  ])

  if (nextBackground) {
    gsap.set(nextBackground, {
      visibility: "visible",
    })

    gsap.to(nextBackground, {
      opacity: 1,
      delay: 0.5,
      duration: 1,
      ease: "power2.inOut",
    })
  }

  if (previousBackground) {
    gsap.to(previousBackground, {
      opacity: 0,
      delay: 0.5,
      duration: 1,
      ease: "power2.inOut",

      onComplete: () => {
        gsap.set(
          previousBackground,
          {
            visibility: "hidden",
          }
        )
      },
    })
  }

  const textTargets =
    getTextTargets()

  const outgoingTimeline =
    gsap.timeline({
      onComplete: () => {
        shouldAnimateIn.current =
          true

        setDisplayedIndex(nextIndex)
      },
    })

  outgoingTimeline.to(
    textTargets,
    {
      y: -60,
      duration: 1,
      ease: "power4.in",
      stagger: 0.05,
    },
    0
  )

  outgoingTimeline.to(
    projectImageElementRef.current,
    {
      scale: 2,
      duration: 1,
      ease: "power4.in",
    },
    0
  )

  outgoingTimeline.to(
    projectImageRef.current,
    {
      scale: 0,
      bottom: "10em",
      duration: 1,
      ease: "power4.in",
    },
    0
  )
}

  return (
    <div className="testimonialsPage">
<section
  ref={introSectionRef}
  className="intro relative z-0 h-screen overflow-hidden"
>
        <div className="pointer-events-none absolute inset-0 z-0">
          <JanusFace />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px] flex-col md:flex-row">
          <div className="hidden min-h-screen md:block md:w-1/2" />

          <div className="flex min-h-screen w-full items-center justify-center px-6 md:w-1/2 md:px-0">
            <div className="w-full max-w-[1200px]">
              <TerminalPreloader />
            </div>
          </div>
        </div>
      </section>

<main
  ref={testimonialsSectionRef}
  className="relative z-10 flex h-screen w-full origin-bottom overflow-hidden bg-[#0f0f0f] will-change-transform [backface-visibility:hidden] max-[900px]:flex-col"
>
      {/* Blurred background preview */}
<div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#0f0f0f]">
  {testimonials.map(
    (testimonial, index) => (
      <img
        key={`background-${testimonial.name}-${index}`}
        ref={(element) => {
          backgroundRefs.current[
            index
          ] = element
        }}
        src={testimonial.image}
        alt=""
        aria-hidden="true"
        className="absolute -inset-[12%] h-[124%] w-[124%] scale-110 object-cover blur-[100px] will-change-opacity"
        style={{
          opacity:
            index === 0 ? 1 : 0,
        }}
      />
    )
  )}

  <div className="absolute inset-0 bg-white/25" />
</div>

      {/* Left information column */}
      <div className="site-info col relative flex flex-1 flex-col justify-between border-r border-white/10 p-4 max-[900px]:flex-[0.5] max-[900px]:border-r-0 max-[900px]:border-b">


        <div className="header absolute top-1/2 -translate-y-1/2 max-[900px]:top-auto max-[900px]:bottom-4 max-[900px]:translate-y-0">
          <div className="text-[20px] font-canelathin">
               A visual archive of
            selected patient treatment
            outcomes.
          </div>
        </div>

        <div className="copy max-[900px]:hidden">
          <p className="text-base font-canelathin text-white">
        
          </p>
        </div>
      </div>

      {/* Active testimonial */}
      <div className="project-preview col relative flex-[2] p-4">
        <div
          key={`details-${displayedIndex}`}
          className="project-details absolute left-4 top-4 w-1/2 max-[900px]:w-[calc(100%-1rem)]"
        >
          <div className="title mb-2 overflow-hidden">
            <div
              ref={titleRef}
              className="relative translate-y-10 text-[px] font-neuehaas35 will-change-transform"
            >
              {
                displayedTestimonial.project
              }
            </div>
          </div>

          <div className="info mb-4 overflow-hidden">
            <p
              ref={infoRef}
              className="text-base font-neuehaas35"
            >
              {displayedTestimonial.type ||
                "Treatment outcome"}
            </p>
          </div>

          <div className="credits overflow-hidden">
            <p
              ref={creditsRef}
              className="relative inline-block translate-y-5 text-base font-neuehaas35 will-change-transform"
            >
              Patient
            </p>
          </div>

          <div className="director overflow-hidden">
            <p
              ref={patientRef}
              className="relative inline-block translate-y-5 text-base font-neuehaas35  will-change-transform"
            >
              {
                displayedTestimonial.name
              }
            </p>
          </div>
        </div>

        <div
          key={`image-${displayedIndex}`}
          ref={projectImageRef}
          className="project-img absolute bottom-4 left-4 h-1/2 w-3/4 overflow-hidden will-change-transform max-[900px]:w-[93%]"
        >
          <img
            ref={
              projectImageElementRef
            }
            src={
              displayedTestimonial.image
            }
            alt={`${displayedTestimonial.name} treatment outcome`}
            className="h-full w-full object-cover will-change-transform"
          />
        </div>
      </div>

{/* Scroll-snapping thumbnail gallery */}
<div
  ref={galleryViewportRef}
  data-lenis-prevent
  className="
    relative z-20
    h-full w-[124px] shrink-0
    snap-y snap-mandatory
    scroll-pt-3
    overflow-y-auto overflow-x-hidden
    overscroll-contain
    border-l border-white/10
    bg-white/30
    p-3
    backdrop-blur-[20px]
    [scrollbar-width:none]
    [&::-webkit-scrollbar]:hidden

    max-[900px]:h-[112px]
    max-[900px]:w-full
    max-[900px]:snap-x
    max-[900px]:scroll-pl-3
    max-[900px]:overflow-x-auto
    max-[900px]:overflow-y-hidden
    max-[900px]:border-l-0
    max-[900px]:border-t
  "
>
  <div
    className="
      flex min-h-max w-full
      flex-col gap-3

      max-[900px]:h-full
      max-[900px]:min-h-0
      max-[900px]:w-max
      max-[900px]:flex-row
    "
  >
    {testimonials.map(
      (testimonial, index) => {
        const isActive =
          index === activeIndex

        return (
          <button
            key={`gallery-${testimonial.name}-${index}`}
            ref={(element) => {
              thumbnailRefs.current[
                index
              ] = element
            }}
            type="button"
            className={[
              "treatment-thumbnail",
              "relative",
              "block",
              "h-[150px]",
              "w-full",
              "shrink-0",
              "snap-start",
              "overflow-hidden",
              "border-0",
              "bg-[#aeaeae]",
              "p-0",

              "max-[900px]:h-full",
              "max-[900px]:w-[120px]",

              "after:pointer-events-none",
              "after:absolute",
              "after:inset-0",
              "after:z-10",
              "after:content-['']",
              "after:transition-colors",
              "after:delay-500",
              "after:duration-500",

              isActive
                ? "after:bg-black/0"
                : "after:bg-black/65",
            ].join(" ")}
            onClick={() => {
              requestedIndexRef.current =
                index

              handleItemClick(index)
            }}
            aria-label={`View ${testimonial.name}`}
            aria-pressed={isActive}
          >
            <img
              src={testimonial.image}
              alt=""
              className="absolute inset-0 block !h-full !w-full !object-cover"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </button>
        )
      }
    )}
  </div>
</div>
    </main>
    </div>
  )
}


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



function JanusFace() {
  const [leftShapes, setLeftShapes] = useState([]);
  const [rightShapes, setRightShapes] = useState([]);

  const r = (from, to) => Math.random() * (to - from) + from;
  const ri = (from, to) => ~~r(from, to);
  const pick = (...args) => args[ri(0, args.length)];

  const symbols = [
    "□",
    "▢",
    "▭",
    "▯",

    "○",
    "◯",
    "◌",

    "△",
    "▽",
    "▷",
    "◁",

    "◇",
    "◊",

    "◅",
    "▻",
  ];

  const generateText = (length = 60, rowIndex = 0, isMobile = false) => {
    return Array.from({ length }, (_, i) => {
      const shouldBlink = !isMobile && (i + rowIndex) % 4 === 0;

      return (
        <span
          key={i}
          className={shouldBlink ? "symbol symbol-blink" : "symbol"}
          style={
            shouldBlink
              ? {
                  "--blink-delay": `${(i * 0.09 + rowIndex * 0.17) % 4}s`,

                  "--blink-duration": `${3.5 + ((i + rowIndex) % 4) * 0.4}s`,
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
      const color = "#AAA6E3";

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

const Testimonials = () => {
  const textRef = useRef(null);
  const bgTextColor = "#CECED3";
  const fgTextColor = "#161818";
  const [disableFluid, setDisableFluid] = useState(false);
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
  const gradient1Ref = useRef(null);
  const image1Ref = useRef(null);
  const text1Ref = useRef(null);

  useEffect(() => {
    if (!gradient1Ref.current || !image1Ref.current) return;

    gsap.to(".gradient-col", {
      y: "-20%",
      ease: "none",
      scrollTrigger: {
        trigger: gradient1Ref.current,
        scroller: "#right-column",
        start: "top bottom",
        end: "bottom top",
        scrub: 4,
      },
    });

    gsap.to(image1Ref.current, {
      y: "-60%",
      ease: "none",
      scrollTrigger: {
        trigger: image1Ref.current,
        scroller: "#right-column",
        start: "top 70%",
        end: "bottom top",
        scrub: 1,
      },
    });
    gsap.to(text1Ref.current, {
      y: "-60%",
      ease: "none",
      scrollTrigger: {
        trigger: image1Ref.current,
        scroller: "#right-column",
        start: "top 70%",
        end: "bottom top",
        scrub: 1,
      },
    });
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

  const movingBlobRef = useRef(null);

  const points = [
    { x: 150, y: 60 },
    { x: 210, y: 110 },
    { x: 200, y: 190 },
    { x: 120, y: 210 },
    { x: 70, y: 140 },
    { x: 100, y: 100 },
  ];

  useLayoutEffect(() => {
    const tl = gsap.timeline({
      repeat: -1,
      defaults: { ease: "sine.inOut", duration: 1.6 },
    });

    points.forEach((p) => {
      tl.to(movingBlobRef.current, {
        attr: { cx: p.x, cy: p.y },
      });
    });
  }, []);

  return (
    <>
      {/* <FluidSimulation disabled={disableFluid} /> */}
      <List onInteractionChange={setDisableFluid} />

      <Background />

      {/* <section className="w-full py-12">
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
      </section> */}
    </>
  );
};

export default Testimonials;
