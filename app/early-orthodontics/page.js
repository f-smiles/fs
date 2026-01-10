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
          tl.fromTo(navProgressBar, { xPercent: -85 }, { xPercent: 0, duration: tl.duration(), ease: 'none' }, 0)
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
        tl.fromTo(imageContainers[4], { xPercent: 0, scale: 0.15, transformOrigin: '100% 100% 0px' }, { xPercent: -15, scale: 0.45 }, '<')
        tl.fromTo(imageContainersInner[4], { scale: 1.85, transformOrigin: '50% 50% 0px' }, { scale: 1.55 }, '<')
        tl.fromTo(items[5], { xPercent: 100 }, { xPercent: 95 }, '<')
        tl.fromTo(innerItems[5], { xPercent: -100 }, { xPercent: -95 }, '<')
        tl.fromTo(imageContainers[5], { scale: 0, transformOrigin: '100% 100% 0px' }, { scale: 0.15 }, '<')
        tl.fromTo(imageContainersInner[5], { scale: 2, transformOrigin: '50% 50% 0px' }, { scale: 1.85 }, '<')
        
        // --- Phase 4 (starts AFTER phase 3 finishes) ---
        tl.addLabel('phase-4', '>')
        tl.fromTo(items[3], { xPercent: 0 }, { xPercent: -100 })
        tl.fromTo(innerItems[3], { xPercent: 0 }, { xPercent: 100 }, '<')
        tl.fromTo(imageContainers[3], { xPercent: -60, scale: 1.0, transformOrigin: '100% 100% 0px' }, { xPercent: -150, scale: 0.8 }, '<')
        tl.fromTo(imageContainersInner[3], { scale: 1.0, transformOrigin: '50% 50% 0px' }, { scale: 1.2 }, '<')
        tl.fromTo(items[4], { xPercent: 80 }, { xPercent: 0 }, '<')
        tl.fromTo(innerItems[4], { xPercent: -80 }, { xPercent: 0 }, '<')
        tl.fromTo(imageContainers[4], { xPercent: -15, scale: 0.45, transformOrigin: '100% 100% 0px' }, { xPercent: -60, scale: 1.0 }, '<')
        tl.fromTo(imageContainersInner[4], { scale: 1.55, transformOrigin: '50% 50% 0px' }, { scale: 1.0 }, '<')
        tl.fromTo(items[5], { xPercent: 95 }, { xPercent: 80 }, '<')
        tl.fromTo(innerItems[5], { xPercent: -95 }, { xPercent: -80 }, '<')
        tl.fromTo(imageContainers[5], { scale: 0.15, transformOrigin: '100% 100% 0px' }, { scale: 0.6 }, '<')
        tl.fromTo(imageContainersInner[5], { scale: 1.85, transformOrigin: '50% 50% 0px' }, { scale: 1.55 }, '<')

        // --- Phase 5 (starts AFTER phase 4 finishes) ---
        tl.addLabel('phase-5', '>')
        tl.fromTo(items[4], { xPercent: 0 }, { xPercent: -100 })
        tl.fromTo(innerItems[4], { xPercent: 0 }, { xPercent: 100 }, '<')
        tl.fromTo(imageContainers[4], { xPercent: -60, scale: 1.0, transformOrigin: '100% 100% 0px' }, { xPercent: -150, scale: 0.8 }, '<')
        tl.fromTo(imageContainersInner[4], { scale: 1.0, transformOrigin: '50% 50% 0px' }, { scale: 1.2 }, '<')
        tl.fromTo(items[5], { xPercent: 80 }, { xPercent: 0 }, '<')
        tl.fromTo(innerItems[5], { xPercent: -80 }, { xPercent: 0 }, '<')
        tl.fromTo(imageContainers[5], { xPercent: 0, scale: 0.6, transformOrigin: '100% 100% 0px' }, { xPercent: -60, scale: 1.0 }, '<')
        tl.fromTo(imageContainersInner[5], { scale: 1.55, transformOrigin: '50% 50% 0px' }, { scale: 1.0 }, '<')

        
      }, mainSection.current)
      return () => desktop.revert()
    })
    
    return () => mm.revert()
    
  }, [])
  
  return (
    <div ref={mainSection} className="EarlyOrthodontics-section MainSection` --dark --in-view" style={{ backgroundColor: 'var(--blue)', '--91c5acce': 5, }}>
      <div className="MainSection-wrap">
        <div className="MainSection-head">
          <h2 className="SplitText AnimatedSplitText --anim-title MainSection-headTitle AppTitle-1 --in-view" style={{ opacity: 1, visibility: "inherit" }}>
            {"Early Orthodontics".split(" ").map((word, i) => (
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
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">Smart to Start</h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="AppParagraph">Our doctors—as well as the American Association of Orthodontists—recommend an initial orthodontic screening at around age 7. At this stage, 3D imaging is used to evaluate the developing bite and predict the trajectory of permanent teeth. It also helps identify issues such as supernumerary (extra) or missing teeth, assess airway development (including risk factors for sleep apnea), and detect jaw growth discrepancies. Obstructive habits like thumb sucking, tongue thrusting, or early malocclusion can be addressed early to support optimal jaw and airway development.</p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
                    <div className="AppImage MainSectionItem-image">
                      <div className="AppImage-image --placeholder --lazy --loaded" style={{ objectFit: 'cover', backgroundImage: "url('/images/7milestone.png')", backgroundSize: 'cover', backgroundPosition: 'center center', }} ></div>
                      <img src="/images/7milestone.png" width="480" height="348" alt="Video of a landscape" loading="lazy" style={{ objectFit: 'cover' }}></img>
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
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">Lucky Number 7</h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="AppParagraph">Key dental landmarks are typically in place: the permanent first molars are positioned in the dental arches, and all four upper and lower (eight total) permanent incisors are either fully erupted or close to erupting. These markers allow our doctors to accurately assess the width of the arches, the front-to-back (anterior-posterior) relationship of the jaws, and identify any crossbites—whether in the front or back of the mouth. This is also the stage when significant arch length deficiencies can be detected, giving us the chance to intervene early to provide room for all permanent teeth. and guide proper development before more complex problems arise.</p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
               <div className="AppImage MainSectionItem-image image-wrapper">

{/* 
  <div
    className="AppImage-image --placeholder --lazy --loaded base-image"
    style={{
      objectFit: 'cover',
      backgroundImage: "url('/images/test/2.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center center'
    }}
  ></div> */}


  <img
    src="/images/dentaltest.png"
    alt="Facial silhouette"
    loading="lazy"
    className="profile-image"
  />


{/* <svg
  className="overlay-lines"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 100 100"
  preserveAspectRatio="xMidYMid slice"
>
  <line x1="58" y1="38" x2="58" y2="64" stroke="#ffffff80" 
    strokeWidth="0.5"
    strokeLinecap="round"
    stroke-dasharray="2 3"
    vectorEffect="non-scaling-stroke"/>
    <line
  x1="55.5" y1="48"
  x2="60.5" y2="48"
  stroke="#ffffff80"
  strokeWidth="0.5"
  strokeLinecap="round"
    stroke-dasharray="2 3"
  vectorEffect="non-scaling-stroke"
/>
<line
  x1="58"
  y1="65"
  x2="74"
  y2="66"
  stroke="#ffffff80"
  strokeWidth="0.5"
  strokeLinecap="round"
  stroke-dasharray="2 3"
  vectorEffect="non-scaling-stroke"
/>
<path
  d="M61 66.5 Q69 68.5 77 67.5"
  fill="none"
  stroke="#ffffff80"
  strokeWidth="0.5"
  strokeLinecap="round"
  stroke-dasharray="2 3"
  vectorEffect="non-scaling-stroke"
/>
<circle cx="58" cy="48" r="0.4" fill="#ffffff" />
<circle
  cx="58"
  cy="48"
  r="1.1"
  fill="none"
  stroke="rgba(255,255,255,0.25)"
  strokeWidth="0.2"
/>

<circle
  cx="58"
  cy="65"
  r="0.4"
  fill="#ffffff"
  vectorEffect="non-scaling-stroke"
/>




<circle
  cx="74"
  cy="66"
  r="0.4"
  fill="#ffffff"
  vectorEffect="non-scaling-stroke"
/>



</svg> */}

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
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">The Airway Equation</h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="AppParagraph">We also assess the airway and surrounding structures, including the tonsils and adenoids. Enlarged tonsils (tonsillar hypertrophy) and adenoids can restrict airflow, disrupt breathing during sleep, and negatively impact how the jaws and arches grow—often contributing to a condition known as adenoid facies, characterized by long, narrow facial development and mouth breathing.</p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
                    <div className="AppImage MainSectionItem-image">
                      <div className="AppImage-image --placeholder --lazy --loaded" style={{ objectFit: 'cover', backgroundImage: "url('/images/checkeredheatmap.png')", backgroundSize: 'cover', backgroundPosition: 'center center', }} ></div>
                      <img src="/images/checkeredheatmap.png" width="480" height="348" alt="Video of a landscape" loading="lazy" style={{ objectFit: 'cover' }}></img>
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
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">Future-Proof</h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="AppParagraph">Timely intervention makes it possible to manage many cases more comfortably with clear aligners which gently guide growth while also functioning as protective mouth guards during sports or severe dental protrustion. Through proactive, individualized treatment we're able to minimize disruption, improve oral hygiene, reduce enamel damage, and help children avoid the physical and emotional burden of bulky appliances later on.</p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
                    <div className="AppImage MainSectionItem-image">
                      <div className="AppImage-image --placeholder --lazy --loaded" style={{ objectFit: 'cover', backgroundImage: "url('/videos/retaintracing.mp4')", backgroundSize: 'cover', backgroundPosition: 'center center', }} ></div>
                        <video
  src="/videos/retaintracing.mp4"
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
                <div className="MainSectionItem-background" style={{ backgroundColor: 'var(--grey)', }} />
                <div className="MainSectionItem-content">
                  <span className="MainSectionItem-index">04</span>
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">Future Frey Smiles</h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="AppParagraph">Once you visit us, we take care of the rest. If no treatment is needed right away, we'll place your child on a customized Growth & Guidance schedule—part of our Frey Smiles Club—our way of keeping an eye on how things are progressing until treatment is indicated. </p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
                    <div className="AppImage MainSectionItem-image">
                      <div className="AppImage-image --placeholder --lazy --loaded" style={{ objectFit: 'cover', backgroundImage: "url('/images/Image0001.jpg')", backgroundSize: 'cover', backgroundPosition: 'center center', }} ></div>
                      <img src="/images/ffscard.jpg" width="480" height="348" alt="Video of a landscape" loading="lazy" style={{ objectFit: 'cover' }}></img>
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
                  <h3 className="MainSectionItem-contentTitle AppTitle-3">Early Is Still Now</h3>
                  <div className="MainSectionItem-contentText">
                    <div className="AppText-12">
                      <p className="AppParagraph">Early visits build familiarity with our doctors and team and often leads to better compliance and the best treatment experience. Even if no treatment is needed right away, that first screening sets the stage for better results later. Think of it as laying the groundwork—not just for a great smile, but for a positive experience along the way.</p>
                    </div>
                  </div>
                </div>
                <div className="MainSectionItem-imageContainer">
                  <div className="MainSectionItem-imageContainerInner">
                    <div className="AppImage MainSectionItem-image">
                      <div className="AppImage-image --placeholder --lazy --loaded" style={{ objectFit: 'cover', backgroundImage: "url('/images/test/hover.jpg')", backgroundSize: 'cover', backgroundPosition: 'center center', }} ></div>
                      <img src="/images/firstmeeting.jpg" width="480" height="348" alt="Video of a landscape" loading="lazy" style={{ objectFit: 'cover' }}></img>
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
          <div className="MainSection-navItem AppSmallText-1">
            <span>06</span>
            <span className="MainSection-navItemTitle">Section Six</span>
          </div>
          <div className="MainSection-navProgress">
            <span className="MainSection-navProgressBar"></span>
          </div>
        </div>
      </div>
    </div>
  )
}