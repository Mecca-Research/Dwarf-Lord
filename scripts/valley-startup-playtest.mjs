/** Run against a Pages build. Set VALLEY_BASELINE=1 to record the old build. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, extname } from "node:path";
import { gzipSync } from "node:zlib";
import { chromium } from "playwright";

const root = resolve(process.env.WORLD_BUILD_ROOT ?? ".output/public");
const baseline = process.env.VALLEY_BASELINE === "1";
const output = resolve(process.env.WORLD_REVIEW_OUTPUT ?? "artifacts/valley-startup");
mkdirSync(output, { recursive: true });
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};
const cache = new Map();
const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const path = decodeURIComponent(url.pathname).replace(/^\/Dwarf-Lord\/?/, "");
  const file = resolve(root, path || "index.html");
  if (!file.startsWith(root + "/") || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  const ext = extname(file);
  res.setHeader("content-type", mime[ext] ?? "application/octet-stream");
  if (
    [".js", ".mjs", ".css", ".html", ".json"].includes(ext) &&
    req.headers["accept-encoding"]?.includes("gzip")
  ) {
    if (!cache.has(file)) cache.set(file, gzipSync(readFileSync(file)));
    res.setHeader("content-encoding", "gzip");
    res.end(cache.get(file));
  } else {
    res.end(readFileSync(file));
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));

const report = {
  baseline,
  viewport: [2048, 1024],
  network: { downloadMbps: 24, latencyMs: 75, fontCssDelayMs: 1500 },
  errors: [],
  failedRequests: [],
  views: [],
};
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.WORLD_CHROMIUM,
    headless: true,
    args: [
      "--no-sandbox",
      "--no-zygote",
      "--single-process",
      "--disable-dev-shm-usage",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const page = await browser.newPage({ viewport: { width: 2048, height: 1024 } });
  page.setDefaultTimeout(120000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: report.network.latencyMs,
    downloadThroughput: report.network.downloadMbps * 125000,
    uploadThroughput: 1000000,
  });
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") report.errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      report.failedRequests.push(response.status() + " " + response.url());
  });
  await page.route("https://fonts.googleapis.com/**", async (route) => {
    await new Promise((done) => setTimeout(done, report.network.fontCssDelayMs));
    await route.fulfill({ contentType: "text/css", body: "" });
  });
  await page.addInitScript(() => {
    performance.setResourceTimingBufferSize(1000);
    document.addEventListener(
      "click",
      (event) => {
        if (event.target.closest("button")?.textContent.trim() === "Walk the road") {
          performance.mark("walk-click");
        }
      },
      true,
    );
  });
  const url = "http://127.0.0.1:" + server.address().port + "/Dwarf-Lord/";
  await page.goto(url, { waitUntil: "commit" });
  if (!baseline) {
    await page.locator("#dwarf-boot").waitFor({ state: "attached" });
    assert.match(await page.locator("#dwarf-boot").textContent(), /Dwarf Lord/);
  }
  const start = page.getByRole("button", { name: "Walk the road", exact: true });
  await start.waitFor();
  report.titleReadyMs = await page.evaluate(() => Math.round(performance.now()));
  await start.click();
  await page.waitForFunction(() => {
    const state = JSON.parse(window.render_game_to_text?.() ?? "null");
    return state?.workstations.length === 14 && !document.querySelector("[data-camp-loading]");
  });
  report.camp = await page.evaluate(() => {
    const click = performance.getEntriesByName("walk-click")[0].startTime;
    const resources = performance.getEntriesByType("resource");
    const art = resources.filter(
      (entry) => entry.startTime >= click && /\/(sprites|art|textures)\//.test(entry.name),
    );
    const fetchWindows = Object.fromEntries(
      [
        ["engine", /\/assets\/(?:scene|three-engine)-/],
        ["terrain", /\/(?:textures\/|art\/(?:camp-earth|alpine-bedrock|alpine-conifers))/],
        ["cast", /\/sprites\/startup\//],
        ["stations", /\/sprites\/workstations\//],
      ].map(([label, pattern]) => {
        const matches = resources.filter((entry) => pattern.test(entry.name));
        return [
          label,
          matches.length
            ? [
                Math.round(Math.min(...matches.map((entry) => entry.startTime)) - click),
                Math.round(Math.max(...matches.map((entry) => entry.responseEnd)) - click),
              ]
            : null,
        ];
      }),
    );
    return {
      walkToCampMs: Math.round(performance.now() - click),
      firstContentfulPaintMs: Math.round(
        performance.getEntriesByName("first-contentful-paint")[0].startTime,
      ),
      artRequests: art.length,
      artBytes: art.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
      fetchWindows,
      largestArt: art
        .sort((a, b) => b.encodedBodySize - a.encodedBodySize)
        .slice(0, 5)
        .map((entry) => [new URL(entry.name).pathname, entry.encodedBodySize]),
    };
  });
  console.log("Cold startup", JSON.stringify(report.camp));
  await page.mouse.move(1024, 510);
  await page.mouse.wheel(0, 1800);
  const capture = async (name) => {
    await page.waitForTimeout(4500);
    const picture = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    writeFileSync(resolve(output, name + ".png"), Buffer.from(picture.data, "base64"));
    const coverage = await page.evaluate(
      () => window.__controlsTest?.lowerViewCoverage?.() ?? null,
    );
    report.views.push({ name, coverage });
    if (!baseline) {
      assert.ok(
        coverage && coverage.samples === 35 && coverage.hits === coverage.samples,
        name + " has terrain across the lower view",
      );
    }
    console.log("Captured", name, coverage);
  };
  await capture("max-wheel");
  await page.keyboard.press("v");
  await capture("valley-overview");
  if (!baseline) {
    await page.setViewportSize({ width: 2560, height: 1080 });
    await page.keyboard.down("q");
    await page.waitForTimeout(900);
    await page.keyboard.up("q");
    await capture("ultrawide-rotated");
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.failedRequests, []);
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  throw error;
} finally {
  writeFileSync(resolve(output, "results.json"), JSON.stringify(report, null, 2) + "\n");
  await browser?.close();
  await new Promise((done) => server.close(done));
}
