import { JOBS, STARTING_DWARVES } from "../data/catalog";
import type { DwarfAppearance } from "./dwarf-appearances";

/** Actor roots and persistent props share one registration, including on arrival. */
export const workstationSites = [
  { id: "cutting-block", appearance: "cook", job: "meals", bodyHeight: 520, anchor: [320, 616] },
  { id: "anvil", appearance: "blacksmith", job: "forge", bodyHeight: 520, anchor: [320, 616] },
  { id: "forestry-trunk", appearance: "ginger", job: "timber", bodyHeight: 376, anchor: [240, 616] },
  { id: "storage-pallet", appearance: "laborer", job: "storage", bodyHeight: 370, anchor: [180, 616], completionLayer: "completed-crate.png" },
  { id: "masonry-bench", appearance: "stoneworker", job: "limestone", bodyHeight: 520, anchor: [320, 616] },
  { id: "ledger-desk", appearance: "borrin", job: null, bodyHeight: 650, anchor: [320, 616], passive: true },
].map(site => {
  const consultant = STARTING_DWARVES.find(dwarf => dwarf.id === "borrin")!;
  return { ...site, target: site.passive ? { targetX: consultant.x, targetZ: consultant.z } : JOBS.find(job => job.id === site.job)! };
});

export function activeWorkstation(appearance: DwarfAppearance, job: string | null | undefined, working: boolean, resolved: boolean) {
  if (!working) return undefined;
  return workstationSites.find(site => site.appearance === appearance && site.job === (job ?? null) && (!resolved || site.passive));
}
