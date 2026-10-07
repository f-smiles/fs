import { z } from "zod"

export const SettingsSchema = z
  .object({
    name: z.optional(z.string()),
    email: z.optional(z.email()),
    password: z.optional(z.string().min(8, { error: "Password must have a minimum of 8 characters." })),
    newPassword: z.optional(z.string().min(8, { error: "New password must have a minimum of 8 characters." })),
    image: z.optional(z.string()),
    twoFactorEnabled: z.optional(z.boolean()),
  })
  .refine((data) => {

    // If password is provided, newPassword must also be provided
    if (data.password && !data.newPassword) {
      return false
    }

    // If newPassword is provided, enforce complexity rules (at least one number, one uppercase, one special character)
    if (data.newPassword) {
      const passwordComplexity = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/

      if (!passwordComplexity.test(data.newPassword)) return false
    }

    return true
  }, {
    message: "New password must contain at least ONE NUMBER, ONE UPPERCASE, and ONE SPECIAL CHARACTER.",
    path: ["newPassword"]
  })