'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"


export default function SelectColor({
  id, productID, color, variantName, title
}: {
  id: number, productID: number, color: string, variantName: string, title: string
}) {

  const searchParams = useSearchParams()
  const selectedVariant = searchParams.get("variant")

  const router = useRouter()


  return (
    <div
      style={{ backgroundColor: color }}
      className={cn(
        " w-8 h-8 rounded-full cursor-pointer transition-all duration-300 ease-in-out hover:opacity-75",
        selectedVariant === variantName ? "opacity-100 border border-[#5f5f5f]" : "opacity-50"
      )}
      onClick={() =>
        router.push(`/shop/products/${id}?id=${id}&title=${title}&variant=${variantName}&prodId=${productID}`,
        { scroll: false }
      )}
    ></div>
  )
}