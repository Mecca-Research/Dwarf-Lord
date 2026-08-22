import { JOBS } from "./data/catalog";
import type { Dwarf, DwarfAnim, HaulResult, Inventory, JobDef, SkillKey } from "./types";

export const QUALITY_CAMP = 0.45;
export const QUALITY_MINE = 0.38;

export function usefulWork(d: Dwarf, skill: SkillKey, quality: number) {
  return d.capability * d.skills[skill] * d.energy * d.motivation * d.condition * quality;
}

export function rand(seed: number) {
  const x = Math.sin(seed * 999.123) * 10000;
  return x - Math.floor(x);
}

export function range(seed: number, a: number, b: number) {
  return Math.round(a + (b - a) * rand(seed));
}

export function assignedCap(dwarves: Dwarf[]) {
  return dwarves.filter((d) => d.assignedJobId && !d.isSteward).reduce((s, d) => s + d.capability, 0);
}

export function workers(dwarves: Dwarf[]) {
  return dwarves.filter((d) => !d.isSteward);
}

export function resolveJobs(
  dwarves: Dwarf[],
  assigned: Record<string, string>,
  day: number,
): {
  dwarves: Dwarf[];
  inventoryDelta: Partial<Inventory>;
  buildingRepair: Record<string, number>;
  morale: number;
  notes: string[];
} {
  const inventoryDelta: Partial<Inventory> = {};
  const buildingRepair: Record<string, number> = {};
  const notes: string[] = [];
  let morale = 0;

  const next = dwarves.map((d) => ({ ...d, assignedJobId: assigned[d.id] ?? null }));

  for (const job of JOBS) {
    const crew = next.filter((d) => d.assignedJobId === job.id);
    if (!crew.length) continue;
    const cap = crew.reduce((s, d) => s + d.capability, 0);
    const quality = job.zone === "mine" ? QUALITY_MINE : QUALITY_CAMP;
    const work = crew.reduce((s, d) => s + usefulWork(d, job.skill, quality), 0);
    const fill = Math.min(1.25, cap / job.capabilityRequired);
    const skillAvg = crew.reduce((s, d) => s + d.skills[job.skill], 0) / crew.length;

    if (job.outputs) {
      let i = 0;
      for (const [k, [lo, hi]] of Object.entries(job.outputs)) {
        const amt = Math.max(0, Math.round(range(day * 17 + i, lo, hi) * fill * (0.65 + skillAvg * 0.5)));
        inventoryDelta[k as keyof Inventory] = (inventoryDelta[k as keyof Inventory] ?? 0) + amt;
        i += 1;
      }
    }
    if (job.repair && job.buildingId) {
      buildingRepair[job.buildingId] = (buildingRepair[job.buildingId] ?? 0) + job.repair * fill;
    }
    if (job.morale) morale += job.morale * fill;

    if (skillAvg < 0.4 && job.skill === "mining") {
      notes.push(`${job.name}: untrained hands wasted stone. Output cut.`);
    } else {
      notes.push(`${job.name}: ${crew.length} dwarf${crew.length === 1 ? "" : "s"}, ${cap} capability.`);
    }

    for (const d of crew) {
      d.experience += 1 + d.skills[job.skill];
      d.energy = Math.max(0.2, d.energy - 0.18 + d.discipline * 0.05);
      d.skills = { ...d.skills, [job.skill]: Math.min(1.25, d.skills[job.skill] + 0.02) };
    }
  }

  for (const d of next) {
    if (d.isSteward) continue;
    if (!d.assignedJobId) {
      d.motivation = Math.max(0.08, d.motivation - 0.03);
      d.energy = Math.min(1, d.energy + 0.12);
    }
  }

  return { dwarves: next, inventoryDelta, buildingRepair, morale, notes };
}

export function resolveExpedition(
  crew: Dwarf[],
  area: "limestone" | "iron",
  tools: "cracked" | "mixed" | "sound",
  foodSpend: number,
  wagesPer: number,
  day: number,
): HaulResult {
  const cap = crew.reduce((s, d) => s + d.capability, 0);
  const mineSkill = crew.reduce((s, d) => s + d.skills.mining, 0) / Math.max(1, crew.length);
  const toolQ = tools === "sound" ? 0.95 : tools === "mixed" ? 0.72 : 0.48;
  const foodQ = Math.min(1, foodSpend / 18);
  const work =
    crew.reduce((s, d) => s + usefulWork(d, "mining", 0.42 * toolQ * (0.7 + foodQ * 0.3)), 0) || 1;
  const scale = (work / 12) * (area === "iron" ? 0.85 : 1);

  const limestone = range(day + 1, 8, 16) + Math.round(scale * (area === "limestone" ? 6 : 2));
  const ironRock = Math.max(0, range(day + 2, 3, 9) + Math.round(scale * (area === "iron" ? 5 : 1) - (mineSkill < 0.5 ? 2 : 0)));
  const copperOre = mineSkill > 0.55 ? range(day + 3, 1, 3) : range(day + 3, 0, 2);
  const constructionStone = range(day + 4, 12, 22);
  const intactBonus = mineSkill > 0.8 ? 40 : 0;

  const gross = limestone * 3 + ironRock * 11 + copperOre * 18 + constructionStone * 2 + intactBonus;
  const wages = Math.round(wagesPer * crew.length + 47 * (wagesPer / 4));
  const food = foodSpend;
  const toolRepair = tools === "sound" ? 14 : tools === "mixed" ? 22 : 31;
  const dorm = 35;
  const cart = 16;
  const remaining = gross - wages - food - toolRepair - dorm - cart;

  return {
    limestone,
    ironRock,
    copperOre,
    constructionStone,
    gross,
    wages,
    food,
    toolRepair,
    dorm,
    cart,
    remaining,
    intactBonus,
  };
}

export function restNight(dwarves: Dwarf[], housing: number, fed: boolean, wagesFair: number) {
  return dwarves.map((d) => {
    if (d.isSteward) {
      return { ...d, energy: Math.min(1, d.energy + 0.2) };
    }
    const energy = Math.min(1, 0.35 + housing * 0.45 + (fed ? 0.12 : 0) + d.condition * 0.1);
    const motivation = Math.min(
      0.95,
      d.motivation * 0.7 + 0.08 + housing * 0.2 + wagesFair * 0.18 + (fed ? 0.05 : -0.04),
    );
    const condition = Math.min(1, d.condition + (housing > 0.5 ? 0.04 : -0.02) + (fed ? 0.02 : -0.03));
    return { ...d, energy, motivation, condition, anim: (d.sitOnStart ? "sit" : "idle") as DwarfAnim };
  });
}

export function jobById(id: string): JobDef | undefined {
  return JOBS.find((j) => j.id === id);
}
