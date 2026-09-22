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

  it("merges resolved set code into query", async () => {
    const query = await buildFinalQuery(
      '{"query":"c:g t:creature","set":"Reality Fracture"}',
    );
    expect(query).toBe("c:g t:creature s:fra");
  });

  it("passes through queries without a set", async () => {
    const query = await buildFinalQuery('{"query":"c:u t:instant","set":null}');
    expect(query).toBe("c:u t:instant");
  });

  it("supports legacy plain-text output", async () => {
    const query = await buildFinalQuery("c:u t:instant o:counter mv<=2");
    expect(query).toBe("c:u t:instant o:counter mv<=2");
  });

  it("throws when set cannot be resolved", async () => {
    await expect(
      buildFinalQuery('{"query":"c:g t:creature","set":"Not A Real Set"}'),
    ).rejects.toThrow('Could not find a Scryfall set matching "Not A Real Set".');
  });
});
