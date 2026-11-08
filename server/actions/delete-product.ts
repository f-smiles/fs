'use server'

import { actionClient } from "@/lib/safe-action"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "../db"
import { products, productVariants, variantImages } from "../schema"
import { utapiDeleteFiles } from "./uploadthing"

export const deleteProduct = actionClient
  .schema(z.object({ id: z.number() }))
  .action(async ({ parsedInput: { id } }) => {
    try {
      
      const product = await db.query.products.findFirst({
        where: eq(products.id, id),
        with: {
          productVariants: {
            with: {
              variantImages: true,
            }
          }
        }
      })

      if (!product) return

      product.productVariants.forEach((productVariant) => {
        productVariant.variantImages.forEach(async (variantImage) => {
          await utapiDeleteFiles(variantImage.url.split('/f/')[1])
        })
      })

      await db.delete(products).where(eq(products.id, id)).returning()

      revalidatePath("/dashboard/products")
      
      return { success: `Successfully deleteProduct product - ${product.title}` }
    } catch (error) {
      return { error: "Failed to delete product. Please try again." }
    }
  })