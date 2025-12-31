"use client";
import {
  Renderer,
  Camera,
  Transform,
  Plane,
  Texture,
  Mesh,
  Program,
} from "ogl";
import {
  Canvas,
  useFrame,
  useThree,
  useLoader,
  extend,
} from "@react-three/fiber";
import Copy from "@/utils/Copy.jsx";
import {
  Sphere,
  OrbitControls,
  Environment,
  shaderMaterial,
  useTexture
} from "@react-three/drei";
import { Media } from "/utils/Media.js";
import { EffectComposer } from "@react-three/postprocessing";
import { useControls } from "leva";
import * as THREE from "three";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useAnimation,
} from "framer-motion";
import React, { useState, useEffect, useRef, forwardRef, useLayoutEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger, MotionPathPlugin, SplitText, CustomEase } from "gsap/all";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(
  TextPlugin,
  MotionPathPlugin,
  ScrollTrigger,
  SplitText,
  MorphSVGPlugin,
  CustomEase
);




function CrossCursor() {
  const lerp = (a, b, n) => (1 - n) * a + n * b;
  const refV = useRef(null);
  const refH = useRef(null);
  const refDot = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const rendered = useRef({
    tx: { prev: 0, curr: 0, amt: 0.15 },
    ty: { prev: 0, curr: 0, amt: 0.15 },
  });

  useEffect(() => {
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);

    const render = () => {
      rendered.current.tx.curr = mouse.current.x;
      rendered.current.ty.curr = mouse.current.y;

      for (const key in rendered.current) {
        const axis = rendered.current[key];
        axis.prev = lerp(axis.prev, axis.curr, axis.amt);
      }

      const x = rendered.current.tx.prev;
      const y = rendered.current.ty.prev;

      gsap.set(refV.current, { x });
      gsap.set(refH.current, { y });
      gsap.set(refDot.current, { x, y });

      requestAnimationFrame(render);
    };

    const fadeIn = () => {
      gsap.to([refV.current, refH.current, refDot.current], {
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
      });
      requestAnimationFrame(render);
      window.removeEventListener("mousemove", fadeIn);
    };

    window.addEventListener("mousemove", fadeIn);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousemove", fadeIn);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1001]">
      <div
        ref={refH}
        className="fixed left-0 w-full h-[.5px] top-0 bg-[#d3d3d3] opacity-0 will-change-transform"
      ></div>

      <div
        ref={refV}
        className="fixed top-0 h-full w-[.5px] left-0 bg-[#d3d3d3] opacity-0 will-change-transform"
      ></div>

      <div
        ref={refDot}
        className="fixed w-[24px] h-[24px] bg-transparent opacity-0 will-change-transform"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-[24px] h-[.5px] bg-black/70"></div>
          <div className="absolute h-[24px] w-[.5px] bg-black/70"></div>
        </div>
      </div>
    </div>
  );
}


const ScrollAnimation = () => {
  const stickySectionRef = useRef(null);
  const cardRefs = useRef([]);
  const textSectionRef = useRef(null);

  const cardsData = [
    {
      title: "Complimentary Consultation",
      description: "Initial consultations are always free of charge",
    },
    {
      title: "Payment Plans are Available",
      description: "We offer payment plans through Klarna and Ortho Banc",
    },
    {
      title: "No Hidden Fees",
      description:
        "Comprehensive treatment plans include a set of retainers and supervision",
    },
    {
      title: "One Year Post-Treatment Follow-Up",
      description: "",
    },
  ];

  const addToRefs = (el, index) => {
    if (el && !cardRefs.current.includes(el)) {
      cardRefs.current[index] = el;
    }
  };

  useEffect(() => {
    const stickySection = stickySectionRef.current;
    const cards = cardRefs.current;
    const stickyHeight = window.innerHeight * 5;

    const transforms = [
      [
        [10, 50, -10, 10],
        [20, -10, -45, 20],
      ],
      [
        [0, 47.5, -10, 15],
        [-25, 15, -45, 30],
      ],
      [
        [0, 52.5, -10, 5],
        [15, -5, -40, 60],
      ],
      [
        [0, 50, 30, -80],
        [20, -10, 60, 5],
      ],
      [
        [0, 55, -15, 30],
        [25, -15, 60, 95],
      ],
    ];

    ScrollTrigger.create({
      trigger: stickySection,
      start: "top top",
      end: `+=${stickyHeight}px`,
      pin: true,
      pinSpacing: true,
      onUpdate: (self) => {
        const progress = self.progress;

        cards.forEach((card, index) => {
          if (!card) return;

          const delay = index * 0.1125;
          const cardProgress = Math.max(0, Math.min((progress - delay) * 2, 1));

          if (cardProgress > 0) {
            const cardStartX = 25;
            const cardEndX = -650;
            const yPos = transforms[index][0];
            const rotations = transforms[index][1];

            const cardX = gsap.utils.interpolate(
              cardStartX,
              cardEndX,
              cardProgress
            );

            const yProgress = cardProgress * 3;
            const yIndex = Math.min(Math.floor(yProgress), yPos.length - 2);
            const yInterpolation = yProgress - yIndex;
            const cardY = gsap.utils.interpolate(
              yPos[yIndex],
              yPos[yIndex + 1],
              yInterpolation
            );

            const cardRotation = gsap.utils.interpolate(
              rotations[yIndex],
              rotations[yIndex + 1],
              yInterpolation
            );

            gsap.set(card, {
              xPercent: cardX,
              yPercent: cardY,
              rotation: cardRotation,
              opacity: 1,
            });
          } else {
            gsap.set(card, { opacity: 0 });
          }
        });
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="relative">
      <section
        className="movingcard-sticky-section h-screen w-full relative"
        ref={stickySectionRef}
      >
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-0"
          ref={textSectionRef}
        >
          <div className="w-full max-w-5xl px-8">
            <h1 className="text-[3vw] sm:text-[4vw] lg:text-[3.5vw] font-neuehaas45 text-white leading-[1.1]">
              Orthodontic treatment is more than just straightening teeth — it’s
              about setting the foundation for long-term health, confidence,
              <br />
              and facial harmony.
            </h1>
            <div className="font-neuehaas45 mt-10 max-w-xl text-[16px] text-white leading-[1.2] mx-auto">
              While many orthodontists offer Invisalign or braces, the
              difference lies in how they approach treatment — what they’re
              aiming to achieve, and how precisely they execute it. Advances in
              modern orthodontics now allow us to do far more than align teeth.
              We can optimize jaw positioning, enhance facial balance, and
              design results that feel both natural and transformative. We
              understand that cost matters — but choosing an orthodontist is
              ultimately about trust. Who do you believe will deliver the best
              result? Who sees the full picture, not just the teeth? A slightly
              lower fee might save money in the short term, but true value comes
              from results that last a lifetime.
            </div>
          </div>
        </div>

        {cardsData.map((card, index) => (
          <div
            className="movingcard-card absolute z-10"
            key={index}
            ref={(el) => addToRefs(el, index)}
          >
            <div className="movingcard-content">
              <div className="movingcard-title">
                <h2 className="movingcard-title-text font-neuehaas45">
                  {card.title}
                </h2>
              </div>
              <div className="movingcard-description">
                <p className="movingcard-description-text font-neuehaas45">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};



const ShaderBackground = ({ className = '' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;


    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;

      #define PI 3.14159265359
      #define NUM_LIGHTS 8

      float gradientNoise(vec2 uv) {
          const vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
          return fract(magic.z * fract(dot(uv, magic.xy)));
      }

      vec3 palette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
          return a + b * cos(6.28318 * (c * t + d));
      }

      float map(float value, float inMin, float inMax, float outMin, float outMax) {
          return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
      }

      void main() {
          vec2 fragCoord = gl_FragCoord.xy;
          vec2 uv = (2.0 * fragCoord - u_resolution) / u_resolution.y;
          float time = u_time * 0.75;

          vec3 finalColor = vec3(0.0);
          float sumWeights = 0.0;

          vec3 bgColor = vec3(0.75);
          float bgWeight = 0.025;
          finalColor += bgColor * bgWeight;
          sumWeights += bgWeight;

          for (float i = 0.0; i < float(NUM_LIGHTS); i++) {
              float n = i / float(NUM_LIGHTS);
              float wave = sin(n * PI + time) * 0.5 + 0.5;

              float distance = 0.6 + wave * 0.125;
              vec2 position = vec2(
                  cos(n * PI * 2.0 + time * 0.1) * distance,
                  sin(n * PI * 2.0 + time * 0.1) * distance
              );

              float d = 0.2;

              vec2 toLight = position - uv;
              float distFragLight = length(toLight);
              distFragLight = distFragLight < d ? 1000.0 : distFragLight;

              float angle = atan(toLight.y, toLight.x);
              angle = angle / (PI * 2.0) + 0.5;
              angle += time * 0.25;

              float decayRate = map(wave, 0.0, 1.0, 6.0, 16.0);

              float distanceFactor = exp(-1.0 * decayRate * distFragLight);

              vec3 color = palette(
                  distanceFactor + angle,
                  vec3(0.5, 0.5, 0.5),
                  vec3(0.5, 0.5, 0.5),
                  vec3(1.0, 1.0, 1.0),
                  vec3(0.0, 0.10, 0.20)
              );
              vec3 lightColor = color * distFragLight * distanceFactor;

              finalColor += lightColor;
              sumWeights += distanceFactor * distFragLight;
          }

          finalColor = finalColor / sumWeights;
          finalColor = pow(finalColor, vec3(1.0 / 2.2));
          finalColor += (1.0 / 255.0) * gradientNoise(fragCoord) - (0.5 / 255.0);

          gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const createShader = (gl, type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);


    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');

const resize = () => {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  canvas.style.width = canvas.clientWidth + 'px';
  canvas.style.height = canvas.clientHeight + 'px';
  gl.viewport(0, 0, canvas.width, canvas.height);
};
    window.addEventListener('resize', resize);
    resize();

    // Animation loop
    let startTime = performance.now();
    const animate = () => {
      const currentTime = (performance.now() - startTime) / 1000;
      gl.uniform1f(timeLocation, currentTime);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} style={{ display: 'block' }} />;
};









const FinancingTreatment = () => {
  // const containerRef = useRef(null);
  // const pathRef = useRef(null);
  // const dottedEllipsesRef = useRef([]);
  // const [ellipseFinalY, setEllipseFinalY] = useState(null);
  // const [isEllipseDrawn, setIsEllipseDrawn] = useState(false);
  // const [isOrbScaledDown, setIsOrbScaledDown] = useState(false);

  // useEffect(() => {
  //   if (containerRef.current) {
  //     gsap.fromTo(
  //       containerRef.current,
  //       { opacity: 0 },
  //       { opacity: 1, duration: 2.5, ease: "power2.out" }
  //     );
  //   }
  // }, []);

  // useEffect(() => {
  //   if (!pathRef.current || !isOrbScaledDown) return;

  //   const path = pathRef.current;
  //   const pathLength = path.getTotalLength();

  //   gsap.set(path, {
  //     strokeDasharray: pathLength,
  //     strokeDashoffset: pathLength,
  //   });

  //   gsap.to(path, {
  //     strokeDashoffset: 0,
  //     duration: 2,
  //     ease: "power2.out",
  //     scrollTrigger: {
  //       trigger: path,
  //       start: "top 80%",
  //       end: "top 30%",
  //       scrub: 1,
  //     },
  //     onComplete: () => setIsEllipseDrawn(true),
  //   });
  // }, [isOrbScaledDown]);

  // useEffect(() => {
  //   if (!isEllipseDrawn) return;

  //   dottedEllipsesRef.current.forEach((el, i) => {
  //     if (el) {
  //       gsap.to(el, {
  //         opacity: 1,
  //         duration: 1,
  //         delay: i * 0.3,
  //         ease: "power2.out",
  //         scrollTrigger: {
  //           trigger: el,
  //           start: "top 70%",
  //           end: "top 20%",
  //           scrub: true,
  //         },
  //         top: ellipseFinalY ? `${ellipseFinalY + (i + 1) * 20}px` : "50%",
  //       });
  //     }
  //   });
  // }, [isEllipseDrawn]);

  // const ballRef = useRef(null);
  // const sectionRef = useRef(null);

  // useEffect(() => {
  //   gsap.fromTo(
  //     ballRef.current,
  //     { y: 0 },
  //     {
  //       y: 400,
  //       scrollTrigger: {
  //         trigger: sectionRef.current,
  //         start: "top center",
  //         end: "bottom center",
  //         scrub: true,
  //       },
  //       ease: "power1.out",
  //     }
  //   );
  // }, []);

  const sectionRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const drawPathRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      const stepContent = [
        {
          title: "Complimentary consultation",
          description: "Initial consultations are always free of charge.",
        },
        {
          title: "Payment plans are available",
          description: "We offer a variety of payment plans at no interest.",
        },
        {
          title: "No hidden fees",
          description:
            "Comprehensive treatment plans include retainers and supervision",
        },
      ];
      const section = sectionRef.current;
      const scrollContainer = scrollContainerRef.current;
      const path = drawPathRef.current;

      if (!section || !scrollContainer || !path) return;

      const scrollDistance = scrollContainer.scrollWidth - window.innerWidth;
      const pathLength = path.getTotalLength();

      gsap.set(path, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength,
      });

      const mainTrigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${scrollDistance}`,
        pin: true,
        pinSpacing: false,
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          scrollContainer.style.transform = `translateX(${
            -scrollDistance * progress
          }px)`;
          path.style.strokeDashoffset = pathLength * (1 - progress);
        },
      });
      gsap.fromTo(
        textCurveRef.current,
        { attr: { startOffset: "150%" } },
        {
          attr: { startOffset: "-50%" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${scrollDistance}`,
            scrub: true,
          },
          ease: "none",
        }
      );
      const getCriticalPoints = () => {
        const points = [];
        let prevAngle = null;
        const samples = 150;
        const angleThreshold = 0.4; // the more speciifc the angle the more logged steps
        const minProgressDistance = 0.03; // dist etween points
        let lastValidProgress = -Infinity;

        for (let i = 1; i <= samples; i++) {
          const progress = i / samples;
          const currentPoint = path.getPointAtLength(progress * pathLength);
          const prevPoint = path.getPointAtLength(
            ((i - 1) / samples) * pathLength
          );

          const angle = Math.atan2(
            currentPoint.y - prevPoint.y,
            currentPoint.x - prevPoint.x
          );

          // Only count large direction changes
          if (
            prevAngle !== null &&
            Math.abs(angle - prevAngle) > angleThreshold &&
            progress - lastValidProgress >= minProgressDistance
          ) {
            points.push({
              point: currentPoint,
              progress,
              scrollPosition: scrollDistance * progress,
            });
            lastValidProgress = progress;
          }
          prevAngle = angle;
        }

        return points;
      };

      const criticalPoints = getCriticalPoints();

      const textMarkers = criticalPoints.map(
        ({ point, scrollPosition }, index) => {
          const content = stepContent[index] || {
            title: `Phase ${index + 1}`,
            description: "",
          };

          const marker = document.createElement("div");
          marker.className = "path-marker";
          marker.innerHTML = `
      <div class="relative inline-block">

  <img
    src="../images/filleddiamond.svg"
    alt="diamond background"
    class="block w-[400px] h-[400px]"  
  />


  <div
    class="marker-content absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"
  >
    <p class="font-neuehaas45 marker-title text-[20px]">
      ${content.title}
    </p>
    <p class="font-neuehaas45 marker-desc">
      ${content.description}
    </p>
  </div>
</div>

      `;

          Object.assign(marker.style, {
            position: "absolute",
            left: `${point.x}px`,
            top: `${point.y}px`,
            transform: "translate(-50%, -50%)",
            opacity: "0",
            willChange: "opacity",
            // border: '2px solid red',
            padding: "4px",
          });

          scrollContainer.appendChild(marker);

          ScrollTrigger.create({
            trigger: section,
            start: `top top+=${scrollPosition - 200}`,
            end: `top top+=${scrollPosition + 200}`,
            scrub: 0.5,
            onEnter: () => gsap.to(marker, { opacity: 1, duration: 0.3 }),
            onLeaveBack: () => gsap.to(marker, { opacity: 0, duration: 0.3 }),
          });

          return marker;
        }
      );

      return () => {
        ScrollTrigger.getAll().forEach((t) => t.kill());
        textMarkers.forEach((marker) => {
          if (marker.parentNode) {
            marker.parentNode.removeChild(marker);
          }
        });
      };
    });
  }, []);

  const textPathRef = useRef();
  const svgRef = useRef();

  useEffect(() => {
    if (!textPathRef.current || !svgRef.current) return;

    gsap.to(textPathRef.current, {
      scrollTrigger: {
        trigger: svgRef.current,
        start: "top +=40",
        end: "bottom center",
        scrub: true,
      },
      attr: { startOffset: "100%" },
      ease: "none",
    });
  }, []);

  const textCurveRef = useRef();
  const filterRef = useRef();

  const map = (x, a, b, c, d) => ((x - a) * (d - c)) / (b - a) + c;
  const lerp = (a, b, n) => (1 - n) * a + n * b;
  const clamp = (val, min, max) => Math.max(Math.min(val, max), min);

  const starRef = useRef(null);
  useEffect(() => {
    const svg = starRef.current;
    const group = svg.querySelector(".shape-wrapper");
    const content = svg.querySelector(".scrolling-content");

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scaleFactor = Math.min(viewportWidth, viewportHeight) / 162;

    gsap.set(group, {
      scale: 0.1,
      opacity: 0,
      transformOrigin: "center center",
    });

    gsap.set(content, {
      opacity: 0,
      y: "20%",
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: svg,
        start: "center center",
        end: "+=1500",
        scrub: 1,
        markers: false,
        pin: true,
        toggleActions: "play none none reverse",
      },
    });

    tl.to(group, {
      opacity: 1,
      duration: 0.5,
    })
      .to(group, {
        rotation: 130,
        scale: scaleFactor * 1.1,
        duration: 4,
        ease: "none",
      })
      .to(
        content,
        {
          opacity: 1,
          y: "0%",
          duration: 2,
          ease: "power2.out",
        },
        "-=2"
      );

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const progressInterval = useRef(null);
  const loadingDelay = useRef(null);

  useEffect(() => {
    startLoadingAnimation();

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (loadingDelay.current) clearTimeout(loadingDelay.current);
    };
  }, []);

  const startLoadingAnimation = () => {
    loadingDelay.current = setTimeout(() => {
      progressInterval.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(progressInterval.current);
            setTimeout(reverseAnimation, 300);
          }
          return newProgress;
        });
      }, 300);
    }, 2000);
  };

  const reverseAnimation = () => {
    setIsComplete(true);
  };

  const processingRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startLoadingAnimation();
          observer.disconnect();
        }
      },
      { threshold: 1 }
    );

    if (processingRef.current) {
      observer.observe(processingRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const svgPathRef = useRef();
  const pathRef = useRef();
  const dotRef = useRef();

  useEffect(() => {
    if (!pathRef.current || !dotRef.current) return;

    gsap.set(dotRef.current, {
      motionPath: {
        path: pathRef.current,
        align: pathRef.current,
        alignOrigin: [0.5, 0.5],
        start: 0,
        end: 0,
      },
    });

    gsap.to(dotRef.current, {
      scrollTrigger: {
        trigger: svgPathRef.current,
        start: "top center",
        end: "bottom center",
        scrub: true,
      },
      motionPath: {
        path: pathRef.current,
        align: pathRef.current,
        alignOrigin: [0.5, 0.5],
        autoRotate: false,
      },
      scale: 1,
      transformOrigin: "center center",
      ease: "none",
    });

    gsap.to(dotRef.current, {
      scrollTrigger: {
        trigger: svgPathRef.current,
        start: "bottom center",
        end: "+=100%",
        scrub: true,
        pin: true,
      },
      scale: 250,
      ease: "power1.inOut",
    });
  }, []);

  const lineRef = useRef();

  useEffect(() => {
    const path = lineRef.current;
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;

    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 3,
      ease: "power2.out",
    });
  }, []);
  const textRef = useRef(null);
  const trackRef = useRef(null);
  const shapeRef = useRef(null);
  const tl = useRef(null);

  useEffect(() => {
    tl.current = gsap.timeline({ paused: true });

    tl.current
      .to(shapeRef.current, {
        duration: 1,
        scale: 30,
        rotate: 240,
        ease: "expo.in",
      })
      .to(
        textRef.current,
        {
          duration: 1,
          x: 0,
          ease: "power2.in",
        },
        0
      );

    const handleScroll = () => {
      const progress =
        window.pageYOffset / (document.body.offsetHeight - window.innerHeight);
      tl.current.progress(progress);
      document.body.style.setProperty("--scroll", progress);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      tl.current.kill();
    };
  }, []);
  useEffect(() => {
    const canvas = document.getElementById("shader-bg");
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();

    const uniforms = {
      u_time: { value: 0 },
      u_resolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      u_mouse: { value: new THREE.Vector2() },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      uniforms.u_time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const { innerWidth: w, innerHeight: h } = window;
      renderer.setSize(w, h);
      uniforms.u_resolution.value.set(w, h);
    };

    const handleMouseMove = (e) => {
      uniforms.u_mouse.value.set(e.clientX, window.innerHeight - e.clientY);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      renderer.dispose();
    };
  }, []);
  const arcRef = useRef(null);

  useEffect(() => {
    const arc = arcRef.current;

    arc.style.strokeDasharray = "100 250";
    arc.style.strokeDashoffset = "100";

    arc.getBoundingClientRect();

    arc.style.transition = "stroke-dashoffset 1.2s ease-out";
    arc.style.strokeDashoffset = "0";
  }, []);

  const text2Ref = useRef(null);
  const text3Ref = useRef(null);
  useEffect(() => {
    gsap.to(text2Ref.current, {
      duration: 1.5,
      text: "Your treatment, Your pace",
      ease: "none",
    });

    gsap.to(text3Ref.current, {
      duration: 1.2,
      text: "Got questions? Text us anytime and a team member will personally walk you through your options.",
      ease: "none",
    });
  }, []);

  const cardRef = useRef();
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    gsap.to(cardRef.current, {
      scale: 0.85,
      ease: "none",
      scrollTrigger: {
        trigger: cardRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }, []);


    const scrollAwayRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray(".work-item");

      items.forEach((item) => {
        const img = item.querySelector(".work-item-img");
        const nameH1 = item.querySelector(".work-item-name h1");


        const split = SplitText.create(nameH1, { type: "chars", mask: "chars" });
        gsap.set(split.chars, { y: "125%" });


        split.chars.forEach((char, index) => {
          ScrollTrigger.create({
            trigger: item,
            start: `top+=${index * 25 - 250} top`,
            end: `top+=${index * 25 - 100} top`,
            scrub: 1,
            animation: gsap.fromTo(
              char,
              { y: "125%" },
              { y: "0%", ease: "none" }
            ),
          });
        });


ScrollTrigger.create({
  trigger: item,
  start: "top+=120 bottom",
  end: "top top",
  scrub: 0.8,
  animation: gsap.fromTo(
    img,
    {
      clipPath: "polygon(25% 25%, 75% 40%, 100% 100%, 0% 100%)",
      rotateX: 15,
      scale: 0.9,
      transformOrigin: "center bottom",
    },
    {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      rotateX: 0,
      scale: 1,
      ease: "power2.out",
    }
  ),
});


ScrollTrigger.create({
  trigger: item,
  start: "bottom+=120 bottom", 
  end: "bottom top",
  scrub: 0.8,
  animation: gsap.fromTo(
    img,
    {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      rotateX: 0,
      scale: 1,
    },
    {
      clipPath: "polygon(0% 0%, 100% 0%, 75% 60%, 25% 75%)",
      rotateX: -12,
      scale: 0.95,
      ease: "power2.inOut",
    }
  ),
});
      });
    }, scrollAwayRef);

    return () => ctx.revert();
  }, []);


  
  return (
    <>

<Loader />
      <div className="relative bg-[#FEFCFF]">


        <CrossCursor />
                <section className="relative min-h-screen grid grid-cols-2 bg-[#f8f8f8] text-[#111]">
                  
  {/* LEFT SECTION */}
  <div className="relative flex flex-col h-screen">
    
    {/* TOP HALF */}
    <div className="flex-1 flex flex-col justify-start items-center pt-[8vh]">
      <WebGLGalleryApp />
  
      <div className="mt-8 flex flex-wrap justify-center gap-12 text-[0.75rem] uppercase tracking-wider text-[#555] max-w-[480px]">
        <p className="font-neuehaas45">
      
        </p>

      </div>
    </div>

    {/* BOTTOM HALF */}
    <div className="flex justify-center items-end pb-[8vh]">
      <button className="border border-[#ccc] px-10 py-4 flex items-center justify-center gap-3 text-[0.7rem] uppercase tracking-widest font-neuehaas45 text-gray-500 hover:bg-[#111] hover:text-white transition-all duration-300">
       Learn More
         <span className="inline-flex w-4 h-4">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-full h-full"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5"
    />
  </svg>
</span>
      </button>
    </div>
  </div>

  {/* RIGHT SECTION */}
  <div className="relative flex flex-col justify-center items-start px-[8vw]">

    <div className="absolute top-10 right-10 flex gap-3 text-[#d69a2d] text-4xl font-serif select-none">
     
    </div>

    <div className="mb-8">
      <p className="text-[0.7rem] uppercase tracking-widest font-neuehaas45 text-gray-400">
       Our Expertise
      </p>
    </div>

    <p className="max-w-[520px] text-[clamp(1rem,1.6vw,1.4rem)] font-canelathin leading-[1]">
While any orthodontist can move teeth into place, we focus on how alignment integrates with facial harmony — creating results that feel naturally your own.
    </p>
  </div>
</section>
{/* <section
  ref={scrollAwayRef}
  className="relative w-screen pt-[160px] overflow-hidden flex flex-col"
>
<div className="relative z-10 w-full px-[10vw] max-w-[900px] mb-[15vh]">
  <div className="w-fit mb-6 px-6 py-4 backdrop-blur-[10px] bg-[rgba(160,253,208,0.85)] border border-white/10">
    <div className="text-gray-500 uppercase tracking-widest font-neuehaas45 text-[11px]">
      First Impressions
    </div>
  </div>

  <p className="tracking-wide font-neuehaas45 text-[clamp(.75rem,1.1vw,1.1rem)] leading-[1.1] max-w-[700px]">
    Your first visit is where it all begins. We’ll get to know you, take
    digital photos and X-rays, and map out your smile goals together. It’s
    a simple, one-on-one visit that gives us a clear picture of your
    orthodontic needs.
  </p>
</div>

{[
  { id: 1, name: "Discuss" }, 
  { id: 2, name: "Digital Records", video: "/videos/cbctscan.mp4" }, 
  { id: 3, name: "Personalized Plan", img: "/images/flower.jpeg" }, 
].map((work) => (
 <div
  key={work.id}
  className="relative work-item h-[90svh] w-full flex items-center justify-center"
>
  <div
    className="work-item-img relative w-[75vw] h-[75vh] overflow-hidden"
    style={{
      clipPath: "polygon(25% 25%, 75% 40%, 100% 100%, 0% 100%)",
      willChange: "clip-path",
    }}
  >
    {work.id === 1 ? (

      <ShaderBackground className="w-full h-full" />
    ) : work.id === 2 ? (

      <video
        autoPlay
        loop
        muted
        playsInline 
        className="w-full h-full object-cover"
        poster={work.img || "/images/background_min.png"} 
      >
        <source src={work.video || "/videos/cbctscan.mp4"} type="video/mp4" />
   
        <img src="/images/background_min.png" alt={work.name} className="w-full h-full object-cover" />
      </video>
    ) : (
   
      <img
        src={work.img}
        alt={work.name}
        className="w-full h-full object-cover"
      />
    )}
  </div>


  <div className="work-item-name absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full z-[1]">
    <h1
      className="text-center text-white font-neuehaas35 leading-[1]"
      style={{
        fontSize: "5rem",
      }}
    >
      {work.name}
    </h1>
  </div>
</div>
  ))}
</section> */}
  <div className="bg-[#E2DD70] min-h-screen relative text-[#f6f1df] overflow-hidden flex flex-col justify-start">

  <div className="bg-[#E2DD70] relative z-10 mt-[15vh] pl-[8vw]">


    {/* Gradient */}
    <div className="mt-[-2vh] w-[60vw] h-[55vh] bg-gradient-to-br from-[#ffb98d] via-[#f9c0a0] to-[#e5cec7] flex items-end p-10">
     
    </div>
  </div>

<section className="relative h-screen flex items-center justify-center z-[10]">
  <svg
    ref={starRef}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 200"

  >
    <g className="shape-wrapper" style={{ transformOrigin: "center center" }}>

      <rect width="200" height="200" fill="#f8f8f8" />


      <mask id="cutout-mask">
        <rect width="200" height="200" fill="white" />
        <circle cx="100" cy="100" r="100" fill="black" />
      </mask>


      <rect
        width="200"
        height="200"
        fill="#F2F2F2"
        mask="url(#cutout-mask)"
      />
    </g>

  
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="middle"
      className="scrolling-content"
      style={{
        fontFamily: "sans-serif",
        fontSize: "5px",
        fill: "black",
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      <tspan x="50%" dy="-1em">
        AFFORDABLE FINANCING
      </tspan>
      <tspan x="50%" dy="1.2em">
        NO HIDDEN COSTS
      </tspan>
    </text>
  </svg>
</section>

  {/* CURVED PATH SECTION */}
  <div className="overflow-hidden" style={{ height: "400vh" }}>
    <section
      ref={sectionRef}
      className="w-screen h-screen overflow-hidden flex items-center px-10"
    >
      <div ref={scrollContainerRef}>
        <svg
          width="3370"
          height="671"
          viewBox="0 0 3370 671"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            ref={drawPathRef}
            d="M0.998047 1C0.998047 1 849.498 764.605 786.498 659.553C723.498 554.5 1725.51 370.052 1660.51 419.052C1595.5 468.052 2515.02 616.409 2491.26 660.981C2467.5 705.553 3369 419.052 3369 419.052"
            stroke="#EBFD15"
            strokeWidth="3"
          />
        </svg>
      </div>
    </section>
  </div>


  <section className="relative flex items-center justify-center">
    <div className="w-[36vw] h-[90vh] bg-[#FF8111] rounded-t-[600px] flex flex-col items-center justify-center px-8 pt-24 pb-20 z-10">
      <p className="font-neueroman text-[18px] uppercase leading-snug text-black">
        Your first visit is where it all begins. We’ll get to know you, take
        digital photos and X-rays, and map out your smile goals together. It’s
        a simple, one-on-one visit that gives us a clear picture of your
        orthodontic needs.
      </p>
    </div>

    <svg
      width="90vw"
      height="170vh"
      viewBox="-100 0 1100 1800"
      xmlns="http://www.w3.org/2000/svg"
      ref={svgRef}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
    >
      <defs>
        <path
          id="text-arc-path"
          d="M0,820 A450,450 0 0 1 900,820 L900,1440 L0,1440 Z"
          fill="none"
        />
      </defs>

      <text
        className="text-[12vw] tracking-wide font-neueroman fill-[#FEB448] font-sinistre"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        <textPath ref={textPathRef} href="#text-arc-path" startOffset="4%">
          GETTING STARTED
        </textPath>
      </text>
    </svg>
  </section>


  <section className="relative w-full h-screen font-neuehaas45">
    <svg viewBox="-960 -540 1920 1080" width="100%" height="100%">
      <path
        ref={lineRef}
        strokeLinecap="round"
        strokeLinejoin="miter"
        fillOpacity="0"
        strokeMiterlimit="4"
        stroke="rgb(248,134,63)"
        strokeOpacity="1"
        strokeWidth="1.5"
        d="M-954,-192 C-954,-192 -659,-404 -520,-431 C-379,-454 -392,-360 -588,-33 C-730,212 -926,640 -350,397 C135.86099243164062,192.0279998779297 324,-61 523,-160 C705.1939697265625,-250.63900756835938 828,-256 949,-194"
      />
    </svg>
  </section>
</div>
        {/* <ScrollAnimation /> */}

        <div className="relative z-0 h-screen w-full">
          <div ref={cardRef} className="relative">
            <div className="h-screen flex justify-center items-center">
              <div
                style={{
                  padding: "20px",
                  background: "rgba(0, 0, 0, 0.05)",
                  boxShadow: `
                    inset 1px 1.5px 2px rgba(255, 255, 255, 0.6),
                    inset 1px -0.5px 2px rgba(255, 255, 255, 0.3),
                    0 0.6px 0.6px -1.25px rgba(0, 0, 0, 0.18),
                    0 2.29px 2.29px -2.5px rgba(0, 0, 0, 0.16),
                    0 10px 10px -3.75px rgba(0, 0, 0, 0.06)
                  `,
                  backdropFilter: "blur(45px)",
                  WebkitBackdropFilter: "blur(45px)",
                  borderRadius: "30px",
                }}
                className="h-[90vh] max-w-7xl p-10"
              >
                {/* <div className="absolute w-[400px] h-[400px] bg-purple-500 opacity-20 blur-[140px] rounded-full top-1/3 left-[-140px] pointer-events-none mix-blend-screen"></div>
            <div className="absolute w-[400px] h-[400px] bg-orange-500 opacity-20 blur-[140px] rounded-full top-[40%] left-[-100px] pointer-events-none mix-blend-screen"></div>
            <div className="absolute w-[400px] h-[400px] bg-sky-300 opacity-30 blur-[140px] rounded-full top-1/4 right-[-120px] pointer-events-none"></div> */}

                <div className="grid grid-cols-3 gap-4 h-full">
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="relative backdrop-blur-xl bg-white/70  shadow-[0_0_0_1px_rgba(255,255,255,0.5)] border border-white border-[4px] rounded-[8px] p-10">
                      <div className="absolute top-4 right-4 w-4 h-5 text-white text-xs flex items-center justify-center "></div>
                      <div className="space-y-2">
                        <span className="inline-block bg-black/10 text-[10px] uppercase px-3 py-2 rounded-full text-gray-600 font-khteka tracking-wider">
                          Transparent Pricing
                        </span>
                        <div>
                          <h3 className="font-neuehaas45 text-black text-[16px] mb-2">
                            No Hidden Fees
                          </h3>
                          <ul className="list-disc pl-[1.25em] text-sm text-gray-700 font-neuehaas45 space-y-1">
                            <li>
                              All-inclusive pricing — from start to finish.
                            </li>
                            <li>
                              No up-charges for ceramic or “special” braces.
                            </li>
                            <li>No surprise fees or unexpected add-ons.</li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-neuehaas45 text-black text-[16px] mb-2">
                            Flexible Monthly Plans
                          </h3>
                          <ul className="list-disc pl-[1.25em] text-sm text-gray-700 font-neuehaas45 space-y-1">
                            <li>Payment plans typically span 12–24 months.</li>
                            <li>
                              A manageable down payment, with monthly plans
                              available
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="w-full max-w-md mx-auto mt-4">
                      <svg width="400" height="200" viewBox="0 0 200 100">
                        <path
                          d="M 20 100 A 80 80 0 0 1 180 100"
                          stroke="grey"
                          stroke-width="6"
                          fill="none"
                        />
                        <path
                          ref={arcRef}
                          d="M 20 100 A 80 80 0 0 1 180 100"
                          stroke="white"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray="100 250"
                          strokeLinecap="round"
                        />
                        <text
                          x="100"
                          y="70"
                          font-size="12"
                          text-anchor="middle"
                          fill="black"
                          className="font-neuehaas45"
                        >
                          250/month
                        </text>
                        <text
                          x="70"
                          y="60"
                          font-size="5"
                          text-anchor="end"
                          fill="black"
                          class="font-khteka uppercase"
                        >
                          Starting
                        </text>
                      </svg>

                      <div className="relative mt-4">
                        <div className="h-[1px] bg-black/20 rounded-full"></div>

                        <div className="absolute top-1/2 left-[55%] -translate-y-1/2 w-[20%] h-[6px] bg-white rounded-full"></div>

                        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-md"></div>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-md"></div>

                        <div className="absolute top-full left-[65%] mt-2 flex flex-col items-center">
                          <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-black"></div>
                          <span className="mt-1 font-khteka text-[10px] uppercase">
                            Our price
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.6)",
                      borderRadius: "16px",
                      boxShadow: "0 0 20px rgba(255, 255, 255, 0.2)",
                      backdropFilter: "blur(7.4px)",
                      WebkitBackdropFilter: "blur(7.4px)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      padding: "2rem",
                    }}
                    className="relative  p-10 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-5 bg-gray-300 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute left-0 top-0.5 shadow-md transition-all"></div>
                      </div>
                      <span className="text-xs text-gray-600 font-neuehaas45">
                        AutoPay Enabled
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[13px] text-gray-700 font-neuehaas45">
                        Flexible monthly payments — as low as 0% APR. Exact rate
                        based on your credit profile.
                      </p>
                    </div>

                    <div className="flex items-start gap-3 mb-6">
                      <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center mt-[2px]">
                        <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-neuehaas45 font-semibold text-sm text-black">
                            Financing.
                          </span>
                          <span className="bg-[#ffe5f2] text-[#7f187f] text-[10px] uppercase px-2 py-0.5 rounded-full font-khteka tracking-wider">
                            Klarna
                          </span>
                        </div>
                        <p className="text-[13px] text-gray-500 mt-0.5 font-neuehaas45">
                          Pay over 6 – 36 months.
                        </p>
                      </div>
                    </div>

                    <ul className="text-sm text-gray-700 font-neuehaas45 space-y-2 mb-4">
                      <li>Instant monthly quote</li>
                      <li>No impact on credit to explore</li>
                    </ul>

                    <div className="w-full bg-gray-200 rounded-full h-[6px] relative mb-1">
                      <div className="bg-[#ffb3d6] h-full rounded-full w-[65%]"></div>
                    </div>
                    {/* <div
                ref={processingRef}
                id="processing"
                className={`absolute inset-0 flex flex-col justify-center items-center ${
                  isComplete ? "complete" : "uncomplete"
                }`}
              >
                <div className="text-[14px] font-neuehaas45 mx-auto text-center">
                  <h1 className="text-[20px]">Processing</h1>
                  <h2 className="text-[14px]">
                    Please wait while we process your request
                  </h2>
                </div>
                <div className="relative mx-auto my-[30px]">
                  <div class="gears">
                    <div class="gear-wrapper gear-wrapper-1">
                      <svg
                        version="1.1"
                        className="gear gear-1"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        x="0px"
                        y="0px"
                        viewBox="0 0 512 512"
                        style={{ enableBackground: "new 0 0 512 512" }}
                        xmlSpace="preserve"
                      >
                        <path
                          class="st0"
                          d="M507.6,232.1c0,0-9.3-3.5-36.2-6c-32.9-3-42.8-15.4-53.7-30.7h-0.2c-1.4-3.6-2.8-7.2-4.4-10.8l0.1-0.1
		c-3.1-18.6-4.8-34.3,16.3-59.7C446.7,104,450.8,95,450.8,95c-4-10.3-13.8-20-13.8-20s-9.7-9.7-20-13.8c0,0-9.1,4.1-29.8,21.4
		c-25.4,21.1-41.1,19.4-59.7,16.3l-0.1,0.1c-3.5-1.6-7.1-3.1-10.8-4.4v-0.2c-15.3-10.9-27.7-20.9-30.7-53.7c-2.5-26.9-6-36.2-6-36.2
		C269.8,0,256,0,256,0s-13.8,0-23.9,4.4c0,0-3.5,9.3-6,36.2c-3,32.9-15.4,42.8-30.7,53.7v0.2c-3.6,1.4-7.3,2.8-10.8,4.4l-0.1-0.1
		c-18.6,3.1-34.3,4.8-59.7-16.3C104,65.3,95,61.2,95,61.2C84.7,65.3,75,75,75,75s-9.7,9.7-13.8,20c0,0,4.1,9.1,21.4,29.8
		c21.1,25.4,19.4,41.1,16.3,59.7l0.1,0.1c-1.6,3.5-3.1,7.1-4.4,10.8h-0.2c-10.9,15.4-20.9,27.7-53.7,30.7c-26.9,2.5-36.2,6-36.2,6
		C0,242.3,0,256,0,256s0,13.8,4.4,23.9c0,0,9.3,3.5,36.2,6c32.9,3,42.8,15.4,53.7,30.7h0.2c1.4,3.7,2.8,7.3,4.4,10.8l-0.1,0.1
		c3.1,18.6,4.8,34.3-16.3,59.7C65.3,408,61.2,417,61.2,417c4.1,10.3,13.8,20,13.8,20s9.7,9.7,20,13.8c0,0,9-4.1,29.8-21.4
		c25.4-21.1,41.1-19.4,59.7-16.3l0.1-0.1c3.5,1.6,7.1,3.1,10.8,4.4v0.2c15.3,10.9,27.7,20.9,30.7,53.7c2.5,26.9,6,36.2,6,36.2
		C242.3,512,256,512,256,512s13.8,0,23.9-4.4c0,0,3.5-9.3,6-36.2c3-32.9,15.4-42.8,30.7-53.7v-0.2c3.7-1.4,7.3-2.8,10.8-4.4l0.1,0.1
		c18.6-3.1,34.3-4.8,59.7,16.3c20.8,17.3,29.8,21.4,29.8,21.4c10.3-4.1,20-13.8,20-13.8s9.7-9.7,13.8-20c0,0-4.1-9.1-21.4-29.8
		c-21.1-25.4-19.4-41.1-16.3-59.7l-0.1-0.1c1.6-3.5,3.1-7.1,4.4-10.8h0.2c10.9-15.3,20.9-27.7,53.7-30.7c26.9-2.5,36.2-6,36.2-6
		C512,269.8,512,256,512,256S512,242.2,507.6,232.1z M256,375.7c-66.1,0-119.7-53.6-119.7-119.7S189.9,136.3,256,136.3
		c66.1,0,119.7,53.6,119.7,119.7S322.1,375.7,256,375.7z"
                        />
                      </svg>
                    </div>
                    <div class="gear-wrapper gear-wrapper-2">
                      <svg
                        version="1.1"
                        className="gear gear-2"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        x="0px"
                        y="0px"
                        viewBox="0 0 512 512"
                        style={{ enableBackground: "new 0 0 512 512" }}
                        xmlSpace="preserve"
                      >
                        <path
                          class="st0"
                          d="M507.6,232.1c0,0-9.3-3.5-36.2-6c-32.9-3-42.8-15.4-53.7-30.7h-0.2c-1.4-3.6-2.8-7.2-4.4-10.8l0.1-0.1
		c-3.1-18.6-4.8-34.3,16.3-59.7C446.7,104,450.8,95,450.8,95c-4-10.3-13.8-20-13.8-20s-9.7-9.7-20-13.8c0,0-9.1,4.1-29.8,21.4
		c-25.4,21.1-41.1,19.4-59.7,16.3l-0.1,0.1c-3.5-1.6-7.1-3.1-10.8-4.4v-0.2c-15.3-10.9-27.7-20.9-30.7-53.7c-2.5-26.9-6-36.2-6-36.2
		C269.8,0,256,0,256,0s-13.8,0-23.9,4.4c0,0-3.5,9.3-6,36.2c-3,32.9-15.4,42.8-30.7,53.7v0.2c-3.6,1.4-7.3,2.8-10.8,4.4l-0.1-0.1
		c-18.6,3.1-34.3,4.8-59.7-16.3C104,65.3,95,61.2,95,61.2C84.7,65.3,75,75,75,75s-9.7,9.7-13.8,20c0,0,4.1,9.1,21.4,29.8
		c21.1,25.4,19.4,41.1,16.3,59.7l0.1,0.1c-1.6,3.5-3.1,7.1-4.4,10.8h-0.2c-10.9,15.4-20.9,27.7-53.7,30.7c-26.9,2.5-36.2,6-36.2,6
		C0,242.3,0,256,0,256s0,13.8,4.4,23.9c0,0,9.3,3.5,36.2,6c32.9,3,42.8,15.4,53.7,30.7h0.2c1.4,3.7,2.8,7.3,4.4,10.8l-0.1,0.1
		c3.1,18.6,4.8,34.3-16.3,59.7C65.3,408,61.2,417,61.2,417c4.1,10.3,13.8,20,13.8,20s9.7,9.7,20,13.8c0,0,9-4.1,29.8-21.4
		c25.4-21.1,41.1-19.4,59.7-16.3l0.1-0.1c3.5,1.6,7.1,3.1,10.8,4.4v0.2c15.3,10.9,27.7,20.9,30.7,53.7c2.5,26.9,6,36.2,6,36.2
		C242.3,512,256,512,256,512s13.8,0,23.9-4.4c0,0,3.5-9.3,6-36.2c3-32.9,15.4-42.8,30.7-53.7v-0.2c3.7-1.4,7.3-2.8,10.8-4.4l0.1,0.1
		c18.6-3.1,34.3-4.8,59.7,16.3c20.8,17.3,29.8,21.4,29.8,21.4c10.3-4.1,20-13.8,20-13.8s9.7-9.7,13.8-20c0,0-4.1-9.1-21.4-29.8
		c-21.1-25.4-19.4-41.1-16.3-59.7l-0.1-0.1c1.6-3.5,3.1-7.1,4.4-10.8h0.2c10.9-15.3,20.9-27.7,53.7-30.7c26.9-2.5,36.2-6,36.2-6
		C512,269.8,512,256,512,256S512,242.2,507.6,232.1z M256,375.7c-66.1,0-119.7-53.6-119.7-119.7S189.9,136.3,256,136.3
		c66.1,0,119.7,53.6,119.7,119.7S322.1,375.7,256,375.7z"
                        />
                      </svg>
                    </div>
                    <div class="gear-wrapper gear-wrapper-3">
                      <svg
                        version="1.1"
                        className="gear gear-3"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        x="0px"
                        y="0px"
                        viewBox="0 0 512 512"
                        style={{ enableBackground: "new 0 0 512 512" }}
                        xmlSpace="preserve"
                      >
                        <path
                          class="st0"
                          d="M507.6,232.1c0,0-9.3-3.5-36.2-6c-32.9-3-42.8-15.4-53.7-30.7h-0.2c-1.4-3.6-2.8-7.2-4.4-10.8l0.1-0.1
		c-3.1-18.6-4.8-34.3,16.3-59.7C446.7,104,450.8,95,450.8,95c-4-10.3-13.8-20-13.8-20s-9.7-9.7-20-13.8c0,0-9.1,4.1-29.8,21.4
		c-25.4,21.1-41.1,19.4-59.7,16.3l-0.1,0.1c-3.5-1.6-7.1-3.1-10.8-4.4v-0.2c-15.3-10.9-27.7-20.9-30.7-53.7c-2.5-26.9-6-36.2-6-36.2
		C269.8,0,256,0,256,0s-13.8,0-23.9,4.4c0,0-3.5,9.3-6,36.2c-3,32.9-15.4,42.8-30.7,53.7v0.2c-3.6,1.4-7.3,2.8-10.8,4.4l-0.1-0.1
		c-18.6,3.1-34.3,4.8-59.7-16.3C104,65.3,95,61.2,95,61.2C84.7,65.3,75,75,75,75s-9.7,9.7-13.8,20c0,0,4.1,9.1,21.4,29.8
		c21.1,25.4,19.4,41.1,16.3,59.7l0.1,0.1c-1.6,3.5-3.1,7.1-4.4,10.8h-0.2c-10.9,15.4-20.9,27.7-53.7,30.7c-26.9,2.5-36.2,6-36.2,6
		C0,242.3,0,256,0,256s0,13.8,4.4,23.9c0,0,9.3,3.5,36.2,6c32.9,3,42.8,15.4,53.7,30.7h0.2c1.4,3.7,2.8,7.3,4.4,10.8l-0.1,0.1
		c3.1,18.6,4.8,34.3-16.3,59.7C65.3,408,61.2,417,61.2,417c4.1,10.3,13.8,20,13.8,20s9.7,9.7,20,13.8c0,0,9-4.1,29.8-21.4
		c25.4-21.1,41.1-19.4,59.7-16.3l0.1-0.1c3.5,1.6,7.1,3.1,10.8,4.4v0.2c15.3,10.9,27.7,20.9,30.7,53.7c2.5,26.9,6,36.2,6,36.2
		C242.3,512,256,512,256,512s13.8,0,23.9-4.4c0,0,3.5-9.3,6-36.2c3-32.9,15.4-42.8,30.7-53.7v-0.2c3.7-1.4,7.3-2.8,10.8-4.4l0.1,0.1
		c18.6-3.1,34.3-4.8,59.7,16.3c20.8,17.3,29.8,21.4,29.8,21.4c10.3-4.1,20-13.8,20-13.8s9.7-9.7,13.8-20c0,0-4.1-9.1-21.4-29.8
		c-21.1-25.4-19.4-41.1-16.3-59.7l-0.1-0.1c1.6-3.5,3.1-7.1,4.4-10.8h0.2c10.9-15.3,20.9-27.7,53.7-30.7c26.9-2.5,36.2-6,36.2-6
		C512,269.8,512,256,512,256S512,242.2,507.6,232.1z M256,375.7c-66.1,0-119.7-53.6-119.7-119.7S189.9,136.3,256,136.3
		c66.1,0,119.7,53.6,119.7,119.7S322.1,375.7,256,375.7z"
                        />
                      </svg>
                    </div>
                    <div class="gear-wrapper gear-wrapper-4">
                      <svg
                        version="1.1"
                        className="gear gear-4"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        x="0px"
                        y="0px"
                        viewBox="0 0 512 512"
                        enableBackground="new 0 0 512 512"
                        xmlSpace="preserve"
                      >
                        <path
                          class="st0"
                          d="M507.6,232.1c0,0-9.3-3.5-36.2-6c-32.9-3-42.8-15.4-53.7-30.7h-0.2c-1.4-3.6-2.8-7.2-4.4-10.8l0.1-0.1
		c-3.1-18.6-4.8-34.3,16.3-59.7C446.7,104,450.8,95,450.8,95c-4-10.3-13.8-20-13.8-20s-9.7-9.7-20-13.8c0,0-9.1,4.1-29.8,21.4
		c-25.4,21.1-41.1,19.4-59.7,16.3l-0.1,0.1c-3.5-1.6-7.1-3.1-10.8-4.4v-0.2c-15.3-10.9-27.7-20.9-30.7-53.7c-2.5-26.9-6-36.2-6-36.2
		C269.8,0,256,0,256,0s-13.8,0-23.9,4.4c0,0-3.5,9.3-6,36.2c-3,32.9-15.4,42.8-30.7,53.7v0.2c-3.6,1.4-7.3,2.8-10.8,4.4l-0.1-0.1
		c-18.6,3.1-34.3,4.8-59.7-16.3C104,65.3,95,61.2,95,61.2C84.7,65.3,75,75,75,75s-9.7,9.7-13.8,20c0,0,4.1,9.1,21.4,29.8
		c21.1,25.4,19.4,41.1,16.3,59.7l0.1,0.1c-1.6,3.5-3.1,7.1-4.4,10.8h-0.2c-10.9,15.4-20.9,27.7-53.7,30.7c-26.9,2.5-36.2,6-36.2,6
		C0,242.3,0,256,0,256s0,13.8,4.4,23.9c0,0,9.3,3.5,36.2,6c32.9,3,42.8,15.4,53.7,30.7h0.2c1.4,3.7,2.8,7.3,4.4,10.8l-0.1,0.1
		c3.1,18.6,4.8,34.3-16.3,59.7C65.3,408,61.2,417,61.2,417c4.1,10.3,13.8,20,13.8,20s9.7,9.7,20,13.8c0,0,9-4.1,29.8-21.4
		c25.4-21.1,41.1-19.4,59.7-16.3l0.1-0.1c3.5,1.6,7.1,3.1,10.8,4.4v0.2c15.3,10.9,27.7,20.9,30.7,53.7c2.5,26.9,6,36.2,6,36.2
		C242.3,512,256,512,256,512s13.8,0,23.9-4.4c0,0,3.5-9.3,6-36.2c3-32.9,15.4-42.8,30.7-53.7v-0.2c3.7-1.4,7.3-2.8,10.8-4.4l0.1,0.1
		c18.6-3.1,34.3-4.8,59.7,16.3c20.8,17.3,29.8,21.4,29.8,21.4c10.3-4.1,20-13.8,20-13.8s9.7-9.7,13.8-20c0,0-4.1-9.1-21.4-29.8
		c-21.1-25.4-19.4-41.1-16.3-59.7l-0.1-0.1c1.6-3.5,3.1-7.1,4.4-10.8h0.2c10.9-15.3,20.9-27.7,53.7-30.7c26.9-2.5,36.2-6,36.2-6
		C512,269.8,512,256,512,256S512,242.2,507.6,232.1z M256,375.7c-66.1,0-119.7-53.6-119.7-119.7S189.9,136.3,256,136.3
		c66.1,0,119.7,53.6,119.7,119.7S322.1,375.7,256,375.7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="loading-bar">
                    <span style={{ width: `${progress}%` }}></span>
                  </div>
                  <svg
                    className="checkmark checkmark-success"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 50 50"
                  >
                    <circle
                      className="checkmark-circle"
                      cx="25"
                      cy="25"
                      r="25"
                      fill="none"
                    />
                    <path
                      className="checkmark-check"
                      fill="none"
                      d="M14.1 27.2l7.1 7.2 16.7-16.8"
                    />
                  </svg>
                </div>
              </div> */}
                    <span className="text-[10px] text-[#7f187f] font-khteka uppercase tracking-wider">
                      Prequalifying with Klarna...
                    </span>
                    <div className="w-[300px] space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-neuehaas45 uppercase">
                          <span>Remaining balance</span>
                        </div>
                        <div className="bg-black/10 h-2 rounded-full relative overflow-hidden">
                          <div className="bg-lime-300 h-full rounded-full w-[75%]"></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1 font-neuehaas45 uppercase">
                          <span>NEXT PAYMENT DUE</span>
                        </div>
                        <div className="bg-black/10 h-2 rounded-full relative overflow-hidden">
                          <div className="bg-purple-300 h-full rounded-full w-[45%]"></div>
                        </div>
                      </div>
                    </div>

                    <button className="mt-4 w-full bg-[#ffe5f2] border border-[#ffb3d6] text-[#7f187f] py-2 rounded-md text-xs font-khteka uppercase hover:bg-[#ffd6e9] transition-all">
                      Continue with Klarna
                    </button>

                    <div className="mt-3 text-center"></div>
                  </div>
                  <div className="relative border border-white border-[4px] rounded-[8px] p-10">
                    <div className="flex justify-between mt-4 px-6">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-black/10"
                        ></div>
                      ))}
                    </div>

                    <div
                      className="text-[14px] uppercase font-khteka text-gray-700 tracking-widest mb-4"
                      ref={text2Ref}
                      id="text-2"
                    />

                    <div
                      className="text-sm text-gray-700 font-neuehaas45 mb-6 min-h-[40px]"
                      ref={text3Ref}
                      id="text-3"
                    />

                    <div className="relative w-full">
                      <img
                        src="../images/iphoneoutline.png"
                        className="w-full"
                      />
                    </div>

                    <button className="w-full bg-black text-white py-2 rounded-md text-sm font-khteka uppercase hover:bg-gray-900 transition-all">
                      Text Our Team
                    </button>
                    <div className="flex-1 flex flex-col items-center relative"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    
        <section className="relative">
          <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-center overflow-hidden px-5">
            <svg
              ref={svgPathRef}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1484 3804"
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-auto"
            >
              <defs>
                <clipPath id="svg-clip-path">
                  <rect width="1484" height="3804" x="0" y="0" />
                </clipPath>
              </defs>

              <g clipPath="url(#svg-clip-path)">
                <g
                  transform="matrix(1,0,0,1,742,1902)"
                  opacity="1"
                  style={{ display: "block" }}
                >
                  <g opacity="1" transform="matrix(1,0,0,1,0,0)">
                    <path
                      id="text-follow-path"
                      ref={pathRef}
                      strokeLinecap="butt"
                      strokeLinejoin="miter"
                      fillOpacity="0"
                      strokeMiterlimit="4"
                      stroke="rgb(0,0,19)"
                      strokeOpacity="1"
                      strokeWidth="1"
                      d="M-110,-1890 C-110,-1890 -110,-1780 -110,-1780 C-110,-1780 -630,-1780 -630,-1780 C-685.22900390625,-1780 -730,-1735.22900390625 -730,-1680 C-730,-1680 -730,-1310 -730,-1310 C-730,-1254.77099609375 -685.22900390625,-1210 -630,-1210 C-630,-1210 -10,-1210 -10,-1210 C45.229000091552734,-1210 90,-1165.22900390625 90,-1110 C90,-1110 90,-1050 90,-1050 C90,-1050 630,-1050 630,-1050 C685.22802734375,-1050 730,-1005.22900390625 730,-950 C730,-950 730,240 730,240 C730,295.22900390625 685.22802734375,340 630,340 C630,340 -270,340 -270,340 C-270,340 -270,1000 -270,1000 C-270,1000 390,1000 390,1000 C445.22900390625,1000 490,1044.77099609375 490,1100 C490,1100 490,1630 490,1630 C490,1685.22900390625 445.22900390625,1730 390,1730 C390,1730 -110,1730 -110,1730 C-110,1730 -110,1890 -110,1890"
                    />
                    <image
                      href="/images/outlineshape.png"
                      x="-100"
                      y="-1940"
                      width="800"
                      height="800"
                    />
                    <text
                      x="50"
                      y="-1720"
                      fill="black"
                      font-size="46"
                      font-family="NeueHaasRoman, sans-serif"
                    >
                      <tspan x="20" dy="1.4em">
                        Initial consultations
                      </tspan>
                      <tspan x="20" dy="4.5em">
                        Whether in person or virtual,
                      </tspan>
                      <tspan x="20" dy="1.2em">
                        your first consultation is free.
                      </tspan>
                    </text>

                    <image
                      href="/images/chatbubble.svg"
                      x="-500"
                      y="-940"
                      width="800"
                      height="800"
                    />
                    <text
                      x="-300"
                      y="-620"
                      fill="white"
                      font-size="40"
                      font-family="NeueHaasRoman, sans-serif"
                    >
                      <tspan x="-300" dy="-5.2em">
                        Full Evaluation
                      </tspan>
                      <tspan x="-400" dy="1.4em">
                        This initial visit includes an
                      </tspan>
                      <tspan x="-400" dy="1.4em">
                        in-depth orthodontic evaluation
                      </tspan>
                      <tspan x="-250" dy="5.4em">
                        digital radiographs and
                      </tspan>
                      <tspan x="-250" dy="1.2em">
                        professional imaging.
                      </tspan>
                    </text>

                    <image
                      href="/images/outlineshape2.png"
                      x="-100"
                      y="240"
                      width="800"
                      height="800"
                    />
                    <text
                      x="-100"
                      y="520"
                      fill="black"
                      font-size="30"
                      font-family="NeueHaasRoman, sans-serif"
                    >
                      <tspan x="100" dy="1.4em">
                        Plan and Prepare
                      </tspan>
                      <tspan x="-60" dy="1.4em">
                        We encourage all decision-makers to attend
                      </tspan>
                      <tspan x="-40" dy="1.2em">
                        the initial visit so we can discuss the path
                      </tspan>
                      <tspan x="-40" dy="1.2em">
                        ahead with clarity and transparency —
                      </tspan>
                      <tspan x="-40" dy="1.2em">
                        ensuring everyone is aligned on expectations,
                      </tspan>
                      <tspan x="-40" dy="1.2em">
                        preferences, and the ideal time to begin.
                      </tspan>
                    </text>
                    <image
                      href="/images/outlineshape3.png"
                      x="-400"
                      y="940"
                      width="800"
                      height="800"
                    />
                    <text
                      x="-300"
                      y="1050"
                      fill="white"
                      font-size="30"
                      font-family="NeueHaasRoman, sans-serif"
                    >
                      <tspan x="-300" dy="3.4em">
                        Treatment Roadmap
                      </tspan>
                      <tspan x="-360" dy="1.4em">
                        {" "}
                        If treatment isn’t yet needed,
                      </tspan>
                      <tspan x="-360" dy="1.2em">
                        no cost observation check-ups will be
                      </tspan>
                      <tspan x="-360" dy="1.4em">
                        coordinated every 6-12 months until
                      </tspan>
                      <tspan x="-360" dy="1.5em">
                        {" "}
                        treatment is needed. These are
                      </tspan>
                      <tspan x="-360" dy="3.6em">
                        shorter and fun visits where
                      </tspan>
                      <tspan x="-360" dy="1.2em">
                        where you'll have access to
                      </tspan>
                      <tspan x="-360" dy="1.2em">
                        to all four of our locations
                      </tspan>
                      <tspan x="-360" dy="1.3em">
                        to play video games and
                      </tspan>
                      <tspan x="-340" dy="1.3em">
                        get to know our team.
                      </tspan>
                    </text>
                  </g>
                </g>

                <g
                  ref={dotRef}
                  transform="matrix(.7,0,0,.7,132.8538055419922,692)"
                  opacity="1"
                  style={{ display: "block" }}
                >
                  <g opacity="1" transform="matrix(1,0,0,1,0,0)">
                    <path
                      fill="rgb(0,0,254)"
                      fillOpacity="1"
                      d="M0,-12 C6.622799873352051,-12 12,-6.622799873352051 12,0 C12,6.622799873352051 6.622799873352051,12 0,12 C-6.622799873352051,12 -12,6.622799873352051 -12,0 C-12,-6.622799873352051 -6.622799873352051,-12 0,-12z"
                    />
                  </g>
                </g>
              </g>
            </svg>
          </div>
        </section>
      </div>

      {/* <div ref={sectionRef} className="relative h-[200vh] bg-[#F2F2F4]">

        <div className="pointer-events-none h-screen flex items-center justify-center">
          <div className="relative h-screen bg-[#F2F2F4] flex items-center justify-center">

            <img
              src="https://cdn.prod.website-files.com/63ca1c298ff20ed7487ad63e/64f9a3f03dd6c2c1edf4901e_sculpture%20Top.svg"
              alt="Sculpture Back"
              className="z-10 w-[300px] h-auto"
            />

            <img
              src="https://cdn.prod.website-files.com/63ca1c298ff20ed7487ad63e/64f9b95746e31c40a01c2762_sculpture%20Bottom.svg"
              alt="Sculpture Front"
              className="absolute z-30 w-[300px] h-auto"
            />
          </div>

          <div
            ref={ballRef}
            className="absolute -top-10 z-20 w-24 h-24 bg-[#FDBA12] rounded-full"
          />
        </div>
      </div> */}
    </>
  );
};

const SkyShader = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size explicitly
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Vertex shader source
    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Full sky fragment shader
    const fragmentShaderSource = `
      precision mediump float;

      uniform vec3 iResolution;
      uniform float iTime;

      const float PI = 3.14159265359;
      const float MAX = 10000.0;

      float radians(float deg) {
        return deg * PI / 180.0;
      }

      vec2 ray_vs_sphere( vec3 p, vec3 dir, float r ) {
        float b = dot( p, dir );
        float c = dot( p, p ) - r * r;
        float d = b * b - c;
        if ( d < 0.0 ) {
          return vec2( MAX, -MAX );
        }
        d = sqrt( d );
        return vec2( -b - d, -b + d );
      }

      float phase_mie( float g, float c, float cc ) {
        float gg = g * g;
        float a = ( 1.0 - gg ) * ( 1.0 + cc );
        float b = 1.0 + gg - 2.0 * g * c;
        b *= sqrt( b );
        b *= 2.0 + gg;
        return ( 3.0 / 8.0 / PI ) * a / b;
      }

      float phase_ray( float cc ) {
        return ( 3.0 / 16.0 / PI ) * ( 1.0 + cc );
      }

      const float R_INNER = 1.0;
      const float R = R_INNER + 0.5;
      const int NUM_OUT_SCATTER = 4;  // Low for perf
      const int NUM_IN_SCATTER = 20;  // Low for perf

      float density( vec3 p, float ph ) {
        return exp( -max( length( p ) - R_INNER, 0.0 ) / ph );
      }

      float optic( vec3 p, vec3 q, float ph ) {
        vec3 s = ( q - p ) / float( NUM_OUT_SCATTER );
        vec3 v = p + s * 0.5;
        float sum = 0.0;
        for ( int i = 0; i < NUM_OUT_SCATTER; i++ ) {
          sum += density( v, ph );
          v += s;
        }
        sum *= length( s );
        return sum;
      }

      vec3 in_scatter( vec3 o, vec3 dir, vec2 e, vec3 l ) {
        const float ph_ray = 0.05;
        const float ph_mie = 0.02;
       
        const vec3 k_ray = vec3( 3.8, 13.5, 33.1 );
        const vec3 k_mie = vec3( 21.0 );
        const float k_mie_ex = 1.1;
       
        vec3 sum_ray = vec3( 0.0 );
        vec3 sum_mie = vec3( 0.0 );
       
        float n_ray0 = 0.0;
        float n_mie0 = 0.0;
       
        float len = ( e.y - e.x ) / float( NUM_IN_SCATTER );
        vec3 s = dir * len;
        vec3 v = o + dir * ( e.x + len * 0.5 );
       
        for ( int i = 0; i < NUM_IN_SCATTER; i++, v += s ) {
          float d_ray = density( v, ph_ray ) * len;
          float d_mie = density( v, ph_mie ) * len;
         
          n_ray0 += d_ray;
          n_mie0 += d_mie;
         
          vec2 f = ray_vs_sphere( v, l, R );
          vec3 u = v + l * f.y;
         
          float n_ray1 = optic( v, u, ph_ray );
          float n_mie1 = optic( v, u, ph_mie );
          vec3 att = exp( - ( n_ray0 + n_ray1 ) * k_ray - ( n_mie0 + n_mie1 ) * k_mie * k_mie_ex );
         
          sum_ray += d_ray * att;
          sum_mie += d_mie * att;
        }
        float c = dot( dir, -l );
        float cc = c * c;
        vec3 scatter =
            sum_ray * k_ray * phase_ray( cc ) +
          sum_mie * k_mie * phase_mie( -0.78, c, cc );
       
        return 100.0 * scatter;  // Bumped up for more visible blue
      }

      mat3 rot3xy( vec2 angle ) {
        vec2 c = cos( angle );
        vec2 s = sin( angle );
        return mat3(
          c.y , 0.0, -s.y,
          s.y * s.x, c.x, c.y * s.x,
          s.y * c.x, -s.x, c.y * c.x
        );
      }

      vec3 ray_dir( float fov, vec2 size, vec2 pos ) {
        vec2 xy = pos - size * 0.5;
        float cot_half_fov = tan( radians( 90.0 - fov * 0.5 ) );
        float z = size.y * 0.5 * cot_half_fov;
        return normalize( vec3( xy, -z ) );
      }

      void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
        vec3 dir = ray_dir( 45.0, iResolution.xy, fragCoord );
        vec3 eye = vec3( 0.0, 0.0, 3.0 );
        mat3 rot = rot3xy( vec2( 0.0, iTime * 0.5 ) );
        dir = rot * dir;
        eye = rot * eye;
        vec3 l = vec3( 0.0, 0.0, 1.0 );
     
        vec2 e = ray_vs_sphere( eye, dir, R );
        if ( e.x > e.y ) {
          fragColor = vec4( 0.0, 0.0, 0.1, 1.0 );  // Subtle space blue fallback
          return;
        }
        vec2 f = ray_vs_sphere( eye, dir, R_INNER );
        e.y = min( e.y, f.x );
        vec3 I = in_scatter( eye, dir, e, l );
        fragColor = vec4( pow( max(I, 0.0), vec3( 1.0 / 2.2 ) ), 1.0 );
      }

      void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `;

    // Compile function
    const compileShader = (source, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        console.error('Shader compile error:', error);
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    if (!vs) return;

    const fs = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad buffer
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const resolutionLoc = gl.getUniformLocation(program, 'iResolution');
    const timeLoc = gl.getUniformLocation(program, 'iTime');

    // Resize listener
    const handleResize = () => {
      resizeCanvas();
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    };
    window.addEventListener('resize', handleResize);

    // Render loop
    let startTime = Date.now();
    const render = (time) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      const currentTime = (Date.now() - startTime) / 1000;
      gl.uniform3f(resolutionLoc, gl.canvas.width, gl.canvas.height, 1);
      gl.uniform1f(timeLoc, currentTime);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default FinancingTreatment;


const fragment = `precision highp float;

uniform vec2 uImageSizes;
uniform vec2 uPlaneSizes;
uniform sampler2D tMap;

varying vec2 vUv;

void main() {
  vec2 ratio = vec2(
    min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
    min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
  );

  vec2 uv = vec2(
    vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );

  gl_FragColor.rgb = texture2D(tMap, uv).rgb;
  gl_FragColor.a = 1.0;
}`;

const vertex = `
#define PI 3.1415926535897932384626433832795

precision highp float;
precision highp int;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform float uStrength;
uniform vec2 uViewportSizes;

varying vec2 vUv;

void main() {
  vec4 newPosition = modelViewMatrix * vec4(position, 1.0);
  newPosition.z += sin(newPosition.y / uViewportSizes.y * PI + PI / 2.0) * -uStrength;
  vUv = uv;
  gl_Position = projectionMatrix * newPosition;
}
`;

function WebGLGalleryApp() {
  const canvasRef = useRef(null);
  const galleryRef = useRef(null);
  const mediasRef = useRef([]);
  const scrollRef = useRef({ ease: 0.05, current: 0, target: 0, last: 0 });
  const rendererRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const geometryRef = useRef();
  const viewportRef = useRef();
  const screenRef = useRef();

  useEffect(() => {
    const renderer = new Renderer({ canvas: canvasRef.current, alpha: true });
    const gl = renderer.gl;
    const camera = new Camera(gl);
    camera.position.z = 5;
    const scene = new Transform();
    const geometry = new Plane(gl, { heightSegments: 10 });

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    geometryRef.current = geometry;

const resize = () => {
  screenRef.current = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  renderer.dpr = Math.min(window.devicePixelRatio, 2);

  renderer.setSize(
    screenRef.current.width,
    screenRef.current.height
  );

  camera.perspective({
    aspect: gl.canvas.width / gl.canvas.height,
  });

  const fov = camera.fov * (Math.PI / 180);
  const height =
    2 * Math.tan(fov / 2) * camera.position.z;
  const width = height * camera.aspect;

  viewportRef.current = { width, height };

  mediasRef.current.forEach((media) =>
    media.onResize({
      screen: screenRef.current,
      viewport: viewportRef.current,
    })
  );
};

    resize();

    const figures = galleryRef.current.querySelectorAll("figure");
    const medias = Array.from(figures).map((element) =>
      createMedia({
        element,
        geometry,
        gl,
        scene,
        screen: screenRef.current,
        viewport: viewportRef.current,
        vertex,
        fragment,
      })
    );
    mediasRef.current = medias;

    scrollRef.current.current = window.scrollY;
    scrollRef.current.last = window.scrollY;

    const update = () => {
      scrollRef.current.target = window.scrollY;
      scrollRef.current.current = lerp(
        scrollRef.current.current,
        scrollRef.current.target,
        scrollRef.current.ease
      );

      const direction =
        scrollRef.current.current > scrollRef.current.last ? "down" : "up";

      mediasRef.current.forEach((media) =>
        media.update(scrollRef.current, direction)
      );

      renderer.render({ scene, camera });

      scrollRef.current.last = scrollRef.current.current;

      requestAnimationFrame(update);
    };

    update();

    window.addEventListener("resize", resize);


    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>

      <canvas ref={canvasRef} className="h-screen w-full webgl-canvas" />
      <div className="gallery1" ref={galleryRef}>
        <main>
          <section className="gallery-section">
            <div className="gallery1 flex flex-col space-y-8"> 
              {images.map((src, i) => (
                <figure key={i} className="gallery__item w-full"> 
                  <img
                    className="gallery__image w-full h-auto"
                    src={src}
                    alt={`Gallery ${i + 1}`}
                  />
                </figure>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

function createMedia({
  element,
  geometry,
  gl,
  scene,
  screen,
  viewport,
  vertex,
  fragment,
}) {
  const img = element.querySelector("img");
const texture = new Texture(gl, {
  generateMipmaps: true,
  minFilter: gl.LINEAR_MIPMAP_LINEAR,
  magFilter: gl.LINEAR,
});
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = img.src;

  const state = {
    plane: null,
    program: null,
  };

  const createMesh = () => {
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uViewportSizes: { value: [viewport.width, viewport.height] },
        uStrength: { value: 0 },
      },
      transparent: true,
    });

    const plane = new Mesh(gl, { geometry, program });
    plane.setParent(scene);

    state.plane = plane;
    state.program = program;
  };

  const updateScale = () => {
    const rect = element.getBoundingClientRect();
    state.plane.scale.x = (rect.width / screen.width) * viewport.width;
    state.plane.scale.y = (rect.height / screen.height) * viewport.height;
  };

const snap = (value, step = 1) =>
  Math.round(value / step) * step;

const updateX = () => {
  const rect = element.getBoundingClientRect();
  const x =
    ((rect.left + rect.width / 2) / screen.width) *
      viewport.width -
    viewport.width / 2;

  state.plane.position.x = snap(x, viewport.width / screen.width);
};

const updateY = () => {
  const rect = element.getBoundingClientRect();
  const y =
    viewport.height / 2 -
    ((rect.top + rect.height / 2) / screen.height) *
      viewport.height;

  state.plane.position.y = snap(y, viewport.height / screen.height);
};

  const updateBounds = () => {
    updateScale();
    updateX();
    updateY();
    state.program.uniforms.uPlaneSizes.value = [
      state.plane.scale.x,
      state.plane.scale.y,
    ];
  };

  const onResize = (sizes) => {
    if (sizes) {
      if (sizes.screen) screen = sizes.screen;
      if (sizes.viewport) {
        viewport = sizes.viewport;
        state.program.uniforms.uViewportSizes.value = [
          viewport.width,
          viewport.height,
        ];
      }
    }
    updateBounds();
  };

  const update = (scroll, direction) => {
    updateScale();
    updateX();
    updateY();

    // Calculate base strength using smoothed scroll delta
const rawStrength =
  ((scroll.current - scroll.last) / screen.width) * 30;

// Clamp to prevent blur at rest
const strength = Math.min(Math.abs(rawStrength), 1.5);

state.program.uniforms.uStrength.value =
  direction === "down" ? -strength : strength;

    state.program.uniforms.uPlaneSizes.value = [
      state.plane.scale.x,
      state.plane.scale.y,
    ];
  };

  image.onload = () => {
    texture.image = image;
    state.program.uniforms.uImageSizes.value = [
      image.naturalWidth,
      image.naturalHeight,
    ];
  };

  createMesh();
  updateBounds();

  return {
    update,
    onResize,
    get plane() {
      return state.plane;
    },
  };
}

const lerp = (a, b, t) => a + (b - a) * t;

const images = [
  "/images/fscards.png",
  "/images/futuresmiles.png",
  "/images/ajomockupchair.png",
  "/images/background_min.png",
  "/images/background_min.png",
  "/images/background_min.png",
];

CustomEase.create("customEase", "0.6, 0.01, 0.05, 1");
gsap.config({ force3D: true });

const preloaderImages = [
    "/images/Sustainablepackage.jpg",
  "/images/Free-Poster-02.jpg",
  "/images/handholdingbook.png",
  "/images/futureffscard.png",
  "/images/imagecopy.jpg",
  // "https://images.unsplash.com/photo-1658498042419-be460a938f93?q=80&w=2187&auto=format&fit=crop"
];
function Loader() {
  const preloaderRef = useRef(null);
  const textContainerRef = useRef(null);
  const cosmicRef = useRef(null);
  const reflectionsRef = useRef(null);
  const imagesContainerRef = useRef(null);
  const gridColumnsRef = useRef([]);
  const titleLinesRef = useRef([]);
  const heroProjectRef = useRef(null);
  const heroDescRef = useRef(null);
  const heroMetaRef = useRef(null);
  const heroImageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
 const images = imagesContainerRef.current.querySelectorAll(".preloader__image");

      if (!images || images.length === 0) return;

gsap.set(images, {
  clearProps: "transform",
  y: "100%",
  opacity: 0
});


gsap.set(images[0], {
  y: "0%",
  opacity: 1
});
      gsap.set([...images].slice(1), {
        y: "100%",
        opacity: 0,
        zIndex: 1
      });


      tl.fromTo(
        textContainerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );



for (let i = 1; i < images.length; i++) {
  const img = images[i];

  tl
    .to({}, { duration: i === 1 ? 0.7 : 0.4 })


    .fromTo(
      img,
      { y: "100%", opacity: 0 },
      {
        y: "0%",
        opacity: 1,
        duration: 1.4,
        ease: "power4.out",
        immediateRender: false
      }
    )

    .set(img, { clearProps: "transform" });
}

      const windowWidth = window.innerWidth;
      const moveDistance = windowWidth / 3;

      tl.to(
        cosmicRef.current,
        {
          x: -moveDistance,
          color: "#2c3e50",
          duration: 1.2,
          ease: "customEase"
        },
        "+=0.6"
      );

      tl.to(
        reflectionsRef.current,
        {
          x: moveDistance,
          color: "#2c3e50",
          duration: 1.2,
          ease: "customEase"
        },
        "-=1.2"
      );

      tl.to({}, { duration: 0.8 });

      tl.to(preloaderRef.current, {
        y: "-100%",
        duration: 1,
        ease: "power3.inOut",
        onComplete: () => {
          if (preloaderRef.current) {
            preloaderRef.current.style.display = "none";
          }
          animateGridAndHero();
        }
      });
    });

    function animateGridAndHero() {

      const validGridColumns = gridColumnsRef.current.filter(col => col !== null);
      
      gsap.to(validGridColumns, {
        height: "100%",
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.06
      });

      const heroTl = gsap.timeline();

      heroTl.to(titleLinesRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.4,
        stagger: 0.2,
        ease: "power4.out"
      });

      heroTl.to(
        [heroProjectRef.current, heroDescRef.current, heroMetaRef.current],
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          stagger: 0.2,
          ease: "power3.out"
        },
        "-=0.9"
      );

      heroTl.to(
        heroImageRef.current,
        {
          scale: 1,
          duration: 2.2,
          ease: "power3.inOut"
        },
        "-=1.4"
      );
    }

    return () => ctx.revert();
  }, []);

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #E6E7E8;
          --text: #2c3e50;
          --text-secondary: rgba(44,62,80,0.75);
          --grid: rgba(44,62,80,0.03);
          --spacing-lg: 2rem;
          --spacing-xl: 4rem;
          --grid-gap: 1rem;
          --spacing-md: 1.5rem;
          --color-text-secondary: rgba(44,62,80,0.75);
          --color-text-muted: rgba(44,62,80,0.5);
          --letter-spacing-wide: 0.1em;
          --font-weight-bold: 600;
          --z-index-main: 10;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: var(--bg); color: var(--text); font-family: 'General Sans', sans-serif; overflow-x: hidden; }

        /* Responsive Grid System */
        .grid-container {
          position: fixed;
          inset: 0;
          padding: 0 var(--spacing-md);
          display: grid;
          gap: var(--grid-gap);
          pointer-events: none;
          z-index: 2;
        }

        /* Mobile: 3 columns */
        .grid-container {
          grid-template-columns: repeat(3, 1fr);
        }

        /* On mobile, only show first 3 columns */
        .grid-container .grid-column:nth-child(n+4) {
          display: none;
        }

        @media (min-width: 768px) {
          .grid-container {
            grid-template-columns: repeat(5, 1fr);
            padding: 0 var(--spacing-lg);
          }
          
          /* On desktop, show all columns */
          .grid-container .grid-column:nth-child(n+4) {
            display: block;
          }
        }

        .grid-column {
          background: var(--grid);
          height: 0;
        }

        .preloader {
          position: fixed;
          inset: 0;
          background: var(--bg);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
        .preloader__text-container {
          position: absolute;
          display: flex;
          gap: 0.5rem;
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--bg);
          z-index: 10;
        }
        
        @media (min-width: 768px) {
          .preloader__text-container {
            font-size: 2rem;
          }
        }
        
        .preloader__content {
          width: 90%;
          max-width: 450px;
          height: 200px;
          position: relative;
          overflow: hidden;
        }
        
        @media (min-width: 768px) {
          .preloader__content {
            width: 450px;
            height: 280px;
          }
        }
        
        .preloader__image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform-origin: center;
        }
        .preloader__overlay {
          position: absolute;
          inset: 0;
          background: rgba(44,62,80,0.2);
          z-index: 2;
        }

        .header {
          padding: var(--spacing-md);
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: var(--z-index-main);
        }

        @media (min-width: 768px) {
          .header {
            padding: var(--spacing-md) var(--spacing-lg);
          }
        }

        .header__container {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1rem;
          width: 100%;
        }

        @media (min-width: 768px) {
          .header__container {
            grid-template-columns: repeat(12, 1fr);
          }
        }

        .header__logo {
          grid-column: 1 / span 2;
          font-weight: 600;
          font-size: 1.2rem;
          letter-spacing: -0.03em;
        }

        @media (min-width: 768px) {
          .header__logo {
            font-size: 1.4rem;
          }
        }

        .header__contact {
          display: none;
        }

        @media (min-width: 768px) {
          .header__contact {
            display: block;
            grid-column: 4 / span 6;
            font-size: 0.75rem;
            letter-spacing: var(--letter-spacing-wide);
            line-height: 1.5;
          }
        }

        .header__nav {
          grid-column: 5 / span 2;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          align-items: center;
        }

        @media (min-width: 768px) {
          .header__nav {
            grid-column: 10 / span 3;
            gap: var(--spacing-lg);
          }
        }

        /* 12-grid system - responsive */
        .container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 0 var(--spacing-md);
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: var(--grid-gap);
        }

        @media (min-width: 768px) {
          .container {
            grid-template-columns: repeat(12, 1fr);
            padding: 0 var(--spacing-lg);
          }
        }

        .hero {
          height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
        }

        .hero__content {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: var(--spacing-lg) 0;
        }

        @media (min-width: 768px) {
          .hero__content {
            grid-column: 1 / span 6;
            padding-right: var(--spacing-xl);
            padding: 0;
          }
        }

        .hero__project {
          font-size: 10px;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-md);
          transform: translateY(20px);
          opacity: 0;
           color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: var(--letter-spacing-wide);
        }

        .hero__title {
          font-size: clamp(2.5rem, 6vw, 9rem);
          line-height: 0.9;
          margin-bottom: var(--spacing-md);
          // letter-spacing: 0.05em;
        }

        @media (min-width: 768px) {
          .hero__title {
            margin-bottom: var(--spacing-lg);
          }
        }

        .hero__title-line {
          display: block;
          transform: translateY(100%);
          opacity: 0;
        }

        .hero__description {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--color-text-secondary);
          max-width: 100%;
          transform: translateY(20px);
          opacity: 0;
          margin-bottom: var(--spacing-lg);
        }

        @media (min-width: 768px) {
          .hero__description {
            font-size: 1.1rem;
            max-width: 460px;
            margin-bottom: var(--spacing-xl);
          }
        }

        .hero__meta {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: var(--letter-spacing-wide);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          transform: translateY(20px);
          opacity: 0;
        }

        @media (min-width: 768px) {
          .hero__meta {
            display: flex;
            justify-content: space-between;
          }
        }

        .hero__image-container {
          grid-column: 1 / -1;
          height: 50vh;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
          padding: 0;
          margin: 0;
        }

        @media (min-width: 768px) {
          .hero__image-container {
            grid-column: 7 / span 6;
            height: 100vh;
          }
        }

.hero__image {
  width: 100%;
  height: auto;
  max-height: 90vh;
  object-fit: contain;
  transform: scale(1.1);
  transform-origin: center;
  will-change: transform;
}
      `}</style>

      <div className="grid-container">
        {/* Always render 5 columns, but CSS will hide/show based on screen size */}
        {Array.from({ length: 5 }, (_, i) => (
          <div 
            key={i} 
            className="grid-column" 
            ref={el => {
              if (el && !gridColumnsRef.current[i]) {
                gridColumnsRef.current[i] = el;
              }
            }} 
          />
        ))}
      </div>

      {/* Preloader */}
      <div className="preloader" ref={preloaderRef}>
        <div className="font-neuehaas45 preloader__text-container" ref={textContainerRef}>
          <div ref={cosmicRef}>Your</div>
          <div ref={reflectionsRef}>Care</div>
        </div>
        <div className="preloader__content" ref={imagesContainerRef}>
          <div className="preloader__overlay" />
          {preloaderImages.map((src, i) => (
            <img key={i} src={src} alt="Space" className="preloader__image" />
          ))}
        </div>
      </div>

      <section className="hero">
        <div className="container">
          <div className="hero__content">
            <div className="hero__project font-neuehaas45" ref={heroProjectRef}>Our Expertise</div>
            <h1 className="hero__title">
              <span className="hero__title-line font-canelathin" ref={el => titleLinesRef.current[0] = el}>Our</span>
              <span className="hero__title-line font-canelathin" ref={el => titleLinesRef.current[1] = el}>Expertise</span>
            </h1>
            <p className="font-canelathin hero__description" ref={heroDescRef}>
              While any orthodontist can move teeth into place, we focus on how alignment integrates with facial harmony — creating results that feel naturally your own.
            </p>
            <div className="hero__meta font-neuehaas45 text-[12px]" ref={heroMetaRef}>
<div>
  <p  className="font-neuehaas45 text-[10px]">Craft</p>
  <p className="font-neuehaas45 text-[12px]">Detail-Driven Care</p>
</div>
<div>
  <p className="font-neuehaas45 text-[10px]">Perspective</p>
  <p className="font-neuehaas45 text-[12px]">Form Meets Function</p>
</div>
            </div>
          </div>
          <div className="hero__image-container">
            <img
              src="/images/aurela-redenica-VuN-RYI4XU4-unsplash_2400x3600.jpg"
              alt="Astronaut"
              className="hero__image"
              ref={heroImageRef}
            />
          </div>
        </div>
      </section>
    </>
  );
}