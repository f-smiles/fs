import { z } from "zod"

export const RequestResetPasswordSchema = z.object({
  email: z.email({ error: "Email is required." }),
})