import { JOBS, STARTING_DWARVES } from "../data/catalog";
import type { DwarfAppearance } from "./dwarf-appearances";
import type { Body } from "../runtime";
import { cookingWorkAction, forgeWorkAction, timberWorkAction } from "./work-activities";

/** Actor roots and persistent props share one registration, including on arrival. */
export const workstationSites = [
  { id: "cutting-block", appearance: "cook", job: "meals", bodyHeight: 520, anchor: [320, 616], actions: ["chop-vegetables"] },
  { id: "potato-block", appearance: "cook", job: "meals", bodyHeight: 520, anchor: [320, 616], actions: ["peel-potatoes"], offsetX: -3 },
  { id: "dough-block", appearance: "cook", job: "meals", bodyHeight: 562, anchor: [320, 616], actions: ["knead-dough"], offsetX: -6, completionLayer: "completed-dough.png" },
  { id: "stew-cauldron", appearance: "cook", job: "meals", bodyHeight: 547, anchor: [320, 616], actions: ["stir-cauldron"], offsetX: -9 },
  { id: "anvil", appearance: "blacksmith", job: "forge", bodyHeight: 520, anchor: [320, 616], actions: ["hammer-contact", "inspect-tool"] },
  { id: "repair-bench", appearance: "blacksmith", job: "forge", bodyHeight: 650, anchor: [320, 616], actions: ["repair-pickaxe-handle"], offsetX: -3 },
  { id: "forestry-trunk", appearance: "ginger", job: "timber", bodyHeight: 376, anchor: [240, 616], actions: ["fell-tree"] },
  { id: "cooper-barrel", appearance: "ginger", job: "timber", bodyHeight: 520, anchor: [320, 616], actions: ["build-barrel"], offsetX: 6 },
  { id: "storage-pallet", appearance: "laborer", job: "storage", bodyHeight: 370, anchor: [180, 616], completionLayer: "completed-crate.png" },
  { id: "masonry-bench", appearance: "stoneworker", job: "limestone", bodyHeight: 520, anchor: [320, 616] },
  { id: "ledger-desk", appearance: "borrin", job: null, bodyHeight: 650, anchor: [320, 616], passive: true, owner: "borrin", passiveAnim: "sit", action: "desk-writing" },
  { id: "weighing-table", appearance: "quartermaster", job: null, bodyHeight: 520, anchor: [320, 616], passive: true, owner: "fenn", passiveAnim: "idle", action: "check-weights" },
].map(site => {
  const consultant = STARTING_DWARVES.find(dwarf => dwarf.id === site.owner);
  if (site.passive && !consultant) throw new Error(`Missing workstation owner: ${site.owner}`);
  const job = JOBS.find(job => job.id === site.job);
  return { ...site, target: site.passive ? { targetX: consultant!.x, targetZ: consultant!.z } :
    site.offsetX ? { ...job!, targetX: job!.targetX + site.offsetX, targetZ: job!.targetZ } : job! };
});

/** Passive actions are cosmetic and only activate at their owner's home station. */
export function passiveWorkstation(appearance: DwarfAppearance, job: string | null | undefined, body: Pick<Body, "x" | "z" | "anim">) {
  if (job != null) return undefined;
  return workstationSites.find(site => site.passive && site.appearance === appearance && body.anim === site.passiveAnim &&
    Math.hypot(body.x - site.target.targetX, body.z - site.target.targetZ) < 1);
}

export function activeWorkstation(appearance: DwarfAppearance, job: string | null | undefined, working: boolean, resolved: boolean, day = 1) {
  if (!working) return undefined;
  const action = appearance === "blacksmith" && job === "forge" ? forgeWorkAction(day) :
    appearance === "cook" && job === "meals" ? cookingWorkAction(day) :
    appearance === "ginger" && job === "timber" ? timberWorkAction(day) : null;
  return workstationSites.find(site => site.appearance === appearance && site.job === (job ?? null) && (!resolved || site.passive) &&
    (!site.actions || (action !== null && site.actions.includes(action))));
}

/** Routing and sprite registration use the same task's physical station. */
export function workAssignmentTarget(appearance: DwarfAppearance, job: string, day: number) {
  return activeWorkstation(appearance, job, true, false, day)?.target ?? JOBS.find(candidate => candidate.id === job);
}
