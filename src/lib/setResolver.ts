const SETS_API = "https://api.scryfall.com/sets";
const CACHE_KEY = "scryfall-sets-cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const USER_AGENT = "ScryfallQueryGen/1.0 (+https://github.com/xjmwest1/scryfall-query-gen)";

export interface ScryfallSet {
  code: string;
  name: string;
}

interface SetsCache {
  fetchedAt: number;
  sets: ScryfallSet[];
}

function normalizeWords(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeCompact(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function wordTokens(value: string): string[] {
  return normalizeWords(value).split(" ").filter(Boolean);
}

function wordsMatch(inputWord: string, setWord: string): boolean {
  if (setWord.includes(inputWord) || inputWord.includes(setWord)) return true;
  return similarity(normalizeCompact(inputWord), normalizeCompact(setWord)) >= 0.75;
}

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

export function findSetCode(name: string, sets: ScryfallSet[]): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const compactInput = normalizeCompact(trimmed);
  const codeCandidate = trimmed.toLowerCase();

  if (/^[a-z0-9]{2,5}$/.test(codeCandidate)) {
    const byCode = sets.find((set) => set.code.toLowerCase() === codeCandidate);
    if (byCode) return byCode.code;
  }

  const inputWords = wordTokens(trimmed);
  let best: { code: string; score: number } | null = null;

  for (const set of sets) {
    const setCompact = normalizeCompact(set.name);
    const setWords = wordTokens(set.name);

    if (compactInput === setCompact) {
      return set.code;
    }

    if (normalizeWords(trimmed) === normalizeWords(set.name)) {
      return set.code;
    }

    const allWordsMatch =
      inputWords.length > 0 &&
      inputWords.every((word) => setWords.some((setWord) => wordsMatch(word, setWord)));
    if (allWordsMatch) {
      return set.code;
    }

    const compactScore = similarity(compactInput, setCompact);
    if (compactScore >= 0.82) {
      if (!best || compactScore > best.score) {
        best = { code: set.code, score: compactScore };
      }
    }
  }

  return best?.code ?? null;
}

function readCache(): SetsCache | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SetsCache;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(sets: ScryfallSet[]): void {
  try {
    const payload: SetsCache = { fetchedAt: Date.now(), sets };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

let inMemorySets: ScryfallSet[] | null = null;

export function setSetCatalog(sets: ScryfallSet[]): void {
  inMemorySets = sets;
}

export async function fetchSetCatalog(): Promise<ScryfallSet[]> {
  if (inMemorySets) return inMemorySets;

  const cached = readCache();
  if (cached) {
    inMemorySets = cached.sets;
    return cached.sets;
  }

  const response = await fetch(SETS_API, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load Scryfall sets (${response.status}).`);
  }

  const body = (await response.json()) as { data?: Array<{ code?: string; name?: string }> };
  const sets = (body.data ?? [])
    .filter((set) => set.code && set.name)
    .map((set) => ({ code: set.code!, name: set.name! }));

  inMemorySets = sets;
  writeCache(sets);
  return sets;
}

export async function resolveSetCode(name: string): Promise<string | null> {
  const sets = await fetchSetCatalog();
  return findSetCode(name, sets);
}
