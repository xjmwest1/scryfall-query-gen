import { describe, expect, it } from "vitest";
import { parseLlmResponse } from "./llmResponse";

describe("parseLlmResponse", () => {
  it("parses JSON with query and set", () => {
    expect(
      parseLlmResponse('{"query":"c:g t:creature","set":"Reality Fracture"}'),
    ).toEqual({
      query: "c:g t:creature",
      set: "Reality Fracture",
    });
  });

  it("parses JSON with null set", () => {
    expect(parseLlmResponse('{"query":"c:u t:instant","set":null}')).toEqual({
      query: "c:u t:instant",
      set: null,
    });
  });

  it("parses JSON wrapped in markdown fences", () => {
    expect(
      parseLlmResponse('```json\n{"query":"r:mythic","set":"Bloomburrow"}\n```'),
    ).toEqual({
      query: "r:mythic",
      set: "Bloomburrow",
    });
  });

  it("falls back to plain-text query for legacy output", () => {
    expect(parseLlmResponse("c:u t:instant o:counter mv<=2")).toEqual({
      query: "c:u t:instant o:counter mv<=2",
      set: null,
    });
  });
});
