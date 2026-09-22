import { parseLlmResponse } from "./llmResponse";
import { resolveSetCode } from "./setResolver";
import { validateQuery } from "./queryValidator";

const SET_CLAUSE_PATTERN = /\b(?:s|e|set|edition):[^\s]+/gi;

export function stripSetClauses(query: string): string {
  return query.replace(SET_CLAUSE_PATTERN, " ").replace(/\s+/g, " ").trim();
}

export async function buildFinalQuery(rawLlmOutput: string): Promise<string> {
  const { query: rawQuery, set } = parseLlmResponse(rawLlmOutput);
  let query = rawQuery.trim();

  if (!query) {
    throw new Error("Model returned an empty query.");
  }

  if (set) {
    const code = await resolveSetCode(set);
    if (!code) {
      throw new Error(`Could not find a Scryfall set matching "${set}".`);
    }

    query = stripSetClauses(query);
    query = `${query} s:${code}`.trim();
  }

  const validated = validateQuery(query);
  if (!validated.ok) {
    throw new Error(validated.error);
  }

  return validated.query;
}
