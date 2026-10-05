"use client";
import "./style.css";
import { useEffect, useRef, useState, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

const SlidingText = ({ text = "DEFAULT", totalCells = 8, className = "" }) => {
  const containerRef = useRef(null);
  const innerRefs = useRef([]);
  const hasInitialized = useRef(false);

  useLayoutEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const container = containerRef.current;
    const inners = innerRefs.current;

    if (!container || !inners.length) return;

    const measureText = (sampleEl) => {
      const temp = document.createElement("span");
      const styles = window.getComputedStyle(sampleEl);

      Object.assign(temp.style, {
        position: "absolute",
        visibility: "hidden",
        whiteSpace: "nowrap",
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        letterSpacing: styles.letterSpacing,
        fontWeight: styles.fontWeight,
      });

      temp.innerText = text;
      document.body.appendChild(temp);

      const width = temp.getBoundingClientRect().width;
      document.body.removeChild(temp);

      return width * 1.2;
    };

    const layout = () => {
      const width = measureText(inners[0]);
      const offset = width / totalCells;

      container.style.setProperty("--text-width", `${width}px`);
      container.style.setProperty("--gsplits", totalCells);
      container.style.setProperty("--offset", `${offset}px`);

      inners.forEach((el, i) => {
        gsap.set(el, {
          x: -i * offset,
          opacity: 0,
        });
      });

      animate(width, offset);
    };

    const animate = (width, offset) => {
      gsap.killTweensOf(inners);

      gsap.fromTo(
        inners,
        {
          x: (i) => {
            const base = -i * offset;
            const jitter =
              (i % 2 === 0 ? -1 : 1) * (width * 0.15);
            return base + jitter;
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
            container.style.visibility = "visible";
          },
        }
      );
    };

    const run = () => {
      container.style.visibility = "hidden";
      requestAnimationFrame(layout);
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(run);
    } else {
      run();
    }

    const handleResize = () => {
      requestAnimationFrame(layout);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [text, totalCells]);

  return (
    <div
      ref={containerRef}
      className={`gtext ${className}`}
      style={{
        visibility: "hidden",
        position: "relative",
      }}
    >
      {Array.from({ length: totalCells }).map((_, i) => (
        <span key={i} className="gtext__box">
          <span
            className="gtext__box-inner"
            ref={(el) => (innerRefs.current[i] = el)}
          >
            {text}
          </span>
        </span>
      ))}
    </div>
  );
};

export default function EarlyOrthodontics() {
  
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

  let mm = gsap.matchMedia();
  let resizeObserver;

mm.add("(max-width: 1439px)", () => {
  gsap.set(items, { clearProps: "all" });
  gsap.set(innerItems, { clearProps: "all" });
  gsap.set(mediaContainers, { clearProps: "all" });
  gsap.set(mediaContainersInner, { clearProps: "all" });
ScrollTrigger.normalizeScroll(true);
  const mobile = gsap.context(() => {

    innerStickies.forEach((item, i) => {
      const section = item.closest(".MainSectionItem");
      const isLast = i === innerStickies.length - 1;

ScrollTrigger.create({
  trigger: section,
  start: "top top",
  end: isLast ? "+=100%" : "+=100%",

  pin: item,
  pinSpacing: false,
  scrub: true,
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
          { xPercent: -60, scale: 1, transformOrigin: "100% 100% 0px" },
          { xPercent: -150, scale: 0.8, duration: 0.55 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[0],
          { xPercent: 0, scale: 1, transformOrigin: "50% 50% 0px" },
          { xPercent: -150, scale: 1.2, duration: 0.5 },
          "<",
        );
        tl.fromTo(items[1], { xPercent: 80 }, { xPercent: 0 }, "<");
        tl.fromTo(innerItems[1], { xPercent: -80 }, { xPercent: 0 }, "<");
        tl.fromTo(
          mediaContainers[1],
          { xPercent: -15, scale: 0.45, transformOrigin: "100% 100% 0px" },
          { xPercent: -60, scale: 1.0 },
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

        // --- Phase 2 ---
        tl.addLabel("phase-2", ">");
        tl.fromTo(items[1], { xPercent: 0 }, { xPercent: -100 });
        tl.fromTo(innerItems[1], { xPercent: 0 }, { xPercent: 100 }, "<");
        tl.fromTo(
          mediaContainers[1],
          { xPercent: -60, scale: 1.0, transformOrigin: "100% 100% 0px" },
          { xPercent: -150, scale: 0.8, duration: 0.55 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[1],
          { scale: 1.0, transformOrigin: "50% 50% 0px" },
          { scale: 1.2, duration: 0.5 },
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

        // --- Phase 3 ---
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
          { xPercent: 0, scale: 0.15, transformOrigin: "100% 100% 0px" },
          { xPercent: -15, scale: 0.45 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[4],
          { scale: 1.85, transformOrigin: "50% 50% 0px" },
          { scale: 1.55 },
          "<",
        );
        tl.fromTo(items[5], { xPercent: 100 }, { xPercent: 95 }, "<");
        tl.fromTo(innerItems[5], { xPercent: -100 }, { xPercent: -95 }, "<");
        tl.fromTo(
          mediaContainers[5],
          { scale: 0, transformOrigin: "100% 100% 0px" },
          { scale: 0.15 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[5],
          { scale: 2, transformOrigin: "50% 50% 0px" },
          { scale: 1.85 },
          "<",
        );

        // --- Phase 4 ---
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
          { xPercent: -15, scale: 0.45, transformOrigin: "100% 100% 0px" },
          { xPercent: -60, scale: 1.0 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[4],
          { scale: 1.55, transformOrigin: "50% 50% 0px" },
          { scale: 1.0 },
          "<",
        );
        tl.fromTo(items[5], { xPercent: 95 }, { xPercent: 80 }, "<");
        tl.fromTo(innerItems[5], { xPercent: -95 }, { xPercent: -80 }, "<");
        tl.fromTo(
          mediaContainers[5],
          { scale: 0.15, transformOrigin: "100% 100% 0px" },
          { scale: 0.6 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[5],
          { scale: 1.85, transformOrigin: "50% 50% 0px" },
          { scale: 1.55 },
          "<",
        );

        // --- Phase 5 ---
        tl.addLabel("phase-5", ">");
        tl.fromTo(items[4], { xPercent: 0 }, { xPercent: -100 });
        tl.fromTo(innerItems[4], { xPercent: 0 }, { xPercent: 100 }, "<");
        tl.fromTo(
          mediaContainers[4],
          { xPercent: -60, scale: 1.0, transformOrigin: "100% 100% 0px" },
          { xPercent: -150, scale: 0.8, duration: 0.55 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[4],
          { scale: 1.0, transformOrigin: "50% 50% 0px" },
          { scale: 1.2, duration: 0.5 },
          "<",
        );
        tl.fromTo(items[5], { xPercent: 80 }, { xPercent: 0 }, "<");
        tl.fromTo(innerItems[5], { xPercent: -80 }, { xPercent: 0 }, "<");
        tl.fromTo(
          mediaContainers[5],
          { xPercent: 0, scale: 0.6, transformOrigin: "100% 100% 0px" },
          { xPercent: -60, scale: 1.0 },
          "<",
        );
        tl.fromTo(
          mediaContainersInner[5],
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
    <div className="EarlyOrthodontics">
      <div
        ref={mainSection}
        className="MainSection"
        style={{ backgroundColor: "var(--white)" }}
      >
        <div className="MainSection-wrapper">
          <div className="MainSection-header">
            <div className="w-full flex justify-center items-center min-[1440px]:justify-start">
              <SlidingText
                text="Early Orthodontics"
                // effect="2"
                totalCells={8}
                className="block font-lg font-canelathin translate-y-6 min-[1440px]:translate-y-0 text-center min-[1440px]:text-left"
              />
            </div>
          </div>
          <div ref={itemsContainer} className="MainSection-items">
            <section className="MainSectionItem MainSection-item">
              <div className="--inner-first MainSectionItem-inner">
                <div className="MainSectionItem-innerSticky">
                  <div
                    className="MainSectionItem-background"
                    style={{ backgroundColor: "var(--white)" }}
                  />
                  <div className="MainSectionItem-content">
                    <div className="MainSectionItem-contentTitle">
                      <span className="MainSectionItem-index font-neuehaas45">
                        01
                      </span>
                      <h3>Smart to Start</h3>
                    </div>
                    <div className="MainSectionItem-contentText">
                      <p>
                        Our doctors—as well as the American Association of
                        Orthodontists—recommend an initial orthodontic screening
                        at around age 7. At this stage, 3D imaging is used to
                        evaluate the developing bite and predict the trajectory
                        of permanent teeth. It also helps identify issues such
                        as supernumerary (extra) or missing teeth, assess airway
                        development (including risk factors for sleep apnea),
                        and detect jaw growth discrepancies. Habit reduction is also a part of early treatment. Obstructive habits
                        like thumb sucking, lip biting, tongue thrusting, or early
                        malocclusion can be addressed to support optimal
                        jaw and airway development.
                      </p>
                    </div>
                  </div>
                  <div className="MainSectionItem-mediaContainer">
                    <div className="MainSectionItem-mediaContainerInner">
                      <div className="MainSectionItem-media">
                        <img
                          src="/images/7milestone.png"
                          alt="manual"
                          loading="lazy"
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
                    style={{ backgroundColor: "var(--purple)" }}
                  />
                  <div className="MainSectionItem-content">
                    <div className="MainSectionItem-contentTitle">
                      <span className="MainSectionItem-index font-neuehaas45">
                        02
                      </span>
                      <h3>Lucky Number 7</h3>
                    </div>
                    <div className="MainSectionItem-contentText">
                      <p>
                        Key dental landmarks are typically in place: the
                        permanent first molars should be positioned in the dental
                        arches, and almost all four upper and lower (eight total)
                        permanent incisors are either fully erupted or close to
                        erupting. These markers allow our doctors to accurately
                        assess the width of the arches, the front-to-back
                        jaw positioning, and identify any crossbites. This is also the stage when significant arch
                        length deficiencies (crowding) can be detected, giving us the
                        chance to intervene and provide room for all
                        permanent teeth. 
                      </p>
                    </div>
                  </div>
                  <div className="MainSectionItem-mediaContainer">
                    <div className="MainSectionItem-mediaContainerInner">
                      <div className="MainSectionItem-media image-wrapper">
                        <img
                          src="/images/childsideprofile5.png"
                          alt="Facial silhouette"
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
                    style={{ backgroundColor: "var(--brightgreen)" }}
                  />
                  <div className="MainSectionItem-content">
                    <div className="MainSectionItem-contentTitle">
                      <span className="MainSectionItem-index font-neuehaas45">
                        03
                      </span>
                      <h3>The Airway Equation</h3>
                    </div>
                    <div className="MainSectionItem-contentText">
                      <p>
                        We assess the airway and surrounding
                        structures—including the tonsils—as part of every
                        evaluation. Using advanced 3D imaging and specialized
                        training, our doctors design treatment plans that
                        support optimal airway development and function. Token orthodontic treatment planning can overlook the root cause of airway constriction. Whether we're your first consultation
                        or you've already had one, a second opinion is
                        always welcomed.
                      </p>
                    </div>
                  </div>
                  <div className="MainSectionItem-mediaContainer">
                    <div className="MainSectionItem-mediaContainerInner">
                      <div className="MainSectionItem-media">
                        <img
                          src="/images/airwayequation.png"
                          alt="shot of child sitting"
                          loading="lazy"
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
                    style={{ backgroundColor: "var(--eggshellgrey)" }}
                  />
                  <div className="MainSectionItem-content">
                    <div className="MainSectionItem-contentTitle">
                      <span className="MainSectionItem-index font-neuehaas45">
                        04
                      </span>
                      <h3>Future-Proof</h3>
                    </div>
                    <div className="MainSectionItem-contentText">
                      <p>
                        Once you visit us, we take care of the rest. If no
                        treatment is needed right away, we'll place your child
                        on a customized Growth & Guidance schedule—our way of
                        future-proofing their smile and their youthfulness.{" "}
                      </p>
                    </div>
                  </div>
                  <div className="MainSectionItem-mediaContainer">
                    <div className="MainSectionItem-mediaContainerInner">
                      <div className="MainSectionItem-media">
                        <img
                          src="/images/ffscard.jpg"
                          alt="future smiles"
                          loading="lazy"
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
                    style={{ backgroundColor: "var(--hotpink)" }}
                  />

                  <div className="MainSectionItem-content">
                    <div className="MainSectionItem-contentTitle">
                      <span className="MainSectionItem-index font-neuehaas45">
                        05
                      </span>
                      <h3>Interceptive Treatment</h3>
                    </div>
                    <div className="MainSectionItem-contentText">
                      <p>
                        Timely intervention makes it possible to manage many
                        cases seamlessly. Early Orthodontic treatment with us
                        guides tooth alignment and growth. Orthodontic
                        appliances do in fact function as a protection in the
                        case of facial trauma - not to mention Invisalign is a
                        great mouthguard for sports. Through proactive,
                        individualized treatment we're able to minimize
                        appointments, improve oral hygiene and habits, reduce
                        enamel damage, and help patients avoid the burden of
                        bulky appliances during life’s special moments.
                      </p>
                    </div>
                  </div>
                  <div className="MainSectionItem-mediaContainer">
                    <div className="MainSectionItem-mediaContainerInner">
                      <div className="MainSectionItem-media">
                        <video
                          src="/videos/luckynumber7.mp4"
                          alt="7 year old"
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                        />

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="MainSectionItem --bg-terra MainSection-item">
              <div className="--inner-last MainSectionItem-inner">
                <div className="MainSectionItem-innerSticky">
                  <div
                    className="MainSectionItem-background"
                    style={{ backgroundColor: "var(--terra)" }}
                  />
                  <div className="MainSectionItem-content">
                    <div className="MainSectionItem-contentTitle">
                      <span className="MainSectionItem-index font-neuehaas45">
                        05
                      </span>
                      <h3>Early Is Still Now</h3>
                    </div>
                    <div className="MainSectionItem-contentText">
                      <p>
                        Early visits build familiarity with our doctors and team
                        and often leads to better compliance and the best
                        treatment experience. Even if no treatment is needed
                        right away, that first screening sets the stage for
                        better results later. Think of it as laying the
                        groundwork—not just for a great smile, but for a
                        positive experience along the way.
                      </p>
                    </div>
                  </div>
                  <div className="MainSectionItem-mediaContainer">
                    <div className="MainSectionItem-mediaContainerInner">
                      <div className="MainSectionItem-media">
                        <video
                          src="/videos/alwayslookingahead.mp4"
                          alt="landscape"
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
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
