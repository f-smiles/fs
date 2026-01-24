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
import GridContainer, {
  MemberCard,
  items,
} from "../mouse-gooey-effect-5/components/GridContainer";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
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
    [texture],
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
        "start",
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
  "../images/1024mainsectionimage.jpg",
  "../images/team_members/Nicollewaving.png",
  "../images/1024mainsectionimage.jpg",
  "../images/team_members/Elizabethaao.png",
  "../images/1024mainsectionimage.jpg",
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
      url: "../images/team_members/adrianaportrait.png",
      description: "Treatment Coordinator",
    },
    {
      name: "Nicolle",
      url: "../images/team_members/Dana-Photoroom.png",
      description: "Specialized Orthodontic Assistant",
    },
    {
      name: "Nicolle",
      url: "../images/team_members/Dana-Photoroom.png",
      description: "Specialized Orthodontic Assistant",
    },
    {
      name: "Elizabeth",
      url: "../images/team_members/adrianaportrait.png",
      description: "Patient Services",
    },
    {
      name: "Adriana",
      url: "../images/team_members/adrianaportrait.png",
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

function Grid() {
  return (
    <div className="grid grid-cols-12 grid-rows-3 w-full h-full absolute inset-0 p-8">
      {Array.from({ length: 36 }).map((_, i) => (
        <div key={i} className="grid-cell" />
      ))}
    </div>
  );
}

function Content() {
  return (
    <div className="grid grid-cols-12 grid-rows-3 gap-4 w-full h-full absolute inset-0 p-8 text-white text-[11px] uppercase tracking-wide pointer-events-none">
      <div style={{ gridColumn: 1, gridRow: 1 }}>
        <br />
      </div>
      <div style={{ gridColumn: 2, gridRow: 1 }}></div>
      <div style={{ gridColumn: 3, gridRow: 1 }}>WHO</div>
      <div style={{ gridColumn: 4, gridRow: "1 / span 3" }}>BUILD </div>
      <div style={{ gridColumn: 5, gridRow: 1 }}>WILL</div>
      <div style={{ gridColumn: 6, gridRow: 1 }}>LOVE!</div>

      <div style={{ gridColumn: 1, gridRow: "2 / span 2" }}>
        OUR CULTURE IS A REFLECTION OF OUR SHARED VALUES, ATTITUDES, BELIEFS,
        AND WORKING PRACTICES.
      </div>

      <div style={{ gridColumn: 2, gridRow: 3 }}>
        GOOD IS NOT WHERE WE STOP. IT’S WHERE WE BEGIN.
      </div>

      <div style={{ gridColumn: 3, gridRow: 3 }}></div>

      {/* Highlight column */}
      <div
        className="bg-[#FF3A17] rounded-xl"
        style={{ gridColumn: 9, gridRow: "2 / span 2" }}
      />
    </div>
  );
}
const LeftRail = () => {
  const items = ["Meet Our Doctors", "Our Standards", "Meet Our Team"];

  return (
    <div className="flex flex-col gap-1">
      {/* <div className="rounded-[14px] border border-[#E4E7FF] bg-[#EBB9E6] px-4 py-20">
        <p className="text-[11px] tracking-wide text-black/60 mb-2">
         
        </p>
        <h3 className="font-serif text-[20px] leading-tight">
          Get<br />To Know Our Team
        </h3>
        <div className="mt-6 text-xl">*</div>
      </div> */}

      {items.map((item, i) => (
        <button
          key={i}
          className="
            group
            flex items-center justify-between
            rounded-[14px]
            border border-[#E4E7FF]
            bg-white
            tracking-wide
            px-4 py-3
            font-neuehaas45 
            transition
            hover:bg-[#F5F7FF]
          "
        >
          <span>{item}</span>
          <span className="transition group-hover:translate-y-1">↓</span>
        </button>
      ))}
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
      !wrapperRef.current ||
      !scrollRef.current ||
      !stackRef.current ||
      !lastSectionRef.current ||
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
        const viewportH = scrollRef.current.clientHeight; // mask height
        const contentH = stackRef.current.scrollHeight; // stacked content height
        return Math.max(0, contentH - viewportH);
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinRef.current,
          start: "top top",
          end: () => "+=" + window.innerHeight * 6,
          scrub: true,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // PHASE 1: Vertical narrative
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

      // PHASE 1 Image switching should START when vertical scroll STARTS and END when vertical scroll ENDS
      // So we place the label at 0 (start) and use the same duration as vertical scroll
      tl.add("switchStart", 0);

      tl.to(
        largeGreggRef.current,
        {
          x: "100%",
          duration: verticalDuration,
          ease: "power2.inOut",
        },
        "switchStart",
      );

      tl.to(
        largeDanRef.current,
        {
          x: "0%",
          duration: verticalDuration,
          ease: "power2.inOut",
        },
        "switchStart",
      );

      tl.to(
        smallDanRef.current,
        {
          x: "100%",
          duration: verticalDuration,
          ease: "power2.inOut",
        },
        "switchStart",
      );

      tl.to(
        smallGreggRef.current,
        {
          x: "0%",
          duration: verticalDuration,
          ease: "power2.inOut",
        },
        "switchStart",
      );

      tl.to(
        greggNameRef.current,
        {
          opacity: 0,
          duration: verticalDuration,
          ease: "power2.inOut",
        },
        "switchStart",
      );

      tl.to(
        danNameRef.current,
        {
          opacity: 1,
          duration: verticalDuration,
          ease: "power2.inOut",
        },
        "switchStart",
      );

      // PHASE 2: Horizontal slide AFTER vertical scroll completes
      // PHASE 2: ONE continuous slide where exit + entry overlap
      tl.to(trackRef.current, {
        xPercent: -66.666,
        ease: "none",
        duration: 2,
      });
      // PHASE 3
      tl.to(
        [col1Ref.current, col2Ref.current, col3Ref.current],
        {
          yPercent: (i) => (i % 2 === 0 ? -100 : 100),
          ease: "none",
          duration: 2,
          stagger: { each: 0.3 },
        },
        "+=0.2",
      );
      // PHASE 4: Fade in team cards
      // PHASE 4: Editorial card reveal (like screenshot)
      tl.add("teamReveal", ">");

      const cards = gridRef.current?.getCards?.();

      if (cards?.length) {
        tl.from(
          cards,
          {
            opacity: 0,
            y: 40, // slightly softer lift
            duration: 1.1, // not too slow, not UI-fast
            stagger: {
              each: 0.15,
              ease: "power1.out",
            },
            ease: "power3.out",
            clearProps: "all", // avoids GSAP residue
          },
          "teamReveal+=0.15",
        );
      }

      ScrollTrigger.refresh();
    }, pinRef);

    return () => ctx.revert();
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

  const pinRef = useRef(null);
  const trackRef = useRef(null);
  const stackRef = useRef(null);
  const teamSectionRef = useRef(null);
  const gridRef = useRef(null);
  return (
    <>
      <div
        ref={pinRef}
        className="relative w-full h-screen overflow-hidden bg-[#FB4D40]"
      >
        <div ref={trackRef} className="relative flex w-[300vw] h-screen">
          <div className="w-screen h-screen shrink-0">
            <div ref={wrapperRef} className="w-full h-full flex">
              {/* <aside className="sticky top-0 h-screen w-[18%] bg-[#E9ECFF] flex flex-col">
    <LeftRail />
  </aside> */}
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
    border-l border-b border-r border-[#E4E7FF]
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
                      <div className="text-[12px] leading-[1.1] font-neuehaas35 tracking-wider text-black">
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
                        <figcaption className="mt-3 relative h-[3em]">
                          <div className="relative h-[1.4em]">
                            <p
                              ref={greggNameRef}
                              className="absolute top-0 left-0 text-[13px] text-[#111] tracking-wide font-neuehaas45"
                            >
                              Dr. Gregg Frey
                            </p>
                            <p
                              ref={danNameRef}
                              className="absolute top-0 left-0 text-[13px] text-[#111] tracking-wide font-neuehaas45"
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
                    <div className="rounded-[12px] border-b border-b bg-[#FCFFFE]  py-[10em] sm:py-[10em] h-screen lg:px-8 ">
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
                        className="relative bg-cover h-screen  rounded-[12px] overflow-hidden"
                      >
                        <div className="rounded-[12px] border-b border-b bg-[#FCFFFE]  py-[10em] sm:py-[10em] h-screen lg:px-8 ">
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

          <section className="relative w-screen h-screen bg-[#FB4D40] overflow-hidden">
            <Grid />
            <Content />
          </section>
          <div
            ref={newSectionRef}
            className="w-screen h-screen shrink-0 relative overflow-hidden"
          >
            <div
              onMouseEnter={() => setIsFocused(true)}
              onMouseLeave={() => setIsFocused(false)}
              className="bg-[#000] w-screen h-screen grid grid-cols-3 text-[#333] font-neuehaas45 text-[14px] leading-relaxed"
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
                        The systems, the flow, the details — all dialed in so
                        your visits stay smooth start to finish.
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                    <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]"></p>
                  </div>
                  <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
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
                  <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
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
                  <div className="relative bg-[#FCFFFE] rounded-[12px] p-8 border border-[#E4E7FF] h-[33.33vh] flex flex-col justify-start items-start shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
                    <div className="mt-[48px]">
                      <p className="font-neuehaas45 text-[#333] tracking-wide text-[13px] leading-[1.4]">
                        The systems, the flow, the details — all dialed in so
                        your visits stay smooth start to finish.
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                    <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]"></p>
                  </div>
                  <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
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
                  <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
                    <p className="font-neuehaas45 tracking-wide text-[13px] leading-[1.1]">
                      Entrust your smile's transformation to our handpicked team
                      of orthodontic specialists.
                    </p>
                  </div>
                  <a
                    href="https://g.co/kgs/Sds93Ha"
                    className="flex justify-center items-center bg-[#FCFFFE] rounded-[12px] p-8 border-b border-r border-[#E4E7FF] h-[33.33vh]"
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
                      clinical consultants that have helped us develop systems
                      and protocols streamlining our processes.
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
                          something we think is important, because we have all
                          experienced treatment and can help guide you through
                          it.
                        </p>
                      </a>
                    </div>
                  </div>
                  <div className="bg-[#FCFFFE] rounded-[12px] p-8 border-r border-b border-[#E4E7FF] flex justify-center items-center h-[33.33vh]">
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
