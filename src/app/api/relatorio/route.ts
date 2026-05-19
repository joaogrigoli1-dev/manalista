import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";

const RelatorioBodySchema = z.object({
  childData: z.object({
    name: z.string().min(1).max(100),
  }).passthrough(), // aceitar campos extras do ChildData
  results: z.array(z.record(z.unknown())).min(1).max(20),
  lang: z.enum(["pt", "en"]).default("pt"),
  qualityScore: z.number().min(0).max(100).default(0),
  detectedPathologies: z.array(z.string().max(200)).max(20).default([]),
  debateMessages: z.array(z.record(z.unknown())).max(200).default([]),
});

export async function POST(req: NextRequest) {
  // ── CSRF ──────────────────────────────────────────────────────────────
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Rate limit: 30 req/hora por IP ───────────────────────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`relatorio:${ip}`, 30, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  // ── Validação zod ─────────────────────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RelatorioBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { childData, results, lang, qualityScore, detectedPathologies, debateMessages } = parsed.data;

  try {

    // Build payload for the Python script.
    // debateMessages é opcional — quando presente, o PDF inclui a Seção 8 (Síntese do Debate).
    const payload = {
      childData,
      results,
      lang: lang ?? "pt",
      qualityScore: qualityScore ?? 0,
      detectedPathologies: detectedPathologies ?? [],
      debateMessages: Array.isArray(debateMessages) ? debateMessages : [],
    };

    // Write temp JSON input
    const id = randomUUID();
    const inputPath  = join(tmpdir(), `manalista-in-${id}.json`);
    const outputPath = join(tmpdir(), `manalista-out-${id}.pdf`);
    await writeFile(inputPath, JSON.stringify(payload, null, 2), "utf-8");

    // Resolve script path relative to project root
    const scriptPath = join(process.cwd(), "scripts", "generate_pdf.py");

    // Spawn Python and wait
    const pdf = await new Promise<Buffer>((resolve, reject) => {
      const py = spawn("python3", [scriptPath, inputPath, outputPath]);
      let stderr = "";
      py.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
      py.on("close", async (code) => {
        if (code !== 0) {
          reject(new Error(`Python exited ${code}: ${stderr}`));
          return;
        }
        try {
          const buf = await readFile(outputPath);
          resolve(buf);
        } catch (e) {
          reject(e);
        }
      });
      py.on("error", reject);
    });

    // Clean up temp files (fire-and-forget)
    unlink(inputPath).catch(() => {});
    unlink(outputPath).catch(() => {});

    // Return PDF
    const childName = (childData.name ?? "relatorio").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `MAnalista_${childName}_${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdf.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/relatorio] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
