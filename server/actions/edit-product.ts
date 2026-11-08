'use server'

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { actionClient } from "@/lib/safe-action"
import { ProductSchema } from "@/types/product-schema"
import { db } from "@/server/db"
import { products } from "@/server/schema"


export const editProduct = actionClient
  .schema(ProductSchema)
  .action(async ({ parsedInput: { id, title, description, price } }) => {
    try {
      const existingProduct = await db.query.products.findFirst({
        where: eq(products.id, id!),
      })

      if (!existingProduct) return { error: "Product does not exist." }

      if (existingProduct) {
        const updatedProduct = await db
          .update(products)
          .set({ title, description, price })
          .where(eq(products.id, existingProduct.id))
          .returning()

        revalidatePath("/dashboard/products")
        return { success: `Product ${updatedProduct[0].title} was updated successfully!` }
      }
    } catch (error) {
      return { error: "Something went wrong when attempting to update the product. Please try again." }
    }
  })