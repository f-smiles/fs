'use server'

import { AuthError } from "next-auth"
import { actionClient } from "@/lib/safe-action"

import { LoginSchema } from "@/types/login-schema"
import { signIn } from "@/server/auth"
import { db } from "../db"
import { eq } from "drizzle-orm";
import { twoFactorTokens, users } from "../schema"
import { generateEmailVerificationToken, generateTwoFactorToken, getTwoFactorTokenByEmail } from "./tokens"
import { sendTwoFactorTokenByEmail, sendVerificationEmail } from "./email-send"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"


{/*
    LOGIN FLOW
    - Check if user email is in the database
      - if email exists but is not verified, resend verification email and token
    - If user exists, signIn
    - If user has two-factor auth enabled, send a code
*/}
export const emailLogin = actionClient
  .schema(LoginSchema)
  .action(async ({ parsedInput: { email, password, code } }) =>{
    try {

      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
      })

      if (!existingUser) return { error: "User not found" }

      if (existingUser.email !== email) {
        return { error: "Email not found." }
      }

      if (!existingUser.emailVerified) {
        const token = await generateEmailVerificationToken(email)
        if ("error" in token) return { error: token.error }
        await sendVerificationEmail(token[0].email, token[0].token)
        return { success: "Confirmation email resent!" }
      }

      // two-factor authentication
      if (existingUser.email && existingUser.twoFactorEnabled) {
        if (code) {
          const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email)
          if (!twoFactorToken) return { error: "Invalid token." }
          if (twoFactorToken.token !== code) return { error: "Token does not match." }

          const tokenExpired = new Date(twoFactorToken.expires) < new Date()
          if (tokenExpired) return { error: "Token has expired." }

          await db.delete(twoFactorTokens).where(eq(twoFactorTokens.id, twoFactorToken.id))

        } else {
          const token = await generateTwoFactorToken(existingUser.email)
          if (!token) return { error: "Failed to generate token." }
          if ("error" in token) return { error: token.error }
          await sendTwoFactorTokenByEmail(token[0].email, token[0].token)
          return { twoFactor: "Two-factor code was sent to your inbox. Please check your email." }
        }
      }

      await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      return { success: email }

    } catch(error) {
      if (isRedirectError(error)) {
        throw error
      }
      if (error instanceof AuthError) {
        switch(error.type) {
          case "AccessDenied":
            return { error: error.message }
          case "CallbackRouteError":
            return { error: error.cause?.err?.message }
          case "CredentialsSignin":
            return { error: 'Email or password was incorrect' }
          case "OAuthSignInError":
            return { error: error.message }
          default:
            return { error: "Something went wrong" }
        }
      }
      throw error
    }
  })