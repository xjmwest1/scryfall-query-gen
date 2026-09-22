import { describe, expect, it } from "vitest";
import {
  ALTERNATE_ART_QUERY,
  artTreatmentToQuery,
  normalizeArtTreatment,
} from "./artTreatments";

describe("normalizeArtTreatment", () => {
  it("maps colloquial full art to alternate", () => {
    expect(normalizeArtTreatment("full art")).toBe("alternate");
    expect(normalizeArtTreatment("Full Art")).toBe("alternate");
    expect(normalizeArtTreatment("alt art")).toBe("alternate");
  });

  it("maps specific treatments", () => {
    expect(normalizeArtTreatment("borderless")).toBe("borderless");
    expect(normalizeArtTreatment("showcase")).toBe("showcase");
  });

  it("returns null for unknown values", () => {
    expect(normalizeArtTreatment("unknown")).toBeNull();
    expect(normalizeArtTreatment(null)).toBeNull();
  });
});

describe("artTreatmentToQuery", () => {
  it("maps alternate to a broad special-art query", () => {
    expect(artTreatmentToQuery("alternate")).toBe(ALTERNATE_ART_QUERY);
  });

  it("maps specific treatments to Scryfall clauses", () => {
    expect(artTreatmentToQuery("borderless")).toBe("border:borderless");
    expect(artTreatmentToQuery("showcase")).toBe("frame:showcase");
    expect(artTreatmentToQuery("extended")).toBe("(is:full OR frame:extendedart)");
    expect(artTreatmentToQuery("inverted")).toBe("frame:inverted");
    expect(artTreatmentToQuery("default")).toBe("is:default");
  });
});
