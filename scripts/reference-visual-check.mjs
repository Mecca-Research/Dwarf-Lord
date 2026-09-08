import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const output = process.env.REVIEW_OUTPUT || "work/checks/review";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--enable-unsafe-swiftshader"] });
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.REVIEW_URL || "http://localhost:8081/Dwarf-Lord/");
  await page.getByRole("button", { name: "Walk the road" }).waitFor();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Walk the road" }).click();
  await page.waitForFunction(() => window.__controlsTest?.getPos, null, { timeout: 30000 });
  await page.waitForTimeout(12000);
  await page.screenshot({ path: `${output}/camp.png`, timeout: 60000 });
  const movement = await page.evaluate(() => {
    const t = window.__controlsTest;
    const before = t.getPos();
    t.setKeys(["KeyD"]);
    window.advanceTime(500);
    t.setKeys([]);
    return { before, after: t.getPos() };
  });
  assert(
    Math.hypot(movement.after.x - movement.before.x, movement.after.z - movement.before.z) > 0.5,
    "WASD moves the player",
  );
  await page.evaluate(() => window.__controlsTest.teleport(10.3, 3.05));
  await page.waitForTimeout(2500);
  await page.keyboard.press("KeyE");
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).dialogue, null, {
    timeout: 30000,
  });
  const state = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
  assert(state.dialogue, "E opens dwarf dialogue");
  writeFileSync(
    `${output}/results.json`,
    JSON.stringify({ movement, dialogue: state.dialogue, errors }, null, 2),
  );
  assert.equal(errors.length, 0, "No browser runtime errors");
  console.log("PASS movement, interaction, screenshot, browser errors");
} finally {
  await browser.close();
}
