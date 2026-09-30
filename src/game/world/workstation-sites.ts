import { JOBS, STARTING_DWARVES } from "../data/catalog";
import type { DwarfAppearance } from "./dwarf-appearances";
import type { Body } from "../runtime";

/** Actor roots and persistent props share one registration, including on arrival. */
export const workstationSites = [
  { id: "cutting-block", appearance: "cook", job: "meals", bodyHeight: 520, anchor: [320, 616] },
  { id: "anvil", appearance: "blacksmith", job: "forge", bodyHeight: 520, anchor: [320, 616] },
  { id: "forestry-trunk", appearance: "ginger", job: "timber", bodyHeight: 376, anchor: [240, 616] },
  { id: "storage-pallet", appearance: "laborer", job: "storage", bodyHeight: 370, anchor: [180, 616], completionLayer: "completed-crate.png" },
  { id: "masonry-bench", appearance: "stoneworker", job: "limestone", bodyHeight: 520, anchor: [320, 616] },
  { id: "ledger-desk", appearance: "borrin", job: null, bodyHeight: 650, anchor: [320, 616], passive: true, owner: "borrin", passiveAnim: "sit", action: "desk-writing" },
  { id: "weighing-table", appearance: "quartermaster", job: null, bodyHeight: 520, anchor: [320, 616], passive: true, owner: "fenn", passiveAnim: "idle", action: "check-weights" },
].map(site => {
  const consultant = STARTING_DWARVES.find(dwarf => dwarf.id === site.owner);
  if (site.passive && !consultant) throw new Error(`Missing workstation owner: ${site.owner}`);
  return { ...site, target: site.passive ? { targetX: consultant!.x, targetZ: consultant!.z } : JOBS.find(job => job.id === site.job)! };
});

/** Passive actions are cosmetic and only activate at their owner's home station. */
export function passiveWorkstation(appearance: DwarfAppearance, job: string | null | undefined, body: Pick<Body, "x" | "z" | "anim">) {
  if (job != null) return undefined;
  return workstationSites.find(site => site.passive && site.appearance === appearance && body.anim === site.passiveAnim &&
    Math.hypot(body.x - site.target.targetX, body.z - site.target.targetZ) < 1);
}

export function activeWorkstation(appearance: DwarfAppearance, job: string | null | undefined, working: boolean, resolved: boolean) {
  if (!working) return undefined;
  return workstationSites.find(site => site.appearance === appearance && site.job === (job ?? null) && (!resolved || site.passive));
}
