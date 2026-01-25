'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

gsap.registerPlugin(useGSAP)

export default function GridOverlay() {
  const container = useRef(null)

  useGSAP(() => {
const gridColumns = container.current.querySelectorAll('.grid-column')
    gsap.set(gridColumns, {
      opacity: 0,
      scaleY: 0,
    })

    gsap.to(gridColumns, {
      opacity: 1,
      scaleY: 1,
      duration: 1.2,
      stagger: 0.08,
      ease: "power2.out",
      transformOrigin: "top",
    })
  }, { scope: container })

  return (
    <div className="grid-overlay">
      <div ref={container} className="grid-overlay-inner">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="grid-column"></div>
        ))}
      </div>
    </div>
  )
}