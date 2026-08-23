import { create } from "zustand";
import {
  JOBS,
  STARTING_BUILDINGS,
  STARTING_DWARVES,
  STARTING_INVENTORY,
  TOTAL_CAPABILITY,
  startingKnowledge,
  WORLD_STAGES,
} from "./data/catalog";
import { DIALOGUE } from "./data/dialogue";
import { runtime } from "./runtime";
import { clearSave, readSave, writeSave } from "./save";
import { assignedCap, resolveExpedition, resolveJobs, restNight, workers } from "./sim";
import { sting } from "./audio";
import type {
  DialogueState,
  Discoveries,
  Dwarf,
  Expedition,
  GameSnapshot,
  Inventory,
  Knowledge,
  LogEntry,
  OverlayId,
  SettlementPhase,
} from "./types";

const emptyDiscoveries = (): Discoveries => ({
  road: false,
  camp: false,
  lazyDwarf: false,
  ownerQuestion: false,
  mountainPoint: false,
  forge: false,
  storage: false,
  dorm: false,
  floodedShaft: false,
  office: false,
  ledgers: false,
  borrin: false,
  workforce: false,
  treasury: false,
  firstHaul: false,
});

function hydrateRuntime(dwarves: Dwarf[], player = { x: -30, z: 11, yaw: -Math.PI / 2 }) {
  runtime.player.x = player.x;
  runtime.player.z = player.z;
  runtime.player.yaw = player.yaw;
  runtime.player.facing = 3;
  runtime.player.dest = null;
  runtime.player.speed = 0;
  runtime.dwarves.clear();
  for (const d of dwarves) {
    runtime.dwarves.set(d.id, {
      x: d.x,
      z: d.z,
      yaw: d.yaw,
      facing: 0,
      speed: 0,
      anim: d.anim,
      dest: null,
      bob: 0,
    });
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

interface GameStore {
  booted: boolean;
  playing: boolean;
  day: number;
  hour: number;
  treasury: number;
  wages: number;
  settlement: SettlementPhase;
  housingQuality: number;
  dwarves: Dwarf[];
  buildings: GameSnapshot["buildings"];
  inventory: Inventory;
  knowledge: Record<string, Knowledge>;
  discoveries: Discoveries;
  log: LogEntry[];
  expedition: Expedition | null;
  dayResolved: boolean;
  jobsDone: string[];
  overlay: OverlayId;
  dialogue: DialogueState | null;
  selectedId: string | null;
  inspectId: string | null;
  prompt: string;
  muted: boolean;
  haulOpen: boolean;
  mobileJoy: { x: number; y: number };
  begin: () => void;
  continueSave: () => void;
  newGame: () => void;
  setOverlay: (id: OverlayId) => void;
  setSelected: (id: string | null) => void;
  talk: (key: string, speakerId: string) => void;
  inspect: (buildingId: string) => void;
  reply: (next?: string, discover?: string) => void;
  closeDialogue: () => void;
  discover: (key: keyof Discoveries) => void;
  assignJob: (dwarfId: string, jobId: string | null) => void;
  setWages: (n: number) => void;
  resolveDay: () => void;
  planExpedition: (partial: Partial<Expedition>) => void;
  sendExpedition: () => void;
  collectHaul: () => void;
  nextMorning: () => void;
  setMuted: (v: boolean) => void;
  setPrompt: (s: string) => void;
  setJoy: (x: number, y: number) => void;
  snapshot: () => GameSnapshot;
  persist: () => void;
}

function addLog(log: LogEntry[], day: number, text: string, tone: LogEntry["tone"] = "neutral"): LogEntry[] {
  return [{ id: uid(), day, text, tone }, ...log].slice(0, 40);
}

function applyDiscover(s: GameStore, key: string): Partial<GameStore> {
  if (!(key in s.discoveries)) return {};
  const k = key as keyof Discoveries;
  if (s.discoveries[k]) return {};
  const discoveries = { ...s.discoveries, [k]: true };
  let log = s.log;
  const notes: Partial<Record<keyof Discoveries, string>> = {
    lazyDwarf: "A dwarf sits on a crate. Management philosophy: wait.",
    ownerQuestion: "They did not expect an owner. The mountain was the only answer.",
    borrin: "Borrin Stoneledger is still here. That may be the only asset that matters.",
    workforce: "The pit board is open. Sixteen names. Eighty-two capability points. You cannot do everything.",
    ledgers: "Yellow metal below Shaft VII. Nobody on the payroll can read the survey correctly.",
    dorm: "The roof is a rumor. Rest will be poor until it is not.",
    forge: "The forge is cold. Modernization died on the anvil.",
    storage: "Stores are piles. Piles are not books.",
    floodedShaft: "Water in the hole. Depth is a privilege you have not earned.",
    firstHaul: "Revenue is not wealth.",
  };
  if (notes[k]) log = addLog(log, s.day, notes[k], k === "borrin" ? "borrin" : "neutral");
  return { discoveries, log };
}

export const useGame = create<GameStore>((set, get) => ({
  booted: false,
  playing: false,
  day: 1,
  hour: 16,
  treasury: 180,
  wages: 4,
  settlement: "ruins",
  housingQuality: 0.18,
  dwarves: STARTING_DWARVES.map((d) => ({ ...d })),
  buildings: STARTING_BUILDINGS.map((b) => ({ ...b })),
  inventory: { ...STARTING_INVENTORY },
  knowledge: startingKnowledge(),
  discoveries: emptyDiscoveries(),
  log: [],
  expedition: null,
  dayResolved: false,
  jobsDone: [],
  overlay: null,
  dialogue: null,
  selectedId: null,
  inspectId: null,
  prompt: "Walk the road.",
  muted: false,
  haulOpen: false,
  mobileJoy: { x: 0, y: 0 },

  begin: () => {
    hydrateRuntime(get().dwarves);
    runtime.ready = true;
    set({
      playing: true,
      booted: true,
      prompt: "This is the road. The smoke is the company.",
      log: addLog([], 1, "Arrived on the outer road. The contract did not mention the smell."),
    });
  },

  continueSave: () => {
    const saved = readSave();
    if (!saved) {
      get().begin();
      return;
    }
    hydrateRuntime(saved.dwarves);
    runtime.ready = true;
    set({
      playing: true,
      booted: true,
      day: saved.day,
      hour: saved.hour,
      treasury: saved.treasury,
      wages: saved.wages,
      settlement: saved.settlement,
      housingQuality: saved.housingQuality,
      dwarves: saved.dwarves,
      buildings: saved.buildings,
      inventory: saved.inventory,
      knowledge: saved.knowledge,
      discoveries: saved.discoveries,
      log: saved.log,
      expedition: saved.expedition,
      dayResolved: saved.dayResolved,
      jobsDone: saved.jobsDone,
    });
  },

  newGame: () => {
    clearSave();
    const dwarves = STARTING_DWARVES.map((d) => ({ ...d }));
    hydrateRuntime(dwarves);
    runtime.player.x = -30;
    runtime.player.z = 11;
    runtime.ready = true;
    set({
      playing: true,
      booted: true,
      day: 1,
      hour: 16,
      treasury: 180,
      wages: 4,
      settlement: "ruins",
      housingQuality: 0.18,
      dwarves,
      buildings: STARTING_BUILDINGS.map((b) => ({ ...b })),
      inventory: { ...STARTING_INVENTORY },
      knowledge: startingKnowledge(),
      discoveries: emptyDiscoveries(),
      log: addLog([], 1, "Arrived on the outer road. The contract did not mention the smell."),
      expedition: null,
      dayResolved: false,
      jobsDone: [],
      overlay: null,
      dialogue: null,
      selectedId: null,
      inspectId: null,
      haulOpen: false,
      prompt: "Walk the road.",
    });
  },

  setOverlay: (overlay) => set({ overlay }),
  setSelected: (selectedId) => set({ selectedId }),
  setPrompt: (prompt) => set({ prompt }),
  setJoy: (x, y) => set({ mobileJoy: { x, y } }),
  setMuted: (muted) => set({ muted }),
  setWages: (wages) => set({ wages: Math.max(0, Math.min(20, Math.round(wages)) ) }),

  talk: (key, speakerId) => {
    if (!DIALOGUE[key]) return;
    set({ dialogue: { key, step: 0, speakerId }, overlay: null });
  },

  inspect: (buildingId) => {
    const b = get().buildings.find((x) => x.id === buildingId);
    if (!b) return;
    const key = `inspect_${buildingId}` in DIALOGUE ? `inspect_${buildingId}` : null;
    const buildings = get().buildings.map((x) => (x.id === buildingId ? { ...x, inspected: true } : x));
    if (key) {
      set({ buildings, inspectId: buildingId, dialogue: { key, step: 0, speakerId: "inspect" } });
    } else {
      set({
        buildings,
        inspectId: buildingId,
        dialogue: {
          key: "inspect_kitchen",
          step: 0,
          speakerId: "inspect",
        },
      });
    }
    if (buildingId === "office") get().discover("office");
  },

  reply: (next, discover) => {
    const d = get().dialogue;
    if (!d) return;
    if (discover) get().discover(discover as keyof Discoveries);
    if (next && DIALOGUE[next]) {
      set({ dialogue: { key: next, step: 0, speakerId: d.speakerId } });
      return;
    }
    const lines = DIALOGUE[d.key] ?? [];
    if (d.step + 1 < lines.length) {
      set({ dialogue: { ...d, step: d.step + 1 } });
      return;
    }
    set({ dialogue: null });
  },

  closeDialogue: () => set({ dialogue: null }),

  discover: (key) => {
    const s = get();
    const patch = applyDiscover(s, key);
    if (!("discoveries" in patch)) return;
    set(patch);
    if (key === "workforce") {
      set((st) => ({
        overlay: st.overlay ?? "labor",
        knowledge: { ...st.knowledge, limestone: "identified", hematite: "unknown", copper: "unknown" },
      }));
    }
    if (key === "ledgers") {
      set((st) => ({
        knowledge: { ...st.knowledge, gold: "rumor", silver: "rumor", tin: "rumor", lead: "identified" },
      }));
    }
  },

  assignJob: (dwarfId, jobId) => {
    const { dwarves } = get();
    const next = dwarves.map((d) => {
      if (d.id !== dwarfId || d.isSteward) return d;
      return { ...d, assignedJobId: jobId };
    });
    const cap = assignedCap(next);
    if (cap > TOTAL_CAPABILITY) return;
    set({ dwarves: next });
    const body = runtime.dwarves.get(dwarfId);
    const job = JOBS.find((j) => j.id === jobId);
    if (body && job) body.dest = { x: job.targetX, z: job.targetZ };
  },

  resolveDay: () => {
    const s = get();
    if (s.dayResolved) return;
    const assigned: Record<string, string> = {};
    for (const d of s.dwarves) if (d.assignedJobId) assigned[d.id] = d.assignedJobId;
    const result = resolveJobs(s.dwarves, assigned, s.day);
    const inventory = { ...s.inventory };
    for (const [k, v] of Object.entries(result.inventoryDelta)) {
      const key = k as keyof Inventory;
      inventory[key] = (inventory[key] ?? 0) + (v ?? 0);
    }
    const buildings = s.buildings.map((b) => ({
      ...b,
      condition: Math.min(1, b.condition + (result.buildingRepair[b.id] ?? 0)),
    }));
    const dorm = buildings.find((b) => b.id === "dorm")?.condition ?? s.housingQuality;
    const dwarves = result.dwarves.map((d) => ({
      ...d,
      motivation: Math.min(0.95, d.motivation + result.morale),
    }));
    const wageBill = Math.round(s.wages * workers(dwarves).length);
    const foodCost = inventory.food > 0 ? 8 : 14;
    if (inventory.food > 0) inventory.food = Math.max(0, inventory.food - 6);
    const treasury = s.treasury - wageBill - foodCost;
    let log = s.log;
    for (const n of result.notes) log = addLog(log, s.day, n);
    log = addLog(log, s.day, `Wages ${wageBill}c. Kitchen ${foodCost}c. Treasury ${treasury}c.`, treasury < 40 ? "bad" : "neutral");

    let settlement: SettlementPhase = s.settlement;
    if (dorm > 0.55 && inventory.timber >= 6 && s.discoveries.workforce) settlement = "camp";
    const stage = WORLD_STAGES.find((w) => w.id === settlement);
    if (settlement !== s.settlement) {
      log = addLog(log, s.day, `The settlement is no longer merely ruins. It is a ${stage?.name ?? "camp"}.`, "good");
    }

    const rested = restNight(dwarves, dorm, inventory.food > 0, s.wages / 8);
    set({
      dwarves: rested,
      buildings,
      inventory,
      treasury,
      housingQuality: dorm,
      settlement,
      dayResolved: true,
      jobsDone: Object.values(assigned),
      log,
      overlay: "ledger",
    });
    sting(treasury < 20 ? "bad" : "ok");
    get().persist();
  },

  planExpedition: (partial) => {
    const cur =
      get().expedition ??
      ({
        dwarfIds: [],
        area: "limestone",
        food: 18,
        tools: "mixed",
        status: "planning",
      } satisfies Expedition);
    set({ expedition: { ...cur, ...partial, status: "planning" }, overlay: "expedition" });
  },

  sendExpedition: () => {
    const s = get();
    const ex = s.expedition;
    if (!ex || ex.dwarfIds.length === 0) return;
    const crew = s.dwarves.filter((d) => ex.dwarfIds.includes(d.id));
    const result = resolveExpedition(crew, ex.area, ex.tools, ex.food, s.wages, s.day);
    for (const id of ex.dwarfIds) {
      const body = runtime.dwarves.get(id);
      if (body) {
        body.dest = { x: 8, z: -40 };
        body.anim = "walk";
      }
    }
    set({
      expedition: { ...ex, status: "out", result },
      overlay: null,
      prompt: "The first expedition is underground. Watch, or keep walking.",
      log: addLog(s.log, s.day, `Expedition of ${crew.length} sent to the ${ex.area} face.`, "borrin"),
    });
    window.setTimeout(() => {
      const now = get();
      if (!now.expedition?.result) return;
      set({
        expedition: { ...now.expedition, status: "returned" },
        haulOpen: true,
        prompt: "Carts on the path. Borrin is already doing arithmetic.",
      });
      sting("haul");
    }, 5200);
  },

  collectHaul: () => {
    const s = get();
    const r = s.expedition?.result;
    if (!r) return;
    const inventory = {
      ...s.inventory,
      limestone: s.inventory.limestone + r.limestone,
      ironRock: s.inventory.ironRock + r.ironRock,
      copperOre: s.inventory.copperOre + r.copperOre,
      constructionStone: s.inventory.constructionStone + r.constructionStone,
      food: Math.max(0, s.inventory.food - 3),
    };
    const knowledge = { ...s.knowledge };
    knowledge.limestone = "identified";
    knowledge.hematite = "identified";
    if (r.copperOre > 0) knowledge.copper = "identified";
    const log = addLog(
      addLog(s.log, s.day, `First haul. Gross ${r.gross}c. After the mountain ate, ${r.remaining}c.`, r.remaining > 0 ? "good" : "bad"),
      s.day,
      "Borrin: revenue is not wealth.",
      "borrin",
    );
    set({
      inventory,
      treasury: s.treasury + r.remaining,
      knowledge,
      haulOpen: false,
      expedition: { ...(s.expedition as Expedition), status: "returned" },
      discoveries: { ...s.discoveries, firstHaul: true, treasury: true },
      log,
      overlay: "ledger",
    });
    sting(r.remaining > 0 ? "ok" : "bad");
    get().persist();
  },

  nextMorning: () => {
    const s = get();
    if (!s.dayResolved) return;
    const day = s.day + 1;
    set({
      day,
      dayResolved: false,
      hour: 7,
      dwarves: s.dwarves.map((d) => ({ ...d, assignedJobId: null })),
      overlay: null,
      log: addLog(s.log, day, `Morning of day ${day}. The mountain has not moved.`),
      prompt: "Assign the day's labor. You still cannot do everything.",
    });
    get().persist();
  },

  snapshot: () => {
    const s = get();
    const dwarves = s.dwarves.map((d) => {
      const b = runtime.dwarves.get(d.id);
      return b ? { ...d, x: b.x, z: b.z, yaw: b.yaw, anim: b.anim } : d;
    });
    return {
      version: 1,
      day: s.day,
      hour: s.hour,
      treasury: s.treasury,
      wages: s.wages,
      settlement: s.settlement,
      housingQuality: s.housingQuality,
      dwarves,
      buildings: s.buildings,
      inventory: s.inventory,
      knowledge: s.knowledge,
      discoveries: s.discoveries,
      log: s.log,
      expedition: s.expedition,
      dayResolved: s.dayResolved,
      jobsDone: s.jobsDone,
    };
  },

  persist: () => writeSave(get().snapshot()),
}));

export function hasSave() {
  return !!readSave();
}
