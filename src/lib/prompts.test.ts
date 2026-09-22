import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT } from "./prompts";
import { SCRYFALL_SYNTAX_REFERENCE } from "./scryfallSyntax";

describe("SYSTEM_PROMPT", () => {
  it("includes core syntax sections", () => {
    expect(SYSTEM_PROMPT).toContain("Color identity (id:");
    expect(SYSTEM_PROMPT).toContain("Negate with - prefix");
    expect(SYSTEM_PROMPT).toContain("is:shockland");
    expect(SYSTEM_PROMPT).toContain("function:ramp");
  });

  it("includes few-shot examples for negation and formats", () => {
    expect(SYSTEM_PROMPT).toContain("kw:flying -t:creature");
    expect(SYSTEM_PROMPT).toContain("f:modern");
    expect(SYSTEM_PROMPT).toContain("is:reserved usd<50");
  });
});

describe("SCRYFALL_SYNTAX_REFERENCE", () => {
  it("documents OR and parentheses", () => {
    expect(SCRYFALL_SYNTAX_REFERENCE).toContain("OR");
    expect(SCRYFALL_SYNTAX_REFERENCE).toContain("parentheses");
  });
});
