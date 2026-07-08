import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";
import { internalErrorResponse } from "@/lib/api-error";
import { detectRedFlags, buildRedFlagBlock } from "@/lib/red-flags";
import type { ChildData } from "@/types";

// A-04: schema explícito e forte para `childData`, coerente com o tipo
// `ChildData` (src/types/index.ts). Campos textuais têm limite de tamanho
// para mitigar payloads abusivos; `.passthrough()` é mantido apenas para
// tolerar campos futuros do `ChildData` que ainda não tenham sido
// adicionados aqui, sem servir de escape hatch para `z.unknown()` genérico.
const ChildDataSchema = z
  .object({
    name: z.string().min(1).max(200),
    birthdate: z.string().max(50).default(""),
    ageYears: z.number().int().min(0).max(25).default(0),
    ageMonths: z.number().int().min(0).max(11).default(0),
    sex: z.enum(["M", "F", "outro"]).default("outro"),
    mainComplaints: z.string().max(5000).default(""),
    complaintDuration: z.string().max(500).default(""),
    gestationalAge: z.string().max(200).default(""),
    birthComplications: z.string().max(5000).default(""),
    motorMilestones: z.string().max(5000).default(""),
    languageMilestones: z.string().max(5000).default(""),
    socialMilestones: z.string().max(5000).default(""),
    behaviorHome: z.string().max(5000).default(""),
    behaviorSchool: z.string().max(5000).default(""),
    sleepPattern: z.string().max(5000).default(""),
    feedingPattern: z.string().max(5000).default(""),
    familyHistory: z.string().max(5000).default(""),
    previousDiagnoses: z.string().max(5000).default(""),
    currentMedications: z.string().max(5000).default(""),
    therapiesInProgress: z.string().max(5000).default(""),
    familyStructure: z.string().max(5000).default(""),
    parentingChallenges: z.string().max(5000).default(""),
  })
  .passthrough();

const RelatorioBodySchema = z.object({
  childData: ChildDataSchema,
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

  // A-05: Protocolo de Red Flag — SEMPRE calculado e SEMPRE exposto,
  // independentemente do plano do usuário. Esta rota não faz nenhuma
  // checagem de plano/paywall; nenhuma lógica futura de gating (Frente E)
  // pode envolver este bloco. Ver src/lib/red-flags.ts para o aviso
  // completo sobre a natureza heurística (não clínica validada) do
  // detector.
  const redFlags = detectRedFlags(childData as unknown as ChildData);
  const redFlagBlockText = buildRedFlagBlock(redFlags, lang);

  try {

    // Build payload for the Python script.
    // debateMessages é opcional — quando presente, o PDF inclui a Seção 8 (Síntese do Debate).
    // redFlags/redFlagBlockText: campos aditivos — o gerador de PDF atual
    // (scripts/generate_pdf.py) pode ignorá-los sem quebrar; ficam
    // disponíveis para renderização futura do bloco de red flag no PDF.
    // TODO(Frente E / PDF template): renderizar `redFlagBlockText` como
    // seção sempre visível do PDF, nunca atrás de paywall.
    const payload = {
      childData,
      results,
      lang: lang ?? "pt",
      qualityScore: qualityScore ?? 0,
      detectedPathologies: detectedPathologies ?? [],
      debateMessages: Array.isArray(debateMessages) ? debateMessages : [],
      redFlags,
      redFlagBlockText,
    };

    // Write temp JSON input
    const id = randomUUID();
    const inputPath  = join(tmpdir(), `manalista-in-${id}.json`);
    const outputPath = join(tmpdir(), `manalista-out-${id}.pdf`);
    await writeFile(inputPath, JSON.stringify(payload, null, 2), "utf-8");

    // Resolve script path relative to project root
    const scriptPath = join(process.cwd(), "scripts", "generate_pdf.py");

    const PYTHON_TIMEOUT_MS = 30_000;

    // Spawn Python and wait
    let pdf: Buffer;
    try {
      pdf = await new Promise<Buffer>((resolve, reject) => {
        const py = spawn("python3", [scriptPath, inputPath, outputPath]);
        let stderr = "";

        // Timeout: kill the process if it takes longer than 30s
        const timer = setTimeout(() => {
          py.kill("SIGTERM");
          reject(new Error("PDF generation timed out after 30s"));
        }, PYTHON_TIMEOUT_MS);

        py.stderr.on("data", (d: Buffer) => {
          // Truncate stderr to avoid logging patient data in production
          if (stderr.length < 500) stderr += d.toString();
        });

        py.on("close", async (code) => {
          clearTimeout(timer);
          if (code !== 0) {
            reject(new Error(`PDF generator exited with code ${code}: ${stderr.slice(0, 200)}`));
            return;
          }
          try {
            const buf = await readFile(outputPath);
            resolve(buf);
          } catch (e) {
            reject(e);
          }
        });

        py.on("error", (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });
    } finally {
      // Always clean up temp files, even on error
      unlink(inputPath).catch(() => {});
      unlink(outputPath).catch(() => {});
    }

    // Return PDF
    const childName = (childData.name ?? "relatorio").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `MAnalista_${childName}_${new Date().toISOString().slice(0, 10)}.pdf`;

    // A-05: expõe o bloco de red flag também via header (base64) — o
    // frontend deve exibi-lo SEMPRE que presente, independentemente de
    // plano, mesmo enquanto o template do PDF não o renderiza nativamente.
    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdf.length),
      "X-Red-Flags-Count": String(redFlags.length),
    };
    if (redFlags.length > 0) {
      responseHeaders["X-Red-Flags-Block-B64"] = Buffer.from(redFlagBlockText, "utf-8").toString("base64");
    }

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    return internalErrorResponse(err, "relatorio:pdf");
  }
}
