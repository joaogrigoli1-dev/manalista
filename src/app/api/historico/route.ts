import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db-server";
import { analyses } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";

export const runtime = "nodejs";

// GET — lista análises do usuário autenticado
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const rows = await db
    .select({
      id: analyses.id,
      childName: analyses.childName,
      childAge: analyses.childAge,
      lang: analyses.lang,
      qualityScore: analyses.qualityScore,
      detectedPathologies: analyses.detectedPathologies,
      status: analyses.status,
      createdAt: analyses.createdAt,
    })
    .from(analyses)
    .where(eq(analyses.userId, userId as any))
    .orderBy(desc(analyses.createdAt))
    .limit(50);

  return Response.json(rows);
}

// DELETE — deleta análise pelo id (query param ?id=xxx)
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  // Verifica ownership antes de deletar
  const existing = await db
    .select({ id: analyses.id, userId: analyses.userId })
    .from(analyses)
    .where(and(eq(analyses.id, id), eq(analyses.userId, userId as any)))
    .limit(1);

  if (existing.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .delete(analyses)
    .where(and(eq(analyses.id, id), eq(analyses.userId, userId as any)));

  return Response.json({ success: true });
}
