"use client";
import "./style.css";
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import * as THREE from "three";
import  React, { useLayoutEffect, useCallback, useEffect,useImperativeHandle, useRef,forwardRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import LocationTextReveal from "./[locationSlug]/LocationTextReveal";

gsap.registerPlugin(SplitText, ScrollTrigger);


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
    image: "/images/beththumbnail.png",
    href: "/locations/bethlehem",
  },
  {
    name: "Lehighton",
    description: "FreySmiles Lehighton",
    image: "/images/aligner.jpg",
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



 function MapboxGLJS() {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)

  const innerCursor = useRef(null)
  const outerCursor = useRef(null)
  const horizontalLine = useRef(null)
  const verticalLine = useRef(null)
  const showCursor = useRef(false)
  const showCrosshair = useRef(false)
  const outerCursorSpeed = useRef(0)
  const mouseX = useRef(-100)
  const mouseY = useRef(-100)

  // INIT CURSOR
  useEffect(() => {
    if (!outerCursor.current || !innerCursor.current) return

    gsap.set([innerCursor.current, outerCursor.current, horizontalLine.current, verticalLine.current], {
      x: -1000,
      y: -1000,
    })

    const revealCursor = () => {
      gsap.set(innerCursor.current, {
        x: mouseX.current,
        y: mouseY.current,
      })
      gsap.set(outerCursor.current, {
        x: mouseX.current - outerCursor.current.getBoundingClientRect().width / 2,
        y: mouseY.current - outerCursor.current.getBoundingClientRect().height / 2,
      })
      setTimeout(() => {
        outerCursorSpeed.current = 0.2
      }, 100)
      showCursor.current = true
    }
    const updateCursor = (e) => {
      mouseX.current = e.clientX
      mouseY.current = e.clientY
    }
    document.addEventListener('mousemove', revealCursor)
    document.addEventListener('mousemove', updateCursor)

    return () => {
      document.removeEventListener('mousemove', revealCursor)
      document.removeEventListener('mousemove', updateCursor)
    }
  }, [])

  // MAPBOX
  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    const map = (mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: process.env.NEXT_PUBLIC_MAPBOX_MAP_STYLE,
      center: [-75.5, 40.7],
      zoom: 10,
      minZoom: 8,
      maxZoom: 14,
    }))
   
    const createMarker = (name) => {
      const el = document.createElement('div')
      const innerEl = document.createElement('div')
      innerEl.className = 'marker marker-pop'
      el.appendChild(innerEl)

      el.addEventListener('mousemove', (e) => {
        showCrosshair.current = true
        showCursor.current = false
        gsap.set(horizontalLine.current, {
          x: e.clientX,
          y: e.clientY,
          opacity: 1,
        })
        gsap.set(verticalLine.current, {
          x: e.clientX,
          y: e.clientY,
          opacity: 1,
        })
      })

      el.addEventListener('mouseleave', (e) => {
        showCrosshair.current = false
        showCursor.current = true
        gsap.set(horizontalLine.current, {
          opacity: 0,
        })
        gsap.set(verticalLine.current, {
          opacity: 0,
        })
      })

      return el
    }

    new mapboxgl
      .Marker({ element: createMarker('lehighton') })
      .setLngLat([-75.73039, 40.817605])
      .addTo(map) 
    
    new mapboxgl
      .Marker({ element: createMarker('schnecksville') })
      .setLngLat([-75.59864, 40.661055])
      .addTo(map) 
    
    new mapboxgl
      .Marker({ element: createMarker('allentown') })
      .setLngLat([-75.51711, 40.565945])
      .addTo(map)
    
    new mapboxgl
      .Marker({ element: createMarker('bethlehem') })
      .setLngLat([-75.295623, 40.66286])
      .addTo(map)
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* circle cursor */}
      <div ref={innerCursor} className='circle-cursor circle-cursor--inner' />
      <div ref={outerCursor} className='circle-cursor circle-cursor--outer' />

      {/* crosshair cursor */}
      <div ref={horizontalLine} className='cursor-line cursor-line--horizontal' />
      <div ref={verticalLine} className='cursor-line cursor-line--vertical' />
    </div>
  )
}


export default function LocationsPage() {
   const routeRef = useRef(null);
  const svgRef = useRef(null);


useLayoutEffect(() => {
  const route = routeRef.current;
  const svg = svgRef.current;

  if (!route || !svg) return;

  const ctx = gsap.context(() => {
    const mm = gsap.matchMedia();

 
mm.add("(max-width: 768px)", () => {
  gsap.fromTo(
    route,
    { "--strokeDashoffset": "0px" },
    {
      "--strokeDashoffset": "-2400px",
      ease: "none",
      scrollTrigger: {
        trigger: route,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    }
  );
});

  }, route);

  return () => ctx.revert();
}, []);

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


<div
  className="
    absolute tracking-tight font-neuehaas35
    right-12 bottom-8 text-left font-serif
    text-[20px] leading-tight text-black/70

    max-md:left-0
    max-md:right-0
    max-md:bottom-8
    max-md:px-6
    max-md:text-center
  "
>
  <LocationTextReveal>
    <div>Backed By Over 60 Years of</div>
    <div>
      Combined Orthodontic{" "}
      <em className="font-canelathin">Experience.</em>
    </div>
  </LocationTextReveal>
</div>

        </header>
      </div>

<div className="locations-route-section" ref={routeRef}>
   <div className="locations-route-svg-layer">
    <svg
  ref={svgRef}
  className="locations-route-svg"
  viewBox="0 0 740 2000"
preserveAspectRatio="xMidYMin meet"
  aria-hidden="true"
>
  <defs>
<linearGradient
  id="locations-route-gradient"
  x1="0%"
  y1="0%"
  x2="100%"
  y2="100%"
>

<stop offset="0%" stopColor="#EEE8FF" />
<stop offset="25%" stopColor="#C9B4F4" />
<stop offset="55%" stopColor="#9875DB" />
<stop offset="80%" stopColor="#D6C5FA" />
<stop offset="100%" stopColor="#7653B8" />

</linearGradient>
<filter
  // id="locations-route-lighting"
  // x="-20%"
  // y="-20%"
  // width="140%"
  // height="140%"
  // colorInterpolationFilters="sRGB"
>
  <feGaussianBlur
    in="SourceAlpha"
    stdDeviation="2"
    result="blur"
  />

  <feSpecularLighting
    in="blur"
    surfaceScale="3"
    specularConstant="0.45"
    specularExponent="22"
    lightingColor="#FFFFFF"
    result="highlight"
  >
    <fePointLight x="180" y="-100" z="220" />
  </feSpecularLighting>

  <feComposite
    in="highlight"
    in2="SourceAlpha"
    operator="in"
    result="clippedHighlight"
  />

  <feMerge>
    <feMergeNode in="SourceGraphic" />
    <feMergeNode in="clippedHighlight" />
  </feMerge>
</filter>
    <path
      id="linePath01"
      d="m 106,45h 375c 114,0 226,128 226,235v 236c 0,136 -122,222 -224,221l -182,-2c -89,1 -141,42 -142,158l -2,204c -1,117 37,173 134,173h 186c 110,-3 230,111 230,220v 242c 0,113 -125,225 -248,225H 105"
    />

    <path
      id="linePath02"
      d="m 33,85h 444c 96,0 190,107 190,201v 224c 0,116 -98,188 -190,187l -192,-2c -92,0 -166,75 -166,168v 278c 0,94 74,169 166,169h 194c 92,0 188,94 188,188v 228c 0,94 -104,191 -214,191H 105"
    />

    <path
      id="linePath03"
      d="m 155,127h 308c 94,0 162,86 162,177v 178c 0,109 -50,174 -166,173L 277,653C 158,653 77,762 77,849v 302c 0,118 107,196 180,197l 204,4c 92,0 164,67 164,160v 200c 0,91 -89,163 -188,163H 105"
    />

    <path
      id="linePath04"
      d="m 283,173c 2,0 165,0 165,0C 544,175 577,238 577,330v 156c 0,94 -48,126 -140,125L 269,609C 167,602 29,702 29,851v 312c 0,111 101,235 242,235h 162c 109,1 144,49 144,136v 162c 0,73 -53,130 -118,130l -353,1"
    />
  </defs>

<g
  fill="none"
  stroke="url(#locations-route-gradient)"
  strokeLinecap="round"
  filter="url(#locations-route-lighting)"
>


<use
  href="#linePath01"
  fill="none"
  strokeWidth="20"
  strokeDasharray="20 50 120 50 20 50 300 50 20 50 150 50 20 50 110 45 30 50 90 45 25 55 145 50 65 20000"
/>

<use
  href="#linePath02"
  fill="none"
  strokeWidth="34"
  strokeDasharray="34 60 120 60 34 60 300 60 34 60 150 60 34 60 110 50 35 55 100 50 45 65 160 55 30 20000"
/>

<use
  href="#linePath03"
  fill="none"
  strokeWidth="25"
  strokeDasharray="25 40 120 40 25 40 250 40 25 40 150 40 25 45 110 50 35 45 85 50 25 45 140 55 40 50 75 20000"
/>

<use
  href="#linePath04"
  fill="none"
  strokeWidth="40"
  strokeDasharray="40 70 100 70 40 70 200 70 40 55 130 60 45 65 100 60 35 75 155 65 55 20000"
/>


</g>
</svg>
   </div>


  <div className="locations-route-cards">
    <LocationsCards />
  </div>
</div>

{/* <SEOList /> */}
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

function SEOList() {
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

  <div className="locations-inner" ref={containerRef}>
    <div className="locations-grid">
      {ROWS.map((row, rowIndex) => (
        <div key={row.join("-")} className="locations-row">
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
                  <div className="locations-highlight" aria-hidden="true">
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


  {/* <div className="locations-map-background">
    <MapboxGLJS />
  </div> */}
</div>
  );
}


