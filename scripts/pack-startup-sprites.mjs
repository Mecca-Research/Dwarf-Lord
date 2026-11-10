/** Build small browser copies of the title art and the static character frames. Requires ImageMagick. */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cast = {
  elder: "Elder/idle.png",
  helga: "Helga/stand.png",
  femaleMiner: "Female Miner/stand.png",
  blacksmith: "Blacksmith/stand.png",
  redMiner: "Red Miner/stand.png",
  quartermaster: "Quartermaster/stand.png",
  stoneworker: "Stoneworker/stand.png",
  cook: "Cook/idle.png",
  veteran: "Veteran/idle.png",
  ginger: "Ginger/idle.png",
  silver: "Silver/idle.png",
  borrin: "Borrin/idle.png",
  laborer: "Laborer/stand.png",
};
const lord = {};
for (let direction = 0; direction < 8; direction++) {
  lord["idle" + direction] = "Lord/lord-idle-" + direction + ".png";
  for (let frame = 0; frame < 4; frame++) {
    lord["gait" + direction + frame] = "Lord/lord-gait-" + direction + "-" + frame + ".png";
  }
}
const temp = mkdtempSync(join(tmpdir(), "dwarf-sprite-pack-"));
const pad = 16;
function magick(args) {
  return execFileSync("magick", args, { encoding: "utf8" });
}
function pack(name, sources, columns) {
  const resized = Object.entries(sources).map(([id, path]) => {
    const file = join(temp, id + ".png");
    magick(["public/sprites/" + path, "-resize", "480x480>", "+repage", "PNG32:" + file]);
    const [width, height] = magick(["identify", "-format", "%w %h", file]).split(" ").map(Number);
    return { id, file, width, height };
  });
  const cellW = Math.max(...resized.map((frame) => frame.width)) + 2 * pad;
  const cellH = Math.max(...resized.map((frame) => frame.height)) + 2 * pad;
  const width = columns * cellW;
  const height = Math.ceil(resized.length / columns) * cellH;
  const frames = {};
  const args = ["-size", width + "x" + height, "xc:none"];
  resized.forEach((frame, i) => {
    const x = (i % columns) * cellW + pad;
    const y = Math.floor(i / columns) * cellH + pad;
    args.push(frame.file, "-geometry", "+" + x + "+" + y, "-composite");
    frames[frame.id] = [x, y, frame.width, frame.height];
  });
  magick([
    ...args,
    "-strip",
    "-quality",
    "86",
    "-define",
    "webp:method=6",
    "public/sprites/startup/" + name + ".webp",
  ]);
  return frames;
}
try {
  mkdirSync("public/sprites/startup", { recursive: true });
  const frames = { cast: pack("cast", cast, 4), lord: pack("lord", lord, 8) };
  writeFileSync("src/game/world/startup-sprite-frames.json", JSON.stringify(frames) + "\n");
  magick([
    "public/art/camp-vista.jpg",
    "-resize",
    "1600x1600>",
    "-strip",
    "-quality",
    "83",
    "-define",
    "webp:method=6",
    "public/art/camp-vista.webp",
  ]);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
