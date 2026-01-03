"use client";
import { ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import Flip from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { XIcon } from "lucide-react";
import { background, height, opacity, translate, sublinkVariants } from "./desktop-anim";
import { links } from "./desktop-links";
import styles from "./style.module.css";
import CartComponent from "@/components/cart/cart-component";
import UserButton from "@/components/auth/user-button";
import { useCartStore } from "@/lib/cart-store";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, Flip, SplitText);

export default function DesktopNav({ user }) {

  const pathname = usePathname();
  const [isActive, setIsActive] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { cart } = useCartStore();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    const delayAnimation = setTimeout(() => {
      ScrollTrigger.getAll()
        .filter(
          (trigger) => trigger.trigger === document.querySelector(".scroll-nav")
        )
        .forEach((trigger) => trigger.kill());

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".scroll-nav",
          start: "top top",
          end: "bottom 64px",
          scrub: true,
        },
      });

      timeline.to(".scroll-nav", { width: "80%", padding: "0px" });
    }, 250); // delay for next to finish rendering

    return () => {
      clearTimeout(delayAnimation);
      ScrollTrigger.getAll()
        .filter(
          (trigger) => trigger.trigger === document.querySelector(".scroll-nav")
        )
        .forEach((trigger) => trigger.kill());
    };
  }, [pathname]); // rerun gsap on route change

  // reset navbar

  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isActive]);

  // Reset nav when route changes
  useEffect(() => {
    setIsActive(false);
    setSelectedLink(null);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsActive(false);
      }
    }

    if (isActive) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActive]);

  const navRef = useRef();

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const currentYearElements = document.querySelectorAll(
      "[data-current-year]"
    );
    currentYearElements.forEach((currentYearElement) => {
      currentYearElement.textContent = currentYear;
    });
  }, []);
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapperRef = useRef(null);
const bgRef = useRef(null);

// useEffect(() => {
//   const wrapper = wrapperRef.current;
//   const buttons = wrapper.querySelectorAll("[data-flip-button='button']");
//   const bg = bgRef.current;

//   const moveBg = (target) => {
//     const state = Flip.getState(bg);
//     target.appendChild(bg);
//     Flip.from(state, {
//       duration: 0.4,
//       ease: "power2.out",
//       absolute: true,
//     });
//   };

//   buttons.forEach((button, index) => {
//     button.addEventListener("mouseenter", () => moveBg(button));
//     button.addEventListener("focus", () => moveBg(button));
//     button.addEventListener("mouseleave", () => moveBg(buttons[activeIndex]));
//     button.addEventListener("blur", () => moveBg(buttons[activeIndex]));
//   });


//   if (buttons[activeIndex]) buttons[activeIndex].appendChild(bg);
// }, [activeIndex]);

  const [hovered, setHovered] = useState(false);
const menuText = "Menu";

const linksContainerRef = useRef(null);

useLayoutEffect(() => {
  if (!linksContainerRef.current) return;

  const ctx = gsap.context(() => {
    const buttons = linksContainerRef.current.querySelectorAll(".menu-link-button");

    buttons.forEach((button) => {
      const text = button.querySelector(".split-textflip");
      if (!text) return;

      const split = new SplitText(text, {
        type: "chars",
        charsClass: "char",
      });


      const topLayer = split.chars.map((char) => char.cloneNode(true));
      const bottomLayer = split.chars.map((char) => char.cloneNode(true));


      text.innerHTML = "";
      text.style.position = "relative";
      text.style.display = "inline-block";


      const bottomWrapper = document.createElement("div");
      bottomWrapper.style.position = "absolute";
      bottomWrapper.style.inset = "0";
      bottomWrapper.style.pointerEvents = "none";
      bottomLayer.forEach((char) => bottomWrapper.appendChild(char));
      text.appendChild(bottomWrapper);


      const topWrapper = document.createElement("div");
      topWrapper.style.position = "relative";
      topLayer.forEach((char) => topWrapper.appendChild(char));
      text.appendChild(topWrapper);


      gsap.set(bottomWrapper, { opacity: 0 });
      gsap.set(bottomLayer, {
        rotationX: -100,
        rotationY: 20,
        z: -15,
        opacity: 0,
        force3D: true,
      });
      gsap.set(topLayer, {
        rotationX: 0,
        rotationY: 0,
        z: 0,
        opacity: 1,
        force3D: true,
      });


      const enterTl = gsap.timeline({ paused: true });
      enterTl
        .to(topLayer, {
          rotationX: -100,
          rotationY: 20,
          z: -15,
          opacity: 0,
          duration: 0.9,
          ease: "power3.inOut",
          stagger: { each: 0.05, from: "start" },
        })
        .to(bottomWrapper, { opacity: 1, duration: 0.01 }, "-=0.75")
        .to(
          bottomLayer,
          {
            rotationX: 0,
            rotationY: 0,
            z: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.inOut",
            stagger: { each: 0.05, from: "start" },
          },
          "-=0.85"
        );


      const leaveTl = gsap.timeline({ paused: true });
      leaveTl
        .to(bottomLayer, {
          rotationX: 90,
          rotationY: -15,
          z: -10,
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
          stagger: { each: 0.04, from: "end" },
        })
        .to(
          topLayer,
          {
            rotationX: 0,
            rotationY: 0,
            z: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
            stagger: { each: 0.04, from: "end" },
          },
          "-=0.45"
        )
        .to(bottomWrapper, { opacity: 0, duration: 0.01 }, "-=0.5");

const onEnter = () => {

  leaveTl.progress(1, true).pause();


  enterTl.restart();
};

const onLeave = () => {

  if (enterTl.progress() > 0 || enterTl.isActive()) {
    enterTl.pause();
    leaveTl.restart();
  } else {

    enterTl.progress(0);
    leaveTl.progress(1);
  }
};

      button.addEventListener("mouseenter", onEnter);
      button.addEventListener("mouseleave", onLeave);


      button._enterTl = enterTl;
      button._leaveTl = leaveTl;
      button._split = split;
      button._cleanup = () => {
        button.removeEventListener("mouseenter", onEnter);
        button.removeEventListener("mouseleave", onLeave);
      };
    });
  }, linksContainerRef);


  return () => {
    ctx.revert();
  };
}, []);
  return (
    <>

      <motion.nav
        id="desktop-nav"
        className={`${styles.header} ${
          isScrolled
            ? "bg-opacity-80 text-[#000]"
            : "text-[#595959] bg-transparent"
        } fixed top-0 w-full z-50 transition-all duration-300 ease-in-out`}
      >
        <motion.div
          className="relative pt-[16px] flex items-center justify-between uppercase m-auto transition-[width] duration-1000 ease-in-out scroll-nav"
          variants={opacity}
          animate={!isActive ? "open" : "closed"}
        >

<div
  className="relative flex items-center"
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
>

<motion.div
className="
  relative w-12 h-12 rounded-full
  backdrop-blur-md
  bg-gradient-to-b from-white/30 to-white/10
  shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]
  flex items-center justify-center
  z-10
  before:absolute before:inset-[1px]
  before:rounded-full
  before:bg-gradient-to-b before:from-white/55 before:to-transparent
  before:opacity-30
  before:pointer-events-none
"
  style={{ position: "absolute", left: 0, transformOrigin: "right center" }}
  initial={{ scaleX: 0, scaleY: 0.3, opacity: 0 }}
  animate={{
    scaleX: hovered ? 1 : 0,
    scaleY: hovered ? 1 : 0.3,
    opacity: hovered ? 1 : 0
  }}
  transition={{
    scaleX: { duration: 0.3, ease: [0.65, 0, 0.35, 1] }, 
    scaleY: { duration: 0.3, ease: [0.65, 0, 0.35, 1], delay: 0.08 },
    opacity: { duration: 0.3 }
  }}
  aria-hidden="true"
>
  
<img   className="w-3 h-3 scale-x-[-1]" src="/images/dotarrow.png" />


</motion.div>
<motion.div
  className={`relative ml-12 flex items-center rounded-full h-12 overflow-hidden
    transition-all duration-300 ease-[cubic-bezier(0.16,0.3,0.3,1)]
    backdrop-blur-md
    bg-gradient-to-b from-white/30 to-white/10
    shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]
    before:absolute before:inset-[1px]
    before:rounded-full
    before:bg-gradient-to-b before:from-white/55 before:to-transparent
    before:opacity-30
    before:pointer-events-none
    ${hovered ? "w-[380px] md:w-[400px] px-6" : "w-[86px] px-6"}
  `}
>
    <motion.span
      className="absolute left-6 tracking-wider text-black text-[12px] font-neuehaas45 whitespace-nowrap flex"
      initial="show"
      animate={hovered ? "hide" : "show"}
      variants={{
        show: { transition: { staggerChildren: 0.03 } },
        hide: { transition: { staggerChildren: 0.03 } },
      }}
    >
      {(typeof menuText === "string" ? menuText : "Menu").split("").map((char, i) => (
        <motion.span
          key={i}
          className="tracking-wider inline-block"
          variants={{ show: { opacity: 1, y: 0 }, hide: { opacity: 0, y: 20 } }}
          transition={{ duration: 0.3, ease: [0.16, 0.3, 0.3, 1] }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>


    <motion.div
    ref={linksContainerRef}
      className="absolute left-6 flex items-center gap-3"
      initial="hide"
      animate={hovered ? "show" : "hide"}
      variants={{
        show: { transition: { staggerChildren: 0.05 } },
        hide: { transition: { staggerChildren: 0.03 } },
      }}
    >
{links.slice(0, 5).map((link, i) => {
  const isDirect = !link.sublinks || link.sublinks.length === 0;
  const href = isDirect && link.hrefs && link.hrefs[0];
  
        const activate = () => {
          if (isDirect && href) {
            setIsActive(false);
            window.location.href = href;
          } else {
            setSelectedLink(link.title);
            setIsActive(true);
            setActiveIndex(i);
          }
        };

        return (
<motion.button
  key={link.title}
  type="button"
  className="menu-link-button relative overflow-hidden px-2 py-2"
  variants={{ show: { opacity: 1, y: 0 }, hide: { opacity: 0, y: -10 } }}
  transition={{ duration: 0.35, ease: [0.16, 0.3, 0.3, 1] }}
  onClick={activate}
>
  <div className="relative inline-block text-[11px] tracking-wider font-neuehaas35 leading-none">
    <span className="split-textflip">{link.title}</span>
  </div>
</motion.button>
        );
      })}
    </motion.div>
  </motion.div>

  <motion.div
  className="
    relative w-10 h-10 rounded-full
    backdrop-blur-md
    bg-gradient-to-b from-white/35 to-white/10
    shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]
    flex items-center justify-center
    z-10
    before:absolute before:inset-[1px]
    before:rounded-full
    before:bg-gradient-to-b before:from-white/60 before:to-transparent
    before:opacity-30
    before:pointer-events-none
  "
    initial={{ scaleY: 1, opacity: 1 }}
    animate={{ scaleY: hovered ? 0 : 1, opacity: hovered ? 0 : 1 }}
    transition={{ duration: 0.5, ease: [0.16, 0.3, 0.3, 1] }}
    aria-hidden={hovered}
  >
{/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" className="w-5 h-5">
  <path stroke-linecap="round" stroke-linejoin="round" d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5" />
</svg> */}
<img className="w-3 h-3" src="/images/dotarrow.png" />
  </motion.div>
</div>



          <motion.div
            variants={opacity}
            animate={!isActive ? "open" : "closed"}
          >
            {/* styles.el */}
            <motion.div className="flex items-center ">

  {/* <Link href="/book-now">
    <motion.div
      className="bg-black text-[white] rounded-full px-6 py-5 font-helvetica-neue-light tracking-wider text-[11px]"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Book
    </motion.div>
  </Link> */}

          <Link href="/">
            <motion.div
              className={`${
                isActive ? "hidden" : "block"
              }    text-black flex justify-center items-center  p-3`}
            >
              <div
                style={{
                  width: "1.5em",
                  height: "1.5em",
                  borderRadius: "50%",
                  overflow: "hidden",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {/* <video
                  id="holovideo"
                  loop
                  muted
                  autoPlay
                  playsInline
                  preload="metadata"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scale(1.25)",
                    boxShadow: "0 0 50px #ebe6ff80",
                  }}
                >
                  <source
                    src="https://cdn.refokus.com/ttr/speaking-ball.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video> */}
              </div>
              <svg width="14" height="17" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="glassGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#A3A8F0" stop-opacity="0.4" />
                    <stop offset="50%" stop-color="#C6B5F7" stop-opacity="0.3" />
                    <stop offset="100%" stop-color="#A0EACF" stop-opacity="0.2" />
                  </linearGradient>
                  <filter id="glassBlur" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" />
                  </filter>
                </defs>
                <g fill="url(#glassGradient)">
                  <path d="M0 8H8V34H0V24H8V16H0V8Z" />
                  <rect x="8" width="20" height="8" />
                  <rect x="8" y="16" width="16" height="8" />
                </g>
              </svg>
            </motion.div> 
          </Link>



  {/* <Link href="/shop/products">
    <motion.div
      className="flex items-center justify-center w-10 h-16 transition-all bg-black rounded-full shadow-lg cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="rotate-90 text-white font-helvetica-neue-light text-[11px]">
        Shop
      </span>
    </motion.div>
  </Link> */}
</motion.div>

          </motion.div>
        </motion.div>

        <motion.div
          onClick={() => setIsActive(false)}
          variants={background}
          initial="initial"
          animate={isActive ? "open" : "closed"}
          className="fixed top-0 left-0 w-screen h-[90vh] z-40 bg-white backdrop-blur-2xl"
          style={{ overflow: "hidden" }}
        >
          <div className="absolute bottom-0 left-0 w-full pointer-events-none">
            <p className="text-[14vw] font-neueroman text-black tracking-tight select-none leading-[1.1]">
              <span data-current-year=""></span>
            </p>
          </div>
        </motion.div>
      </motion.nav>

      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            ref={navRef}
            variants={height}
            initial="initial"
            animate="enter"
            exit="exit"
            className={`${styles.nav} z-50 `}
          >
            <button
              onClick={() => setIsActive(false)}
              className="absolute z-50 text-6xl transition-opacity top-6 right-6 font-neuehaasdisplay15light hover:opacity-70"
            >
              ×
            </button>
            <div className="flex w-full px-12 py-24">
              {/* LEFT */}
              <div className="flex flex-col w-1/2 gap-6">
  {links.map(
    (link, i) =>
      selectedLink === link.title && (
        <div key={link.title} className="contents">
          {link.sublinks.map((sublink, j) => (
            <motion.div
              key={sublink}
              variants={sublinkVariants}
              initial="initial"
              animate="open"
              exit="closed"
              custom={j}
              whileHover="hover"
              className="relative flex flex-col py-2 overflow-hidden cursor-pointer"
            >
              <Link
                href={link.hrefs[j]}
                onClick={() => setIsActive(false)}
                className="contents"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <p className="text-xs font-canelathin italic opacity-60">
                      {j + 1}.
                    </p>
                    <h2 className="text-[18px] font-neuehaas45">
                      {sublink}
                    </h2>
                  </div>
                </div>

                <div className="relative w-full mt-2 h-[1px] bg-neutral-200 overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-black"
                    variants={{
                      initial: { width: 0 },
                      hover: { width: "100%" },
                    }}
                    transition={{
                      duration: 0.4,
                      ease: [0.65, 0, 0.35, 1],
                    }}
                  />
                </div>
              </Link>
            </motion.div>
          ))}
          {link.component && link.component(user)}
        </div>
      )
  )}
</div>
              {/* RIGHT */}
         <div className="flex flex-col justify-center w-1/2 gap-8 text-[14px] text-center font-neuehaas35">
  <div>
    <p className="mb-2 text-[14px] font-neuehaas35 opacity-70">
      Email:
    </p>
    <div className="flex flex-col gap-1 underline underline-offset-2">
      <a href="mailto:info@email.com">info@freysmiles.com</a>
    </div>
  </div>

  <div>
    <p className="mb-2 text-[14px] font-neuehaas35 opacity-70">
      Telephone:
    </p>
    <div className="flex flex-col gap-1">
      <p className="text-[14px] font-neuehaas35">(610) 437-4748</p>
    </div>
  </div>

  <div>
    <p className="mb-2 text-[14px] font-neuehaas35 opacity-70">Social</p>
    <div className="flex flex-col gap-1 underline underline-offset-2">
      <a href="#">Instagram</a>
      <a href="#">Facebook</a>
    </div>
  </div>
</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
