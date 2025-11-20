export type WorkerMessage =
  | { type: "PARSE"; payload: ArrayBuffer }
  | {
      type: "GENERATE";
      payload: { template: ArrayBuffer; data: Record<string, any> };
    };

export type WorkerResponse =
  | { type: "SUCCESS"; id: string; result: any }
  | { type: "ERROR"; id: string; error: string };

class MimdokkClient {
  private worker: Worker;
  private pending: Map<
    string,
    { resolve: (val: any) => void; reject: (err: any) => void }
  >;

  constructor() {
    this.worker = new Worker(
      new URL("../workers/mimdokk.worker.ts", import.meta.url),
      {
        type: "module",
      }
    );
    this.pending = new Map();

    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { type, id } = e.data;
      if (!this.pending.has(id)) return;

      const { resolve, reject } = this.pending.get(id)!;
      this.pending.delete(id);

      if (type === "SUCCESS") {
        resolve(e.data.result);
      } else {
        reject(new Error(e.data.error));
      }
    };
  }

  private request<T>(type: string, payload: any): Promise<T> {
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ type, payload, id });
    });
  }

  async parseTemplate(fileBuffer: ArrayBuffer): Promise<string[]> {
    return this.request<string[]>("PARSE", fileBuffer);
  }

  async generateDocument(
    templateBuffer: ArrayBuffer,
    data: Record<string, any>
  ): Promise<Uint8Array> {
    return this.request<Uint8Array>("GENERATE", {
      template: templateBuffer,
      data,
    });
  }
}

export const mimdokkClient = new MimdokkClient();
