import { describe, expect, it, beforeEach } from "vitest";
import { buildFinalQuery, stripSetClauses } from "./buildQuery";
import { setSetCatalog } from "./setResolver";

describe("stripSetClauses", () => {
  it("removes set-related clauses", () => {
    expect(stripSetClauses("r:mythic s:blb f:commander")).toBe("r:mythic f:commander");
  });
});

describe("buildFinalQuery", () => {
  beforeEach(() => {
    setSetCatalog([
      { code: "blb", name: "Bloomburrow" },
      { code: "fra", name: "Reality Fracture" },
    ]);
  });

  it("builds query from structured intent and resolves set", async () => {
    const query = await buildFinalQuery(
      '{"colors":["green"],"types":["creature"],"set":"Reality Fracture"}',
    );
    expect(query).toBe("c:g t:creature s:fra");
  });

  it("builds query from structured intent without a set", async () => {
    const query = await buildFinalQuery(
      '{"colors":["blue"],"types":["instant"],"oracle":["counter"],"manaValue":{"op":"<=","value":2},"set":null}',
    );
    expect(query).toBe('c:u t:instant o:counter mv<=2');
  });

  it("supports set-only structured output", async () => {
    const query = await buildFinalQuery('{"set":"Bloomburrow"}');
    expect(query).toBe("s:blb");
  });

  it("supports legacy plain-text output", async () => {
    const query = await buildFinalQuery("c:u t:instant o:counter mv<=2");
    expect(query).toBe("c:u t:instant o:counter mv<=2");
  });

  it("throws when set cannot be resolved", async () => {
    await expect(
      buildFinalQuery('{"colors":["green"],"set":"Not A Real Set"}'),
    ).rejects.toThrow('Could not find a Scryfall set matching "Not A Real Set".');
  });
});
