'use client'

import { useEffect, useState } from 'react'
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { VariantsWithImagesTags } from '@/lib/infer-type'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

type ProductCarouselProps = {
  variants: any[]
  initialVariantId: number
}
export default function ProductCarousel({
  variants,
  initialVariantId,
}: {
  variants: VariantsWithImagesTags[]
  initialVariantId: number
}) {
  const [api,setApi] = useState<CarouselApi>()
  const [activeThumbnail, setActiveThumbnail] = useState([0])

const selectedVariant =
  variants.find(v => v.id === initialVariantId)?.variantName ||
  variants[0]?.variantName

  useEffect(() => {
    if (!api) return

    api.on("slidesInView", (e) => {
      setActiveThumbnail(e.slidesInView())
    })
  }, [api])

  const updatePreview = (index: number) => {
    api?.scrollTo(index)
  }




  return (
    <Carousel setApi={setApi} opts={{ loop: true }}>
      <CarouselContent>
        {variants.map((variant) =>
          variant.variantName === selectedVariant &&
          variant.variantImages.map((img, index) => {
            return (
<CarouselItem key={img.url} className="flex flex-col justify-center">
                {img.url && !img.name.includes(".mp4") ? (
                  <Image
                    priority
                    className="w-full h-auto rounded-md"
                    width={1280}
                    height={720}
                    src={img.url}
                    alt={img.name}
                  />
                ) : (
                  <video
                    controls
                    className={cn(
                      "rounded-sm transition-all duration-300 ease-in-out cursor-pointer hover:opacity-75 w-full h-full",
                      index === activeThumbnail[0] ? "opacity-100" : "opacity-50",
                    )}
                    width={1280}
                    height={720}
                    aria-label={`Video of ${img.name}`}
                    onClick={() => updatePreview(index)}
                  >
                    <source src={img.url} type="video/mp4" />
                  </video>
                )}
              </CarouselItem>
            )
        }))}
      </CarouselContent>

      {/* <CarouselPrevious className="ml-16 transition-all duration-300 ease-in-out opacity-75 hover:opacity-100" />
      <CarouselNext className="mr-16 transition-all duration-300 ease-in-out opacity-75 hover:opacity-100" /> */}

      <div className="flex gap-3 mt-4 overflow-clip">
        {variants.map((variant) =>
          variant.variantName === selectedVariant &&
          variant.variantImages.map((img, index) => {
            return (
              <span className="size-16" key={img.url}>
               {img.url && !img.name.includes(".mp4") ? (
                  <Image
                    priority
                    className={cn(
                      "rounded-sm transition-all duration-300 ease-in-out cursor-pointer hover:opacity-75 w-full h-full",
                      index === activeThumbnail[0] ? "opacity-100" : "opacity-50",
                    )}
                    width={64}
                    height={64}
                    src={img.url}
                    alt={img.name}
                    onClick={() => updatePreview(index)}
                  />
                ) : (
                  <video
                    className={cn(
                      "rounded-sm transition-all duration-300 ease-in-out cursor-pointer hover:opacity-75 w-full h-full",
                      index === activeThumbnail[0] ? "opacity-100" : "opacity-50",
                    )}
                    width={64}
                    height={64}
                    onClick={() => updatePreview(index)}
                  >
                    <source src={img.url} type="video/mp4" />
                  </video>
                )}
              </span>
            )
        }))}
      </div>
    </Carousel>
  )
}
