/**
 * Scryfall art/frame treatment mappings.
 *
 * Note: `is:full` means "full extended art" only (narrow Scryfall keyword).
 * `not:default` is Scryfall's cross-set term for atypical frames (borderless,
 * showcase, extended art, inverted, etc.). Some chase printings with
 * default-looking frames (e.g. Japan Showcase) are still tagged `is:default`
 * and cannot be targeted with search syntax alone.
 */
export const ART_TREATMENT_ALIASES: Record<string, string> = {
  alternate: "alternate",
  "alternate art": "alternate",
  "alt art": "alternate",
  "full art": "alternate",
  fullart: "alternate",
  special: "alternate",
  "special art": "alternate",
  borderless: "borderless",
  showcase: "showcase",
  extended: "extended",
  "extended art": "extended",
  inverted: "inverted",
  default: "default",
  normal: "default",
};

/** Atypical frame treatments; Scryfall-maintained, works across all sets. */
export const ALTERNATE_ART_QUERY = "not:default";

export function normalizeArtTreatment(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const key = String(value).trim().toLowerCase();
  if (!key) return null;
  return ART_TREATMENT_ALIASES[key] ?? null;
}

export function artTreatmentToQuery(treatment: string): string | null {
  switch (treatment) {
    case "alternate":
      return ALTERNATE_ART_QUERY;
    case "borderless":
      return "border:borderless";
    case "showcase":
      return "frame:showcase";
    case "extended":
      return "(is:full OR frame:extendedart)";
    case "inverted":
      return "frame:inverted";
    case "default":
      return "is:default";
    default:
      return null;
  }
}
