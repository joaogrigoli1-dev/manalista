import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db-server"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import ProfileClient from "./ProfileClient"

export const dynamic = "force-dynamic"

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const userId = session.user.id as string

  const dbUser = await db
    .select({
      name: users.name,
      email: users.email,
      image: users.image,
      plan: users.plan,
      analysesUsed: users.analysesUsed,
      analysesLimit: users.analysesLimit,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((r) => r[0])

  if (!dbUser) {
    redirect("/auth/login")
  }

  return (
    <>
      <ProfileClient
        name={dbUser.name}
        email={dbUser.email}
        image={dbUser.image}
        plan={dbUser.plan}
        analysesUsed={dbUser.analysesUsed}
        analysesLimit={dbUser.analysesLimit}
      />

      {/* Hidden sign-out form for use from client if needed */}
      <form
        id="signout-form"
        action={async () => {
          "use server"
          await signOut({ redirectTo: "/" })
        }}
        style={{ display: "none" }}
      >
        <button type="submit">Sair</button>
      </form>
    </>
  )
}
