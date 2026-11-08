'use server'

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { actionClient } from "@/lib/safe-action"
import { ProductSchema } from "@/types/product-schema"
import { db } from "@/server/db"
import { products } from "@/server/schema"
import { redirect } from "next/navigation"


export const createProduct = actionClient
  .schema(ProductSchema)
  .action(async ({ parsedInput: { id, title, description, price, category } }) => {
    try {
      const existingProduct = await db.query.products.findFirst({
        where: eq(products.id, id!)
      })

      if (existingProduct) {
        redirect(`/products/edit-product?id=${existingProduct.id}`)
      }

      if (!existingProduct) {
        const newProduct = await db
          .insert(products)
          .values({ title, description, price, category })
          .returning()

        revalidatePath("/dashboard/products")
        return { success: `Product ${newProduct[0].title} was created successfully!` }
      }
    } catch (error) {
      return { error: "Something went wrong when attempting to create the product. Please try again." }
    }
  })