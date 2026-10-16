"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

export default function LocationTextReveal({
  children,
  delay = 0,
  mode = "lines",
}) {
  const textRef = useRef(null);

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const ctx = gsap.context(() => {
if (mode === "items") {
  const items = gsap.utils.toArray(
    ".location-services-item",
    element
  );

  gsap.fromTo(
    items,
    {
      yPercent: 120,
    },
    {
      yPercent: 0,
      duration: 0.85,
      delay,
      stagger: 0.1,
      ease: "power3.out",
      clearProps: "transform",
    }
  );

  return;
}

      SplitText.create(element, {
        type: "lines",
        mask: "lines",
        autoSplit: true,

        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 110,
            duration: 0.85,
            delay,
            stagger: 0.1,
            ease: "power3.out",
          });
        },
      });
    }, element);

    return () => ctx.revert();
  }, [children, delay, mode]);

  return (
    <span
      ref={textRef}
      className={`location-line-reveal ${
        mode === "items" ? "location-items-reveal" : ""
      }`}
    >
      {children}
    </span>
  );
}