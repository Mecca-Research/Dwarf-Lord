import { STARTING_DWARVES } from "./data/catalog";
import type { Dwarf, GameSnapshot } from "./types";

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

/** Upgrade narrative identities without resetting progress, worker skills or accounts. */
export function reconcileCharacterIdentities(dwarves: Dwarf[]): Dwarf[] {
  const elder = STARTING_DWARVES.find((d) => d.id === "elder")!;
  const borrin = STARTING_DWARVES.find((d) => d.id === "borrin")!;
  const next = dwarves.map((d) => {
    if (d.id === "borrin") return { ...d, title: borrin.title, portrait: borrin.portrait, x: borrin.x, z: borrin.z };
    if (d.id === "elder") return { ...d, narrativeOnly: true, capability: 0, assignedJobId: null, talkKey: elder.talkKey, portrait: elder.portrait };
    const canonical = STARTING_DWARVES.find((c) => c.id === d.id);
    return canonical ? { ...d, portrait: canonical.portrait } : d;
  });
  return next.some((d) => d.id === "elder") ? next : [...next, { ...elder }];
}
