'use client'
import './style.css'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

export default function Page() {
  const mainSection = useRef(null)
  const itemsContainer = useRef(null)

  useEffect(() => {
    const items = document.querySelectorAll('.MainSectionItem')
    const innerItems = document.querySelectorAll('.MainSectionItem-inner')
    const innerStickies = document.querySelectorAll('.MainSectionItem-innerSticky')
    const imageContainers = document.querySelectorAll('.MainSectionItem-imageContainer')
    const imageContainersInner = document.querySelectorAll('.MainSectionItem-imageContainerInner')
    const images = document.querySelectorAll('.MainSectionItem-image')
    const headTitle = document.querySelector('.MainSection-headTitle')
    const navItemTitles = document.querySelectorAll('.MainSection-navItemTitle')
    const navProgressBar = document.querySelectorAll('.MainSection-navProgressBar')

    navItemTitles.forEach((item, i) => {
      gsap.set(item, { translate: "none", rotate: "none", scale: "none", transform: "translate3d(0px, 5rem, 0px)" })
    })

    images.forEach((image, i) => {
      gsap.set(image, { aspectRatio: 1.3793103448275863 })
    })

    let splitheadTitle = SplitText.create(headTitle, { type: 'chars, words', charsClass: 'chars' })
    gsap.from(splitheadTitle.chars, {
      y: 50,
      opacity: 0,
      transformOrigin: '0% 50% -50',
      stagger: 0.05,
      duration: 2,
      ease: 'none',
      onComplete: () => {
        headTitle.removeAttribute('aria-hidden')
      }
    })

    let mm = gsap.matchMedia()

    mm.add('(max-width: 1079px)', () => {
      const mobile = gsap.context(() => {
        innerStickies.forEach((item, i) => {
          ScrollTrigger.create({
            trigger: item,
            start: item.offsetHeight < window.innerHeight ? 'top top' : 'bottom bottom',
            endTrigger: innerStickies[i + 1],
            end: 'top top',
            pin: true,
            pinSpacing: false,
            invalidateOnRefresh: true,
            markers: false,
          })
        })
      }, itemsContainer.current)
      return () => mobile.revert()
    })

    mm.add('(min-width: 1080px)', () => {
      const desktop = gsap.context(() => {

        let tl = gsap.timeline({
          scrollTrigger: {
            trigger: mainSection.current,
            start: 'top top',
            end: `+=${items.length * 100}%`,
            pin: true,
            scrub: 1, // true
            invalidateOnRefresh: true,
            markers: false,
          },
          defaults: { ease: 'none' },
        })

        tl.add(() => {
          tl.addLabel('progress-bar')
          tl.fromTo(navProgressBar, { xPercent: -80 }, { xPercent: 0, duration: tl.duration(), ease: 'none' }, 0)
        })
        
        // --- Phase 1 ---        
        tl.addLabel('phase-1')
        tl.fromTo(items[0], { xPercent: 0 }, { xPercent: -100 })
        tl.fromTo(innerItems[0], { xPercent: 0 }, { xPercent: 100 }, '<')
        tl.fromTo(imageContainers[0], { xPercent: -60, scale: 1, transformOrigin: '100% 100% 0px' }, { xPercent: -150, scale: 0.8 }, '<')
        tl.fromTo(imageContainersInner[0], { xPercent: 0, scale: 1, transformOrigin: '50% 50% 0px' }, { xPercent: -150, scale: 1.2 }, '<')
        tl.fromTo(items[1], { xPercent: 80 }, { xPercent: 0 }, '<')
        tl.fromTo(innerItems[1], { xPercent: -80 }, { xPercent: 0 }, '<')
        tl.fromTo(imageContainers[1], { xPercent: -15, scale: 0.45, transformOrigin: '100% 100% 0px' }, { xPercent: -60, scale: 1.0 }, '<')
        tl.fromTo(imageContainersInner[1], { scale: 1.55, transformOrigin: '50% 50% 0px' }, { scale: 1.0 }, '<')
        tl.fromTo(items[2], { xPercent: 95 }, { xPercent: 80 }, '<')
        tl.fromTo(innerItems[2], { xPercent: -95 }, { xPercent: -80 }, '<')
        tl.fromTo(imageContainers[2], { xPercent: 0, scale: 0.15, transformOrigin: '100% 100% 0px' }, { xPercent: -15, scale: 0.45 }, '<')
        tl.fromTo(imageContainersInner[2], { scale: 1.85, transformOrigin: '50% 50% 0px' }, { scale: 1.55 }, '<')
        tl.fromTo(items[3], { xPercent: 100 }, { xPercent: 95 }, '<')
        tl.fromTo(innerItems[3], { xPercent: -100 }, { xPercent: -95 }, '<')
        tl.fromTo(imageContainers[3], { scale: 0, transformOrigin: '100% 100% 0px' }, { scale: 0.15 }, '<')
        tl.fromTo(imageContainersInner[3], { scale: 2, transformOrigin: '50% 50% 0px' }, { scale: 1.85 }, '<')
        
        // --- Phase 2 (starts AFTER phase 1 finishes) ---
        tl.addLabel('phase-2', '>')
        tl.fromTo(items[1], { xPercent: 0 }, { xPercent: -100 })
        tl.fromTo(innerItems[1], { xPercent: 0 }, { xPercent: 100 }, '<')
        tl.fromTo(imageContainers[1], { xPercent: -60, scale: 1.0, transformOrigin: '100% 100% 0px' }, { xPercent: -150, scale: 0.8 }, '<')
        tl.fromTo(imageContainersInner[1], { scale: 1.0, transformOrigin: '50% 50% 0px' }, { scale: 1.2 }, '<')
        tl.fromTo(items[2], { xPercent: 80 }, { xPercent: 0 }, '<')
        tl.fromTo(innerItems[2], { xPercent: -80 }, { xPercent: 0 }, '<')
        tl.fromTo(imageContainers[2], { xPercent: -15, scale: 0.45, transformOrigin: '100% 100% 0px' }, { xPercent: -60, scale: 1.0 }, '<')
        tl.fromTo(imageContainersInner[2], { scale: 1.55, transformOrigin: '50% 50% 0px' }, { scale: 1.0 }, '<')
        tl.fromTo(items[3], { xPercent: 95 }, { xPercent: 80 }, '<')
        tl.fromTo(innerItems[3], { xPercent: -95 }, { xPercent: -80 }, '<')
        tl.fromTo(imageContainers[3], { xPercent: 0, scale: 0.15, transformOrigin: '100% 100% 0px' }, { xPercent: -15, scale: 0.45 }, '<')
        tl.fromTo(imageContainersInner[3], { scale: 1.85, transformOrigin: '50% 50% 0px' }, { scale: 1.55 }, '<')
        tl.fromTo(items[4], { xPercent: 100 }, { xPercent: 95 }, '<')
        tl.fromTo(innerItems[4], { xPercent: -100 }, { xPercent: -95 }, '<')
        tl.fromTo(imageContainers[4], { scale: 0, transformOrigin: '100% 100% 0px' }, { scale: 0.15 }, '<')
        tl.fromTo(imageContainersInner[4], { scale: 2, transformOrigin: '50% 50% 0px' }, { scale: 1.85 }, '<')
        
        // --- Phase 3 (starts AFTER phase 2 finishes) ---
        tl.addLabel('phase-3', '>')
        tl.fromTo(items[2], { xPercent: 0 }, { xPercent: -100 })
        tl.fromTo(innerItems[2], { xPercent: 0 }, { xPercent: 100 }, '<')
        tl.fromTo(imageContainers[2], { xPercent: -60, scale: 1.0, transformOrigin: '100% 100% 0px' }, { xPercent: -150, scale: 0.8 }, '<')
        tl.fromTo(imageContainersInner[2], { scale: 1.0, transformOrigin: '50% 50% 0px' }, { scale: 1.2 }, '<')
        tl.fromTo(items[3], { xPercent: 80 }, { xPercent: 0 }, '<')
        tl.fromTo(innerItems[3], { xPercent: -80 }, { xPercent: 0 }, '<')
        tl.fromTo(imageContainers[3], { xPercent: -15, scale: 0.45, transformOrigin: '100% 100% 0px' }, { xPercent: -60, scale: 1.0 }, '<')
        tl.fromTo(imageContainersInner[3], { scale: 1.55, transformOrigin: '50% 50% 0px' }, { scale: 1.0 }, '<')
        tl.fromTo(items[4], { xPercent: 95 }, { xPercent: 80 }, '<')
        tl.fromTo(innerItems[4], { xPercent: -95 }, { xPercent: -80 }, '<')
        tl.fromTo(imageContainers[4], { scale: 0.15, transformOrigin: '100% 100% 0px' }, { scale: 0.6 }, '<')
        tl.fromTo(imageContainersInner[4], { scale: 1.85, transformOrigin: '50% 50% 0px' }, { scale: 1.55 }, '<')
        
        // --- Phase 4 (starts AFTER phase 3 finishes) ---
        tl.addLabel('phase-4', '>')
        tl.fromTo(items[3], { xPercent: 0 }, { xPercent: -100 })
        tl.fromTo(innerItems[3], { xPercent: 0 }, { xPercent: 100 }, '<')
        tl.fromTo(imageContainers[3], { xPercent: -60, scale: 1.0, transformOrigin: '100% 100% 0px' }, { xPercent: -150, scale: 0.8 }, '<')
        tl.fromTo(imageContainersInner[3], { scale: 1.0, transformOrigin: '50% 50% 0px' }, { scale: 1.2 }, '<')
        tl.fromTo(items[4], { xPercent: 80 }, { xPercent: 0 }, '<')
        tl.fromTo(innerItems[4], { xPercent: -80 }, { xPercent: 0 }, '<')
        tl.fromTo(imageContainers[4], { xPercent: 0, scale: 0.6, transformOrigin: '100% 100% 0px' }, { xPercent: -60, scale: 1.0 }, '<')
        tl.fromTo(imageContainersInner[4], { scale: 1.55, transformOrigin: '50% 50% 0px' }, { scale: 1.0 }, '<')
        
      }, mainSection.current)
      return () => desktop.revert()
    })
    
    return () => mm.revert()
  }, [])
  
  return (
    <div className="AdultOrthodonticsSection">
          <div ref={mainSection} className="MainSection` --dark --in-view" style={{ backgroundColor: 'var(--blue)', '--91c5acce': 5, }}>
      <div className="MainSection-wrap">
        <div className="MainSection-head">
          <h2 className="SplitText AnimatedSplitText --anim-title MainSection-headTitle AppTitle-1 --in-view" style={{ opacity: 1, visibility: "inherit" }}>
            {"Adult Orthodontics".split(" ").map((word, i) => (
              <div key={word} style={{ display: "block", textAlign: "start", position: "relative" }} className={`head-lines head-lines${i + 1}`}>
                {word.split("").map((char, j) => (
                  <div key={`${char}-${j}`} className="chars-wrapper">
                    <div
                      style={{
                        position: "relative",
                        display: "inline-block",
                        transformOrigin: "50% 100% 0px",
                        opacity: 1,
                        visibility: "inherit",
                        transform: "translate3d(0px, 0px, 0px)"
                      }}
                      className={`chars chars${j + 1}`}
                    >
                      {char}
                    </div>
                  </div>
                ))}

                {i < "Early Orthodontics".split(" ").length - 1 && (
                  <div className="chars-wrapper">
                    <div className="chars">&nbsp;</div>
                  </div>
                )}
              </div>
            ))}
          </h2>
        </div>
        <div ref={itemsContainer} className="MainSection-items">
          <div className="MainSectionItem MainSection-item">
            <div className="--index-first MainSectionItem-inner">
              <div className="MainSectionItem-innerSticky">
                <div className="MainSectionItem-background" style={{ backgroundColor: 'var(--blue)', }} />
                <div className="MainSectionItem-content">
                  <span className="MainSectionItem-index">01</span>
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">Who do we treat?</h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="AppParagraph">Whether you've had orthodontic treatment before or are exploring it for the first time, we're here to help you achieve your smile goals. We treat adults experiencing orthodontic relapse after previous treatment, as well as those who've noticed gradual dental shifting over the years. Invisalign allows us to treat patients with periodontal concerns—including tissue loss and compromised bone support—with greater precision than braces.</p>
                    </div>
                
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
                    <div className="AppImage MainSectionItem-image">
                      <div className="AppImage-image --placeholder --lazy --loaded" style={{ objectFit: 'cover', backgroundImage: "url('/images/test/1.jpg')", backgroundSize: 'cover', backgroundPosition: 'center center', }} ></div>
                     <video
  src="https://www.stephen-wells.com/media/pages/projects/nutiani/fc3e968038-1730620681/taichi_3.3.mp4#t=0.1"
  alt="Video of a landscape"
  loading="lazy"
  style={{ objectFit: 'cover' }}
  loop
  autoPlay
  muted
  playsInline
/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="MainSectionItem MainSection-item">
            <div className="--index-between MainSectionItem-inner">
              <div className="MainSectionItem-innerSticky">
                <div className="MainSectionItem-background" style={{ backgroundColor: 'var(--pink)', }} />
                <div className="MainSectionItem-content">
                  <span className="MainSectionItem-index">02</span>
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">Accelerated Movement</h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="AppParagraph">We're proud to be the first practice in the area to focus on accelerated adult orthodontics, using devices that optimize tooth movement in mature bone. Our doctors have trained extensively with leaders in TAD-assisted orthodontics (Temporary Anchorage Devices) and routinely design non-surgical treatment plans for patients seeking alternatives to orthognathic surgery.</p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
               <div className="AppImage MainSectionItem-image image-wrapper">


  <div
    className="AppImage-image --placeholder --lazy --loaded base-image"
    style={{
      objectFit: 'cover',
      backgroundImage: "url('/images/test/2.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center center'
    }}
  ></div>


  <img
    src="/images/nasionanolines.png"
    alt="Facial silhouette"
    loading="lazy"
    className="profile-image"
  />


<svg
  className="overlay-lines"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 100 100"
  preserveAspectRatio="none"
>
  {/* Vertical line */}
  <line 
    x1="69" y1="30" 
    x2="69" y2="73" 
    stroke="#ffffff80" 
    strokeWidth="0.5"
    strokeLinecap="round"
      stroke-dasharray="2 3"
    vectorEffect="non-scaling-stroke"
  />

  {/* Long diagonal */}
  <line 
    x1="30" y1="38" 
    x2="72" y2="75" 
    stroke="#ffffff80" 
    strokeWidth="0.5" 
    strokeLinecap="round" 
      stroke-dasharray="2 3"
    vectorEffect="non-scaling-stroke"
  />

  {/* Upper horizontal */}
  <line
    x1="55" y1="31"
    x2="74" y2="31"
    stroke="#ffffff80"
    strokeWidth="0.5"
    strokeLinecap="round"
      stroke-dasharray="2 3"
    vectorEffect="non-scaling-stroke"
  />

  {/* Lower horizontal */}
  <line
    x1="47" y1="61"
    x2="73" y2="61"
    stroke="#ffffff80"
    strokeWidth="0.5"
    strokeLinecap="round"
      stroke-dasharray="2 3"
    vectorEffect="non-scaling-stroke"
  />


  <line
    x1="75" y1="56"
    x2="69" y2="73"
    stroke="#ffffff80"
    strokeWidth="0.5"
    strokeLinecap="round"
      stroke-dasharray="2 3"
    vectorEffect="non-scaling-stroke"
  />
</svg>

</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="MainSectionItem MainSection-item">
            <div className="--index-between MainSectionItem-inner">
              <div className="MainSectionItem-innerSticky">
                <div className="MainSectionItem-background" style={{ backgroundColor: 'var(--green)', }} />
                <div className="MainSectionItem-content">
                  <span className="MainSectionItem-index">03</span>
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">Coordinated Care</h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="AppParagraph">When jaw surgery is the pursued path, we coordinate closely with the region's top oral and maxillofacial surgeons to ensure care continuity, expert management, and care that remains conveniently local.</p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
                    <div className="AppImage MainSectionItem-image">
                      <div className="AppImage-image --placeholder --lazy --loaded" style={{ objectFit: 'cover', backgroundImage: "url('/images/test/3.jpg')", backgroundSize: 'cover', backgroundPosition: 'center center', }} ></div>
                      <img src="/images/test/3.jpg" width="480" height="348" alt="Video of a landscape" loading="lazy" style={{ objectFit: 'cover' }}></img>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="MainSectionItem MainSection-item">
            <div className="--index-between MainSectionItem-inner">
              <div className="MainSectionItem-innerSticky">
                <div className="MainSectionItem-background" style={{ backgroundColor: 'var(--beige)', }} />
                <div className="MainSectionItem-content">
                  <span className="MainSectionItem-index">04</span>
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">Our Philosophy</h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="AppParagraph">Orthodontics has always been rooted in understanding how bone structure, dental positioning, and soft tissue interact to shape the face—not just in growing faces, but in aging ones too. Our doctors bring a natural appreciation for facial aesthetics, shaped by their orthodontic training and clinical expertise.</p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
                    <div className="AppImage MainSectionItem-image">
                      <div className="AppImage-image --placeholder --lazy --loaded" style={{ objectFit: 'cover', backgroundImage: "url('/images/test/base.jpg')", backgroundSize: 'cover', backgroundPosition: 'center center', }} ></div>
                      <img src="/images/face-line-art.png" width="480" height="348" alt="Video of a landscape" loading="lazy" style={{ objectFit: 'cover' }}></img>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="MainSectionItem --bg-terra MainSection-item">
            <div className="--index-last MainSectionItem-inner">
              <div className="MainSectionItem-innerSticky">
                <div className="MainSectionItem-background" style={{ backgroundColor: 'var(--terra)', }} />
                <div className="MainSectionItem-content">
                  <span className="MainSectionItem-index">05</span>
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">AAFE</h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="AppParagraph">Because of this foundation, we approach cosmetic treatment by addressing skeletal balance first—restoring harmony at the level of the hard tissue. Prioritizing the skeletal foundation allows us to minimize reliance on overfilling and support outcomes that look natural and require less upkeep.  As members of the American Academy of Facial Esthetics (AAFE), our doctors offer Botox and dermal fillers as part of a comprehensive, structure-first approach to confidence and care.
</p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
                    <div className="AppImage MainSectionItem-image">
                      <div className="AppImage-image --placeholder --lazy --loaded" style={{ objectFit: 'cover', backgroundImage: "url('/images/test/hover.jpg')", backgroundSize: 'cover', backgroundPosition: 'center center', }} ></div>
                      <img src="/images/aafe.png" width="480" height="348" alt="Video of a landscape" loading="lazy" style={{ objectFit: 'cover' }}></img>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="MainSection-nav">
          <div className="MainSection-navItem AppSmallText-1">
            <span>01</span>
            <span className="MainSection-navItemTitle">Section One</span>
          </div>
          <div className="MainSection-navItem AppSmallText-1">
            <span>02</span>
            <span className="MainSection-navItemTitle">Section Two</span>
          </div>
          <div className="MainSection-navItem AppSmallText-1">
            <span>03</span>
            <span className="MainSection-navItemTitle">Section Three</span>
          </div>
          <div className="MainSection-navItem AppSmallText-1">
            <span>04</span>
            <span className="MainSection-navItemTitle">Section Four</span>
          </div>
          <div className="MainSection-navItem AppSmallText-1">
            <span>05</span>
            <span className="MainSection-navItemTitle">Section Five</span>
          </div>
          <div className="MainSection-navProgress">
            <span className="MainSection-navProgressBar"></span>
          </div>
        </div>
      </div>
    </div>
    </div>

  )
}