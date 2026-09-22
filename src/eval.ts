import { CreateMLCEngine } from "@mlc-ai/web-llm";
import examples from "../docs/examples/queries.json";
import { buildFinalQuery } from "./lib/buildQuery";
import { MODEL_ID } from "./lib/model";
import { SYSTEM_PROMPT } from "./lib/prompts";

const logEl = document.getElementById("log");

function log(line: string) {
  if (logEl) logEl.textContent += `${line}\n`;
}

function normalize(query: string) {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

function tokenSet(query: string) {
  return new Set(query.toLowerCase().split(/\s+/).filter(Boolean));
}

function scoreMatch(expected: string, actual: string) {
  if (normalize(expected) === normalize(actual)) {
    return { kind: "exact", score: 1 };
  }

  const expectedTokens = tokenSet(expected);
  const actualTokens = tokenSet(actual);
  let overlap = 0;
  for (const token of expectedTokens) {
    if (actualTokens.has(token)) overlap += 1;
  }

  const score = expectedTokens.size ? overlap / expectedTokens.size : 0;
  return { kind: score >= 0.6 ? "partial" : "miss", score };
}

async function generateQuery(
  engine: Awaited<ReturnType<typeof CreateMLCEngine>>,
  input: string,
): Promise<string> {
  const response = await engine.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: input },
    ],
    temperature: 0.1,
    max_tokens: 256,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  return await buildFinalQuery(raw);
}

async function main() {
  if (!("gpu" in navigator)) {
    log("WebGPU not available.");
    document.body.dataset.evalStatus = "error";
    return;
  }

  log(`Model: ${MODEL_ID}`);
  log("Loading...\n");

  const engine = await CreateMLCEngine(MODEL_ID, {
    initProgressCallback: (report) => {
      if (logEl) {
        logEl.textContent = `Loading model... ${Math.round(report.progress * 100)}%\n${report.text}`;
      }
    },
  });

  if (logEl) logEl.textContent = "";
  const limit = Number(new URLSearchParams(location.search).get("limit") ?? examples.length);
  const subset = examples.slice(0, Math.max(1, limit));
  log(`Running ${subset.length} of ${examples.length} examples...\n`);

  const results: Array<{
    input: string;
    expected: string;
    actual: string;
    kind: string;
    score: number;
  }> = [];

  for (const example of subset) {
    try {
      const actual = await generateQuery(engine, example.input);
      const match = scoreMatch(example.expected, actual);
      results.push({ ...example, actual, ...match });
      log(`[${match.kind}] ${example.input}`);
      log(`  expected: ${example.expected}`);
      log(`  actual:   ${actual}\n`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      results.push({
        input: example.input,
        expected: example.expected,
        actual: `ERROR: ${message}`,
        kind: "error",
        score: 0,
      });
      log(`[error] ${example.input}`);
      log(`  ${message}\n`);
    }
  }

  const exact = results.filter((r) => r.kind === "exact").length;
  const partial = results.filter((r) => r.kind === "partial").length;
  const miss = results.filter((r) => r.kind === "miss").length;
  const errors = results.filter((r) => r.kind === "error").length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

  log("--- Summary ---");
  log(`Exact:   ${exact}/${results.length}`);
  log(`Partial: ${partial}/${results.length}`);
  log(`Miss:    ${miss}/${results.length}`);
  log(`Errors:  ${errors}/${results.length}`);
  log(`Avg token overlap: ${(avgScore * 100).toFixed(1)}%`);

  document.body.dataset.evalStatus = "done";
  document.body.dataset.evalSummary = JSON.stringify({
    exact,
    partial,
    miss,
    errors,
    avgScore,
    results,
  });
}

void main();
