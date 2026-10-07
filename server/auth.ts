import bcrypt from "bcrypt"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { eq } from "drizzle-orm"
import { db } from "@/server/db"
import { accounts, users } from "@/server/schema"
import { LoginSchema } from "@/types/login-schema"
import Stripe from "stripe"
import { verifyAuthGate } from "./actions/verify-auth-gate"


export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  events: {
    createUser: async ({ user }) => {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-08-16",
      })
      const stripeCustomer = await stripe.customers.create({
        email: user.email!,
        name: user.name!,
      })
      await db
        .update(users)
        .set({ customerID: stripeCustomer.id })
        .where(eq(users.id, user.id!))
    },
  },
  callbacks: {
    // extending the token to add additional properties
    async jwt({ token }) {
      if (!token.sub) return token // don't do anything if there is no token sub aka user id

      // don't do anything if there is no existing user
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, token.sub)
      })
      if (!existingUser) return token

      const existingAccount = await db.query.accounts.findFirst({
        where: eq(accounts.userId, existingUser.id)
      })

      // setting the additional token properties
      // if an account exists for the user, set token.isOAuth to true (indicating user is logged in via OAuth provider)
      // if not, token.isOAuth will be false (indicating no associated OAuth account was found for the user)
      token.isOAuth = !!existingAccount
      token.name = existingUser.name
      token.email = existingUser.email
      token.image = existingUser.image
      token.twoFactorEnabled = existingUser.twoFactorEnabled
      token.role = existingUser.role

      // console.log("TOKEN: ", token)
      return token
    },
    // making the added token properties available on the client side
    async session({ session, token }) {

      if (session && token.sub) {
        session.user.id = token.sub
      }
      if (session.user && token.role) {
        session.user.role = token.role as string
      }
      if (session.user) {
        session.user.name = token.name
        session.user.email = token.email as string
        session.user.image = token.image as string
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
        session.user.isOAuth = token.isOAuth as boolean
      }

      // console.log("SESSION: ", session)
      return session
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      authorize: async (credentials) => {
        const validatedFields = LoginSchema.safeParse(credentials)

        if (validatedFields.success) {
          const user = await db.query.users.findFirst({
            where: eq(users.email, validatedFields.data.email)
          })

          if (!user || !user.password) return null

          const passwordMatch = await bcrypt.compare(validatedFields.data.password, user.password)
          if (passwordMatch) return user
        }

        return null
      }
    })
  ],
})