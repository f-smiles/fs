import { z } from "zod"

export const SignupSchema = z.object({
  name: z.string().min(4, {
    message: "Name must have a minimum of 4 characters."
  }),
  email: z.email(),
  password: z.string({ error: "Password cannot be empty." })
    .regex(/^.{8,}$/, { error: "Password must have a minimum of 8 characters." })
    .regex(/(?=.*[A-Z])/, { error: "Password must contain at least one uppercase character." })
    .regex(/(?=.*[a-z])/, { error: "Password must contain at least one lowercase character." })
    .regex(/(?=.*\d)/, { error: "Password must contain at least one numerical digit." })
    .regex(/[$&+,:;=?@#|'<>.^*()%!-]/, { error: "Password must contain least one special character." }),
  twoFactorEnabled: z.literal(true),
})