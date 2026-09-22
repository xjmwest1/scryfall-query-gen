# Scryfall Query Generator — Product & Technical Specification

**Version:** 0.2  
**Date:** 2025-09-22  
**Status:** Draft

---

## 1. Overview

### 1.1 Problem

[Scryfall](https://scryfall.com) is the definitive Magic: The Gathering card search engine, but its query syntax is powerful and opaque. Casual and competitive players alike often know *what* they want ("a red creature that deals damage when it enters") but not *how* to express it (`c:r t:creature o:"enters" o:damage`).

### 1.2 Solution

A single-page web application that:

1. Accepts a natural-language description of desired cards.
2. Uses a **small LLM running entirely in the browser** to produce a valid Scryfall query string.
3. **Redirects the user to Scryfall** with the generated query applied (`https://scryfall.com/search?q=...`).

All LLM inference happens on-device. No backend server, no OpenAI API key, no Scryfall API calls from our app. Scryfall handles search, filtering, and result display on their site.

### 1.3 Target Users

- Commander/EDH deck builders searching for synergies
- Limited/draft players looking for specific archetype pieces
- Newer players who don't know Scryfall syntax
- Experienced players who want faster ad-hoc searches

---

## 2. Goals & Non-Goals

### 2.1 Goals

| # | Goal |
|---|------|
| G1 | Convert common English card descriptions to correct Scryfall syntax |
| G2 | Run LLM inference fully client-side (privacy + zero hosting cost) |
| G3 | Redirect to Scryfall with the generated query applied |
| G4 | Show the generated query briefly so users can learn Scryfall syntax (optional copy before redirect) |
| G5 | Work on modern Chromium browsers with WebGPU |
| G6 | First redirect within ~30s of initial page load (including model download) |

### 2.2 Non-Goals (v1)

| # | Non-Goal | Rationale |
|---|----------|-----------|
| NG1 | Deck building / collection management | Out of scope; Scryfall/Archidekt/etc. already do this |
| NG2 | Server-side LLM fallback | Contradicts privacy model; defer to v2 if needed |
| NG3 | Mobile-first / Safari support | WebGPU support is limited on Safari/iOS in 2025 |
| NG4 | Multi-turn conversational refinement | v1 is single-shot; chat mode is a future enhancement |
| NG5 | Training a custom model | Use off-the-shelf Llama 3.2 with prompt engineering |
| NG6 | Inline card results / Scryfall API integration | Scryfall's site handles search and display; we only build the query URL |

---

## 3. User Stories

### 3.1 Core

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-1 | As a player, I type "green creatures that ramp mana" and am taken to Scryfall | Browser navigates to `https://scryfall.com/search?q=...` with a valid query containing `c:g t:creature` and a ramp-related clause |
| US-2 | As a player, I see the generated query before redirect (optional) | Query shown briefly in UI or via "Copy query" so I can learn the syntax |
| US-3 | As a player, I am redirected automatically after generation | No extra click required; `window.location.assign()` or `window.open()` fires on success |
| US-4 | As a player, I see a loading indicator while the model downloads | Progress bar shows model download % on first visit |
| US-5 | As a player, I can cancel or edit before redirect | Short delay or "Edit query" option before navigation (configurable) |

### 3.2 Secondary

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-6 | As a player, I see example prompts to try | 3–5 clickable example queries on empty state |
| US-7 | As a player, I can copy the query to clipboard | One-click copy with toast confirmation |
| US-8 | As a player, I can open Scryfall in a new tab instead of same tab | Setting or modifier key (e.g. Ctrl+Enter) uses `window.open()` |

---

## 4. Architecture

### 4.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (SPA)                       │
│                                                         │
│  ┌──────────┐    ┌─────────────┐    ┌────────────────┐  │
│  │   UI     │───▶│  Web Worker │───▶│  LLM Runtime   │  │
│  │ (React)  │◀───│  (inference)│◀───│ WebLLM / T.js  │  │
│  └────┬─────┘    └─────────────┘    └───────┬────────┘  │
│       │                                      │          │
│       │         ┌─────────────┐              │          │
│       └────────▶│   Query     │◀─────────────┘          │
│                 │  Validator  │                           │
│                 └──────┬──────┘                           │
│                        │                                  │
│                 ┌──────▼──────┐                           │
│                 │  Scryfall   │                           │
│                 │ URL Builder │                           │
│                 └──────┬──────┘                           │
└────────────────────────┼────────────────────────────────┘
                         │ redirect (navigation)
                         ▼
              ┌─────────────────────┐
              │  scryfall.com/search │
              │  ?q=<encoded query>  │
              └─────────────────────┘
```

### 4.2 Data Flow

1. **User input** → natural-language string
2. **Prompt assembly** → system prompt + Scryfall syntax cheat sheet + user input
3. **LLM inference** (Web Worker) → raw query string
4. **Post-processing** → strip markdown/quotes, validate characters, truncate to 1000 chars (Scryfall limit)
5. **URL build** → `https://scryfall.com/search?q=${encodeURIComponent(query)}`
6. **Redirect** → `window.location.assign(url)` (same tab) or `window.open(url)` (new tab)

### 4.3 Component Breakdown

| Component | Responsibility |
|-----------|---------------|
| `App` | Layout, routing (single page) |
| `SearchInput` | Text area, submit, example prompts |
| `ModelLoader` | Download progress, WebGPU detection, error states |
| `QueryPreview` | Brief display of generated query before redirect; copy button |
| `llmWorker` | Web Worker running LLM inference |
| `scryfallUrl` | Build encoded Scryfall search URL from query string |
| `queryValidator` | Sanitize and validate LLM output |

---

## 5. LLM Selection

### 5.1 Candidates

| Option | Model | Size | Pros | Cons |
|--------|-------|------|------|------|
| **A — WebLLM** (recommended) | Llama-3.2-1B-Instruct | ~1.2 GB | Fastest browser inference; OpenAI-compatible API; streaming | MLC compilation required; fewer model choices |
| **B — Transformers.js** | onnx-community/Llama-3.2-1B-Instruct-q4f16 | ~1.2 GB | HuggingFace ecosystem; ONNX quantized; `device: "webgpu"` | Slower than WebLLM for chat; less mature streaming |
| **C — Transformers.js** | Llama-3.2-3B-Instruct | ~2.5 GB | Better accuracy on complex queries | Slower download + inference; may OOM on low-RAM devices |

### 5.2 Recommendation

**Primary: WebLLM with Llama-3.2-1B-Instruct** for v1.

Rationale:
- Structured text generation (query strings) is a good fit for a 1B model with a strong system prompt.
- WebLLM's chat completion API maps cleanly to our prompt → query flow.
- 1B model keeps first-load download under ~1.5 GB (cached in IndexedDB after first visit).
- Upgrade path to 3B exists if accuracy is insufficient.

### 5.3 Inference Configuration

```typescript
// WebLLM example
const engine = await CreateMLCEngine("Llama-3.2-1B-Instruct-q4f16-MLC", {
  initProgressCallback: (report) => updateProgress(report),
});

const response = await engine.chat.completions.create({
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userInput },
  ],
  temperature: 0.1,   // low — we want deterministic syntax
  max_tokens: 256,    // queries are short
});
```

### 5.4 Web Worker

LLM inference **must** run in a Web Worker to keep the UI responsive. The main thread communicates via `postMessage`:

```
Main → Worker:  { type: "generate", input: "red burn spells" }
Worker → Main:  { type: "progress", loaded: 0.45 }
Worker → Main:  { type: "result", query: "c:r (t:sorcery OR t:instant) o:damage" }
Worker → Main:  { type: "error", message: "..." }
```

---

## 6. Prompt Engineering

### 6.1 System Prompt (draft)

```
You are a Magic: The Gathering search assistant. Convert the user's
natural-language description into a single Scryfall search query.

RULES:
- Output ONLY the query string. No explanation, no markdown, no quotes.
- Use Scryfall syntax (see reference below).
- Prefer shorthand: c: over color:, t: over type:, o: over oracle:, mv over manavalue.
- Combine conditions with spaces (AND). Use OR for alternatives. Use - to negate.
- Wrap multi-word values in double quotes: o:"enters the battlefield".
- Use ~ as a placeholder for the card's name in oracle text.
- If the request is ambiguous, make reasonable assumptions.
- Maximum output length: 200 characters.

SCRYFALL SYNTAX REFERENCE:
Colors:        c:r, c:u, c:bg, c:g, c:w, c:colorless, c:multicolor
               id:g (color identity), id<=esper
Types:         t:creature, t:instant, t:sorcery, t:land, t:artifact,
               t:enchantment, t:planeswalker, t:battle
Oracle text:   o:draw, o:"enters tapped", o:~, kw:flying
Mana cost:     mv<=3, mv=5, mana:{U}{U}, m:c
Stats:         pow>=4, tou<=2, loy=3
Legality:      f:commander, f:modern, legal:edh
Rarity:        r:mythic, r:rare
Set:           s:blb, e:blb
Flags:         is:foil, is:dfc, is:reprint, is:reserved
Prices:        usd<5, usd>=10
Sorting:       order:edhrec, order:usd, dir:desc
Display:       unique:cards, unique:prints, unique:art

EXAMPLES:
Input:  blue counterspells that cost 2 or less
Output: c:u t:instant o:counter mv<=2

Input:  legendary creatures for commander in green and white
Output: t:legendary t:creature id:gw f:commander

Input:  cards that say destroy target artifact or enchantment
Output: o:"destroy target artifact" o:"destroy target enchantment"

Input:  cheap red burn spells
Output: c:r (t:instant OR t:sorcery) o:damage mv<=3
```

### 6.2 Few-Shot Strategy

Include 8–12 curated examples in the system prompt covering:
- Color + type combinations
- Oracle text phrases
- Mana value filters
- Format legality
- Negation
- OR groups
- Keyword abilities (`kw:`)
- Edge cases (color identity vs color, `~` placeholder)

### 6.3 Post-Processing

The LLM output will be cleaned before use:

1. Strip leading/trailing whitespace
2. Remove wrapping quotes or markdown code fences if present
3. Reject if output contains newlines (single query only)
4. Truncate to 1000 characters (Scryfall API limit)
5. Basic character whitelist: alphanumeric, spaces, operators (`:`, `>`, `<`, `=`, `!`, `-`, `(`, `)`, `{`, `}`, `/`, `"`, `~`, `,`)

---

## 7. Scryfall Redirect

The app does **not** call the Scryfall API. It only constructs a search URL and navigates the user to Scryfall's website, which runs the query and displays results.

### 7.1 URL Format

```
https://scryfall.com/search?q=<url-encoded-query>
```

Example:

```
Input query:  c:r t:creature o:"enters" o:damage
Redirect URL: https://scryfall.com/search?q=c%3Ar%20t%3Acreature%20o%3A%22enters%22%20o%3Adamage
```

### 7.2 URL Builder

```typescript
const SCRYFALL_SEARCH_BASE = "https://scryfall.com/search";

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
  } else {
    window.location.assign(url);
  }
}
```

Use `encodeURIComponent` so spaces, quotes, colons, and parentheses are encoded correctly.

### 7.3 Redirect Behavior

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Default** | Submit / Enter | Same-tab redirect immediately after query is validated |
| **New tab** | Ctrl+Enter or user preference | `window.open()` so the generator page stays open |
| **Preview** (optional) | Setting enabled | Show query for 1–2s with "Redirecting…" then navigate |

### 7.4 Error Cases (pre-redirect)

| Condition | UI Behavior |
|-----------|-------------|
| Empty LLM output | "Couldn't generate a query. Try rephrasing." — stay on page |
| Invalid characters after validation | Show query + "Edit and search" manual link |
| User cancels preview | Stay on page; query remains editable |

Invalid syntax on Scryfall is handled by Scryfall's own UI after redirect; we do not pre-validate against their API.

---

## 8. UI/UX Design

### 8.1 Layout

```
┌────────────────────────────────────────────────────┐
│  🔮 Scryfall Query Generator                       │
│  Describe the cards you want in plain English      │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ e.g. "red creatures that deal damage when    │  │
│  │  they enter the battlefield"                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  [ Search on Scryfall ]                            │
│                                                    │
│  Try: "blue counterspells" · "ramp in green" ·    │
│       "two-card combos in black"                   │
├────────────────────────────────────────────────────┤
│  (while generating)                                │
│  ⏳ Generating query…                              │
├────────────────────────────────────────────────────┤
│  (optional brief preview before redirect)          │
│  Generated: c:r t:creature o:"enters" o:damage     │
│  Redirecting to Scryfall…              [ Copy 📋 ] │
└────────────────────────────────────────────────────┘
         │
         ▼  automatic redirect
   scryfall.com/search?q=...
```

### 8.2 States

| State | UI |
|-------|-----|
| **First visit — model loading** | Full-screen progress bar: "Downloading AI model (1.2 GB)... 45%" |
| **Ready** | Search input enabled, example prompts visible |
| **Generating** | Spinner on search button, input disabled |
| **Redirecting** | Brief query preview + "Opening Scryfall…" (optional 1s delay) |
| **Error — no WebGPU** | Banner: "WebGPU required. Please use Chrome/Edge 113+." |
| **Error — model failed** | Retry button + fallback message; manual Scryfall link if partial query |

### 8.3 Visual Style

- Dark theme (fits MTG aesthetic, reduces eye strain)
- Minimal single-screen layout — no results grid (Scryfall owns that experience)
- Responsive: centered column, comfortable on mobile before redirect

---

## 9. Technical Stack

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | React 19 + TypeScript | Wide ecosystem, good Web Worker support |
| Build | Vite 6 | Fast dev, native worker support |
| Styling | Tailwind CSS 4 | Utility-first, dark mode built in |
| LLM | `@mlc-ai/web-llm` | Primary inference engine |
| State | React `useState` / `useReducer` | Simple enough for v1; no Redux |
| Testing | Vitest + Testing Library | Unit tests for validator, URL builder |
| Linting | ESLint + Prettier | Standard config |
| Deployment | GitHub Pages or Cloudflare Pages | Static SPA, no server |
| CI | GitHub Actions | Lint, test, build, deploy |

---

## 10. Project Structure

```
scryfall-query-gen/
├── docs/
│   ├── SPEC.md                 # This document
│   └── examples/
│       └── queries.json        # Evaluation dataset
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── SearchInput.tsx
│   │   ├── QueryPreview.tsx
│   │   ├── ModelLoader.tsx
│   │   └── ExamplePrompts.tsx
│   ├── workers/
│   │   └── llmWorker.ts        # Web Worker for LLM inference
│   ├── lib/
│   │   ├── scryfallUrl.ts      # Build search URL + redirect helper
│   │   ├── queryValidator.ts   # Post-process LLM output
│   │   └── prompts.ts          # System prompt + examples
│   ├── hooks/
│   │   └── useLLM.ts           # Worker communication hook
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

---

## 11. Performance & Constraints

| Metric | Target |
|--------|--------|
| Model download (first visit) | ~1.2 GB, 30–120s depending on connection |
| Model load (cached visit) | < 5s |
| Query generation | < 3s on mid-range GPU |
| Time to redirect (cached model) | < 5s end-to-end |
| Bundle size (excl. model) | < 300 KB gzipped (no API client or card UI) |

### 11.1 Browser Requirements

- Chrome 113+ or Edge 113+ (WebGPU)
- 4 GB+ RAM recommended
- WebGPU enabled (default in current Chromium)

### 11.2 Model Caching

WebLLM caches model weights in the browser's Cache API / IndexedDB. Subsequent visits skip the download. Cache invalidation happens when the model version changes.

---

## 12. Privacy & Security

| Concern | Mitigation |
|---------|------------|
| User queries sent to cloud LLM | All inference is local; English input never leaves the browser until redirect |
| Scryfall sees generated query | Only the syntax string appears in the redirect URL; original English is not sent |
| XSS via LLM output | Query validator whitelist; never render LLM output as HTML |
| Model supply chain | Pin exact model version; load from official MLC/HuggingFace CDN |
| No authentication needed | Public app, no user accounts in v1 |

---

## 13. Testing Strategy

### 13.1 Unit Tests

| Module | Tests |
|--------|-------|
| `queryValidator` | Strips markdown, enforces length, rejects invalid chars |
| `prompts` | System prompt contains required syntax reference |
| `scryfallUrl` | Correct `encodeURIComponent` output; empty query throws |

### 13.2 Integration Tests

| Scenario | Method |
|----------|--------|
| Prompt → valid query | Curated test set of 50 English → expected query pairs |
| Query → redirect URL | Assert built URL matches `https://scryfall.com/search?q=...` |

### 13.3 Evaluation Set

Maintain `testdata/queries.json` with ~50 natural-language inputs and expected Scryfall queries. Run periodically to measure accuracy as prompts/models change.

```json
[
  {
    "input": "blue counterspells that cost 2 or less",
    "expected": "c:u t:instant o:counter mv<=2",
    "tags": ["color", "type", "oracle", "mv"]
  },
  {
    "input": "legendary creatures for commander in green and white",
    "expected": "t:legendary t:creature id:gw f:commander",
    "tags": ["type", "identity", "legality"]
  }
]
```

### 13.4 Manual QA

- Test on Chrome with WebGPU enabled
- Verify model download + cache behavior
- Test 10 example prompts end-to-end
- Verify redirect lands on Scryfall with correct `q` parameter

---

## 14. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 1B model produces incorrect syntax | High | Medium | Strong system prompt + few-shot examples; optional preview before redirect; upgrade to 3B |
| WebGPU not available | High | Low (target audience uses Chrome) | Clear error message; document browser requirements |
| Model download too slow | Medium | Medium | Show progress; cache aggressively; consider smaller quantized variant |
| Scryfall URL format changes | Low | Very low | Single URL builder function; Scryfall search URLs are stable |
| LLM hallucinates nonexistent syntax | Medium | Medium | Post-processing validator; user lands on Scryfall which surfaces syntax errors |
| Redirect feels abrupt | Low | Medium | Optional 1s preview with generated query; Ctrl+Enter for new tab |

---

## 15. Roadmap

### Phase 0 — Specification (current)
- [x] Product spec
- [ ] Review and sign-off

### Phase 1 — Scaffold & LLM Proof of Concept
- [ ] Vite + React + TypeScript project setup
- [ ] WebLLM integration in Web Worker
- [ ] Console-only: English → query string
- [ ] Evaluate accuracy with 50-query test set

### Phase 2 — Redirect & UI
- [ ] Scryfall URL builder + redirect flow
- [ ] Search input + optional query preview
- [ ] Model loading progress UI
- [ ] Example prompts

### Phase 3 — Polish & Deploy
- [ ] Dark theme styling
- [ ] Error states and edge cases (new tab, preview delay)
- [ ] Unit tests (validator, URL builder)
- [ ] Deploy to GitHub Pages
- [ ] README with demo link

### Phase 4 — Enhancements (future)
- [ ] Multi-turn chat refinement
- [ ] Query history (localStorage)
- [ ] Syntax explanation / learning mode
- [ ] Llama 3.2 3B option for complex queries
- [ ] Server-side fallback for browsers without WebGPU
- [ ] PWA / offline model support

---

## 16. Open Questions

| # | Question | Notes |
|---|----------|-------|
| Q1 | WebLLM vs Transformers.js? | Leaning WebLLM; build POC with both if time allows |
| Q2 | Should we support `unique:` display keywords? | Probably not in v1 — let Scryfall defaults apply |
| Q3 | Custom domain or GitHub Pages? | GitHub Pages for v1 |
| Q4 | Same-tab vs new-tab redirect default? | Same-tab default; Ctrl+Enter for new tab |
| Q5 | Show query preview before redirect? | Optional 1s preview; instant redirect as default |

---

## 17. References

- [Scryfall Search Syntax](https://scryfall.com/docs/syntax)
- [Scryfall API Documentation](https://scryfall.com/docs/api)
- [WebLLM — MLC.ai](https://webllm.mlc.ai/)
- [Transformers.js WebGPU Guide](https://huggingface.co/docs/transformers.js/guides/webgpu)
- [Llama 3.2 on HuggingFace](https://huggingface.co/blog/llama32)
- [EDHREC Scryfall Syntax Guide](https://edhrec.com/guides/guide-to-scryfall-syntax)
