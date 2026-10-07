'use server'
import bcrypt from "bcrypt"
import { eq } from "drizzle-orm"
import { auth } from "@/server/auth"
import { db } from "@/server/db"
import { users } from "@/server/schema"
import { SettingsSchema } from "@/types/settings-schema"
import { actionClient } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

{/*
    USER SETTINGS - FLOW
    - Password & New password
      - Check if password matches database password AND if old pw and new pw are the same
    - OAuth
      - If account type is an OAuth Provider: email, password, and two-factor toggle should not be editable
*/}
export const settings = actionClient
  .schema(SettingsSchema)
  .action(async ({ parsedInput }) => {
    try {
      const user = await auth()
      if (!user) return { error: "No user session found" }

      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.user.id)
      })
      if (!dbUser) return { error: "User does not exist in database" }

      // if user account is an oauth provider, don't make fields editable
      if (user.user.isOAuth) {
        parsedInput.email = undefined
        parsedInput.password = undefined
        parsedInput.newPassword = undefined
        parsedInput.twoFactorEnabled = undefined
      }

      if (parsedInput.password && parsedInput.newPassword && dbUser.password) {
        const passwordMatch = await bcrypt.compare(parsedInput.password, dbUser.password)
        if (!passwordMatch) {
          return { error: "Password entered does not match database" }
        }

        const samePassword = await bcrypt.compare(parsedInput.newPassword, dbUser.password)
        if (samePassword) {
          return { error: "New password is the same as the old password" }
        }

        const hashPassword = await bcrypt.hash(parsedInput.newPassword, 10)
        parsedInput.password = hashPassword
        parsedInput.newPassword = undefined
      }

      await db.update(users).set({
        name: parsedInput.name,
        email: parsedInput.email,
        password: parsedInput.password,
        image: parsedInput.image,
        twoFactorEnabled: parsedInput.twoFactorEnabled,
      }).where(eq(users.id, dbUser.id))

      revalidatePath("/dashboard/settings")
      return { success: "Settings saved successfully!" }
    } catch (error) {
      return { error: "Failed to update settings. Please try again." }
    }
  })