# Scryfall Query Generator

Turn plain-English Magic: The Gathering card descriptions into [Scryfall](https://scryfall.com) search queries — entirely in your browser.

> "Show me blue instant spells that counter something and cost 2 or less" → `c:u t:instant o:counter mv<=2`

## Status

**Phase 0 — Specification.** See [docs/SPEC.md](docs/SPEC.md) for the full product and technical spec.

## Concept

Users type a natural-language description of the cards they want. A small on-device LLM (Llama 3.2 or similar) translates that description into valid Scryfall syntax, then **redirects you to Scryfall** with that query applied — no server, no API keys, no Scryfall API calls from our app.

## Planned Stack

| Layer | Technology |
|-------|------------|
| UI | React + TypeScript + Vite |
| LLM (in-browser) | WebLLM or Transformers.js (Llama 3.2 1B/3B) |
| Search results | Redirect to [scryfall.com/search](https://scryfall.com/search) |
| Styling | Tailwind CSS |

## Getting Started

_Not yet implemented — see spec for roadmap._

## License

MIT
