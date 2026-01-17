'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import { NextButton, PrevButton, usePrevNextButtons } from './embla-buttons'
import { useDotButton } from './embla-dot'
import './embla-style.css'
import { cn } from '@/lib/utils'

type Slide = {
  heading: string
  description: string
}

type PropType = {
  slides: Slide[]
  options?: EmblaOptionsType
}

const EmblaCarousel: React.FC<PropType> = (props) => {
  const { slides, options } = props
  const [emblaRef, emblaApi] = useEmblaCarousel(options)
  const [scrollProgress, setScrollProgress] = useState(0)

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi)

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick
  } = usePrevNextButtons(emblaApi)

  const onScroll = useCallback((emblaApi: EmblaCarouselType) => {
    const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()))
    setScrollProgress(progress * 100)
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    onScroll(emblaApi)
    emblaApi
      .on('reInit', onScroll)
      .on('scroll', onScroll)
      .on('slideFocus', onScroll)
  }, [emblaApi, onScroll])

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="relative w-10/12 p-12 rounded-full bg-zinc-50">
          <div className="relative flex items-center justify-between">
            {slides.map((slide, index) => (
              <>
                <div className="relative z-30 bg-[#3562FF] size-4 rounded-full">
                  <div className={cn(selectedIndex === index ? "block" : "hidden", "absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#3562FF]/50 size-8 rounded-full")} />
                </div>
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${scrollProgress}%` }}
                  className="absolute z-10 top-1/2 left-0 -translate-y-1/2 h-0.5 rounded-full bg-blue-800"
                />
                <span className="absolute z-0 top-1/2 left-0 -translate-y-1/2 w-full h-0.5 rounded-full bg-zinc-300" />
              </>
            ))}
          </div>
        </div>
        <div className="w-2/12 px-6 rounded-full bg-lime-300">
          <div className="flex items-center justify-between h-full">
            <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
            <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
          </div>
        </div>
      </div>
      <div className="w-10/12 p-8 rounded-3xl bg-zinc-50">
        <div className="embla">
          <div className="embla__viewport" ref={emblaRef}>
            <div className="embla__container">
              {slides.map((slide, index) => (
                <div className="embla__slide" key={index}>
                  <span className="flex gap-3">
                    <h2 className="w-5/12 text-lg uppercase font-neueroman">{slide.heading}</h2>
                    <p className="w-7/12 text-sm uppercase font-neueroman">{slide.description}</p>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmblaCarousel