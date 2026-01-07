'use client'
import './style.css'
import React, { forwardRef, use, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import ScrambleTextPlugin from 'gsap/ScrambleTextPlugin'
import { patients } from './patients'

gsap.registerPlugin(ScrambleTextPlugin)

// tracking two card awards
// prev and current
// when hovering next card award set current to prev and next to current
// when setting current to prev translate inner div +100% and inner image -100%
// when setting next to current translate inner div 0% and inner image 0%
{/* <article ref={(el) => cardAwardArticles.current[i] = el} className={`card-award-article card-award-article-${i}`}>
  <div ref={(el) => cardAwardInnerDivs.current[i] = el} className='card-award-inner'>
    <img
      ref={(el) => cardAwardInnerImages.current[i] = el}
      className='card-award-inner-image'
      src={patient.image}
      alt={patient.name}
      width='112'
      height='66'
    />
  </div>
</article> */}

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


// useEffect(() => {
//   const setBackgroundImages = () => {
//     for (let i = 0; i < patients.length; i++) {
//       gsap.set(awardCardItems.current[i], {
//         backgroundImage: `url(${patients[i].image})`,
//       })
//     }
//   }
//   setBackgroundImages()
// }, [])

//  <div className='award-card-area'>
//   {patients.map((patient, i) => (
//     <div
//       key={`${i}-${patient.name}-${i}`}
//       className='award-card-item'
//     >
//       <div className='card-award'>
//         <article className={`card-award-article card-award-article-${i}`}>
//           <div className='card-award-inner'>
//             <img
//               className='card-award-inner-image'
//               src={patient.image}
//               alt={patient.name}
//             />
//           </div>
//         </article>
//       </div>
//     </div>
//   ))}
// </div>

function ScrollListThree() {
  const award = useRef(null)
  const awardCardArea = useRef(null)
  const cardAwardArticles = useRef([])
  const cardAwardInnerDivs = useRef([])
  const cardAwardInnerImages = useRef([])
  const awardItems = useRef([])
  const headingRefs = useRef([])
  const descriptionRefs = useRef([])
  const lastIndex = useRef(null)

  const scrambleTextAnimation = (index, heading, description) => {
    const scramble = {
      characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      speed: 0.8,
      newChars: 0.3,
      revealDelay: 0,
      tweenLength: true,
    }
    gsap.to(headingRefs.current[index], {
      duration: 1.5,
      scrambleText: { text: heading, ...scramble },
      ease: 'power2.out',
    })

    gsap.to(descriptionRefs.current[index], {
      duration: 1.5,
      scrambleText: { text: description || '--', ...scramble },
      ease: 'power2.out',
    })
  }

  const moveAwardCardArea = () => {
    gsap.set(awardCardArea.current, {
      xPercent: -50,
      yPercent: -50,
    })

    const awardCardAreaAnimation = (e) => {
      gsap.to(awardCardArea.current, {
        x: e.clientX + 16,
        y: e.clientY + 16,
        overwrite: 'auto',
        ease: 'power2.out',
        duration: 0.5,
      })
    }

    window.addEventListener('mousemove', awardCardAreaAnimation)
    
    return () =>  window.removeEventListener('mousemove', awardCardAreaAnimation)
  }

  const showAwardCardArea = (e, index) => {
    gsap.to(awardCardArea.current, {
      opacity: 1,
      zIndex: patients.length + 10,
    })
    moveAwardCardArea()
    onMouseEnter(e, index)
  }

  const hideAwardCardArea = (e, index) => {
    gsap.to(awardCardArea.current, { opacity: 0 })
    onMouseLeave(e, index)
  }

  const onMouseEnter = (e, index) => {
    const tl = gsap.timeline({
      onStart: () => {
        gsap.set(cardAwardArticles.current[index], { opacity: 1 })
        gsap.set(cardAwardInnerDivs.current[index], { zIndex: patients.length })
      }
    }) 
    const direction =
      lastIndex.current === null
      ? 1
      : index > lastIndex.current
      ? 1
      : -1

    lastIndex.current = index
    
    tl.to(cardAwardInnerDivs.current[index], {
      ease: 'sine.out',
      duration: 0.2,
      startAt: { x: `${direction * 100}%` },
      x: '0%',
    }).to(cardAwardInnerImages.current[index], {
      ease: 'sine.out',
      duration: 0.2,
      startAt: { x: `${direction * 100}%` },
      x: '0%',
    }, 0)
    lastIndex.current = null
  }

  const onMouseLeave = (e, index) => {
    gsap.killTweensOf([cardAwardInnerDivs.current[index], cardAwardInnerImages.current[index]])

    const direction =
      lastIndex.current === null
      ? 1
      : index > lastIndex.current
      ? 1
      : -1

    const tl = gsap.timeline({
      onStart: () => {
        gsap.set(awardItems.current[index], { zIndex: 1 })
      },
      onComplete: () => {
        gsap.set(cardAwardArticles.current[index], { opacity: 0 })
      }
    })
    tl.to(cardAwardInnerDivs.current[index], {
      ease: 'sine.out',
      duration: 0.2,
      x: `${-direction * 100}%`,
    })
    .to(cardAwardInnerImages.current[index], {
      ease: 'sine.out',
      duration: 0.2,
      x: `${direction * 100}%`,
    }, 0)
  }

  return (
    <div ref={award} className='award'>
      <div ref={awardCardArea} className='award-card-area'>
        {patients.map((patient, i) => (
          <div
            key={`${i}-${patient.name}-${i}`}
            className='award-card-item'
          >
            <div className='card-award'>
              <article ref={(el) => cardAwardArticles.current[i] = el} className={`card-award-article card-award-article-${i}`}>
                <div ref={(el) => cardAwardInnerDivs.current[i] = el} className='card-award-inner'>
                  <img
                    ref={(el) => cardAwardInnerImages.current[i] = el}
                    className='card-award-inner-image'
                    src={patient.image}
                    alt={patient.name}
                    width='112'
                    height='66'
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
              <div className='award-list'>
                {patients.map((patient, i) => (
                  <div
                    ref={(el) => awardItems.current[i] = el}
                    key={`${patient.name}-${i}`}
                    onMouseEnter={(e) => showAwardCardArea(e, i)}
                    onMouseLeave={(e) => hideAwardCardArea(e, i)}
                    className='award-item'
                  >
                    <BezierCurve />
                    <div
                      onMouseEnter={() => scrambleTextAnimation(i, patient.name, patient.duration)} 
                      className='award-item-text-wrapper'
                    >
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

// this.DOM = {el: el}; / el is the <a> with class "menu__item"
// this is the element that gets its position animated (and perhaps other properties like the rotation etc..)
// this.DOM.reveal = document.createElement('div');
// this.DOM.reveal.className = 'hover-reveal';
// the next two elements could actually be only one, the image element
// adding an extra wrapper (revealInner) around the image element with overflow hidden, gives us the possibility to scale the image inside
// this.DOM.revealInner = document.createElement('div');
// this.DOM.revealInner.className = 'hover-reveal__inner';
// this.DOM.revealImage = document.createElement('div');
// this.DOM.revealImage.className = 'hover-reveal__img';
// this.DOM.revealImage.style.backgroundImage = `url(${images[this.inMenuPosition][1]})`;

// create the image structure
// we want to add/append to the menu item the following html:
// <div class="hover-reveal">
//   <div class="hover-reveal__inner" style="overflow: hidden;">
//     <div class="hover-reveal__img" style="background-image: url(pathToImage);">
//     </div>
//   </div>
// </div>

// const tl = gsap.timeline({
//   onStart: () => {
//     gsap.set(cardAwardInnerImage.current.style, { zIndex: 999 })
//   }
// })
// tl.fromTo(cardAwardInnerDiv.current, { xPercent: 0 }, { xPercent: -100 } )
// tl.fromTo(cardAwardInnerImage.current, { xPercent: -100 }, { xPercent: 100 }, '<')

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

function OldScrollList() {
  const headingRefs = useRef([])
  const descriptionRefs = useRef([])

  const handleHover = (i, name, duration) => {
    const scramble = {
      characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      speed: 0.8,
      newChars: 0.3,
      revealDelay: 0,
      tweenLength: true,
    }
    gsap.to(headingRefs.current[i], {
      duration: 1.5,
      scrambleText: { text: name, ...scramble },
      ease: 'power2.out',
    })

    gsap.to(descriptionRefs.current[i], {
      duration: 1.5,
      scrambleText: { text: duration || '--', ...scramble },
      ease: 'power2.out',
    })
  }

  return (
    <div className='px-16 py-32 font-neuehaas45'>
      <div className='flex justify-center items-center gap-4 tracking-wider px-4 sm:px-0'>
        <span className='text-sm'>●</span>
        <h3 className='text-sm/6'>Our patient results</h3>
        <span className='text-sm text-gray-300'>●</span>
        <h3 className='mt-1 max-w-2xl text-sm/6'>Read the reviews</h3>
      </div>
      <div className='mt-6 border-t border-gray-100 dark:border-white/10'>
        <dl className='divide-y divide-gray-100 dark:divide-white/10'>
          {patients.map((_, i) => (
            <div key={`${i}-${_.name}`} className='px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0' onMouseEnter={() => handleHover(i, _.name, _.duration)}>
              <dt ref={(el) => headingRefs.current[i] = el} className='text-sm/6 tracking-wider uppercase'>{_.name}</dt>
              <dd ref={(el) => descriptionRefs.current[i] = el} className='mt-1 text-sm/6 tracking-wider uppercase sm:col-span-2 sm:mt-0'>{_.duration === '' ? '--' : _.duration}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

function OldScrollListTwo() {
  const award = useRef(null)
  const awardCardArea = useRef(null)
  const awardCardItems = useRef([])
  const awardList = useRef(null)
  const headingRefs = useRef([])
  const descriptionRefs = useRef([])

  const scrambleTextAnimation = (i, name, duration) => {
    const scramble = {
      characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      speed: 0.8,
      newChars: 0.3,
      revealDelay: 0,
      tweenLength: true,
    }
    gsap.to(headingRefs.current[i], {
      duration: 1.5,
      scrambleText: { text: name, ...scramble },
      ease: 'power2.out',
    })

    gsap.to(descriptionRefs.current[i], {
      duration: 1.5,
      scrambleText: { text: duration || '--', ...scramble },
      ease: 'power2.out',
    })
  }

  const showAwardCardArea = (card, index) => {
    gsap.to(awardCardArea.current, {
      opacity: 1,
    })
    gsap.to(awardCardItems.current[index], {
      clipPath: 'polygon(0px 0px, 100% 0px, 100% 100%, 0% 100%)',
    })
    // clip-path: polygon(100% 0px, 100% 0px, 100% 100%, 100% 100%);
  }

  const moveAwardCardArea = () => {
    gsap.set(awardCardArea.current, {
      xPercent: -50,
      yPercent: -50,
    })

    const awardCardAreaAnimation = (e) => {
      gsap.to(awardCardArea.current, {
        x: e.clientX + 16,
        y: e.clientY + 16,
        overwrite: 'auto',
        ease: 'power2.out',
        duration: 0.5,
      })
    }

    window.addEventListener('mousemove', awardCardAreaAnimation)
    
    return () => {
      window.removeEventListener('mousemove', awardCardAreaAnimation)
    }
  }

  const animateOutCardArea = (index) => {
    gsap.to(awardCardArea.current, {
      opacity: 0,
    })
    gsap.to(awardCardItems.current[index], {
      clipPath: 'polygon(100% 0px, 100% 0px, 100% 100%, 100% 100%)',
    })
  }
  
  useEffect(() => {
    if (!awardCardArea.current) return

    // const isTouchDevice = 'ontouchstart' in window    
    // if (!isTouchDevice) {
    //   animateAwardCardArea()
    // }

    moveAwardCardArea()
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
            <CardAward index={i} {...patient} />
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
              <div ref={awardList} className='award-list'>
                {patients.map((patient, i) => (
                  <div
                    key={`${patient.name}-${i}`}
                    onMouseEnter={() => showAwardCardArea(i)}
                    onMouseLeave={() => animateOutCardArea(i)}
                    className='award-item'
                  >
                    <BezierCurve />
                    <div
                      onMouseEnter={() => scrambleTextAnimation(i, patient.name, patient.duration)} 
                      className='award-item-text-wrapper'
                    >
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