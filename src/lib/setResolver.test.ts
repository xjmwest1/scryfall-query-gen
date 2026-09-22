import { describe, expect, it, beforeEach } from "vitest";
import { findSetCode, setSetCatalog } from "./setResolver";

const MOCK_SETS = [
  { code: "blb", name: "Bloomburrow" },
  { code: "fra", name: "Reality Fracture" },
  { code: "mkm", name: "Murders at Karlov Manor" },
  { code: "dsk", name: "Duskmourn: House of Horror" },
];

describe("findSetCode", () => {
  beforeEach(() => {
    setSetCatalog(MOCK_SETS);
  });

  it("matches exact set names", () => {
    expect(findSetCode("Reality Fracture", MOCK_SETS)).toBe("fra");
    expect(findSetCode("Bloomburrow", MOCK_SETS)).toBe("blb");
  });

  it("matches case-insensitively", () => {
    expect(findSetCode("reality fracture", MOCK_SETS)).toBe("fra");
  });

  it("matches set codes directly", () => {
    expect(findSetCode("fra", MOCK_SETS)).toBe("fra");
    expect(findSetCode("FRA", MOCK_SETS)).toBe("fra");
  });

  it("fuzzy-matches close names", () => {
    expect(findSetCode("fractured reality", MOCK_SETS)).toBe("fra");
  });

  it("returns null for unknown sets", () => {
    expect(findSetCode("Totally Fake Set", MOCK_SETS)).toBeNull();
  });
});
