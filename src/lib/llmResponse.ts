export interface LlmQueryResponse {
  query: string;
  set: string | null;
}

function extractJsonObject(raw: string): string {
  let text = raw.trim();

  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```$/, "");
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  return text;
}

export function parseLlmResponse(raw: string): LlmQueryResponse {
  const trimmed = raw.trim();
  const jsonText = extractJsonObject(trimmed);

  if (jsonText.startsWith("{")) {
    try {
      const parsed = JSON.parse(jsonText) as Partial<LlmQueryResponse>;
      const query = typeof parsed.query === "string" ? parsed.query.trim() : "";
      const set =
        parsed.set === null || parsed.set === undefined
          ? null
          : String(parsed.set).trim() || null;

      if (query) {
        return { query, set };
      }
    } catch {
      // fall through to legacy plain-text parsing
    }
  }

  return { query: trimmed, set: null };
}
