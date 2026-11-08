import { z } from "zod"

export const ProductSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, { error: "Title must be at least 1 characters long." }),
  description: z.string().min(1, { error: "Description must be at least 1 characters long." }),
  category: z.string().min(1, { error: "Title must be at least 1 characters long." }),
  price: z.number().min(0),
})

export type InferProductSchema = z.infer<typeof ProductSchema>