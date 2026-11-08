'use server'

import { revalidatePath } from "next/cache"
import { actionClient } from "@/lib/safe-action"
import { VariantSchema } from "@/types/variant-schema"
import { db } from "@/server/db"
import { productVariants, variantImages, variantTags } from "@/server/schema"
import { eq } from "drizzle-orm"

export const createVariant = actionClient
  .schema(VariantSchema)
  .action(async({ parsedInput: { productID, id, editMode, variantName, color, tags, variantImages: newVariantImages } }) => {
    try {
      if (editMode && id) {
        const editVariant = await db.update(productVariants)
          .set({ color, variantName, updated: new Date() })
          .where(eq(productVariants.id, id))
          .returning()

        await db.delete(variantTags).where(eq(variantTags.variantID, editVariant[0].id))

        await db.insert(variantTags).values(
          tags.map((tag) => ({
            tag,
            variantID: editVariant[0].id,
          })
        ))

        await db.delete(variantImages).where(eq(variantImages.variantID, editVariant[0].id))

        await db.insert(variantImages).values(
          newVariantImages.map((img, index) => ({
            name: img.name,
            size: img.size,
            url: img.url,
            variantID: editVariant[0].id,
            order: index,
          }))
        )

        revalidatePath("/dashboard/products")
        return { success: `Updated ${variantName} successfully`}
      }

      if (!editMode) {
        const newVariant = await db.insert(productVariants).values({ color, variantName, productID }).returning()

        await db.insert(variantTags).values(
          tags.map((tag) => ({
            tag,
            variantID: newVariant[0].id,
          })
        ))

        await db.insert(variantImages).values(
          newVariantImages.map((img, index) => ({
            name: img.name,
            size: img.size,
            url: img.url,
            variantID: newVariant[0].id,
            order: index,
          }))
        )

        revalidatePath("/dashboard/products")
        return { success: "Variant created successfully!" }
      }
    }
    catch (error) {
      return { error: "Failed to create variant. Please try again." }
    }
  })