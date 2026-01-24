import { db } from "@/server/db"
import Variants from "@/components/products/variants"
import Banner from "./banner"
import Hero from "./hero"

export const revalidate = 60 * 60

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
    <div className="bg-[#F1F2F5]" >
      {/* <Banner /> */}
      <Hero />
      <section className="flex items-start justify-center w-full h-full min-h-screen ">
        <div className="py-16 overflow-hidden sm:py-24 ">
          <Variants variants={data} />
        </div>
      </section>
    </div>
  )
}