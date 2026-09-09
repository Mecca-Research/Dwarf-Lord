import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
const source = readFileSync(
  new URL("../src/game/world/dwarf-appearances.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
});
const { DWARF_ART, dwarfAppearance } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("12 distinct sprite cells exist on disk", () => {
  assert.equal(Object.keys(DWARF_ART).length, 12);
  assert.equal(
    new Set(Object.values(DWARF_ART).map((a) => `${a.file}:${a.column ?? ""}`)).size,
    12,
  );
  for (const a of Object.values(DWARF_ART))
    assert.ok(existsSync(new URL(`../public/sprites/${a.file}`, import.meta.url)), a.file);
});
test("elder and female identities have dedicated art, including helmeted Helga", () => {
  assert.equal(dwarfAppearance("borrin"), "elder");
  assert.equal(dwarfAppearance("helga"), "helga");
  assert.equal(dwarfAppearance("nessa"), "femaleMiner");
  assert.notEqual(dwarfAppearance("helga"), dwarfAppearance("nessa"));
  assert.equal(dwarfAppearance("unknown-recruit"), "laborer");
});
test("all 12 designs are used by starting characters", () => {
  const catalog = readFileSync(new URL("../src/game/data/catalog.ts", import.meta.url), "utf8");
  const start = catalog
    .split("export const STARTING_DWARVES")[1]
    .split("export const STARTING_BUILDINGS")[0];
  const ids = [...start.matchAll(/id: "([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(new Set(ids.map(dwarfAppearance)), new Set(Object.keys(DWARF_ART)));
});
