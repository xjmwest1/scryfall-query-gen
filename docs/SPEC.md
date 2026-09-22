# Scryfall Query Generator — Product & Technical Specification

**Version:** 0.1  
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
3. Executes that query against the Scryfall API and renders matching cards.
4. Lets the user refine, copy, or open the query on Scryfall directly.

All LLM inference happens on-device. No backend server, no OpenAI API key, no user data sent to third parties.

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
| G3 | Display search results inline with card images and key stats |
| G4 | Show the generated query so users can learn Scryfall syntax |
| G5 | Work on modern Chromium browsers with WebGPU |
| G6 | First meaningful result within ~30s of initial page load (including model download) |

### 2.2 Non-Goals (v1)

| # | Non-Goal | Rationale |
|---|----------|-----------|
| NG1 | Deck building / collection management | Out of scope; Scryfall/Archidekt/etc. already do this |
| NG2 | Server-side LLM fallback | Contradicts privacy model; defer to v2 if needed |
| NG3 | Mobile-first / Safari support | WebGPU support is limited on Safari/iOS in 2025 |
| NG4 | Multi-turn conversational refinement | v1 is single-shot; chat mode is a future enhancement |
| NG5 | Training a custom model | Use off-the-shelf Llama 3.2 with prompt engineering |
| NG6 | Offline Scryfall card database | Use live API; full local DB is ~500MB+ |

---

## 3. User Stories

### 3.1 Core

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-1 | As a player, I type "green creatures that ramp mana" and get results | Query contains `c:g t:creature` and a ramp-related `o:` clause; cards render |
| US-2 | As a player, I see the generated Scryfall query | Query displayed in a copyable code block |
| US-3 | As a player, I click "Open in Scryfall" to continue on scryfall.com | Link opens `https://scryfall.com/search?q=<encoded query>` |
| US-4 | As a player, I see a loading indicator while the model downloads | Progress bar shows model download % on first visit |
| US-5 | As a player, I can edit the generated query before searching | Editable query field; manual search button |

### 3.2 Secondary

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-6 | As a player, I see example prompts to try | 3–5 clickable example queries on empty state |
| US-7 | As a player, I can copy the query to clipboard | One-click copy with toast confirmation |
| US-8 | As a player, I see query explanation hints | Optional tooltip breaking down each clause |

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
│                 │  API Client │                           │
│                 └──────┬──────┘                           │
└────────────────────────┼────────────────────────────────┘
                         │ HTTPS
                         ▼
              ┌─────────────────────┐
              │  api.scryfall.com   │
              └─────────────────────┘
```

### 4.2 Data Flow

1. **User input** → natural-language string
2. **Prompt assembly** → system prompt + Scryfall syntax cheat sheet + user input
3. **LLM inference** (Web Worker) → raw query string
4. **Post-processing** → strip markdown/quotes, validate characters, truncate to 1000 chars (Scryfall limit)
5. **Scryfall API** → `GET /cards/search?q=<query>`
6. **Render** → card grid with image, name, mana cost, type line

### 4.3 Component Breakdown

| Component | Responsibility |
|-----------|---------------|
| `App` | Layout, routing (single page) |
| `SearchInput` | Text area, submit, example prompts |
| `ModelLoader` | Download progress, WebGPU detection, error states |
| `QueryDisplay` | Generated query, edit, copy, Scryfall link |
| `CardGrid` | Paginated card results |
| `CardTile` | Single card image + metadata |
| `llmWorker` | Web Worker running LLM inference |
| `scryfallClient` | API wrapper with rate limiting |
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

## 7. Scryfall API Integration

### 7.1 Endpoints

| Endpoint | Use |
|----------|-----|
| `GET /cards/search?q={query}` | Primary search |
| `GET /cards/named?fuzzy={name}` | Fallback for exact-name lookups (future) |

### 7.2 Request Requirements

Per [Scryfall API docs](https://scryfall.com/docs/api):

- `User-Agent`: `ScryfallQueryGen/1.0 (+https://github.com/<org>/<repo>)`
- `Accept`: `application/json`
- Rate limit: **10 requests/second** — implement client-side throttle with 100ms minimum between requests

### 7.3 Response Handling

```typescript
interface ScryfallSearchResponse {
  object: "list";
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: ScryfallCard[];
}

interface ScryfallCard {
  id: string;
  name: string;
  mana_cost: string;
  type_line: string;
  oracle_text: string;
  image_uris?: { normal: string; small: string };
  card_faces?: Array<{ image_uris: { normal: string } }>;
  scryfall_uri: string;
}
```

### 7.4 Error Cases

| Scryfall Response | UI Behavior |
|-------------------|-------------|
| 200, `total_cards: 0` | "No cards found. Try editing the query." |
| 404 | "Invalid query syntax" — show query for editing |
| 400 | "Bad request" — likely malformed query |
| 429 / network error | "Scryfall is busy. Retrying..." with backoff |
| `has_more: true` | "Load more" button for pagination |

### 7.5 CORS

Scryfall's API supports CORS for browser requests. No proxy needed.

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
│  [ Search ]                                        │
│                                                    │
│  Try: "blue counterspells" · "ramp in green" ·    │
│       "two-card combos in black"                   │
├────────────────────────────────────────────────────┤
│  Generated Query                                   │
│  ┌──────────────────────────────────────────────┐  │
│  │ c:r t:creature o:"enters" o:damage      [📋] │  │
│  └──────────────────────────────────────────────┘  │
│  [ Open in Scryfall ↗ ]                            │
├────────────────────────────────────────────────────┤
│  Results (42 cards)                                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │ card │ │ card │ │ card │ │ card │              │
│  │ img  │ │ img  │ │ img  │ │ img  │              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
│  ...                                               │
│  [ Load more ]                                     │
└────────────────────────────────────────────────────┘
```

### 8.2 States

| State | UI |
|-------|-----|
| **First visit — model loading** | Full-screen progress bar: "Downloading AI model (1.2 GB)... 45%" |
| **Ready** | Search input enabled, example prompts visible |
| **Generating** | Spinner on search button, input disabled |
| **Results** | Query display + card grid |
| **No results** | Empty state with suggestion to edit query |
| **Error — no WebGPU** | Banner: "WebGPU required. Please use Chrome/Edge 113+." |
| **Error — model failed** | Retry button + fallback message |

### 8.3 Visual Style

- Dark theme (fits MTG aesthetic, reduces eye strain)
- Scryfall-inspired card frames for results
- Mana symbols rendered via [mana-font](https://github.com/andrewgioia/mana) or Scryfall's SVG mana symbols
- Responsive grid: 4 columns desktop, 2 tablet, 1 mobile

---

## 9. Technical Stack

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | React 19 + TypeScript | Wide ecosystem, good Web Worker support |
| Build | Vite 6 | Fast dev, native worker support |
| Styling | Tailwind CSS 4 | Utility-first, dark mode built in |
| LLM | `@mlc-ai/web-llm` | Primary inference engine |
| HTTP | Native `fetch` | No axios needed |
| State | React `useState` / `useReducer` | Simple enough for v1; no Redux |
| Testing | Vitest + Testing Library | Unit tests for validator, API client |
| Linting | ESLint + Prettier | Standard config |
| Deployment | GitHub Pages or Cloudflare Pages | Static SPA, no server |
| CI | GitHub Actions | Lint, test, build, deploy |

---

## 10. Project Structure

```
scryfall-query-gen/
├── docs/
│   └── SPEC.md                 # This document
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── SearchInput.tsx
│   │   ├── QueryDisplay.tsx
│   │   ├── CardGrid.tsx
│   │   ├── CardTile.tsx
│   │   ├── ModelLoader.tsx
│   │   └── ExamplePrompts.tsx
│   ├── workers/
│   │   └── llmWorker.ts        # Web Worker for LLM inference
│   ├── lib/
│   │   ├── scryfall.ts         # API client
│   │   ├── queryValidator.ts   # Post-process LLM output
│   │   └── prompts.ts          # System prompt + examples
│   ├── hooks/
│   │   ├── useLLM.ts           # Worker communication hook
│   │   └── useScryfallSearch.ts
│   ├── types/
│   │   └── scryfall.ts         # API response types
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
| Scryfall API response | < 500ms (network dependent) |
| Total time to results (cached) | < 5s |
| Bundle size (excl. model) | < 500 KB gzipped |

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
| User queries sent to cloud LLM | All inference is local; no query data leaves the browser |
| Scryfall API sees queries | Inherent to search; only the generated syntax string is sent, not the original English |
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
| `scryfallClient` | URL encoding, rate limiting, error mapping |

### 13.2 Integration Tests

| Scenario | Method |
|----------|--------|
| Prompt → valid query | Curated test set of 50 English → expected query pairs |
| Query → Scryfall results | Live API calls in CI (or mocked) |

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
- Verify Scryfall link opens correct search

---

## 14. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 1B model produces incorrect syntax | High | Medium | Strong system prompt + few-shot examples; editable query field; upgrade to 3B |
| WebGPU not available | High | Low (target audience uses Chrome) | Clear error message; document browser requirements |
| Model download too slow | Medium | Medium | Show progress; cache aggressively; consider smaller quantized variant |
| Scryfall API changes | Low | Low | Thin client wrapper; pin to documented API version |
| Scryfall rate limits | Low | Low | Client-side throttle; debounce search |
| LLM hallucinates nonexistent syntax | Medium | Medium | Post-processing validator; test against known-good operators |

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

### Phase 2 — Scryfall Integration & UI
- [ ] Scryfall API client
- [ ] Search input + query display + card grid
- [ ] Model loading progress UI
- [ ] Example prompts

### Phase 3 — Polish & Deploy
- [ ] Dark theme styling
- [ ] Error states and edge cases
- [ ] Unit tests
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
| Q4 | Include mana symbol rendering in results? | Nice-to-have; plain text mana cost is fine for v1 |
| Q5 | How to handle double-faced card images? | Use `card_faces[0].image_uris` fallback |

---

## 17. References

- [Scryfall Search Syntax](https://scryfall.com/docs/syntax)
- [Scryfall API Documentation](https://scryfall.com/docs/api)
- [WebLLM — MLC.ai](https://webllm.mlc.ai/)
- [Transformers.js WebGPU Guide](https://huggingface.co/docs/transformers.js/guides/webgpu)
- [Llama 3.2 on HuggingFace](https://huggingface.co/blog/llama32)
- [EDHREC Scryfall Syntax Guide](https://edhrec.com/guides/guide-to-scryfall-syntax)
