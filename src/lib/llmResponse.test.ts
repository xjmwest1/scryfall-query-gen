import { describe, expect, it } from "vitest";
import { parseLlmResponse } from "./llmResponse";

describe("parseLlmResponse", () => {
  it("parses structured intent JSON", () => {
    const parsed = parseLlmResponse(
      '{"colors":["green"],"types":["creature"],"set":"Reality Fracture"}',
    );

    expect(parsed.mode).toBe("structured");
    if (parsed.mode === "structured") {
      expect(parsed.intent.colors).toEqual(["g"]);
      expect(parsed.intent.types).toEqual(["creature"]);
      expect(parsed.intent.set).toBe("Reality Fracture");
    }
  });

  it("parses legacy query JSON for backward compatibility", () => {
    const parsed = parseLlmResponse('{"query":"c:u t:instant","set":null}');
    expect(parsed).toEqual({ mode: "legacy", query: "c:u t:instant", set: null });
  });

  it("parses JSON wrapped in markdown fences", () => {
    const parsed = parseLlmResponse(
      '```json\n{"rarity":"mythic","set":"Bloomburrow"}\n```',
    );

    expect(parsed.mode).toBe("structured");
    if (parsed.mode === "structured") {
      expect(parsed.intent.rarity).toBe("mythic");
      expect(parsed.intent.set).toBe("Bloomburrow");
    }
  });

  it("falls back to plain-text legacy output", () => {
    expect(parseLlmResponse("c:u t:instant o:counter mv<=2")).toEqual({
      mode: "legacy",
      query: "c:u t:instant o:counter mv<=2",
      set: null,
    });
  });
});
