'use client'
import React, { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { SplitText } from 'gsap/SplitText'
import EmblaCarousel from '@/components/embla/embla-carousel'

gsap.registerPlugin(SplitText)

const slides = [
  {
    heading: "In addition to a beautiful new smile, what are some other benefits of orthodontic treatment?",
    description: "Braces can improve the function of the bite and teeth, improve the ability to clean the teeth, prevent wear on the teeth, and increase the longevity of natural teeth over a lifetime.",
  },
  {
    heading: "If a child has treatment early, will this prevent the need for braces as an adolescent?",
    description: "Early treatment can begin the correction of significant problems, prevent more severe problems from developing, and simplify future treatment. Because all of the permanent teeth have not yet erupted when early treatment is performed, their final alignment may not have been corrected. Typically, a shortened comprehensive phase of treatment (Phase II - full braces) in the teen years, after all the permanent teeth have erupted, completes the correction. However, in some circumstances, further orthodontic treatment may not be indicated.",
  },
  {
    heading: "Do we still need to see our family dentist during orthodontic treatment?",
    description: "Patients with braces and other orthodontic appliances require more effort to keep their teeth and gums clean. Because we want to ensure the highest level of dental health, we recommend you see your family dentist for regular check-ups and cleanings every 6 months during treatment.",
  },
]

const EarlyOrthodontics = () => {
  const container = useRef<HTMLDivElement>(null)
  const animateLines = useRef<gsap.core.Tween | null>(null)
  const animateWords = useRef<gsap.core.Tween | null>(null)
  const images = useRef<HTMLDivElement | null>(null)

  useGSAP(() => {
    const splitLines = new SplitText(".split-lines", {
      type: "lines",
      linesClass: "line",
      autoSplit: true,
      mask: "lines",
      onSplit: (self) => {
        animateLines.current = gsap.from(self.lines, {
          duration: 0.6,
          yPercent: 100,
          opacity: 0,
          stagger: 0.1,
          ease: "power2.out",
        })
        return animateLines.current
      }
    })
    
    const splitWords = new SplitText(".split-words", {
      type: "words",
      wordsClass: "word",
      autoSplit: true,
      mask: "words",
      onSplit: (self) => {
        animateWords.current = gsap.from(self.words, {
          duration: 0.5,
          yPercent: 100,
          opacity: 0,
          stagger: 0.1,
          ease: "power2.out",
        })
        return animateWords.current
      }
    })

    return () => {
      splitLines.revert()
      splitWords.revert()
    }
  }, { scope: container })

  useGSAP(() => {
    const rots = {
      x: 0,
      y: 0,
      z: 0,
    }

    const tl = gsap.timeline({
      repeat: -1,
      repeatDelay: 2,
      defaults: {
        duration: 1,
        ease: "sine.inOut"
      },
      onUpdate: () => {
        gsap.set(images.current, {
          transform: `rotateX(${rots.x}deg) rotateY(${rots.y}deg) rotateZ(${rots.z}deg)`
        })
      },
    })
    .to(rots, { y: -90 })
    .to(rots, { z: 90 })
  }, { scope: images })

  return (
    <div className="space-y-3">
      <section>
        <div className="flex gap-3">
          <div ref={container} className="flex flex-col justify-between w-8/12 p-8 rounded-3xl bg-zinc-50 h-stretch">
            <h2 className="w-3/4 uppercase split-words dark:text-primary-foreground">Jaded zombies acted quaintly but kept driving their oxen forward.</h2>
            <p className="w-1/2 text-sm uppercase split-lines dark:text-primary-foreground">Two driven jocks help fax my big quiz. Five quacking zephyrs jolt my wax bed. The five boxing wizards jump quickly. Pack my box with five dozen liquor jugs.</p>
          </div>
          <div className="flex flex-col w-4/12 gap-3 container-wrapper">
            {/* <div className="container overflow-hidden aspect-1 rounded-3xl">
              <div ref={carousel} className="carousel" id="carousel">
                <div className="item a">1</div>
                <div className="item b">2</div>
                <div className="item c">5</div>
              </div>
            </div> */}
            <div className="layout-section">
              <div className="layout media-layout">
                <div className="perspective-frame">
                  <div ref={images} className="images">
                    <div className="face a">
                      <div className="w-full h-full bg-blue-500"></div>
                    </div>
                    <div className="face b">
                      <div className="w-full h-full bg-green-500"></div>
                    </div>
                    <div className="face e">
                      <div className="w-full h-full bg-purple-300"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="self-end w-1/2 rounded-full aspect-1 bg-lime-300">

            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex gap-3">
          <div className="flex flex-col w-2/12 gap-3">
            <div className="p-8 rounded-full aspect-1 bg-lime-300">
              
            </div>
          </div>
          <div className="w-10/12 p-8 rounded-3xl bg-[#3562FF] h-stretch">
            <h2></h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-6 lg:grid-rows-2">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-50 lg:col-span-3">
            <img
              alt=""
              src="https://tailwindcss.com/plus-assets/img/component-images/bento-01-performance.png"
              className="object-cover object-left h-80"
            />
            <div className="p-10 pt-4">
              <h3 className="font-semibold text-indigo-600 text-sm/4">Performance</h3>
              <p className="mt-2 text-lg font-medium tracking-tight text-gray-950">Lightning-fast builds</p>
              <p className="max-w-lg mt-2 text-gray-600 text-sm/6">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. In gravida justo et nulla efficitur, maximus
                egestas sem pellentesque.
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-zinc-50 lg:col-span-3">
            <img
              alt=""
              src="https://tailwindcss.com/plus-assets/img/component-images/bento-01-releases.png"
              className="object-cover object-left h-80 lg:object-right"
            />
            <div className="p-10 pt-4">
              <h3 className="font-semibold text-indigo-600 text-sm/4">Releases</h3>
              <p className="mt-2 text-lg font-medium tracking-tight text-gray-950">Push to deploy</p>
              <p className="max-w-lg mt-2 text-gray-600 text-sm/6">
                Curabitur auctor, ex quis auctor venenatis, eros arcu rhoncus massa, laoreet dapibus ex elit vitae
                odio.
              </p>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 lg:rounded-tr-[2rem]" />
          </div>
          <div className="relative lg:col-span-2">
            <div className="relative flex flex-col h-full overflow-hidden rounded-3xl bg-zinc-50">
              <img
                alt=""
                src="https://tailwindcss.com/plus-assets/img/component-images/bento-01-speed.png"
                className="object-cover object-left h-96"
              />
              <div className="p-10 pt-4">
                <h3 className="font-semibold text-indigo-600 text-sm/4">Speed</h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950">Built for power users</p>
                <p className="max-w-lg mt-2 text-gray-600 text-sm/6">
                  Sed congue eros non finibus molestie. Vestibulum euismod augue.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 lg:rounded-bl-[2rem]" />
          </div>
          <div className="relative lg:col-span-2">
            <div className="relative flex flex-col h-full overflow-hidden rounded-3xl bg-zinc-50">
              <img
                alt=""
                src="https://tailwindcss.com/plus-assets/img/component-images/bento-01-integrations.png"
                className="object-cover h-96"
              />
              <div className="p-10 pt-4">
                <h3 className="font-semibold text-indigo-600 text-sm/4">Integrations</h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950">Connect your favorite tools</p>
                <p className="max-w-lg mt-2 text-gray-600 text-sm/6">
                  Maecenas at augue sed elit dictum vulputate, in nisi aliquam maximus arcu.
                </p>
              </div>
            </div>
            <div className="absolute rounded-lg shadow pointer-events-none inset-px ring-1 ring-black/5" />
          </div>
          <div className="relative lg:col-span-2">
            <div className="relative flex flex-col h-full overflow-hidden rounded-3xl bg-zinc-50">
              <img
                alt=""
                src="https://tailwindcss.com/plus-assets/img/component-images/bento-01-network.png"
                className="object-cover h-96"
              />
              <div className="p-10 pt-4">
                <h3 className="font-semibold text-indigo-600 text-sm/4">Network</h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950">Globally distributed CDN</p>
                <p className="max-w-lg mt-2 text-gray-600 text-sm/6">
                  Aenean vulputate justo commodo auctor vehicula in malesuada semper.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]" />
          </div>
        </div>
      </section>

      <section>
        <EmblaCarousel slides={slides} />
      </section>
    </div>
  )
}

export default EarlyOrthodontics