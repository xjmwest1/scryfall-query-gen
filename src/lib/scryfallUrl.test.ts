import { describe, expect, it } from "vitest";
import { buildScryfallSearchUrl } from "./scryfallUrl";

describe("buildScryfallSearchUrl", () => {
  it("builds a correctly encoded Scryfall search URL", () => {
    const url = buildScryfallSearchUrl('c:u t:instant o:"counter" mv<=2');
    expect(url).toBe(
      "https://scryfall.com/search?q=c%3Au%20t%3Ainstant%20o%3A%22counter%22%20mv%3C%3D2",
    );
  });

  it("throws for empty queries", () => {
    expect(() => buildScryfallSearchUrl("  ")).toThrow("Query cannot be empty");
  });
});
