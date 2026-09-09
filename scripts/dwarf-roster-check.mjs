import { chromium } from "playwright";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import ts from "typescript";
const source = readFileSync(
  new URL("../src/game/world/dwarf-appearances.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
});
const { DWARF_ART } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const base = process.env.REVIEW_URL || "http://localhost:8081/Dwarf-Lord/";
const output = process.env.ROSTER_OUTPUT || "work/checks/roster";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1250 },
    deviceScaleFactor: 1,
  });
  // Establish same origin for canvas alpha inspection.
  await page.goto(`${base}sprites/GENERATED-ASSETS.md`);
  await page.setContent(`<style>
    *{box-sizing:border-box}body{margin:0;padding:24px;background:#20282b;color:#eee5d4;font:16px Georgia}
    h1{margin:0 0 8px;font-size:28px}p{margin:0 0 20px;color:#c4bba8}
    main{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
    article{text-align:center;background:#333a39;border:1px solid #58615a;border-radius:6px;padding:8px}
    .art{height:322px;display:flex;justify-content:center;align-items:center}
    .sprite{height:310px;width:207px;background-repeat:no-repeat;background-size:contain;background-position:center}
    .atlas{width:232.5px;background-size:200% 100%}
    h2{font-size:17px;margin:6px 0 2px}
  </style><h1>Dwarf Lord · 12 character designs</h1><p>Three original designs + nine new sprites · Elder, two helmeted women, and distinct camp workers</p><main>${Object.entries(
    DWARF_ART,
  )
    .map(
      ([id, a]) =>
        `<article><div class="art"><div class="sprite ${"column" in a ? "atlas" : ""}" style="background-image:url('${base}sprites/${a.file}');${"column" in a ? `background-position:${a.column ? "right" : "left"} center` : ""}"></div></div><h2>${id.replace(/([A-Z])/g, " $1")}</h2></article>`,
    )
    .join("")}</main>`);
  const results = await page.evaluate(
    async ({ art, base }) => {
      return Promise.all(
        Object.entries(art).map(async ([id, a]) => {
          const img = new Image();
          img.src = `${base}sprites/${a.file}`;
          await img.decode();
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const pixels = ctx.getImageData(0, 0, img.width, img.height).data;
          let clear = 0,
            solid = 0;
          for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] < 128) clear++;
            if (pixels[i] > 240) solid++;
          }
          return {
            id,
            width: img.width,
            height: img.height,
            transparent: clear / (pixels.length / 4),
            opaque: solid / (pixels.length / 4),
          };
        }),
      );
    },
    { art: DWARF_ART, base },
  );
  await page.screenshot({ path: `${output}/dwarf-roster.png`, fullPage: true });
  writeFileSync(`${output}/alpha-results.json`, JSON.stringify(results, null, 2));
  for (const r of results) {
    assert(r.transparent > 0.1, `${r.id} has transparent background`);
    assert(r.opaque > 0.1, `${r.id} contains opaque figure`);
  }
  console.log("PASS all 12 designs load with transparent alpha");
} finally {
  await browser.close();
}
