import NextAuth, { type DefaultSession } from "next-auth"


// extending the token to add additional properties
export type ExtendUser = DefaultSession["user"] & {
  id: string
  role: string
  image: string
  twoFactorEnabled: boolean
  isOAuth: boolean
}

declare module "next-auth" {
  interface Session {
    user: ExtendUser
  }
}

// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string
//       role: string
//       image: string
//       twoFactorEnabled: boolean
//       isOAuth: boolean
//     } & DefaultSession["user"]
//   }
// }