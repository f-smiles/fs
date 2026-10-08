import { db } from "@/server/db"
import Variants from "@/components/products/variants"
import Banner from "./banner"
import Hero from "./hero"
import { ShopContent, slidesData } from "./preloader";

export const revalidate = 3600

export default async function ProductsPage() {
  const data = await db.query.productVariants.findMany({
    with: {
      product: true,
      variantImages: true,
      variantTags: true,
    },
    orderBy: (productVariants, { desc }) => [desc(productVariants.id)],
  })

  return (
    <>
      <ShopContent 
        isReady={true}
        variants={data}
        slidesData={slidesData}
      />
    </>
  )
}