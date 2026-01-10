"use client";
import "../mouse-gooey-effect-5/css/style.css";
import { Item } from "../../utils/Item";
import Image from "next/image";
import Lenis from "@studio-freight/lenis";
import { OrbitControls, Environment } from "@react-three/drei";
import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useLayoutEffect,
} from "react";
import { SplitText } from "gsap/SplitText";
import { motion, useScroll, useTransform } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ArrowLeftIcon from "../_components/ui/ArrowLeftIcon";
import ArrowRightIcon from "../_components/ui/ArrowRightIcon";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  TextureLoader,
  CubeCamera,
  WebGLCubeRenderTarget,
  LinearMipmapLinearFilter,
  RGBFormat,
} from "three";
import  GridContainer, {
  MemberCard,
  items,

} from "../mouse-gooey-effect-5/components/GridContainer";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}
function SonarSweep() {
  const canvasRef = useRef(null);
  const width = 240;
  const height = 240;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const centerX = width / 2;
    const centerY = height / 2;

    const dotRings = [
      { radius: 15, count: 6 },
      { radius: 30, count: 12 },
      { radius: 45, count: 18 },
      { radius: 60, count: 24 },
      { radius: 75, count: 30 },
    ];

    const waveSpeed = 30;
    const waveThickness = 40;
    const maxDotRadius = dotRings[dotRings.length - 1].radius;
    const maxAnimatedRadius = maxDotRadius + waveThickness;
    const rotationMagnitude = 0.15;
    const rotationSpeedFactor = 3;
    const BLUE = "#DDFF00";

    let time = 0;
    let lastTime = 0;

    function animate(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      ctx.clearRect(0, 0, width, height);

      // center dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
      ctx.fillStyle = BLUE;
      ctx.fill();

      const currentWaveFront = (time * waveSpeed) % maxAnimatedRadius;

      dotRings.forEach((ring) => {
        for (let i = 0; i < ring.count; i++) {
          const baseAngle = (i / ring.count) * Math.PI * 2;
          const baseRadius = ring.radius;
          const distToWaveFront = baseRadius - currentWaveFront;

          let pulseFactor = 0;
          if (Math.abs(distToWaveFront) < waveThickness / 2) {
            pulseFactor = Math.cos(
              (distToWaveFront / (waveThickness / 2)) * (Math.PI / 2)
            );
            pulseFactor = Math.max(0, pulseFactor);
          }

          let currentAngle = baseAngle;
          if (pulseFactor > 0.01) {
            const angleOffset =
              pulseFactor *
              Math.sin(time * rotationSpeedFactor + i * 0.5) *
              rotationMagnitude;
            currentAngle += angleOffset;
          }

          const dotSize = 1.5 + pulseFactor * 1.8;
          const x = centerX + Math.cos(currentAngle) * baseRadius;
          const y = centerY + Math.sin(currentAngle) * baseRadius;

          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = BLUE;
          ctx.fill();
        }
      });

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-full scale-[0.93]">
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
}
const vertexShader = `
uniform vec2 uOffset;
varying vec2 vUv;
const float PI = 3.14159265359;

vec3 deformationCurve(vec3 position, vec2 uv, vec2 offset) {
    position.x += sin(uv.y * PI) * offset.x;
    position.y += sin(uv.x * PI) * offset.y;
    return position;
}

void main() {
    vUv = uv;
    vec3 pos = position;
    pos = deformationCurve(pos, uv, uOffset);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;
const fragmentShader = `
uniform sampler2D iChannel0;
uniform vec2 uMeshSize;
uniform vec2 uMediaSize;
uniform vec2 uOffset;
uniform float uOpacity;
uniform float uMouseEnter;
uniform float uMouseEnterMask;
varying vec2 vUv;

vec2 distort(vec2 uv) {
    uv -= 0.5;
    float mRatio = uMeshSize.x / uMeshSize.y;
    float strength = 1.0 - (10.0 * (1.0 - uMouseEnter)) * (pow(uv.x * mRatio, 2.0) + pow(uv.y, 2.0));
    uv *= strength;
    uv += 0.5;
    return uv;
}

void main() {
    vec2 uv = vUv;
    uv = distort(uv);
    vec4 tex = texture2D(iChannel0, uv);
    gl_FragColor = vec4(tex.rgb, tex.a * uOpacity);
}
`;

const ShaderPlane = ({ imageUrl, mouse }) => {
  const meshRef = useRef();
  const texture = useLoader(TextureLoader, imageUrl);

  const uniforms = useMemo(
    () => ({
      iChannel0: { value: texture },
      uMeshSize: { value: new THREE.Vector2(300, 400) },
      uMediaSize: {
        value: new THREE.Vector2(texture.image.width, texture.image.height),
      },
      uOffset: { value: new THREE.Vector2(0, 0) },
      uOpacity: { value: 1.0 },
      uMouseEnter: { value: 0 },
      uMouseEnterMask: { value: 0 },
    }),
    [texture]
  );

  useFrame(() => {
    if (!meshRef.current) return;

    const targetX = mouse.current.x;
    const targetY = mouse.current.y;

    gsap.to(meshRef.current.position, {
      x: (targetX - 0.5) * window.innerWidth,
      y: -(targetY - 0.5) * window.innerHeight,
      duration: 0.4,
      ease: "power3.out",
    });

    gsap.to(uniforms.uOffset.value, {
      x: (targetX - 0.5) * 0.2,
      y: (targetY - 0.5) * 0.2,
      duration: 0.3,
    });

    gsap.to(uniforms.uMouseEnter, {
      value: 1,
      duration: 1.2,
      ease: "power2.out",
    });
    gsap.to(uniforms.uMouseEnterMask, {
      value: 1,
      duration: 0.7,
      ease: "power2.out",
    });
  });

  return (
    <mesh ref={meshRef} scale={[300, 400, 1]}>
      <planeGeometry args={[1, 1, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
};
const Intro = ({ texts = [], onFinished }) => {
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
    <main ref={wrapperRef}>
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
          <textPath xlinkHref="#circle-1" textLength="2830">
            Low dose 3d digital radiographs&nbsp;
          </textPath>
        </text>
        <text
          dy="-20"
          ref={(el) => (circleTextRefs.current[2] = el)}
          className="circles__text circles__text--2"
        >
          <textPath xlinkHref="#circle-2" textLength="2001">
            Accelerated Treatment&nbsp;
          </textPath>
        </text>
        <text
          dy="-20"
          ref={(el) => (circleTextRefs.current[3] = el)}
          className="circles__text circles__text--3"
        >
          <textPath xlinkHref="#circle-3" textLength="1341">
            Invisalign&nbsp; Invisalign&nbsp; Invisalign&nbsp;
          </textPath>
        </text>
      </svg>
    </main>
  );
};
const images = [
  "../images/team_members/Adriana-Photoroom.jpg",
  "../images/team_members/Nicollewaving.png",
  "../images/team_members/Lexiworking.png",
  "../images/team_members/Elizabethaao.png",
  "../images/team_members/Alyssascan.png",
];

function ImageCard({ texture, index }) {
  const ref = useRef();
  const z = index * -1.5;
  const x = 0;
  const rotation = useMemo(() => [0, 0.1 * index, 0], [index]);

  return (
    <group ref={ref} position={[x, 0, z]} rotation={rotation}>
      <mesh>
        <boxGeometry args={[2, 3, 0.02]} />
        <meshPhysicalMaterial
          map={texture}
          roughness={0.1}
          metalness={0.2}
          transparent
          transmission={0.2}
          thickness={0.1}
          ior={1.1}
          reflectivity={0.2}
          clearcoat={1}
          clearcoatRoughness={0.05}
          toneMapped={false}
          opacity={1}
        />
      </mesh>
    </group>
  );
}

function Scene() {
  const textures = useLoader(THREE.TextureLoader, images);

  return (
    <>
      {textures.map((tex, i) => (
        <ImageCard key={i} texture={tex} index={i} />
      ))}
      <Environment preset="sunset" />
      <ambientLight intensity={1.2} />
      <directionalLight intensity={1.5} position={[5, 5, 5]} />

      <OrbitControls enableZoom={false} />
    </>
  );
}
const ShaderHoverEffect = () => {
  const images = [
    {
      name: "Alyssa",
      url: "../images/team_members/Alyssascan.png",
      description: "Treatment Coordinator",
    },
    {
      name: "Nicolle",
      url: "../images/team_members/Nicollewaving.png",
      description: "Specialized Orthodontic Assistant",
    },
    {
      name: "Lexi",
      url: "../images/team_members/Lexiworking.png",
      description: "Treatment Coordinator",
    },
    {
      name: "Elizabeth",
      url: "../images/team_members/Elizabethaao.png",
      description: "Patient Services",
    },
    {
      name: "Adriana",
      url: "../images/team_members/Adriana-Photoroom.jpg",
      description: "Insurance Coordinator",
    },
  ];
  const [hoveredImage, setHoveredImage] = useState(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });

  const handleMouseMove = (e) => {
    mouse.current.x = e.clientX / window.innerWidth;
    mouse.current.y = e.clientY / window.innerHeight;
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <Canvas orthographic camera={{ zoom: 1, position: [0, 0, 100] }}>
        {hoveredImage && <ShaderPlane imageUrl={hoveredImage} mouse={mouse} />}
      </Canvas>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col justify-between space-y-6 text-center">
          {images.map((img) => (
            <div
              key={img.name}
              className="flex flex-row justify-between text-xl cursor-pointer font-neuehaasdisplaythin w-96"
              onMouseEnter={() => setHoveredImage(img.url)}
              onMouseLeave={() => setHoveredImage(null)}
            >
              <span>{img.name}</span>
              <span className="text-sm text-gray-400">{img.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
  const greggTitleRef = useRef(null);
  const danTitleRef = useRef(null);
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
        }
      );

      tl.to(
        titleRef.current,
        {
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        },
        "+=0.2"
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
      "+=0.1"
    );

    tl.call(
      () => {
        setShowContent(true);
      },
      null,
      "+=0.2"
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
        }
      );
    });
  }, []);

  useLayoutEffect(() => {
    if (!wrapperRef.current || !scrollRef.current || !lastSectionRef.current)
      return;
    ScrollTrigger.getAll().forEach((t) => t.kill());
    if (largeDanRef.current) gsap.set(largeDanRef.current, { x: "-100%" });
    if (smallGreggRef.current) gsap.set(smallGreggRef.current, { x: "-100%" });
    if (smallDanRef.current) gsap.set(smallDanRef.current, { x: "0%" });
    if (danNameRef.current) gsap.set(danNameRef.current, { opacity: 0 });
    if (danTitleRef.current) gsap.set(danTitleRef.current, { opacity: 0 });

    const targetY =
      scrollRef.current.offsetHeight - lastSectionRef.current.offsetHeight;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapperRef.current,
        start: "top top",
        end: "+=" + window.innerHeight * 3,
        scrub: true,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.to(
      scrollRef.current,
      {
        y: -targetY,
        ease: "none",
        duration: 1,
      },
      0
    );

    tl.add("switch", 0);

    tl.to(
      largeGreggRef.current,
      {
        x: "100%",
        duration: 1.5,
        ease: "power2.inOut",
      },
      "switch"
    );

    tl.to(
      largeDanRef.current,
      {
        x: "0%",
        duration: 1.5,
        ease: "power2.inOut",
      },
      "switch"
    );

    tl.to(
      smallDanRef.current,
      {
        x: "100%",
        duration: 1.5,
        ease: "power2.inOut",
      },
      "switch"
    );

    tl.to(
      smallGreggRef.current,
      {
        x: "0%",
        duration: 1.5,
        ease: "power2.inOut",
      },
      "switch"
    );

    tl.to(
      greggNameRef.current,
      {
        opacity: 0,
        duration: 1.5,
        ease: "power2.inOut",
      },
      "switch"
    );

    tl.to(
      danNameRef.current,
      {
        opacity: 1,
        duration: 1.5,
        ease: "power2.inOut",
      },
      "switch"
    );

    tl.to(
      greggTitleRef.current,
      {
        opacity: 0,
        duration: 1.5,
        ease: "power2.inOut",
      },
      "switch"
    );

    tl.to(
      danTitleRef.current,
      {
        opacity: 1,
        duration: 1.5,
        ease: "power2.inOut",
      },
      "switch"
    );

    tl.to(
      wrapperRef.current,
      {
        xPercent: -100,
        ease: "none",
        duration: 1,
      },
      "+=0.5"
    );

    tl.to(
      [col1Ref.current, col2Ref.current, col3Ref.current],
      {
        yPercent: (i) => (i % 2 === 0 ? -100 : 100),
        ease: "none",
        duration: 2,
        stagger: {
          each: 0.3,
        },
      },
      "+=0.2"
    );

    ScrollTrigger.refresh();

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

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

  return (
    <div className="relative w-full h-screen bg-[#E4E7FF]">
      <div className="relative overflow-x-clip">
        <div ref={wrapperRef} className="flex w-full bg-[#E4E7FF]">
          <div
            ref={leftColumnRef}
            className="z-10 h-screen sticky top-0 py-[10em] sm:py-[10em] border-l border-b border-r border-[#E4E7FF] w-3/5 bg-[#FCFFFE] rounded-[12px]"
          >
            <div className="max-w-[400px] ml-10 my-10 flex flex-col overflow-hidden">
              <div className="inline-block overflow-hidden">
                <div className="text-[11px] leading-[1.1] font-neuehaas35 tracking-wider text-black">
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
                    <img
                      ref={largeGreggRef}
                      src="../../images/team_members/GreggFrey.png"
                      alt="Dr. Gregg Frey"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <img
                      ref={largeDanRef}
                      src="../../images/team_members/DanFrey.png"
                      alt="Dr. Dan Frey"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </figure>
                  <figcaption className="mt-5 relative h-[3em]">
                    <div className="relative h-[1.4em]">
                      <p
                        ref={greggNameRef}
                        className="absolute top-0 left-0 text-[12px] text-[#111] tracking-wider font-neuehaas45"
                      >
                        Dr. Gregg Frey
                      </p>
                      <p
                        ref={danNameRef}
                        className="absolute top-0 left-0 text-[12px] text-[#111] tracking-wider font-neuehaas45"
                      >
                        Dr. Dan Frey
                      </p>
                    </div>
                    <div className="relative mt-1 h-[1.2em]">
                      <p
                        ref={greggTitleRef}
                        className="absolute top-0 left-0 text-[12px] text-[#111] tracking-wider font-neuehaas45"
                      >
                        DDS
                      </p>
                      <p
                        ref={danTitleRef}
                        className="absolute top-0 left-0 text-[12px] text-[#111] tracking-wider font-neuehaas45"
                      >
                        DMD, MSD
                      </p>
                    </div>
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

          <div ref={scrollRef} className="z-10 relative w-2/5">
            <div className="rounded-[12px] border-b border-b bg-[#FCFFFE]  py-[10em] sm:py-[10em] h-screen lg:px-8 ">
              <div className="flex items-center justify-center h-full gap-8 px-6 max-w-[600px] relative">
                <p className="leading-[1.3] font-neuehaas45 text-[12px] tracking-wider text-[#111] absolute inset-0 flex justify-center items-center">
                  Dr. Gregg Frey is an orthodontist based in Pennsylvania, who
                  graduated from Temple University School of Dentistry with
                  honors and served in the U.S. Navy Dental Corps before
                  establishing his practice in the Lehigh Valley. He is a
                  Diplomat of the American Board of Orthodontics and has
                  received numerous distinctions, accreditations, and honors,
                  including being named one of America&apos;s Top Orthodontists
                  by the Consumer Review Council of America. This distinction is
                  held by fewer than 25% of orthodontists nationwide. ABO
                  certification represents the culmination of 5-10 years of
                  written and oral examinations and independent expert review of
                  actual treated patients. Recently Dr. Frey voluntarily
                  re-certified. Dr. Frey enjoys coaching soccer, vintage car
                  racing, and playing the drums.
                </p>
              </div>
            </div>
            <div className="relative h-full">
              <section
                ref={lastSectionRef}
                className="relative bg-cover h-screen  rounded-[12px] overflow-hidden"
              >
                <div className="flex justify-center items-center rounded-[12px] border-b border-b bg-[#FCFFFE]  py-[10em] sm:py-[10em] h-screen lg:px-8 ">
                  <p className="leading-[1.3] font-neuehaas45 text-[12px] tracking-wider text-[#111]">
                    Dr. Daniel Frey completed his pre-dental requisites at the
                    University of Pittsburgh, majoring in Biology. Dr. Frey
                    excelled in his studies and was admitted to Temple
                    University&apos;s dental school, graduating at the top of
                    his class achieving the prestigious Summa Cum Laude
                    designation. Continuing his education, Dr. Frey was admitted
                    to the esteemed orthodontic residency program at the
                    University of the Pacific Arthur A Dugoni School of
                    Dentistry in San Francisco. While in San Francisco, he
                    studied and worked with students and faculty from around the
                    world and utilized cutting-edge orthodontic techniques.
                    During his time in San Francisco, he conducted research in
                    three-dimensional craniofacial analysis and earned his
                    Master of Science degree. Dr. Frey is a member of the
                    American Association of Orthodontists, American Academy of
                    Facial Esthetics, and the American Dental Association. In
                    his free time, he enjoys staying active, camping, music,
                    cooking, and spending time with loved ones.
                  </p>
                </div>
              </section>

              <div
                ref={newSectionRef}
                className="absolute top-0 w-full h-full left-full"
              >
                <div className="absolute inset-0 z-1">

   <GridContainer />


                </div>
                <div
                  onMouseEnter={() => setIsFocused(true)}
                  onMouseLeave={() => setIsFocused(false)}
                  className="bg-[#E4E7FF] w-screen h-screen grid grid-cols-3 text-[#333] font-neuehaas45 text-[14px] leading-relaxed"
                >
                  {/* Col 1 */}
                  <div className="overflow-hidden">
                    <div
                      ref={col1Ref}
                      className="flex flex-col will-change-transform"
                 
                    >
                      <div className="relative bg-[#FCFFFE] rounded-[12px] p-8 border border-[#E4E7FF] h-[33.33vh] flex flex-col justify-start items-start shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
 

                        <div className="mt-[48px]">
                          <p className="font-neuehaas45 text-[#333] tracking-wide text-[13px] leading-[1.4]">
                            The systems, the flow, the details — all dialed in
                            so your visits stay smooth start to finish.
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                        <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]"></p>
                      </div>
                      <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                        <a href="https://www.trapezio.com/training-resources/course-outlines/soa-prep-course-outline/">
                          <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                            Our members have received the designation of
                            Specialized Orthodontic Assistant. This is a
                            voluntary certification program started by the
                            American Association of Orthodontists to recognize
                            those in the profession for their knowledge and
                            experience.
                          </p>
                        </a>
                      </div>
                      <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                        <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                          Entrust your smile's transformation to our handpicked
                          team of orthodontic specialists.
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
                      <div className="relative bg-[#FCFFFE] rounded-[12px] p-8 border border-[#E4E7FF] h-[33.33vh] flex flex-col justify-start items-start shadow-[0_2px_6px_rgba(0,0,0,0.04)]">

                        <div className="mt-[48px]">
                          <p className="font-neuehaas45 text-[#333] tracking-wide text-[13px] leading-[1.4]">
                            The systems, the flow, the details — all dialed in
                            so your visits stay smooth start to finish.
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                        <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]"></p>
                      </div>
                      <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                        <a href="https://www.trapezio.com/training-resources/course-outlines/soa-prep-course-outline/">
                          <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                            Our members have received the designation of
                            Specialized Orthodontic Assistant. This is a
                            voluntary certification program started by the
                            American Association of Orthodontists to recognize
                            those in the profession for their knowledge and
                            experience.
                          </p>
                        </a>
                      </div>
                      <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                        <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                          Entrust your smile's transformation to our handpicked
                          team of orthodontic specialists.
                        </p>
                      </div>
                      <a
                        href="https://g.co/kgs/Sds93Ha"
                        className="flex justify-center items-center bg-[#FCFFFE] rounded-[12px] p-8 border-b border-r border-[#E4E7FF] h-[33.33vh]"
                      >
                        <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                          This office is on 🔥! The orthodontists as well as
                          every single staff member.
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
                      <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                        <p className="font-neuehaas45 tracking-wide text-[16px] leading-[1.1]">
                          Trained in CPR and first aid
                        </p>
                      </div>
                      <a
                        href="https://g.co/kgs/YkknjNg"
                        className="flex justify-center items-center  bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] h-[33.33vh]"
                      >
                        <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                          Had a wonderful experience at FreySmiles. Everyone is
                          extremely professional, polite, timely. Would highly
                          recommend! — TK
                        </p>
                      </a>
                      <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                        <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                          We've invested in in-office trainings with leading
                          clinical consultants that have helped us develop
                          systems and protocols streamlining our processes.
                        </p>
                      </div>
                      <div className="relative bg-[#FCFFFE] rounded-[12px] p-8 border border-[#E4E7FF] h-[33.33vh] flex flex-col justify-start items-start shadow-[0_2px_6px_rgba(0,0,0,0.05)]">


                        <div className="mt-[48px]">
                          <a
                            href="https://g.co/kgs/example-review-1"
                            className="block hover:opacity-90 transition-opacity duration-200"
                          >
                            <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.4] text-[#252424]">
                              Fun fact — our team is made up of former patients,
                              something we think is important, because we have
                              all experienced treatment and can help guide you
                              through it.
                            </p>
                          </a>
                        </div>
                      </div>
                      <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                        <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                          Eco-friendly practice: We prioritize recycling and
                          digital workflows to reduce waste.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
  );
}
{
  /* bg-[#E2F600] */
}

{
  /*   
        <section ref={container} style={{ marginTop: "50vh" }}>
          {projects.map((project, i) => {
            const targetScale = 1 - (projects.length - i) * 0.05;
            return (
              <Card
                key={`p_${i}`}
                i={i}
                {...project}
                progress={scrollYProgress}
                range={[i * 0.25, 1]}
                targetScale={targetScale}
              />
            );
          })}
        </section> */
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
