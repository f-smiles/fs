import { eq } from "drizzle-orm"
import { db } from "@/server/db"

import { formatPrice } from "@/lib/format-price"
import { productVariants } from "@/server/schema"
import { Separator } from "@/components/ui/separator"
import VariantName from "@/components/products/variant-name"
import SelectColor from "@/components/products/select-color"
import ProductCarousel from "@/components/products/product-carousel"
import AddToCart from "@/components/cart/add-to-cart"

export const revalidate = 60

export async function generateStaticParams() {
  const data = await db.query.productVariants.findMany({
    with: { variantImages: true, variantTags: true, product: true },
    orderBy: (productVariants, { desc }) => [desc(productVariants.id)],
  })

  if (data) {
    const slugID = data.map((variant) => ({ slug: variant.id.toString() }))
    return slugID
  }
  return []
}


export default async function Page({ params }: { params: { slug: string } }) {
  const slugID = Number(params.slug)
console.log("SLUG:", params.slug)
  if (isNaN(slugID)) {
    console.error("Invalid slug ID:", params.slug)
    return null
  }

  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, slugID),
    with: {
      product: {
        with: {
          productVariants: {
            with: { variantImages: true, variantTags: true },
          },
        },
      },
    },
  })

  const matchingVariant = variant?.product.productVariants.find((i) => i.id === variant.id)
const variantImage = matchingVariant?.variantImages?.[0]?.url ?? ""

if (variant) {
  const safeImage =
    variant.variantImages?.[0]?.url || "/images/fallback.png"

  return (
    <section className="flex flex-col w-full max-w-6xl min-h-screen px-4 mx-auto md:flex-row md:gap-8 lg:gap-12 sm:px-6 lg:px-8 lg:py-20">


      <div className="flex-1">
<ProductCarousel
  variants={variant.product.productVariants}
  initialVariantId={variant.id}
/>
      </div>


      <div className="flex flex-col flex-1 gap-4">


        <div className="flex flex-row justify-between items-center">
          <h1 className="text-[14px] font-neuehaas45">
            {variant.product.title}
          </h1>

          <VariantName variants={variant.product.productVariants} />
        </div>

        <Separator />


        <h2 className="text-[14px] text-gray-900 font-neuehaas45">
          {formatPrice(variant.product.price)}
        </h2>


        {variant.product.description && (
          <div
            className="[&_*]:!font-neuehaas45 [&_*]:!text-[12px]"
            dangerouslySetInnerHTML={{ __html: variant.product.description }}
          />
        )}


        <div className="space-y-2 pt-2">
          <h3 className="text-[12px] font-neuehaas45 uppercase text-gray-900">
            Color
          </h3>

          <span className="inline-flex flex-wrap items-center gap-2">
            {variant.product.productVariants.map((prodVar) => (
              <SelectColor
                key={prodVar.id}
                id={prodVar.id}
                productID={prodVar.productID}
                color={prodVar.color}
                variantName={prodVar.variantName}
                title={variant.product.title}
              />
            ))}
          </span>
        </div>


        <div className="pt-4">
          <AddToCart
            price={variant.product.price}
            image={safeImage}
            title={variant.product.title}
            variantName={variant.variantName}
            variantID={variant.id}
            productID={variant.productID}
          />
        </div>

      </div>
    </section>
  )
}
}
