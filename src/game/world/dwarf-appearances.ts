/** Stable NPC identities. Player direction/gait frames are managed separately. */
export const DWARF_ART = {
  ginger: { file: "camp-workers-atlas.png", pose: "sit", column: 0 },
  silver: { file: "camp-workers-atlas.png", pose: "sit", column: 1 },
  laborer: { file: "laborer-detailed.png", pose: "stand" },
  elder: { file: "elder.png", pose: "sit" },
  helga: { file: "helga.png", pose: "stand" },
  femaleMiner: { file: "female-miner.png", pose: "stand" },
  blacksmith: { file: "blacksmith.png", pose: "stand" },
  redMiner: { file: "red-miner.png", pose: "stand" },
  quartermaster: { file: "quartermaster.png", pose: "stand" },
  stoneworker: { file: "stoneworker.png", pose: "stand" },
  cook: { file: "cook.png", pose: "sit" },
  veteran: { file: "veteran.png", pose: "sit" },
} as const;

export type DwarfAppearance = keyof typeof DWARF_ART;

const NPC_APPEARANCE: Record<string, DwarfAppearance> = {
  borrin: "elder",
  durgan: "veteran",
  helga: "helga",
  brokk: "ginger",
  nessa: "femaleMiner",
  tam: "laborer",
  pip: "redMiner",
  mora: "femaleMiner",
  grit: "blacksmith",
  fenn: "quartermaster",
  kori: "cook",
  bram: "silver",
  ulla: "helga",
  stig: "stoneworker",
  yara: "femaleMiner",
  hob: "stoneworker",
  dunwold: "silver",
};

export function dwarfAppearance(id?: string): DwarfAppearance {
  return (id && NPC_APPEARANCE[id]) || "laborer";
}
