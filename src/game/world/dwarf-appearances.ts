/** Stable NPC identities. Player direction/gait frames are managed separately. */
export const DWARF_ART = {
  ginger: { file: "Ginger/idle.png", pose: "sit" },
  silver: { file: "Silver/idle.png", pose: "sit" },
  laborer: { file: "Laborer/stand.png", pose: "stand" },
  borrin: { file: "Borrin/idle.png", pose: "sit" },
  elder: { file: "Elder/idle.png", pose: "sit" },
  helga: { file: "Helga/stand.png", pose: "stand" },
  femaleMiner: { file: "Female Miner/stand.png", pose: "stand" },
  blacksmith: { file: "Blacksmith/stand.png", pose: "stand" },
  redMiner: { file: "Red Miner/stand.png", pose: "stand" },
  quartermaster: { file: "Quartermaster/stand.png", pose: "stand" },
  stoneworker: { file: "Stoneworker/stand.png", pose: "stand" },
  cook: { file: "Cook/idle.png", pose: "sit" },
  veteran: { file: "Veteran/idle.png", pose: "sit" },
} as const;

export type DwarfAppearance = keyof typeof DWARF_ART;

const NPC_APPEARANCE: Record<string, DwarfAppearance> = {
  borrin: "borrin",
  elder: "elder",
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

/** Sprite and dialogue portrait always resolve to the same canonical character. */
export function characterPortraitPath(id?: string): string {
  const folder = id === "player" || id === "lord"
    ? "Lord"
    : DWARF_ART[dwarfAppearance(id)].file.split("/")[0];
  return `/sprites/${folder}/portrait.png`;
}
