import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function savedGame(path, memory) {
  const exports = {};
  const localStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key),
  };
  const { outputText } = ts.transpileModule(readFileSync("src/game/save.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  runInNewContext(outputText, {
    exports,
    localStorage,
    window: { location: { pathname: path } },
    require: (id) => {
      assert.equal(id, "./data/catalog");
      return { STARTING_DWARVES: [] };
    },
  });
  return exports;
}
test("starting or clearing a preview operation preserves the main colony", () => {
  const original = JSON.stringify({ version: 1, day: 17, treasury: 721 });
  const memory = new Map([["dwarf-lord-save-v1", original]]);
  const preview = savedGame("/Dwarf-Lord-preview/", memory);
  assert.equal(preview.readSave(), null);
  preview.writeSave({ day: 1, treasury: 200 });
  assert.equal(preview.readSave().day, 1);
  assert.equal(memory.get("dwarf-lord-save-v1"), original);
  preview.clearSave();
  assert.equal(memory.get("dwarf-lord-save-v1"), original);
});
test("the main game continues using its existing save slot", () => {
  const memory = new Map([
    ["dwarf-lord-save-v1", JSON.stringify({ version: 1, day: 12, treasury: 456 })],
  ]);
  const main = savedGame("/Dwarf-Lord/", memory);
  assert.equal(main.readSave().day, 12);
  main.writeSave({ day: 13, treasury: 470 });
  assert.equal(JSON.parse(memory.get("dwarf-lord-save-v1")).treasury, 470);
});
