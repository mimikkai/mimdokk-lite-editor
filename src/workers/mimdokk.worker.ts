import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

// Helper to extract tags using regex from the full text
// This is a simplified extraction. For complex templates, a proper parser would be needed.
async function extract(buffer: Uint8Array): Promise<string[]> {
  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const text = doc.getFullText();
  // Match content inside curly braces: {TAG}
  const regex = /{([^{}]+)}/g;
  const matches = new Set<string>();
  let match;
  while ((match = regex.exec(text)) !== null) {
    // Trim whitespace from the tag name
    matches.add(match[1].trim());
  }
  return Array.from(matches);
}

async function render(
  buffer: Uint8Array,
  data: Record<string, any>
): Promise<Uint8Array> {
  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Handle default values in data if they are missing
  // We need to parse the keys in data to see if they have defaults
  // But wait, the data passed here is already the final values from the form.
  // The form should handle the default values logic.
  // However, docxtemplater expects keys to match exactly what's in the doc.
  // If the doc has {TAG|DEFAULT}, docxtemplater might not handle the pipe automatically unless we use a custom parser.
  // BUT, the user requirement implies we should parse this ourselves.

  // Let's assume the user wants the final doc to just have the value.
  // If the doc has {TAG|DEFAULT}, docxtemplater treats "TAG|DEFAULT" as the variable name by default.
  // We need to configure docxtemplater to handle this or pre-process the template.
  // A common way with docxtemplater is to use a custom parser.

  // Let's update the docxtemplater configuration to handle the pipe.
  doc.setOptions({
    parser: (tag) => {
      // tag is "TAG|DEFAULT"
      const [key, defaultValue] = tag.split("|");
      return {
        get: (scope: any) => {
          const val = scope[key.trim()];
          if (val === undefined || val === null || val === "") {
            return defaultValue ? defaultValue.trim() : val;
          }
          return val;
        },
      };
    },
  });

  doc.render(data);

  const out = doc.getZip().generate({
    type: "uint8array",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  return out;
}

self.onmessage = async (e: MessageEvent) => {
  const { type, payload, id } = e.data;

  try {
    let result;
    switch (type) {
      case "PARSE":
        // payload is the file buffer
        result = await extract(new Uint8Array(payload));
        break;
      case "GENERATE":
        // payload is { template: buffer, data: object }
        const { template, data } = payload;
        result = await render(new Uint8Array(template), data);
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    self.postMessage({ type: "SUCCESS", id, result });
  } catch (error) {
    console.error("Worker Error:", error);
    self.postMessage({ type: "ERROR", id, error: (error as Error).message });
  }
};
