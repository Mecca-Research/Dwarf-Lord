let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let wind: AudioBufferSourceNode | null = null;
let started = false;

export function isMuted() {
  return master ? master.gain.value < 0.01 : true;
}

export async function unlockAudio() {
  if (started) return;
  started = true;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);

  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;
  const gain = ctx.createGain();
  gain.gain.value = 0.18;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  noise.start();
  wind = noise;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 62;
  const og = ctx.createGain();
  og.gain.value = 0.03;
  osc.connect(og);
  og.connect(master);
  osc.start();

  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  });
}

export function setMuted(muted: boolean) {
  if (!master || !ctx) return;
  master.gain.setTargetAtTime(muted ? 0 : 0.22, ctx.currentTime, 0.05);
}

export function sting(kind: "ok" | "bad" | "haul") {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = kind === "bad" ? "sawtooth" : "triangle";
  o.frequency.value = kind === "haul" ? 220 : kind === "ok" ? 330 : 110;
  g.gain.value = 0.0001;
  o.connect(g);
  g.connect(master);
  const t = ctx.currentTime;
  g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === "haul" ? 0.8 : 0.25));
  if (kind === "haul") o.frequency.exponentialRampToValueAtTime(440, t + 0.4);
  o.start();
  o.stop(t + 1);
}
