'use client'
import './style.css'
import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrambleTextPlugin from 'gsap/ScrambleTextPlugin'
import { patients } from './patients'

gsap.registerPlugin(ScrambleTextPlugin)

export default function ScrollList() {
  const cardAwardArticles = useRef([])
  const awardCardItems = useRef([])
  const headingRefs = useRef([])
  const descriptionRefs = useRef([])

  const mouseEnter = () => {
    gsap.set('.award-card-area', {
      xPercent: -50,
      yPercent: -50,
    })
  }
  const mouseMove = (e) => {
    gsap.to('.award-card-area', {
      x: e.clientX + 16,
      y: e.clientY + 16,
      opacity: 1,
      ease: 'power2.out',
      duration: 0.5,
    })
  }
  const mouseLeave = () => {
    gsap.to('.award-card-area', {
      opacity: 0,
      ease: 'power2.out',
      duration: 0.5,
    })
  }

  const scrambleText = (idx, heading, description) => {
    const scramble = {
      characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      speed: 0.8,
      newChars: 0.3,
      revealDelay: 0,
      tweenLength: true,
    }
    gsap.to(headingRefs.current[idx], {
      duration: 1.5,
      ease: 'power2.out',
      scrambleText: { text: heading, ...scramble },
    })
    gsap.to(descriptionRefs.current[idx], {
      duration: 1.5,
      ease: 'power2.out',
      scrambleText: { text: description || '--', ...scramble },
    })
  }

  const handleHover = (idx) => {
    gsap.set(awardCardItems.current[idx], {
      clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
    })
    gsap.to(awardCardItems.current[idx], {
      clipPath: 'polygon(0px 0px, 100% 0px, 100% 100%, 0% 100%)',
      ease: 'power2.out',
      duration: 0.5,
    })
  }
  const handleLeave = (idx) => {
    gsap.to(awardCardItems.current[idx], {
      clipPath: 'polygon(100% 0px, 100% 0px, 100% 100%, 100% 100%)',
      ease: 'power2.out',
      duration: 0.5,
    })
  }

  return (
    <div className='award'>
       <div className='award-card-area'>
        {patients.map((patient, i) => (
          <div
            ref={(el) => awardCardItems.current[i] = el}
            key={`${i}-${patient.name}-${i}`}
            className='award-card-item'
          >
            <div className='card-award'>
              <article
                ref={(el) => cardAwardArticles.current[i] = el}
                className={`card-award-article card-award-article-${i}`}
              >
                <div className='card-award-inner'>
                  <img
                    className='card-award-inner-image'
                    src={patient.image}
                    alt={patient.name}
                  />
                </div>
              </article>
            </div>
          </div>
        ))}
      </div>
      <div className='award-bg'>
        <div className='award-inner'>
          <div className='l-container'>
            <span className='award-title-read-area'>
              <AppReadTitle />
            </span>
            <div className='award-list-wrapper'>
              <div
                className='award-list'
                onMouseEnter={() => mouseEnter()}
                onMouseMove={(e) => mouseMove(e)}
                onMouseLeave={() => mouseLeave()}
              >
                {patients.map((patient, i) => (
                  <div
                    key={`${patient.name}-${i}`}
                    onMouseEnter={() => handleHover(i)}
                    onMouseLeave={() => handleLeave(i)}
                    className='award-item'
                  >
                    <BezierCurve />
                    <div onMouseEnter={() => scrambleText(i, patient.name, patient.duration)} className='award-item-text-wrapper'>
                      <p ref={(el) => headingRefs.current[i] = el} className='award-group'>{patient.name}</p>
                      <p ref={(el) => descriptionRefs.current[i] = el} className='award-title'>{patient.duration}</p>
                    </div>
                  </div>
                ))}
                <div className='award-list-bottom-line'>
                  <BezierCurve />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const AppReadTitle = () => {
  return (
    <div className='flex justify-center items-center gap-4 tracking-wider px-4 sm:px-0'>
      <span className='text-xs'>●</span>
      <h3 className='text-sm/6'>Our patient results</h3>
      <span className='text-xs text-gray-300'>●</span>
      <h3 className='mt-1 max-w-2xl text-sm/6'>Read the reviews</h3>
    </div>
  )
}

const BezierCurve = () => {
  const container = useRef(null)
  const path = useRef(null)

  let progress = 0
  let time = Math.PI / 2
  let reqId = null
  let x = 0.5

  useEffect(() => {
    setPath(progress)
    window.addEventListener("resize", () => { setPath(progress)} )
  }, [])

  const setPath = (progress) => {
    if (!path.current) return
    if (container.current) {
      const width = container.current.offsetWidth
      path.current.setAttributeNS(
        null,
        "d",
        `M 0 30 Q${width * x} ${30 + progress} ${width} 30`
      )
    }
  }

  const manageMouseEnter = () => {
    if (reqId) {
      window.cancelAnimationFrame(reqId)
      resetAnimation()
    }
  }

  const manageMouseMove = (e) => {
    if (!path.current) return

    const { movementY, clientX } = e
    const { left, width } = path.current.getBoundingClientRect()
    x = (clientX - left) / width
    progress += movementY
    setPath(progress)
  }

  const manageMouseLeave = () => { animateOut() }

  const lerp = (x, y, a) => x * (1 - a) + y * a

  const animateOut = () => {
    const newProgress = progress * Math.sin(time)
    time += 0.25
    setPath(newProgress)
    progress = lerp(progress, 0, 0.2)

    if (Math.abs(progress) > 0.75) {
      reqId = window.requestAnimationFrame(animateOut)
    } else {
      resetAnimation()
    }
  }

  const resetAnimation = () => {
    time = Math.PI / 2
    progress = 0
  }

  return (
    <div ref={container} className="col-span-12 row-start-2 h-[1px] w-full relative">
      <div
        onMouseEnter={manageMouseEnter}
        onMouseMove={(e) => {
          manageMouseMove(e)
        }}
        onMouseLeave={manageMouseLeave}
        className="relative -top-[15px] h-[30px] z-10 hover:-top-[30px] hover:h-[60px]"
      />
      <svg className="absolute -top-[30px] w-full h-[60px] text-zinc-300 dark:text-zinc-600">
        <path ref={path} strokeWidth={1} stroke="currentColor" fill="none" />
      </svg>
    </div>
  )
}