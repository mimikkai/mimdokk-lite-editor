import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

/**
 * Extract template tag names from a docx buffer.
 * Matches {TAG} and {TAG|DEFAULT} patterns.
 */
export function extractTags(buffer: Buffer | Uint8Array): string[] {
  console.debug("[docx] extractTags — parsing template");

  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const text = doc.getFullText();
  const regex = /{([^{}]+)}/g;
  const matches = new Set<string>();
  let match;

  while ((match = regex.exec(text)) !== null) {
    const tag = match[1].trim().split("|")[0].trim();
    matches.add(tag);
  }

  const tags = Array.from(matches);
  console.debug(`[docx] extractTags — found ${tags.length} tags: ${tags.join(", ")}`);
  return tags;
}

/**
 * Render a docx template with the provided data.
 * Returns the generated document as Uint8Array.
 */
export function renderDocument(
  buffer: Buffer | Uint8Array,
  data: Record<string, string>
): Uint8Array {
  const paramKeys = Object.keys(data);
  console.debug(`[docx] renderDocument — params: ${paramKeys.join(", ")}`);

  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    parser: (tag) => {
      const [key, defaultValue] = tag.split("|");
      return {
        get: (scope: Record<string, string>) => {
          const val = scope[key.trim()];
          if (val === undefined || val === null || val === "") {
            return defaultValue !== undefined ? defaultValue.trim() : "";
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

  console.debug("[docx] renderDocument — done");
  return out;
}
