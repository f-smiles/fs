'use server'

import { db } from "@/server/db"
import { asc } from "drizzle-orm"
import { productVariants } from "../schema"


export const getProductVariants = async () => {
  try {
    const data = await db.query.productVariants.findMany({
      orderBy: [asc(productVariants.id)],
    })
    return { success: data }
  } catch (error) {
    return { error: "Failed to fetch data." }
  }
}
