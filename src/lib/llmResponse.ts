import { normalizeSearchIntent, type SearchIntent } from "./searchIntent";

export type ParsedLlmOutput =
  | { mode: "structured"; intent: SearchIntent }
  | { mode: "legacy"; query: string; set: string | null };

const STRUCTURED_KEYS = [
  "colors",
  "colorIdentity",
  "types",
  "typesAny",
  "notTypes",
  "oracle",
  "notOracle",
  "keywords",
  "notKeywords",
  "manaValue",
  "power",
  "toughness",
  "format",
  "rarity",
  "flags",
  "price",
] as const;

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

function hasStructuredFields(parsed: Record<string, unknown>): boolean {
  if (typeof parsed.query === "string" && parsed.query.trim()) {
    return STRUCTURED_KEYS.some((key) => {
      const value = parsed[key];
      return value !== undefined && value !== null;
    });
  }

  return STRUCTURED_KEYS.some((key) => {
    const value = parsed[key];
    return value !== undefined && value !== null;
  }) || (parsed.set !== undefined && parsed.set !== null);
}

export function parseLlmResponse(raw: string): ParsedLlmOutput {
  const trimmed = raw.trim();
  const jsonText = extractJsonObject(trimmed);

  if (jsonText.startsWith("{")) {
    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;

      if (hasStructuredFields(parsed)) {
        return {
          mode: "structured",
          intent: normalizeSearchIntent(parsed),
        };
      }

      const query = typeof parsed.query === "string" ? parsed.query.trim() : "";
      const set =
        parsed.set === null || parsed.set === undefined
          ? null
          : String(parsed.set).trim() || null;

      if (query) {
        return { mode: "legacy", query, set };
      }
    } catch {
      // fall through
    }
  }

  return { mode: "legacy", query: trimmed, set: null };
}
