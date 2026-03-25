import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createTestDocx, docxToBase64 } from "./fixtures";

const PORT = 14322;
const BASE = `http://localhost:${PORT}`;

let proc: ReturnType<typeof Bun.spawn>;

beforeAll(async () => {
  proc = Bun.spawn(["bun", "run", "server/index.ts"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      SERVER_PORT: String(PORT),
      DB_PATH: ":memory:",
      NODE_ENV: "test",
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  for (let i = 0; i < 20; i++) {
    try {
      await fetch(`${BASE}/api/templates`);
      break;
    } catch {
      await Bun.sleep(150);
    }
  }
});

afterAll(() => {
  proc.kill();
});

async function uploadTemplate(content: string, name: string): Promise<string> {
  const buf = createTestDocx(content);
  const res = await fetch(`${BASE}/api/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, data: docxToBase64(buf) }),
  });
  const body = await res.json();
  return body.id as string;
}

describe("GET /api/generate/:id", () => {
  test("returns a docx file with correct content-type", async () => {
    const id = await uploadTemplate("Hello {name}", "hello.docx");

    const res = await fetch(`${BASE}/api/generate/${id}?name=World`);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
    expect(res.headers.get("Content-Disposition")).toContain("hello.docx");

    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(0);
  });

  test("returns 404 for non-existent template id", async () => {
    const res = await fetch(`${BASE}/api/generate/non-existent-id-12345`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeString();
  });

  test("renders document without params (uses tag defaults or empty)", async () => {
    const id = await uploadTemplate(
      "Dear {client|Valued Customer}, your total is {amount|0}",
      "invoice.docx"
    );

    const res = await fetch(`${BASE}/api/generate/${id}`);
    expect(res.status).toBe(200);
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(0);
  });

  test("renders document with all params provided", async () => {
    const id = await uploadTemplate(
      "Contract between {company} and {client}",
      "contract.docx"
    );

    const res = await fetch(
      `${BASE}/api/generate/${id}?company=ACME+Inc&client=John+Doe`
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain(
      "vnd.openxmlformats-officedocument"
    );
  });
});
