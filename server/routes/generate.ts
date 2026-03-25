import { db } from "../db";
import { renderDocument } from "../lib/docx";

const RESERVED_PARAMS = new Set(["templateId", "_filename"]);

export function handleGenerate(req: Request, id: string): Response {
  const row = db
    .query<{ name: string; data: string }, [string]>(
      "SELECT name, data FROM templates WHERE id = ?"
    )
    .get(id);

  if (!row) {
    console.info(`[generate] GET — template not found id=${id}`);
    return new Response(JSON.stringify({ error: "Template not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const params: Record<string, string> = {};

  for (const [key, value] of url.searchParams.entries()) {
    if (!RESERVED_PARAMS.has(key)) {
      params[key] = value;
    }
  }

  const paramKeys = Object.keys(params);
  console.info(
    `[generate] GET — id=${id} name="${row.name}" params=[${paramKeys.join(", ")}]`
  );

  let buffer: Buffer;
  try {
    buffer = Buffer.from(row.data, "base64");
  } catch (err) {
    console.error("[generate] failed to decode base64 template:", err);
    return new Response(JSON.stringify({ error: "Invalid template data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let docx: Uint8Array;
  try {
    docx = renderDocument(buffer, params);
  } catch (err) {
    console.error("[generate] docxtemplater error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to render document", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const rawFilename = url.searchParams.get("_filename") || row.name;
  const filename = rawFilename.endsWith(".docx") ? rawFilename : `${rawFilename}.docx`;

  return new Response(docx, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(docx.byteLength),
    },
  });
}
