import { artTreatmentToQuery } from "./artTreatments";
import type { NumericFilter, PriceFilter, SearchIntent } from "./searchIntent";
import { colorsToQuery, normalizeColorList } from "./searchIntent";

function quoteOraclePhrase(phrase: string): string {
  const trimmed = phrase.trim();
  if (!trimmed) return "";
  if (trimmed.includes(" ") || trimmed.includes(":") || trimmed.includes('"')) {
    return `o:"${trimmed.replace(/"/g, '\\"')}"`;
  }
  return `o:${trimmed}`;
}

function formatNumericClause(field: string, filter: NumericFilter): string {
  return `${field}${filter.op}${filter.value}`;
}

function formatPriceClause(filter: PriceFilter): string {
  return `${filter.currency}${filter.op}${filter.value}`;
}

function formatTypeList(types: string[]): string[] {
  return types.map((type) => `t:${type}`);
}

function formatOrGroup(clauses: string[]): string {
  if (clauses.length === 1) return clauses[0];
  return `(${clauses.join(" OR ")})`;
}

export function buildScryfallQuery(intent: SearchIntent): string {
  const clauses: string[] = [];

  const colors = normalizeColorList(intent.colors);
  if (colors?.length) {
    clauses.push(colorsToQuery(colors));
  }

  const colorIdentity = normalizeColorList(intent.colorIdentity);
  if (colorIdentity?.length) {
    clauses.push(`id:${colorIdentity.join("")}`);
  }

  if (intent.types?.length) {
    clauses.push(...formatTypeList(intent.types));
  }

  if (intent.typesAny?.length) {
    clauses.push(formatOrGroup(formatTypeList(intent.typesAny)));
  }

  if (intent.oracle?.length) {
    clauses.push(...intent.oracle.map(quoteOraclePhrase).filter(Boolean));
  }

  if (intent.keywords?.length) {
    clauses.push(...intent.keywords.map((keyword) => `kw:${keyword}`));
  }

  if (intent.manaValue) {
    clauses.push(formatNumericClause("mv", intent.manaValue));
  }

  if (intent.power) {
    clauses.push(formatNumericClause("pow", intent.power));
  }

  if (intent.toughness) {
    clauses.push(formatNumericClause("tou", intent.toughness));
  }

  if (intent.format) {
    clauses.push(`f:${intent.format}`);
  }

  if (intent.rarity) {
    clauses.push(`r:${intent.rarity}`);
  }

  if (intent.flags?.length) {
    clauses.push(...intent.flags.map((flag) => `is:${flag}`));
  }

  if (intent.artTreatment) {
    const treatmentClause = artTreatmentToQuery(intent.artTreatment);
    if (treatmentClause) {
      clauses.push(treatmentClause);
    }
  }

  if (intent.price) {
    clauses.push(formatPriceClause(intent.price));
  }

  if (intent.notTypes?.length) {
    clauses.push(...intent.notTypes.map((type) => `-t:${type}`));
  }

  if (intent.notOracle?.length) {
    clauses.push(...intent.notOracle.map((phrase) => `-${quoteOraclePhrase(phrase)}`).filter(Boolean));
  }

  if (intent.notKeywords?.length) {
    clauses.push(...intent.notKeywords.map((keyword) => `-kw:${keyword}`));
  }

  return clauses.join(" ").trim();
}
