"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { motion } from "motion/react";
import { MoveRightIcon } from "lucide-react";
import HomePageLogo from "../logo/home-page-logo";
import CartComponent from "../cart/cart-component";
import { useCartStore } from "@/lib/cart-store";

gsap.registerPlugin(SplitText, ScrambleTextPlugin);


export default function BookNow() {
  const navbarRef = useRef(null)
  
  const [time, setTime] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-GB", { hour12: false }));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const { cart } = useCartStore()

  useEffect(() => {
    if (!navbarRef.current) return

    gsap.set(navbarRef.current, {
      width: "46px",
      opacity: 0,
    })
    
    const tl = gsap.timeline()
    tl.to(navbarRef.current, {
      width: "auto",
      opacity: 1,
      duration: 2,
      delay: 0.8,
      ease: "power2.inOut"
    })

  }, [])

  useEffect(() => {
    const menuItems = [...document.querySelectorAll('.MenuItem')]

    menuItems.forEach((item) => {
      // console.log("ITEM", item)
      
      if (item.dataset.split) return
      item.dataset.split = "1"
      
      let word = item.children[0].children[0].innerText.split('')
      // console.log("WORD", word)

      item.children[0].innerHTML = ''

      word.forEach((letter, index) => {
        item.children[0].innerHTML += `<span style="--index: ${index};">${letter}</span>`
      })

      let cloneDiv = item.children[0].cloneNode(true)
      cloneDiv.style.position = "absolute"
      cloneDiv.style.left = 0
      cloneDiv.style.top = 0
      item.appendChild(cloneDiv)
    })
  }, [])

  return (
    <section 
      style={{
        background: `
          radial-gradient(
            circle at 70% 20%,
            rgba(255,255,255,0.7) 0%,
            rgba(255,255,255,0.4) 20%,
            rgba(240,240,240,0.6) 40%,
            rgba(220,220,220,0.8) 100%
          ),
          linear-gradient(
            180deg,
            #f5f5f5 0%,
            #e8e8e8 100%
          )
        `
      }}
      className="w-full min-h-[100dvh] overflow-x-hidden text-black grid grid-rows-[auto_1fr_auto] fixed"
    >
      <div
        className={`
          fixed top-0 left-0 right-0 z-[100]
          transform transition-all duration-500 ease-[cubic-bezier(0.34,1.2,0.64,1)]
          ${showScheduler ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <div className="relative">
          <div className="bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden">
            <div className="relative w-full h-[100vh]">

              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/40 to-transparent z-40 pointer-events-none">
                <div className="flex justify-end p-6 pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowScheduler(false)
                    }}
                    className="font-neuehaas35 text-[14px] xl:text-[16px] tracking-wide text-white hover:opacity-70 transition-opacity bg-black/20 px-5 py-2 rounded-full backdrop-blur-sm"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              
              <iframe
                src="https://freysmilesappointments.as.me/"
                title="Schedule Appointment"
                className="w-full h-full"
                frameBorder="0"
                allow="payment"
                style={{ marginTop: 0 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`
          fixed inset-0 bg-black/20 backdrop-blur-sm z-[99]
          transition-all duration-500 ease-in-out
          ${showScheduler ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setShowScheduler(false)}
      />

      {/* LOGO */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 xl:hidden z-50">
        <HomePageLogo />
      </div>

      <div className="absolute top-6 left-0 right-0 flex justify-center items-center xl:hidden z-50">
        <div
          className="
            relative
            flex flex-wrap justify-center items-center gap-4
            px-5 py-3
            rounded-full
            text-[11px] font-neuehaas35 tracking-wider uppercase
            backdrop-blur-xl
            max-w-[91vw] mx-auto
          "
          style={{
            background: `
              linear-gradient(
                180deg,
                rgba(255,255,255,0.35) 0%,
                rgba(255,255,255,0.08) 40%,
                rgba(255,255,255,0.03) 100%
              )
            `,
            backdropFilter: "blur(20px) saturate(140%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: `
                linear-gradient(
                  180deg,
                  rgba(255,255,255,0.45) 0%,
                  rgba(255,255,255,0.12) 25%,
                  rgba(255,255,255,0.04) 50%,
                  rgba(255,255,255,0.0) 70%,
                  rgba(255,255,255,0.04) 85%,
                  rgba(255,255,255,0.12) 95%,
                  rgba(255,255,255,0.45) 100%
                ),
                radial-gradient(
                  circle at 0% 50%,
                  rgba(255,255,255,0.18),
                  transparent 40%
                ),
                radial-gradient(
                  circle at 100% 50%,
                  rgba(255,255,255,0.12),
                  transparent 40%
                )
              `,
            }}
          />

          {/* MOBILE NAV LINKS */}
          <a
            href="/shop/products"
            className="MenuItem text-[11px] tracking-wider uppercase leading-none block"
          >
            <div>
              <span className="MenuItem-Text">Shop</span>
            </div>
          </a>

          <div className="w-px h-4 bg-white/20" />

          <a
            href="/early-orthodontics"
            className="MenuItem text-[11px] tracking-wider uppercase leading-none block"
          >
            <div>
              <span className="MenuItem-Text">Early Orthodontics</span>
            </div>
          </a>

          <div className="w-px h-4 bg-white/20" />

          <a
            href="/adult-orthodontics"
            className="MenuItem text-[11px] tracking-wider uppercase leading-none block"
          >
            <div>
              <span className="MenuItem-Text">Adult Orthodontics</span>
            </div>
          </a>

          <a
            href="/testimonials"
            className="MenuItem text-[11px] tracking-wider uppercase leading-none block"
          >
            <div>
              <span className="MenuItem-Text">Testimonials</span>
            </div>
          </a>

          {cart.length > 0 && <CartComponent />}
        </div>
      </div>

      <motion.div
        className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        // transition={{ duration: 0.5 }}
      >
        <div className="relative w-full h-full xl:w-auto xl:h-auto">
          <Canvas
            camera={{ position: [0, 0, 1000], fov: 75 }}
            gl={{ antialias: true, alpha: true }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0)
            }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "150vw",
              height: "150vh",
              maxWidth: "800px",
              maxHeight: "800px",
              zIndex: 0,
            }}
            className="xl:w-full xl:h-full"
          >
            <ParticleScene />
          </Canvas>
        </div>
      </motion.div>
      
      <div className="flex items-center justify-between px-12 pt-6 text-xs tracking-wide relative">
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 items-center px-4 xl:px-12 gap-8 xl:gap-0 relative">
        <div className="flex flex-col items-center xl:items-center order-2 xl:order-1">
          <div className="w-[150px] h-[80px] hidden xl:block">
            <HomePageLogo />
          </div>
          <motion.h1
            className="text-[24px] font-neuehaas35 tracking-[.02em] xl:text-[24px] text-center xl:text-left"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.0 }}
          >
            please explore our new site
          </motion.h1>
          <motion.p
            className="py-2 text-[13px] font-neuehaas35 tracking-[0.07em]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.5 }}
          >
            ...more upgrades in the works
          </motion.p>
        </div>

        <div className="flex flex-col justify-center items-center gap-4 order-1 xl:order-2 h-[300px] xl:h-auto relative">
          <div className="flex flex-col xl:flex-row justify-center xl:justify-start gap-4 xl:gap-12 font-neuehaas35 tracking-[0.07em] items-center xl:items-start">
            <p className="text-[14px] text-black leading-[1.5] font-ibmplex-extralight">
              <motion.a
                href="mailto:info@freysmiles.com"
                className="block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <ScrambleText text="info@freysmiles.com" />
              </motion.a>
            </p>
            <p className="text-[14px] text-black leading-[1.5] font-ibmplex-extralight">
              <motion.a
                href="tel:+16104374748"
                className="block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <ScrambleText text="(610)437-4748" charsType="numbers" />
              </motion.a>
            </p>
          </div>
          <motion.button
            className="BookNow-button"
            onClick={() => setShowScheduler(true)}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.8, type: "tween", damping: 10, stiffness: 100 }}
          >
            <ScrambleText className="font-ibmplex-extralight uppercase text-xs tracking-wide" text="Book Now" />
          </motion.button>
        </div>

        <div className="hidden xl:flex justify-end order-3">
          <div
            ref={navbarRef}
            className="
              relative
              flex items-center gap-6
              px-5 py-3
              rounded-full
              text-[11px] font-neuehaas35 tracking-wider uppercase
              backdrop-blur-xl
            "
            style={{
              background: `
                linear-gradient(
                  180deg,
                  rgba(255,255,255,0.35) 0%,
                  rgba(255,255,255,0.08) 40%,
                  rgba(255,255,255,0.03) 100%
                )
              `,
              backdropFilter: "blur(20px) saturate(140%)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background: `
                  linear-gradient(
                    180deg,
                    rgba(255,255,255,0.45) 0%,
                    rgba(255,255,255,0.12) 25%,
                    rgba(255,255,255,0.04) 50%,
                    rgba(255,255,255,0.0) 70%,
                    rgba(255,255,255,0.04) 85%,
                    rgba(255,255,255,0.12) 95%,
                    rgba(255,255,255,0.45) 100%
                  ),
                  radial-gradient(
                    circle at 0% 50%,
                    rgba(255,255,255,0.18),
                    transparent 40%
                  ),
                  radial-gradient(
                    circle at 100% 50%,
                    rgba(255,255,255,0.12),
                    transparent 40%
                  )
                `,
              }}
            />
            
            {/* DESKTOP NAV LINKS */}
            <motion.a
              href="/shop/products"
              className="MenuItem w-max text-[11px] tracking-wider uppercase leading-none block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.7, type: "tween", damping: 10, stiffness: 100 }}
            >
              <div>
                <span className="MenuItem-Text">Shop</span>
              </div>
            </motion.a>
            
            <motion.a
              href="/early-orthodontics"
              className="MenuItem w-max text-[11px] tracking-wider uppercase leading-none block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.7, type: "tween", damping: 10, stiffness: 100 }}
            >
              <div>
                <span className="MenuItem-Text">Early Orthodontics</span>
              </div>
            </motion.a>

            <motion.a
              href="/adult-orthodontics"
              className="MenuItem w-max text-[11px] tracking-wider uppercase leading-none block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.7, type: "tween", damping: 10, stiffness: 100 }}
            >
              <div>
                <span className="MenuItem-Text">Adult Orthodontics</span>
              </div>
            </motion.a>

            <motion.a
              href="/testimonials"
              className="MenuItem w-max text-[11px] tracking-wider uppercase leading-none block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.7, type: "tween", damping: 10, stiffness: 100 }}
            >
              <div>
                <span className="MenuItem-Text">Testimonials</span>              
              </div>
            </motion.a>

            {cart.length > 0 && 
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.7, type: "tween", damping: 10, stiffness: 100 }}
              >
                <CartComponent />
              </motion.div>
            }
          </div>
        </div>
      </div>

      <a href="/careers" className="group flex flex-col items-center justify-center z-10 pb-20 xl:pb-14">
        <motion.div
          className="flex flex-row items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.8 }}  
        >
          <span className="font-neuehaas45 tracking-wide">Join Our Team</span>
          <span className="font-canela italic tracking-wide flex items-center gap-3">
            <MoveRightIcon className="size-4 transition-all duration-150 group-hover:animate-left-right" />
            We're Hiring
          </span>
        </motion.div>
      </a>

      <div
        className="flex flex-col xl:flex-row justify-center gap-4 xl:gap-8 pb-16 text-xs font-neuehaas35 tracking-widest items-center relative"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4.0 }}
        >
          40° 36' N 75° 29' W
        </motion.div>
        <motion.div
          className="hidden xl:block"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4.1 }}  
        >•</motion.div>

        <motion.div
          className="w-[90px] text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4.2 }}
        >
          {time}
        </motion.div>
      </div>
    </section>
  );
}

const AnimatedText = ({ 
  text, 
  className = "",
  as: Component = "span",
  splitType = "chars,words",
  animationDistance = -100,
  staggerAmount = 0.4,
  ease = "power4.inOut",
  textShadow = true,
  onClick, 
}) => {
  const textRef = useRef(null);
  const splitRef = useRef(null);
  const charsRef = useRef(null);

  useEffect(() => {
    splitRef.current = new SplitText(textRef.current, {
      type: splitType,
      wordsClass: "overflow-hidden"
    });

    charsRef.current = splitRef.current.chars;

    return () => {
      if (splitRef.current) {
        splitRef.current.revert();
      }
    };
  }, [text, splitType]); 

  const handleMouseEnter = () => {
    if (!charsRef.current) return;

    gsap.to(charsRef.current, {
      yPercent: animationDistance,
      ease: ease,
      stagger: {
        amount: staggerAmount,
        from: "random"
      }
    });
  };

  const handleMouseLeave = () => {
    if (!charsRef.current) return;

    gsap.to(charsRef.current, {
      yPercent: 0,
      ease: ease,
      stagger: {
        amount: staggerAmount,
        from: "random"
      },
      overwrite: true
    });
  };

  const textShadowStyle = textShadow ? { textShadow: '0 1em' } : {};

  return (
    <Component
      ref={textRef}
      className={className}
      style={textShadowStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick} 

    >
      {text}
    </Component>
  );
};

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
      duration: 0.8,
      scrambleText: {
        text: originalText.current,
        characters: charSets[charsType],
        speed: 1,
        revealDelay: 0.1,
        delimiter: "",
        tweenLength: false,
      },
      ease: "power1.out",
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
          revealDelay: 0.5,
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
      ref={scrambleRef}
      className={`scramble-text inline-block ${className || ""}`}
      style={{ minWidth: `${text.length}ch` }}
    >
      {text}
    </span>
  );
};

const ParticleSystem = () => {

  const isMobile = useMemo(() => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
  }, []);
  
  const particlesCount = isMobile ? 20000 : 27000;
  const mouseRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const particlesRef = useRef();
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const isTouchingRef = useRef(false);

  const positions = useMemo(() => new Float32Array(particlesCount * 3), []);
  const velocities = useMemo(() => new Float32Array(particlesCount * 3), []);


  const speedMultiplier = isMobile ? 1.0 : 0.5;

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

      velocities[i * 3] = (Math.random() - 0.5) * 0.45 * speedMultiplier;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.45 * speedMultiplier;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.45 * speedMultiplier;
    }
  };

  useEffect(() => {
    createSphere(particlesCount, 400);
    if (particlesRef.current) {
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  }, [speedMultiplier]);

  const { gl } = useThree();

  useEffect(() => {
    const canvasEl = gl.domElement;
    
    const handleMove = (e) => {
      e.preventDefault();
      
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const rect = canvasEl.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      
      const dt = 1 / 60;
      const vx = (x - lastMousePosRef.current.x) / dt;
      const vy = (y - lastMousePosRef.current.y) / dt;
      
      const maxMouseVel = isMobile ? 30 : 15;
      mouseRef.current.vx = Math.min(Math.max(vx, -maxMouseVel), maxMouseVel);
      mouseRef.current.vy = Math.min(Math.max(vy, -maxMouseVel), maxMouseVel);
      mouseRef.current.x = x;
      mouseRef.current.y = y;
      lastMousePosRef.current.x = x;
      lastMousePosRef.current.y = y;
    };
    
    const handleStart = (e) => {
      e.preventDefault();
      isTouchingRef.current = true;
      
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const rect = canvasEl.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      
      mouseRef.current.x = x;
      mouseRef.current.y = y;
      lastMousePosRef.current.x = x;
      lastMousePosRef.current.y = y;
      mouseRef.current.vx = 0;
      mouseRef.current.vy = 0;
    };
    
    const handleEnd = () => {
      isTouchingRef.current = false;
      setTimeout(() => {
        if (!isTouchingRef.current) {
          const decay = isMobile ? 0.95 : 0.98;
          mouseRef.current.vx *= decay;
          mouseRef.current.vy *= decay;
        }
      }, 100);
    };
    
    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerdown", handleStart);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
    
    canvasEl.addEventListener("touchmove", handleMove, { passive: false });
    canvasEl.addEventListener("touchstart", handleStart);
    canvasEl.addEventListener("touchend", handleEnd);
    canvasEl.addEventListener("touchcancel", handleEnd);
    
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerdown", handleStart);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
      canvasEl.removeEventListener("touchmove", handleMove);
      canvasEl.removeEventListener("touchstart", handleStart);
      canvasEl.removeEventListener("touchend", handleEnd);
      canvasEl.removeEventListener("touchcancel", handleEnd);
    };
  }, [gl, isMobile]);

  useFrame(() => {
    if (!particlesRef.current) return;
    
    const pos = particlesRef.current.geometry.attributes.position.array;
    const RADIUS = 400;
    
    const MOUSE_RADIUS = isMobile ? 150 : 120;
    const MOUSE_STRENGTH = isMobile ? 0.035 : 0.018;
    const MOMENTUM_FACTOR = isMobile ? 0.15 : 0.08;
    const BOUNDARY_DAMPING = isMobile ? 0.92 : 0.94;
    const RANDOM_IMPULSE_FREQ = isMobile ? 0.008 : 0.006;
    const RANDOM_IMPULSE_STRENGTH = isMobile ? 0.12 : 0.08;
    const MAX_VEL = isMobile ? 1.2 : 0.8;
    
    if (!isTouchingRef.current) {
      mouseRef.current.vx *= 0.98;
      mouseRef.current.vy *= 0.98;
    }
    
    for (let i = 0; i < pos.length; i += 3) {

      pos[i] += velocities[i];
      pos[i + 1] += velocities[i + 1];
      pos[i + 2] += velocities[i + 2];
      
      const x = pos[i];
      const y = pos[i + 1];
      const z = pos[i + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      
      if (dist > RADIUS) {
        const nx = x / dist;
        const ny = y / dist;
        const nz = z / dist;
        
        pos[i] = nx * RADIUS;
        pos[i + 1] = ny * RADIUS;
        pos[i + 2] = nz * RADIUS;
        
        const dot = velocities[i] * nx + velocities[i + 1] * ny + velocities[i + 2] * nz;
        
        velocities[i] -= 2 * dot * nx;
        velocities[i + 1] -= 2 * dot * ny;
        velocities[i + 2] -= 2 * dot * nz;
        

        velocities[i] *= BOUNDARY_DAMPING;
        velocities[i + 1] *= BOUNDARY_DAMPING;
        velocities[i + 2] *= BOUNDARY_DAMPING;
      }
      
      const dx = mouseRef.current.x - x;
      const dy = -mouseRef.current.y - y;
      const distanceSq = dx * dx + dy * dy;
      const radiusSq = MOUSE_RADIUS * MOUSE_RADIUS;
      
      if (distanceSq > 0 && distanceSq < radiusSq) {
        const distance = Math.sqrt(distanceSq);
        const force = (1 - distance / MOUSE_RADIUS) * MOUSE_STRENGTH;
        const invDistance = 1 / distance;
        
        velocities[i] -= dx * invDistance * force;
        velocities[i + 1] -= dy * invDistance * force;
        
        const momentumForce = force * MOMENTUM_FACTOR;
        velocities[i] += mouseRef.current.vx * momentumForce * 0.5;
        velocities[i + 1] += mouseRef.current.vy * momentumForce * 0.5;
      }
      

      if (Math.random() < RANDOM_IMPULSE_FREQ) {
        velocities[i] += (Math.random() - 0.5) * RANDOM_IMPULSE_STRENGTH;
        velocities[i + 1] += (Math.random() - 0.5) * RANDOM_IMPULSE_STRENGTH;
        velocities[i + 2] += (Math.random() - 0.5) * RANDOM_IMPULSE_STRENGTH;
        
        velocities[i] = Math.min(Math.max(velocities[i], -MAX_VEL), MAX_VEL);
        velocities[i + 1] = Math.min(Math.max(velocities[i + 1], -MAX_VEL), MAX_VEL);
        velocities[i + 2] = Math.min(Math.max(velocities[i + 2], -MAX_VEL), MAX_VEL);
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
        color={0xff33cc}
        size={isMobile ? 2.6 : 2.2}
        sizeAttenuation
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
};

const ParticleScene = () => {
  return (
    <>
      <ParticleSystem />
      {/* <OrbitControls 
        enableDamping 
        dampingFactor={0.25} 
        screenSpacePanning={false} 
        maxPolarAngle={Math.PI / 2} 
      /> */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0}
          luminanceSmoothing={0.9}
          intensity={1.5}
          height={300}
        />
      </EffectComposer>
    </>
  );
};