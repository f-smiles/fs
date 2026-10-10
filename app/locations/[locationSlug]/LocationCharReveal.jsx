
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function LocationCharacterReveal({
  children,
  className = "",
  delay = 0.2,
  stagger = 0.035,
  duration = 0.5,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chars = container.querySelectorAll(
      ".location-reveal-char"
    );

    const ctx = gsap.context(() => {
    
gsap.fromTo(
  chars,
  { yPercent: 100 },
  {
    yPercent: 0,
    duration,
    stagger,
    delay,
    ease: "power3.out",
  }
);

    }, container);

    return () => ctx.revert();
  }, [delay, stagger, duration]);

  const text = String(children);

  return (
    <span
      ref={containerRef}
      className={`location-character-reveal ${className}`}
      aria-label={text}
    >
      {Array.from(text).map((char, index) => (
        <span
          key={index}
          className="location-reveal-char-wrap"
          aria-hidden="true"
        >
          <span className="location-reveal-char">
            {char === " " ? "\u00A0" : char}
          </span>
        </span>
      ))}
    </span>
  );
}