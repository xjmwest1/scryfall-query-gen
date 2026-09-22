# Scryfall Query Generator

Turn plain-English Magic: The Gathering card descriptions into [Scryfall](https://scryfall.com) search queries — entirely in your browser.

> "Show me blue instant spells that counter something and cost 2 or less" → `c:u t:instant o:counter mv<=2`

**Repository:** https://github.com/xjmwest1/scryfall-query-gen

## How it works

1. Describe the cards you want in plain English.
2. A small on-device LLM (Llama 3.2 1B via [WebLLM](https://webllm.mlc.ai/)) generates a Scryfall query.
3. You're redirected to Scryfall with that query applied.

All inference runs locally in your browser. No server, no API keys.

## Requirements

- Chrome or Edge 113+ with WebGPU enabled
- ~1.2 GB download on first visit (model is cached afterward)

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests |
| `npm run preview` | Preview production build |

## Spec

See [docs/SPEC.md](docs/SPEC.md) for the full product and technical specification.

## License

MIT
