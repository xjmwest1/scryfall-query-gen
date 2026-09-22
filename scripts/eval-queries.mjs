/**
 * Run query-generation accuracy eval in headless Chromium.
 * Usage: npm run build && npm run preview -- --port 4173 & npm run eval
 */
import { chromium } from "playwright";

const PREVIEW_URL = process.env.EVAL_URL ?? "http://127.0.0.1:4173/eval.html";
const EVAL_TIMEOUT_MS = 20 * 60 * 1000;

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--enable-unsafe-webgpu",
      "--enable-features=Vulkan",
      "--use-angle=vulkan",
    ],
  });

  const page = await browser.newPage();
  page.on("console", (msg) => console.log(`[browser] ${msg.type()}: ${msg.text()}`));
  page.on("pageerror", (err) => console.error(`[browser error] ${err.message}`));

  console.log(`Opening ${PREVIEW_URL}`);
  await page.goto(PREVIEW_URL, { waitUntil: "domcontentloaded", timeout: 120000 });

  await page.waitForFunction(
    () =>
      document.body.dataset.evalStatus === "done" ||
      document.body.dataset.evalStatus === "error",
    undefined,
    { timeout: EVAL_TIMEOUT_MS },
  );

  const status = await page.evaluate(() => document.body.dataset.evalStatus);
  const log = await page.evaluate(() => document.getElementById("log")?.textContent ?? "");
  const summary = JSON.parse(
    await page.evaluate(() => document.body.dataset.evalSummary ?? "{}"),
  );
  console.log(log);

  await browser.close();

  if (status === "error") {
    process.exit(1);
  }
  console.log("\nParsed summary:", JSON.stringify(summary, null, 2));

  process.exit(summary.miss > (summary.results?.length ?? 0) / 2 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
