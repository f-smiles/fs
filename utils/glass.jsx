import { useRef, useEffect } from "react"
import * as THREE from "three"

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uTextureSize;
uniform vec2 uMouse;
uniform float uParallaxStrength;
uniform float uDistortionMultiplier;
uniform float uGlassStrength;
uniform float ustripesFrequency;
uniform float uglassSmoothness;
uniform float uEdgePadding;

varying vec2 vUv;

vec2 getCoverUV(vec2 uv, vec2 textureSize) {
  if (textureSize.x < 1.0 || textureSize.y < 1.0) return uv;

  vec2 s = uResolution / textureSize;
  float scale = min(s.x, s.y);

  vec2 scaledSize = textureSize * scale;
  vec2 offset = (uResolution - scaledSize) * 0.5;

  return (uv * uResolution - offset) / scaledSize;
}

float displacement(float x, float num_stripes, float strength) {
  float modulus = 1.0 / num_stripes;
  return mod(x, modulus) * strength;
}

float fractalGlass(float x) {
  float d = 0.0;
  for (int i = -5; i <= 5; i++) {
    d += displacement(x + float(i) * uglassSmoothness, ustripesFrequency, uGlassStrength);
  }
  d = d / 11.0;
  return x + d;
}

float smoothEdge(float x, float padding) {
  float edge = padding;
  if (x < edge) return smoothstep(0.0, edge, x);
  if (x > 1.0 - edge) return smoothstep(1.0, 1.0 - edge, x);
  return 1.0;
}

void main() {
  vec2 uv = vUv;

  float originalX = uv.x;
  float edgeFactor = smoothEdge(originalX, uEdgePadding);

  float distortedX = fractalGlass(originalX);
  uv.x = mix(originalX, distortedX, edgeFactor);

  float distortionFactor = uv.x - originalX;
  float parallaxDirection = -sign(0.5 - uMouse.x);

  vec2 parallaxOffset = vec2(
    parallaxDirection * abs(uMouse.x - 0.5) * uParallaxStrength * (1.0 + abs(distortionFactor) * uDistortionMultiplier),
    0.0
  );

  parallaxOffset *= edgeFactor;
  

  uv += parallaxOffset;
  
  vec2 coverUV = getCoverUV(uv, uTextureSize);

  coverUV = clamp(coverUV, 0.0, 1.0);

  vec4 color = texture2D(uTexture, coverUV);

color.rgb *= 1.35;

// compress contrast toward highlights (prevents muddy mids)
color.rgb = mix(color.rgb, vec3(1.0), 0.12);

color.rgb = pow(color.rgb, vec3(0.85));

color.rgb = mix(color.rgb, vec3(0.97, 0.98, 1.0), 0.08);

gl_FragColor = color;
}
`

const config = {
  lerpFactor: 0.035,
  parallaxStrength: 0.1,
  distortionMultiplier: 10,
  glassStrength: 2.0,
  glassSmoothness: 0.0001,
  stripesFrequency: 35,
  edgePadding: 0.1,
}

export default function FlutedGlassEffect({
  src,
  className = "",
}) {
  const containerRef = useRef(null);



  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const scene = new THREE.Scene();

    const camera = new THREE.OrthographicCamera(
      -1, 1, 1, -1, 0.01, 10
    );
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);



    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const mouse = new THREE.Vector2(0.5, 0.5);
    const targetMouse = new THREE.Vector2(0.5, 0.5);

    const textureSize = new THREE.Vector2(1, 1);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
    uResolution: {
  value: new THREE.Vector2(1, 1),
},
        uTextureSize: { value: textureSize },
        uMouse: { value: mouse },
        uParallaxStrength: {
          value: config.parallaxStrength,
        },
        uDistortionMultiplier: {
          value: config.distortionMultiplier,
        },
        uGlassStrength: {
          value: config.glassStrength,
        },
        ustripesFrequency: {
          value: config.stripesFrequency,
        },
        uglassSmoothness: {
          value: config.glassSmoothness,
        },
        uEdgePadding: {
          value: config.edgePadding,
        },
      },
      vertexShader,
      fragmentShader,
    });

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      material
    );

    scene.add(mesh);

    let texture = null;
    let video = null;

    const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(src);

    if (isVideo) {
      // Create a video element for the WebGL texture
      video = document.createElement("video");

      video.src = src;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";

      // Required for reliable inline playback
      video.setAttribute("playsinline", "");
      video.setAttribute("muted", "");

      texture = new THREE.VideoTexture(video);

      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      material.uniforms.uTexture.value = texture;

      const onVideoLoaded = () => {
        textureSize.set(
          video.videoWidth,
          video.videoHeight
        );
      };

      video.addEventListener(
        "loadedmetadata",
        onVideoLoaded
      );

      // Begin playback
      video.play().catch((error) => {
        console.warn("Video autoplay was prevented:", error);
      });

      // Save handler for cleanup
      video._onVideoLoaded = onVideoLoaded;
    } else {
      // Existing image support
      const loader = new THREE.TextureLoader();

      texture = loader.load(src, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;

        t.anisotropy =
          renderer.capabilities.getMaxAnisotropy();

        const img = t.image;

        textureSize.set(
          img.naturalWidth || img.width,
          img.naturalHeight || img.height
        );

        material.uniforms.uTexture.value = t;
      });
    }

    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();

      targetMouse.x =
        (e.clientX - rect.left) / rect.width;

      targetMouse.y =
        1.0 - (e.clientY - rect.top) / rect.height;
    };

const onResize = () => {
  const width = container.clientWidth;
  const height = container.clientHeight;

  if (!width || !height) return;

  renderer.setSize(width, height, false);

  material.uniforms.uResolution.value.set(width, height);

  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
};

    container.addEventListener(
      "mousemove",
      onMouseMove
    );

const resizeObserver = new ResizeObserver(onResize);

resizeObserver.observe(container);

onResize();

    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);

      mouse.lerp(
        targetMouse,
        config.lerpFactor
      );

      material.uniforms.uMouse.value.copy(mouse);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);

      container.removeEventListener(
        "mousemove",
        onMouseMove
      );

 resizeObserver.disconnect();

      if (video) {
        video.pause();

        video.removeEventListener(
          "loadedmetadata",
          video._onVideoLoaded
        );

        video.removeAttribute("src");
        video.load();
      }

      texture?.dispose();
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [src]);

 return (
  <div
    ref={containerRef}
    className={className}
    style={{
      width: "100%",
      height: "100%",
      position: "relative",
    }}
  />
);
}
