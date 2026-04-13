import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { childData, results, lang, qualityScore, detectedPathologies } = body;

    if (!childData || !results) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Build payload for the Python script
    const payload = {
      childData,
      results,
      lang: lang ?? "pt",
      qualityScore: qualityScore ?? 0,
      detectedPathologies: detectedPathologies ?? [],
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
