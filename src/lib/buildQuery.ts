import { parseLlmResponse } from "./llmResponse";
import { buildScryfallQuery } from "./queryBuilder";
import { hasSearchFilters } from "./searchIntent";
import { resolveSetCode } from "./setResolver";
import { validateQuery } from "./queryValidator";

const SET_CLAUSE_PATTERN = /\b(?:s|e|set|edition):[^\s]+/gi;

export function stripSetClauses(query: string): string {
  return query.replace(SET_CLAUSE_PATTERN, " ").replace(/\s+/g, " ").trim();
}

async function appendSetClause(query: string, setName: string): Promise<string> {
  const code = await resolveSetCode(setName);
  if (!code) {
    throw new Error(`Could not find a Scryfall set matching "${setName}".`);
  }

  return `${stripSetClauses(query)} s:${code}`.trim();
}

export async function buildFinalQuery(rawLlmOutput: string): Promise<string> {
  const parsed = parseLlmResponse(rawLlmOutput);

  const setName =
    parsed.mode === "structured" ? parsed.intent.set : parsed.set;

  let query = "";
  if (parsed.mode === "structured") {
    const filters = { ...parsed.intent, set: null };
    if (hasSearchFilters(filters)) {
      query = buildScryfallQuery(filters);
    }
  } else {
    query = parsed.query.trim();
  }

  if (!query && !setName) {
    throw new Error("No searchable filters were extracted from the request.");
  }

  if (setName) {
    query = await appendSetClause(query, setName);
  }

  const validated = validateQuery(query);
  if (!validated.ok) {
    throw new Error(validated.error);
  }

  return validated.query;
}
