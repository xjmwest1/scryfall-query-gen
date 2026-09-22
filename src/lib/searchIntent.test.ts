import { describe, expect, it } from "vitest";
import {
  colorsToQuery,
  hasSearchFilters,
  normalizeColorToken,
  normalizeSearchIntent,
} from "./searchIntent";

describe("normalizeColorToken", () => {
  it("maps color names to letters", () => {
    expect(normalizeColorToken("blue")).toBe("u");
    expect(normalizeColorToken("Green")).toBe("g");
  });

  it("maps guild nicknames", () => {
    expect(normalizeColorToken("esper")).toBe("wub");
  });
});

describe("colorsToQuery", () => {
  it("joins multiple colors", () => {
    expect(colorsToQuery(["g", "w"])).toBe("c:gw");
  });
});

describe("normalizeSearchIntent", () => {
  it("normalizes structured LLM output", () => {
    const intent = normalizeSearchIntent({
      colors: ["Blue"],
      types: ["Instant"],
      oracle: ["counter"],
      manaValue: { op: "<=", value: 2 },
      set: null,
    });

    expect(intent.colors).toEqual(["u"]);
    expect(intent.types).toEqual(["instant"]);
    expect(intent.oracle).toEqual(["counter"]);
    expect(intent.manaValue).toEqual({ op: "<=", value: 2 });
  });

  it("normalizes art treatment aliases", () => {
    const intent = normalizeSearchIntent({
      artTreatment: "full art",
      set: "Reality Fracture",
    });

    expect(intent.artTreatment).toBe("alternate");
    expect(intent.set).toBe("Reality Fracture");
  });
});

describe("hasSearchFilters", () => {
  it("ignores set-only intents", () => {
    expect(hasSearchFilters({ ...normalizeSearchIntent({ set: "Bloomburrow" }) })).toBe(
      false,
    );
  });

  it("detects art treatment filters", () => {
    expect(
      hasSearchFilters({
        ...normalizeSearchIntent({
          artTreatment: "alternate",
          set: "Reality Fracture",
        }),
      }),
    ).toBe(true);
  });
});
