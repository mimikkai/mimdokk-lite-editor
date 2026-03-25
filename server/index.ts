import { handleTemplates, handleTemplateById } from "./routes/templates";
import { handleGenerate } from "./routes/generate";

const PORT = Number(process.env.SERVER_PORT ?? 3000);
const IS_DEV = process.env.NODE_ENV !== "production";

const CORS_HEADERS: Record<string, string> = IS_DEV
  ? {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  : {};

function withCors(res: Response): Response {
  if (!IS_DEV) return res;
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    headers.set(k, v);
  }
  return new Response(res.body, { status: res.status, headers });
}

async function serveStatic(pathname: string): Promise<Response> {
  const base = "./dist";
  const target = pathname === "/" ? `${base}/index.html` : `${base}${pathname}`;
  const file = Bun.file(target);

  if (await file.exists()) {
    return new Response(file);
  }

  // SPA fallback — serve index.html for unknown routes
  const index = Bun.file(`${base}/index.html`);
  if (await index.exists()) {
    return new Response(index);
  }

  return new Response(
    "Frontend not built. Run: bun run build",
    { status: 503, headers: { "Content-Type": "text/plain" } }
  );
}

const server = Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;

    // Preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // API routes
    if (pathname === "/api/templates" || pathname === "/api/templates/") {
      return withCors(await handleTemplates(req));
    }

    const templateByIdMatch = pathname.match(/^\/api\/templates\/([^/]+)$/);
    if (templateByIdMatch && req.method === "GET") {
      return withCors(handleTemplateById(templateByIdMatch[1]));
    }

    const generateMatch = pathname.match(/^\/api\/generate\/([^/]+)$/);
    if (generateMatch) {
      return withCors(handleGenerate(req, generateMatch[1]));
    }

    if (pathname === "/api/proxy" && req.method === "GET") {
      const targetUrl = url.searchParams.get("url");
      if (!targetUrl || !targetUrl.startsWith("http")) {
        return withCors(new Response(JSON.stringify({ error: "Missing or invalid url param" }), {
          status: 400, headers: { "Content-Type": "application/json" },
        }));
      }
      console.info(`[proxy] GET — fetching url="${targetUrl}"`);
      try {
        const upstream = await fetch(targetUrl);
        if (!upstream.ok) {
          console.error(`[proxy] upstream returned status=${upstream.status}`);
          return withCors(new Response(JSON.stringify({ error: `Upstream HTTP ${upstream.status}` }), {
            status: 502, headers: { "Content-Type": "application/json" },
          }));
        }
        const body = await upstream.arrayBuffer();
        const contentType = upstream.headers.get("Content-Type") ?? "application/octet-stream";
        console.info(`[proxy] proxied ${body.byteLength} bytes content-type="${contentType}"`);
        return withCors(new Response(body, { status: 200, headers: { "Content-Type": contentType } }));
      } catch (err) {
        console.error("[proxy] fetch failed:", err);
        return withCors(new Response(JSON.stringify({ error: "Failed to fetch URL" }), {
          status: 502, headers: { "Content-Type": "application/json" },
        }));
      }
    }

    // 404 for unknown /api/* routes
    if (pathname.startsWith("/api/")) {
      return withCors(
        new Response(JSON.stringify({ error: "Not Found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    // Static files (production)
    return serveStatic(pathname);
  },
});

console.info(`[server] started — port=${PORT} mode=${IS_DEV ? "dev" : "prod"}`);
console.info(`[server] API base: http://localhost:${PORT}/api`);
