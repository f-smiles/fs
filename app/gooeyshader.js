
export const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;


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

export const advectionShader = `
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
uniform vec2 uDrift;
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
  vUv - uDt * (velocity + uDrift),
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


export const displayShader = `
uniform vec2 uTexelSize;
  uniform sampler2D uDye;
  uniform sampler2D uImage;

  uniform vec2 uResolution;
  uniform vec2 uImageSize;

  uniform vec3 uBackgroundColor;

  uniform float uTime;

  varying vec2 vUv;

// Image equivalent of CSS object-fit: contain.
vec2 containUV(vec2 uv, vec2 imageSize) {
  vec2 safeSize = max(imageSize, vec2(1.0));

  vec2 scale = uResolution / safeSize;
  float factor = min(scale.x, scale.y);

  vec2 scaledSize = safeSize * factor;
  vec2 offset = (uResolution - scaledSize) * 0.5;

  return (
    uv * uResolution - offset
  ) / scaledSize;
}
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float edgeNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  // Less smoothing = more angular irregularities
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}
  void main() {
    vec2 uv = vUv;

    // Read the fluid's dye density.
    float dye = texture2D(uDye, uv).r;

    // Gentle broad variation in the threshold.
    // This affects the silhouette, not the image.
// Large irregular contours
float coarse = edgeNoise(
  uv * 12.0 + vec2(uTime * 0.08, 0.0)
);

// Medium-sized jagged contours
float medium = edgeNoise(
  uv * 45.0 - vec2(0.0, uTime * 0.12)
);

// Fine, sharper irregularities
float fine = edgeNoise(
  uv * 115.0 + vec2(uTime * 0.05, -uTime * 0.07)
);

// Make fine detail appear in patches
float patches = smoothstep(0.35, 0.7, coarse);

float organic =
  (coarse - 0.5) * 0.07 +
  (medium - 0.5) * 0.065 +
  (fine - 0.5) * patches * 0.035;

// Keep irregularity in stronger dye regions,
// but remove it as the dye becomes faint.
float organicStrength = smoothstep(
  0.48,
  0.85,
  dye
);

// Distort the painted silhouette
float field = dye + organic * organicStrength;

// Cleanly suppress the last remnants of the blob
float cleanup = smoothstep(
  0.46,
  0.58,
  dye
);

field *= cleanup;

// Distance to the permitted edges, measured in pixels.
vec2 pixel = vUv / uTexelSize;

vec2 canvasSize = 1.0 / uTexelSize;

float leftDistance = pixel.x - 45.0;
float rightDistance = canvasSize.x - pixel.x - 45.0;
float bottomDistance = pixel.y - 45.0;
float topDistance = canvasSize.y - pixel.y - 12.0;

float edgeDistance = min(
  min(leftDistance, rightDistance),
  min(bottomDistance, topDistance)
);

float edgeFade = 1.0 - smoothstep(
  0.0,
  35.0,
  edgeDistance
);

field -= edgeFade * 0.25;


float reveal = smoothstep(
  0.48,
  0.485,
  field
);

vec2 imageUV = containUV(uv, uImageSize);
vec3 imageColor = texture2D(
  uImage,
  imageUV
).rgb;

float insideImage =
  step(0.0, imageUV.x) *
  step(imageUV.x, 1.0) *
  step(0.0, imageUV.y) *
  step(imageUV.y, 1.0);

vec3 finalColor = mix(
  uBackgroundColor,
  imageColor,
  reveal * insideImage
);

gl_FragColor = vec4(finalColor, 1.0);

#include <tonemapping_fragment>
#include <colorspace_fragment>

  }
`;

