"use client";
import {
  Clouds,
  Cloud,
  CameraControls,
  Sky as SkyImpl,
  StatsGl,
} from "@react-three/drei";
import { useControls } from "leva";
import Link from "next/link";
import "./style.css";
import { gsap } from "gsap";
import {
  CustomEase,
  SplitText,
  Flip,
  ScrollTrigger,
  ScrambleTextPlugin,
} from "gsap/all";
import Lenis from "@studio-freight/lenis";
import React, {
  useRef,
  useEffect,
  useMemo,
  useLayoutEffect,
  useState,
  useCallback,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, extend, useThree } from "@react-three/fiber";
import { Color, MathUtils } from "three";
import { VFX } from "@vfx-js/core";
import { useRouter, usePathname } from "next/navigation";

gsap.registerPlugin(
  CustomEase,
  SplitText,
  Flip,
  ScrollTrigger,
  ScrambleTextPlugin,
);

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

  const EASE_EXPO = "cubic-bezier(.87, 0, .13, 1)";
  const EASE_SMOOTH = "cubic-bezier(.76, 0, .24, 1)";

  const scrambleAnimation = () => {
    return new Promise((resolve) => {
      const el = scrambleRef.current;

      const tl = gsap.timeline({
        onComplete: resolve,
      });

      tl.set(el, {
        color: "rgba(0,0,0,0.25)",
      });

      tl.to(
        el,
        {
          duration: 1.4,
          scrambleText: {
            text: originalText.current,
            characters: charSets[charsType],
            speed: gsap.utils.random(0.4, 0.9),
            revealDelay: 0.2,
          },
          ease: EASE_EXPO,
        },
        0,
      );

      tl.to(
        el,
        {
          color: "rgba(0,0,0,1)",
          duration: 1.1,
          ease: EASE_SMOOTH,
        },
        0.2,
      );

      tl.to({}, { duration: 0.4 });

      tl.to(el, {
        color: "rgba(0,0,0,0.25)",
        duration: 1.2,
        ease: EASE_SMOOTH,
      });
    });
  };

  useEffect(() => {
    const element = scrambleRef.current;
    if (!element) return;

    let isActive = true;

    const runRandomScramble = async () => {
      while (isActive) {
        const delay = gsap.utils.random(1.2, 4.5);
        await new Promise((res) => setTimeout(res, delay * 1000));

        if (!isActive) return;

        await scrambleAnimation();
      }
    };

    gsap.set(element, {
      textContent: originalText.current,
    });

    runRandomScramble();

    return () => {
      isActive = false;
    };
  }, [charsType]);
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

function Sky() {
  const ref = useRef();
  const cloud0 = useRef();
  const config = {
    seed: 1,
    segments: 20,
    volume: 6,
    opacity: 0.8,
    fade: 10,
    growth: 4,
    speed: 0.1,
  };

  const color = "white";
  const x = 6;
  const y = 1;
  const z = 1;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    ref.current.rotation.y = Math.cos(t * 0.1) * 0.08;
    ref.current.rotation.x = Math.sin(t * 0.1) * 0.04;
    cloud0.current.rotation.y -= delta * 0.1;
  });

  return (
    <>
      <SkyImpl />
      <group ref={ref}>
        <Clouds
          ref={cloud0}
          {...config}
          bounds={[x, y, z]}
          position={[0, -6, -4]}
          color={color}
        >
          <Cloud ref={cloud0} {...config} bounds={[x, y, z]} color={color} />
          <Cloud
            concentrate="outside"
            growth={100}
            color="#ffccdd"
            opacity={1.25}
            seed={0.3}
            bounds={200}
            volume={200}
          />
        </Clouds>
      </group>
    </>
  );
}

CustomEase.create("slideshow-wipe", "0.625, 0.05, 0, 1");

const mobileSlidesData = [
  {
    variantId: 31,
    title: "Ember",
    subtitle: "Ember",
    full: "/images/shop/emberfull.png",
    thumbnail: "/images/shop/embertaketwo.png",
  },
  {
    variantId: 32,
    title: "Cocofloss",
    subtitle: "Orange Cocofloss",
    description: "Woven Floss • Citrus",
    full: "/images/shop/caracocomockupfull.png",
    thumbnail: "/images/shop/caracarathumb.png",
  },
  {
    variantId: 33,
    title: "Cocofloss",
    subtitle: "Strawberry Cocofloss",
    description: "Woven Floss • Sweet Berry",
    full: "/images/shop/strawberryfull.png",
    thumbnail: "/images/shop/15x12cocostrawberry.png",
  },
  {
    variantId: 34,
    title: "Cocofloss",
    subtitle: "Mint Cocofloss",
    full: "/images/shop/mintflossfull.png",
    description: "Woven Floss • Crisp Mint",
    thumbnail: "/images/shop/mintflossfull.png",
  },
  {
    variant: null,
    title: "Gift Card",
    subtitle: "Gift Card",
    description: "Digital Card • Any Amount",
    full: "/images/shop/giftcardmockupfull.png",
    thumbnail: "/images/giftcardmockup.png",
  },
  {
    variantId: 43,
    title: "Poladay 9.5%",
    subtitle: "Poladay 9.5%",
    full: "/images/shop/poladay95.png",
    description: "Hydrogen Peroxide Whitening",
    thumbnail: "/images/poladaymockup.png",
  },
  {
    variantId: 44,
    title: "Poladay 35%",
    subtitle: "Poladay 35%",
    full: "/images/shop/pola35full.png",
    description: "Carbamide Peroxide",
    thumbnail: "/images/shop/pola35full.png",
  },
  {
    variantId: 37,
    title: "Aligner Cases",
    subtitle: "Aligner Cases",
    description: "Everyday Case • Color Options",
    full: "/images/shop/whiteinvisscenefull.png",
    thumbnail: "/images/shop/whiteinvisscene.png",
  },
  {
    variantId: 41,
    title: "Zima Dental Pod",
    subtitle: "Dental Pod",
    description: "A cleaner routine",
    full: "/images/shop/zimawhitefull.png",
    thumbnail: "/images/shop/zimawhitefull.png",
  },
];

const slidesData = [
  {
    variantId: 31,
    title: "Ember",
    subtitle: "Light technology",
    full: "/images/shop/emberfull.png",
    thumbnail: "/images/shop/embertaketwo.png",
  },
  {
    variantId: 32,
    title: "Cocofloss",
    subtitle: "Cara Cara Orange",
    description: "Woven Floss • Citrus",
    full: "/images/shop/caracocomockupfull.png",
    thumbnail: "/images/shop/caracarathumb.png",
  },
  {
    variantId: 33,
    title: "Cocofloss",
    subtitle: "Strawberry",
    description: "Woven Floss • Sweet Berry",
    full: "/images/shop/strawberryfull.png",
    thumbnail: "/images/shop/15x12cocostrawberry.png",
  },
  {
    variantId: 34,
    title: "Cocofloss",
    subtitle: "Mint",
    full: "/images/shop/mintflossfull.png",
    description: "Woven Floss • Crisp Mint",
    thumbnail: "/images/shop/mintflossfull.png",
  },
  {
    variant: null,
    title: "Gift Card",
    subtitle: "The perfect gift",
    description: "Digital Card • Any Amount",
    full: "/images/shop/giftcardmockupfull.png",
    thumbnail: "/images/giftcardmockup.png",
  },
  {
    variantId: 43,
    title: "Poladay 9.5%",
    subtitle: "At-home whitening",
    full: "/images/shop/poladay95.png",
    description: "Hydrogen Peroxide Whitening",
    thumbnail: "/images/shop/poladay95.png",
  },
  {
    variantId: 44,
    title: "Poladay 35%",
    subtitle: "Professional strength",
    full: "/images/shop/pola35full.png",
    description: "Carbamide Peroxide",
    thumbnail: "/images/shop/pola35full.png",
  },
  {
    variantId: 37,
    title: "Aligner Cases",
    subtitle: "Choose your color",
    description: "Everyday Case • Color Options",
    full: "/images/shop/whiteinvisscenefull.png",
    thumbnail: "/images/shop/whiteinvisscene.png",
  },
  {
    variantId: 41,
    title: "Zima Dental Pod",
    subtitle: "Daily Clean • Ultrasonic",
    description: "A cleaner routine",
    full: "/images/shop/zimawhitefull.png",
    thumbnail: "/images/shop/zimawhitefull.png",
  },
  {
    variantId: 31,
    title: "Ember",
    subtitle: "Light technology",
    full: "/images/shop/emberfull.png",
    thumbnail: "/images/shop/embertaketwo.png",
  },
  {
    variantId: 32,
    title: "Cocofloss",
    subtitle: "Cara Cara Orange",
    description: "Woven Floss • Citrus",
    full: "/images/shop/caracocomockupfull.png",
    thumbnail: "/images/shop/caracarathumb.png",
  },
  {
    variantId: 33,
    title: "Cocofloss",
    subtitle: "Strawberry",
    description: "Woven Floss • Sweet Berry",
    full: "/images/shop/strawberryfull.png",
    thumbnail: "/images/shop/15x12cocostrawberry.png",
  },
  {
    variantId: 34,
    title: "Cocofloss",
    subtitle: "Mint",
    full: "/images/shop/mintflossfull.png",
    description: "Woven Floss • Crisp Mint",
    thumbnail: "/images/shop/mintflossfull.png",
  },
  {
    variant: null,
    title: "Gift Card",
    subtitle: "The perfect gift",
    description: "Digital Card • Any Amount",
    full: "/images/shop/giftcardmockupfull.png",
    thumbnail: "/images/giftcardmockup.png",
  },
  {
    variantId: 43,
    title: "Poladay 9.5%",
    subtitle: "At-home whitening",
    full: "/images/shop/poladay95.png",
    description: "Hydrogen Peroxide Whitening",
    thumbnail: "/images/shop/poladay95.png",
  },
  {
    variantId: 44,
    title: "Poladay 35%",
    subtitle: "Professional strength",
    full: "/images/shop/pola35full.png",
    description: "Carbamide Peroxide",
    thumbnail: "/images/shop/pola35full.png",
  },
  {
    variantId: 37,
    title: "Aligner Cases",
    subtitle: "Choose your color",
    description: "Everyday Case • Color Options",
    full: "/images/shop/whiteinvisscenefull.png",
    thumbnail: "/images/shop/whiteinvisscene.png",
  },
  {
    variantId: 41,
    title: "Zima Dental Pod",
    subtitle: "Daily Clean • Ultrasonic",
    description: "A cleaner routine",
    full: "/images/shop/zimawhitefull.png",
    thumbnail: "/images/shop/zimawhitefull.png",
  },
  {
    variantId: 31,
    title: "Ember",
    subtitle: "Light technology",
    full: "/images/shop/emberfull.png",
    thumbnail: "/images/shop/embertaketwo.png",
  },
  {
    variantId: 32,
    title: "Cocofloss",
    subtitle: "Cara Cara Orange",
    description: "Woven Floss • Citrus",
    full: "/images/shop/caracocomockupfull.png",
    thumbnail: "/images/shop/caracarathumb.png",
  },
  {
    variantId: 33,
    title: "Cocofloss",
    subtitle: "Strawberry",
    description: "Woven Floss • Sweet Berry",
    full: "/images/shop/strawberryfull.png",
    thumbnail: "/images/shop/15x12cocostrawberry.png",
  },
  {
    variantId: 34,
    title: "Cocofloss",
    subtitle: "Mint",
    full: "/images/shop/mintflossfull.png",
    description: "Woven Floss • Crisp Mint",
    thumbnail: "/images/shop/mintflossfull.png",
  },
  {
    variant: null,
    title: "Gift Card",
    subtitle: "The perfect gift",
    description: "Digital Card • Any Amount",
    full: "/images/shop/giftcardmockupfull.png",
    thumbnail: "/images/giftcardmockup.png",
  },
  {
    variantId: 43,
    title: "Poladay 9.5%",
    subtitle: "At-home whitening",
    full: "/images/shop/poladay95.png",
    description: "Hydrogen Peroxide Whitening",
    thumbnail: "/images/shop/poladay95.png",
  },
  {
    variantId: 44,
    title: "Poladay 35%",
    subtitle: "Professional strength",
    full: "/images/shop/pola35full.png",
    description: "Carbamide Peroxide",
    thumbnail: "/images/shop/pola35full.png",
  },
  {
    variantId: 37,
    title: "Aligner Cases",
    subtitle: "Choose your color",
    description: "Everyday Case • Color Options",
    full: "/images/shop/whiteinvisscenefull.png",
    thumbnail: "/images/shop/whiteinvisscene.png",
  },
  {
    variantId: 41,
    title: "Zima Dental Pod",
    subtitle: "Daily Clean • Ultrasonic",
    description: "A cleaner routine",
    full: "/images/shop/zimawhitefull.png",
    thumbnail: "/images/shop/zimawhitefull.png",
  },
];

const CrispLoader = ({ onComplete, slidesData, variants }) => {
  if (!variants?.length) {
    console.warn();
  }

  const containerRef = useRef(null);
  const headingRef = useRef(null);
  const loaderGroupsRef = useRef(null);
  const scaleUpMediaRef = useRef(null);
  const scaleDownImagesRef = useRef([]);
  const mainGroupRef = useRef(null);
  const contentRef = useRef(null);
  const headingContainerRef = useRef(null);
  const splitInstanceRef = useRef(null);

  const allSlides = slidesData;
  console.log("slides:", allSlides.length);
  const centerIndex = Math.floor(allSlides.length / 2);

  const addToScaleDown = (el) => {
    if (el && !scaleDownImagesRef.current.includes(el)) {
      scaleDownImagesRef.current.push(el);
    }
  };

  useLayoutEffect(() => {
    if (!allSlides.length) {
      onComplete?.();
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const heading = headingRef.current;
    const scaleUpMedia = scaleUpMediaRef.current;
    const scaleDownImages = scaleDownImagesRef.current;
    const mainGroup = mainGroupRef.current;
    const content = contentRef.current;
    const headingContainer = headingContainerRef.current;

    const images = scaleDownImages
      .map((el) => el?.querySelector("img"))
      .filter(Boolean);

    gsap.set(images, {
      scale: 1,
      force3D: true,
      transformOrigin: "center center",
      willChange: "transform",
      backfaceVisibility: "hidden",
    });

    if (scaleUpMedia) {
      gsap.set(scaleUpMedia, {
        force3D: true,
        willChange: "transform, width, height",
        backfaceVisibility: "hidden",
        transformOrigin: "center center",
      });
    }

    const tl = gsap.timeline({
      defaults: { ease: "expo.inOut" },
      onStart: () => {
        if (container) container.classList.remove("is--hidden");
      },
      onComplete: () => {
        if (scaleUpMedia) {
          gsap.set(scaleUpMedia, { willChange: "auto" });
        }
        images.forEach((img) => {
          gsap.set(img, { willChange: "auto" });
        });

        onComplete?.();
      },
    });

    if (heading) {
      if (headingContainer) {
        gsap.set(headingContainer, { overflow: "hidden" });
      }

      splitInstanceRef.current = new SplitText(heading, {
        type: "words",
        mask: "words",
      });

      gsap.set(splitInstanceRef.current.words, {
        yPercent: 110,
        opacity: 0,
      });
    }

    if (mainGroup) gsap.set(mainGroup, { xPercent: 100 });
    if (content) gsap.set(content, { scale: 0.8, opacity: 0, yPercent: 20 });

    const allLoaderImages = container.querySelectorAll(".crisp-loader__media");
    if (allLoaderImages.length) {
      gsap.set(allLoaderImages, { opacity: 1 });
    }

    if (mainGroup) {
      tl.to(mainGroup, { xPercent: 0, duration: 2 }, 0);
    }

    if (images.length) {
      tl.to(
        images,
        {
          scale: 0.5,
          opacity: 0.9,
          duration: 1.8,
          stagger: {
            each: 0.03,
            from: "edges",
            ease: "none",
          },
          ease: "none",
          force3D: true,
          overwrite: true,
        },
        "-=1.2",
      );
    }

    if (scaleUpMedia) {
      tl.to(
        scaleUpMedia,
        {
          width: "100vw",
          height: "100dvh",
          duration: 1.5,
          ease: "power2.inOut",
          force3D: true,
          overwrite: true,
        },
        "-=1.5",
      );

      tl.to(
        scaleUpMedia,
        {
          width: "5em",
          height: "5em",
          duration: 0.9,
          ease: "none",
          force3D: true,
          clearProps: "transform",
        },
        "+=0.05",
      );
    }

    if (allLoaderImages.length) {
      tl.to(
        allLoaderImages,
        {
          opacity: 0,
          duration: 0.6,
          stagger: { each: 0.02, from: "center" },
          onStart: () => {
            const loader = container.querySelector(".crisp-loader");
            if (loader) gsap.set(loader, { pointerEvents: "none" });
          },
          onComplete: () => {
            const loader = container.querySelector(".crisp-loader");
            if (loader) gsap.set(loader, { display: "none" });
          },
        },
        "-=0.1",
      );
    }

    if (content) {
      tl.to(
        content,
        {
          scale: 1,
          opacity: 1,
          yPercent: 0,
          duration: 0.8,
          ease: "expo.out",
        },
        "-=0.4",
      );
    }

    if (splitInstanceRef.current?.words.length) {
      tl.to(
        splitInstanceRef.current.words,
        {
          yPercent: 0,
          opacity: 1,
          stagger: { each: 0.06, from: "start" },
          ease: "back.out(0.6)",
          duration: 0.6,
        },
        "-=0.5",
      );
    }

    tl.call(
      () => {
        if (container) container.classList.remove("is--loading");
      },
      null,
      "+=0.1",
    );

    return () => {
      if (splitInstanceRef.current) {
        splitInstanceRef.current.revert();
      }
    };
  }, [onComplete, allSlides.length]);

  if (!allSlides.length) return null;

  return (
    <div ref={containerRef} className="crisp-header is--loading ">
      <div className="crisp-loader">
        <div className="crisp-loader__wrap">
          <div className="crisp-loader__groups" ref={loaderGroupsRef}>
            <div
              className="crisp-loader__group is--relative"
              ref={mainGroupRef}
            >
              {allSlides.map((image, idx) => {
                const isCenter = idx === centerIndex;
                return (
                  <div
                    key={`loader-${idx}`}
                    className={`crisp-loader__single ${isCenter ? "is--center" : ""}`}
                  >
                    <div
                      className={`crisp-loader__media ${isCenter ? "is--scaling" : ""}`}
                      ref={
                        isCenter
                          ? (el) => {
                              scaleUpMediaRef.current = el;
                            }
                          : (el) => addToScaleDown(el)
                      }
                    >
                      <img
                        src={image.thumbnail}
                        alt={image.alt || image.title}
                        className={`crisp-loader__cover-img ${!isCenter ? "is--scale-down" : ""}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="crisp-loader__fade"></div>
          <div className="crisp-loader__fade is--duplicate"></div>
        </div>
      </div>
    </div>
  );
};

const ShopContent = ({ isReady, variants, slidesData }) => {
  const router = useRouter();
  const containerRef = useRef(null);
  const focusStripRef = useRef(null);
  const sliderNavLeftRef = useRef(null);
  const sliderNavRightRef = useRef(null);
  const leftMaskRef = useRef(null);
  const scrollTriggerRef = useRef(null);
  const metricsRef = useRef(null);
  const scrollWrapRef = useRef(null);
  const contentRef = useRef(null);
  const headingRef = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);

  const allSlides = useMemo(() => {
    if (!variants?.length || !slidesData?.length) return [];
    return slidesData.map((slide) => {
      const variant = variants.find((v) => v.id === slide.variantId);
      if (!variant && slide.variantId) {
        console.warn("No match for variantId:", slide.variantId);
      }
      return { ...slide, variant };
    });
  }, [variants, slidesData]);

  useEffect(() => {
    if (variants?.length && slidesData?.length) {
      console.log("=== VARIANTS DATA ===");
      console.log(variants);

      console.log("=== SLIDES DATA ===");
      slidesData.forEach((slide) => {
        const variant = variants.find((v) => v.id === slide.variantId);
        console.log(`Slide: ${slide.title} (variantId: ${slide.variantId})`);
        console.log("  - Variant found:", variant);
        if (variant) {
          console.log("  - Variant keys:", Object.keys(variant));
          console.log(
            "  - Variant images:",
            variant.images ||
              variant.image ||
              variant.thumbnail ||
              variant.full,
          );
        }
      });
    }
  }, [variants, slidesData]);

  const stripSlides = useMemo(() => {
    if (!allSlides.length) return [];
    return [...allSlides, ...allSlides, ...allSlides];
  }, [allSlides]);

  const leftStripSlides = useMemo(() => {
    if (!stripSlides.length) return [];
    return [null, null, ...stripSlides];
  }, [stripSlides]);

  const rightStripSlides = stripSlides;

  const getStep = useCallback((track) => {
    if (!track?.children?.[0]) return 0;
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.gap) || 0;
    return track.children[0].getBoundingClientRect().width + gap;
  }, []);

  const measureScrub = useCallback(() => {
    const container = containerRef.current;
    const focusStripEl = focusStripRef.current;
    const navLeftEl = sliderNavLeftRef.current;
    const navRightEl = sliderNavRightRef.current;
    const leftMaskEl = leftMaskRef.current;

    if (
      !container ||
      !focusStripEl ||
      !navLeftEl ||
      !navRightEl ||
      !leftMaskEl
    ) {
      return null;
    }

    if (
      !focusStripEl.children.length ||
      !navLeftEl.children.length ||
      !navRightEl.children.length ||
      !allSlides.length
    ) {
      return null;
    }

    const total = allSlides.length;
    const startIndex = total * 2;

    const focusStep = getStep(focusStripEl);
    const thumbStep = getStep(navLeftEl);

    if (!focusStep || !thumbStep) return null;

    const focusMaskEl = focusStripEl.parentElement;
    if (!focusMaskEl) return null;

    const focusFrameEl = focusMaskEl.parentElement;
    if (!focusFrameEl) return null;

    const frameStyles = getComputedStyle(focusFrameEl);
    const paddingLeft = parseFloat(frameStyles.paddingLeft) || 0;
    const paddingRight = parseFloat(frameStyles.paddingRight) || 0;

    const focusMaskRect = focusMaskEl.getBoundingClientRect();
    const focusItemRect = focusStripEl.children[0].getBoundingClientRect();

    const focusStartX =
      (focusMaskRect.width - focusItemRect.width) * 0.5 +
      (paddingLeft - paddingRight) * 0.5 -
      startIndex * focusStep;

    const leftStartX = -paddingRight;

    const rightStartX =
      -(startIndex + 1) * thumbStep +
      paddingRight +
      (focusMaskRect.width - focusItemRect.width) * 0.5;

    const focusTrackWidth = focusStripEl.scrollWidth;
    const singleLoopWidth = focusTrackWidth / 3;
    const maxFocusTravel = singleLoopWidth - focusStep;

    const lastOriginalImageIndex = startIndex + total - 1;

    const rightStopX =
      rightStartX - (lastOriginalImageIndex - startIndex) * thumbStep;

    const maxRightTravel = Math.abs(rightStartX - rightStopX);
    const rightStopProgress =
      maxRightTravel / (maxFocusTravel * (thumbStep / focusStep));

    if (scrollWrapRef.current) {
      const neededHeight = Math.ceil(window.innerHeight + maxFocusTravel + 2);
      scrollWrapRef.current.style.height = `${neededHeight}px`;
    }

    return {
      focusStripEl,
      navLeftEl,
      navRightEl,
      focusStep,
      thumbStep,
      focusStartX,
      leftStartX,
      rightStartX,
      maxFocusTravel,
      maxRightTravel,
      rightStopProgress,
      rightStopX,
    };
  }, [allSlides, getStep]);

  const applyScrubProgress = useCallback((progress) => {
    const m = metricsRef.current;
    if (!m) return;

    const focusTravel = progress * m.maxFocusTravel;
    const thumbTravel = (focusTravel / m.focusStep) * m.thumbStep;

    let rightStripX;
    if (progress >= m.rightStopProgress) {
      rightStripX = m.rightStopX;
    } else {
      rightStripX = m.rightStartX - thumbTravel;
    }

    gsap.set(m.focusStripEl, {
      x: m.focusStartX - focusTravel,
    });

    gsap.set(m.navLeftEl, {
      x: m.leftStartX - thumbTravel,
      opacity: 1,
    });

    gsap.set(m.navRightEl, {
      x: rightStripX,
      opacity: 1,
    });
  }, []);

  const initScrollScrub = useCallback(() => {
    if (!isReady || !allSlides.length) return;

    metricsRef.current = measureScrub();
    if (!metricsRef.current) return;

    applyScrubProgress(0);

    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.refresh();
      return;
    }

    scrollTriggerRef.current = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: () => `+=${metricsRef.current?.maxFocusTravel ?? 0}`,
      scrub: 1.2,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        applyScrubProgress(self.progress);

        const ticks = document.querySelectorAll(".scroll-ticks");
        const velocity = self.getVelocity();
        const shift = velocity * 0.001;

        ticks.forEach((el) => {
          const current = parseFloat(el.dataset.offset || "0") + shift;
          el.dataset.offset = current;
          el.style.backgroundPosition = `${current}px 0px`;
        });
      },
      onRefreshInit: () => {
        metricsRef.current = measureScrub();
      },
      onRefresh: (self) => {
        applyScrubProgress(self.progress);
      },
    });

    ScrollTrigger.refresh();
  }, [isReady, measureScrub, applyScrubProgress, allSlides.length]);

  useLayoutEffect(() => {
    if (!isReady) return;
    const timer = setTimeout(() => {
      initScrollScrub();
    }, 100);

    return () => clearTimeout(timer);
  }, [isReady, initScrollScrub]);

  useLayoutEffect(() => {
    if (!isReady) return;
    let resizeRaf;

    const handleResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        initScrollScrub();
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(resizeRaf);
    };
  }, [isReady, initScrollScrub]);

  useEffect(() => {
    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
    };
  }, []);




  const handleThumbClick = (slide) => {
    if (!slide.variant) return;
    router.push(`/shop/products/${slide.variant.id}`);
  };

  if (!isReady || !allSlides.length) return null;
  const textPathRef = useRef(null);

  useEffect(() => {
    if (!textPathRef.current) return;

    gsap.to(textPathRef.current, {
      attr: { startOffset: "100%" },
      duration: 10,
      ease: "none",
      repeat: -1,
      modifiers: {
        startOffset: (value) => {
          const num = parseFloat(value);
          return (num % 100) + "%";
        },
      },
    });
  }, []);

  return (
    <div
      ref={scrollWrapRef}
      style={{
        height: "300vh",
        opacity: isReady ? 1 : 0,
        pointerEvents: isReady ? "auto" : "none",
      }}
    >
      <section
        ref={containerRef}
        data-slideshow="wrap"
        className="crisp-header"
      >
        <div className="crisp-header__border-wrapper">
          <div ref={contentRef} className="crisp-header__content">
            <section className="relative flex items-end justify-end">
              <div className="relative w-[18vw] aspect-[1/1] mt-10">
                <a
                  href="https://www.amazon.com/hz/wishlist/ls/3H5ZN3KIOODT1?ref_=wl_share"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 356 356"
                    >
                    <defs>
                      <mask
                        id="customShape"
                        maskUnits="userSpaceOnUse"
                        maskContentUnits="userSpaceOnUse"
                      >
                        <rect width="100%" height="100%" fill="black" />
                        <g transform="translate(128 128)  translate(-128 -128)">
                          <path
                            d="M 65.025 143.01 C 70.813 165.5 88.518 183.205 111.008 188.993 L 111.008 254.018 C 53.108 246.796 7.22 200.909 0 143.01 Z 
             M 254.016 143.01 C 246.796 200.909 200.907 246.798 143.008 254.018 L 143.008 188.993 C 165.498 183.205 183.203 165.5 188.991 143.01 Z 
             M 127.008 111.01 C 135.845 111.01 143.008 118.173 143.008 127.01 C 143.008 135.847 135.845 143.01 127.008 143.01 C 118.171 143.01 111.008 135.847 111.008 127.01 C 111.008 118.173 118.171 111.01 127.008 111.01 Z 
             M 111.008 65.026 C 88.518 70.814 70.813 88.52 65.025 111.01 L 0 111.01 C 7.22 53.11 53.109 7.221 111.008 0.001 Z 
             M 143.008 0 C 200.907 7.221 246.796 53.111 254.016 111.01 L 188.991 111.01 C 183.203 88.52 165.498 70.814 143.008 65.026 Z"
                            fill="white"
                          />
                        </g>
                      </mask>
                    </defs>

                    <foreignObject
                      width="100%"
                      height="100%"
                      mask="url(#customShape)"
                
                    >
                      <div className="w-[100vw] h-[100vh]" >
                        <Canvas
                          style={{ pointerEvents: "none" }}
                          camera={{ position: [0, -10, 10], fov: 75 }}
                        >
                       
                          <Sky />
                          <ambientLight intensity={Math.PI / 1.5} />
                          <spotLight position={[0, 40, 0]} intensity={100} />
                          <spotLight
                            position={[-20, 0, 10]}
                            color="purple"
                            intensity={30}
                          />
                          <spotLight
                            position={[20, -10, 10]}
                            color="red"
                            intensity={20}
                          />
                          <CameraControls />
                        </Canvas>
                      </div>
                    </foreignObject>
                  </svg>
      

                <div
                  className="absolute w-[14vw] aspect-[1/1]"
                  style={{
                    top: "31%",
                    left: "34%",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                    <div className="absolute w-full h-full ">
                      {"SHOP • OUR • AMAZON • STOREFRONT • "
                        .split("")
                        .map((char, index) => {
                          const angle =
                            (index * 360) /
                            "SHOP • OUR • AMAZON • STOREFRONT • ".length;
                          return (
                            <div
                              key={index}
                              style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                transform: `rotate(${angle}deg) translateY(-50%)`,
                                transformOrigin: "50% 50%",
                                animation: `spin 20s linear infinite`,
                                animationDelay: `${-index * (20 / "SHOP • OUR • AMAZON • STOREFRONT • ".length)}s`,
                              }}
                            >
                              <span className="text-[10px] tracking-[4px] font-['IBMPlexMono-Light']">
                                {char === " " ? "\u00A0" : char}
                              </span>
                            </div>
                          );
                        })}
                    </div>
     
                </div>
   
                <style>
                  {`
    @keyframes spin {
      from {
        transform: rotate(0deg) translateY(-36px);
      }
      to {
        transform: rotate(360deg) translateY(-36px);
      }
    }
  `}
                </style>
                       </a>
              </div>
            </section>
            <div className="crisp-header__center">
              <div className="vertical-copy">
                <div className="vertical-copy__group vertical-copy__group--top">
                  <ScrambleText
                    text="Ember"
                    className="vertical-copy__line is-bright"
                  />
                  <ScrambleText
                    text="Cocofloss"
                    className="vertical-copy__line is-dim"
                  />
                  <ScrambleText
                    text="Whitening"
                    className="vertical-copy__line is-bright"
                  />
                </div>

                <div className="vertical-copy__group vertical-copy__group--bottom">
                  <ScrambleText
                    text="Aligners"
                    className="vertical-copy__line is-bright"
                  />
                  <ScrambleText
                    text="Zima"
                    className="vertical-copy__line is-bright"
                  />
                  <ScrambleText
                    text="Gift Cards"
                    className="vertical-copy__line is-dim"
                  />
                </div>
              </div>

              <div className="crisp-header__heading-container">
                <h1 className="crisp-header__h1" ref={headingRef}>
                  Browse our e-shop
                </h1>
              </div>
            </div>

            <div className="strip-row relative">
              <div className="fade-left" />

              <div className="nav-layer nav-layer--left">
                <div className="nav-mask nav-mask--left" ref={leftMaskRef}>
                  <div
                    className="crisp-header__slider-nav crisp-header__slider-nav--left"
                    ref={sliderNavLeftRef}
                  >
                    {leftStripSlides.map((slide, idx) => {
                      if (!slide) {
                        return (
                          <div
                            key={`left-empty-${idx}`}
                            className="crisp-header__slider-nav-btn is--placeholder"
                          />
                        );
                      }

                      const images = slide.variant?.variantImages || [];
                      const base = slide.thumbnail;
                      const hover = images[1]?.url;
                      const isHovered = hoveredId === slide.variantId;

                      return (
                        <Link
                          key={`left-${slide.id}-${idx}`}
                          href={`/shop/products/${slide.variant?.id}`}
                          className="relative w-[min(220px,20vw)] h-[min(220px,20vw)] flex-shrink-0 overflow-hidden"
                          onMouseEnter={() => setHoveredId(slide.variantId)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                          <div className="absolute inset-0 overflow-hidden">
                            <img
                              src={base}
                              alt={slide.alt || slide.title}
                              className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                              style={{
                                opacity: isHovered ? 0 : 1,
                                transform: isHovered
                                  ? "scale(1.05)"
                                  : "scale(1)",
                              }}
                            />

                            {hover && (
                              <img
                                src={hover}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out"
                                style={{
                                  opacity: isHovered ? 1 : 0,
                                  transform: isHovered
                                    ? "scale(1)"
                                    : "scale(1.05)",
                                }}
                              />
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="crisp-header__focus">
                <div className="focus-layer">
                  <div className="focus-frame">
                    <div className="focus-mask">
                      <div className="focus-strip" ref={focusStripRef}>
                        {stripSlides.map((slide, idx) => {
                          if (!slide) {
                            return (
                              <div
                                key={`focus-empty-${idx}`}
                                className="focus-item is--placeholder"
                              />
                            );
                          }

                          return (
                            <Link
                              key={`focus-${slide.id}-${idx}`}
                              href={`/shop/products/${slide.variant?.id}`}
                              className="focus-item"
                              onClick={() => handleThumbClick(slide)}
                            >
                              <img
                                src={slide.thumbnail}
                                alt={slide.alt || slide.title}
                              />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="nav-layer nav-layer--right">
                <div className="nav-mask nav-mask--right">
                  <div
                    className="crisp-header__slider-nav crisp-header__slider-nav--right"
                    ref={sliderNavRightRef}
                  >
                    {rightStripSlides.map((slide, idx) => {
                      if (!slide) {
                        return (
                          <div
                            key={`right-empty-${idx}`}
                            className="crisp-header__slider-nav-btn is--placeholder"
                          />
                        );
                      }

                      const images = slide.variant?.variantImages || [];
                      const base = slide.thumbnail;
                      const hover = images[1]?.url;
                      const isHovered = hoveredId === slide.variantId;

                      return (
                        <Link
                          key={`right-${slide.id}-${idx}`}
                          href={`/shop/products/${slide.variant?.id}`}
                          className="relative w-[min(220px,20vw)] h-[min(220px,20vw)] flex-shrink-0 overflow-hidden"
                          onClick={() => handleThumbClick(slide)}
                          onMouseEnter={() => setHoveredId(slide.variantId)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                          <div className="absolute inset-0 overflow-hidden">
                            <img
                              src={base}
                              alt={slide.alt || slide.title}
                              className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                              style={{
                                opacity: isHovered ? 0 : 1,
                                transform: isHovered
                                  ? "scale(1.05)"
                                  : "scale(1)",
                              }}
                            />

                            {hover && (
                              <img
                                src={hover}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out"
                                style={{
                                  opacity: isHovered ? 1 : 0,
                                  transform: isHovered
                                    ? "scale(1)"
                                    : "scale(1.05)",
                                }}
                              />
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="fade-right" />
            </div>

            <div className="scroll-indicator">
              <div className="scroll-ticks scroll-ticks--left" />
              <div className="scroll-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 146 36"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path
                    d="M131.762 24.9557L144.632 1.17261L1.63232 1.17261L41.0214 35.1726H78.1505L91.3905 24.9557L131.762 24.9557Z"
                    fill="#0C5EFF"
                  />
                </svg>
                {/* <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1780.66 487.5">
  <g id="Layer_3" data-name="Layer 3">
    <path d="M1780.66,96v229.09c0,9.55-3.79,18.7-10.54,25.45l-48.92,48.92c-6.75,6.75-15.9,10.54-25.45,10.54h-280.21c-12.73,0-24.94,5.06-33.94,14.06l-49.38,49.38c-9,9-21.21,14.06-33.94,14.06h-295.24c-12.73,0-24.94-5.06-33.94-14.06l-59.38-59.38c-9-9-21.21-14.06-33.94-14.06h-342.1c-8.86,0-17.41,3.27-24.01,9.18l-29.76,26.64c-6.6,5.91-15.15,9.18-24.01,9.18H48C21.46,445-.04,423.45,0,396.91c.21-125.59.42-197.12.63-317.23.02-12.6,5-24.71,13.87-33.67l31.41-31.76C54.93,5.13,67.22,0,80.04,0h755.19c9.99,0,19.68,3.4,27.48,9.64l22.61,18.09c9.93,7.94,22.27,12.27,34.98,12.27h804.36c30.93,0,56,25.07,56,56Z" style={{fill: "#0C5EFF"}}/>
  </g>
</svg> */}
                <span className="scroll-label">SCROLL</span>
              </div>
              <div className="scroll-ticks scroll-ticks--right" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
const PreloaderComponent = ({ children, variants }) => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const hasLoadedShop = sessionStorage.getItem("shop_loaded_once");
    const isInShop = pathname.startsWith("/shop/products");

    if (isInShop && !hasLoadedShop) {
      setIsLoading(true);
      sessionStorage.setItem("shop_loaded_once", "true");
    }
  }, [pathname]);

  const handleLoaderComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <>
      {isLoading && (
        <CrispLoader
          onComplete={handleLoaderComplete}
          slidesData={slidesData}
          variants={variants}
        />
      )}

      <div
        style={{
          opacity: isLoading ? 0 : 1,
          pointerEvents: isLoading ? "none" : "auto",
        }}
      >
        {children}
      </div>
    </>
  );
};
export { ShopContent, slidesData };

const config = {
  gap: 0.08,
  speed: 0.3,
  arcRadius: 500,
};

const PreloaderMobile: React.FC = () => {
  const router = useRouter();
  const activeIndexRef = useRef(0);
  const currentIndexRef = useRef(0);
  const arcProgressRef = useRef({ value: 0 });
  const isStepAnimatingRef = useRef(false);

  const spotlightRef = useRef<HTMLElement>(null);
  const titlesContainerElementRef = useRef<HTMLDivElement>(null);
  const introText1Ref = useRef<HTMLParagraphElement>(null);
  const introText2Ref = useRef<HTMLParagraphElement>(null);
  const spotlightBgImgRef = useRef<HTMLDivElement>(null);
  const spotlightBgImgInnerRef = useRef<HTMLImageElement>(null);
  const currentImageIndexRef = useRef(0);
  const isInitializedRef = useRef(false);

  const clickStartPosRef = useRef<{
    x: number;
    y: number;
    time: number;
  } | null>(null);

  const hasMovedRef = useRef(false);
  const bgTransitionRef = useRef<gsap.core.Timeline | null>(null);
  const isTransitioningRef = useRef(false);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const currentTitleRef = useRef<HTMLDivElement>(null);
const arcContainerRef = useRef<HTMLDivElement>(null);
  
  const isAnimatingRef = useRef(false);
  const autoAnimationCompletedRef = useRef(false);
  const autoAnimationTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const pendingTitleTransitionRef = useRef<number | null>(null);
  const backgroundIndexRef = useRef(0);

const animateTitleChange = (nextIndex: number) => {
  if (!currentTitleRef.current) return;

  if (isAnimatingRef.current) {
    pendingTitleTransitionRef.current = nextIndex;
    return;
  }

  isAnimatingRef.current = true;

  const el = currentTitleRef.current;
  const nextTitle = mobileSlidesData[nextIndex].subtitle;

  gsap.to(el, {
    duration: 0.8,
    ease: "power2.out",
    scrambleText: {
      text: nextTitle,
      chars: "upperCase",
      speed: 0.6,
      revealDelay: 0.1,
        tweenLength: false,
    },
    onComplete: () => {
      activeIndexRef.current = nextIndex;
      isAnimatingRef.current = false;

      if (pendingTitleTransitionRef.current !== null) {
        const pending = pendingTitleTransitionRef.current;
        pendingTitleTransitionRef.current = null;
        animateTitleChange(pending);
      }
    },
  });
};

    useEffect(() => {
    ScrollTrigger.normalizeScroll(true);

    return () => {
      ScrollTrigger.normalizeScroll(false);
    };
  }, []);
  
  useEffect(() => {
    return () => {

      pendingTitleTransitionRef.current = null;

      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill(true);
        scrollTriggerRef.current = null;
      }

      ScrollTrigger.getAll().forEach((st) => st.kill(true));

      if (ctxRef.current) {
        ctxRef.current.revert();
        ctxRef.current = null;
      }

      if (bgTransitionRef.current) {
        bgTransitionRef.current.kill();
        bgTransitionRef.current = null;
      }

      if (autoAnimationTimelineRef.current) {
        autoAnimationTimelineRef.current.kill();
        autoAnimationTimelineRef.current = null;
      }
      ScrollTrigger.refresh(true);
    };
  }, []);

  const getBezierPosition = (t: number) => {
    const containerWidth = window.innerWidth * 0.3;
    const arcStartX = containerWidth - 220;
    const arcStartY = -280;
    const arcEndY = window.innerHeight + 280;
    const arcControlPointX = arcStartX + config.arcRadius * 1.2;
    const arcControlPointY = window.innerHeight / 2;

    const x =
      (1 - t) * (1 - t) * arcStartX +
      2 * (1 - t) * t * arcControlPointX +
      t * t * arcStartX;
    const y =
      (1 - t) * (1 - t) * arcStartY +
      2 * (1 - t) * t * arcControlPointY +
      t * t * arcEndY;
    return { x, y };
  };

  const smoothTransitionBackground = (
    currentIndex: number,
    nextIndex: number,
  ) => {
    if (!spotlightBgImgRef.current) return;

    const container = spotlightBgImgRef.current;
    const currentImg = container.querySelector(
      ".bg-img.current",
    ) as HTMLImageElement;
    const nextImg = container.querySelector(".bg-img.next") as HTMLImageElement;

    if (!currentImg || !nextImg || currentIndex === nextIndex) return;

    if (isTransitioningRef.current) {
      bgTransitionRef.current?.kill();
    }

    console.log(`bg image from ${currentIndex} to ${nextIndex}`);

    isTransitioningRef.current = true;

    if (bgTransitionRef.current) {
      bgTransitionRef.current.kill();
    }
    nextImg.src = mobileSlidesData[nextIndex % mobileSlidesData.length].full;

    gsap.set(nextImg, {
      opacity: 0,
      scale: 1.05,
      filter: "blur(8px)",
      zIndex: 1,
    });

    gsap.set(currentImg, {
      zIndex: 2,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    });

    const tl = gsap.timeline({
      onComplete: () => {
        currentImg.classList.remove("current");
        currentImg.classList.add("next");
        nextImg.classList.remove("next");
        nextImg.classList.add("current");

        gsap.set(currentImg, {
          opacity: 0,
          clearProps: "all",
        });

        gsap.set(nextImg, {
          clearProps: "all",
        });

        isTransitioningRef.current = false;
        currentImg.src = nextImg.src;
      },
    });

    tl.to(
      currentImg,
      {
        opacity: 0,
        scale: 0.95,
        filter: "blur(12px)",
        duration: 0.6,
        ease: "power2.inOut",
      },
      0,
    );

    tl.to(
      nextImg,
      {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.8,
        ease: "power2.out",
      },
      0.1,
    );

    bgTransitionRef.current = tl;
  };

  const handleNavigate = (variantId: number) => {
    ScrollTrigger.getAll().forEach((st) => st.kill(true));

    if (ctxRef.current) {
      ctxRef.current.revert();
    }

    gsap.globalTimeline.clear();

    ScrollTrigger.refresh(true);

    router.push(`/shop/products/${variantId}`);
  };

  const playAutoIntroAnimation = () => {
    if (autoAnimationCompletedRef.current) return;
    if (
      !introText1Ref.current ||
      !introText2Ref.current ||
      !spotlightBgImgRef.current ||
      !spotlightBgImgInnerRef.current
    )
      return;

    autoAnimationCompletedRef.current = true;

    const moveDistance = window.innerWidth * 0.6;
    const duration = 1.2;

    const tl = gsap.timeline({
      onComplete: () => {
        if (introText1Ref.current && introText2Ref.current) {
          gsap.set(introText1Ref.current, { x: -moveDistance, opacity: 1 });
          gsap.set(introText2Ref.current, { x: moveDistance, opacity: 1 });
        }

        if (spotlightBgImgRef.current) {
          gsap.set(spotlightBgImgRef.current, { scale: 1 });
        }

        if (spotlightBgImgInnerRef.current) {
          gsap.set(spotlightBgImgInnerRef.current, { scale: 1 });
        }

        imageElementsRef.current.forEach((img) =>
          gsap.set(img, { opacity: 0 }),
        );
applyArcState(arcProgressRef.current.value);
        window.dispatchEvent(new CustomEvent("introComplete"));
      },
    });

    if (titlesContainerElementRef.current) {
      tl.fromTo(
        titlesContainerElementRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
        },
        0.3,
      );
    }

    tl.to(
      introText1Ref.current,
      {
        x: -moveDistance,
        opacity: 1,
        duration: duration,
        ease: "power2.inOut",
      },
      0,
    );

    tl.to(
      introText2Ref.current,
      {
        x: moveDistance,
        opacity: 1,
        duration: duration,
        ease: "power2.inOut",
      },
      0,
    );

    tl.to(
      spotlightBgImgRef.current,
      {
        scale: 1,
        duration: duration,
        ease: "power2.inOut",
      },
      0,
    );

    tl.to(
      spotlightBgImgInnerRef.current,
      {
        scale: 1,
        duration: duration,
        ease: "power2.inOut",
      },
      0,
    );

    autoAnimationTimelineRef.current = tl;
  };
  const applyArcState = (progress: number) => {
    const elements = imageElementsRef.current;
    const numSlides = elements.length;
    if (!numSlides) return 0;

    let centeredIndex = 0;
    let minDist = Infinity;

    elements.forEach((img, index) => {
      const t = (((progress + index / numSlides) % 1) + 1) % 1;
      const pos = getBezierPosition(t);

      const offset = (t - 0.5) * 80;

      gsap.set(img, {
        x: pos.x - 100 + offset,
        y: pos.y - 75,
        opacity: 1,
      });

      const dist = Math.abs(t - 0.5);

      if (dist < minDist) {
        minDist = dist;
        centeredIndex = index;
      }
    });

    return centeredIndex;
  };

  const syncUIToCenteredIndex = (centeredIndex: number) => {
    const safeIndex = getSafeIndex(centeredIndex);
    const prevIndex = backgroundIndexRef.current;

    if (prevIndex === safeIndex) return;

    backgroundIndexRef.current = safeIndex;
    currentImageIndexRef.current = safeIndex;

    animateTitleChange(safeIndex);
    smoothTransitionBackground(prevIndex, safeIndex);
  };

  const getSafeIndex = (index: number) => {
    const numSlides = mobileSlidesData.length;
    return ((index % numSlides) + numSlides) % numSlides;
  };
  const transitionToIndex = (nextIndex: number) => {
    if (isStepAnimatingRef.current) return;

    const numSlides = mobileSlidesData.length;
    const direction = nextIndex > currentIndexRef.current ? 1 : -1;

    isStepAnimatingRef.current = true;
    currentIndexRef.current = nextIndex;

    gsap.to(arcProgressRef.current, {
      value: arcProgressRef.current.value - direction / numSlides,
      duration: 0.85,
      ease: "power3.inOut",
      onUpdate: () => {
        const centeredIndex = applyArcState(arcProgressRef.current.value);
        syncUIToCenteredIndex(centeredIndex);
      },
      onComplete: () => {
        const centeredIndex = applyArcState(arcProgressRef.current.value);
        syncUIToCenteredIndex(centeredIndex);
        isStepAnimatingRef.current = false;
      },
    });
  };
useEffect(() => {
  const bg = spotlightBgImgRef.current;
  const bgInner = spotlightBgImgInnerRef.current;
  const arc = arcContainerRef.current;

  if (bg && bgInner) {
    gsap.set(bg, { scale: 0, opacity: 0 });
    gsap.set(bgInner, { scale: 1.5 });
  }

  if (arc) {
    gsap.set(arc, { opacity: 0 });
  }

  if (introText1Ref.current && introText2Ref.current) {
    gsap.set([introText1Ref.current, introText2Ref.current], { opacity: 0 });
  }

  if (titlesContainerElementRef.current) {
    gsap.set(titlesContainerElementRef.current, { opacity: 0 });
  }


  requestAnimationFrame(() => {
    const initialProgress = 0.5;

    arcProgressRef.current.value = initialProgress;
    const initialCenteredIndex = applyArcState(initialProgress);

    currentIndexRef.current = initialCenteredIndex;
    activeIndexRef.current = initialCenteredIndex;
    backgroundIndexRef.current = initialCenteredIndex;

    if (bg) {
      const currentImg = bg.querySelector(".bg-img.current") as HTMLImageElement;
      const nextImg = bg.querySelector(".bg-img.next") as HTMLImageElement;

      if (currentImg && nextImg) {
        currentImg.src = mobileSlidesData[initialCenteredIndex].full;
        nextImg.src = mobileSlidesData[initialCenteredIndex].full;
      }
    }

    if (currentTitleRef.current) {
      currentTitleRef.current.textContent =
        mobileSlidesData[initialCenteredIndex].subtitle;
    }
  });

  isInitializedRef.current = true;

  const tl = gsap.timeline({ delay: 0.15 });

  tl.to(
    [bg, arc],
    {
      opacity: 1,
      duration: 0.7,
      ease: "none",
    },
    0
  );

  tl.fromTo(
    arc,
    { scale: 0.98 },
    { scale: 1, duration: 0.7, ease: "none" },
    0
  );

  tl.call(() => {
    playAutoIntroAnimation();
  }, [], 0.3);

}, [router]);
  let lastScrollTime = 0;
  
  useEffect(() => {
    if (!isInitializedRef.current || imageElementsRef.current.length === 0)
      return;
    if (!spotlightRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const now = Date.now();
      if (now - lastScrollTime < 700) return;
      lastScrollTime = now;

      if (isStepAnimatingRef.current) return;

      const direction = e.deltaY > 0 ? 1 : -1;
      transitionToIndex(currentIndexRef.current + direction);
    };

    const el = spotlightRef.current;

    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const imageElementsRef = useRef<HTMLDivElement[]>([]);
  imageElementsRef.current = [];
  return (
    <>
      <section className="spotlight" ref={spotlightRef}>
        <div className="spotlight-bg">
          <div className="spotlight-bg-img" ref={spotlightBgImgRef}>
            <img
              className="bg-img current"
              src={mobileSlidesData[0]?.full}
              alt=""
              ref={spotlightBgImgInnerRef}
            />
            <img
              className="bg-img next"
              src={mobileSlidesData[0]?.full}
              alt=""
            />
          </div>
        </div>

        <div className="spotlight-images" ref={arcContainerRef}>
          {mobileSlidesData.map((item, index) => (
            <div
              key={index}
              className="spotlight-img"
              ref={(el) => {
                if (el) imageElementsRef.current[index] = el;
              }}
              style={{ cursor: "pointer" }}
              onClick={() => {
                if (hasMovedRef.current) {
                  hasMovedRef.current = false;
                  return;
                }

                if (item.variantId) {
                  handleNavigate(item.variantId);
                }
              }}
              onPointerDown={(e) => {
                clickStartPosRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  time: Date.now(),
                };
                hasMovedRef.current = false;
              }}
              onPointerMove={(e) => {
                if (!clickStartPosRef.current) return;

                const dx = Math.abs(e.clientX - clickStartPosRef.current.x);
                const dy = Math.abs(e.clientY - clickStartPosRef.current.y);

                if (dx > 10 || dy > 10) {
                  hasMovedRef.current = true;
                }
              }}
            >
              <img src={item.thumbnail} alt="" />
            </div>
          ))}
        </div>

        <div className="spotlight-ui">
          <div className="spotlight-intro-text-wrapper">
            <p className="spotlight-intro-text" ref={introText1Ref}>
              Featured Products
            </p>
            <p className="spotlight-intro-text" ref={introText2Ref}>
              — Shop Now
            </p>
          </div>

          <div className="spotlight-titles-container">
            {[1, 2, 3, 4, 5, 13, 14].map((n) => (
              <div className="circle-wrap" key={n}>
                <div className={`circle-${n}`} />
              </div>
            ))}

            <div className="spotlight-mask">

              <div className="title current" ref={currentTitleRef}>
                {mobileSlidesData[0]?.subtitle}
              </div>
              <div className="title next"  />
            </div>
                          
              <div className="shop-ui">
    <div className="shop-label">SHOP</div>
    <div className="loading-frame">
      {[...Array(10)].map((_, index) => (
        <div key={index} className={`dot dot-${index + 1}`} />
      ))}
    </div>
  </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default function PreloaderWrapper({ children, disablePreloader }) {
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile === null) return null;

  return isMobile ? (
    <PreloaderMobile disablePreloader={disablePreloader}>
      {children}
    </PreloaderMobile>
  ) : (
    <PreloaderComponent disablePreloader={disablePreloader}>
      {children}
    </PreloaderComponent>
  );
}
