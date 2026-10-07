'use server'

import bcrypt from "bcrypt"
import { eq } from "drizzle-orm"

import { SignupSchema } from "@/types/signup-schema"
import { actionClient } from "@/lib/safe-action"
import { db } from "@/server/db"
import { users } from "@/server/schema"
import { generateEmailVerificationToken } from "@/server/actions/tokens"
import { sendVerificationEmail } from "./email-send"


{/*
    SIGNUP FLOW
    - Check if user email is in the database
    - If email exists, resend verification email
    - If user does not exist, create a token, send verification email, and insert user to database (also hash password)
*/}
export const emailSignup = actionClient
  .schema(SignupSchema)
  .action(async ({ parsedInput: { name, email, password }}) => {
    try {

      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
      })

      if (existingUser) {
        if (!existingUser.emailVerified) {
          const token = await generateEmailVerificationToken(email)
          if ("error" in token) return { error: token.error }
          await sendVerificationEmail(token[0].email, token[0].token)
          return { success: "Email confirmation resent" }
        }
        return { error: "Email is already in use" }
      }

      const hashPassword = await bcrypt.hash(password, 10)

      await db.insert(users).values({
        name,
        email,
        password: hashPassword,
        twoFactorEnabled: true,
      })

      const token = await generateEmailVerificationToken(email)
      if ("error" in token) return { error: token.error }
      await sendVerificationEmail(token[0].email, token[0].token)

      return { success: "Confirmation email was sent to your inbox." }
    }
    catch(error) {
      return { error: "Failed to register credentials. Please try again." }
    }
  })