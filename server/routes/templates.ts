import { db } from "../db";
import { extractTags } from "../lib/docx";

export async function handleTemplates(req: Request): Promise<Response> {
  const method = req.method.toUpperCase();

  if (method === "POST") {
    return handleUpload(req);
  }

  if (method === "GET") {
    return handleList();
  }

  return new Response("Method Not Allowed", { status: 405 });
}

export function handleTemplateById(id: string): Response {
  const row = db
    .query<{ id: string; name: string; data: string; tags: string; created_at: string }, [string]>(
      "SELECT id, name, data, tags, created_at FROM templates WHERE id = ?"
    )
    .get(id);

  if (!row) {
    console.info(`[templates] GET /${id} — not found`);
    return json({ error: "Template not found" }, 404);
  }

  console.info(`[templates] GET /${id} — name="${row.name}"`);
  return json({
    id: row.id,
    name: row.name,
    data: row.data,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.created_at,
  });
}

async function handleUpload(req: Request): Promise<Response> {
  let body: { name?: string; data?: string; url?: string };

  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (!body.name || typeof body.name !== "string") {
    return jsonError("Missing required field: name", 400);
  }

  if (!body.data && !body.url) {
    return jsonError("Missing required field: data (base64 docx) or url", 400);
  }

  let buffer: Buffer;
  let base64data: string;

  if (body.url) {
    if (typeof body.url !== "string" || !body.url.startsWith("http")) {
      return jsonError("Invalid url: must be an http/https URL", 400);
    }
    console.info(`[templates] POST — fetching template from url="${body.url}"`);
    let fetchRes: Response;
    try {
      fetchRes = await fetch(body.url);
    } catch (err) {
      console.error("[templates] failed to fetch template url:", err);
      return jsonError("Failed to fetch template from URL", 502);
    }
    if (!fetchRes.ok) {
      console.error(`[templates] url fetch returned status=${fetchRes.status}`);
      return jsonError(`Failed to fetch template: HTTP ${fetchRes.status}`, 502);
    }
    const arrayBuffer = await fetchRes.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    base64data = buffer.toString("base64");
  } else {
    try {
      buffer = Buffer.from(body.data!, "base64");
      base64data = body.data!;
    } catch {
      return jsonError("Invalid base64 in field: data", 400);
    }
  }

  let tags: string[];
  try {
    tags = extractTags(buffer);
  } catch (err) {
    console.error("[templates] failed to parse docx tags:", err);
    return jsonError("Failed to parse docx template", 400);
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    db.run(
      "INSERT INTO templates (id, name, data, tags, created_at) VALUES (?, ?, ?, ?, ?)",
      [id, body.name, base64data, JSON.stringify(tags), createdAt]
    );
  } catch (err) {
    console.error("[templates] db insert failed:", err);
    return jsonError("Failed to save template", 500);
  }

  console.info(`[templates] POST — saved template id=${id} name="${body.name}" tags=${tags.length}`);

  return json({ id, name: body.name, tags, createdAt }, 201);
}

function handleList(): Response {
  const rows = db
    .query<{ id: string; name: string; tags: string; created_at: string }, []>(
      "SELECT id, name, tags, created_at FROM templates ORDER BY created_at DESC"
    )
    .all();

  const result = rows.map((r) => ({
    id: r.id,
    name: r.name,
    tags: JSON.parse(r.tags) as string[],
    createdAt: r.created_at,
  }));

  console.info(`[templates] GET — returning ${result.length} templates`);
  return json(result);
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status: number): Response {
  return json({ error: message }, status);
}
