export type SettlementPhase =
  | "ruins"
  | "camp"
  | "work_settlement"
  | "village"
  | "town"
  | "industrial_town"
  | "mountain_city"
  | "capital";

export type ZoneId = "road" | "forest" | "camp" | "periphery" | "mine";

export type DwarfAnim = "idle" | "sit" | "walk" | "work" | "talk" | "sleep";

export type Knowledge = "hidden" | "rumor" | "unknown" | "identified" | "mastered";

export type SkillKey = "mining" | "labor" | "craft" | "survey" | "cook";

export type OverlayId =
  | null
  | "workforce"
  | "ledger"
  | "geology"
  | "labor"
  | "expedition"
  | "chronicle"
  | "inspect";

export interface Skills {
  mining: number;
  labor: number;
  craft: number;
  survey: number;
  cook: number;
}

export interface Dwarf {
  id: string;
  name: string;
  title: string;
  isSteward?: boolean;
  capability: number;
  skills: Skills;
  energy: number;
  motivation: number;
  experience: number;
  condition: number;
  discipline: number;
  initiative: number;
  x: number;
  z: number;
  yaw: number;
  anim: DwarfAnim;
  assignedJobId: string | null;
  portrait: string;
  beard: string;
  clothes: string;
  skin: string;
  helmet?: boolean;
  sitOnStart?: boolean;
  talkKey: string;
}

export interface Building {
  id: string;
  name: string;
  kind:
    | "dorm"
    | "forge"
    | "storage"
    | "office"
    | "tent"
    | "shaft"
    | "cart"
    | "kitchen"
    | "tavern"
    | "warehouse";
  x: number;
  z: number;
  rot: number;
  condition: number;
  inspected: boolean;
  note: string;
}

export interface JobDef {
  id: string;
  name: string;
  capabilityRequired: number;
  skill: SkillKey;
  description: string;
  zone: ZoneId;
  targetX: number;
  targetZ: number;
  outputs?: Record<string, [number, number]>;
  buildingId?: string;
  repair?: number;
  morale?: number;
}

export interface ResourceDef {
  id: string;
  name: string;
  tier: 0 | 1 | 2 | 3 | 4;
  kind: "mundane" | "fantasy";
  relativeValue: string;
  depthMin: number;
  depthMax: number;
  host: string;
  uses: string;
  startKnowledge: Knowledge;
}

export interface WorldStage {
  id: SettlementPhase;
  name: string;
  character: string;
  townScale: number;
  mineScale: number;
  cameraZoom: number;
  assetBrief: string;
  playable: boolean;
}

export interface LogEntry {
  id: string;
  day: number;
  text: string;
  tone: "neutral" | "good" | "bad" | "borrin";
}

export interface DialogueState {
  key: string;
  step: number;
  speakerId: string;
}

export interface Expedition {
  dwarfIds: string[];
  area: "limestone" | "iron";
  food: number;
  tools: "cracked" | "mixed" | "sound";
  status: "planning" | "out" | "returned";
  result?: HaulResult;
}

export interface HaulResult {
  limestone: number;
  ironRock: number;
  copperOre: number;
  constructionStone: number;
  gross: number;
  wages: number;
  food: number;
  toolRepair: number;
  dorm: number;
  cart: number;
  remaining: number;
  intactBonus: number;
}

export interface Discoveries {
  road: boolean;
  camp: boolean;
  lazyDwarf: boolean;
  ownerQuestion: boolean;
  mountainPoint: boolean;
  forge: boolean;
  storage: boolean;
  dorm: boolean;
  floodedShaft: boolean;
  office: boolean;
  ledgers: boolean;
  borrin: boolean;
  workforce: boolean;
  treasury: boolean;
  firstHaul: boolean;
}

export interface Inventory {
  limestone: number;
  ironRock: number;
  copperOre: number;
  constructionStone: number;
  timber: number;
  coal: number;
  food: number;
  beer: number;
  picksSound: number;
  picksCracked: number;
}

export interface GameSnapshot {
  version: number;
  day: number;
  hour: number;
  treasury: number;
  wages: number;
  settlement: SettlementPhase;
  housingQuality: number;
  dwarves: Dwarf[];
  buildings: Building[];
  inventory: Inventory;
  knowledge: Record<string, Knowledge>;
  discoveries: Discoveries;
  log: LogEntry[];
  expedition: Expedition | null;
  dayResolved: boolean;
  jobsDone: string[];
}
