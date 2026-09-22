export type ComparisonOp = "<=" | "<" | "=" | ">=" | ">" | "!=";

export interface NumericFilter {
  op: ComparisonOp;
  value: number;
}

export interface PriceFilter {
  currency: "usd" | "eur" | "tix";
  op: ComparisonOp;
  value: number;
}

export interface SearchIntent {
  colors: string[] | null;
  colorIdentity: string[] | null;
  types: string[] | null;
  typesAny: string[] | null;
  notTypes: string[] | null;
  oracle: string[] | null;
  notOracle: string[] | null;
  keywords: string[] | null;
  notKeywords: string[] | null;
  manaValue: NumericFilter | null;
  power: NumericFilter | null;
  toughness: NumericFilter | null;
  format: string | null;
  rarity: string | null;
  flags: string[] | null;
  price: PriceFilter | null;
  set: string | null;
}

export const EMPTY_SEARCH_INTENT: SearchIntent = {
  colors: null,
  colorIdentity: null,
  types: null,
  typesAny: null,
  notTypes: null,
  oracle: null,
  notOracle: null,
  keywords: null,
  notKeywords: null,
  manaValue: null,
  power: null,
  toughness: null,
  format: null,
  rarity: null,
  flags: null,
  price: null,
  set: null,
};

const COLOR_ALIASES: Record<string, string> = {
  w: "w",
  white: "w",
  u: "u",
  blue: "u",
  b: "b",
  black: "b",
  r: "r",
  red: "r",
  g: "g",
  green: "g",
  c: "c",
  colorless: "c",
  m: "m",
  multicolor: "m",
  azorius: "wu",
  dimir: "ub",
  rakdos: "br",
  gruul: "rg",
  selesnya: "gw",
  orzhov: "wb",
  izzet: "ur",
  golgari: "bg",
  boros: "rw",
  simic: "ug",
  bant: "gwu",
  esper: "wub",
  grixis: "ubr",
  jund: "brg",
  naya: "rwg",
  abzan: "wbg",
  jeskai: "urw",
  sultai: "bug",
  mardu: "rwb",
  temur: "urg",
};

const COMPARISON_OPS = new Set<ComparisonOp>(["<=", "<", "=", ">=", ">", "!="]);

function normalizeStringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);
  return items.length ? items : null;
}

function normalizeNumericFilter(value: unknown): NumericFilter | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const op = String(record.op ?? "").trim() as ComparisonOp;
  const rawValue = Number(record.value);
  if (!COMPARISON_OPS.has(op) || Number.isNaN(rawValue)) return null;
  return { op, value: rawValue };
}

function normalizePriceFilter(value: unknown): PriceFilter | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const currency = String(record.currency ?? "usd").trim().toLowerCase();
  if (currency !== "usd" && currency !== "eur" && currency !== "tix") return null;
  const op = String(record.op ?? "").trim() as ComparisonOp;
  const rawValue = Number(record.value);
  if (!COMPARISON_OPS.has(op) || Number.isNaN(rawValue)) return null;
  return { currency, op, value: rawValue };
}

export function normalizeColorToken(value: string): string {
  const key = value.trim().toLowerCase();
  return COLOR_ALIASES[key] ?? key.replace(/[^a-z]/g, "");
}

export function normalizeColorList(values: string[] | null): string[] | null {
  if (!values?.length) return null;

  const normalized: string[] = [];
  for (const value of values) {
    const token = normalizeColorToken(value);
    if (token.length > 1 && !token.includes(" ")) {
      normalized.push(...token.split(""));
      continue;
    }
    if (token) normalized.push(token);
  }

  return normalized.length ? normalized : null;
}

export function colorsToQuery(colors: string[]): string {
  if (colors.length === 1) return `c:${colors[0]}`;
  return `c:${colors.join("")}`;
}

export function normalizeSearchIntent(raw: Record<string, unknown>): SearchIntent {
  const set =
    raw.set === null || raw.set === undefined
      ? null
      : String(raw.set).trim() || null;

  return {
    colors: normalizeColorList(normalizeStringList(raw.colors)),
    colorIdentity: normalizeColorList(normalizeStringList(raw.colorIdentity)),
    types: normalizeStringList(raw.types),
    typesAny: normalizeStringList(raw.typesAny),
    notTypes: normalizeStringList(raw.notTypes),
    oracle: normalizeStringList(raw.oracle),
    notOracle: normalizeStringList(raw.notOracle),
    keywords: normalizeStringList(raw.keywords),
    notKeywords: normalizeStringList(raw.notKeywords),
    manaValue: normalizeNumericFilter(raw.manaValue),
    power: normalizeNumericFilter(raw.power),
    toughness: normalizeNumericFilter(raw.toughness),
    format: raw.format ? String(raw.format).trim().toLowerCase() : null,
    rarity: raw.rarity ? String(raw.rarity).trim().toLowerCase() : null,
    flags: normalizeStringList(raw.flags),
    price: normalizePriceFilter(raw.price),
    set,
  };
}

export function hasSearchFilters(intent: SearchIntent): boolean {
  return Object.entries(intent).some(([key, value]) => {
    if (key === "set") return false;
    if (value === null || value === undefined) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
}
