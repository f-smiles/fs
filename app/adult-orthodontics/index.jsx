"use client";
import "./style.css";
import { useEffect, useRef, useState, useLayoutEffect} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);
const SlidingText = ({ text = "DEFAULT", totalCells = 8, className = "" }) => {
  const containerRef = useRef(null);
  const innerRefs = useRef([]);
  const [textWidth, setTextWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !innerRefs.current.length) return;

    const setLayout = () => {
      const firstInner = innerRefs.current[0];
      if (!firstInner) return;


      const tempSpan = document.createElement("span");
      tempSpan.style.visibility = "hidden";
      tempSpan.style.position = "absolute";
      tempSpan.style.whiteSpace = "nowrap";
      tempSpan.style.fontSize = window.getComputedStyle(firstInner).fontSize;
      tempSpan.style.fontFamily = window.getComputedStyle(firstInner).fontFamily;
      tempSpan.style.letterSpacing = window.getComputedStyle(firstInner).letterSpacing;
      tempSpan.style.fontWeight = window.getComputedStyle(firstInner).fontWeight;
      tempSpan.innerText = text;

      document.body.appendChild(tempSpan);
      const measuredWidth = tempSpan.getBoundingClientRect().width;
      document.body.removeChild(tempSpan);

      const textWidthWithBuffer = measuredWidth * 1.2;
      setTextWidth(textWidthWithBuffer);

      const offset = textWidthWithBuffer / totalCells;

      container.style.setProperty("--text-width", `${textWidthWithBuffer}px`);
      container.style.setProperty("--gsplits", totalCells);
      container.style.setProperty("--offset", `${offset}px`);


      innerRefs.current.forEach((inner, i) => {
        if (inner) {
          gsap.set(inner, {
            x: -i * offset,
            position: "relative",
            display: "inline-block",
            willChange: "transform",
            opacity: 0, 
          });
        }
      });


      requestAnimationFrame(() => {
        setIsReady(true);
      });
    };

    const initLayout = () => {

      setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(setLayout);
        });
      }, 50);
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(initLayout);
    } else {
      initLayout();
    }

    window.addEventListener("resize", () => {
      setIsReady(false);
      initLayout();
    });

    return () => {
      window.removeEventListener("resize", initLayout);
    };
  }, [totalCells, text]);

  useEffect(() => {
    if (!isReady || !containerRef.current || !innerRefs.current.length || !textWidth) return;

    const offset = textWidth / totalCells;


    gsap.killTweensOf(innerRefs.current);


    gsap.fromTo(
      innerRefs.current,
      {
        x: (i) => {
          const targetX = -i * offset;
          const randomOffset = (i % 2 === 0 ? -1 : 1) * (textWidth * 0.15);
          return targetX + randomOffset;
        },
        opacity: 0,
      },
      {
        x: (i) => -i * offset,
        opacity: 1,
        duration: 0.8,
        stagger: 0.03,
        ease: "power2.out",
        onStart: () => {

          if (containerRef.current) {
            containerRef.current.style.visibility = "visible";
          }
        },
      }
    );
  }, [totalCells, text, textWidth, isReady]);


  if (!isReady) {
    return (
      <div 
        ref={containerRef} 
        className={`gtext ${className}`}
        style={{ 
          visibility: "hidden",
          position: "relative",

          minHeight: "2em"
        }}
      >
        {Array.from({ length: totalCells }).map((_, i) => (
          <span key={i} className="gtext__box" style={{ display: "inline-block" }}>
            <span
              className="gtext__box-inner"
              ref={(el) => (innerRefs.current[i] = el)}
              style={{ 
                display: "inline-block",
                whiteSpace: "nowrap",
                visibility: "hidden"
              }}
            >
              {text}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`gtext ${className}`}
      style={{ 
        visibility: "visible",
        position: "relative"
      }}
    >
      {Array.from({ length: totalCells }).map((_, i) => (
        <span key={i} className="gtext__box" style={{ display: "inline-block" }}>
          <span
            className="gtext__box-inner"
            ref={(el) => (innerRefs.current[i] = el)}
            style={{ 
              display: "inline-block",
              whiteSpace: "nowrap"
            }}
          >
            {text}
          </span>
        </span>
      ))}
    </div>
  );
};
export default function AdultOrthodontics() {
  const mainSection = useRef(null);
  const itemsContainer = useRef(null);

  useEffect(() => {
    const items = document.querySelectorAll(".MainSectionItem");
    const innerItems = document.querySelectorAll(".MainSectionItem-inner");
    const innerStickies = document.querySelectorAll(
      ".MainSectionItem-innerSticky",
    );
    const mediaContainers = document.querySelectorAll(
      ".MainSectionItem-mediaContainer",
    );
    const mediaContainersInner = document.querySelectorAll(
      ".MainSectionItem-mediaContainerInner",
    );
    const medias = document.querySelectorAll(".MainSectionItem-media");
    const headerTitle = document.querySelector(".MainSection-headerTitle");

    medias.forEach((media) => {
      gsap.set(media, { aspectRatio: 1.3793103448275863 });
    });

    // let splitheaderTitle = SplitText.create(headerTitle, { type: 'chars, words', charsClass: 'chars' })
    // gsap.from(splitheaderTitle.chars, {
    //   y: 50,
    //   opacity: 0,
    //   transformOrigin: '0% 50% -50',
    //   stagger: 0.05,
    //   duration: 2,
    //   ease: 'none',
    //   onComplete: () => {
    //     headerTitle.removeAttribute('aria-hidden')
    //   }
    // })

    let mm = gsap.matchMedia();

    mm.add("(max-width: 1439px)", () => {
      gsap.set(items, { clearProps: "all" });
      gsap.set(innerItems, { clearProps: "all" });
      gsap.set(mediaContainers, { clearProps: "all" });
      gsap.set(mediaContainersInner, { clearProps: "all" });

      const mobile = gsap.context(() => {
innerStickies.forEach((item, i) => {
  const section = item.closest(".MainSectionItem");
  const isLast = i === innerStickies.length - 1;

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    endTrigger: isLast
      ? section
      : innerStickies[i + 1].closest(".MainSectionItem"),
    end: isLast ? "+=" + window.innerHeight * 1.5 : "top top",
    pin: item,
    pinSpacing: false,
    invalidateOnRefresh: true,
   
  });
});
      }, itemsContainer.current);
      return () => mobile.revert();
    });

    mm.add("(min-width: 1440px)", () => {
      gsap.set(items, { clearProps: "all" });
      gsap.set(innerItems, { clearProps: "all" });
      gsap.set(mediaContainers, { clearProps: "all" });
      gsap.set(mediaContainersInner, { clearProps: "all" });

      const desktop = gsap.context(() => {
        let tl = gsap.timeline({
          scrollTrigger: {
            trigger: mainSection.current,
            start: "top top",
            end: `+=${items.length * 100}%`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            markers: false,
          },
          defaults: { ease: "none" },
        });

        // --- Phase 1 ---
        tl.addLabel("phase-1");
        tl.fromTo(items[0], { xPercent: 0 }, { xPercent: -100 });
        tl.fromTo(innerItems[0], { xPercent: 0 }, { xPercent: 100 }, "<");
        tl.fromTo(
          mediaContainers[0],
          { xPercent: -60, scale: 1 },
          {
            xPercent: -150,
            scale: 0.8,
            duration: 0.6,
          },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[0],
          { xPercent: 0, scale: 1, transformOrigin: "50% 50% 0px" },
          { xPercent: -150, scale: 1.2 },
          "<",
        );
        tl.fromTo(items[1], { xPercent: 80 }, { xPercent: 0 }, "<");
        tl.fromTo(innerItems[1], { xPercent: -80 }, { xPercent: 0 }, "<");
        tl.fromTo(
          mediaContainers[1],
          { xPercent: -15, scale: 0.45, transformOrigin: "100% 100% 0px" },
          {
            xPercent: -60,
            scale: 1.0,
            duration: 0.5,
          },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[1],
          { scale: 1.55, transformOrigin: "50% 50% 0px" },
          { scale: 1.0 },
          "<",
        );
        tl.fromTo(items[2], { xPercent: 95 }, { xPercent: 80 }, "<");
        tl.fromTo(innerItems[2], { xPercent: -95 }, { xPercent: -80 }, "<");
        tl.fromTo(
          mediaContainers[2],
          { xPercent: 0, scale: 0.15, transformOrigin: "100% 100% 0px" },
          { xPercent: -15, scale: 0.45 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[2],
          { scale: 1.85, transformOrigin: "50% 50% 0px" },
          { scale: 1.55 },
          "<",
        );
        tl.fromTo(items[3], { xPercent: 100 }, { xPercent: 95 }, "<");
        tl.fromTo(innerItems[3], { xPercent: -100 }, { xPercent: -95 }, "<");
        tl.fromTo(
          mediaContainers[3],
          { scale: 0, transformOrigin: "100% 100% 0px" },
          { scale: 0.15 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[3],
          { scale: 2, transformOrigin: "50% 50% 0px" },
          { scale: 1.85 },
          "<",
        );

        // --- Phase 2 (starts AFTER phase 1 finishes) ---
        tl.addLabel("phase-2", ">");
        tl.fromTo(items[1], { xPercent: 0 }, { xPercent: -100 });
        tl.fromTo(innerItems[1], { xPercent: 0 }, { xPercent: 100 }, "<");
        tl.fromTo(
          mediaContainers[1],
          { xPercent: -60, scale: 1.0, transformOrigin: "100% 100% 0px" },
          { xPercent: -150, scale: 0.8, duration: 0.6 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[1],
          { scale: 1.0, transformOrigin: "50% 50% 0px" },
          { scale: 1.2, duration: 0.55 },
          "<",
        );
        tl.fromTo(items[2], { xPercent: 80 }, { xPercent: 0 }, "<");
        tl.fromTo(innerItems[2], { xPercent: -80 }, { xPercent: 0 }, "<");
        tl.fromTo(
          mediaContainers[2],
          { xPercent: -15, scale: 0.45, transformOrigin: "100% 100% 0px" },
          { xPercent: -60, scale: 1.0 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[2],
          { scale: 1.55, transformOrigin: "50% 50% 0px" },
          { scale: 1.0 },
          "<",
        );
        tl.fromTo(items[3], { xPercent: 95 }, { xPercent: 80 }, "<");
        tl.fromTo(innerItems[3], { xPercent: -95 }, { xPercent: -80 }, "<");
        tl.fromTo(
          mediaContainers[3],
          { xPercent: 0, scale: 0.15, transformOrigin: "100% 100% 0px" },
          { xPercent: -15, scale: 0.45 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[3],
          { scale: 1.85, transformOrigin: "50% 50% 0px" },
          { scale: 1.55 },
          "<",
        );
        tl.fromTo(items[4], { xPercent: 100 }, { xPercent: 95 }, "<");
        tl.fromTo(innerItems[4], { xPercent: -100 }, { xPercent: -95 }, "<");
        tl.fromTo(
          mediaContainers[4],
          { scale: 0, transformOrigin: "100% 100% 0px" },
          { scale: 0.15 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[4],
          { scale: 2, transformOrigin: "50% 50% 0px" },
          { scale: 1.85 },
          "<",
        );

        // --- Phase 3 (starts AFTER phase 2 finishes) ---
        tl.addLabel("phase-3", ">");
        tl.fromTo(items[2], { xPercent: 0 }, { xPercent: -100 });
        tl.fromTo(innerItems[2], { xPercent: 0 }, { xPercent: 100 }, "<");
        tl.fromTo(
          mediaContainers[2],
          { xPercent: -60, scale: 1.0, transformOrigin: "100% 100% 0px" },
          { xPercent: -150, scale: 0.8, duration: 0.55 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[2],
          { scale: 1.0, transformOrigin: "50% 50% 0px" },
          { scale: 1.2, duration: 0.5 },
          "<",
        );
        tl.fromTo(items[3], { xPercent: 80 }, { xPercent: 0 }, "<");
        tl.fromTo(innerItems[3], { xPercent: -80 }, { xPercent: 0 }, "<");
        tl.fromTo(
          mediaContainers[3],
          { xPercent: -15, scale: 0.45, transformOrigin: "100% 100% 0px" },
          { xPercent: -60, scale: 1.0 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[3],
          { scale: 1.55, transformOrigin: "50% 50% 0px" },
          { scale: 1.0 },
          "<",
        );
        tl.fromTo(items[4], { xPercent: 95 }, { xPercent: 80 }, "<");
        tl.fromTo(innerItems[4], { xPercent: -95 }, { xPercent: -80 }, "<");
        tl.fromTo(
          mediaContainers[4],
          { scale: 0.15, transformOrigin: "100% 100% 0px" },
          { scale: 0.6 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[4],
          { scale: 1.85, transformOrigin: "50% 50% 0px" },
          { scale: 1.55 },
          "<",
        );

        // --- Phase 4 (starts AFTER phase 3 finishes) ---
        tl.addLabel("phase-4", ">");
        tl.fromTo(items[3], { xPercent: 0 }, { xPercent: -100 });
        tl.fromTo(innerItems[3], { xPercent: 0 }, { xPercent: 100 }, "<");
        tl.fromTo(
          mediaContainers[3],
          { xPercent: -60, scale: 1.0, transformOrigin: "100% 100% 0px" },
          { xPercent: -150, scale: 0.8, duration: 0.55 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[3],
          { scale: 1.0, transformOrigin: "50% 50% 0px" },
          { scale: 1.2, duration: 0.5 },
          "<",
        );
        tl.fromTo(items[4], { xPercent: 80 }, { xPercent: 0 }, "<");
        tl.fromTo(innerItems[4], { xPercent: -80 }, { xPercent: 0 }, "<");
        tl.fromTo(
          mediaContainers[4],
          { xPercent: 0, scale: 0.6, transformOrigin: "100% 100% 0px" },
          { xPercent: -60, scale: 1.0 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[4],
          { scale: 1.55, transformOrigin: "50% 50% 0px" },
          { scale: 1.0 },
          "<",
        );
      }, mainSection.current);
      return () => desktop.revert();
    });

    return () => mm.revert();
  }, []);

  return (
    <div className="AdultOrthodontics">
      <div
        ref={mainSection}
        className="MainSection"
        style={{ backgroundColor: "var(--blue)" }}
      >
        <div className="MainSection-wrapper">
          <div className="MainSection-header">
            <div className="w-full flex justify-center items-center min-[1440px]:justify-start relative">
              <div className="absolute inset-0 flex justify-center items-start min-[1440px]:justify-start">
                <SlidingText
                  text="Adult Orthodontics"
                  totalCells={8}
                  className="block font-lg font-canelathin translate-y-6 min-[1440px]:translate-y-0"
                />
              </div>
            </div>
          </div>
          <div ref={itemsContainer} className="MainSection-items">
            <section className="MainSectionItem MainSection-item">
             <div className="--inner-first MainSectionItem-inner">
                <div className="MainSectionItem-innerSticky">
                  <div
                    className="MainSectionItem-background"
                    style={{ backgroundColor: "var(--golden)" }}
                  />
                  <div className="MainSectionItem-content">
                    <div className="MainSectionItem-contentTitle">
                      <span className="MainSectionItem-index font-neuehaas45">
                        01
                      </span>
                      <h3>Who do we treat?</h3>
                    </div>
                    <div className="MainSectionItem-contentText">
                      <p>
                        Whether you've had orthodontic treatment before or are
                        exploring it for the first time, we're here to help you
                        achieve your goals. It is true - our most remarkable
                        results happen with growing children and adolescents. We
                        have also successfully treated the most severe adult
                        cases alongside those experiencing basic orthodontic
                        relapse. Invisalign allows us to treat patients with
                        periodontal concerns—including tissue loss and
                        compromised bone support—with greater precision than
                        braces
                      </p>
                    </div>
                  </div>
                  <div className="MainSectionItem-mediaContainer">
                    <div className="MainSectionItem-mediaContainerInner">
                      <div className="MainSectionItem-media image-wrapper">
                        <img
                          src="/images/1920x10805.png"
                          alt="adult"
                          loading="lazy"
                          className="profile-image"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="MainSectionItem MainSection-item">
              <div className="--inner-between MainSectionItem-inner">
                <div className="MainSectionItem-innerSticky">
                  <div
                    className="MainSectionItem-background"
                    style={{ backgroundColor: "var(--dream)" }}
                  />
                  <div className="MainSectionItem-content">
                    <div className="MainSectionItem-contentTitle">
                      <span className="MainSectionItem-index font-neuehaas45">
                        02
                      </span>
                      <h3>Accelerated Movement</h3>
                    </div>
                    <div className="MainSectionItem-contentText">
                      <p>
                        We're proud to be the first practice in the area to
                        focus on accelerated adult orthodontics, we've trialed
                        extensive bio-optimization technologies and settled on
                        light therapy as our first choice to optimize tooth
                        movement in mature bone. Our doctors have trained
                        extensively with leaders in TAD-assisted orthodontics
                        (Temporary Anchorage Devices) and routinely design
                        non-surgical treatment plans for patients seeking
                        alternatives to orthognathic surgery.
                      </p>
                    </div>
                  </div>
                  <div className="MainSectionItem-mediaContainer">
                    <div className="MainSectionItem-mediaContainerInner">
                      <div className="MainSectionItem-media image-wrapper">
                        <img
                          src="/images/nasionanolines.png"
                          alt="Facial silhouette"
                          loading="lazy"
                          className="profile-image"
                        />
                        <svg
                          className="overlay-lines"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          {/* Frankfort horizontal plane */}
                          <line
                            x1="13"
                            y1="52"
                            x2="78"
                            y2="44"
                            stroke="#ffffff80"
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            strokeDasharray="2 3"
                            vectorEffect="non-scaling-stroke"
                          />
                          {/* Vertical line */}
                          <line
                            x1="65"
                            y1="29"
                            x2="67"
                            y2="82"
                            stroke="#ffffff80"
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            stroke-dasharray="2 3"
                            vectorEffect="non-scaling-stroke"
                          />

                          {/* Long diagonal */}
                          <line
                            x1="14"
                            y1="50"
                            x2="72"
                            y2="75"
                            stroke="#ffffff80"
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            stroke-dasharray="2 3"
                            vectorEffect="non-scaling-stroke"
                          />

                          {/* Upper horizontal */}
                          {/* <line
                            x1="55" y1="31"
                            x2="74" y2="31"
                            stroke="#ffffff80"
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            stroke-dasharray="2 3"
                            vectorEffect="non-scaling-stroke"
                          /> */}

                          {/* Lower horizontal */}
                          <line
                            x1="46"
                            y1="54"
                            x2="74"
                            y2="58"
                            stroke="#ffffff80"
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            stroke-dasharray="2 3"
                            vectorEffect="non-scaling-stroke"
                          />

                          <line
                            x1="75.5"
                            y1="42"
                            x2="76"
                            y2="78"
                            stroke="#ffffff80"
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            stroke-dasharray="2 3"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="MainSectionItem MainSection-item">
<div className="--inner-between MainSectionItem-inner">
                <div className="MainSectionItem-innerSticky">
                  <div
                    className="MainSectionItem-background"
                    style={{ backgroundColor: "var(--signal)" }}
                  />
                  <div className="MainSectionItem-content">
                    <div className="MainSectionItem-contentTitle">
                      <span className="MainSectionItem-index font-neuehaas45">
                        03
                      </span>
                      <h3>Coordinated Care</h3>
                    </div>
                    <div className="MainSectionItem-contentText">
                      <p>
                        No referral is needed to consult with us. From your
                        first visit, you’ll be paired with a dedicated treatment
                        coordinator—your point person for everything from
                        scheduling to financial planning. If you don’t already
                        have a dentist, we’ll help you find one. And when
                        treatment involves additional specialists, we guide you
                        toward trusted providers and coordinate care on your
                        behalf. When jaw surgery is part of the plan, we work
                        closely with the region’s leading oral and maxillofacial
                        surgeons to ensure continuity and precision. Exceptional
                        care is always a collaborative effort.
                      </p>
                    </div>
                  </div>
                  <div className="MainSectionItem-mediaContainer">
                    <div className="MainSectionItem-mediaContainerInner">
                      <div className="MainSectionItem-media">
                        <video
                          src="/videos/SC1.mp4"
                          alt="Video of computer"
                          loading="lazy"
                          loop
                          autoPlay
                          muted
                          playsInline
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="MainSectionItem MainSection-item">
<div className="--inner-between MainSectionItem-inner">
                <div className="MainSectionItem-innerSticky">
                  <div
                    className="MainSectionItem-background"
                    style={{ backgroundColor: "var(--soft)" }}
                  />
                  <div className="MainSectionItem-content">
                    <div className="MainSectionItem-contentTitle">
                      <span className="MainSectionItem-index font-neuehaas45">
                        04
                      </span>
                      <h3>Our Philosophy</h3>
                    </div>
                    <div className="MainSectionItem-contentText">
                      <p>
                        Our approach to orthodontics has always been rooted in
                        understanding how bone structure, dental positioning,
                        and soft tissue interact to shape the face—not just in
                        growing faces, but in aging ones too. Our doctors bring
                        a natural appreciation for facial aesthetics to patient care. Shaped by
                        their orthodontic training and clinical expertise, Doctors Gregg and Daniel Frey.
                      </p>
                    </div>
                  </div>
                  <div className="MainSectionItem-mediaContainer">
                    <div className="MainSectionItem-mediaContainerInner">
                      <div className="MainSectionItem-media">
                        <img
                          src="/images/tabletfacelineart.png"
                          alt="tablet"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="MainSectionItem --bg-fog MainSection-item">
<div className="--inner-last MainSectionItem-inner">
                <div className="MainSectionItem-innerSticky">
                  <div
                    className="MainSectionItem-background"
                    style={{ backgroundColor: "var(--fog)" }}
                  />
                  <div className="MainSectionItem-content">
                    <div className="MainSectionItem-contentTitle">
                      <span className="MainSectionItem-index font-neuehaas45">
                        05
                      </span>
                      <h3>AAFE</h3>
                    </div>
                    <div className="MainSectionItem-contentText">
                      <p>
                        We approach cosmetic treatment as doctors that have
                        completed training with the American Academy of Facial
                        Esthetics (AAFE). We minimize reliance on overfilling and
                        support outcomes that look natural and require less
                        upkeep. Our doctors are actively pursuing fellowship-level training,
                        offering Botox and dermal fillers as part of a
                        comprehensive, structure-first approach to facial
                        aesthetics.
                      </p>
                    </div>
                  </div>
                  <div className="MainSectionItem-mediaContainer">
                    <div className="MainSectionItem-mediaContainerInner">
                      <div className="MainSectionItem-media">
                        <img
                          src="/images/aafe.png"
                          alt="aafe card"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
