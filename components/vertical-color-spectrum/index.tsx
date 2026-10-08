"use client"
import "./style.css"
import { useEffect, useRef } from "react"
import gsap from "gsap"

export default function VerticalColorSpectrum() {
  const animationSection = useRef(null)
  const svgContainer = useRef(null)

  useEffect(() => {
    if (!animationSection.current) return
    
    const animation = gsap.context(() => {
      let tl = gsap.timeline()
      tl.to(".svg-container", { autoAlpha: 1, duration: 0.01 }, 0)
      .to(
        svgContainer.current,
        {
          transform: "scaleY(1) translateY(0px)",
          duration: 1.2,
          ease: "power2.out",
        },
        0
      )
      .to(
        svgContainer.current,
        {
          transform: "scaleY(0.05) translateY(100vh)",
          duration: 1.2,
          ease: "power2.in",
        },
        1.2
      )
      return () => tl.kill()
    }, animationSection.current)

    return () => animation.revert()
  }, [])

  return (
    <div ref={animationSection} className="animation-section">
      <div className="footer-container">
        <div ref={svgContainer} className="svg-container">
          <svg className="spectrum-svg" viewBox="0 0 1567 584" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip)" filter="url(#blur)">
              <path d="M1219 584H1393V184H1219V584Z" fill="url(#grad0)" />
              <path d="M1045 584H1219V104H1045V584Z" fill="url(#grad1)" />
              <path d="M348 584H174L174 184H348L348 584Z" fill="url(#grad2)" />
              <path d="M522 584H348L348 104H522L522 584Z" fill="url(#grad3)" />
              <path d="M697 584H522L522 54H697L697 584Z" fill="url(#grad4)" />
              <path d="M870 584H1045V54H870V584Z" fill="url(#grad5)" />
              <path d="M870 584H697L697 0H870L870 584Z" fill="url(#grad6)" />
              <path d="M174 585H0.000183105L-3.75875e-06 295H174L174 585Z" fill="url(#grad7)" />
              <path d="M1393 584H1567V294H1393V584Z" fill="url(#grad8)" />
            </g>
            <defs>
              <filter id="blur" x="-30" y="-30" width="1627" height="644" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feGaussianBlur stdDeviation="15" result="effect1_foregroundBlur" />
              </filter>
              <linearGradient id="grad0" x1="1306" y1="584" x2="1306" y2="184" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F3E8FF" />
                <stop offset="0.182709" stopColor="#E9D5FF" />
                <stop offset="0.283673" stopColor="#D8B4FE" />
                <stop offset="0.413484" stopColor="#C084FC" />
                <stop offset="0.586565" stopColor="#A855F7" />
                <stop offset="0.682722" stopColor="#9333EA" />
                <stop offset="0.802892" stopColor="#7C3AED" />
                <stop offset="1" stopColor="#6B21B6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="grad1" x1="1132" y1="584" x2="1132" y2="104" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F3E8FF" />
                <stop offset="0.182709" stopColor="#E9D5FF" />
                <stop offset="0.283673" stopColor="#D8B4FE" />
                <stop offset="0.413484" stopColor="#C084FC" />
                <stop offset="0.586565" stopColor="#A855F7" />
                <stop offset="0.682722" stopColor="#9333EA" />
                <stop offset="0.802892" stopColor="#7C3AED" />
                <stop offset="1" stopColor="#6B21B6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="grad2" x1="261" y1="584" x2="261" y2="184" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F3E8FF" />
                <stop offset="0.182709" stopColor="#E9D5FF" />
                <stop offset="0.283673" stopColor="#D8B4FE" />
                <stop offset="0.413484" stopColor="#C084FC" />
                <stop offset="0.586565" stopColor="#A855F7" />
                <stop offset="0.682722" stopColor="#9333EA" />
                <stop offset="0.802892" stopColor="#7C3AED" />
                <stop offset="1" stopColor="#6B21B6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="grad3" x1="435" y1="584" x2="435" y2="104" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F3E8FF" />
                <stop offset="0.182709" stopColor="#E9D5FF" />
                <stop offset="0.283673" stopColor="#D8B4FE" />
                <stop offset="0.413484" stopColor="#C084FC" />
                <stop offset="0.586565" stopColor="#A855F7" />
                <stop offset="0.682722" stopColor="#9333EA" />
                <stop offset="0.802892" stopColor="#7C3AED" />
                <stop offset="1" stopColor="#6B21B6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="grad4" x1="609.501" y1="584" x2="609.501" y2="54" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F3E8FF" />
                <stop offset="0.182709" stopColor="#E9D5FF" />
                <stop offset="0.283673" stopColor="#D8B4FE" />
                <stop offset="0.413484" stopColor="#C084FC" />
                <stop offset="0.586565" stopColor="#A855F7" />
                <stop offset="0.682722" stopColor="#9333EA" />
                <stop offset="0.802892" stopColor="#7C3AED" />
                <stop offset="1" stopColor="#6B21B6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="grad5" x1="957.5" y1="584" x2="957.5" y2="54" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F3E8FF" />
                <stop offset="0.182709" stopColor="#E9D5FF" />
                <stop offset="0.283673" stopColor="#D8B4FE" />
                <stop offset="0.413484" stopColor="#C084FC" />
                <stop offset="0.586565" stopColor="#A855F7" />
                <stop offset="0.682722" stopColor="#9333EA" />
                <stop offset="0.802892" stopColor="#7C3AED" />
                <stop offset="1" stopColor="#6B21B6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="grad6" x1="783.501" y1="584" x2="783.501" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F3E8FF" />
                <stop offset="0.182709" stopColor="#E9D5FF" />
                <stop offset="0.283673" stopColor="#D8B4FE" />
                <stop offset="0.413484" stopColor="#C084FC" />
                <stop offset="0.586565" stopColor="#A855F7" />
                <stop offset="0.682722" stopColor="#9333EA" />
                <stop offset="0.802892" stopColor="#7C3AED" />
                <stop offset="1" stopColor="#6B21B6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="grad7" x1="87.0003" y1="585" x2="87.0003" y2="295" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F3E8FF" />
                <stop offset="0.182709" stopColor="#E9D5FF" />
                <stop offset="0.283673" stopColor="#D8B4FE" />
                <stop offset="0.413484" stopColor="#C084FC" />
                <stop offset="0.586565" stopColor="#A855F7" />
                <stop offset="0.682722" stopColor="#9333EA" />
                <stop offset="0.802892" stopColor="#7C3AED" />
                <stop offset="1" stopColor="#6B21B6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="grad8" x1="1480" y1="584" x2="1480" y2="294" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F3E8FF" />
                <stop offset="0.182709" stopColor="#E9D5FF" />
                <stop offset="0.283673" stopColor="#D8B4FE" />
                <stop offset="0.413484" stopColor="#C084FC" />
                <stop offset="0.586565" stopColor="#A855F7" />
                <stop offset="0.682722" stopColor="#9333EA" />
                <stop offset="0.802892" stopColor="#7C3AED" />
                <stop offset="1" stopColor="#6B21B6" stopOpacity="0" />
              </linearGradient>
              <clipPath id="clip">
                <rect width="1567" height="584" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  )
}