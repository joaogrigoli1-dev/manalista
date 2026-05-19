import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db-server";
import { analyses } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import HistoricoClient from "./HistoricoClient";

export const metadata = {
  title: "Histórico de Análises — MAnalista",
};

export default async function HistoricoPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login?callbackUrl=/historico");

  const data = await db
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
    .where(eq(analyses.userId, session.user.id as any))
    .orderBy(desc(analyses.createdAt))
    .limit(50);

  return <HistoricoClient analyses={data} user={session.user} />;
}
