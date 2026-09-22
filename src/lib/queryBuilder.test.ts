import { describe, expect, it } from "vitest";
import { buildScryfallQuery } from "./queryBuilder";
import type { SearchIntent } from "./searchIntent";

const baseIntent: SearchIntent = {
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
  artTreatment: null,
  price: null,
  set: null,
};

describe("buildScryfallQuery", () => {
  it("builds color, type, oracle, and mana value clauses", () => {
    const query = buildScryfallQuery({
      ...baseIntent,
      colors: ["blue"],
      types: ["instant"],
      oracle: ["counter"],
      manaValue: { op: "<=", value: 2 },
    });
    expect(query).toBe('c:u t:instant o:counter mv<=2');
  });

  it("builds commander identity and format", () => {
    const query = buildScryfallQuery({
      ...baseIntent,
      colorIdentity: ["green", "white"],
      types: ["legendary", "creature"],
      format: "commander",
    });
    expect(query).toBe("id:gw t:legendary t:creature f:commander");
  });

  it("builds OR type groups", () => {
    const query = buildScryfallQuery({
      ...baseIntent,
      colors: ["red"],
      typesAny: ["instant", "sorcery"],
      oracle: ["damage"],
      manaValue: { op: "<=", value: 3 },
    });
    expect(query).toBe("c:r (t:instant OR t:sorcery) o:damage mv<=3");
  });

  it("builds negation clauses", () => {
    const query = buildScryfallQuery({
      ...baseIntent,
      keywords: ["flying"],
      notTypes: ["creature"],
    });
    expect(query).toBe("kw:flying -t:creature");
  });

  it("quotes multi-word oracle phrases", () => {
    const query = buildScryfallQuery({
      ...baseIntent,
      oracle: ["enters the battlefield tapped"],
    });
    expect(query).toBe('o:"enters the battlefield tapped"');
  });

  it("builds price and flag clauses", () => {
    const query = buildScryfallQuery({
      ...baseIntent,
      flags: ["reserved"],
      price: { currency: "usd", op: "<", value: 50 },
    });
    expect(query).toBe("is:reserved usd<50");
  });

  it("builds alternate art treatment instead of is:full", () => {
    const query = buildScryfallQuery({
      ...baseIntent,
      artTreatment: "alternate",
    });
    expect(query).toBe("not:default");
  });
});
