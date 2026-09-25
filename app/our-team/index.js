"use client";
import "../mouse-gooey-effect-5/css/style.css";
import { Item } from "../../utils/Item";
import Image from "next/image";
import Lenis from "@studio-freight/lenis";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { OrbitControls, Environment } from "@react-three/drei";
import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useLayoutEffect,
  useCallback,
  forwardRef,
} from "react";
import { SplitText } from "gsap/SplitText";
import { motion, useScroll, useTransform } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ArrowLeftIcon from "../_components/ui/ArrowLeftIcon";
import ArrowRightIcon from "../_components/ui/ArrowRightIcon";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { NormalBlending } from "three";
import {
  TextureLoader,
  CubeCamera,
  WebGLCubeRenderTarget,
  LinearMipmapLinearFilter,
  RGBFormat,
} from "three";
import GridContainer, {
  MemberCard,
  items,
  ImageCanvas,
} from "../mouse-gooey-effect-5/components/GridContainer";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

function Grid() {
  const cellsRef = useRef([]);

  useEffect(() => {
    const cells = cellsRef.current;

    function randomize() {
      cells.forEach((cell) => cell?.classList.remove("active"));
      const count = Math.floor(Math.random() * 3) + 2;
      const shuffled = [...cells].sort(() => 0.5 - Math.random());

      shuffled.slice(0, count).forEach((cell) => {
        cell?.classList.add("active");

        setTimeout(() => {
          cell?.classList.remove("active");
        }, 1200);
      });
    }

    randomize();
    const interval = setInterval(randomize, 1600);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="footer-grid">
      {Array.from({ length: 36 }).map((_, i) => (
        <div
          key={i}
          ref={(el) => (cellsRef.current[i] = el)}
          className="is-desktop"
        />
      ))}
    </div>
  );
}
function AsciiInstanced() {
  const containerRef = useRef(null);
  
useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const video = document.createElement("video");
    video.src = "/videos/mchammer.mp4";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.play().catch(() => {});

    const sampleCanvas = document.createElement("canvas");
    const sampleCtx = sampleCanvas.getContext("2d");
    if (!sampleCtx) return;

    const vertexShader = `
      attribute float instanceScale;

      varying vec2 vUv;
      varying float vScale;

      void main() {
        vUv = uv;
        vScale = instanceScale;

        gl_Position =
          projectionMatrix *
          modelViewMatrix *
          instanceMatrix *
          vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D chars;
      uniform float charCount;
uniform float uBrightness;
      varying vec2 vUv;
      varying float vScale;

      void main() {
        float index = floor(vScale * (charCount - 1.0));

        vec2 newUV = vec2(
          vUv.x / charCount + index / charCount,
          vUv.y
        );

        vec4 charSample = texture2D(chars, newUV);
        float mask = charSample.r;

        gl_FragColor = vec4(vec3(mask * uBrightness), 1.0);
      }
    `;

    const gridWidth = 120;
    const gridHeight = 120;

    const total = gridWidth * gridHeight;
    const textGridWidth = 320;
    const textGridHeight = 180;
    const textTotal = textGridWidth * textGridHeight;
    const cellSizeX = 0.14;
    const cellSizeY = 0.14;

    sampleCanvas.width = gridWidth;
    sampleCanvas.height = gridHeight;

const geometry = new THREE.PlaneGeometry(0.12, 0.12);


    const scales = new Float32Array(total);
    geometry.setAttribute(
      "instanceScale",
      new THREE.InstancedBufferAttribute(scales, 1),
    );

    function createAsciiAtlas(charCount = 48) {
      const density = [" ", ".", ":", "-", "=", "+", "*", "#", "@"];

      const chars = [];
      const maxIndex = density.length - 1;

      for (let i = 0; i < charCount; i++) {
        const t = i / (charCount - 1);
        const idx = Math.round(t * maxIndex);
        chars.push(density[idx]);
      }

      const atlasCanvas = document.createElement("canvas");
      atlasCanvas.width = charCount * 64;
      atlasCanvas.height = 64;

      const atlasCtx = atlasCanvas.getContext("2d");
      atlasCtx.fillStyle = "black";
      atlasCtx.fillRect(0, 0, atlasCanvas.width, atlasCanvas.height);

      atlasCtx.fillStyle = "white";
      atlasCtx.font = "40px Lato";
      atlasCtx.textAlign = "center";
      atlasCtx.textBaseline = "middle";

      chars.forEach((char, i) => {
        atlasCtx.fillText(char, i * 64 + 32, 32);
      });

      const texture = new THREE.CanvasTexture(atlasCanvas);
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;

      return texture;
    }

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        chars: { value: createAsciiAtlas(48) },
        charCount: { value: 48.0 },  
        uBrightness: { value: 0.5 }, 
      },
    });
    material.transparent = true;
    material.opacity = 1;
    const mesh = new THREE.InstancedMesh(geometry, material, total);
    scene.add(mesh);
    const textScales = new Float32Array(textTotal);

const textGeometry = new THREE.PlaneGeometry(0.1, 0.1);
    textGeometry.setAttribute(
      "instanceScale",
      new THREE.InstancedBufferAttribute(textScales, 1),
    );

    const textMaterial = material.clone();

    const textMesh = new THREE.InstancedMesh(
      textGeometry,
      textMaterial,
      textTotal,
    );
    textMaterial.transparent = true;
    textMaterial.opacity = 0;
    textMesh.visible = false;
    textMesh.scale.set(0.55, 0.55, 1);

    scene.add(textMesh);
    mesh.scale.set(0.55, 0.55, 1);
    mesh.rotation.z = -Math.PI / 2;

    const basePositions = [];
    const targetPositions = [];
    const dummy = new THREE.Object3D();

    let instanceIndex = 0;
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const px = (x - gridWidth / 2) * cellSizeX;
        const py = (y - gridHeight / 2) * cellSizeY;

        basePositions.push({ x: px, y: py });

        dummy.position.set(px, py, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(instanceIndex++, dummy.matrix);
      }
    }
    const textPositions = [];

    let textIndex = 0;

    for (let x = 0; x < textGridWidth; x++) {
      for (let y = 0; y < textGridHeight; y++) {
        const px = (x - textGridWidth / 2) * cellSizeX * 0.5;
        const py = (y - textGridHeight / 2) * cellSizeY * 0.5;

        textPositions.push({ x: px, y: py });

        dummy.position.set(px, py, 0);
        dummy.updateMatrix();
        textMesh.setMatrixAt(textIndex++, dummy.matrix);
      }
    }

    textMesh.instanceMatrix.needsUpdate = true;

    function createHighResTextTargets(text) {
      const canvas = document.createElement("canvas");
      canvas.width = textGridWidth;
      canvas.height = textGridHeight;

      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, textGridWidth, textGridHeight);

      ctx.fillStyle = "white";
      ctx.font = `${textGridHeight * 0.4}px CeraProRegular`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

   const lines = Array.isArray(text) ? text : [text];

const fontSize = textGridHeight * 0.3; 
const lineHeight = fontSize * 0.9;     

ctx.font = `${fontSize}px CeraProRegular`;

const totalHeight = lines.length * lineHeight;


lines.forEach((line, i) => {
  const y =
    textGridHeight / 2 +
    (i * lineHeight - totalHeight / 2 + lineHeight / 2);

  ctx.fillText(line, textGridWidth / 2, y);
});

      const data = ctx.getImageData(0, 0, textGridWidth, textGridHeight).data;

      const targets = [];

      for (let i = 0; i < textTotal; i++) {
        const x = i % textGridWidth;
        const y = Math.floor(i / textGridWidth);

        const idx = (y * textGridWidth + x) * 4;
        const value = data[idx] / 255;

        if (value > 0.2) {
          targets.push({
            x: (x - textGridWidth / 2) * cellSizeX * 0.5,
            y: -(y - textGridHeight / 2) * cellSizeY * 0.5,
          });
        }
      }

      return targets;
    }
    const highResTargets = createHighResTextTargets(["our","team"]);

    const textTargetPositions = [];

    for (let i = 0; i < textTotal; i++) {
      textTargetPositions.push(highResTargets[i % highResTargets.length]);
    }

    let rafId = 0;
    let progress = 0;

    function renderFrame() {
      rafId = requestAnimationFrame(renderFrame);
      const time = performance.now() * 0.001;
      const spreadPhase = Math.min(progress / 0.5, 1);
      const gatherPhase = Math.max((progress - 0.5) / 0.5, 0);
      if (video.readyState >= 2) {
        sampleCtx.clearRect(0, 0, gridWidth, gridHeight);
        sampleCtx.drawImage(video, 0, 0, gridWidth, gridHeight);

        const frame = sampleCtx.getImageData(0, 0, gridWidth, gridHeight).data;

        for (let i = 0; i < total; i++) {
          const r = frame[i * 4];
          const g = frame[i * 4 + 1];
          const b = frame[i * 4 + 2];

          let brightness = (r + g + b) / 3 / 255;
          brightness = 1 - brightness;
          brightness = Math.pow(brightness, 1.8);
          scales[i] = scales[i] * 0.85 + brightness * 0.15;

          const base = basePositions[i];

          let x = base.x;
          let y = base.y;

          const nx = base.x * 0.2;
          const ny = base.y * 0.2;

          const flow =
            Math.sin(nx * 2.5 + time * 1.2) +
            Math.cos(ny * 2.0 - time * 1.0) +
            Math.sin((nx + ny) * 1.5 + time * 0.8);

          const angle = flow;
          if (progress > 0) {
            x += Math.cos(angle) * 1.5 * (1 - gatherPhase);
            y += Math.sin(angle) * 1.5 * (1 - gatherPhase);
          }

          dummy.position.set(x, y, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        for (let i = 0; i < textTotal; i++) {
          const base = textPositions[i];
          const target = textTargetPositions[i];

          let x = base.x;
          let y = base.y;

          const nx = base.x * 0.2;
          const ny = base.y * 0.2;

          const flow =
            Math.sin(nx * 2.5 + time * 1.2) +
            Math.cos(ny * 2.0 - time * 1.0) +
            Math.sin((nx + ny) * 1.5 + time * 0.8);

          const angle = flow;

          x += Math.cos(angle) * 1.5 * (1 - gatherPhase);
          y += Math.sin(angle) * 1.5 * (1 - gatherPhase);

          if (gatherPhase > 0) {
            x = x * (1 - gatherPhase) + target.x * gatherPhase;
            y = y * (1 - gatherPhase) + target.y * gatherPhase;
          }

          dummy.position.set(x, y, 0);
          dummy.updateMatrix();
          textMesh.setMatrixAt(i, dummy.matrix);

          textScales[i] = gatherPhase;
        }
        textMesh.visible = gatherPhase > 0.2;
        textMaterial.opacity = Math.max(0, (gatherPhase - 0.2) / 0.8);
        material.opacity = 1.0 - gatherPhase;

        material.transparent = true;
        textMaterial.transparent = true;
        textGeometry.attributes.instanceScale.needsUpdate = true;
        textMesh.instanceMatrix.needsUpdate = true;
        geometry.attributes.instanceScale.needsUpdate = true;
        mesh.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);
    }

    renderFrame();

    const handleClick = () => {
      const start = performance.now();
      const duration = 1500;

      function animateProgress(now) {
        const elapsed = now - start;
        progress = Math.min(elapsed / duration, 1);

        if (progress < 1) {
          requestAnimationFrame(animateProgress);
        }
      }

      requestAnimationFrame(animateProgress);
    };

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("click", handleClick);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        margin: "auto",
        overflow: "hidden",
      }}
    />
  );
}
const ASCII_CHARS =
  " .:-=+*xX#%@0369B&";

const ASCII_COLUMNS = 48;
const ASCII_COLOR = "#ff591f";
const MIN_OPACITY = 0.1;
const ASCII_WAVE_DELAY = 0.015;

function waitForImage(image) {

  if (image.complete) {
    return Promise.resolve(
      image.naturalWidth > 0
    )
  }

  return new Promise((resolve) => {
    image.addEventListener(
      "load",
      () => resolve(true),
      { once: true }
    )

    image.addEventListener(
      "error",
      () => resolve(false),
      { once: true }
    )
  })
}

function buildAscii(image) {
  const rows = Math.round(
    ASCII_COLUMNS /
      (
        image.naturalWidth /
        image.naturalHeight
      )
  );

  const sampler =
    document.createElement("canvas");

  sampler.width = ASCII_COLUMNS;
  sampler.height = rows;

  const context =
    sampler.getContext("2d", {
      willReadFrequently: true,
    });

  if (!context) {
    return null;
  }

  context.drawImage(
    image,
    0,
    0,
    ASCII_COLUMNS,
    rows
  );

  const pixels =
    context.getImageData(
      0,
      0,
      ASCII_COLUMNS,
      rows
    ).data;

  const grid =
    document.createElement("div");

  grid.setAttribute(
    "aria-hidden",
    "true"
  );

  grid.className = [
    "pointer-events-none",
    "absolute",
    "inset-0",
    "grid",
    "select-none",
    "overflow-hidden",
    "whitespace-pre",
    "font-['JetBrains_Mono']",
    "leading-[0.8]",
  ].join(" ");

  grid.style.gridTemplateColumns =
    `repeat(${ASCII_COLUMNS}, 1fr)`;

  grid.style.gridTemplateRows =
    `repeat(${rows}, 1fr)`;
const cellWidth =
  image.clientWidth /
  ASCII_COLUMNS

grid.style.fontSize =
  `${Math.max(7, cellWidth * 1.15)}px`

  const chars = [];
  const distances = [];
  const opacities = [];

  const centerX =
    (ASCII_COLUMNS - 1) / 2;

  const centerY =
    (rows - 1) / 2;

  for (
    let row = 0;
    row < rows;
    row += 1
  ) {
    for (
      let column = 0;
      column < ASCII_COLUMNS;
      column += 1
    ) {
      const offset =
        (
          row * ASCII_COLUMNS +
          column
        ) * 4;

      const brightness =
        (
          pixels[offset] * 0.299 +
          pixels[offset + 1] *
            0.587 +
          pixels[offset + 2] *
            0.114
        ) / 255;

      const characterIndex =
        Math.floor(
          brightness *
            (
              ASCII_CHARS.length -
              1
            )
        );

      const span =
        document.createElement("span");

      span.className = [
        "flex",
        "items-center",
        "justify-center",
        "text-white",
        "opacity-0",
        "will-change-[opacity,color]",
      ].join(" ");

      span.textContent =
        brightness < 0.1
          ? ""
          : ASCII_CHARS[
              characterIndex
            ];

      grid.appendChild(span);
      chars.push(span);

      const dx =
        column - centerX;

      const dy =
        row - centerY;

      distances.push(
        Math.sqrt(
          dx * dx + dy * dy
        )
      );

      opacities.push(
        brightness < 0.1
          ? 0
          : MIN_OPACITY +
              brightness *
                (
                  1 -
                  MIN_OPACITY
                )
      );
    }
  }

  return {
    grid,
    chars,
    distances,
    opacities,
  };
}

function addRevealBlock(
  wrapper,
  color
) {
  const block =
    document.createElement("div");

  block.className = [
    "pointer-events-none",
    "absolute",
    "left-0",
    "top-0",
    "h-[101%]",
    "w-[101%]",
    "will-change-transform",
    color,
  ].join(" ");

  wrapper.appendChild(block);

  return block;
}

const buttonClasses = [
  "block",
  "w-max",
  "rounded-[2px]",
  "bg-[#ff591f]",
  "px-6",
  "py-4",
  "font-['JetBrains_Mono']",
  "text-[0.85rem]",
  "font-medium",
  "uppercase",
  "leading-none",
  "text-[#171717]",
  "no-underline",

  "max-[1000px]:px-4",
  "max-[1000px]:py-3",
  "max-[1000px]:text-[0.65rem]",
].join(" ");

function GoodFellaHero() {
  const rootRef = useRef(null);
  const imageRef = useRef(null);
  const imageContainerRef =
    useRef(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const image = imageRef.current;
    const imageContainer =
      imageContainerRef.current;

    if (
      !root ||
      !image ||
      !imageContainer
    ) {
      return undefined;
    }

    let cancelled = false;
    let context;
let loaderContext
let contentContext
let loaderTimeline
let asciiResult

    const splitInstances = [];
let resolveLoader

const loaderFinished = new Promise(
  (resolve) => {
    resolveLoader = resolve
  }
)

loaderContext = gsap.context(() => {
  const preloaderSplit =
    SplitText.create(
      ".preloader-copy p",
      {
        type: "chars",
        charsClass: "char",
      }
    )

  splitInstances.push(preloaderSplit)

  // Prevent a flash before the character
  // animation begins.
  gsap.set(preloaderSplit.chars, {
    opacity: 0,
  })

  // JSX starts this element with `invisible`.
  gsap.set(".preloader-copy p", {
    visibility: "visible",
  })

  const preloaderBlocks =
    gsap.utils.toArray(
      ".preloader-block"
    )

  const nestedBlocks =
    preloaderBlocks.slice(1)

loaderTimeline = gsap.timeline({
  delay: 0,
  onComplete: resolveLoader,
})

loaderTimeline.to(
  preloaderSplit.chars,
  {
    opacity: 1,
    duration: 0.15,
    stagger: 0.1,
  }
)

loaderTimeline.to(
  ".preloader",
  {
    scale: 1,
    duration: 0.35,
    ease: "back.out(1.8)",
  },
  "<"
)

loaderTimeline.to(
  nestedBlocks,
  {
    delay: 0.25,
    rotation: 0,
    duration: 0.65,
    ease: "power3.inOut",
    stagger: 0.75,
  },
  "<"
)
}, root)

async function initialize() {
  const fontReady =
    document.fonts?.ready
      ? Promise.race([
          document.fonts.ready,
          new Promise((resolve) => {
            window.setTimeout(
              resolve,
              1500
            )
          }),
        ])
      : Promise.resolve()

const [imageLoaded] =
  await Promise.all([
    waitForImage(image),
    fontReady,
    loaderFinished,
  ])

  if (cancelled) return

  if (imageLoaded) {
    asciiResult =
      buildAscii(image)

    if (asciiResult) {
      imageContainer.appendChild(
        asciiResult.grid
      )
    }
  }

  contentContext =
    gsap.context(() => {
      /*
       * Prepare the hero after the
       * fonts and image are ready.
       */
      const heroSplit =
        SplitText.create(
          ".hero-copy h1",
          {
            type: "lines",
            linesClass:
              "block-line",
            mask: "lines",
          }
        )

      /*
       * The footer is optional because
       * its JSX may be commented out.
       */
      const footerElement =
        root.querySelector(
          ".hero-footer p"
        )

      const footerSplit =
        footerElement
          ? SplitText.create(
              footerElement,
              {
                type: "words",
                wordsClass: "word",
                mask: "words",
              }
            )
          : null

      splitInstances.push(
        heroSplit
      )

      if (footerSplit) {
        splitInstances.push(
          footerSplit
        )
      }

      const heroLines = []
      const heroReveals = []

      heroSplit.lines.forEach(
        (line) => {
          const wrapper =
            line.parentElement

          if (!wrapper) return

          wrapper.classList.add(
            "relative",
            "block",
            "w-max"
          )

          line.classList.add(
            "relative",
            "block"
          )

          const orange =
            addRevealBlock(
              wrapper,
              "bg-[#ff591f]"
            )

          const white =
            addRevealBlock(
              wrapper,
              "bg-white"
            )

          heroLines.push(line)

          heroReveals.push({
            orange,
            white,
          })
        }
      )

      const revealerBlocks =
        heroReveals.flatMap(
          ({ orange, white }) => [
            orange,
            white,
          ]
        )

      gsap.set(heroLines, {
        opacity: 0,
      })

      gsap.set(
        revealerBlocks,
        {
          scaleX: 0,
          transformOrigin:
            "left center",
        }
      )

      if (footerSplit) {
        gsap.set(
          footerSplit.words,
          {
            yPercent: 100,
          }
        )
      }

      /*
       * This timeline starts only after
       * the loader entrance and assets
       * are ready.
       */
      const timeline =
        gsap.timeline({
          delay: 0,
        })

      /*
       * Fade out the loader contents.
       */
      timeline.to(
        [
          ".preloader-copy",
          ".preloader-block",
        ],
        {
          opacity: 0,
          duration: 0.4,
          ease: "power2.out",
        }
      )

      /*
       * Remove the orange overlay with
       * the diagonal clip-path wipe.
       */
      const finishedWipe =
        "polygon(130% 0%, 130% 0%, 100% 100%, 100% 100%)"

      timeline.to(
        ".preloader-overlay",
        {
          clipPath:
            finishedWipe,
          WebkitClipPath:
            finishedWipe,
          duration: 1.1,
          ease: "power3.inOut",
        }
      )

      timeline.set(
        ".preloader-overlay",
        {
          display: "none",
        }
      )

      /*
       * Bring in navigation while the
       * wipe is finishing.
       */
      timeline.to(
        "nav",
        {
          y: 0,
          duration: 1,
          ease: "power3.out",
        },
        "-=0.65"
      )

      /*
       * Reveal each hero heading line.
       */
      heroReveals.forEach(
        (reveal, index) => {
          const line =
            heroLines[index]

          const position =
            index === 0
              ? "-=0.65"
              : "-=0.75"

          const lineTimeline =
            gsap.timeline()

          ;[
            reveal.orange,
            reveal.white,
          ].forEach(
            (
              block,
              blockIndex
            ) => {
              const blockTimeline =
                gsap.timeline({
                  delay:
                    blockIndex *
                    0.15,
                })

              blockTimeline.to(
                block,
                {
                  scaleX: 1,
                  duration: 0.5,
                  ease:
                    "power4.inOut",
                }
              )

              blockTimeline.set(
                block,
                {
                  transformOrigin:
                    "right center",
                }
              )

              blockTimeline.to(
                block,
                {
                  scaleX: 0,
                  duration: 0.5,
                  ease:
                    "power4.inOut",
                }
              )

              lineTimeline.add(
                blockTimeline,
                0
              )
            }
          )

          lineTimeline.set(
            line,
            {
              opacity: 1,
            },
            0.5
          )

          timeline.add(
            lineTimeline,
            position
          )
        }
      )

      /*
       * Hero button.
       */
      timeline.to(
        ".hero-button",
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
        },
        "-=0.5"
      )

      /*
       * Optional footer.
       */
      if (
        footerSplit?.words?.length
      ) {
        timeline.to(
          footerSplit.words,
          {
            yPercent: 0,
            duration: 0.75,
            stagger: 0.075,
            ease: "power3.out",
          },
          "-=0.85"
        )
      }

      /*
       * Optional ASCII portrait.
       */
      if (
        asciiResult?.chars?.length
      ) {
        const getCharDelay =
          (index) =>
            asciiResult
              .distances[index] *
            ASCII_WAVE_DELAY

        timeline.to(
          asciiResult.chars,
          {
            opacity: (index) =>
              asciiResult
                .opacities[index],
            duration: 0.01,
            ease: "power1.out",
            stagger:
              getCharDelay,
          },
          "-=2.5"
        )

        timeline.to(
          asciiResult.chars,
          {
            color:
              ASCII_COLOR,
            duration: 0.01,
            ease: "power1.out",
            stagger:
              getCharDelay,
          },
          "-=2"
        )
      }
    }, root)
}

initialize()

return () => {
  cancelled = true

  loaderContext?.revert()
  contentContext?.revert()

  splitInstances
    .reverse()
    .forEach((split) => {
      split.revert()
    })

  asciiResult?.grid.remove()
}
}, [])

  return (
   <main
  ref={rootRef}
  className="min-h-svh bg-[#171717]"
>
  <div
    className="preloader-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 overflow-hidden bg-[#fff] will-change-[clip-path]"
    style={{
      clipPath:
        "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      WebkitClipPath:
        "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    }}
  >
<div className="preloader relative h-4 w-[70px] scale-0 overflow-visible [transform-origin:25%_center]">
<div className="preloader-block absolute left-0 top-0 h-4 w-4 bg-[#171717]">
  <div className="preloader-block absolute left-[18px] top-0 h-4 w-4 origin-left -rotate-180 bg-[#171717]">
    <div className="preloader-block absolute left-[18px] top-0 h-4 w-4 origin-left -rotate-180 bg-[#171717]">
      <div className="preloader-block absolute left-[18px] top-0 h-4 w-4 origin-left -rotate-180 bg-[#171717]" />
    </div>
  </div>
</div>
        </div>

<div className="preloader-copy w-40 text-center">
  <p className="invisible whitespace-nowrap text-[1.05rem] font-neuehaas35 leading-none text-[#171717]">
    Meet the Team
  </p>
</div>
      </div>

      <nav
        className={[
          "fixed",
          "left-0",
          "top-0",
          "z-10",
          "flex",
          "w-full",
          "-translate-y-[300px]",
          "items-center",
          "gap-8",
          "p-8",
          "will-change-transform",
        ].join(" ")}
      >
        <div className="flex-1">
          <img
            src="/logo.svg"
            alt="GoodFella"
            className="h-auto w-24"
          />
        </div>

        <div className="flex flex-1 justify-center">
          <button
            type="button"
            className={`${buttonClasses} bg-[#171717] text-white`}
          >
            Menu
          </button>
        </div>

        <div className="flex flex-1 justify-end">
          <a
            href="#contact"
            className={
              buttonClasses
            }
          >
            {/* Get in touch */}
          </a>
        </div>
      </nav>

      <section
        className={[
          "hero",
          "relative",
          "z-[1]",
          "flex",
          "h-svh",
          "w-full",
          "gap-8",
          "overflow-hidden",
          "bg-[#171717]",

          "max-[1000px]:flex-col",
          "max-[1000px]:pt-[10svh]",
        ].join(" ")}
      >
        <div
          className={[
            "hero-copy",
            "flex",
            "h-full",
            "min-w-0",
            "flex-1",
            "flex-col",
            "justify-center",
            "gap-8",
            "p-8",
            "text-white",
          ].join(" ")}
        >
     <h1 className="font-neuehaas35 text-[clamp(2rem,4vw,5rem)] font-medium leading-[1.25]">
  LOREM IPSUM
</h1>

          <a
            href="#work"
            className={[
              buttonClasses,
              "hero-button",
              "translate-y-10",
              "opacity-0",
              "will-change-[transform,opacity]",
            ].join(" ")}
          >
            {/* See our work */}
          </a>
        </div>

        <div
          className={[
            "hero-media",
            "flex",
            "min-w-0",
            "flex-1",
            "items-end",
            "justify-center",

            "max-[1000px]:justify-end",
          ].join(" ")}
        >
          <div
            ref={imageContainerRef}
            className={[
              "hero-img",
              "relative",
              "aspect-[5/7]",
              "w-[85%]",

              "max-[1000px]:aspect-square",
              "max-[1000px]:w-3/4",
            ].join(" ")}
          >
            <img
              ref={imageRef}
              src="/images/team_members/danfrey.png"
              alt=""
              className="h-full w-full object-cover opacity-0"
            />
          </div>
        </div>

        {/* <div className="hero-footer absolute bottom-8 left-8">
          <p className="text-sm font-semibold leading-none text-[#5c5c5c] max-[1000px]:text-white">
            Currently booking
            projects for 2026.
          </p>
        </div> */}
      </section>
    </main>
  );
}
export default function OurTeam() {
  const [showContent, setShowContent] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: -100, y: -100 });

  const panelRefs = useRef([]);
  const titleRef = useRef(null);
  const largeGreggRef = useRef(null);
  const largeDanRef = useRef(null);
  const smallGreggRef = useRef(null);
  const smallDanRef = useRef(null);
  const greggNameRef = useRef(null);
  const danNameRef = useRef(null);

  const wrapperRef = useRef(null);
  const scrollRef = useRef(null);
  const lastSectionRef = useRef(null);
  const newSectionRef = useRef(null);
  const col1Ref = useRef(null);
  const col2Ref = useRef(null);
  const col3Ref = useRef(null);
  const leftColumnRef = useRef(null);

  const isTouchDevice = "ontouchstart" in window;

  useEffect(() => {
    gsap.set(panelRefs.current, { y: "0%" });

    const tl = gsap.timeline({
      defaults: { ease: "expo.out" },
    });

    if (titleRef.current) {
      const split = new SplitText(titleRef.current, {
        type: "chars",
        charsClass: "char",
      });

      split.chars.forEach((char) => {
        const wrap = document.createElement("span");
        wrap.classList.add("char-wrap");

        if (char.textContent === " ") {
          char.innerHTML = "&nbsp;";
        }

        char.parentNode.insertBefore(wrap, char);
        wrap.appendChild(char);
      });

      tl.fromTo(
        split.chars,
        {
          xPercent: 105,
          opacity: 0,
          transformOrigin: "0% 50%",
        },
        {
          xPercent: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.042,
          delay: 0.2,
        },
      );

      tl.to(
        titleRef.current,
        {
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        },
        "+=0.2",
      );
    }

    tl.fromTo(
      panelRefs.current,
      { y: "0%" },
      {
        y: "-100%",
        duration: 1.2,
        stagger: 0.08,
        ease: "none",
      },
      "+=0.1",
    );

    tl.call(
      () => {
        setShowContent(true);
      },
      null,
      "+=0.2",
    );
  }, []);

  useEffect(() => {
    if (!showContent) return;

    const container = document.querySelector(".horizontalScroller");
    if (!container) return;

    const containerWidth =
      container.scrollWidth - document.documentElement.clientWidth;

    gsap.to(container, {
      x: () => -containerWidth,
      scrollTrigger: {
        markers: false,
        trigger: ".horizontalWrapper",
        start: "top top",
        scrub: 0.5,
        pin: ".horizontalContainer",
        end: () => `+=${containerWidth}`,
        invalidateOnRefresh: true,
      },
    });
  }, [showContent]);

  useEffect(() => {
    if (!isTouchDevice) {
      const moveCursor = (e) => {
        setCursorPosition({ x: e.clientX, y: e.clientY });
      };
      window.addEventListener("mousemove", moveCursor);
      return () => {
        window.removeEventListener("mousemove", moveCursor);
      };
    }
  }, [isTouchDevice]);

  const greenCursorStyle = {
    position: "fixed",
    left: `${cursorPosition.x}px`,
    top: `${cursorPosition.y}px`,
    width: isFocused ? "70px" : "10px",
    height: isFocused ? "70px" : "10px",
    borderRadius: "50%",
    background: isFocused
      ? "rgba(220, 227, 143, 0.69)"
      : "rgba(255,255,255, 1)",
    backdropFilter: isFocused ? "blur(10px) saturate(180%)" : "none",
    WebkitBackdropFilter: isFocused ? "blur(10px) saturate(180%)" : "none",
    pointerEvents: "none",
    transform: "translate(-50%, -50%)",
    transition: "width 0.5s, height 0.5s, background 0.25s, border 0.25s",
    zIndex: 9999,
  };

  useEffect(() => {
    const lines = document.querySelectorAll(".stagger-line");

    lines.forEach((line) => {
      const letters = line.querySelectorAll(".stagger-letter");

      gsap.fromTo(
        letters,
        {
          y: "100%",
          opacity: 0,
        },
        {
          y: "0%",
          opacity: 1,
          stagger: 0.05,
          duration: 1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: line,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        },
      );
    });
  }, []);

  useLayoutEffect(() => {
    if (
      !pinRef.current ||
      !trackRef.current ||
      !scrollRef.current ||
      !stackRef.current ||
      !newSectionRef.current
    )
      return;

    const ctx = gsap.context(() => {
      if (largeDanRef.current) gsap.set(largeDanRef.current, { x: "-100%" });
      if (smallGreggRef.current)
        gsap.set(smallGreggRef.current, { x: "-100%" });
      if (smallDanRef.current) gsap.set(smallDanRef.current, { x: "0%" });
      if (danNameRef.current) gsap.set(danNameRef.current, { opacity: 0 });

      gsap.set(trackRef.current, { xPercent: 0 });
      gsap.set(stackRef.current, { y: 0 });

      const getTargetY = () => {
        const viewportH = scrollRef.current.clientHeight;
        const contentH = stackRef.current.scrollHeight;
        return Math.max(0, contentH - viewportH);
      };

      const col1Cells = Array.from(col1Ref.current.querySelectorAll(".cell"));
      const col2Cells = Array.from(col2Ref.current.querySelectorAll(".cell"));
      const col3Cells = Array.from(col3Ref.current.querySelectorAll(".cell"));

      const maxRows = Math.max(
        col1Cells.length,
        col2Cells.length,
        col3Cells.length,
      );

      const lateralCells = [];
      for (let i = 0; i < maxRows; i++) {
        if (col1Cells[i]) lateralCells.push(col1Cells[i]);
        if (col2Cells[i]) lateralCells.push(col2Cells[i]);
        if (col3Cells[i]) lateralCells.push(col3Cells[i]);
      }

      gsap.set(lateralCells, { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinRef.current,
          start: "top top",
          end: () => "+=" + window.innerHeight * 6,
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      const totalVerticalTravel = getTargetY();
      const verticalDuration = 1;

      tl.to(
        stackRef.current,
        {
          y: -totalVerticalTravel,
          ease: "none",
          duration: verticalDuration,
        },
        0,
      );

      tl.add("switchStart", 0);

      tl.to(
        largeGreggRef.current,
        { x: "100%", duration: verticalDuration, ease: "power2.inOut" },
        "switchStart",
      );
      tl.to(
        largeDanRef.current,
        { x: "0%", duration: verticalDuration, ease: "power2.inOut" },
        "switchStart",
      );
      tl.to(
        smallDanRef.current,
        { x: "100%", duration: verticalDuration, ease: "power2.inOut" },
        "switchStart",
      );
      tl.to(
        smallGreggRef.current,
        { x: "0%", duration: verticalDuration, ease: "power2.inOut" },
        "switchStart",
      );
      tl.to(
        greggNameRef.current,
        { opacity: 0, duration: verticalDuration, ease: "power2.inOut" },
        "switchStart",
      );
      tl.to(
        danNameRef.current,
        { opacity: 1, duration: verticalDuration, ease: "power2.inOut" },
        "switchStart",
      );

      tl.to(trackRef.current, {
        xPercent: -66.666,
        ease: "none",
        duration: 2,
      });

      const panels = trackRef.current.children;

      tl.to(trackRef.current, {
        xPercent: -100 * (panels.length - 1),
        ease: "none",
        duration: 2,
      });

      tl.to(
        lateralCells,
        {
          opacity: 1,
          stagger: 0.12,
          ease: "power2.out",
        },
        ">-=0.4",
      );

      tl.to([col1Ref.current, col2Ref.current, col3Ref.current], {
        yPercent: (i) => (i % 2 === 0 ? -100 : 100),
        ease: "none",
        duration: 2,
        stagger: { each: 0.3 },
      });

      tl.add("teamReveal", ">");

      const cards = gridRef.current?.getCards?.();
      const scroller = gridRef.current?.getScroller?.();
      if (cards?.length) {
        tl.from(
          cards,
          {
            opacity: 0,
            y: 40,
            duration: 1.1,
            stagger: {
              each: 0.15,
              ease: "power1.out",
            },
            ease: "power3.out",
            clearProps: "all",
          },
          "teamReveal",
        );
      }

      if (scroller) {
        const maxScroll = scroller.scrollWidth - scroller.clientWidth;

        if (maxScroll > 0) {
          tl.to(
            scroller,
            {
              scrollLeft: maxScroll,
              ease: "none",
              duration: 1.5,
            },
            "teamReveal+=1.2",
          );
        }
      }

      ScrollTrigger.refresh();
    }, pinRef);

    return () => ctx.revert();
  }, []);
  // useLayoutEffect(() => {
  // const lenis = new Lenis({
  //   duration: 0.5,
  //   easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  // })

  //   function raf(time) {
  //     lenis.raf(time)
  //     ScrollTrigger.update()
  //     requestAnimationFrame(raf)
  //   }

  //   requestAnimationFrame(raf)

  //   lenis.on("scroll", ScrollTrigger.update)

  //   ScrollTrigger.refresh()

  //   return () => lenis.destroy()
  // }, [])
  const lines = [
    "Our experience spans over 50 years—a testament to the ",
    "precision, accuracy, and relevance of our vision, demonstrating",
    "our ability to adapt to the ever-changing nature of our industry.",
  ];

  const fadeUpMasked = (delay = 0) => ({
    hidden: { y: "100%", opacity: 0 },
    visible: {
      y: "0%",
      opacity: 1,
      transition: {
        duration: 1,
        ease: "easeOut",
        delay: delay,
      },
    },
  });

  const pinRef = useRef(null);
  const trackRef = useRef(null);
  const stackRef = useRef(null);
  const teamSectionRef = useRef(null);
  const gridRef = useRef(null);

  return (
    <>
      <div className="h-screen w-screen">
<GoodFellaHero />
      </div>
      <div
        ref={pinRef}
        className="relative w-full h-screen overflow-hidden bg-[#17181C]"
      >
        <div ref={trackRef} className="relative flex h-screen">
          <div className="w-screen h-screen shrink-0">
            <div ref={wrapperRef} className="w-full h-full flex">
              <div className="flex basis-[100%] h-screen">
                <div
                  ref={leftColumnRef}
                  className="
    left-panel
    w-[65%]
    z-10
    h-screen
    sticky top-1
    py-[10em] sm:py-[10em]
    border-l border-b border-r border-[#F2F2F2]
    bg-[#FCFFFE]
    rounded-[14px]
    chamfer-br
  "
                >
                  <svg width="0" height="0">
                    <defs>
                      <clipPath
                        id="panelMask"
                        clipPathUnits="objectBoundingBox"
                      >
                        <path
                          d="
        M 0 0
        H 1
        V 0.78
        C 1 0.86 0.94 0.88 0.9 0.92
        L 0.82 1
        H 0
        V 0
        Z
      "
                        />
                      </clipPath>
                    </defs>
                  </svg>

                  <div className="max-w-[400px] ml-10 my-10 flex flex-col overflow-hidden">
                    <div className="inline-block overflow-hidden">
                      <div className="text-[12px] leading-[1.1] font-neuehaas35 tracking-wide text-black">
                        {lines.map((line, index) => (
                          <div key={index} className="overflow-hidden">
                            <motion.span
                              variants={fadeUpMasked(index * 0.2)}
                              initial="hidden"
                              animate="visible"
                              className="inline-block"
                            >
                              {line}
                            </motion.span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <section>
                    <div className="flex justify-center gap-6 overflow-hidden ">
                      <div className="w-[275px] mr-10">
                        <figure className="relative w-full aspect-[3/4] overflow-hidden">
                          <HoverImage
                            ref={largeGreggRef}
                            src="../../images/team_members/GreggFrey.png"
                            alt="Gregg Frey"
                            className="absolute inset-0 w-full h-full object-cover"
                          />

                          <HoverImage
                            ref={largeDanRef}
                            src="../../images/team_members/DanFrey.png"
                            alt="Gregg Frey"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </figure>
                        <figcaption className="mt-3 relative h-[3em]">
                          <div className="relative h-[1.4em]">
                            <p
                              ref={greggNameRef}
                              className="absolute top-0 left-0 text-[14px] text-[#111]  font-canelathin"
                            >
                              Dr. Gregg Frey
                            </p>
                            <p
                              ref={danNameRef}
                              className="absolute top-0 left-0 text-[14px] text-[#111]  font-canelathin"
                            >
                              Dr. Dan Frey
                            </p>
                          </div>
                          <div className="relative mt-1 h-[1.2em]"></div>
                        </figcaption>
                      </div>

                      <div className="w-[200px]">
                        <figure className="relative grayscale w-full aspect-[3/4] overflow-hidden">
                          <img
                            ref={smallGreggRef}
                            src="../../images/team_members/GreggFrey.png"
                            alt="Dr. Gregg Frey"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <img
                            ref={smallDanRef}
                            src="../../images/team_members/DanFrey.png"
                            alt="Dr. Dan Frey"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </figure>
                      </div>
                    </div>
                  </section>
                </div>

                <div
                  ref={scrollRef}
                  className="shrink-0 w-[35%] h-screen relative"
                >
                  <div ref={stackRef} className="will-change-transform">
                    <div className="rounded-[12px] border-b bg-[#FCFFFE]  py-[10em] sm:py-[10em] h-screen lg:px-8 ">
                      <h1 className="font-canelathin text-[20px]">
                        Dr. Gregg Frey,
                        <br />{" "}
                        <div className="my-2 font-neuehaas45 text-[14px] tracking-wider">
                          DDS
                        </div>
                      </h1>

                      <div className="flex justify-center items-center h-full gap-8 px-6 max-w-[600px] relative">
                        <p className="leading-[1.3] font-neuehaas45 text-[13px] tracking-wider text-[#111] ">
                          Dr. Gregg Frey is an orthodontist based in
                          Pennsylvania, who graduated from Temple University
                          School of Dentistry with honors and served in the U.S.
                          Navy Dental Corps before establishing his practice in
                          the Lehigh Valley. He is a Diplomat of the American
                          Board of Orthodontics and has received numerous
                          distinctions, accreditations, and honors, including
                          being named one of America&apos;s Top Orthodontists by
                          the Consumer Review Council of America.
                          <div className="mt-10">
                            This distinction is held by fewer than 25% of
                            orthodontists nationwide. ABO certification
                            represents the culmination of 5-10 years of written
                            and oral examinations and independent expert review
                            of actual treated patients. Recently Dr. Frey
                            voluntarily re-certified. Dr. Frey enjoys coaching
                            soccer, vintage car racing, and playing the drums.
                          </div>
                        </p>
                      </div>
                    </div>
                    <div className="relative h-full">
                      <section
                        ref={lastSectionRef}
                        className="panel1 relative bg-cover h-screen  rounded-[12px] overflow-hidden"
                      >
                        <div className="rounded-[12px] bg-[#FCFFFE]  py-[10em] sm:py-[10em] h-screen lg:px-8 ">
                          <h1 className="font-canelathin text-[20px]">
                            Dr. Daniel Frey,
                            <br />{" "}
                            <div className="my-2 font-neuehaas45 text-[14px] tracking-wider">
                              DMD, MSD
                            </div>
                          </h1>
                          <div className="flex justify-center items-center h-full gap-8 px-6 max-w-[600px] relative">
                            <p className="leading-[1.3] font-neuehaas45 text-[13px] tracking-wider text-[#111] ">
                              Dr. Daniel Frey completed his pre-dental
                              requisites at the University of Pittsburgh,
                              majoring in Biology. Dr. Frey excelled in his
                              studies and was admitted to Temple
                              University&apos;s dental school, graduating at the
                              top of his class achieving the prestigious Summa
                              Cum Laude designation. Continuing his education,
                              Dr. Frey was admitted to the esteemed orthodontic
                              residency program at the University of the Pacific
                              Arthur A Dugoni School of Dentistry in San
                              Francisco. While in San Francisco, he studied and
                              worked with students and faculty from around the
                              world and utilized cutting-edge orthodontic
                              techniques. During his time in San Francisco, he
                              conducted research in three-dimensional
                              craniofacial analysis and earned his Master of
                              Science degree.
                              <div className="mt-10">
                                Dr. Frey is a member of the American Association
                                of Orthodontists, American Academy of Facial
                                Esthetics, and the American Dental Association.
                                In his free time, he enjoys staying active,
                                camping, music, cooking, and spending time with
                                loved ones.
                              </div>
                            </p>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* <div className="absolute inset-0 z-0 h-screen w-screen ">
            <MaskText />
          </div> */}

          <div
            ref={newSectionRef}
            className="w-screen h-screen shrink-0 relative overflow-hidden"
          >
            <div
              onMouseEnter={() => setIsFocused(true)}
              onMouseLeave={() => setIsFocused(false)}
              className="bg-[#17181C] w-screen h-screen grid grid-cols-3 text-[#333] font-neuehaas45 text-[14px] leading-relaxed"
            >
              <div className="absolute inset-0">
                {/* <Canvas
                camera={{ position: [0, 0, 1000], fov: 75 }}
          gl={{ antialias: true, alpha: true }}
            onCreated={({ gl }) => {
    gl.setClearColor(0x000000, 0)
  }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 0,
                }}
              >
                <Scene />
              </Canvas> */}
              </div>

              {/* Col 1 */}
              <div className="overflow-hidden">
                <div
                  ref={col1Ref}
                  className="flex flex-col will-change-transform"
                >
                  <div className="cell relative bg-[#FCFFFE] rounded-[12px] p-8 border border-[#E4E7FF] h-[33.33vh] flex flex-col justify-start items-start shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
                    <div className="mt-[48px]">
                      <p className="font-neuehaas45 text-[#333] tracking-wide text-[13px] leading-[1.4]">
                        The systems, the flow, the details — all dialed in so
                        your visits stay smooth start to finish.
                      </p>
                    </div>
                  </div>
                  <div className="cell bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]"></div>
                  <div className="cell bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                    <a href="https://www.trapezio.com/training-resources/course-outlines/soa-prep-course-outline/">
                      <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                        Our members have received the designation of Specialized
                        Orthodontic Assistant. This is a voluntary certification
                        program started by the American Association of
                        Orthodontists to recognize those in the profession for
                        their knowledge and experience.
                      </p>
                    </a>
                  </div>
                  <div className="cell bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                    <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                      Entrust your smile's transformation to our handpicked team
                      of orthodontic specialists.
                    </p>
                  </div>
                </div>
              </div>
              {/* Col 2  */}
              <div className="overflow-hidden">
                <div
                  ref={col2Ref}
                  className="flex flex-col will-change-transform"
                  style={{ transform: "translateY(-66.66vh)" }}
                >
                  <div className="cell relative bg-[#FCFFFE] rounded-[12px] p-8 border border-[#E4E7FF] h-[33.33vh] flex flex-col justify-start items-start shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
                    <div className="mt-[48px]">
                      <p className="font-neuehaas45 text-[#333] tracking-wide text-[13px] leading-[1.4]">
                        The systems, the flow, the details — all dialed in so
                        your visits stay smooth start to finish.
                      </p>
                    </div>
                  </div>
                  <div className="cell bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                    <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]"></p>
                  </div>
                  <div className="cell bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                    <a href="https://www.trapezio.com/training-resources/course-outlines/soa-prep-course-outline/">
                      <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                        Our members have received the designation of Specialized
                        Orthodontic Assistant. This is a voluntary certification
                        program started by the American Association of
                        Orthodontists to recognize those in the profession for
                        their knowledge and experience.
                      </p>
                    </a>
                  </div>
                  <div className="cell bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                    <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                      Entrust your smile's transformation to our handpicked team
                      of orthodontic specialists.
                    </p>
                  </div>
                  <a
                    href="https://g.co/kgs/Sds93Ha"
                    className="cell flex justify-center items-center bg-[#FCFFFE] rounded-[12px] p-8 border-b border-r border-[#E4E7FF] h-[33.33vh]"
                  >
                    <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                      This office is on 🔥! The orthodontists as well as every
                      single staff member.
                    </p>
                  </a>
                </div>
              </div>

              {/* Col 3  */}
              <div className="overflow-hidden">
                <div
                  ref={col3Ref}
                  className="flex flex-col will-change-transform"
                >
                  <div className="cell bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                    <p className="font-neuehaas45 tracking-wide text-[16px] leading-[1.1]">
                      Trained in CPR and first aid
                    </p>
                  </div>
                  <a
                    href="https://g.co/kgs/YkknjNg"
                    className="cell flex justify-center items-center  bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] h-[33.33vh]"
                  >
                    <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                      Had a wonderful experience at FreySmiles. Everyone is
                      extremely professional, polite, timely. Would highly
                      recommend! — TK
                    </p>
                  </a>
                  <div className="cell bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                    <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                      We've invested in in-office trainings with leading
                      clinical consultants that have helped us develop systems
                      and protocols streamlining our processes.
                    </p>
                  </div>
                  <div className="cell relative bg-[#FCFFFE] rounded-[12px] p-8 border border-[#E4E7FF] h-[33.33vh] flex flex-col justify-start items-start shadow-[0_2px_6px_rgba(0,0,0,0.05)]">
                    <div className="mt-[48px]">
                      <a
                        href="https://g.co/kgs/example-review-1"
                        className="block hover:opacity-90 transition-opacity duration-200"
                      >
                        <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.4] text-[#252424]">
                          Fun fact — our team is made up of former patients,
                          something we think is important, because we have all
                          experienced treatment and can help guide you through
                          it.
                        </p>
                      </a>
                    </div>
                  </div>
                  <div className="cell bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                    <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                      Eco-friendly practice: We prioritize recycling and digital
                      workflows to reduce waste.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <section
              ref={teamSectionRef}
              className="absolute inset-0 z-0 pointer-events-none team-section"
            >
              <GridContainer ref={gridRef} />
            </section>
          </div>
          {/* <ShaderHoverEffect /> */}
          {/* <div style={greenCursorStyle}>
          {isFocused && (
            <img
              src="/images/pinkeye.png"
              alt="Eye icon"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "38px",
                height: "auto",
                pointerEvents: "none",
                userSelect: "none",
                filter: "drop-shadow(0 0 8px rgba(188,205,1,0.6))",
              }}
            />
          )}
        </div> */}
        </div>
      </div>
    </>
  );
}

const ParticleSystem = () => {
  const particlesCount = 27000;
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef();

  const positions = useMemo(() => new Float32Array(particlesCount * 3), []);
  const velocities = useMemo(() => new Float32Array(particlesCount * 3), []);

  const createSphere = (count, radius) => {
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random());

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      velocities[i * 3] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
  };

  useEffect(() => {
    createSphere(particlesCount, 400);
    if (particlesRef.current) {
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  }, []);

  const { size, gl } = useThree();
  const boundsRef = useRef();

  useEffect(() => {
    const canvasEl = gl.domElement;
    const handleMove = (e) => {
      const rect = canvasEl.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouseRef.current.x = x;
      mouseRef.current.y = y;
    };
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [gl]);

  useFrame(() => {
    if (!particlesRef.current) return;
    const pos = particlesRef.current.geometry.attributes.position.array;

    for (let i = 0; i < pos.length; i += 3) {
      pos[i] += velocities[i];
      pos[i + 1] += velocities[i + 1];
      pos[i + 2] += velocities[i + 2];

      const dist = Math.sqrt(pos[i] ** 2 + pos[i + 1] ** 2 + pos[i + 2] ** 2);
      const radius = 400;
      if (dist > radius) {
        const nx = pos[i] / dist;
        const ny = pos[i + 1] / dist;
        const nz = pos[i + 2] / dist;

        // snap to surface
        pos[i] = nx * radius;
        pos[i + 1] = ny * radius;
        pos[i + 2] = nz * radius;

        // reflect velocity inward
        const dot =
          velocities[i] * nx + velocities[i + 1] * ny + velocities[i + 2] * nz;

        velocities[i] -= 2 * dot * nx;
        velocities[i + 1] -= 2 * dot * ny;
        velocities[i + 2] -= 2 * dot * nz;

        velocities[i] *= 0.6;
        velocities[i + 1] *= 0.6;
        velocities[i + 2] *= 0.6;
      }
      const dx = mouseRef.current.x - pos[i];
      const dy = -mouseRef.current.y - pos[i + 1];
      const distance = Math.sqrt(dx * dx + dy * dy);

      const MOUSE_RADIUS = 120;
      const MOUSE_STRENGTH = 0.04;

      if (distance > 0 && distance < MOUSE_RADIUS) {
        const force = (1 - distance / MOUSE_RADIUS) * MOUSE_STRENGTH;

        velocities[i] -= (dx / distance) * force;
        velocities[i + 1] -= (dy / distance) * force;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={particlesCount}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={0xff66ff}
        size={2.4}
        sizeAttenuation
        transparent
        // opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
const Scene = () => {
  return (
    <>
      <ParticleSystem />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.75}
          luminanceSmoothing={0.2}
          intensity={2.2}
          radius={0.35}
        />
      </EffectComposer>
    </>
  );
};

{
  /* bg-[#E2F600] */
}

{
  /* <div
          ref={carouselRef}
          className="relative z-10 min-h-[150vh]  pointer-events-none"
        >
          <div id="cursor" style={cursorStyle} className={className}>
            <div className="cursor__circle" style={cursorCircleStyle}>
              {!isDragging && (
                <>
                  Drag
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </>
              )}
            </div>
          </div>
          {items.map((item) => (
            <div key={item.num} className="carousel-item">
              <div className="carousel-box">
                <div className="titleCard">{item.title}</div>
                <div className="nameCard">{item.num}</div>
                <img src={item.imgSrc} alt={item.title} />
              </div>
            </div>
          ))}
        </div> */
}

function JanusFace() {
  const [leftShapes, setLeftShapes] = useState([]);
  const [rightShapes, setRightShapes] = useState([]);

  const r = (from, to) => {
    return Math.random() * (to - from) + from;
  };

  const ri = (from, to) => {
    return ~~r(from, to);
  };

  const pick = (...args) => {
    return args[ri(0, args.length - 1)];
  };

  const generateText = (times = 100) => {
    const spans = [];
    for (let i = 0; i < times; i++) {
      spans.push(
        <span key={i} className="symbol">
          {String.fromCharCode(ri(0x25a0, 0x25fc))}
        </span>,
      );
    }
    return spans;
  };

  const generateParagraphs = (isLeft = false) => {
    const paragraphs = [];
    for (let i = 0; i < 50; i++) {
      const offset = r(50, 100);
      const color = pick("#8fdcff", "#6fcfff", "#b3eaff");
      const textLength = ri(20, 100);

      paragraphs.push(
        <div
          key={i}
          className="text-line"
          style={{
            "--offset": offset,
            color: color,
            textAlign: isLeft ? "left" : "right",
            mask: isLeft
              ? `linear-gradient(to right, #fff, transparent calc(var(--offset) * 1%))`
              : `linear-gradient(to left, #fff, transparent calc(var(--offset) * 1%))`,
          }}
        >
          {generateText(textLength)}
        </div>,
      );
    }
    return paragraphs;
  };

  const build = () => {
    setLeftShapes(generateParagraphs(true));
    setRightShapes(generateParagraphs(false));
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
  const rightShapePath = shapePath;
  return (
    <div className="janus-main" onClick={build}>
      <div className="janus-container">
        <div className="face-container left-face">
          <div
            className="janus-shape left-shape"
            style={{
              shapeOutside: `polygon(${leftShapePath})`,
            }}
          />
          <div className="text-container left-text">{leftShapes}</div>
        </div>

        <div className="face-container right-face">
          <div
            className="janus-shape right-shape"
            style={{
              shapeOutside: `polygon(${rightShapePath})`,
            }}
          />
          <div className="text-container right-text">{rightShapes}</div>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_CONFIG = {
  symbols: ["F", "R", "*", ">", "Y", "E"],
  blockSize: 12,
  detectionRadius: 30,
  clusterSize: 5,
  blockLifetime: 300,
  emptyRatio: 0.3,
  scrambleRatio: 0.25,
  scrambleInterval: 150,
};

const GridOverlay = ({
  containerRef,
  config: userConfig = {},
  className = "",
}) => {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const overlayRef = useRef(null);
  const blocksRef = useRef([]);
  const animationFrameRef = useRef();
  const [isInitialized, setIsInitialized] = useState(false);

  const getRandomSymbol = useCallback(() => {
    return config.symbols[Math.floor(Math.random() * config.symbols.length)];
  }, [config.symbols]);

  const updateHighlights = useCallback(() => {
    const currentTime = Date.now();

    blocksRef.current.forEach((block) => {
      if (block.highlightEndTime > 0 && currentTime > block.highlightEndTime) {
        block.element.classList.remove("active");
        block.highlightEndTime = 0;

        if (block.scrambleInterval) {
          clearInterval(block.scrambleInterval);
          block.scrambleInterval = null;
          if (!block.isEmpty) {
            block.element.textContent = getRandomSymbol();
          }
        }
      }
    });

    animationFrameRef.current = requestAnimationFrame(updateHighlights);
  }, [getRandomSymbol]);

  const initGrid = useCallback(() => {
    if (!containerRef.current || !overlayRef.current) return;

    const element = containerRef.current;
    const width = element.offsetWidth;
    const height = element.offsetHeight;

    if (width === 0 || height === 0) return;

    const cols = Math.ceil(width / config.blockSize);
    const rows = Math.ceil(height / config.blockSize);

    overlayRef.current.innerHTML = "";
    blocksRef.current = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const block = document.createElement("div");
        block.className = "grid-block";

        const isEmpty = Math.random() < config.emptyRatio;
        block.textContent = isEmpty ? "" : getRandomSymbol();

        block.style.width = `${config.blockSize}px`;
        block.style.height = `${config.blockSize}px`;
        block.style.left = `${col * config.blockSize}px`;
        block.style.top = `${row * config.blockSize}px`;

        const fontSize = Math.max(10, Math.min(20, config.blockSize * 0.8));
        block.style.fontSize = `${fontSize}px`;

        overlayRef.current.appendChild(block);

        blocksRef.current.push({
          element: block,
          x: col * config.blockSize + config.blockSize / 2,
          y: row * config.blockSize + config.blockSize / 2,
          gridX: col,
          gridY: row,
          highlightEndTime: 0,
          isEmpty: isEmpty,
          shouldScramble: !isEmpty && Math.random() < config.scrambleRatio,
          scrambleInterval: null,
        });
      }
    }

    setIsInitialized(true);
  }, [
    containerRef,
    config.blockSize,
    config.emptyRatio,
    config.scrambleRatio,
    getRandomSymbol,
  ]);

  const handleMouseMove = useCallback(
    (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let closestBlock = null;
      let closestDistance = Infinity;

      for (const block of blocksRef.current) {
        const dx = mouseX - block.x;
        const dy = mouseY - block.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestBlock = block;
        }
      }

      if (!closestBlock || closestDistance > config.detectionRadius) return;

      const currentTime = Date.now();

      if (closestBlock.timeoutId) {
        clearTimeout(closestBlock.timeoutId);
      }

      closestBlock.element.classList.add("active");
      closestBlock.highlightEndTime = currentTime + config.blockLifetime;

      closestBlock.timeoutId = setTimeout(() => {
        if (closestBlock.element) {
          closestBlock.element.classList.remove("active");
          if (closestBlock.scrambleInterval) {
            clearInterval(closestBlock.scrambleInterval);
            closestBlock.scrambleInterval = null;
          }
        }
      }, config.blockLifetime);

      if (closestBlock.shouldScramble && !closestBlock.scrambleInterval) {
        closestBlock.scrambleInterval = setInterval(() => {
          if (closestBlock.element.classList.contains("active")) {
            closestBlock.element.textContent = getRandomSymbol();
          }
        }, config.scrambleInterval);
      }

      const clusterCount = Math.floor(Math.random() * config.clusterSize) + 1;
      let currentBlock = closestBlock;
      let activeBlocks = [closestBlock];

      for (let i = 0; i < clusterCount; i++) {
        const neighbors = blocksRef.current.filter((neighbor) => {
          if (activeBlocks.includes(neighbor)) return false;

          const dx = Math.abs(neighbor.gridX - currentBlock.gridX);
          const dy = Math.abs(neighbor.gridY - currentBlock.gridY);

          return dx <= 1 && dy <= 1;
        });

        if (neighbors.length === 0) break;

        const randomNeighbor =
          neighbors[Math.floor(Math.random() * neighbors.length)];

        if (randomNeighbor.timeoutId) {
          clearTimeout(randomNeighbor.timeoutId);
        }

        const lifetime = config.blockLifetime + i * 10;
        randomNeighbor.element.classList.add("active");
        randomNeighbor.highlightEndTime = currentTime + lifetime;

        randomNeighbor.timeoutId = setTimeout(() => {
          if (randomNeighbor.element) {
            randomNeighbor.element.classList.remove("active");
            if (randomNeighbor.scrambleInterval) {
              clearInterval(randomNeighbor.scrambleInterval);
              randomNeighbor.scrambleInterval = null;
            }
          }
        }, lifetime);

        if (randomNeighbor.shouldScramble && !randomNeighbor.scrambleInterval) {
          randomNeighbor.scrambleInterval = setInterval(() => {
            if (randomNeighbor.element.classList.contains("active")) {
              randomNeighbor.element.textContent = getRandomSymbol();
            }
          }, config.scrambleInterval);
        }

        activeBlocks.push(randomNeighbor);
        currentBlock = randomNeighbor;
      }
    },
    [
      containerRef,
      config.detectionRadius,
      config.blockLifetime,
      config.clusterSize,
      config.scrambleInterval,
      getRandomSymbol,
    ],
  );

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    blocksRef.current.forEach((block) => {
      if (block.timeoutId) {
        clearTimeout(block.timeoutId);
      }
      if (block.scrambleInterval) {
        clearInterval(block.scrambleInterval);
      }
      if (block.element) {
        block.element.classList.remove("active");
      }
    });

    blocksRef.current = [];
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const timeoutId = setTimeout(() => {
      initGrid();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      cleanup();
    };
  }, [containerRef, initGrid, cleanup]);

  useEffect(() => {
    if (!containerRef.current || !isInitialized) return;

    const element = containerRef.current;
    element.addEventListener("mousemove", handleMouseMove);

    const resizeObserver = new ResizeObserver(() => {
      cleanup();
      initGrid();
    });

    resizeObserver.observe(element);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
    };
  }, [containerRef, handleMouseMove, isInitialized, cleanup, initGrid]);

  return (
    <div
      ref={overlayRef}
      className={`grid-overlay ${className}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2,
      }}
    />
  );
};

const HoverImage = forwardRef(
  ({ config, src, alt, className = "", style = {}, ...imgProps }, ref) => {
    const imgRef = useRef(null);

    const setRefs = useCallback(
      (node) => {
        imgRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    return (
      <>
        <img
          ref={setRefs}
          src={src}
          alt={alt}
          className={className}
          style={{
            ...style,
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          {...imgProps}
        />
        {imgRef.current && (
          <GridOverlay containerRef={imgRef} config={config} />
        )}
      </>
    );
  },
);
function MaskText() {
  const count = 13;
  const containerRef = useRef(null);
  const maskBarsRef = useRef([]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(maskBarsRef.current, {
        scaleX: 0.05,
        transformOrigin: "center",
      });

      gsap.to(maskBarsRef.current, {
        scaleX: 1,
        transformOrigin: "center",
        stagger: {
          each: 0.05,
          from: "center",
        },
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
          end: "top 30%",
          scrub: 1,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="masktext-root">
      {/* ROW 1 */}
      <div className="masktext-row masktext-row-top">
        <h1 className="masktext-text">Unusual attention</h1>
        <div className="masktext-strip masktext-strip-right" />
      </div>

      {/* ROW 2 */}
      <div className="masktext-row masktext-row-mask">
        <span className="masktext-text masktext-nowrap">to detail</span>
        <div className="masktext-mask">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              ref={(el) => (maskBarsRef.current[i] = el)}
              className="masktext-mask-bar"
            />
          ))}
        </div>
      </div>

      {/* ROW 3 */}
      <div className="masktext-row masktext-row-left">
        <div className="masktext-strip masktext-strip-left" />
        <span className="masktext-text masktext-nowrap">in a distracted</span>
      </div>

      {/* ROW 4 */}
      <div className="masktext-row masktext-row-bottom">
        <h1 className="masktext-text"> world</h1>
        <div className="masktext-strip masktext-strip-left-bottom" />
      </div>
    </section>
  );
}
