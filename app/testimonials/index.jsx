"use client";
import MouseTrail from "./mouse.jsx";
import { Renderer, Program, Color, Mesh, Triangle, Vec2 } from "ogl";
import {
  motion,
  useInView,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  useScroll
} from "framer-motion";
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
  useLayoutEffect
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
} from "@react-three/drei";
import * as THREE from "three";
import { useControls } from "leva";
import { MeshStandardMaterial } from "three";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
}

const lettersAndSymbols = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "!",
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "*",
  "-",
  "_",
  "+",
  "=",
  ";",
  ":",
  "<",
  ">",
  ",",
];

const TextAnimator = forwardRef(({ children, className }, ref) => {
  const textRef = useRef(null);
  const charsRef = useRef([]);
  const originalText = useRef("");

  useEffect(() => {
    if (!textRef.current) return;

    const text = textRef.current.textContent;
    textRef.current.innerHTML = "";

    const chars = text.split("").map((char) => {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = char === " " ? "\u00A0" : char;
      span.style.display = "inline-block";
      span.style.opacity = "1";
      span.style.transform = "translateY(0%)";
      textRef.current.appendChild(span);
      return span;
    });

    charsRef.current = chars;
    originalText.current = chars.map((span) => span.textContent);
  }, [children]);

  useImperativeHandle(ref, () => ({
    animate() {
      charsRef.current.forEach((char, position) => {
        gsap.fromTo(
          char,
          { opacity: 0, y: "100%" },
          {
            y: "0%",
            opacity: 1,
            duration: 0.03,
            repeat: 2,
            repeatRefresh: true,
            repeatDelay: 0.05,
            delay: position * 0.06,
            onRepeat: () => {
              char.textContent =
                lettersAndSymbols[
                  Math.floor(Math.random() * lettersAndSymbols.length)
                ];
            },
            onComplete: () => {
              const original = originalText.current[position];
              if (original !== undefined) {
                char.textContent = original;
              }
            },
          }
        );
      });
    },
  }));

  return (
    <span
      ref={textRef}
      // className={`hover-effect hover-effect--bg-south ${className || ''}`}
      // style={{ '--anim': 0 }}
    >
      {children}
    </span>
  );
});

const Testimonial = ({ borderRef }) => {
const patients = [
  {
    name: "Lainie",
    image: "../images/testimonials/laniepurple.png",
    duration: "20 months",
  },
  {
    name: "Ron L.",
    image: "../images/testimonials/Ron_Lucien.jpg",
    duration: "INVISALIGN",
  },
  {
    name: "Elizabeth",
    image: "../images/testimonials/elizabethpatient.jpeg",
    duration: "INVISALIGN, GROWTH APPLIANCE",
  },
  {
    name: "Kinzie",
    image: "../images/testimonials/kinzie1.jpg",
    duration: "BRACES, 24 months",
  },
  { name: "Kasprenski", image: "../images/testimonials/kasprenski.jpg" },
  {
    name: "Leanne",
    image: "../images/testimonials/leanne.png",
    duration: "12 months",
  },
  {
    name: "Harold",
    image: "../images/testimonials/Narvaez.jpg",
    duration: "Invisalign",
  },
  { name: "Rosie & Grace", image: "../images/testimonials/Rosiegrace.png" },
  {
    name: "Keith",
    image: "../images/testimonials/hobsonblue.png",
    duration: "",
  },
  {
    name: "Justin",
    image: "../images/testimonials/hurlburt.jpeg",
    duration: "Invisalign, 2 years",
  },
  { name: "Kara", image: "../images/testimonials/Kara.jpeg" },
  {
    name: "Sophia",
    image: "../images/testimonials/Sophia_Lee.jpg",
    duration: "2 years, Braces",
  },
  { name: "Brynn", image: "../images/testimonials/brynnportrait.png" },
  { name: "Emma", image: "../images/testimonials/Emma.png" },
  {
    name: "Brooke",
    image: "../images/testimonials/Brooke_Walker.jpg",
    duration: "2 years, Braces",
  },
  {
    name: "Nilaya",
    image: "../images/testimonials/nilaya.jpeg",
    duration: "Braces",
  },
  { name: "Maria A.", image: "../images/testimonials/Maria_Anagnostou.jpg" },
  {
    name: "Natasha K.",
    image: "../images/testimonials/Natasha_Khela.jpg",
    duration: "",
  },
  {
    name: "James C.",
    image: "../images/testimonials/James_Cipolla.jpg",
    duration: "Invisalign, 2 years",
  },
  {
    name: "Devika K.",
    image: "../images/testimonials/Devika_Knafo.jpg",
  },
  {
    name: "Ibis S.",
    image: "../images/testimonials/Ibis_Subero.jpg",
    duration: "Invisalign, 1 year",
  },
  { name: "Abigail", image: "../images/testimonials/abigail.png" },
  { name: "Emma", image: "../images/testimonials/EmmaF.png" },
  {
    name: "Karoun G",
    duration: "Motion Appliance, Invisalign",

  },
];
 const nameRef = useRef([]);
  const durationRefs = useRef([]);
  const listRefs = useRef([]);
  const [opacities, setOpacities] = useState(patients.map(() => 1));
  const [activeIndex, setActiveIndex] = useState(0);
  
  useEffect(() => {
    listRefs.current.forEach((el) => {
      gsap.fromTo(
        el,
        { filter: "blur(8px)", opacity: 0 },
        {
          filter: "blur(0px)",
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });
  }, []);

 useEffect(() => {
    if (!borderRef?.current) return;

    const limit = 3;
    let ticking = false;

    const update = () => {
      ticking = false;
      const borderTop = borderRef.current.getBoundingClientRect().top;

      let newActiveIndex = activeIndex;

      const next = listRefs.current.map((el, i) => {
        if (!el) return 1;
        const { top: lineTop } = el.getBoundingClientRect();
        if (lineTop <= borderTop - limit) {
          newActiveIndex = i;
          return 0;
        }
        return 1;
      });

      setOpacities(next);
      setActiveIndex(newActiveIndex);
    };

    const onScrollOrResize = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [borderRef]);


 return (
   <main className="relative demo-4">
<section className="relative flex w-full min-h-screen px-8 md:px-16 pb-24 justify-center">
        <ul
          style={{
            margin: 0,
            padding: 0,
            width: "100%",
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            counterReset: "item 0",
          }}
        >
          {patients.map((item, index) => {
            const hidden = (opacities[index] ?? 1) === 0;
            return (
              <li
                key={index}
                ref={(el) => (listRefs.current[index] = el)}
                className="list__item"
                style={{
                  opacity: hidden ? 0 : 1,
                  transition: hidden
                    ? "opacity 0ms linear"
                    : "opacity 160ms linear",
                  willChange: "opacity",
                }}
                onMouseEnter={() => {
                  nameRef.current[index]?.animate?.();
                  durationRefs.current[index]?.animate?.();
                }}
              >
                <span className="list__item-col" aria-hidden="true" />
                <span className="list__item-col">
                  <TextAnimator ref={(el) => (nameRef.current[index] = el)}>
                    {item.name}
                  </TextAnimator>
                </span>
                <span className="list__item-col list__item-col--last">
                  <TextAnimator ref={(el) => (durationRefs.current[index] = el)}>
                    {item.duration || "—"}
                  </TextAnimator>
                </span>
              </li>
            );
          })}
        </ul>


        <AnimatePresence mode="wait">
          {activeIndex !== null && (
            <motion.div
              key={`image-${activeIndex}`}
className="relative bottom-[8%] right-[20%] z-40 w-[240px] h-[300px] rounded-2xl overflow-hidden shadow-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <motion.img
                key={`img-${activeIndex}`}
                src={patients[activeIndex]?.image}
                alt={patients[activeIndex]?.name}
                className="absolute inset-0 object-cover w-full h-full rounded-2xl"
                initial={{ clipPath: "inset(0% 100% 0% 0%)" }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                exit={{ clipPath: "inset(0% 100% 0% 0%)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
};



function Background() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      canvas: canvasRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const { gl } = renderer;
    gl.clearColor(0.93, 0.94, 0.96, 1.0); 

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
     precision highp float;

uniform vec3 uColor1;   // peach glow
uniform vec3 uColor2;   // powder lavender blue
uniform vec3 uColor3;   // slate lavender
uniform float uTime;
uniform float uScroll;

varying vec2 vUv;


vec4 permute(vec4 x){ 
  return mod(((x*34.0)+1.0)*x,289.0); 
}

vec2 fade(vec2 t){ 
  return t*t*t*(t*(t*6.0-15.0)+10.0); 
}

float cnoise(vec2 P){
  vec4 Pi=floor(P.xyxy)+vec4(0.0,0.0,1.0,1.0);
  vec4 Pf=fract(P.xyxy)-vec4(0.0,0.0,1.0,1.0);
  Pi=mod(Pi,289.0);
  vec4 ix=Pi.xzxz, iy=Pi.yyww, fx=Pf.xzxz, fy=Pf.yyww;
  vec4 i=permute(permute(ix)+iy);
  vec4 gx=2.0*fract(i*0.0243902439)-1.0;
  vec4 gy=abs(gx)-0.5;
  vec4 tx=floor(gx+0.5);
  gx=gx-tx;
  vec2 g00=vec2(gx.x,gy.x), g10=vec2(gx.y,gy.y);
  vec2 g01=vec2(gx.z,gy.z), g11=vec2(gx.w,gy.w);
  vec4 norm=1.79284291400159-0.85373472095314*
    vec4(dot(g00,g00),dot(g01,g01),dot(g10,g10),dot(g11,g11));
  g00*=norm.x; g01*=norm.y; g10*=norm.z; g11*=norm.w;
  float n00=dot(g00,vec2(fx.x,fy.x));
  float n10=dot(g10,vec2(fx.y,fy.y));
  float n01=dot(g01,vec2(fx.z,fy.z));
  float n11=dot(g11,vec2(fx.w,fy.w));
  vec2 fade_xy=fade(Pf.xy);
  vec2 n_x=mix(vec2(n00,n01),vec2(n10,n11),fade_xy.x);
  float n_xy=mix(n_x.x,n_x.y,fade_xy.y);
  return 2.3*n_xy;
}

/* -------------------------
   FBM for soft cloud coat
-------------------------- */
float fbm(vec2 p){
  float a = 0.0;
  float w = 0.55;
  a += w * cnoise(p*0.6);  w *= 0.55;
  a += w * cnoise(p*1.1);  w *= 0.55;
  a += w * cnoise(p*2.0);
  return a;
}

void main() {


  float n = cnoise(vUv + uScroll + sin(uTime * 0.1));
  float t = 0.5 + 0.5 * n;
  t = pow(t, 0.25);
  t = mix(t, 1.0, 0.1); // gentle bias toward blue

  vec3 color = mix(uColor1, uColor2, t);

float vign = smoothstep(0.68, 1.10, distance(vUv, vec2(0.5)));

// soften vignette near the bright top-right corner
float cornerMask = smoothstep(
  0.0,
  0.35,
  distance(vUv, vec2(0.92, 0.06))
);
vign *= cornerMask;

color = mix(color, uColor3, vign * 0.08);

float valley = smoothstep(0.50, 0.28, t);
color = mix(color, uColor3, valley * 0.08);

  float clouds = fbm(
    vUv * 0.9 +
    vec2(uScroll * 0.2, 0.0) +
    uTime * 0.015
  );

  float cMask = smoothstep(0.35, 0.85, 0.5 + 0.5 * clouds);
  vec3 coat = mix(uColor2, vec3(0.975, 0.98, 1.0), 0.72);
  color = mix(color, coat, cMask * 0.55);


vec2 liftCenter = vec2(0.92, 0.06);
float r = distance(vUv, liftCenter);
float localLift = 1.0 - smoothstep(0.30, 0.95, r);

// soften peak
localLift = pow(localLift, 1.4);

// perceptual lift (not fully additive)
color = mix(
  color,
  vec3(0.985, 0.99, 1.0),
  localLift * 0.16
);

float whiteField = fbm(vUv * 0.55 + uTime * 0.01);
whiteField = smoothstep(0.35, 0.75, 0.5 + 0.5 * whiteField);

// suppress when local lift is strong
whiteField *= (1.0 - localLift * 0.65);

// gentle luminance lift
color += whiteField * 0.12 * vec3(1.0);


  vec2 glowCenter = vec2(0.08, 0.92);
  float glow = 1.0 - smoothstep(0.0, 0.8, distance(vUv, glowCenter));

  color += uColor1 * glow * 0.07;

  gl_FragColor = vec4(color, 1.0);
}
    `;
    
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uColor1: { value: new Color("#E48B74") }, 
        uColor2: { value: new Color("#AAAEC3") }, 
        uColor3: { value: new Color("#ADB1C2") }, 
        uResolution: { value: new Vec2(gl.canvas.offsetWidth, gl.canvas.offsetHeight) },
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value.set(w, h);
    };

    const handleScroll = () => {
      program.uniforms.uScroll.value = window.scrollY * 0.001;
    };

    let frameId;
    const loop = (t) => {
      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
      frameId = requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      program.dispose?.();
      renderer.dispose?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10"
    />
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
      duration: 1.5,
      scrambleText: {
        text: originalText.current,
        characters: charSets[charsType],
        speed: 0.8,
        revealDelay: 0,
        newChars: 0.3,
        delimiter: "",
        tweenLength: true,
      },
      ease: "power2.out",
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
          // revealDelay: 0.5,
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
      // className={` ${className || ""}`}
      style={{ position: "relative", display: "inline-block" }}
    >
      <span style={{ visibility: "hidden", whiteSpace: "nowrap" }}>{text}</span>

      <span
        ref={scrambleRef}
        className="scramble-text"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </span>
  );
};

const ScrambleBlock = ({
  lines = [],
  className = "",
  scrambleOnLoad = true,
  charsType = "letters",
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {lines.map((line, i) => (
        <ScrambleText
          key={i}
          text={line}
          scrambleOnLoad={scrambleOnLoad}
          charsType={charsType}
        />
      ))}
    </div>
  );
};
const TerminalPreloader = () => {
  
  const containerRef = useRef();
const specialChars = "⬝";
  const lines = [
  { id: 1, faded: "We are committed to setting the highest standard through", highlight: "Exceptional Service", top: 0 },
  { id: 2, faded: "That commitment is supported by our use of", highlight: "State-of-the-Art Technology", top: 20 },
  { id: 3, faded: "And strengthened by the expertise that comes from", highlight: "Unmatched Experience", top: 40 },
  ];

  useEffect(() => {
    const terminalLines = containerRef.current.querySelectorAll('.terminal-line');
    

    gsap.set(terminalLines, { opacity: 0 });

    const tl = gsap.timeline({
      defaults: { ease: "none" }
    });

    lines.forEach((line, index) => {
      const lineEl = terminalLines[index];
      if (!lineEl) return;


      const appearTime = index * 0.3;

      tl.to(
        lineEl,
        { opacity: 1, duration: 0.3 },
        appearTime
      );


      if (line.faded) {
        const fadedSpan = lineEl.querySelector('.faded');
        tl.to(
          fadedSpan,
          {
            duration: 0.8,
            scrambleText: {
              text: line.faded,
              chars: specialChars,
              revealDelay: 0,
              speed: 0.3
            }
          },
          appearTime + 0.1
        );
      }


      if (line.highlight) {
        const highlightSpan = lineEl.querySelector('.highlight');
        tl.to(
          highlightSpan,
          {
            duration: 0.8,
            scrambleText: {
              text: line.highlight,
              chars: specialChars,
              revealDelay: 0,
              speed: 0.3
            }
          },
          appearTime + (line.faded ? 0.5 : 0.1) 
        );
      }


      if (index % 3 === 0 && index > 0) {
        tl.add(() => {
          const spans = lineEl.querySelectorAll('span');
          spans.forEach(span => {
            const text = span.textContent;
            gsap.to(span, {
              duration: 0.2,
              scrambleText: {
                text: text,
                chars: specialChars,
                speed: 0.1
              },
              repeat: 1,
              yoyo: true
            });
          });
        }, `+=${Math.random() * 0.5}`);
      }
    });

    return () => tl.kill(); 
  }, []);

  return (
    
    <div className="terminal-preloader">
    

      <div className="terminal-container" ref={containerRef}>
        {lines.map((line) => (
          <div 
            key={line.id}
            className="terminal-line"
            style={{ top: `${line.top}px` }}
          >
            {line.faded && <span className="faded"></span>}
            {line.highlight && <span className="highlight"></span>}
          </div>
        ))}
      </div>

    
    </div>
  );
};

const Testimonials = () => {

  const textRef = useRef(null);
  const bgTextColor = "#CECED3";
  const fgTextColor = "#161818";

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
      }
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
        }
      );
    });
  }, []);

  const patients = [
    {
      name: "Lainie",
      image: "../images/testimonials/laniepurple.png",
      duration: "20 months",
    },
    {
      name: "Ron L.",
      image: "../images/testimonials/Ron_Lucien.jpg",
      duration: "INVISALIGN",
    },
    {
      name: "Elizabeth",
      image: "../images/testimonials/elizabethpatient.jpeg",
      duration: "INVISALIGN, GROWTH APPLIANCE",
    },
    {
      name: "Kinzie",
      image: "../images/testimonials/kinzie1.jpg",
      duration: "BRACES, 24 months",
    },
    { name: "Kasprenski", image: "../images/testimonials/kasprenski.jpg" },
    {
      name: "Leanne",
      image: "../images/testimonials/leanne.png",
      duration: "12 months",
    },
    {
      name: "Harold",
      image: "../images/testimonials/Narvaez.jpg",
      duration: "Invisalign",
    },
    { name: "Rosie & Grace", image: "../images/testimonials/Rosiegrace.png" },
    {
      name: "Keith",
      image: "../images/testimonials/hobsonblue.png",
      duration: "",
    },
    {
      name: "Justin",
      image: "../images/testimonials/hurlburt.jpeg",
      duration: "Invisalign, 2 years",
    },
    { name: "Kara", image: "../images/testimonials/Kara.jpeg" },
    {
      name: "Sophia",
      image: "../images/testimonials/Sophia_Lee.jpg",
      duration: "2 years, Braces",
    },
    { name: "Brynn", image: "../images/testimonials/brynnportrait.png" },
    { name: "Emma", image: "../images/testimonials/Emma.png" },
    {
      name: "Brooke",
      image: "../images/testimonials/Brooke_Walker.jpg",
      duration: "2 years, Braces",
    },
    {
      name: "Nilaya",
      image: "../images/testimonials/nilaya.jpeg",
      duration: "Braces",
    },
    {
      name: "Maria A.",
      image: "../images/testimonials/Maria_Anagnostou.jpg",
    },
    {
      name: "Natasha K.",
      image: "../images/testimonials/Natasha_Khela.jpg",
      duration: "",
    },
    {
      name: "James C.",
      image: "../images/testimonials/James_Cipolla.jpg",
      duration: "Invisalign, 2 years",
    },
    {
      name: "Devika K.",
      image: "/images/testimonials/Devika_Knafo.jpg",
    },
    {
      name: "Ibis S.",
      image: "../images/testimonials/Ibis_Subero.jpg",
      duration: "Invisalign, 1 year",
    },
    {
      name: "Abigail",
      image: "../images/testimonials/abigail.png",
    },
    {
      name: "Emma",
      image: "../images/testimonials/EmmaF.png",
    },
    {
      name: "Karoun G",
      duration: "Motion Appliance, Invisalign",
      // image: "../images/testimonials/EmmaF.png",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(null);
  const timeoutRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [displayIndex, setDisplayIndex] = useState(null);
  const firstNameRef = useRef(null);

  const handleMouseEnter = (index) => {
    setActiveIndex(index);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const animateIndices = (current) => {
      if (current === index) {
        setDisplayIndex(index);
        return;
      }

      const step = current < index ? 1 : -1;
      setDisplayIndex(current);

      timeoutRef.current = setTimeout(() => {
        animateIndices(current + step);
      }, 200);
    };

    const startFrom =
      displayIndex !== null
        ? displayIndex
        : activeIndex !== null
        ? activeIndex
        : 0;
    animateIndices(startFrom);
  };
  const handleMouseLeave = () => {
    setActiveIndex(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const [lerpedPos, setLerpedPos] = useState({ x: 0, y: 0 });
  const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

  useEffect(() => {
    let animationFrame;

    const update = () => {
      setLerpedPos((prev) => ({
        x: lerp(prev.x, mousePos.x, 0.15),
        y: lerp(prev.y, mousePos.y, 0.15),
      }));

      animationFrame = requestAnimationFrame(update);
    };

    update();

    return () => cancelAnimationFrame(animationFrame);
  }, [mousePos]);

  useEffect(() => {
    if (firstNameRef.current) {
      const rect = firstNameRef.current.getBoundingClientRect();

      setMousePos({
        x: rect.right + 24,
        y: rect.top + rect.height / 2,
      });
    }
  }, []);

  const patientSectionRef = useRef();
  const [sectionTop, setSectionTop] = useState(0);

  useEffect(() => {
    if (patientSectionRef.current) {
      const rect = patientSectionRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || window.pageYOffset;
      setSectionTop(rect.top + scrollTop);
    }
  }, []);

  const containerRef = useRef(null);

  const testimonials = [
    {
      name: "JAMES PICA",
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
      name: "FEI ZHAO",
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
      image: "/images/_mesh_gradients/redorange.png",

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

  // const sectionRef = useRef(null);

  // useEffect(() => {
  //   const el = sectionRef.current;

  //   gsap.to(el, {
  //     yPercent: -100,
  //     ease: "none",
  //     scrollTrigger: {
  //       trigger: el,
  //       start: "top top",
  //       end: "bottom top",
  //       scrub: true,

  //     },
  //   });
  // }, []);

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


useEffect(() => {
  const centerBias = 0.55; 
  const distToCenter = (el) => {
    if (!el) return Infinity;
    const r = el.getBoundingClientRect();
    const sectionCenter = (r.top + r.bottom) / 2;
    const viewportCenter = window.innerHeight * centerBias;
    return Math.abs(sectionCenter - viewportCenter);
  };

  let raf = 0;
  const update = () => {
    raf = 0;
    if (!testimonialsRef.current || !reviewsRef.current) return;
    const a = distToCenter(testimonialsRef.current);
    const b = distToCenter(reviewsRef.current);
    setActiveDot(a <= b ? "results" : "reviews");
  };

  const onScrollOrResize = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };


  update();
  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScrollOrResize);
    window.removeEventListener("resize", onScrollOrResize);
    if (raf) cancelAnimationFrame(raf);
  };
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
        }
      );
    });
  }, []);

const borderRef = useRef(null);
const containerVariants = {
  initial: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

const makeCardVariants = (i) => ({
  hidden: { x: 120, opacity: 0, rotate: 2, filter: "blur(4px)" },
  visible: {
    x: 0,
    opacity: 1,
    rotate: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 140, damping: 18, mass: 0.6, delay: i * 0.05 },
  },
});
  const sectionRef = useRef(null);    
  const viewportRef = useRef(null);   
  const [viewportW, setViewportW] = useState(0);


  const VISIBLE = 4;


  const maxPage = Math.max(0, Math.ceil(testimonials.length / VISIBLE) - 1);


  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"], 
  });

  const [page, setPage] = useState(0);


  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const snapped = Math.round(v * maxPage);
    const clamped = Math.max(0, Math.min(maxPage, snapped));
    setPage(clamped);
  });


  useEffect(() => {
    const measure = () => setViewportW(viewportRef.current?.clientWidth ?? 0);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const xOffset = useMemo(() => -(page * viewportW), [page, viewportW]);

  const sectionOneRef = useRef(null);
  const navBarRef = useRef(null);

useEffect(() => {
  if (!sectionOneRef.current || !navBarRef.current) return;

  const st = ScrollTrigger.create({
    trigger: sectionOneRef.current,
    start: "75% top",
    end: () => `+=${navBarRef.current.offsetTop + window.innerHeight}`,
    pin: navBarRef.current,      
    pinSpacing: false,
    pinType: "fixed",       
    anticipatePin: 1
  });

  return () => st.kill();
}, []);
const testimonialsRef = useRef(null); 
const reviewsRef = useRef(null);   

const [activeDot, setActiveDot] = useState("results");
useEffect(() => {
  let lastY = window.scrollY;
  const checkScrollJump = () => {
    const y = window.scrollY;
    if (Math.abs(y - lastY) > 150) ScrollTrigger.refresh(true);
    lastY = y;
  };
  gsap.ticker.add(checkScrollJump);
  return () => gsap.ticker.remove(checkScrollJump);
}, []);

const [trailEnabled, setTrailEnabled] = useState(true);
const testimonialRef = useRef(null);

useEffect(() => {
  const st = ScrollTrigger.create({
    trigger: testimonialRef.current,
    start: "top center",
    end: "bottom center",
    onEnter: () => setTrailEnabled(false),
    onLeave: () => setTrailEnabled(true),
    onEnterBack: () => setTrailEnabled(false),
    onLeaveBack: () => setTrailEnabled(true),
  });
  return () => st.kill();
}, []);

  return (
    <>

      <MouseTrail
        images={[
          "../images/mousetrail/flame.png",
          "../images/mousetrail/cat.png",
          "../images/mousetrail/pixelstar.png",
          "../images/mousetrail/avocado.png",
          "../images/mousetrail/ghost.png",
          "../images/mousetrail/pacman.png",
          "../images/mousetrail/evilrobot.png",
          "../images/mousetrail/thirdeye.png",
          "../images/mousetrail/alientcat.png",
          "../images/mousetrail/gotcha.png",
          "../images/mousetrail/karaokekawaii.png",
          "../images/mousetrail/mushroom.png",
          "../images/mousetrail/pixelcloud.png",
          "../images/mousetrail/pineapple.png",
          "../images/mousetrail/pixelsun.png",
          "../images/mousetrail/cherries.png",
          "../images/mousetrail/watermelon.png",
          "../images/mousetrail/dolphins.png",
          "../images/mousetrail/jellyfish.png",
          "../images/mousetrail/nyancat.png",
          "../images/mousetrail/donut.png",
          "../images/mousetrail/controller.png",
          "../images/mousetrail/dinosaur.png",
          "../images/mousetrail/headphones.png",
          "../images/mousetrail/porsche.png",
        ]}
      />
      <Background />
<section
  ref={sectionOneRef}
  className="z-10 relative w-full min-h-[110vh] px-6 md:px-12"
>
  <div className="z-10 max-w-[1400px] mx-auto w-full flex flex-col md:flex-row gap-0">
    
    <div className="w-full md:w-1/2 min-h-[100vh]"></div>
    <div className="w-full md:w-1/2 flex items-center justify-center min-h-[100vh]">
      <div className="max-w-[1200px] w-full">
        <div className="font-neuehaas45 leading-[1.2] relative">
          <TerminalPreloader />
        </div>
      </div>
    </div>
  </div>

  <div
    ref={navBarRef}
    className="z-10 absolute bottom-0 left-0 w-full pb-2"
  >
    <div className="flex items-center justify-center text-[15px] text-white tracking-wider font-neuehaas45 gap-4">
      <span className={activeDot === "results" ? "opacity-100" : "opacity-30"}>●</span>
      <span>Our patient results</span>
      <span className={activeDot === "reviews" ? "opacity-100" : "opacity-30"}>●</span>
      <span>Read the reviews</span>
    </div>

<div
  ref={borderRef}
  className="z-10 mt-1 mx-auto max-w-[90%] border-b border-white"
>
  
</div>
  </div>
</section>
<div className="z-1 overflow-hidden" ref={testimonialsRef}>
  <Testimonial borderRef={borderRef} />
</div>



  <motion.section
      ref={reviewsRef}
      className="relative flex flex-wrap items-center justify-center min-h-screen gap-4 p-8 overflow-hidden"
      variants={containerVariants}
      initial="initial"
      whileInView="show"
      viewport={{ amount: 0.2, once: false }} 
    >
      {testimonials.map((t, i) => (
        <motion.div
          key={i}
          drag
          dragConstraints={reviewsRef}
          dragElastic={0.05}
          whileDrag={{ scale: 1.03, transition: { duration: 0.1 } }}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
          dragMomentum={false}
          className="relative bg-[#FEFCFF]/80
                     w-[320px] min-h-[450px] flex flex-col justify-start
                     border border-white cursor-grab active:cursor-grabbing
                     will-change-transform"
          style={{ zIndex: i }}
          variants={makeCardVariants(i)}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.3, once: false }} 
          whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
        >
          <div className="relative w-full h-[240px] p-2">
            <div
              className="w-full h-full bg-cover bg-center overflow-hidden relative"
              style={{ backgroundImage: `url(${t.image})` }}
            >
              <div className="absolute inset-0 z-10 pointer-events-none tile-overlay" />
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4">
            <h3 className="text-[16px] leading-tight tracking-wider uppercase font-neuehaas45">
              {t.name}
            </h3>
            <p className="font-neuehaas45 text-[12px] leading-snug tracking-wider">
              {t.text}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.section>
      {/* <Contents /> */}
      {/* <section
        ref={patientSectionRef}
        className="relative w-full min-h-screen px-6 overflow-hidden "
        onMouseMove={handleMouseMove}
      >
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

          <div className="flex-1 mx-2 border-b"></div>
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

        <ul className="font-ibmplex uppercase text-[12px]">
          {patients.map((member, index) => (
            <li
              key={index}
              ref={(el) => (textRefs.current[index] = el)}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              className="border-b border-[#D3D3D3] py-6 relative"
            >
              <div className="flex items-center w-full">
                <span className="w-1/2 text-left">{member.duration}</span>
                <span className="w-1/2 text-left">{member.name}</span>
              </div>
            </li>
          ))}
        </ul>

        <AnimatePresence mode="wait">
          {displayIndex !== null && (
            <motion.div
              className="fixed pointer-events-none z-50 w-[200px] h-[250px] rounded-2xl"
              style={{
                top: lerpedPos.y,
                left: lerpedPos.x + 24,
                transform: "translate(0, -50%)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {displayIndex > 0 && (
                <motion.img
                  src={patients[displayIndex - 1]?.image}
                  alt="previous"
                  className="absolute inset-0 object-cover w-full h-full rounded-2xl"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}

              <motion.img
                key={`img-${displayIndex}`}
                src={patients[displayIndex].image}
                alt="current"
                className="absolute inset-0 object-cover w-full h-full rounded-2xl"
                initial={{ clipPath: "inset(0% 100% 0% 0%)" }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                exit={{ clipPath: "inset(0% 100% 0% 0%)" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section> */}

      {/* <div style={{ display: "flex", height: "100vh", overflowY: "auto" }}>

          <div id="right-column" className="relative w-1/2">
            <section className="relative" style={{ marginBottom: "0vh" }}>
              <div className="relative w-full h-full">
                <div ref={gradient1Ref} className="gradient-container">
                  <div className="gradient-col">
                    <div className="h-full gradient-1"></div>
                  </div>
                  <div className="gradient-col">
                    <div className="h-full gradient-2"></div>
                  </div>
                  <div className="gradient-col">
                    <div className="h-full gradient-1"></div>
                  </div>
                  <div className="gradient-col">
                    <div className="h-full gradient-2"></div>
                  </div>
                </div>
                <div>
                  <img
                    ref={image1Ref}
                    src="../images/patient25k.png"
                    alt="patient"
                    className="absolute top-[45%] right-[15%] w-[250px] h-auto "
                  />
                </div>
              </div>
            </section>

            <div class="gradient-container-2">
              <div class="gradient-col-2"></div>
              <div class="gradient-col-2"></div>
              <div class="gradient-col-2"></div>
              <div class="gradient-col-2"></div>
            </div>
          </div>
        </div> */}
    </>
  );
};

export default Testimonials;

class MousePointer {
  constructor() {
    this.x = window.innerWidth * 0.5;
    this.y = window.innerHeight * 0.5;
    this.normal = { x: 0, y: 0 };
    this.isDown = false;

    this._setupListeners();
  }

  _setupListeners() {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const target = document.querySelector(".l-canvas") || window;

    if (isTouch) {
      target.addEventListener("touchstart", (e) => this._handleStart(e));
      target.addEventListener("touchend", () => this._handleEnd());
      target.addEventListener("touchmove", (e) => this._handleMove(e), {
        passive: false,
      });
    } else {
      window.addEventListener("mousedown", (e) => this._handleStart(e));
      window.addEventListener("mouseup", () => this._handleEnd());
      window.addEventListener("mousemove", (e) => this._handleMove(e));
    }
  }

  _handleStart(e) {
    this.isDown = true;
    this._updatePosition(e);
  }

  _handleEnd() {
    this.isDown = false;
  }

  _handleMove(e) {
    this._updatePosition(e);
  }

  _updatePosition(e) {
    const pos = this._getEventPosition(e);
    this.x = pos.x;
    this.y = pos.y;

    this.normal.x = this.x / window.innerWidth;
    this.normal.y = this.y / window.innerHeight;
  }

  _getEventPosition(e) {
    if (e.touches) {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
    return {
      x: e.clientX,
      y: e.clientY,
    };
  }
}

const mousePointer = new MousePointer();

const map = (num, toMin, toMax, fromMin, fromMax) => {
  if (num <= fromMin) return toMin;
  if (num >= fromMax) return toMax;
  const p = (toMax - toMin) / (fromMax - fromMin);
  return (num - fromMin) * p + toMin;
};

const useWindowSize = () => {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
};

const Contents = () => {
  const line = 10;
  const [blocks, setBlocks] = useState([]);
  const photoRef = useRef(null);
  const blocksRef = useRef(null);
  const animationRef = useRef();
  const counterRef = useRef(0);
  const windowSize = useWindowSize();

  const useGPU = (el) => {
    gsap.set(el, {
      willChange: "transform, opacity",
    });
  };

  useEffect(() => {
    if (!photoRef.current || !blocksRef.current) return;

    const img = photoRef.current.querySelector("img");
    const block = blocksRef.current;
    const num = line * line;
    const newBlocks = [];

    for (let i = 0; i < num; i++) {
      const b = document.createElement("div");
      block.append(b);
      b.append(img.cloneNode(false));

      gsap.set(b, {
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "hidden",
      });

      const imgEl = b.querySelector("img");
      useGPU(imgEl);
      useGPU(b);

      newBlocks.push({
        con: b,
        img: imgEl,
      });
    }

    setBlocks(newBlocks);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      gsap.killTweensOf("*");
    };
  }, []);

  const update = () => {
    counterRef.current++;

    const minDimension = Math.min(windowSize.width, windowSize.height);
    gsap.set(photoRef.current, {
      width: minDimension * 0.75,
    });

    const mx = mousePointer.normal.x;
    const my = mousePointer.normal.y;

    if (counterRef.current % 2 === 0) {
      const imgSize = blocksRef.current?.offsetWidth || 0;
      const size = imgSize / line;
      const scale = 25;

      blocks.forEach((val, i) => {
        const ix = ~~(i / line);
        const iy = ~~(i % line);

        const blockX = (ix + 0.5) / line;
        const blockY = (iy + 0.5) / line;

        const dx = blockX - mx;
        const dy = blockY - my;
        const d = Math.sqrt(dx * dx + dy * dy);

        const isVisible = d < 0.3;

        gsap.set(val.con, {
          width: size + 2,
          height: size + 2,
          left: ix * size,
          top: iy * size,
          opacity: isVisible ? 1 : 0,
        });

        const size2 = scale * size;
        gsap.set(val.img, {
          scale: scale,
          x: blockX * -size2,
          y: blockY * -size2,
        });
      });
    }

    animationRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(update);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [blocks, windowSize]);

  return (
    <div className="js-photo" ref={photoRef}>
      <img src="/images/1.jpg" alt="" />
      <div className="js-photo-blocks" ref={blocksRef} />
    </div>
  );
};
