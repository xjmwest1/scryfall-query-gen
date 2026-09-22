/**
 * Condensed Scryfall search syntax reference for the LLM system prompt.
 * Derived from https://scryfall.com/docs/syntax
 */
export const SCRYFALL_SYNTAX_REFERENCE = `
## Query structure
- Terms separated by spaces are ANDed together.
- Use OR (or or) between alternatives: t:instant OR t:sorcery
- Group with parentheses: c:r (t:instant OR t:sorcery) o:damage
- Negate with - prefix: kw:flying -t:creature
- not: is shorthand for -is: (e.g. not:reprint)
- Quote phrases with spaces: o:"enters the battlefield"
- Exact card name: !"Lightning Bolt" or !fire
- Comparisons: >, <, >=, <=, =, != work on numeric fields

## Colors (c: / color:)
- Single: c:w, c:u, c:b, c:r, c:g
- Multicolor: c:wu, c:bg, c:guild (e.g. c:azorius), c:shard (e.g. c:bant), c:wedge (e.g. c:abzan)
- Special: c:colorless, c:multicolor, c:m
- Comparisons: c>=uw, c=2, color>=esper -c:r
- Color indicator: has:indicator

## Color identity (id: / identity:)
- Commander legality uses identity, not card color: id:gw, id<=esper, id:c
- id: differs from c: — a red card can have id:c

## Types (t: / type:)
- Supertype, type, subtype: t:legendary, t:creature, t:instant, t:sorcery, t:artifact,
  t:enchantment, t:land, t:planeswalker, t:battle, t:tribal
- Partial words allowed: t:merfolk, t:goblin
- Combine: t:legendary t:creature

## Card text
- Oracle text: o: or oracle: — o:draw, o:"~ enters tapped", o:~ (card name placeholder)
- Full oracle (incl. reminder): fo: or fulloracle:
- Keyword abilities: kw: or keyword: — kw:flying, kw:trample, kw:hexproof
- Loose name words without prefix also match names

## Mana costs
- Symbols in cost: m: or mana: — m:2WW, mana:{G}{U}, m:{R/P} (phyrexian)
- Shorthand ok for simple symbols: m:GG same as mana:{G}{G}
- Mana value: mv or manavalue — mv<=3, mv=5, mv:even, mv:odd
- Devotion: devotion:{u/b}{u/b}
- Mana produced: produces:wu, produces=wu
- Flags: is:hybrid, is:phyrexian

## Power / toughness / loyalty
- pow or power, tou or toughness, pt or powtou, loy or loyalty
- Comparisons: pow>=5, pow<=2, pow>tou, loy=3

## Formats (f: / format: / legal:)
- standard, pioneer, modern, legacy, vintage, pauper, commander, edh, brawl,
  historic, timeless, gladiator, duel, premodern, penny, oathbreaker, alchemy
- Banned: banned:legacy. Restricted: restricted:vintage
- Role flags: is:commander, is:brawler, is:companion, is:partner, is:reserved, is:gamechanger
- EDHREC rank: edhrec<=100 (lower number = more popular)

## Rarity (r: / rarity:)
- common, uncommon, rare, mythic, special, bonus
- Comparisons: r>=r, r:mythic
- new:rarity — first printing at this rarity
- in:rare — ever printed at rare

## Sets and blocks
- Set code: s:, e:, set:, edition: — s:blb, e:mkm
- Set names mentioned by the user go in the JSON "set" field (resolved to codes by the app)
- Block: b:wwk
- Group (parent/sibling/child sets): g:fin
- Collector number: cn:1, cn>50
- in:lea — cards that passed through a set
- Set type: st:core, st:commander, st:masters, st:promo
- Booster/promo: is:booster, is:prerelease, is:promo, is:fnm

## Prices
- usd, eur, tix with comparisons: usd<5, usd>=10, eur<1
- Cheapest print: cheapest:usd

## Flags and card categories (is:)
- Physical: is:foil, is:nonfoil, is:etched, is:reprint, is:reserved, is:funny
- Card structure: is:dfc, is:mdfc, is:split, is:transform, is:meldpart, is:leveler
- Creature categories: is:vanilla, is:frenchvanilla, is:bear, is:party, is:outlaw
- Spell/permanent: is:spell, is:permanent, is:historic, is:modal
- Digital: is:digital, is:alchemy, is:rebalanced
- Land nicknames: is:shockland, is:fetchland, is:dual, is:painland, is:checkland,
  is:bounceland, is:triome, is:pathway, is:scryland, is:filterland
- Other: is:masterpiece, is:full, is:universesbeyond, is:scryfallpreview

## Reprints and print counts
- is:reprint, not:reprint, is:unique
- prints=1, sets>=20, papersets=1

## Artist, flavor, watermark
- a: or artist: — a:"avon"
- ft: or flavor: — ft:mishra
- wm: or watermark: — wm:orzhov
- new:art, new:artist, new:flavor

## Languages (lang: / language:)
- lang:en, lang:jp, lang:ko, lang:any
- new:language, in:ru

## Year and dates
- year<=1994, year=2026
- date>=2015-08-18, date>ori

## Cubes
- cube:vintage, cube:modern

## Tagger tags (from Scryfall Tagger)
- art: or atag: — art:squirrel
- function: or otag: — function:removal, function:ramp

## Regular expressions
- Use /pattern/ with o:, t:, ft:, name: — o:/^{T}:/, name:/\\bizzet\\b/
- Escape slashes inside: \\/

## Display and sort (usually omit unless user asks)
- unique:cards, unique:prints, unique:art
- order:edhrec, order:usd, order:rarity, order:released
- direction:asc, direction:desc
- prefer:newest, prefer:oldest
`.trim();
