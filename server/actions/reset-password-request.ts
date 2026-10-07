'use server'

import { eq } from "drizzle-orm"
import { actionClient } from "@/lib/safe-action"
import { RequestResetPasswordSchema } from "@/types/reset-request-schema"
import { db } from "@/server/db"
import { users } from "@/server/schema"
import { generatePasswordResetToken } from "@/server/actions/tokens"
import { sendPasswordResetEmail } from "@/server/actions/email-send"

export const requestResetPassword = actionClient
  .schema(RequestResetPasswordSchema)
  .action(async ({ parsedInput: { email }}) => {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    })
    if (!existingUser) return { error: "User not found" }

    const passwordResetToken = await generatePasswordResetToken(email)
    if (!passwordResetToken) return { error: "Failed to generate token." }

    await sendPasswordResetEmail(passwordResetToken[0].email,passwordResetToken[0].token)

    return { success: "Reset password email was sent to your inbox." }
  })