import type { GameSnapshot } from "./types";

const KEY = "dwarf-lord-save-v1";
const SAVE_VERSION = 1;

export function writeSave(snap: GameSnapshot) {
  try {
    const payload = JSON.stringify({ ...snap, version: SAVE_VERSION });
    localStorage.setItem(KEY + ":prev", localStorage.getItem(KEY) ?? "");
    localStorage.setItem(KEY, payload);
  } catch {
    /* private mode / quota */
  }
}

export function readSave(): GameSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    if ((parsed.version ?? 1) !== SAVE_VERSION) return parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
