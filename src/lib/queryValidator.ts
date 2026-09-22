const MAX_QUERY_LENGTH = 1000;

const ALLOWED_PATTERN =
  /^[a-zA-Z0-9\s:><=!\-(){}"/~,\\.]+$/;

export function cleanQuery(raw: string): string {
  let query = raw.trim();

  if (query.startsWith("```")) {
    query = query.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
  }

  if (
    (query.startsWith('"') && query.endsWith('"')) ||
    (query.startsWith("'") && query.endsWith("'"))
  ) {
    query = query.slice(1, -1);
  }

  query = query.trim();

  if (query.includes("\n")) {
    query = query.split("\n")[0]?.trim() ?? "";
  }

  if (query.length > MAX_QUERY_LENGTH) {
    query = query.slice(0, MAX_QUERY_LENGTH);
  }

  return query;
}

export function validateQuery(query: string): { ok: true; query: string } | { ok: false; error: string } {
  const cleaned = cleanQuery(query);

  if (!cleaned) {
    return { ok: false, error: "Query cannot be empty." };
  }

  if (!ALLOWED_PATTERN.test(cleaned)) {
    return { ok: false, error: "Query contains invalid characters." };
  }

  return { ok: true, query: cleaned };
}
