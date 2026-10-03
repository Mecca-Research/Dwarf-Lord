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
