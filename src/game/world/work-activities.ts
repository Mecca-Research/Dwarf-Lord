import { STARTING_DWARVES } from "../data/catalog";
import type { Body } from "../runtime";
import type { DwarfAppearance } from "./dwarf-appearances";

/** Existing seated references, played once in a finite camp activity sequence.
 * This is cosmetic: the Elder keeps his narrative role and never produces goods.
 */
export const elderCampActions = [
  "eat-stew", "eat-bread", "laugh-seated", "laugh-and-gesture",
  "inspect-pickaxe-in-lap", "examine-pickaxe-crack",
] as const;

/** A day's forge assignment has one finite operation, including inspection
 * and handle repair. A finished operation never silently becomes another task.
 */
export const forgeWorkActions = ["hammer-contact", "inspect-tool", "repair-pickaxe-handle"] as const;

export function forgeWorkAction(day: number) {
  if (!Number.isSafeInteger(day) || day < 1) throw new Error("Invalid work day");
  return forgeWorkActions[(day - 1) % forgeWorkActions.length];
}

/** Meal preparation keeps a task's selected operation for the entire day. */
export const cookingWorkActions = ["chop-vegetables", "peel-potatoes", "knead-dough", "stir-cauldron"] as const;

export function cookingWorkAction(day: number) {
  if (!Number.isSafeInteger(day) || day < 1) throw new Error("Invalid work day");
  return cookingWorkActions[(day - 1) % cookingWorkActions.length];
}

/** Timber workers alternate tree cutting with maintaining an existing barrel.
 * Reseating its hoop is cosmetic; the daily timber job still owns its output.
 */
export const timberWorkActions = ["fell-tree", "build-barrel"] as const;

export function timberWorkAction(day: number) {
  if (!Number.isSafeInteger(day) || day < 1) throw new Error("Invalid work day");
  return timberWorkActions[(day - 1) % timberWorkActions.length];
}

/** The consultant performs one finite desk activity for the entire day.
 * Writing, coin inspection, entry review, explanation and sealing remain cosmetic.
 */
export const consultantWorkActions = ["desk-writing", "count-coins", "review-open-ledger", "explain-at-desk", "stamp-paperwork"] as const;

export function consultantWorkAction(day: number) {
  if (!Number.isSafeInteger(day) || day < 1) throw new Error("Invalid work day");
  return consultantWorkActions[(day - 1) % consultantWorkActions.length];
}

export function elderCampActivity(appearance: DwarfAppearance, job: string | null,
  body: Pick<Body, "x" | "z" | "anim">) {
  if (appearance !== "elder" || job !== null || body.anim !== "sit") return false;
  const home = STARTING_DWARVES.find(dwarf => dwarf.id === "elder")!;
  return Math.hypot(body.x - home.x, body.z - home.z) < 1;
}

/** Advance only after the finished pose has held for two seconds. Last activity
 * stays finished; no implicit loop or premature completion during texture loading.
 */
export class WorkActivitySequence {
  index = 0;
  private heldMs = 0;
  constructor(readonly actions: readonly string[]) {
    if (!actions.length) throw new Error("A work sequence needs an action");
  }
  get action() { return this.actions[this.index]; }
  update(dtMs: number, completed: boolean) {
    if (!Number.isFinite(dtMs) || dtMs < 0) throw new Error("Invalid activity time");
    if (!completed || this.index === this.actions.length - 1) return false;
    this.heldMs += dtMs;
    if (this.heldMs < 2000) return false;
    this.index++; this.heldMs = 0;
    return true;
  }
}
