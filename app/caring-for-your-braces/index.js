"use client";
import "./style.css";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

export default function Page() {
  const mainSection = useRef(null);
  const itemsContainer = useRef(null);

  useEffect(() => {
    const items = document.querySelectorAll(".MainSectionItem");
    const innerItems = document.querySelectorAll(".MainSectionItem-inner");
    const innerStickies = document.querySelectorAll(
      ".MainSectionItem-innerSticky"
    );
    const imageContainers = document.querySelectorAll(
      ".MainSectionItem-imageContainer"
    );
    const imageContainersInner = document.querySelectorAll(
      ".MainSectionItem-imageContainerInner"
    );
    const images = document.querySelectorAll(".MainSectionItem-image");
    const headTitle = document.querySelector(".MainSection-headTitle");
    const navItemTitles = document.querySelectorAll(
      ".MainSection-navItemTitle"
    );
    const navProgressBar = document.querySelectorAll(
      ".MainSection-navProgressBar"
    );

    navItemTitles.forEach((item, i) => {
      gsap.set(item, {
        translate: "none",
        rotate: "none",
        scale: "none",
        transform: "translate3d(0px, 5rem, 0px)",
      });
    });

    images.forEach((image, i) => {
      gsap.set(image, { aspectRatio: 1.3793103448275863 });
    });

    let splitheadTitle = SplitText.create(headTitle, {
      type: "chars, words",
      charsClass: "chars",
    });
    gsap.from(splitheadTitle.chars, {
      y: 50,
      opacity: 0,
      transformOrigin: "0% 50% -50",
      stagger: 0.05,
      duration: 2,
      ease: "none",
      onComplete: () => {
        headTitle.removeAttribute("aria-hidden");
      },
    });

    let mm = gsap.matchMedia();

    mm.add("(max-width: 1079px)", () => {
      const mobile = gsap.context(() => {
        innerStickies.forEach((item, i) => {
          ScrollTrigger.create({
            trigger: item,
            start:
              item.offsetHeight < window.innerHeight
                ? "top top"
                : "bottom bottom",
            endTrigger: innerStickies[i + 1],
            end: "top top",
            pin: true,
            pinSpacing: false,
            invalidateOnRefresh: true,
            markers: false,
          });
        });
      }, itemsContainer.current);
      return () => mobile.revert();
    });

    mm.add("(min-width: 1080px)", () => {
      const desktop = gsap.context(() => {
        let tl = gsap.timeline({
          scrollTrigger: {
            trigger: mainSection.current,
            start: "top top",
            end: `+=${items.length * 100}%`,
            pin: true,
            scrub: 1, // true
            invalidateOnRefresh: true,
            markers: false,
          },
          defaults: { ease: "none" },
        });

        tl.add(() => {
          tl.addLabel("progress-bar");
          tl.fromTo(
            navProgressBar,
            { xPercent: -85 },
            { xPercent: 0, duration: tl.duration(), ease: "none" },
            0
          );
        });

        // --- Phase 1 ---
        tl.addLabel("phase-1");
        tl.fromTo(items[0], { xPercent: 0 }, { xPercent: -100 });
        tl.fromTo(innerItems[0], { xPercent: 0 }, { xPercent: 100 }, "<");
        tl.fromTo(
          imageContainers[0],
          { xPercent: -60, scale: 1, transformOrigin: "100% 100% 0px" },
          { xPercent: -150, scale: 0.8 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[0],
          { xPercent: 0, scale: 1, transformOrigin: "50% 50% 0px" },
          { xPercent: -150, scale: 1.2 },
          "<"
        );
        tl.fromTo(items[1], { xPercent: 80 }, { xPercent: 0 }, "<");
        tl.fromTo(innerItems[1], { xPercent: -80 }, { xPercent: 0 }, "<");
        tl.fromTo(
          imageContainers[1],
          { xPercent: -15, scale: 0.45, transformOrigin: "100% 100% 0px" },
          { xPercent: -60, scale: 1.0 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[1],
          { scale: 1.55, transformOrigin: "50% 50% 0px" },
          { scale: 1.0 },
          "<"
        );
        tl.fromTo(items[2], { xPercent: 95 }, { xPercent: 80 }, "<");
        tl.fromTo(innerItems[2], { xPercent: -95 }, { xPercent: -80 }, "<");
        tl.fromTo(
          imageContainers[2],
          { xPercent: 0, scale: 0.15, transformOrigin: "100% 100% 0px" },
          { xPercent: -15, scale: 0.45 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[2],
          { scale: 1.85, transformOrigin: "50% 50% 0px" },
          { scale: 1.55 },
          "<"
        );
        tl.fromTo(items[3], { xPercent: 100 }, { xPercent: 95 }, "<");
        tl.fromTo(innerItems[3], { xPercent: -100 }, { xPercent: -95 }, "<");
        tl.fromTo(
          imageContainers[3],
          { scale: 0, transformOrigin: "100% 100% 0px" },
          { scale: 0.15 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[3],
          { scale: 2, transformOrigin: "50% 50% 0px" },
          { scale: 1.85 },
          "<"
        );

        // --- Phase 2 (starts AFTER phase 1 finishes) ---
        tl.addLabel("phase-2", ">");
        tl.fromTo(items[1], { xPercent: 0 }, { xPercent: -100 });
        tl.fromTo(innerItems[1], { xPercent: 0 }, { xPercent: 100 }, "<");
        tl.fromTo(
          imageContainers[1],
          { xPercent: -60, scale: 1.0, transformOrigin: "100% 100% 0px" },
          { xPercent: -150, scale: 0.8 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[1],
          { scale: 1.0, transformOrigin: "50% 50% 0px" },
          { scale: 1.2 },
          "<"
        );
        tl.fromTo(items[2], { xPercent: 80 }, { xPercent: 0 }, "<");
        tl.fromTo(innerItems[2], { xPercent: -80 }, { xPercent: 0 }, "<");
        tl.fromTo(
          imageContainers[2],
          { xPercent: -15, scale: 0.45, transformOrigin: "100% 100% 0px" },
          { xPercent: -60, scale: 1.0 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[2],
          { scale: 1.55, transformOrigin: "50% 50% 0px" },
          { scale: 1.0 },
          "<"
        );
        tl.fromTo(items[3], { xPercent: 95 }, { xPercent: 80 }, "<");
        tl.fromTo(innerItems[3], { xPercent: -95 }, { xPercent: -80 }, "<");
        tl.fromTo(
          imageContainers[3],
          { xPercent: 0, scale: 0.15, transformOrigin: "100% 100% 0px" },
          { xPercent: -15, scale: 0.45 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[3],
          { scale: 1.85, transformOrigin: "50% 50% 0px" },
          { scale: 1.55 },
          "<"
        );
        tl.fromTo(items[4], { xPercent: 100 }, { xPercent: 95 }, "<");
        tl.fromTo(innerItems[4], { xPercent: -100 }, { xPercent: -95 }, "<");
        tl.fromTo(
          imageContainers[4],
          { scale: 0, transformOrigin: "100% 100% 0px" },
          { scale: 0.15 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[4],
          { scale: 2, transformOrigin: "50% 50% 0px" },
          { scale: 1.85 },
          "<"
        );

        // --- Phase 3 (starts AFTER phase 2 finishes) ---
        tl.addLabel("phase-3", ">");
        tl.fromTo(items[2], { xPercent: 0 }, { xPercent: -100 });
        tl.fromTo(innerItems[2], { xPercent: 0 }, { xPercent: 100 }, "<");
        tl.fromTo(
          imageContainers[2],
          { xPercent: -60, scale: 1.0, transformOrigin: "100% 100% 0px" },
          { xPercent: -150, scale: 0.8 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[2],
          { scale: 1.0, transformOrigin: "50% 50% 0px" },
          { scale: 1.2 },
          "<"
        );
        tl.fromTo(items[3], { xPercent: 80 }, { xPercent: 0 }, "<");
        tl.fromTo(innerItems[3], { xPercent: -80 }, { xPercent: 0 }, "<");
        tl.fromTo(
          imageContainers[3],
          { xPercent: -15, scale: 0.45, transformOrigin: "100% 100% 0px" },
          { xPercent: -60, scale: 1.0 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[3],
          { scale: 1.55, transformOrigin: "50% 50% 0px" },
          { scale: 1.0 },
          "<"
        );
        tl.fromTo(items[4], { xPercent: 95 }, { xPercent: 80 }, "<");
        tl.fromTo(innerItems[4], { xPercent: -95 }, { xPercent: -80 }, "<");
        tl.fromTo(
          imageContainers[4],
          { xPercent: 0, scale: 0.15, transformOrigin: "100% 100% 0px" },
          { xPercent: -15, scale: 0.45 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[4],
          { scale: 1.85, transformOrigin: "50% 50% 0px" },
          { scale: 1.55 },
          "<"
        );
        tl.fromTo(items[5], { xPercent: 100 }, { xPercent: 95 }, "<");
        tl.fromTo(innerItems[5], { xPercent: -100 }, { xPercent: -95 }, "<");
        tl.fromTo(
          imageContainers[5],
          { scale: 0, transformOrigin: "100% 100% 0px" },
          { scale: 0.15 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[5],
          { scale: 2, transformOrigin: "50% 50% 0px" },
          { scale: 1.85 },
          "<"
        );

        // --- Phase 4 (starts AFTER phase 3 finishes) ---
        tl.addLabel("phase-4", ">");
        tl.fromTo(items[3], { xPercent: 0 }, { xPercent: -100 });
        tl.fromTo(innerItems[3], { xPercent: 0 }, { xPercent: 100 }, "<");
        tl.fromTo(
          imageContainers[3],
          { xPercent: -60, scale: 1.0, transformOrigin: "100% 100% 0px" },
          { xPercent: -150, scale: 0.8 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[3],
          { scale: 1.0, transformOrigin: "50% 50% 0px" },
          { scale: 1.2 },
          "<"
        );
        tl.fromTo(items[4], { xPercent: 80 }, { xPercent: 0 }, "<");
        tl.fromTo(innerItems[4], { xPercent: -80 }, { xPercent: 0 }, "<");
        tl.fromTo(
          imageContainers[4],
          { xPercent: -15, scale: 0.45, transformOrigin: "100% 100% 0px" },
          { xPercent: -60, scale: 1.0 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[4],
          { scale: 1.55, transformOrigin: "50% 50% 0px" },
          { scale: 1.0 },
          "<"
        );
        tl.fromTo(items[5], { xPercent: 95 }, { xPercent: 80 }, "<");
        tl.fromTo(innerItems[5], { xPercent: -95 }, { xPercent: -80 }, "<");
        tl.fromTo(
          imageContainers[5],
          { scale: 0.15, transformOrigin: "100% 100% 0px" },
          { scale: 0.6 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[5],
          { scale: 1.85, transformOrigin: "50% 50% 0px" },
          { scale: 1.55 },
          "<"
        );

        // --- Phase 5 (starts AFTER phase 4 finishes) ---
        tl.addLabel("phase-5", ">");
        tl.fromTo(items[4], { xPercent: 0 }, { xPercent: -100 });
        tl.fromTo(innerItems[4], { xPercent: 0 }, { xPercent: 100 }, "<");
        tl.fromTo(
          imageContainers[4],
          { xPercent: -60, scale: 1.0, transformOrigin: "100% 100% 0px" },
          { xPercent: -150, scale: 0.8 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[4],
          { scale: 1.0, transformOrigin: "50% 50% 0px" },
          { scale: 1.2 },
          "<"
        );
        tl.fromTo(items[5], { xPercent: 80 }, { xPercent: 0 }, "<");
        tl.fromTo(innerItems[5], { xPercent: -80 }, { xPercent: 0 }, "<");
        tl.fromTo(
          imageContainers[5],
          { xPercent: 0, scale: 0.6, transformOrigin: "100% 100% 0px" },
          { xPercent: -60, scale: 1.0 },
          "<"
        );
        tl.fromTo(
          imageContainersInner[5],
          { scale: 1.55, transformOrigin: "50% 50% 0px" },
          { scale: 1.0 },
          "<"
        );
      }, mainSection.current);
      return () => desktop.revert();
    });

    return () => mm.revert();
  }, []);

  return (
    <div
      ref={mainSection}
      className="MainSection` --dark --in-view"
      style={{ backgroundColor: "var(--blue)", "--91c5acce": 5 }}
    >
      <div className="MainSection-wrap">
        <div className="MainSection-head">
          <h2
            className="SplitText AnimatedSplitText --anim-title MainSection-headTitle AppTitle-1 --in-view"
            style={{ opacity: 1, visibility: "inherit" }}
          >
            {"Braces Care 101".split(" ").map((word, i) => (
              <div
                key={word}
                style={{
                  display: "block",
                  textAlign: "start",
                  position: "relative",
                }}
                className={`head-lines head-lines${i + 1}`}
              >
                {word.split("").map((char, j) => (
                  <div key={`${char}-${j}`} className="chars-wrapper">
                    <div
                      style={{
                        position: "relative",
                        display: "inline-block",
                        transformOrigin: "50% 100% 0px",
                        opacity: 1,
                        visibility: "inherit",
                        transform: "translate3d(0px, 0px, 0px)",
                      }}
                      className={`chars chars${j + 1}`}
                    >
                      {char}
                    </div>
                  </div>
                ))}

                {i < "Brace Care 101".split(" ").length - 1 && (
                  <div className="chars-wrapper">
                    <div className="chars">&nbsp;</div>
                  </div>
                )}
              </div>
            ))}
          </h2>
        </div>
        <div ref={itemsContainer} className="font-neuehaas45 MainSection-items">
          <div className="MainSectionItem MainSection-item">
            <div className="--index-first MainSectionItem-inner">
              <div className="MainSectionItem-innerSticky">
                <div
                  className="MainSectionItem-background"
                  style={{ backgroundColor: "var(--blue)" }}
                />
                <div className="MainSectionItem-content">
                  <span className="MainSectionItem-index">01</span>
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">
                    Treatment Duration
                  </h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="font-neuehaas45">
                        {" "}
                        Your treatment time will depend on your customized plan
                        and how closely you follow our team’s instructions. Most
                        Frey Smiles patients see their ideal smile in just 12 to
                        20 months with the right guidance along the way. When
                        you’re ready to begin, schedule a consultation, and
                        we’ll handle the rest.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
                    <div className="AppImage MainSectionItem-image">
                      <div
                        className="AppImage-image --placeholder --lazy --loaded"
                        style={{
                          objectFit: "cover",
                          backgroundImage: "url('/images/stayontrackblue.png')",
                          backgroundSize: "cover",
                          backgroundPosition: "center center",
                        }}
                      ></div>
                      <img
                        src="/images/stayontrackblue.png"
                        width="480"
                        height="348"
                        alt="Video of a landscape"
                        loading="lazy"
                        style={{ objectFit: "cover" }}
                      ></img>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="MainSectionItem MainSection-item">
            <div className="--index-between MainSectionItem-inner">
              <div className="MainSectionItem-innerSticky">
                <div
                  className="MainSectionItem-background"
                  style={{ backgroundColor: "var(--pink)" }}
                />
                <div className="MainSectionItem-content">
                  <span className="MainSectionItem-index">02</span>
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">
                    Brushing & Flossing
                  </h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="font-neuehaas45">
                        {" "}
                        Brushing and flossing during orthodontic treatment is as
                        important as ever. All orthodontic appliances like clear
                        aligners, brackets, and wires interfere with the
                        mouth&apos;s normal self-cleansing mechanisms. Research
                        shows only 10% of patients brush and floss consistently
                        during active treatment. We recommend three cleanings a
                        year for braces patients; check if your insurance covers
                        the third. When you begin treatment, we&apos;ll equip
                        you with tools such as spare toothbrushes and dental
                        floss to help with cleaning.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
                    <div className="AppImage MainSectionItem-image">
                      <div
                        className="AppImage-image --placeholder --lazy --loaded"
                        style={{
                          objectFit: "cover",
                         backgroundImage: "url('/images/handholdingtoothbrushlandscape.png')",
                          backgroundSize: "cover",
                          backgroundPosition: "center center",
                        }}
                      ></div>
                      <img
                      src="/images/handholdingtoothbrushlandscape.png"
                        width="480"
                        height="348"
                        alt="Video of a landscape"
                        loading="lazy"
                        style={{ objectFit: "cover" }}
                      ></img>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="MainSectionItem MainSection-item">
            <div className="--index-between MainSectionItem-inner">
              <div className="MainSectionItem-innerSticky">
                <div
                  className="MainSectionItem-background"
                  style={{ backgroundColor: "var(--green)" }}
                />
                <div className="MainSectionItem-content">
                  <span className="MainSectionItem-index">03</span>
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">
                    General Soreness
                  </h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="font-neuehaas45">
                        {" "}
                        When you first get braces, your mouth might feel sore,
                        and your teeth may be tender for 3–5 days—kind of like a
                        dull headache. Taking Tylenol or your usual pain
                        reliever can help ease the discomfort. Your lips,
                        cheeks, and tongue might also feel irritated for a week
                        or two as they adjust. No worries—we’ve got you covered
                        with wax to prevent rubbing and irritation. Hang in
                        there—it gets easier!
                      </p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
                    <div className="AppImage MainSectionItem-image">
                      <div
                        className="AppImage-image --placeholder --lazy --loaded"
                        style={{
                          objectFit: "cover",
                          backgroundImage: "url('/images/dentalwax3landscape.png')",
                          backgroundSize: "cover",
                          backgroundPosition: "center center",
                        }}
                      ></div>
                      <img
                        src="/images/dentalwax3landscape.png"
                        width="480"
                        height="348"
                        alt="Video of a landscape"
                        loading="lazy"
                        style={{ objectFit: "cover" }}
                      ></img>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="MainSectionItem MainSection-item">
            <div className="--index-between MainSectionItem-inner">
              <div className="MainSectionItem-innerSticky">
                <div
                  className="MainSectionItem-background"
                  style={{ backgroundColor: "var(--beige)" }}
                />
                <div className="MainSectionItem-content">
                  <span className="MainSectionItem-index">04</span>
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">
                    Eating with braces
                  </h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="font-neuehaas45">
                        {" "}
                        Traditionally, patients have been advised to avoid
                        certain foods during braces treatment, as aggressive or
                        rapid chewing can break brackets. Crunchy, chewy,
                        sugary, and acidic foods should be avoided. While this
                        is not a comprehensive list, some examples include dense
                        breads, caramel, gum, soda, and lean meats. Apples
                        should be sliced, and corn on the cob may require
                        careful navigation.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
                    <div className="AppImage MainSectionItem-image">
                      <div
                        className="AppImage-image --placeholder --lazy --loaded"
                        style={{
                          objectFit: "cover",
                          backgroundImage: "url('/images/soda3.png')",
                          backgroundSize: "cover",
                          backgroundPosition: "center center",
                        }}
                      ></div>
                      <img
                        src="/images/soda3.png"
                        width="480"
                        height="348"
                        alt="Video of a landscape"
                        loading="lazy"
                        style={{ objectFit: "cover" }}
                      ></img>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="MainSectionItem MainSection-item">
            <div className="--index-between MainSectionItem-inner">
              <div className="MainSectionItem-innerSticky">
                <div
                  className="MainSectionItem-background"
                  style={{ backgroundColor: "var(--grey)" }}
                />
                <div className="MainSectionItem-content">
                  <span className="MainSectionItem-index">05</span>
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">
                    Rubberband wear
                  </h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="font-neuehaas45">
                        {" "}
                        If your doctor has prescribed rubber bands, it’s
                        essential to follow the prescription for the best
                        results. Not wearing them as directed or frequently
                        breaking brackets can affect your treatment outcome.
                        During treatment, you’ll receive different rubber band
                        sizes based on wire size and planned corrections. While
                        you may accumulate various elastics, keep in mind that
                        not all are interchangeable for every configuration.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
                    <div className="AppImage MainSectionItem-image">
                      <div
                        className="AppImage-image --placeholder --lazy --loaded"
                        style={{
                          objectFit: "cover",
                          backgroundImage: "url('/images/rubberbands2.png')",
                          backgroundSize: "cover",
                          backgroundPosition: "center center",
                        }}
                      ></div>
                      <img
                        src="/images/rubberbands2.png"
                        width="480"
                        height="348"
                        alt="Video of a landscape"
                        loading="lazy"
                        style={{ objectFit: "cover" }}
                      ></img>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="MainSectionItem --bg-terra MainSection-item">
            <div className="--index-last MainSectionItem-inner">
              <div className="MainSectionItem-innerSticky">
                <div
                  className="MainSectionItem-background"
                  style={{ backgroundColor: "var(--terra)" }}
                />
                <div className="MainSectionItem-content">
                  <span className="MainSectionItem-index">06</span>
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">
                    Final Considerations
                  </h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="font-neuehaas45">
                        Teeth will become loose, and some more than others. The
                        teeth will settle into the bone and soft tissue, and
                        mobility will return to physiologic norms at the end of
                        treatment. Brackets and other orthodontic appliances are
                        temporary, and occasional breakages are expected. These
                        are factored into your treatment time and retention
                        plan.
                      </p>
                      <p className="font-neuehaas45">
                        During your treatment, you may encounter dental
                        professionals, hygienists, or specialists with different
                        perspectives on care. Our office uses advanced
                        techniques that some may not fully understand. While
                        we&apos;re always open to discussing our approach with
                        other professionals, patient care remains our priority.
                        If you&apos;re ever unsure, you can always circle back
                        with the doctor who planned your treatment. Trust the
                        process—we&apos;re here to guide you.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
                    <div className="AppImage MainSectionItem-image">
                      <div
                        className="AppImage-image --placeholder --lazy --loaded"
                        style={{
                          objectFit: "cover",
                          backgroundImage: "url('/images/mockupwater.png')",
                          backgroundSize: "cover",
                          backgroundPosition: "center center",
                        }}
                      ></div>
                      <img
                        src="/images/mockupwater.png"
                        width="480"
                        height="348"
                        alt="Video of a landscape"
                        loading="lazy"
                        style={{ objectFit: "cover" }}
                      ></img>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="MainSection-nav">
          <div className="MainSection-navItem AppSmallText-1">
            <span>01</span>
            <span className="MainSection-navItemTitle">Timeline</span>
          </div>
          <div className="MainSection-navItem AppSmallText-1">
            <span>02</span>
            <span className="MainSection-navItemTitle">Clean Routine
</span>
          </div>
          <div className="MainSection-navItem AppSmallText-1">
            <span>03</span>
            <span className="MainSection-navItemTitle">Settling In</span>
          </div>
          <div className="MainSection-navItem AppSmallText-1">
            <span>04</span>
            <span className="MainSection-navItemTitle">Crush Proof</span>
          </div>
          <div className="MainSection-navItem AppSmallText-1">
            <span>05</span>
            <span className="MainSection-navItemTitle">Rubberband Realness</span>
          </div>
          <div className="MainSection-navItem AppSmallText-1">
            <span>06</span>
            <span className="MainSection-navItemTitle">Real Talk</span>
          </div>
          <div className="MainSection-navProgress">
            <span className="MainSection-navProgressBar"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
