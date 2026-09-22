import { describe, expect, it } from "vitest";
import { cleanQuery, validateQuery } from "./queryValidator";

describe("cleanQuery", () => {
  it("strips markdown fences", () => {
    expect(cleanQuery("```\nc:u t:instant\n```")).toBe("c:u t:instant");
  });

  it("strips wrapping quotes", () => {
    expect(cleanQuery('"c:r t:creature"')).toBe("c:r t:creature");
  });

  it("takes only the first line", () => {
    expect(cleanQuery("c:g t:creature\nextra line")).toBe("c:g t:creature");
  });
});

describe("validateQuery", () => {
  it("accepts valid Scryfall syntax", () => {
    const result = validateQuery('c:u t:instant o:"counter target" mv<=2');
    expect(result).toEqual({
      ok: true,
      query: 'c:u t:instant o:"counter target" mv<=2',
    });
  });

  it("rejects empty output", () => {
    expect(validateQuery("   ")).toEqual({
      ok: false,
      error: "Query cannot be empty.",
    });
  });

  it("rejects invalid characters", () => {
    expect(validateQuery("c:u @bad")).toEqual({
      ok: false,
      error: "Query contains invalid characters.",
    });
  });
});
