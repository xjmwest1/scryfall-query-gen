# Scryfall Query Generator

Turn plain-English Magic: The Gathering card descriptions into [Scryfall](https://scryfall.com) search queries — entirely in your browser.

> "Show me blue instant spells that counter something and cost 2 or less" → `c:u t:instant o:counter mv<=2`

**Repository:** https://github.com/xjmwest1/scryfall-query-gen

## How it works

1. Describe the cards you want in plain English.
2. A small on-device LLM (SmolLM2 360M via [WebLLM](https://webllm.mlc.ai/)) extracts **structured filters** (colors, types, oracle text, format, set name, etc.).
3. App utilities build valid Scryfall syntax, resolve set names via the Scryfall API, and redirect you to the search.

All LLM inference runs locally in your browser. Set name lookup uses Scryfall's `/sets` API (cached).

## Requirements

- Chrome or Edge 113+ with WebGPU enabled
- ~200 MB download on first visit (model is cached afterward)

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy (free)

This app is static files only — no server required. GitHub Pages hosts it for free.

1. In the repo on GitHub: **Settings → Pages → Build and deployment → Source** → **GitHub Actions**.
2. Merge to `main` (or push to `main`). The [deploy workflow](.github/workflows/deploy.yml) builds and publishes automatically.
3. Live site: **https://xjmwest1.github.io/scryfall-query-gen/**

Local preview with the same base path as production:

```bash
npm run build -- --base /scryfall-query-gen/ && npm run preview
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests |
| `npm run preview` | Preview production build |
| `npm run eval` | Accuracy check (requires Chrome + WebGPU; run preview first) |

## Spec

See [docs/SPEC.md](docs/SPEC.md) for the full product and technical specification.

## License

MIT
