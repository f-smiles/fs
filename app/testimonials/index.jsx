"use client";
import { Flip } from 'gsap/Flip';
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
import Lenis from "@studio-freight/lenis";
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
  useCallback
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
import ScrollList from "./scroll-list.jsx";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
}

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

float fbm(vec2 p){
  float a = 0.0;
  float w = 0.55;
  a += w * cnoise(p*0.6);  w *= 0.55;
  a += w * cnoise(p*1.1);  w *= 0.55;
  a += w * cnoise(p*2.0);
  return a;
}


// Special pearlescent FBM for the cloud layer
float pearlCloudFbm(vec2 p, float time) {
  float a = 0.0;
  float w = 0.5;
  float freq = 1.0;
  
  // Layer 1: Large, smooth pearlescent waves
  a += w * cnoise(p * 0.8 + vec2(time * 0.02, 0.0));
  w *= 0.65;
  freq *= 1.8;
  
  // Layer 2: Medium detail
  a += w * cnoise(p * freq + vec2(time * 0.03, time * 0.01));
  w *= 0.6;
  freq *= 2.2;
  
  // Layer 3: Fine pearlescent detail
  a += w * cnoise(p * freq + vec2(time * 0.05, time * 0.02));
  
  return a * 0.5 + 0.5; // Normalize to 0-1
}


vec3 pearlColor(float intensity) {

  vec3 base = vec3(0.985, 0.99, 1.0);
  
  vec3 pinkPearl = vec3(1.0, 0.985, 0.995);
  vec3 bluePearl = vec3(0.98, 0.99, 1.0);
  
  float blend = sin(uTime * 0.1) * 0.5 + 0.5;
  vec3 iridescent = mix(pinkPearl, bluePearl, blend);
  
  return mix(base, iridescent, intensity * 0.3);
}


float pearlShimmer(vec2 uv) {
  vec2 p = uv * 3.0;
  float n1 = cnoise(p + uTime * 0.04);
  float n2 = cnoise(p * 1.7 + uTime * 0.03);
  

  float shimmer = (n1 * 0.5 + 0.5) * 0.6 + 
                  (n2 * 0.5 + 0.5) * 0.4;
  

  shimmer = pow(shimmer, 1.8);
  
  return shimmer;
}

void main() {
  float n = cnoise(vUv + uScroll + sin(uTime * 0.1));
  float t = 0.5 + 0.5 * n;
  t = pow(t, 0.25);
  t = mix(t, 1.0, 0.1);

  vec3 color = mix(uColor1, uColor2, t);

  float vign = smoothstep(0.68, 1.10, distance(vUv, vec2(0.5)));
  float cornerMask = smoothstep(0.0, 0.35, distance(vUv, vec2(0.92, 0.06)));
  vign *= cornerMask;
  color = mix(color, uColor3, vign * 0.08);

  float valley = smoothstep(0.50, 0.28, t);
  color = mix(color, uColor3, valley * 0.08);

  float pearlClouds = pearlCloudFbm(
    vUv * 0.8 + 
    vec2(uScroll * 0.15, 0.0) + 
    vec2(0.0, sin(uTime * 0.02) * 0.1),
    uTime
  );
  
  // Create two cloud layers for depth
  float cloudLayer1 = pearlCloudFbm(vUv * 0.6 + vec2(uTime * 0.01), uTime * 0.5);
  float cloudLayer2 = pearlCloudFbm(vUv * 1.2 + vec2(uTime * 0.02), uTime * 0.7);

  float combinedClouds = (cloudLayer1 * 0.6 + cloudLayer2 * 0.4);
  

  float cloudMask = smoothstep(0.4, 0.85, combinedClouds);

  float cloudShimmer = pearlShimmer(vUv * 2.0 + vec2(uTime * 0.03));
  cloudMask *= (1.0 + cloudShimmer * 0.15); // Gentle shimmer enhancement

  vec3 pearlyCloudColor = pearlColor(combinedClouds);
  
  pearlyCloudColor += vec3(0.05, 0.05, 0.06) * cloudShimmer;

  color = mix(color, pearlyCloudColor, cloudMask * 0.45);

  float cloudGlow = smoothstep(0.3, 0.7, combinedClouds);
  vec3 cloudHalo = vec3(1.0, 0.995, 0.998);
  color += cloudHalo * cloudGlow * 0.08;

  float pearlyHighlights = pearlShimmer(vUv * 1.5);
  pearlyHighlights = smoothstep(0.5, 0.9, pearlyHighlights);
  
  vec3 highlightColor = pearlColor(pearlyHighlights);
  color = mix(color, highlightColor, pearlyHighlights * 0.15 * (t + 0.3));
  
  vec2 liftCenter = vec2(0.92, 0.06);
  float r = distance(vUv, liftCenter);
  float localLift = 1.0 - smoothstep(0.30, 0.95, r);
  localLift = pow(localLift, 1.4);
  
  // Pearly lift effect
  vec3 pearlyLift = pearlColor(localLift);
  color = mix(color, pearlyLift, localLift * 0.25);
  
  // White field with pearlescent quality
  float whiteField = fbm(vUv * 0.55 + uTime * 0.01);
  whiteField = smoothstep(0.35, 0.75, 0.5 + 0.5 * whiteField);
  whiteField *= (1.0 - localLift * 0.65);
  

  color += pearlColor(whiteField) * whiteField * 0.1;
  

  vec2 glowCenter = vec2(0.08, 0.92);
  float glow = 1.0 - smoothstep(0.0, 0.8, distance(vUv, glowCenter));
  
  vec3 pearlyGlow = mix(uColor1, pearlColor(glow), 0.6);
  color += pearlyGlow * glow * 0.07;
  
  float peachMask = max(uColor1.r, uColor1.g * 0.9);
  vec3 peachBoost = color * vec3(1.05, 1.03, 1.0); // Red/Orange channels boosted ~10%
  color = mix(color, peachBoost, peachMask * 0.4);
  

  color = pow(color, vec3(0.96)); // Slight contrast
  color = clamp(color, 0.0, 1.0);
  

  float overallSheen = (sin(uTime * 0.05) * 0.5 + 0.5) * 0.03;
  color += vec3(0.01, 0.01, 0.015) * overallSheen;
  
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

const testimonials = [
  {
    name: "Lainie",
    image: "../images/testimonials/lainielandscape.png",
    type: "20 months",
    project: "Lainie",

  },
    {
    name: "James",
    image: "../images/testimonials/Jamescontrast.png",
    type: "20 months",
    project: "Sabrinas",

  },
  {
    name: "Ron L.",
    image: "../images/testimonials/Ronlandscape.png",
    type: "Invisalign",
    project: "Ron L.",

  },
  {
    name: "Elizabeth",
    image: "../images/testimonials/elizabethmask.png",
    type: "Invisalign",
    project: "Elizabeth",

  },
  {
    name: "Kinzie",
    image: "../images/testimonials/kinzielandscape.png",
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
    type: "12 months",
    project: "Leanne",

  },
  {
    name: "Harold",
    image: "../images/testimonials/harold.png",
    type: "Invisalign",
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
    type: undefined,
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
    type: "Braces",
    project: "Nilaya",

  },
  {
    name: "Maria A.",
    image: "../images/testimonials/Maria.png",
    type: undefined,
    project: "Maria A.",

  },
];

const List = () => {
  const testimonialsSectionRef = useRef(null);
  const testimonialsListRef = useRef(null);
  const testimonialPreviewRef = useRef(null);
const lastStackedIndex = useRef(null);
  const testimonialRefs = useRef([]);
  const nameRefs = useRef([]);
  const typeRefs = useRef([]);
  const nameHighlightRefs = useRef([]);
  const typeHighlightRefs = useRef([]);
const outroRef = useRef(null);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const activeTestimonial = useRef(null);
  const zCounter = useRef(1);
  const ticking = useRef(false);
  const isHovering = useRef(false);
  const lastScrollActive = useRef(null);
  const highlighterColors = ['neon', 'pink', 'green'];
  const scrollTicking = useRef(false);

  const scrambleText = (idx) => {
    const scramble = {
      characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      speed: 0.8,
      newChars: 0.3,
      revealDelay: 0,
      tweenLength: true,
    }
    
    const testimonialData = testimonials[idx];
    
    if (nameRefs.current[idx]) {
      gsap.to(nameRefs.current[idx], {
        duration: 1.5,
        ease: 'power2.out',
        scrambleText: { text: testimonialData.name, ...scramble },
      });
    }
    
    if (typeRefs.current[idx] && testimonialData.type) {
      gsap.to(typeRefs.current[idx], {
        duration: 1.5,
        ease: 'power2.out',
        scrambleText: { text: testimonialData.type, ...scramble },
      });
    }
  };

const getRandomColorClass = () => {
  const colors = highlighterColors;
  return colors[Math.floor(Math.random() * colors.length)];
};

const highlightText = (idx, activate = true) => {
  if (nameHighlightRefs.current[idx]) {
    const nameEl = nameHighlightRefs.current[idx];
    if (activate) {
      const colorClass = getRandomColorClass();
      nameEl.classList.add('active', colorClass);
      nameEl.dataset.color = colorClass;
    } else {
      nameEl.classList.remove('active', 'neon', 'pink', 'green');
      delete nameEl.dataset.color;
    }
  }

  if (typeHighlightRefs.current[idx] && testimonials[idx].type) {
    const typeEl = typeHighlightRefs.current[idx];
    if (activate) {
      const colorClass = nameHighlightRefs.current[idx]?.dataset.color || getRandomColorClass();
      typeEl.classList.add('active', colorClass);
    } else {
      typeEl.classList.remove('active', 'neon', 'pink', 'green');
    }
  }
};
const stackImage = (index, source = "scroll") => {
  const container = testimonialPreviewRef.current;
  const data = testimonials[index];
  if (!container || !data?.image) return;

  if (lastStackedIndex.current === index) return;

const mask = document.createElement("div");
mask.className = "preview-mask";

const img = document.createElement("img");
img.src = data.image;

img.style.width = "100%";
img.style.height = "100%";
img.style.objectFit = "cover";
img.style.transform = "scale(0)";
img.style.transformOrigin = "center center";
img.style.zIndex = zCounter.current++;

mask.appendChild(img);
container.appendChild(mask);

  gsap.to(img, {
    scale: 1,
    duration: 0.35,
    ease: "power2.out",
  });


  const images = container.querySelectorAll("img");
  if (images.length > 6) images[0].remove();

  lastStackedIndex.current = index;
};
const updatePreviewOnScroll = () => {
  if (!isTestimonialsVisible()) return;
  if (isHovering.current) return; // prioritize hover

  const sectionTop = testimonialsSectionRef.current.offsetTop;
  const centerY = window.scrollY + window.innerHeight / 2 - sectionTop;

  let closestIndex = null;
  let closestDistance = Infinity;

  rowCenters.current.forEach((rowCenter, index) => {
    if (!rowCenter) return;
    const distance = Math.abs(rowCenter - centerY);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  if (
    closestIndex !== null &&
    closestIndex !== lastScrollActive.current &&
    closestDistance < 120
  ) {
    // highlight swap
    if (lastScrollActive.current !== null) {
      highlightText(lastScrollActive.current, false);
    }
    highlightText(closestIndex, true);

    //  stack image on scroll index change
    stackImage(closestIndex, "scroll");

    lastScrollActive.current = closestIndex;
  }
};
  
  const mouseTicking = useRef(false);

useEffect(() => {
  const handleMouseMove = (e) => {
    lastMousePosition.current.x = e.clientX;
    lastMousePosition.current.y = e.clientY;

    if (!isHovering.current) return;

if (!mouseTicking.current) {
  requestAnimationFrame(() => {
    mouseTicking.current = false;
  });
  mouseTicking.current = true;
}
  };

  window.addEventListener("mousemove", handleMouseMove);
  return () => window.removeEventListener("mousemove", handleMouseMove);
}, []);
useEffect(() => {
  const onScroll = () => {
    if (!isTestimonialsVisible()) {
const images = testimonialPreviewRef.current?.querySelectorAll("img");
images?.forEach((img) => {
  gsap.killTweensOf(img);
  gsap.to(img, {
    scale: 0,
    opacity: 0,
    duration: 0.35,
    ease: "power2.inOut",
    onComplete: () => img.remove(),
  });
});

lastStackedIndex.current = null;
zCounter.current = 1;

      activeTestimonial.current = null;
      isHovering.current = false;
      lastScrollActive.current = null;

      testimonials.forEach((_, index) => {
        highlightText(index, false);
      });

      return;
    }

if (!scrollTicking.current) {
  requestAnimationFrame(() => {
    updatePreviewOnScroll();
    scrollTicking.current = false;
  });
  scrollTicking.current = true;
}
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, []);

useEffect(() => {
  testimonialRefs.current.forEach((testimonial, index) => {
    if (!testimonial) return;

const enter = () => {
  activeTestimonial.current = index;
  isHovering.current = true;

  lastStackedIndex.current = null;

  highlightText(index, true);
  scrambleText(index);

  //  stack immediately on enter
  stackImage(index, "hover");
};

const leave = () => {
  activeTestimonial.current = null;
  isHovering.current = false;

  highlightText(index, false);

  lastStackedIndex.current = null;
};
    testimonial.addEventListener("mouseenter", enter);
    testimonial.addEventListener("mouseleave", leave);

    return () => {
      testimonial.removeEventListener("mouseenter", enter);
      testimonial.removeEventListener("mouseleave", leave);
    };
  });
}, []);
  
  const rowCenters = useRef([]);
useEffect(() => {
  const computeCenters = () => {
    rowCenters.current = testimonialRefs.current.map((el) =>
      el ? el.offsetTop + el.offsetHeight / 2 : null
    );
  };

  computeCenters();
  window.addEventListener("resize", computeCenters);
  return () => window.removeEventListener("resize", computeCenters);
}, []);

  const isTestimonialsVisible = () => {
    if (!testimonialsSectionRef.current) return false;

    const rect = testimonialsSectionRef.current.getBoundingClientRect();

    return (
      rect.bottom > 0 &&
      rect.top < window.innerHeight
    );
  };
  const clearPreview = () => {
  const images = testimonialPreviewRef.current?.querySelectorAll("img");
  images?.forEach((img) => {
    gsap.killTweensOf(img);
    gsap.to(img, {
      scale: 0,
      opacity: 0,
      duration: 0.35,
      ease: "power2.inOut",
      onComplete: () => img.remove(),
    });
  });

  lastStackedIndex.current = null;
  zCounter.current = 1;
};
  
  useEffect(() => {
  if (!outroRef.current) return;

  const trigger = ScrollTrigger.create({
    trigger: outroRef.current,
    start: "top center",
    onEnter: clearPreview,
    onEnterBack: clearPreview,
  });

  return () => trigger.kill();
}, []);

  return (
    <div className="testimonialsPage">

      <section className="intro">
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
      </section>

      <section className="testimonials" ref={testimonialsSectionRef}>
<div className="flex flex-col items-center text-center mb-10 gap-1">
  <div className="flex items-baseline gap-2">
    <p className="text-[19px] tracking-wide font-neuehaas35">Selected Cases</p>

  </div>

  <span className="text-[14px] font-neuehaas45 opacity-60">
    A visual archive of selected treatment outcomes.
  </span>
</div>
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
        <div className="testimonials-list" ref={testimonialsListRef}>
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="testimonial"
              ref={(el) => (testimonialRefs.current[index] = el)}
            >
              <div className="testimonial-content">
                <div className="testimonial-name">
                  <span 
                    className="highlighted-text col-left"
                    ref={(el) => (nameHighlightRefs.current[index] = el)}
                  >
                    <h1 
                      ref={(el) => (nameRefs.current[index] = el)}
                    >
                      {testimonial.name}
                    </h1>
                  </span>
                  <span 
                    className="highlighted-text col-right"
                    ref={(el) => (typeHighlightRefs.current[index] = el)}
                  >
                    <h1 
                      ref={(el) => (typeRefs.current[index] = el)}
                    >
                      {testimonial.type || ""}
                    </h1>
                  </span>
               
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


<div ref={outroRef} className="testimonials-outro-spacer" />
      <div className="testimonial-preview" ref={testimonialPreviewRef} />
    </div>
  );
};


  const reviews = [
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
        }
      );
    });
  }, []);


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

const reviewsRef = useRef(null);   

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
const [activeIndex, setActiveIndex] = useState(0);
  return (
    <>
<List />


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
        className="z-10 relative w-full min-h-[30vh] px-6 md:px-12"
      >

      </section>
      <section className="w-full py-12">
          <section className="relative min-h-[80vh] bg-[#ebe7f0] overflow-hidden mx-auto max-w-[1400px] px-10">

    
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


      <div className="absolute top-24 right-10 text-xs uppercase tracking-widest text-black/70 flex flex-col items-center gap-2">
         <div className="group
                        px-12 py-6 flex items-center gap-4
                        transition-transform duration-300 hover:scale-[1.02] cursor-pointer">

          <span className="text-2xl">
            <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={1.5}
  stroke="currentColor"
  className="w-6 h-6"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="m16.49 12 3.75 3.75m0 0-3.75 3.75m3.75-3.75H3.74V4.499"
  />
</svg>
          </span>

        </div>
      </div>


      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[900px] h-[700px] rounded-[50%] blur-[40px] opacity-90
                        bg-[radial-gradient(circle_at_30%_40%,#f5c1c1,transparent_60%),radial-gradient(circle_at_70%_60%,#c1e3f5,transparent_55%),radial-gradient(circle_at_50%_50%,#f5efd9,transparent_65%)]
                        animate-[blobFloat_18s_ease-in-out_infinite]" />
      </div>


      <div className="relative z-10 flex items-center justify-center min-h-[80vh]">
    <Contents />
      </div>
<TextSwirl />

      <div className="absolute bottom-10 left-10 text-xs uppercase tracking-widest text-black/70">

      </div>

      <div className="absolute bottom-10 right-10 text-xs uppercase tracking-widest text-black/70">

      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes blobFloat {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
          100% { transform: translateY(0px) scale(1); }
        }
      `}</style>
    </section>


      </section>

  


  <motion.section
      ref={reviewsRef}
      className="relative flex flex-wrap items-center justify-center min-h-screen gap-4 p-8 overflow-hidden"
      variants={containerVariants}
      initial="initial"
      whileInView="show"
      viewport={{ amount: 0.2, once: false }} 
    >
      {reviews.map((t, i) => (
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
              <p className="font-neuehaas45 text-[12px] leading-tight tracking-wider">
                {t.text}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.section>

   
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


const Cell = React.memo(({ char, index, lineIndex, cellData }) => {
  const cellRef = useRef(null);
  
  // Store original char in ref
  const originalChar = useRef(char);
  
  useEffect(() => {
    if (cellRef.current) {
      cellRef.current.innerHTML = originalChar.current;
    }
  }, []);
  
  const setValue = (value) => {
    if (cellRef.current) {
      cellRef.current.innerHTML = value;
    }
  };
  
  // Expose setValue method to parent
  useEffect(() => {
    if (cellData && cellRef.current) {
      cellData.ref = cellRef;
      cellData.setValue = setValue;
      cellData.original = originalChar.current;
      cellData.position = index;
      cellData.previousCellPosition = index === 0 ? -1 : index - 1;
    }
  }, [cellData, index]);
  
  return (
    <span 
      ref={cellRef}
      className="typeshuffle-cell"
      data-position={index}
      data-line={lineIndex}
      style={{ display: 'inline-block' }}
    />
  );
});

/**
 * Line component
 */
const Line = React.memo(({ text, lineIndex, lineData }) => {
  const [cells, setCells] = useState([]);
  const lineRef = useRef(null);
  const cellDataRefs = useRef([]);
  
  useEffect(() => {
    // Split text into characters
    const chars = text.split('');
    setCells(chars);
    
    // Initialize cell data
    cellDataRefs.current = chars.map(() => ({
      ref: null,
      setValue: null,
      original: '',
      position: -1,
      previousCellPosition: -1,
      cache: null
    }));
  }, [text]);
  
  useEffect(() => {
    if (lineData && lineRef.current) {
      lineData.cells = cellDataRefs.current;
      lineData.position = lineIndex;
      lineData.ref = lineRef;
    }
  }, [lineData, lineIndex, cells]);
  
  return (
    <div ref={lineRef} className="typeshuffle-line" data-line={lineIndex}>
      {cells.map((char, index) => (
        <Cell
          key={`${lineIndex}-${index}`}
          char={char}
          index={index}
          lineIndex={lineIndex}
          cellData={cellDataRefs.current[index]}
        />
      ))}
    </div>
  );
});



const TextSwirl = () => {
  const containerRef = useRef(null);
  const elementsRef = useRef([]);

  const textItems = [
    "James Pica",
    "Thomas StPierre",
    "Fei Zhao",
    "Shelby Loucks",
    "Diana Gomez",
    "Tracee Benton",
    "Brandi Moyer",
    "Andrew Cornell",
    "Vicki Weaver",
    "Sara Moyer",
    "Mandee Kaur",
    "Anita Sutton",
    "Mary Ost",
    "Crystal Burke",
    "Ashley S",
    "Angie Lub",
    "Lauren Muniz",
    "Arthur Wines",
    "Ethan Ball"


  ];

  useEffect(() => {
    initAnimations();
    const handleResize = () => {
      ScrollTrigger.refresh(true);
      setTimeout(initAnimations, 100);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);
const initAnimations = () => {
  gsap.set(elementsRef.current, {
    clearProps: 'transform,opacity,margin,marginLeft,marginTop', 
  });

  elementsRef.current.forEach((el) => {
    if (!el) return;

    const originalClass = 'pos-3';
    const targetClass = el.dataset.altPos || 'pos-8';
    const flipEase = 'expo.inOut';

    el.classList.add(targetClass);
    el.classList.remove(originalClass);


    const flipState = Flip.getState(el, {
      props: 'opacity,margin,margin-left,margin-top,transform', 
      simple: true
    });

    el.classList.add(originalClass);
    el.classList.remove(targetClass);

    Flip.to(flipState, {
      ease: flipEase,
      scrollTrigger: {
        trigger: el,
        start: 'clamp(bottom bottom-=10%)',
        end: 'clamp(center center)',
        scrub: true,
      },
    });

    Flip.from(flipState, {
      ease: flipEase,
      scrollTrigger: {
        trigger: el,
        start: 'clamp(center center)',
        end: 'clamp(top top)',
        scrub: true,
      },
    });
  });
};

  return (
    <div className="apptext text-black">

      <div className="flex-col" style={{  display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily:"NeueHaasGroteskDisplayPro45Light" }}>
                <h1 className="text-[18px] mb-2">Scroll to see some of our patients</h1>
<div className="text-[16px]">Meet the smiles behind the hype</div>
      </div>


      <div className="grouptwo" ref={containerRef}>
        {textItems.map((text, index) => (
          <div
            key={index}
            className="el pos-3"
            data-alt-pos="pos-8"
            ref={el => elementsRef.current[index] = el}
          >
            {text}
          </div>
        ))}
      </div>


      <div style={{ height: '50vh' }}></div>
    </div>
  );
};


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
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const windowSize = useWindowSize();

  const useGPU = (el) => {
    gsap.set(el, { willChange: "transform, opacity" });
  };

  // Create blocks ONCE
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

      newBlocks.push({ con: b, img: imgEl });
    }

    setBlocks(newBlocks);

    return () => {
      gsap.killTweensOf("*");
      block.innerHTML = "";
    };
  }, []);

  // Mouse tracking scoped ONLY to photo
  useEffect(() => {
    const el = photoRef.current;
    if (!el) return;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      setMousePos({
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
      });
    };

    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const update = () => {
    if (!photoRef.current) return;

    const minDimension = Math.min(windowSize.width, windowSize.height);
    gsap.set(photoRef.current, { width: minDimension * 0.75 });

    const mx = mousePos.x;
    const my = mousePos.y;

    const imgSize = photoRef.current.offsetWidth || 0;
    const size = imgSize / line;
    const scale = 50;

    blocks.forEach((val, i) => {
      const ix = Math.floor(i / line);
      const iy = i % line;

      const blockX = (ix + 0.5) / line;
      const blockY = (iy + 0.5) / line;

      const dx = blockX - mx;
      const dy = blockY - my;
      const d = Math.sqrt(dx * dx + dy * dy);

      const radius = 0.3;
      const opacity = Math.max(0, 1 - d / radius);

      gsap.to(val.con, {
        width: size + 2,
        height: size + 2,
        left: ix * size,
        top: iy * size,
        opacity,
        duration: 0.12,
        ease: "power2.out",
      });

      const size2 = scale * size;
      gsap.to(val.img, {
        scale,
        x: blockX * -size2,
        y: blockY * -size2,
        duration: 0.12,
        ease: "power2.out",
      });
    });

    animationRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationRef.current);
  }, [blocks, windowSize, mousePos]);

  return (
    <div className="js-photo" ref={photoRef}>
      <img src="../images/flower.jpeg" alt="" />
      <div className="js-photo-blocks" ref={blocksRef} />
    </div>
  );
};
