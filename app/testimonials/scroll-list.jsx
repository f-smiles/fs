'use client'
import './style.css'
import React, {  useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrambleTextPlugin from 'gsap/ScrambleTextPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrambleTextPlugin, ScrollTrigger)

export default function ScrollList() {
  const award = useRef(null)
  const awardBg = useRef(null)
  const lContainer = useRef(null)
  const awardList = useRef(null)
  
  const awardCardArea = useRef(null)
  const awardCardItems = useRef([])
  
  const headingRefs = useRef([])
  const descriptionRefs = useRef([])

  const mouseEnter = () => {
    gsap.set(awardCardArea.current, {
      xPercent: -50,
      yPercent: -50,
    })
  }
  const mouseMove = (e) => {
    gsap.to(awardCardArea.current, {
      x: e.clientX + 16,
      y: e.clientY + 16,
      opacity: 1,
      ease: 'power2.out',
      duration: 0.5,
    })
  }
  const mouseLeave = () => {
    gsap.to(awardCardArea.current, {
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

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: awardBg.current,
          start: 'top top',
          end: () => `+=${award.current.offsetHeight}`,
          pin: true,
          scrub: 1,
          snap: {
            snapTo:(1 / patients.length) * 0.5,
            duration: 0.2,
            ease: 'power1.inOut',
          },
          invalidateOnRefresh: true,
          // markers: true,
        },
      })
      .fromTo(awardBg.current, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.1, ease: 'none' })
      .to(awardList.current, {
        y: -lContainer.current.clientHeight,
        ease: 'none',
      }, 0.1)
    }, award.current)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={award} className='award'>
      <div ref={awardCardArea} className='award-card-area'>
        {patients.map((patient, i) => (
          <div
            ref={(el) => awardCardItems.current[i] = el}
            key={`${i}-${patient.name}-${i}`}
            className='award-card-item'
          >
            <div className='card-award'>
              <article className={`card-award-article card-award-article-${i}`}>
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
      <div ref={awardBg} className='award-bg'>
        <div className='award-inner'>
          <div ref={lContainer} className='l-container'>
            <span className='award-title-read-area'>
              <AppReadTitle />
            </span>
            <div className='award-list-line'>
              <BezierCurve />
            </div>
            <div className='award-list-wrapper'>
              <div
                ref={awardList}
                className='award-list'
                onMouseEnter={() => mouseEnter()}
                onMouseMove={(e) => mouseMove(e)}
                onMouseLeave={() => mouseLeave()}
              >
                {patients.map((patient, i) => (
                  <div
                    key={`${patient.name}-${i}`}
                    onMouseEnter={() => {
                      handleHover(i)
                      scrambleText(i, patient.name, patient.duration)
                    }}
                    onMouseLeave={() => handleLeave(i)}
                    className={`award-item award-item-${i}`}
                  >
                    <div className='award-item-text-wrapper'>
                      <p ref={(el) => headingRefs.current[i] = el} className='award-group text-zinc-100 dark:text-zinc-600'>{patient.name}</p>
                      <p ref={(el) => descriptionRefs.current[i] = el} className='award-title text-zinc-100 dark:text-zinc-600'>{patient.duration}</p>
                    </div>
                  </div>
                ))}
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
      <span className='text-xs text-gray-300'>●</span>
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

const patients = [
  {
    name: 'Lainie',
    image: '../images/testimonials/laniepurple.png',
    duration: '20 months',
  },
  {
    name: 'Ron L.',
    image: '../images/testimonials/Ron_Lucien.jpg',
    duration: 'INVISALIGN',
  },
  {
    name: 'Elizabeth',
    image: '../images/testimonials/elizabethpatient.jpeg',
    duration: 'INVISALIGN, GROWTH APPLIANCE',
  },
  {
    name: 'Kinzie',
    image: '../images/testimonials/kinzie1.jpg',
    duration: 'BRACES, 24 months',
  },
  { name: 'Kasprenski',
    image: '../images/testimonials/kasprenski.jpg',
    duration: '--',
  },
  {
    name: 'Leanne',
    image: '../images/testimonials/leanne.png',
    duration: '12 months',
  },
  {
    name: 'Harold',
    image: '../images/testimonials/Narvaez.jpg',
    duration: 'Invisalign',
  },
  { name: 'Rosie & Grace',
    image: '../images/testimonials/Rosiegrace.png',
    duration: '--',
  },
  {
    name: 'Keith',
    image: '../images/testimonials/hobsonblue.png',
    duration: '--',
  },
  {
    name: 'Justin',
    image: '../images/testimonials/hurlburt.jpeg',
    duration: 'Invisalign, 2 years',
  },
  { name: 'Kara',
    image: '../images/testimonials/Kara.jpeg',
    duration: '--',
  },
  {
    name: 'Sophia',
    image: '../images/testimonials/Sophia_Lee.jpg',
    duration: '2 years, Braces',
  },
  { name: 'Brynn',
    image: '../images/testimonials/brynnportrait.png',
    duration: '--',
  },
  { name: 'Emma',
    image: '../images/testimonials/Emma.png',
    duration: '--',
  },
  {
    name: 'Brooke',
    image: '../images/testimonials/Brooke_Walker.jpg',
    duration: '2 years, Braces',
  },
  {
    name: 'Nilaya',
    image: '../images/testimonials/nilaya.jpeg',
    duration: 'Braces',
  },
  { name: 'Maria A.',
    image: '../images/testimonials/Maria_Anagnostou.jpg',
    duration: '--',
  },
  {
    name: 'Natasha K.',
    image: '../images/testimonials/Natasha_Khela.jpg',
    duration: '--',
  },
  {
    name: 'James C.',
    image: '../images/testimonials/James_Cipolla.jpg',
    duration: 'Invisalign, 2 years',
  },
  {
    name: 'Devika K.',
    image: '../images/testimonials/Devika_Knafo.jpg',
    duration: '--',
  },
  {
    name: 'Ibis S.',
    image: '../images/testimonials/Ibis_Subero.jpg',
    duration: 'Invisalign, 1 year',
  },
  { name: 'Abigail',
    image: '../images/testimonials/abigail.png',
    duration: '--',
  },
  { name: 'Emma',
    image: '../images/testimonials/EmmaF.png',
    duration: '--',
  },
  {
    name: 'Karoun G',
    image: '../images/test/base.jpg',
    duration: 'Motion Appliance, Invisalign',
  },
]