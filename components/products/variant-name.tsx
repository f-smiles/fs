'use client'

import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { VariantsWithImagesTags } from "@/lib/infer-type"


export default function VariantName({ variants }: { variants: VariantsWithImagesTags[] }) {
  const searchParams = useSearchParams()
  const selectedVariant = searchParams.get("variant") || variants[0].variantName

  // .toLowerCase().split(" ").join("-")


  return variants.map((v) => {
    if (v.variantName === selectedVariant) {
      return (
        <motion.h2
          key={v.id}
          className="font-neuehaas45 text-[12px] text-gray-900"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {selectedVariant}
        </motion.h2>
      )
    }
  })
}
