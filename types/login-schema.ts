import { z } from "zod"

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, {
    error: "Password is required",
  }),
  code: z.optional(z.string()),
})