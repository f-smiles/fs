"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

export default function LocationTextReveal({
  children,
  delay = 0,
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
  }, [children, delay]);

  return (
    <span ref={textRef} className="location-line-reveal">
      {children}
    </span>
  );
}