'use server'

import { eq } from "drizzle-orm"
import { z } from "zod"

import { actionClient } from "@/lib/safe-action"
import { db } from "@/server/db"
import { variantImages } from "@/server/schema"


export const deleteVariantImage = actionClient
  .schema(z.object({ url: z.string() }))
  .action(async ({ parsedInput: { url } }) => {
    try {
      const existingVariantImage = await db.query.variantImages.findFirst({ where: eq(variantImages.url, url )})

      if (!existingVariantImage) return

      await db.delete(variantImages).where(eq(variantImages.url, url)).returning()
    } catch (error) {
      return { error: "Failed to delete image. Please try again." }
    }
  })