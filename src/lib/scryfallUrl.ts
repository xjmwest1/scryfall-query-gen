export const SCRYFALL_SEARCH_BASE = "https://scryfall.com/search";

export function buildScryfallSearchUrl(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Query cannot be empty");
  }

  return `${SCRYFALL_SEARCH_BASE}?q=${encodeURIComponent(trimmed)}`;
}

export function redirectToScryfall(query: string, newTab = false): void {
  const url = buildScryfallSearchUrl(query);

  if (newTab) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  window.location.assign(url);
}
