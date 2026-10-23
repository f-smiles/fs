
/*
 * FREYSMILES — FLUID REVEAL SHADERS
 *
 * Simulation:
 * 1. Splat
 * 2. Divergence
 * 3. Pressure
 * 4. Gradient subtraction
 * 5. Advection (velocity and dye)
 * 6. Display / image reveal
 *
 * GLSL ES 1.00 — compatible with THREE.ShaderMaterial
 */

// --------------------------------------------------
// FULLSCREEN VERTEX
// --------------------------------------------------

export const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;


// --------------------------------------------------
// 1. SPLAT
// Injects mouse force or dye into a texture.
//
// For velocity:
//   uValue = vec3(velocityX, velocityY, 0.0)
//
// For dye:
//   uValue = vec3(1.0)
//
// uRadius is in UV-height units.
// --------------------------------------------------

export const splatShader = `
  uniform sampler2D uTarget;

  uniform vec2 uPoint;
  uniform vec3 uValue;

  uniform float uRadius;
  uniform float uAspect;
  uniform float uClampDye;

  varying vec2 vUv;

  void main() {
    vec2 p = vUv - uPoint;
    p.x *= uAspect;

    float radius = max(uRadius, 0.0001);

    float influence = exp(
      -dot(p, p) / (radius * radius)
    );

    vec3 previous = texture2D(uTarget, vUv).rgb;

    vec3 result = previous + uValue * influence;

    // Cap dye density without affecting velocity.
    if (uClampDye > 0.5) {
      result = clamp(result, 0.0, 1.0);
    }

    gl_FragColor = vec4(result, 1.0);
  }
`;

// --------------------------------------------------
// 2. DIVERGENCE
// Measures whether the velocity field is expanding
// or contracting at each simulation cell.
// --------------------------------------------------

export const divergenceShader = `
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;

  varying vec2 vUv;

  void main() {
    float L = texture2D(
      uVelocity,
      vUv - vec2(uTexelSize.x, 0.0)
    ).x;

    float R = texture2D(
      uVelocity,
      vUv + vec2(uTexelSize.x, 0.0)
    ).x;

    float B = texture2D(
      uVelocity,
      vUv - vec2(0.0, uTexelSize.y)
    ).y;

    float T = texture2D(
      uVelocity,
      vUv + vec2(0.0, uTexelSize.y)
    ).y;

    float divergence = 0.5 * (
      R - L + T - B
    );

    gl_FragColor = vec4(
      divergence,
      0.0,
      0.0,
      1.0
    );
  }
`;


// --------------------------------------------------
// 3. PRESSURE
// Jacobi iteration.
//
// Run this shader repeatedly, ping-ponging
// between pressure render targets.
// --------------------------------------------------

export const pressureShader = `
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;

  uniform vec2 uTexelSize;

  varying vec2 vUv;

  void main() {
    float L = texture2D(
      uPressure,
      vUv - vec2(uTexelSize.x, 0.0)
    ).r;

    float R = texture2D(
      uPressure,
      vUv + vec2(uTexelSize.x, 0.0)
    ).r;

    float B = texture2D(
      uPressure,
      vUv - vec2(0.0, uTexelSize.y)
    ).r;

    float T = texture2D(
      uPressure,
      vUv + vec2(0.0, uTexelSize.y)
    ).r;

    float divergence = texture2D(
      uDivergence,
      vUv
    ).r;

    float pressure = (
      L + R + B + T - divergence
    ) * 0.25;

    gl_FragColor = vec4(
      pressure,
      0.0,
      0.0,
      1.0
    );
  }
`;


// --------------------------------------------------
// 4. GRADIENT SUBTRACTION
// Removes pressure gradients from velocity,
// making the flow approximately incompressible.
// --------------------------------------------------

export const gradientSubtractShader = `
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;

  uniform vec2 uTexelSize;

  varying vec2 vUv;

  void main() {
    float L = texture2D(
      uPressure,
      vUv - vec2(uTexelSize.x, 0.0)
    ).r;

    float R = texture2D(
      uPressure,
      vUv + vec2(uTexelSize.x, 0.0)
    ).r;

    float B = texture2D(
      uPressure,
      vUv - vec2(0.0, uTexelSize.y)
    ).r;

    float T = texture2D(
      uPressure,
      vUv + vec2(0.0, uTexelSize.y)
    ).r;

    vec2 velocity = texture2D(
      uVelocity,
      vUv
    ).xy;

    velocity -= vec2(
      R - L,
      T - B
    ) * 0.5;

    gl_FragColor = vec4(
      velocity,
      0.0,
      1.0
    );
  }
`;


// --------------------------------------------------
// 5. ADVECTION
// Transports a texture through the velocity field.
//
// Use for both:
// - Velocity (low-resolution target)
// - Dye/reveal mask (higher-resolution target)
//
// Velocity is stored in UV units per second.
// --------------------------------------------------

export const advectionShader = `
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;

  uniform vec2 uTexelSize;

  uniform float uDt;
  uniform float uDissipation;

  varying vec2 vUv;

  void main() {
    vec2 velocity = texture2D(
      uVelocity,
      vUv
    ).xy;

    vec2 coord = clamp(
      vUv - uDt * velocity,
      vec2(0.0),
      vec2(1.0)
    );

    vec4 result = texture2D(
      uSource,
      coord
    );

    result.rgb *= uDissipation;

    gl_FragColor = vec4(
      result.rgb,
      1.0
    );
  }
`;


// --------------------------------------------------
// 6. DISPLAY — CREAMY IMAGE REVEAL
//
// Gray background above.
// Photograph appears wherever dye exists.
//
// The dye itself moves through the fluid solver.
// This shader controls only the visual boundary.
// --------------------------------------------------

export const displayShader = `
uniform vec2 uTexelSize;
  uniform sampler2D uDye;
  uniform sampler2D uImage;

  uniform vec2 uResolution;
  uniform vec2 uImageSize;

  uniform vec3 uBackgroundColor;

  uniform float uTime;

  varying vec2 vUv;

  // Image equivalent of CSS object-fit: cover.
  vec2 coverUV(vec2 uv, vec2 imageSize) {
    vec2 safeSize = max(imageSize, vec2(1.0));

    vec2 scale = uResolution / safeSize;
    float factor = max(scale.x, scale.y);

    vec2 scaledSize = safeSize * factor;
    vec2 offset = (uResolution - scaledSize) * 0.5;

    return (
      uv * uResolution - offset
    ) / scaledSize;
  }

  void main() {
    vec2 uv = vUv;

    // Read the fluid's dye density.
    float dye = texture2D(uDye, uv).r;

    // Gentle broad variation in the threshold.
    // This affects the silhouette, not the image.
    float organic =
      sin(uv.x * 8.0 + uTime * 0.32) *
      cos(uv.y * 6.0 - uTime * 0.27) *
      0.018;

    organic +=
      sin(uv.x * 15.0 - uTime * 0.23) *
      cos(uv.y * 12.0 + uTime * 0.19) *
      0.007;

    float field = dye + organic * smoothstep(
      0.12,
      0.45,
      dye
    );

vec2 inset = vec2(45.0, 45.0) * uTexelSize;

// Different clearance for each edge, in pixels
float leftInset = 45.0;
float rightInset = 45.0;
float bottomInset = 45.0;
float topInset = 12.0;

float fadeWidth = 20.0;

float left = smoothstep(
  leftInset * uTexelSize.x,
  (leftInset + fadeWidth) * uTexelSize.x,
  vUv.x
);

float right = smoothstep(
  rightInset * uTexelSize.x,
  (rightInset + fadeWidth) * uTexelSize.x,
  1.0 - vUv.x
);

float bottom = smoothstep(
  bottomInset * uTexelSize.y,
  (bottomInset + fadeWidth) * uTexelSize.y,
  vUv.y
);

float top = smoothstep(
  topInset * uTexelSize.y,
  (topInset + fadeWidth) * uTexelSize.y,
  1.0 - vUv.y
);
float boundary = left * right * bottom * top;

field *= boundary;

float reveal = smoothstep(0.42, 0.44, field);

// Calculate the image coordinates
vec2 imageUV = coverUV(
  uv,
  uImageSize
);

vec3 imageColor = texture2D(
  uImage,
  imageUV
).rgb;

vec3 finalColor = mix(
  uBackgroundColor,
  imageColor,
  reveal
);

gl_FragColor = vec4(finalColor, 1.0);

#include <tonemapping_fragment>
#include <colorspace_fragment>
gl_FragColor = vec4(
  finalColor,
  1.0
);

#include <tonemapping_fragment>
#include <colorspace_fragment>
  }
`;

