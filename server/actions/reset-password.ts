'use server'

import bcrypt from "bcrypt";
import { Pool } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"
import { eq } from "drizzle-orm"

import { actionClient } from "@/lib/safe-action"
import { ResetPasswordSchema } from "@/types/reset-password-schema"
import { getPasswordResetTokenByToken } from "@/server/actions/tokens"
import { db } from "@/server/db"
import { passwordResetTokens, users } from "@/server/schema"

export const resetPassword = actionClient
  .schema(ResetPasswordSchema)
  .action(async ({ parsedInput: { password, token }}) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const dbPool = drizzle(pool)

    if (!token) return { error: "Token is missing." }

    const existingToken = await getPasswordResetTokenByToken(token)
    if (!existingToken) return { error: "Existing token not found." }

    const hasExpired = new Date(existingToken.expires) < new Date()
    if (hasExpired) return { error: "Token has expired." }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, existingToken.email)
    })
    if (!existingUser) return { error: "User not found." }

    await dbPool.transaction(async(tx) => {
      await tx.update(users).set({
        password: bcrypt.hashSync(password, 10),
      }).where(eq(users.id, existingUser.id))
    })

    await dbPool.delete(passwordResetTokens).where(eq(passwordResetTokens.id, existingToken.id))

    return { success: "Password updated successfully!" }
  })