
"use client";

import { useId, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const LOGO = {
  x: 355.8,
  y: 661.9,
  size: 111.7,
};

const GAP_IN = 6;
const GAP_OUT = 22;
const STEP = 2;
const NS = "http://www.w3.org/2000/svg";

const ROUTES = [
  {
    d: "m 106,45h 375c 114,0 226,128 226,235v 236c 0,136 -122,222 -224,221l -182,-2c -89,1 -141,42 -142,158l -2,204c -1,117 37,173 134,173h 186c 110,-3 230,111 230,220v 242c 0,113 -125,225 -248,225H 105",
    width: 20,
    dash: "20 50 120 50 20 50 300 50 20 50 150 50 20 50 110 45 30 50 90 45 25 55 145 50 65 20000",
  },
  {
    d: "m 33,85h 444c 96,0 190,107 190,201v 224c 0,116 -98,188 -190,187l -192,-2c -92,0 -166,75 -166,168v 278c 0,94 74,169 166,169h 194c 92,0 188,94 188,188v 228c 0,94 -104,191 -214,191H 105",
    width: 34,
    dash: "34 60 120 60 34 60 300 60 34 60 150 60 34 60 110 50 35 55 100 50 45 65 160 55 30 20000",
  },
  {
    d: "m 155,127h 308c 94,0 162,86 162,177v 178c 0,109 -50,174 -166,173L 277,653C 158,653 77,762 77,849v 302c 0,118 107,196 180,197l 204,4c 92,0 164,67 164,160v 200c 0,91 -89,163 -188,163H 105",
    width: 25,
    dash: "25 40 120 40 25 40 250 40 25 40 150 40 25 45 110 50 35 45 85 50 25 45 140 55 40 50 75 20000",
  },
  {
    d: "m 283,173c 2,0 165,0 165,0C 544,175 577,238 577,330v 156c 0,94 -48,126 -140,125L 269,609C 167,602 29,702 29,851v 312c 0,111 101,235 242,235h 162c 109,1 144,49 144,136v 162c 0,73 -53,130 -118,130l -353,1",
    width: 40,
    dash: "40 70 100 70 40 70 200 70 40 55 130 60 45 65 100 60 35 75 155 65 55 20000",
  },
];

const LETTER_PATHS = [
  {
    d: "M318,805 V350 C318,275 365,240 455,237",
    color: "#3D2B78",
  },
  {
    d: "M225,460 H445",
    color: "#3D2B78",
  },
  {
    d: "M815,480 C755,445 655,430 605,460 C555,490 560,550 615,570 L765,623",
    color: "#3D2B78",
  },
  {
    d: "M557,745 C635,815 755,825 835,745",
    color: "#DE4F5C",
  },
];

const clamp = (v) => Math.max(0, Math.min(1, v));

function createFlowingRoute(svg, ids) {
  const defs = svg.querySelector("[data-extra-defs]");
  const flow = svg.querySelector("[data-flow]");
  const original = svg.querySelector("[data-original]");
  const letters = svg.querySelector("[data-letters]");

  const BOX = {
    x0: 181,
    x1: 879,
    y0: 193,
    y1: 893,
  };

  const cx = (BOX.x0 + BOX.x1) / 2;
  const cy = (BOX.y0 + BOX.y1) / 2;

  const scale = LOGO.size / (BOX.x1 - BOX.x0);
  const tx = LOGO.x - cx * scale;
  const ty = LOGO.y - cy * scale;

  letters.setAttribute(
    "transform",
    `translate(${tx},${ty}) scale(${scale})`
  );

  // Sample the actual FS letter strokes.
  const letterPoints = [];

  letters.querySelectorAll("path").forEach((path) => {
    const length = path.getTotalLength();

    for (let s = 0; s <= length; s += 10) {
      const p = path.getPointAtLength(s);

      letterPoints.push([
        tx + p.x * scale,
        ty + p.y * scale,
      ]);
    }
  });

  const mark = {
    points: letterPoints,
    radius: 44 * scale,
    x0: tx + BOX.x0 * scale,
    x1: tx + BOX.x1 * scale,
    y0: ty + BOX.y0 * scale,
    y1: ty + BOX.y1 * scale,
  };

  const originalUses = Array.from(
    original.querySelectorAll("use")
  );

  const lines = originalUses.map((use, index) => {
    const source = svg.querySelector(
      `[data-route-path="${index}"]`
    );

    const length = source.getTotalLength();
    const width = ROUTES[index].width;

    const numbers = ROUTES[index].dash
      .trim()
      .split(/\s+/)
      .map(Number);

    const dashes = [];

    let position = 0;

    for (let i = 0; i < numbers.length - 1; i++) {
      if (i % 2 === 0) {
        dashes.push([
          position,
          position + numbers[i],
        ]);
      }

      position += numbers[i];
    }

    // Sample the original path.
    const points = [];

    for (let s = 0; s <= length + STEP; s += STEP) {
      const p = source.getPointAtLength(
        Math.min(s, length)
      );

      points.push([p.x, p.y]);
    }

    // Give each route its own gradient so
    // separated pieces retain their original colors.
    const bounds = use.getBBox();

    const gradient = document.createElementNS(
      NS,
      "linearGradient"
    );

    gradient.setAttribute(
      "id",
      `${ids.gradient}-line-${index}`
    );

    gradient.setAttribute(
      "gradientUnits",
      "userSpaceOnUse"
    );

    gradient.setAttribute("x1", "0");
    gradient.setAttribute("y1", "0");
    gradient.setAttribute("x2", "1");
    gradient.setAttribute("y2", "1");

    gradient.setAttribute(
      "gradientTransform",
      `matrix(${bounds.width} 0 0 ${bounds.height} ${bounds.x} ${bounds.y})`
    );

    svg
      .querySelectorAll(
        `[data-main-gradient] stop`
      )
      .forEach((stop) => {
        gradient.appendChild(stop.cloneNode());
      });

    defs.appendChild(gradient);

    const group = document.createElementNS(NS, "g");

    group.setAttribute(
      "stroke",
      `url(#${ids.gradient}-line-${index})`
    );

    flow.appendChild(group);

    return {
      length,
      width,
      points,
      dashes,
      group,
      pool: [],
      gaps: [],
      lead: numbers
        .slice(0, -1)
        .reduce((a, b) => a + b, 0),
    };
  });

  // Calculate where each route intersects
  // the strokes of the FS logo.
  lines.forEach((line) => {
    const reach = mark.radius + 60;
    const halfWidth = line.width / 2;

    const clearance = line.points.map(([x, y]) => {
      if (
        x < mark.x0 - reach ||
        x > mark.x1 + reach ||
        y < mark.y0 - reach ||
        y > mark.y1 + reach
      ) {
        return Infinity;
      }

      let distanceSquared = Infinity;

      for (const [px, py] of mark.points) {
        const dx = x - px;
        const dy = y - py;
        const d = dx * dx + dy * dy;

        if (d < distanceSquared) {
          distanceSquared = d;
        }
      }

      return (
        Math.sqrt(distanceSquared) -
        mark.radius -
        halfWidth
      );
    });

    let i = 0;

    while (i < clearance.length) {
      if (clearance[i] === Infinity) {
        i++;
        continue;
      }

      let j = i;

      while (
        j < clearance.length &&
        clearance[j] !== Infinity
      ) {
        j++;
      }

      let first = -1;
      let last = -1;

      for (let k = i; k < j; k++) {
        if (clearance[k] < GAP_IN) {
          if (first < 0) first = k;
          last = k;
        }
      }

      if (first >= 0) {
        let end = last;

        while (
          end + 1 < j &&
          clearance[end + 1] < GAP_OUT
        ) {
          end++;
        }

        line.gaps.push([
          first * STEP,
          end * STEP,
        ]);
      }

      i = j;
    }
  });

  function pointAt(line, distance) {
    const f = distance / STEP;
    const i = Math.floor(f);
    const t = f - i;

    const a = line.points[
      Math.min(i, line.points.length - 1)
    ];

    const b = line.points[
      Math.min(i + 1, line.points.length - 1)
    ];

    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
    ];
  }

  function getSegment(line, index) {
    while (line.pool.length <= index) {
      const path = document.createElementNS(
        NS,
        "path"
      );

      path.setAttribute(
        "stroke-width",
        line.width
      );

      line.group.appendChild(path);
      line.pool.push(path);
    }

    return line.pool[index];
  }

  function draw(line, travel) {
    let count = 0;

    function emit(start, end) {
      if (end - start < line.width * 0.5) {
        return;
      }

      const points = [pointAt(line, start)];

      for (
        let s = Math.ceil(start / STEP) * STEP;
        s < end;
        s += STEP
      ) {
        points.push(pointAt(line, s));
      }

      points.push(pointAt(line, end));

      const path = getSegment(line, count++);

      path.setAttribute(
        "d",
        "M" +
          points
            .map(
              ([x, y]) =>
                `${x.toFixed(1)},${y.toFixed(1)}`
            )
            .join(" L")
      );
    }

    line.dashes.forEach(([dashStart, dashEnd]) => {
      let start = Math.max(
        0,
        dashStart + travel
      );

      const end = Math.min(
        line.length,
        dashEnd + travel
      );

      if (end <= start) return;

      for (const [gapStart, gapEnd] of line.gaps) {
        if (gapEnd < start || gapStart > end) {
          continue;
        }

        emit(start, Math.min(end, gapStart));

        start = Math.max(start, gapEnd);
      }

      if (start < end) {
        emit(start, end);
      }
    });

    // Reuse existing SVG elements rather than
    // allocating new ones on every scroll frame.
    for (let i = count; i < line.pool.length; i++) {
      line.pool[i].setAttribute("d", "");
    }
  }

  function update(progress) {
    const p = clamp(progress);

    lines.forEach((line, index) => {
      const value = clamp(
        (p - (3 - index) * 0.03) / 0.9
      );

      const travel =
        Math.max(0, line.length - line.lead) *
        value;

      draw(line, travel);
    });
  }

  // Initialize before hiding the original SVG.
  update(0.45);
  original.setAttribute("opacity", "0");

  return {
    update,

    destroy() {
      original.removeAttribute("opacity");
      flow.replaceChildren();
      defs.replaceChildren();
    },
  };
}

export default function LocationsFlowingRoute({
  routeRef,
}) {
  const svgRef = useRef(null);

  const reactId = useId().replace(/:/g, "");

  const ids = {
    gradient: `locations-gradient-${reactId}`,
    path: `locations-path-${reactId}`,
  };

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const route = routeRef?.current;

    if (!svg) return;

    const renderer = createFlowingRoute(svg, ids);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const mm = gsap.matchMedia();

    mm.add("(max-width: 768px)", () => {
      if (reducedMotion) {
        renderer.update(0.45);
        return;
      }

      const progress = { value: 0 };

      renderer.update(0);

      const animation = gsap.to(progress, {
        value: 1,
        ease: "none",

        onUpdate: () => {
          renderer.update(progress.value);
        },

        scrollTrigger: {
          trigger: route || svg,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.25,
          invalidateOnRefresh: true,
        },
      });

      return () => animation.kill();
    });

    mm.add("(min-width: 769px)", () => {
      renderer.update(0.45);
    });

    return () => {
      mm.revert();
      renderer.destroy();
    };
  }, [routeRef]);

  return (
    <svg
      ref={svgRef}
      className="locations-route-svg"
      viewBox="0 0 740 2000"
      preserveAspectRatio="xMidYMin meet"
      aria-hidden="true"
    >
      <defs data-extra-defs />

      <defs>
        <linearGradient
          id={ids.gradient}
          data-main-gradient
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#EEE8FF" />
          <stop offset="25%" stopColor="#C9B4F4" />
          <stop offset="55%" stopColor="#9875DB" />
          <stop offset="80%" stopColor="#D6C5FA" />
          <stop offset="100%" stopColor="#7653B8" />
        </linearGradient>

        {ROUTES.map((route, index) => (
          <path
            key={index}
            id={`${ids.path}-${index}`}
            data-route-path={index}
            d={route.d}
          />
        ))}
      </defs>

      {/* Original route used for measurement */}
      <g
        data-original
        fill="none"
        stroke={`url(#${ids.gradient})`}
        strokeLinecap="round"
      >
        {ROUTES.map((route, index) => (
          <use
            key={index}
            href={`#${ids.path}-${index}`}
            fill="none"
            strokeWidth={route.width}
            strokeDasharray={route.dash}
          />
        ))}
      </g>

      {/* Dynamically reconstructed route */}
      <g
        data-flow
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Stationary FS logo */}
      <g
        data-letters
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="88"
      >
        {LETTER_PATHS.map((letter, index) => (
          <path
            key={index}
            d={letter.d}
            stroke={letter.color}
          />
        ))}
      </g>
    </svg>
  );
}
