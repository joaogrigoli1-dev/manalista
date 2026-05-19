import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      plan: "free" | "pro" | "enterprise"
      analysesUsed: number
      analysesLimit: number
    } & DefaultSession["user"]
  }
}
