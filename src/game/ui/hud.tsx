import {
  BookOpen,
  Coins,
  Mountain,
  Pickaxe,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { JOBS, RESOURCES, TOTAL_CAPABILITY, WORLD_STAGES } from "../data/catalog";
import { DIALOGUE } from "../data/dialogue";
import { assignedCap, usefulWork, workers } from "../sim";
import { hasSave, useGame } from "../store";
import { setMuted as setAudioMuted, unlockAudio } from "../audio";
import { runtime } from "../runtime";

function Panel({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={
        "pointer-events-auto absolute inset-x-3 top-16 z-20 mx-auto max-h-[min(78vh,720px)] overflow-hidden rounded-xl border border-border bg-bg-panel shadow-panel " +
        (wide ? "max-w-3xl" : "max-w-lg")
      }
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-sm font-semibold tracking-wide text-fg">{title}</h2>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-md text-fg-muted hover:text-fg"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="max-h-[min(68vh,640px)] overflow-y-auto px-4 py-3 text-sm leading-relaxed text-fg-muted">
        {children}
      </div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  primary,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        "min-h-11 rounded-md px-4 text-sm font-medium transition-transform duration-150 ease-out enabled:active:scale-[0.98] disabled:opacity-40 " +
        (primary
          ? "bg-accent text-accent-fg hover:brightness-110"
          : "border border-border bg-bg-subtle text-fg hover:border-border-strong")
      }
    >
      {children}
    </button>
  );
}

export function TitleScreen() {
  const begin = useGame((s) => s.begin);
  const continueSave = useGame((s) => s.continueSave);
  const newGame = useGame((s) => s.newGame);
  const [saved, setSaved] = useState(false);
  useEffect(() => setSaved(hasSave()), []);

  async function start(fn: () => void) {
    await unlockAudio();
    fn();
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-end overflow-hidden bg-bg">
      <img
        src={asset("/art/camp-vista.jpg")}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20" />
      <div className="relative z-10 flex w-full max-w-xl flex-col gap-5 px-6 pb-12 pt-24">
        <p className="font-display text-xs tracking-[0.28em] text-accent uppercase">A mining company, on paper</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-fg sm:text-5xl">Dwarf Lord</h1>
        <p className="max-w-md text-base leading-relaxed text-fg-muted">
          The last of the family fortune. A ruined pit that used to be a slave colony. Sixteen exhausted
          dwarves, four picks worth using, and a steward who has outlived every owner.
        </p>
        <p className="text-sm text-fg-subtle">You bought a hole in a mountain.</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Btn primary onClick={() => start(saved ? continueSave : begin)}>
            {saved ? "Continue" : "Walk the road"}
          </Btn>
          {saved ? <Btn onClick={() => start(newGame)}>New operation</Btn> : null}
        </div>
        <p className="text-xs text-fg-subtle">
          WASD or drag to walk. Click the ground. E to speak. Q / R rotate the view. Scroll to zoom.
        </p>
      </div>
    </div>
  );
}

export function Hud() {
  const overlay = useGame((s) => s.overlay);
  const setOverlay = useGame((s) => s.setOverlay);
  const dialogue = useGame((s) => s.dialogue);
  const discoveries = useGame((s) => s.discoveries);
  const prompt = useGame((s) => s.prompt);
  const day = useGame((s) => s.day);
  const treasury = useGame((s) => s.treasury);
  const settlement = useGame((s) => s.settlement);
  const muted = useGame((s) => s.muted);
  const setMuted = useGame((s) => s.setMuted);
  const haulOpen = useGame((s) => s.haulOpen);
  const dayResolved = useGame((s) => s.dayResolved);
  const nextMorning = useGame((s) => s.nextMorning);
  const stage = WORLD_STAGES.find((w) => w.id === settlement);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-fg">
      <header className="pointer-events-auto flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="rounded-lg border border-border bg-bg-panel/90 px-3 py-2">
          <p className="font-display text-[11px] tracking-widest text-fg-subtle uppercase">Day {day}</p>
          <p className="font-display text-sm text-fg">{stage?.name ?? "Ruins"}</p>
          <p className="font-mono text-xs tabular-nums text-accent">
            {discoveries.treasury || discoveries.workforce ? `${treasury} crowns` : "Treasury: uncounted"}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <IconBtn label="Mute" onClick={() => { setAudioMuted(!muted); setMuted(!muted); }}>
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </IconBtn>
          {discoveries.workforce ? (
            <>
              <IconBtn label="Labor" onClick={() => setOverlay(overlay === "labor" ? null : "labor")}>
                <Users className="size-4" />
              </IconBtn>
              <IconBtn label="Ledger" onClick={() => setOverlay(overlay === "ledger" ? null : "ledger")}>
                <Coins className="size-4" />
              </IconBtn>
              <IconBtn label="Geology" onClick={() => setOverlay(overlay === "geology" ? null : "geology")}>
                <Mountain className="size-4" />
              </IconBtn>
              <IconBtn label="Expedition" onClick={() => setOverlay(overlay === "expedition" ? null : "expedition")}>
                <Pickaxe className="size-4" />
              </IconBtn>
            </>
          ) : null}
          <IconBtn label="Chronicle" onClick={() => setOverlay(overlay === "chronicle" ? null : "chronicle")}>
            <BookOpen className="size-4" />
          </IconBtn>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="max-w-xl rounded-md border border-border bg-bg-panel/90 px-3 py-2 text-center text-sm text-fg-muted">
          {prompt}
        </p>
        {discoveries.workforce ? (
          <div className="pointer-events-auto flex flex-wrap justify-center gap-2">
            <Btn onClick={() => setOverlay("labor")}>Pit board</Btn>
            <Btn onClick={() => setOverlay("expedition")}>First haul</Btn>
            {dayResolved ? (
              <Btn primary onClick={nextMorning}>
                Next morning
              </Btn>
            ) : (
              <Btn primary onClick={() => useGame.getState().resolveDay()}>
                Call the day's labor
              </Btn>
            )}
          </div>
        ) : (
          <p className="text-xs text-fg-subtle">Find the old dwarf in the chair. Nobody else is keeping books.</p>
        )}
      </div>

      <MobileStick />

      {dialogue ? <DialogueBox /> : null}
      {overlay === "labor" ? <LaborPanel /> : null}
      {overlay === "ledger" ? <LedgerPanel /> : null}
      {overlay === "geology" ? <GeologyPanel /> : null}
      {overlay === "expedition" ? <ExpeditionPanel /> : null}
      {overlay === "chronicle" ? <ChroniclePanel /> : null}
      {overlay === "workforce" ? <LaborPanel /> : null}
      {haulOpen ? <HaulModal /> : null}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-lg border border-border bg-bg-panel/90 text-fg hover:border-border-strong"
    >
      {children}
    </button>
  );
}

function DialogueBox() {
  const dialogue = useGame((s) => s.dialogue)!;
  const dwarves = useGame((s) => s.dwarves);
  const reply = useGame((s) => s.reply);
  const lines = DIALOGUE[dialogue.key] ?? [];
  const line = lines[dialogue.step];
  if (!line) return null;
  const dwarf = dwarves.find((d) => d.id === dialogue.speakerId);
  const portrait = line.portrait ?? dwarf?.portrait ?? asset("/portraits/laborer.jpg");
  const replies = line.replies ?? [{ label: "Continue" }];

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-2xl gap-3 rounded-xl border border-border bg-bg-panel p-3 shadow-panel sm:p-4">
        <img
          src={portrait}
          alt=""
          crossOrigin="anonymous"
          className="hidden h-28 w-20 shrink-0 rounded-md object-cover object-top sm:block"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-xs tracking-widest text-accent uppercase">{line.speaker}</p>
          <p className="mt-1 text-sm leading-relaxed text-fg">{line.text}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {replies.map((r) => (
              <Btn key={r.label} primary onClick={() => reply(r.next, r.discover)}>
                {r.label}
              </Btn>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LaborPanel() {
  const dwarves = useGame((s) => s.dwarves);
  const assignJob = useGame((s) => s.assignJob);
  const wages = useGame((s) => s.wages);
  const setWages = useGame((s) => s.setWages);
  const setOverlay = useGame((s) => s.setOverlay);
  const cap = assignedCap(dwarves);
  const crew = workers(dwarves);

  return (
    <Panel title="Pit board" onClose={() => setOverlay(null)} wide>
      <p className="mb-3 text-fg">
        Capability committed <span className="font-mono tabular-nums text-accent">{cap}</span> / {TOTAL_CAPABILITY}.
        You cannot do everything.
      </p>
      <label className="mb-4 flex items-center justify-between gap-3 text-fg">
        Daily wage
        <span className="font-mono tabular-nums text-accent">{wages}c</span>
      </label>
      <input
        type="range"
        min={0}
        max={12}
        value={wages}
        onChange={(e) => setWages(Number(e.target.value))}
        className="mb-5 w-full accent-accent"
      />
      <p className="mb-4 text-xs">
        Starvation wages fatten the ledger this week and kill the town. Generous wages shrink margins and wake a
        consumer economy. There is no Low / Medium / High. There is a number, and a consequence.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {JOBS.map((job) => {
          const on = crew.filter((d) => d.assignedJobId === job.id);
          const used = on.reduce((s, d) => s + d.capability, 0);
          return (
            <div key={job.id} className="rounded-md border border-border bg-bg-subtle p-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-sm text-fg">{job.name}</h3>
                <span className="font-mono text-xs tabular-nums">
                  {used}/{job.capabilityRequired}
                </span>
              </div>
              <p className="mt-1 text-xs">{job.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {crew.map((d) => {
                  const active = d.assignedJobId === job.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => assignJob(d.id, active ? null : job.id)}
                      className={
                        "rounded-sm px-2 py-1 text-[11px] " +
                        (active ? "bg-accent text-accent-fg" : "bg-bg-panel text-fg-muted")
                      }
                    >
                      {d.name.split(" ")[0]} {d.capability}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function LedgerPanel() {
  const inventory = useGame((s) => s.inventory);
  const treasury = useGame((s) => s.treasury);
  const log = useGame((s) => s.log);
  const housing = useGame((s) => s.housingQuality);
  const discoveries = useGame((s) => s.discoveries);
  const setOverlay = useGame((s) => s.setOverlay);
  const dwarves = useGame((s) => s.dwarves);
  const wages = useGame((s) => s.wages);
  const bill = wages * workers(dwarves).length;

  return (
    <Panel title="Company ledger" onClose={() => setOverlay(null)}>
      {!discoveries.workforce ? (
        <p>Nobody has been keeping books. Find the steward.</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 font-mono text-xs tabular-nums">
            <Stat k="Treasury" v={`${treasury}c`} />
            <Stat k="Wage bill / day" v={`${bill}c`} />
            <Stat k="Housing" v={`${Math.round(housing * 100)}%`} />
            <Stat k="Food" v={`${inventory.food}`} />
            <Stat k="Timber" v={`${inventory.timber}`} />
            <Stat k="Limestone" v={`${inventory.limestone}`} />
            <Stat k="Iron-rich rock" v={`${inventory.ironRock}`} />
            <Stat k="Copper ore" v={`${inventory.copperOre}`} />
            <Stat k="Building stone" v={`${inventory.constructionStone}`} />
            <Stat k="Sound picks" v={`${inventory.picksSound}`} />
          </div>
          <h3 className="font-display mb-2 text-xs tracking-widest text-fg uppercase">Stoneledger's notes</h3>
          <ul className="space-y-2">
            {log.slice(0, 12).map((e) => (
              <li
                key={e.id}
                className={
                  e.tone === "good"
                    ? "text-moss"
                    : e.tone === "bad"
                      ? "text-danger"
                      : e.tone === "borrin"
                        ? "text-accent"
                        : ""
                }
              >
                <span className="font-mono text-[11px] text-fg-subtle">D{e.day}</span> {e.text}
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-border bg-bg-subtle px-2 py-2">
      <div className="text-[10px] tracking-wide text-fg-subtle uppercase">{k}</div>
      <div className="text-fg">{v}</div>
    </div>
  );
}

function GeologyPanel() {
  const knowledge = useGame((s) => s.knowledge);
  const setOverlay = useGame((s) => s.setOverlay);
  return (
    <Panel title="The mountain" onClose={() => setOverlay(null)} wide>
      <p className="mb-3">
        The ore never changes. Your civilization's ability to see it does. Unknown veins sell as grey rock until
        a surveyor learns a name.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {RESOURCES.map((r) => {
          const k = knowledge[r.id] ?? r.startKnowledge;
          const hidden = k === "hidden";
          const name =
            k === "hidden"
              ? "—"
              : k === "unknown"
                ? "Unidentified rock"
                : k === "rumor"
                  ? `Rumor: ${r.name}`
                  : r.name;
          return (
            <div key={r.id} className="rounded-md border border-border bg-bg-subtle p-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-sm text-fg">{hidden ? "Unmapped" : name}</h3>
                <span className="text-[10px] tracking-wide text-fg-subtle uppercase">
                  {hidden ? "hidden" : k} · T{r.tier}
                </span>
              </div>
              {!hidden ? (
                <p className="mt-1 text-xs">
                  {r.kind === "fantasy" && k !== "identified" && k !== "mastered"
                    ? "A note in a margin. Not yet geology."
                    : `${r.host}. ${r.uses}. ${r.depthMin}–${r.depthMax} m.`}
                </p>
              ) : (
                <p className="mt-1 text-xs">No survey, no rumor, no name.</p>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ExpeditionPanel() {
  const dwarves = useGame((s) => s.dwarves);
  const expedition = useGame((s) => s.expedition);
  const plan = useGame((s) => s.planExpedition);
  const send = useGame((s) => s.sendExpedition);
  const setOverlay = useGame((s) => s.setOverlay);
  const inv = useGame((s) => s.inventory);
  const crew = workers(dwarves);
  const selected = expedition?.dwarfIds ?? [];
  const area = expedition?.area ?? "limestone";
  const tools = expedition?.tools ?? "mixed";
  const food = expedition?.food ?? 18;

  function toggle(id: string) {
    const set = new Set(selected);
    if (set.has(id)) set.delete(id);
    else if (set.size < 6) set.add(id);
    plan({ dwarfIds: [...set], area, tools, food });
  }

  const preview = useMemo(() => {
    const people = crew.filter((d) => selected.includes(d.id));
    const work = people.reduce((s, d) => s + usefulWork(d, "mining", 0.42), 0);
    return { n: people.length, work: work.toFixed(1) };
  }, [crew, selected]);

  return (
    <Panel title="The first mining run" onClose={() => setOverlay(null)} wide>
      <p className="mb-3 text-fg">
        Borrin: we have picks enough for six. Four worth using. Choose the faces, the food, and which fools go
        underground.
      </p>
      {expedition?.status === "out" ? (
        <p className="text-accent">They are in the hole. Watch the adit, or keep managing the camp.</p>
      ) : expedition?.status === "returned" ? (
        <p>Carts are back. Close this and take the haul.</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-1">
            {crew.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => toggle(d.id)}
                className={
                  "rounded-sm px-2 py-1 text-[11px] " +
                  (selected.includes(d.id) ? "bg-accent text-accent-fg" : "bg-bg-subtle text-fg-muted")
                }
              >
                {d.name.split(" ")[0]} · mine {d.skills.mining.toFixed(2)}
              </button>
            ))}
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <label className="text-xs">
              Face
              <select
                className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg-subtle px-2 text-fg"
                value={area}
                onChange={(e) => plan({ dwarfIds: selected, area: e.target.value as "limestone" | "iron", tools, food })}
              >
                <option value="limestone">Shallow limestone</option>
                <option value="iron">Surface iron</option>
              </select>
            </label>
            <label className="text-xs">
              Tools
              <select
                className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg-subtle px-2 text-fg"
                value={tools}
                onChange={(e) =>
                  plan({
                    dwarfIds: selected,
                    area,
                    tools: e.target.value as "cracked" | "mixed" | "sound",
                    food,
                  })
                }
              >
                <option value="cracked">Cracked only</option>
                <option value="mixed">Mixed ({inv.picksSound} sound)</option>
                <option value="sound">Sound picks only</option>
              </select>
            </label>
          </div>
          <label className="mb-3 block text-xs">
            Food allocation · {food}c
            <input
              type="range"
              min={0}
              max={30}
              value={food}
              onChange={(e) => plan({ dwarfIds: selected, area, tools, food: Number(e.target.value) })}
              className="mt-1 w-full accent-accent"
            />
          </label>
          <p className="mb-4 text-xs">
            {preview.n} selected. Predicted useful work {preview.work}. Untrained hands on iron will smash more than
            they recover.
          </p>
          <Btn primary disabled={selected.length === 0} onClick={send}>
            Send them in
          </Btn>
        </>
      )}
    </Panel>
  );
}

function ChroniclePanel() {
  const settlement = useGame((s) => s.settlement);
  const setOverlay = useGame((s) => s.setOverlay);
  return (
    <Panel title="World stages & asset plan" onClose={() => setOverlay(null)} wide>
      <p className="mb-3">
        Town cameras stay close: larger dwarves, denser props, a short walk. The mine pulls back: smaller figures,
        timbered tunnels, a sprawl you feel in the scale. Each settlement phase replaces ruins with history instead of
        deleting them.
      </p>
      <ol className="space-y-3">
        {WORLD_STAGES.map((s, i) => (
          <li
            key={s.id}
            className={
              "rounded-md border p-3 " +
              (s.id === settlement ? "border-accent bg-bg-subtle" : "border-border bg-bg")
            }
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-display text-sm text-fg">
                {i + 1}. {s.name}
              </h3>
              <span className="text-[10px] tracking-wide text-fg-subtle uppercase">
                {s.playable ? "in this slice" : "later stage"}
              </span>
            </div>
            <p className="mt-1 text-xs">{s.character}</p>
            <p className="mt-1 text-[11px] text-fg-subtle">{s.assetBrief}</p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function HaulModal() {
  const expedition = useGame((s) => s.expedition);
  const collect = useGame((s) => s.collectHaul);
  const r = expedition?.result;
  if (!r) return null;
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-bg/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-bg-panel p-5 shadow-panel">
        <p className="font-display text-xs tracking-widest text-accent uppercase">The first haul</p>
        <h2 className="font-display mt-1 text-xl text-fg">Carts on the path</h2>
        <ul className="mt-4 space-y-1 font-mono text-sm tabular-nums text-fg">
          <li>Limestone {r.limestone}</li>
          <li>Iron-rich rock {r.ironRock}</li>
          <li>Copper ore {r.copperOre}</li>
          <li>Construction stone {r.constructionStone}</li>
          <li className="pt-2 text-accent">Gross {r.gross}c</li>
          <li>Wages −{r.wages}c</li>
          <li>Food −{r.food}c</li>
          <li>Tool repair −{r.toolRepair}c</li>
          <li>Dormitory −{r.dorm}c</li>
          <li>Cart −{r.cart}c</li>
          <li className={r.remaining >= 0 ? "text-moss" : "text-danger"}>Remaining {r.remaining}c</li>
        </ul>
        <p className="mt-4 text-sm text-fg-muted">
          Borrin does not celebrate. Revenue is not wealth. The mountain has already billed you for existing.
        </p>
        <div className="mt-5">
          <Btn primary onClick={collect}>
            Enter it in the book
          </Btn>
        </div>
      </div>
    </div>
  );
}

function MobileStick() {
  const setJoy = useGame((s) => s.setJoy);
  const dialogue = useGame((s) => s.dialogue);
  const origin = useRef<{ x: number; y: number } | null>(null);
  if (dialogue) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex items-end justify-between px-3 sm:hidden">
      <div
        className="pointer-events-auto relative size-28 rounded-full border border-border bg-bg-panel/70"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const r = e.currentTarget.getBoundingClientRect();
          origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }}
        onPointerMove={(e) => {
          if (!origin.current) return;
          const dx = (e.clientX - origin.current.x) / 48;
          const dy = (e.clientY - origin.current.y) / 48;
          const m = Math.hypot(dx, dy) || 1;
          const nx = dx / Math.max(1, m);
          const ny = -dy / Math.max(1, m);
          setJoy(nx, ny);
        }}
        onPointerUp={() => {
          origin.current = null;
          setJoy(0, 0);
        }}
        onPointerCancel={() => {
          origin.current = null;
          setJoy(0, 0);
        }}
      >
        <span className="sr-only">Move</span>
      </div>
      <button
        type="button"
        className="pointer-events-auto min-h-14 min-w-24 rounded-lg border border-border bg-accent px-4 font-display text-sm text-accent-fg"
        onClick={() => {
          const ev = new KeyboardEvent("keydown", { code: "KeyE" });
          runtime.keys.add("KeyE");
          window.setTimeout(() => runtime.keys.delete("KeyE"), 80);
          void ev;
        }}
      >
        Interact
      </button>
    </div>
  );
}

