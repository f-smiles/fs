'use client'

import Link from "next/link"
import Image from "next/image"
import { VariantsWithProductImagesTags } from "@/lib/infer-type"
import { formatPrice } from "@/lib/format-price"
import { useLayoutEffect, useRef, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion'
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)


type ProductVariantsProps = {
  variants: VariantsWithProductImagesTags[]
}

function ProductCard({ variant, backgroundUrl }: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [vars, setVars] = useState({
    mx: "50%",
    my: "50%",
    posx: "50%",
    posy: "50%",
    hyp: "0",
  });

  const round = (n: number, fix = 3) => parseFloat(n.toFixed(fix));

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;

      const pctX = round((100 / r.width) * x);
      const pctY = round((100 / r.height) * y);

      // tilt
      setRotation({
        y: (pctX - 50) * 0.2,
        x: (50 - pctY) * 0.2,
      });

      // light
      const posx = round(50 + pctX / 4 - 12.5);
      const posy = round(50 + pctY / 3 - 16.67);
      const hyp = Math.sqrt((pctY - 50) ** 2 + (pctX - 50) ** 2) / 50;

      setVars({
        mx: `${pctX}%`,
        my: `${pctY}%`,
        posx: `${posx}%`,
        posy: `${posy}%`,
        hyp: `${round(hyp)}`,
      });
    };

    const onLeave = () => {
      setRotation({ x: 0, y: 0 });
      setVars({ mx: "50%", my: "50%", posx: "50%", posy: "50%", hyp: "0" });
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);


const holoOverlayStyle: React.CSSProperties = {
  backgroundImage: `
    url("https://res.cloudinary.com/simey/image/upload/Dev/PokemonCards/illusion.webp"),
    repeating-linear-gradient(
      0deg,
      rgba(255, 119, 115, 0.55) calc(5% * 1),
      rgba(255, 237, 95, 0.55) calc(5% * 2),
      rgba(168, 255, 95, 0.55) calc(5% * 3),
      rgba(131, 255, 247, 0.55) calc(5% * 4),
      rgba(120, 148, 255, 0.55) calc(5% * 5),
      rgba(216, 117, 255, 0.55) calc(5% * 6),
      rgba(255, 119, 115, 0.55) calc(5% * 7)
    ),
repeating-linear-gradient(
  133deg,
  rgba(16, 18, 42, 0.35) 0%,

  rgba(155, 140, 255, 0.5) 6%,
  rgba(140, 190, 255, 0.5) 7%,
  rgba(170, 140, 255, 0.5) 8%,

  rgba(16, 18, 42, 0.35) 14%,
  rgba(16, 18, 42, 0.35) 30%
),
radial-gradient(
  farthest-corner circle at var(--mx) var(--my),
  rgba(200, 230, 255, 0.55) 0%,
  rgba(180, 215, 255, 0.35) 25%,
  rgba(170, 200, 245, 0.18) 55%,
  rgba(255, 255, 255, 0.06) 100%
)
  `,
  backgroundSize: `50%, 200% 700%, 300%, 200%`,
  backgroundPosition: `center, 0% var(--posy), var(--posx) var(--posy), var(--posx) var(--posy)`,
  backgroundBlendMode: `exclusion, hue, hard-light, exclusion`,
  mixBlendMode: "color-dodge",
filter: `
  blur(0.3px)
  brightness(calc((var(--hyp) * 0.3) + 0.7))
  contrast(1.5)
  saturate(1.8)
`,
  opacity: 0.8,
  transition: "background-position 0.25s ease, filter 0.25s ease",
};

  return (
<div
  ref={cardRef}
className="card-anim relative rounded-[16px] h-[440px] will-change-transform group bg-transparent"
  style={{
    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
    transformStyle: "preserve-3d",
    "--mx": vars.mx,
    "--my": vars.my,
    "--posx": vars.posx,
    "--posy": vars.posy,
    "--hyp": vars.hyp,
  }}
>


<div className="absolute inset-0 z-[0] p-5">

  <div className="relative h-full w-full bg-transparent border border-[#EBECF0] p-4">

    <div
      className="relative h-[90%] w-full overflow-hidden"
style={{
  clipPath: "polygon(0 0, 90% 0, 100% 10%, 100% 100%, 0 100%)",
}}
    >
      {backgroundUrl && (
        <img
          src={backgroundUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        style={holoOverlayStyle}
      />
    </div>
  </div>
</div>


<Link
  href={`/shop/products/${variant.id}?id=${variant.id}&title=${variant.product.title}&variant=${variant.variantName}&prodId=${variant.productID}`}
  className="relative z-[10] flex flex-col h-full px-5 pt-5 pb-6"
>

<figure className="flex items-center justify-center h-[300px] w-full px-6">
  <Image
    src={variant.variantImages[1].url}
    alt={`${variant.product.title} - ${variant.variantName}`}
    width={500}
    height={500}
    className="max-h-full object-contain"
    priority
  />
</figure>

<div className="mt-auto px-2 py-3 flex items-center justify-between gap-4">
  <h3 className="text-[12px] font-neuehaas45 tracking-wide text-black">
    {variant.product.title}
  </h3>

  <button className="relative text-[12px] font-neuehaas45">
    ${Number(variant.product.price).toFixed(2)}
  </button>
</div>
{/*  

  <div className="text-zinc-600 tracking-wide font-neuehaas45 mt-auto pt-6 py-3 px-2 flex items-end justify-between gap-4">
    <span className="text-[12px] leading-tight">
      {variant.variantName}
    </span>
  <div className="flex justify-end">
    <div className="text-[12px] ">
     Add to Cart
    </div>
  </div>

  </div> */}
</Link>
</div>
  );
}
export default function Variants({ variants }: ProductVariantsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<HTMLDivElement[]>([])
  const row1ItemRefs = useRef<HTMLDivElement[]>([])
  const row2ItemRefs = useRef<HTMLDivElement[]>([])
  const row3ItemRefs = useRef<HTMLDivElement[]>([])
  const row4ItemRefs = useRef<HTMLDivElement[]>([])

const row1 = variants.filter(v => v.product.category === "devices")
  const row2 = variants.filter(v => v.product.category === "whitening")
  const row3 = variants.filter(v => v.product.category === "floss")
  const row4 = variants.filter(v => v.product.category === "cases")

  const rows = [
    { id: 'devices', variants: row1 },
    { id: 'whitening', variants: row2 },
    { id: 'floss', variants: row3 },
    { id: 'cases', variants: row4 },
  ]

  return (
    <div ref={containerRef} className="relative min-h-screen flex flex-col justify-center">
      {rows.map((row, rowIndex) => {
        const rowRef = useRef<HTMLDivElement>(null)


const isInView = useInView(rowRef, {
  once: true,
  amount: 0.2,
});

        return (
          <section
            key={row.id}
            ref={el => {
              if (el) {
                rowRefs.current[rowIndex] = el

                rowRef.current = el
              }
            }}
           className="relative overflow-hidden"
          >
<div className="grid grid-cols-4 justify-center gap-2 w-full">
        {row.variants.map((variant, itemIndex) => (
  <motion.div
    key={variant.id}
    ref={el => {
      if (!el) return
      if (rowIndex === 0) row1ItemRefs.current[itemIndex] = el
      if (rowIndex === 1) row2ItemRefs.current[itemIndex] = el
      if (rowIndex === 2) row3ItemRefs.current[itemIndex] = el
      if (rowIndex === 3) row4ItemRefs.current[itemIndex] = el
    }}
    className="flex items-start justify-center relative"
    initial={{ y: "45vh", opacity: 0, scale: 0.92 }}
    animate={isInView ? { y: 0, opacity: 1, scale: 1 } : {}}
    transition={{
      delay: itemIndex * 0.12,
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
    }}
  >

    <motion.div
      whileHover={{
        y: -15,
        scale: 1.02,
        transition: { duration: 0.25 },
      }}
      animate={isInView ? { y: [0, -18, 0] } : {}}
      transition={{
        duration: 3.8,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
    className="relative w-full max-w-[360px]" 
    >
      <ProductCard
        variant={variant}
        backgroundUrl="/images/_mesh_gradients/purplepeachy.png"
      />


      <motion.div
        className="absolute inset-0 -z-10 bg-black/5 blur-xl rounded-3xl"
        animate={isInView ? {
          y: [0, -20, 0],
          opacity: [0.1, 0.2, 0.1],
        } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
    </motion.div>
  </motion.div>
))}
            </div>
          </section>
        )
      })}
    </div>
  )
}