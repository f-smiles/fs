'use server'
import { db } from "@/server/db"
import { products } from "@/server/schema"
import { eq } from "drizzle-orm"

export const getProduct = async (id: number) => {
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, id)
    })
    return { success: product }
  } catch (error) {
    return { error: "Failed to fetch product." }
  }
}
