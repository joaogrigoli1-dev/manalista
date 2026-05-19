import { type NextRequest } from "next/server"
import { initAuth } from "@/lib/auth-init"
import { handlers } from "@/auth"

export async function GET(req: NextRequest) {
  await initAuth()
  return handlers.GET(req)
}

export async function POST(req: NextRequest) {
  await initAuth()
  return handlers.POST(req)
}
