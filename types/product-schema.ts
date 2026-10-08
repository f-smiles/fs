import { z } from "zod"

export const ProductSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(5, { message: "Title must be at least 5 characters long." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters long." }),
  price: z.coerce.number({ invalid_type_error: "Price must be a number" }).positive({ message: "Price must be a positive number." }),
  category: z.string().min(1, { message: "Title must be at least 1 characters long." }),
})