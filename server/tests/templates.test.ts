import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createTestDocx, docxToBase64 } from "./fixtures";

const PORT = 14321;
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

  // Wait for server to be ready
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

describe("POST /api/templates", () => {
  test("uploads a valid docx template and returns id + tags", async () => {
    const buf = createTestDocx("Contract for {client} dated {date}");
    const res = await fetch(`${BASE}/api/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "contract.docx", data: docxToBase64(buf) }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeString();
    expect(body.name).toBe("contract.docx");
    expect(body.tags).toContain("client");
    expect(body.tags).toContain("date");
    expect(body.createdAt).toBeString();
  });

  test("returns 400 when name is missing", async () => {
    const buf = createTestDocx();
    const res = await fetch(`${BASE}/api/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: docxToBase64(buf) }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeString();
  });

  test("returns 400 when data is missing", async () => {
    const res = await fetch(`${BASE}/api/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "test.docx" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeString();
  });
});

describe("GET /api/templates", () => {
  test("returns an array without data field", async () => {
    const res = await fetch(`${BASE}/api/templates`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    for (const item of body) {
      expect(item.data).toBeUndefined();
      expect(item.id).toBeString();
      expect(item.name).toBeString();
      expect(Array.isArray(item.tags)).toBe(true);
    }
  });

  test("uploaded template appears in list", async () => {
    const buf = createTestDocx("Invoice {invoice_number}");
    const upload = await fetch(`${BASE}/api/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "invoice.docx", data: docxToBase64(buf) }),
    });
    const { id } = await upload.json();

    const list = await fetch(`${BASE}/api/templates`);
    const items = await list.json();
    const found = items.find((t: { id: string }) => t.id === id);
    expect(found).toBeDefined();
    expect(found.name).toBe("invoice.docx");
  });
});
