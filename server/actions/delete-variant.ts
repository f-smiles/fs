'use server'

import { actionClient } from "@/lib/safe-action"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "../db"
import { productVariants, variantImages } from "../schema"
import { utapiDeleteFiles } from "./uploadthing"

export const deleteVariant = actionClient
  .schema(z.object({ id: z.number() }))
  .action(async ({ parsedInput: { id } }) => {
    try {
      
      const productVariant = await db.query.productVariants.findFirst({
        where: eq(productVariants.id, id),
        with: { variantImages: true },
      })

      if (!productVariant) return
      
      productVariant?.variantImages.forEach(async (variantImage) => {
        await utapiDeleteFiles(variantImage.url.split('/f/')[1])
      })

      await db.delete(productVariants).where(eq(productVariants.id, id)).returning()
      
      revalidatePath("/dashboard/products")
      
      return { success: `Successfully deleteProduct product - ${productVariant.variantName}` }
    } catch (error) {
      return { error: "Failed to delete product. Please try again." }
    }
  })