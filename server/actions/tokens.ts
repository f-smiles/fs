'use server'

import crypto from "crypto"
import Stripe from "stripe"
import { eq } from "drizzle-orm"
import { db } from "@/server/db"
import { emailTokens, passwordResetTokens, twoFactorTokens, users } from "@/server/schema"

/**
 * The token object contains the following properties:
 * - {string} id - The unique identifier of the token.
 * - {string} email - The email associated with the token.
 * - {string} token - The verification token.
 * - {Date} expires - The expiration date of the token.
*/

/**
 * Asynchronously retrieves the verification token associated with the given email.
 * @param {string} email - The email of the user.
 * @returns {Promise<object|null>} - A promise that resolves to the token object if found, or null if not.
 */
export const getVerificationTokenByEmail = async (email: string) => {
  try {
    const token = await db.query.emailTokens.findFirst({
      where: eq(emailTokens.token, email)
    })
    return token
  }
  catch(error) {
    return null
  }
}

/**
 * Generates a new email verification token for the given email.
 * If an existing token is found, it is deleted before generating a new one.
 * The new token is set to expire in 1 hour.
 *
 * @param {string} email - The email address for which to generate the verification token.
 * @returns {Promise<object>} - A promise that resolves to the newly generated token object.
 * On failure: { error: string }
 */
export const generateEmailVerificationToken = async (email: string): Promise<{
  id: string;
  email: string;
  token: string;
  expires: Date;
}[] | {
  error: string;
}> => {
  try {
    const existingToken = await getVerificationTokenByEmail(email)

    if (existingToken) {
      await db.delete(emailTokens).where(eq(emailTokens.id, existingToken.id))
    }

    const verificationToken = await db.insert(emailTokens).values({
      email,
      token: crypto.randomUUID(), // generate token
      expires: new Date(new Date().getTime() + 3600 * 1000), // set token to expire in 1 hour
    }).returning()

    return verificationToken
  } catch (error) {
    return { error: "Failed to generate email verification token." }
  }
}

/**
 * Verifies the user's email based on the provided verification token.
 * If an existing token is found, or if the token is expired, it is deleted before generating a new one.
 * Updates the user's emailVerified property by setting the current date.
 * Deletes the used verification token from the database.
 *
 * @param {string} token - The verification token provided to the user.
 * @returns {Promise<object>} - A promise that resolves to an object indicating success or failure.
 * - On success: { success: string }
 * - On failure: { error: string }
*/
export const confirmEmail = async (token: string) => {
  try {
    const existingToken = await getVerificationTokenByEmail(token)
    if (!existingToken) return { error: "Token not found." }

    const tokenExpired = new Date(existingToken.expires) < new Date()
    if (tokenExpired) return { error: "Token has expired." }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, existingToken.email)
    })
    if (!existingUser) return { error: "Email does not exist." }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-08-16",
    })
    const stripeCustomer = await stripe.customers.create({
      email: existingUser.email!,
      name: existingUser.name!,
    })
    if (!stripeCustomer) return { error: "Failed to create Stripe customer." }

    await db.update(users).set({
      email: existingToken.email,
      emailVerified: new Date(),
      customerID: stripeCustomer.id,
    }).where(eq(users.email, existingToken.email!))

    await db.delete(emailTokens).where(eq(emailTokens.id, existingToken.id))

    return { success: "Email was verified successfully!" }
  } catch (error) {
    console.error(error)
    return { error: "Failed to verify email."}
  }
}

export const getTwoFactorTokenByEmail = async (email: string) => {
  try {
    const token = await db.query.twoFactorTokens.findFirst({
      where: eq(twoFactorTokens.email, email)
    })
    return token
  }
  catch (error) {
    return null
  }
}

/**
 * Generates a 6-digit code for when a user with two-factor authentication (2FA) enabled signs in.
 * @param {string} email - The email address of the user for whom the 2FA token is generated.
 * @returns {Promise<object|null>} - A promise that resolves to the generated 2FA token object or null if an error occurs.
*/
export const generateTwoFactorToken = async (email: string): Promise<{
  id: string;
  email: string;
  token: string;
  expires: Date;
}[] | {
  error: string;
} | null> => {
  try {
    const existingToken = await getTwoFactorTokenByEmail(email)
    if (existingToken) {
      await db.delete(twoFactorTokens).where(eq(twoFactorTokens.id, existingToken.id))
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    })
    if (!existingUser) return { error: "User not found" }

    const twoFactorToken = await db.insert(twoFactorTokens).values({
      email,
      token: crypto.randomInt(100_000, 1_000_000).toString(), // generate 6-digit code
      expires: new Date(new Date().getTime() + 3600 * 1000), // set token to expire in 1 hour
    }).returning()

    return twoFactorToken
  } catch (error) {
    return { error: "Failed to generate two factor token." }
  }
}

export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    const token = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.email, email)
    })
    return token
  }
  catch (error) {
    return null
  }
}

export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    const passwordResetToken = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.token, token)
    })
    return passwordResetToken
  }
  catch (error) {
    return null
  }
}

/**
 * Generates a 6-digit code for when a user with two-factor authentication (2FA) enabled signs in.
 * @param {string} email - The email address of the user requesting a password reset.
 * @returns {Promise<object|null>} - A promise that resolves to the generated password reset token object or null if an error occurs
*/
export const generatePasswordResetToken = async (email: string) => {
  try {
    const existingToken = await getPasswordResetTokenByEmail(email)

    if (existingToken) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, existingToken.id))
    }

    const token = await db.insert(passwordResetTokens).values({
      email,
      token: crypto.randomUUID(), // generate token
      expires: new Date(new Date().getTime() + 3600 * 1000), // set token to expire in 1 hour
    }).returning()

    return token
  }  catch (error) {
    return null
  }
}