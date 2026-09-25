import { JOBS } from "../data/catalog";
import type { DwarfAppearance } from "./dwarf-appearances";

/** Actor roots and persistent props share one registration, including on arrival. */
export const workstationSites = [
  { id: "cutting-block", appearance: "cook", job: "meals", bodyHeight: 520, anchor: [320, 616] },
  { id: "anvil", appearance: "blacksmith", job: "forge", bodyHeight: 520, anchor: [320, 616] },
  { id: "forestry-trunk", appearance: "ginger", job: "timber", bodyHeight: 376, anchor: [240, 616] },
].map(site => ({ ...site, target: JOBS.find(job => job.id === site.job)! }));

export function activeWorkstation(appearance: DwarfAppearance, job: string | null | undefined, working: boolean, resolved: boolean) {
  if (!working || resolved) return undefined;
  return workstationSites.find(site => site.appearance === appearance && site.job === job);
}
