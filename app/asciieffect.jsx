
"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
     CanvasTexture,
  DataTexture,
  FloatType,
  LinearFilter,
    LinearMipmapLinearFilter,
  RedFormat,
  Camera,
  Color,
  GLSL3,
  LinearSRGBColorSpace,
  Mesh,
  NearestFilter,
  NoBlending,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
} from "three";



const CELL_FRAG = `precision highp float;
out vec4 outColor;
uniform sampler2D tScene;
uniform sampler2D tShapes;
uniform vec2 uResolution;
uniform vec2 uCellPx;
uniform int uGlyphCount;

const float CONTRAST = 1.5;
const float EDGE_CONTRAST = 3.0;

const vec2 INNER[6] = vec2[6](
  vec2(0.28, 0.26), vec2(0.72, 0.14),
  vec2(0.28, 0.56), vec2(0.72, 0.44),
  vec2(0.28, 0.86), vec2(0.72, 0.74)
);
const vec2 OUTER[10] = vec2[10](
  vec2(0.28, -0.2), vec2(0.72, -0.2),
  vec2(-0.22, 0.25), vec2(1.22, 0.25),
  vec2(-0.22, 0.5), vec2(1.22, 0.5),
  vec2(-0.22, 0.75), vec2(1.22, 0.75),
  vec2(0.28, 1.2), vec2(0.72, 1.2)
);
const vec2 RING[6] = vec2[6](
  vec2(1.0, 0.0), vec2(0.5, 0.8660254), vec2(-0.5, 0.8660254),
  vec2(-1.0, 0.0), vec2(-0.5, -0.8660254), vec2(0.5, -0.8660254)
);

vec2 cellBase;

vec4 fetchTap(vec2 p) {
  vec2 uv = p / uResolution;

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    return vec4(0.0);
  }

  return texture(tScene, uv);
}

vec4 sampleCircle(vec2 c) {
  vec2 middle = cellBase + vec2(c.x, 1.0 - c.y) * uCellPx;
  float r = uCellPx.y * 0.161;
  vec4 acc = fetchTap(middle);

  for (int k = 0; k < 6; k++) {
    acc += fetchTap(middle + RING[k] * r);
  }

  return acc / 7.0;
}

float circleLum(vec4 acc) {
  vec3 straight = acc.rgb / max(acc.a, 1e-4);

  return clamp(dot(straight, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0) * acc.a;
}

float dirContrast(float value, float ext) {
  float peak = max(value, ext);

  if (peak < 1e-4) {
    return value;
  }

  return pow(value / peak, EDGE_CONTRAST) * peak;
}

void main() {
  cellBase = floor(gl_FragCoord.xy) * uCellPx;

  float v[6];
  vec3 colAcc = vec3(0.0);
  float alphaAcc = 0.0;

  for (int i = 0; i < 6; i++) {
    vec4 acc = sampleCircle(INNER[i]);

    v[i] = circleLum(acc);
    colAcc += acc.rgb;
    alphaAcc += acc.a;
  }

  float e[10];

  for (int i = 0; i < 10; i++) {
    e[i] = circleLum(sampleCircle(OUTER[i]));
  }

  v[0] = dirContrast(v[0], max(max(e[0], e[1]), max(e[2], e[4])));
  v[1] = dirContrast(v[1], max(max(e[0], e[1]), max(e[3], e[5])));
  v[2] = dirContrast(v[2], max(e[2], max(e[4], e[6])));
  v[3] = dirContrast(v[3], max(e[3], max(e[5], e[7])));
  v[4] = dirContrast(v[4], max(max(e[4], e[6]), max(e[8], e[9])));
  v[5] = dirContrast(v[5], max(max(e[5], e[7]), max(e[8], e[9])));

  float peak = max(max(max(v[0], v[1]), max(v[2], v[3])), max(v[4], v[5]));

  if (peak > 1e-4) {
    for (int i = 0; i < 6; i++) {
      v[i] = pow(v[i] / peak, CONTRAST) * peak;
    }
  }

  int best = 0;
  float bestD = 1e9;

  for (int g = 0; g < uGlyphCount; g++) {
    float d = 0.0;

    for (int i = 0; i < 6; i++) {
      float diff = v[i] - texelFetch(tShapes, ivec2(i, g), 0).r;

      d += diff * diff;
    }

    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }

  outColor = vec4(colAcc / max(alphaAcc, 1e-4), float(best) / 255.0);
}`;
const POST_FRAG = `precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D tCells;
uniform sampler2D tAtlas;
uniform vec2 uCellsPerUv;
uniform vec2 uGrid;
uniform vec2 uAtlasGrid;
uniform vec2 uAtlasPad;
uniform vec2 uAtlasInner;
uniform vec3 uColor;

void main() {
  vec2 cellPos = vUv * uCellsPerUv;
  vec2 cell = clamp(floor(cellPos), vec2(0.0), uGrid - 1.0);
  float glyph = floor(texelFetch(tCells, ivec2(cell), 0).a * 255.0 + 0.5);
  vec2 local = clamp(cellPos - cell, 0.0, 1.0);
  float gx = mod(glyph, uAtlasGrid.x);
  float gy = floor(glyph / uAtlasGrid.x);
  vec2 atlasUv = vec2(
    (gx + uAtlasPad.x + local.x * uAtlasInner.x) / uAtlasGrid.x,
    (uAtlasGrid.y - gy - 1.0 + uAtlasPad.y + local.y * uAtlasInner.y) / uAtlasGrid.y
  );
  vec2 atlasStep = uAtlasInner / uAtlasGrid;
  float mask = textureGrad(tAtlas, atlasUv, dFdx(cellPos) * atlasStep, dFdy(cellPos) * atlasStep).a;

float brightness = 1.8;
float boostedMask = min(mask * brightness, 1.0);

outColor = vec4(uColor * boostedMask, boostedMask);
}`;
const QUAD_VERT = `
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const DISPLAY_CELL_HEIGHT = 10;
const DISPLAY_CELL_WIDTH = 6;
const SCENE_CELL_PX = 12;

function makeMaterial(fragmentShader, uniforms) {
  return new ShaderMaterial({
    glslVersion: GLSL3,
    vertexShader: QUAD_VERT,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
    blending: NoBlending,
  });
}

export default function AsciiEffect() {
const { gl, scene, camera, size } = useThree();
  const pipeline = useRef(null);

  useEffect(() => {
    let cancelled = false;

loadGlyphAtlas(
  "monospace",
  400,
  DISPLAY_CELL_WIDTH / DISPLAY_CELL_HEIGHT
)
      .then((atlas) => {
        if (cancelled) return;

        const sceneTarget = new WebGLRenderTarget(1, 1, {
          samples: 4,
          depthBuffer: true,
          stencilBuffer: false,
        });

        const cellTarget = new WebGLRenderTarget(1, 1, {
          minFilter: NearestFilter,
          magFilter: NearestFilter,
          depthBuffer: false,
          stencilBuffer: false,
          generateMipmaps: false,
        });

        const cellMaterial = makeMaterial(CELL_FRAG, {
          tScene: { value: sceneTarget.texture },
          tShapes: { value: atlas.shapes },
          uResolution: { value: new Vector2(1, 1) },
          uCellPx: { value: new Vector2(1, 1) },
          uGlyphCount: { value: atlas.count },
        });

        const postMaterial = makeMaterial(POST_FRAG, {
          tCells: { value: cellTarget.texture },
          tAtlas: { value: atlas.sheet },
          uCellsPerUv: { value: new Vector2(1, 1) },
          uGrid: { value: new Vector2(1, 1) },
          uAtlasGrid: { value: atlas.grid },
          uAtlasPad: { value: atlas.pad },
          uAtlasInner: { value: atlas.inner },
          uColor: { value: new Color("#345BEB") },
        });

        const frame = new Scene();
        const frameCamera = new Camera();
        const quad = new Mesh(
          new PlaneGeometry(2, 2),
          cellMaterial
        );

        quad.frustumCulled = false;
        frame.add(quad);

        pipeline.current = {
          sceneTarget,
          cellTarget,
          cellMaterial,
          postMaterial,
          frame,
          frameCamera,
          quad,
        };
      });

    return () => {
      cancelled = true;

      const p = pipeline.current;
      if (!p) return;

      p.sceneTarget.dispose();
      p.cellTarget.dispose();
      p.cellMaterial.dispose();
      p.postMaterial.dispose();
      p.quad.geometry.dispose();

      pipeline.current = null;
    };
  }, []);

  useFrame(() => {
    const p = pipeline.current;
    if (!p) return;

    const width = size.width;
    const height = size.height;


const cols = Math.max(
  Math.ceil(width / DISPLAY_CELL_WIDTH),
  1
);

const rows = Math.max(
  Math.ceil(height / DISPLAY_CELL_HEIGHT),
  1
);

const scale = SCENE_CELL_PX / DISPLAY_CELL_HEIGHT;
    const sceneWidth = Math.max(Math.round(width * scale), 1);
    const sceneHeight = Math.max(Math.round(height * scale), 1);

if (
  p.sceneTarget.width !== sceneWidth ||
  p.sceneTarget.height !== sceneHeight ||
  p.cellTarget.width !== cols ||
  p.cellTarget.height !== rows
) {
      p.sceneTarget.setSize(sceneWidth, sceneHeight);
      p.cellTarget.setSize(cols, rows);

      p.cellMaterial.uniforms.uResolution.value.set(
        sceneWidth,
        sceneHeight
      );

p.cellMaterial.uniforms.uCellPx.value.set(
  DISPLAY_CELL_WIDTH * scale,
  DISPLAY_CELL_HEIGHT * scale
);

p.postMaterial.uniforms.uCellsPerUv.value.set(
  width / DISPLAY_CELL_WIDTH,
  height / DISPLAY_CELL_HEIGHT
);

      p.postMaterial.uniforms.uGrid.value.set(cols, rows);
    }

    const previousTarget = gl.getRenderTarget();
    const previousColorSpace = gl.outputColorSpace;
    const previousAutoClear = gl.autoClear;
    const previousClearColor = new Color();
    gl.getClearColor(previousClearColor);
    const previousClearAlpha = gl.getClearAlpha();

    gl.outputColorSpace = LinearSRGBColorSpace;
    gl.autoClear = true;

    try {
      // Pass 1: render the rotating tooth.
      gl.setRenderTarget(p.sceneTarget);
      gl.setClearColor(0x000000, 0);
      gl.clear(true, true, true);
const previousBackground = scene.background;
scene.background = null;

try {
  gl.render(scene, camera);
} finally {
  scene.background = previousBackground;
}

      // Pass 2: choose the best ASCII character per cell.
      p.quad.material = p.cellMaterial;
      gl.setRenderTarget(p.cellTarget);
      gl.render(p.frame, p.frameCamera);

      // Pass 3: draw the ASCII characters.
      p.quad.material = p.postMaterial;
      gl.setRenderTarget(null);
      gl.render(p.frame, p.frameCamera);
    } finally {
      gl.setRenderTarget(previousTarget);
      gl.outputColorSpace = previousColorSpace;
      gl.autoClear = previousAutoClear;
      gl.setClearColor(previousClearColor, previousClearAlpha);
    }
  }, 1);

  return null;
}


const INNER_SAMPLES = [
  [0.28, 0.26],
  [0.72, 0.14],
  [0.28, 0.56],
  [0.72, 0.44],
  [0.28, 0.86],
  [0.72, 0.74],
];

const GLYPHS = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i));

const CELL_HEIGHT = 64;

/** Bleed around each cell, so a glyph overshooting its box is not clipped into a false edge. */
const PAD = 8;

const atlasCache = new Map();

function shapeVectors(image, cols, cellW, cellH) {
  const count = GLYPHS.length;
  const vectors = new Float32Array(count * INNER_SAMPLES.length);
  const radius = cellH * 0.26;
  const padW = cellW + PAD * 2;
  const padH = cellH + PAD * 2;

  for (let glyph = 0; glyph < count; glyph++) {
    const originX = (glyph % cols) * padW + PAD;
    const originY = Math.floor(glyph / cols) * padH + PAD;

    for (let sample = 0; sample < INNER_SAMPLES.length; sample++) {
      const cx = INNER_SAMPLES[sample][0] * cellW;
      const cy = INNER_SAMPLES[sample][1] * cellH;

      let sum = 0;
      let total = 0;

      for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
        for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
          const dx = x + 0.5 - cx;
          const dy = y + 0.5 - cy;

          if (dx * dx + dy * dy > radius * radius) {
            continue;
          }

          total++;

          if (x < -PAD || y < -PAD || x >= cellW + PAD || y >= cellH + PAD) {
            continue;
          }

          sum += image.data[((originY + y) * image.width + originX + x) * 4 + 3];
        }
      }

      vectors[glyph * INNER_SAMPLES.length + sample] = total > 0 ? sum / (total * 255) : 0;
    }
  }

  // Normalized per sample point, not globally. The cell's own six values get the same treatment,
  // so a flat tone still spreads across the vocabulary instead of collapsing onto one glyph.
  for (let sample = 0; sample < INNER_SAMPLES.length; sample++) {
    let peak = 0;

    for (let glyph = 0; glyph < count; glyph++) {
      peak = Math.max(peak, vectors[glyph * INNER_SAMPLES.length + sample]);
    }

    if (peak > 0) {
      for (let glyph = 0; glyph < count; glyph++) {
        vectors[glyph * INNER_SAMPLES.length + sample] /= peak;
      }
    }
  }

  return vectors;
}

function rasterize(font, weight, aspect) {
  const cellH = CELL_HEIGHT;
  const cellW = Math.max(Math.round(cellH * aspect), 8);
  const padW = cellW + PAD * 2;
  const padH = cellH + PAD * 2;
  const cols = Math.ceil(Math.sqrt(GLYPHS.length));
  const rows = Math.ceil(GLYPHS.length / cols);
  const source = document.createElement("canvas");

  source.width = cols * padW;
  source.height = rows * padH;

  const ctx = source.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    throw new Error("2d context unavailable");
  }

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${weight} ${Math.floor(Math.min(cellH * 0.92, cellW / 0.58))}px ${font}`;

  for (let glyph = 0; glyph < GLYPHS.length; glyph++) {
    ctx.fillText(GLYPHS[glyph], (glyph % cols) * padW + padW / 2, Math.floor(glyph / cols) * padH + padH / 2);
  }

  const image = ctx.getImageData(0, 0, source.width, source.height);

  // Drawn top down, sampled bottom up, which is the flip `CanvasTexture` does by default.
  const sheet = new CanvasTexture(source);

  sheet.minFilter = LinearMipmapLinearFilter;
  sheet.magFilter = LinearFilter;

  // One row per glyph, six texels wide, read with `texelFetch`: exact texels, nothing filtered.
  const shapes = new DataTexture(
    shapeVectors(image, cols, cellW, cellH),
    INNER_SAMPLES.length,
    GLYPHS.length,
    RedFormat,
    FloatType
  );

  shapes.needsUpdate = true;

  return {
    sheet,
    shapes,
    count: GLYPHS.length,
    grid: new Vector2(cols, rows),
    pad: new Vector2(PAD / padW, PAD / padH),
    inner: new Vector2(cellW / padW, cellH / padH),
  };
}

function loadGlyphAtlas(font, weight, aspect) {
  const key = `${font}|${weight}|${aspect}`;
  const pending = atlasCache.get(key);

  if (pending) {
    return pending;
  }

  const built = (document.fonts?.load(`${weight} ${CELL_HEIGHT}px ${font}`) ?? Promise.resolve())
    .catch(() => {})
    .then(() => rasterize(font, weight, aspect));

  atlasCache.set(key, built);

  return built;
}