export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db-server";
import { analyses } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { internalErrorResponse } from "@/lib/api-error";

export const runtime = "nodejs";

// GET — busca análise completa pelo ID
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const rows = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, id))
      .limit(1);

    if (rows.length === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const analysis = rows[0];

    if (analysis.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json(analysis);
  } catch (err) {
    return internalErrorResponse(err, "historico:get-by-id");
  }
}
