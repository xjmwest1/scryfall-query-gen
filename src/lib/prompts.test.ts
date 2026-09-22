import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT } from "./prompts";

describe("SYSTEM_PROMPT", () => {
  it("requests structured JSON extraction instead of Scryfall syntax", () => {
    expect(SYSTEM_PROMPT).toContain('"colors"');
    expect(SYSTEM_PROMPT).toContain("Do NOT output Scryfall syntax");
    expect(SYSTEM_PROMPT).not.toContain("SCRYFALL SYNTAX REFERENCE");
  });

  it("includes schema fields for common filters", () => {
    expect(SYSTEM_PROMPT).toContain('"typesAny"');
    expect(SYSTEM_PROMPT).toContain('"notOracle"');
    expect(SYSTEM_PROMPT).toContain('"colorIdentity"');
  });

  it("includes few-shot structured examples", () => {
    expect(SYSTEM_PROMPT).toContain('"set":"Reality Fracture"');
    expect(SYSTEM_PROMPT).toContain('"keywords":["flying"]');
    expect(SYSTEM_PROMPT).toContain('"flags":["reserved"]');
  });
});
