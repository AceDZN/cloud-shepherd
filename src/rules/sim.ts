// The deterministic cloud simulation. Rendering reads this state; it never writes it.
import {
  LAPSE_C_PER_100M, capacity, cellInfluence, diurnal, landSeaContrast, precipKind, seaBreezeCells,
  tempAt, windAt, type PressureCell, type PrecipKind,
} from './atmosphere.ts';
import { MAP_H_KM, MAP_W_KM, groundHeight, toLonLat, waterAt, type Water } from './geo.ts';
import type {
  Circle, FailReason, LevelDef, PlanChoice, PrecipEvent, StormEnv, Target, TrackPoint,
} from './types.ts';

export const STEP = 1 / 30;
export const CLEARANCE_M = 220;
export const SOAK_MAX_M = 900;
export const W_MIN = 0.8;
export const POUR_RATE = 0.22;
export const MM_PER_UNIT = 25;
export const STEER_KMS = 0.5;
export const PUFF_KMS = 3.0;
export const PUFF_COOLDOWN = 4;
export const MIX_RH = 0.65;
export const TOKEN_CELL = { s: 1.2, r: 72 };

export interface Input { steerX: number; steerY: number; pour: boolean; puff: boolean; season: boolean }
export const NO_INPUT: Input = { steerX: 0, steerY: 0, pour: false, puff: false, season: false };

export interface Cloud {
  x: number; y: number; z: number;
  /** terrain envelope the air is following (m) */
  hEnv: number;
  /** extra height from rising air under lows / heated land (m) */
  E: number;
  W: number;
  T: number;
  groundT: number;
  ground: number;
  surface: Water;
  rh: number;
  excess: number;
  wind: { u: number; v: number };
  vx: number; vy: number;
  puffX: number; puffY: number; puffCd: number;
  pouring: boolean;
}

export type Feedback =
  | { key: 'dryPour'; rh: number }
  | { key: 'slush'; target: string }
  | { key: 'snowOnRain'; target: string }
  | { key: 'flood'; wadi: string }
  | { key: 'khamsin' }
  | { key: 'saturated' }
  | { key: 'targetDone'; target: string }
  | { key: 'stormEnd'; storm: number }
  | { key: 'seasonTurn' }
  | { key: 'wasted' };

export interface Run {
  level: LevelDef;
  plan: PlanChoice;
  storm: number;
  env: StormEnv;
  cells: PressureCell[];
  t: number;
  tTotal: number;
  cloud: Cloud;
  progress: Record<string, number>;
  perStorm: Record<string, number[]>;
  drainActive: Record<string, boolean>;
  absorbed: number;
  poured: number;
  wasted: number;
  dissipated: number;
  pouredByKind: Record<PrecipKind, number>;
  events: PrecipEvent[];
  track: TrackPoint[];
  wadiLoad: Record<string, number>;
  floods: string[];
  status: 'flying' | 'won' | 'failed';
  failReason?: FailReason;
  feedback: Feedback[];
  seasonTurnAt: number | null;
  seasonTurned: boolean;
  khamsinExposure: number;
  hintUsed: boolean;
  maxRh: number;
  lastDryPour: number;
  stormSummaries: { storm: number; poured: number; dried: boolean }[];
}

export function inZones(zones: Circle[], x: number, y: number): boolean {
  for (const z of zones) if ((x - z.x) ** 2 + (y - z.y) ** 2 <= z.r * z.r) return true;
  return false;
}

export function effectiveCells(level: LevelDef, env: StormEnv, plan: PlanChoice): PressureCell[] {
  const cells = env.cells.map((c) => ({ ...c }));
  for (const tk of plan.tokens) {
    const slot = level.plan.slots?.find((s) => s.id === tk.slot);
    if (slot) cells.push({ kind: tk.kind, x: slot.x, y: slot.y, s: TOKEN_CELL.s, r: TOKEN_CELL.r });
  }
  if (env.breezeCoast) cells.push(...seaBreezeCells(env.hour, env.sunny, env.breezeCoast));
  return cells;
}

function envWithHour(env: StormEnv, plan: PlanChoice): StormEnv {
  if (plan.hour === undefined || plan.hour === env.hour) return env;
  return { ...env, hour: plan.hour, T0: env.T0 + diurnal(plan.hour) - diurnal(env.hour) };
}

function newCloud(env: StormEnv): Cloud {
  const g = groundHeight(env.start.x, env.start.y);
  const z = Math.max(g, 0) + CLEARANCE_M;
  const T = tempAt(env.T0, z);
  const W = env.start.W ?? capacity(T) * 0.8;
  return {
    x: env.start.x, y: env.start.y, z, hEnv: Math.max(g, 0), E: 0, W, T,
    groundT: tempAt(env.T0, Math.max(g, 0)), ground: g, surface: waterAt(env.start.x, env.start.y),
    rh: Math.min(1, W / capacity(T)), excess: 0, wind: { u: 0, v: 0 }, vx: 0, vy: 0,
    puffX: 0, puffY: 0, puffCd: 0, pouring: false,
  };
}

export function defaultPlan(level: LevelDef): PlanChoice {
  return { tokens: [], hour: level.plan.defaultHour };
}

export function createRun(level: LevelDef, plan: PlanChoice = defaultPlan(level)): Run {
  const env = envWithHour(level.storms[0], plan);
  const progress: Record<string, number> = {};
  const perStorm: Record<string, number[]> = {};
  for (const t of level.targets) { progress[t.id] = t.start ?? 0; perStorm[t.id] = level.storms.map(() => 0); }
  const run: Run = {
    level, plan, storm: 0, env, cells: effectiveCells(level, env, plan), t: 0, tTotal: 0,
    cloud: newCloud(env), progress, perStorm, drainActive: {}, absorbed: 0, poured: 0, wasted: 0,
    dissipated: 0, pouredByKind: { rain: 0, slush: 0, snow: 0 }, events: [], track: [], wadiLoad: {},
    floods: [], status: 'flying', feedback: [], seasonTurnAt: null, seasonTurned: false,
    khamsinExposure: 0, hintUsed: false, maxRh: 0, lastDryPour: -99, stormSummaries: [],
  };
  run.absorbed = run.cloud.W;
  for (const t of level.targets) if (t.drain) run.drainActive[t.id] = true;
  updateThermo(run);
  return run;
}

function southFactor(env: StormEnv, y: number, x: number): number {
  if (env.southDrying === false) return 0;
  const { lat } = toLonLat(x, y);
  return Math.max(0, Math.min(1.6, (31.3 - lat) / 0.8));
}

/** Khamsin strength at a point: full inside its zone, fading over 20 km at the edge, weak over the sea. */
function khamsinAt(env: StormEnv, x: number, y: number, overSea = false): number {
  if (!env.khamsin) return 0;
  let k = 0;
  for (const z of env.khamsin.zones) k = Math.max(k, Math.min(1, Math.max(0, (z.r - Math.hypot(x - z.x, y - z.y)) / 20)));
  return k * env.khamsin.strength * (overSea ? 0.3 : 1);
}

function updateThermo(run: Run) {
  const c = run.cloud, env = run.env;
  const boost = khamsinAt(env, c.x, c.y, c.surface !== 'land') * 9;
  c.T = tempAt(env.T0 + boost, c.z);
  const gh = Math.max(c.ground, c.surface === 'land' ? c.ground : c.ground);
  c.groundT = tempAt(env.T0 + boost, gh);
  const cap = capacity(c.T);
  c.rh = Math.min(1, c.W / cap);
  c.excess = Math.max(0, c.W - cap);
  if (c.rh > run.maxRh) run.maxRh = c.rh;
}

function requiredTargets(level: LevelDef): Target[] {
  return level.targets.filter((t) => !t.optional);
}

function targetCounts(t: Target, storm: number): boolean {
  return !t.storms || t.storms.includes(storm);
}

function accepts(t: Target, kind: PrecipKind): boolean {
  if (t.kind === 'water') return true;
  if (t.kind === 'rain') return kind !== 'snow';
  if (t.kind === 'snow') return kind === 'snow';
  return false;
}

export function targetMet(run: Run, t: Target): boolean {
  const v = run.progress[t.id];
  if (v < t.need) return false;
  if (t.max !== undefined && v > t.max) return false;
  return true;
}

export function allMet(run: Run): boolean {
  return requiredTargets(run.level).every((t) => targetMet(run, t));
}

function deposit(run: Run, p: number) {
  const c = run.cloud;
  const kind = precipKind(c.groundT);
  const mm = p * MM_PER_UNIT * (run.env.mmScale ?? 1);
  run.pouredByKind[kind] += p;
  run.events.push({ x: c.x, y: c.y, mm, kind, t: run.tTotal });
  if (run.events.length > 4000) run.events.splice(0, run.events.length - 4000);
  let useful = false;
  for (const t of run.level.targets) {
    if (t.kind === 'shade' || !targetCounts(t, run.storm) || !inZones(t.zones, c.x, c.y)) continue;
    if (accepts(t, kind)) {
      const before = targetMet(run, t);
      run.progress[t.id] += mm;
      run.perStorm[t.id][run.storm] += mm;
      if (!t.optional) useful = true;
      if (!before && targetMet(run, t)) run.feedback.push({ key: 'targetDone', target: t.id });
    } else if (t.kind === 'snow' && kind === 'slush') {
      pushOnce(run, { key: 'slush', target: t.id });
    } else if (t.kind === 'rain' && kind === 'snow') {
      pushOnce(run, { key: 'snowOnRain', target: t.id });
    }
  }
  if (!useful) run.wasted += p;
  for (const w of run.level.wadis ?? []) {
    if (inZones([w.zone], c.x, c.y)) {
      run.wadiLoad[w.id] = (run.wadiLoad[w.id] ?? 0) + mm;
      if (run.wadiLoad[w.id] > w.threshold && !run.floods.includes(w.id)) {
        run.floods.push(w.id);
        run.feedback.push({ key: 'flood', wadi: w.id });
        if (w.jeep) fail(run, 'flood');
      }
    }
  }
}

function pushOnce(run: Run, f: Feedback) {
  if (!run.feedback.some((g) => g.key === f.key)) run.feedback.push(f);
}

function fail(run: Run, reason: FailReason) {
  if (run.status !== 'flying') return;
  run.status = 'failed';
  run.failReason = reason;
}

function finishStorm(run: Run, dried: boolean) {
  run.stormSummaries.push({ storm: run.storm, poured: run.poured, dried });
  const last = run.storm >= run.level.storms.length - 1;
  if (last) {
    if (allMet(run)) run.status = 'won';
    else {
      const band = requiredTargets(run.level).some((t) => t.max !== undefined && run.progress[t.id] > t.max);
      fail(run, band ? 'band' : dried ? 'dried' : run.level.storms.length > 1 ? 'targets' : 'timeout');
    }
    return;
  }
  run.feedback.push({ key: 'stormEnd', storm: run.storm });
  run.storm += 1;
  run.env = envWithHour(run.level.storms[run.storm], run.plan);
  run.cells = effectiveCells(run.level, run.env, run.plan);
  run.t = 0;
  run.seasonTurnAt = null;
  run.seasonTurned = false;
  const keepAbsorbed = run.cloud.W;
  run.cloud = newCloud(run.env);
  // A new storm brings a new cloud; the old cloud's leftover vapour stays in the air.
  run.dissipated += keepAbsorbed;
  run.absorbed += run.cloud.W;
  updateThermo(run);
}

function turnSeason(run: Run) {
  const next = run.env.turnsInto;
  if (!next || run.seasonTurned) return;
  run.seasonTurned = true;
  run.feedback.push({ key: 'seasonTurn' });
  const { delay: _d, ...rest } = next;
  run.env = { ...run.env, ...rest, turnsInto: undefined };
  run.cells = effectiveCells(run.level, run.env, run.plan);
  // The new season's cooler air cannot hold all the summer vapour; the surplus mixes away.
  const c = run.cloud;
  const cap = capacity(tempAt(run.env.T0, c.z)) * 0.97;
  if (c.W > cap) { run.dissipated += c.W - cap; c.W = cap; }
  updateThermo(run);
}

/** Advance the simulation by one fixed step. */
export function step(run: Run, input: Input): void {
  if (run.status !== 'flying') return;
  const dt = STEP, c = run.cloud, env = run.env;
  run.t += dt;
  run.tTotal += dt;

  if (input.season && env.turnsInto && run.seasonTurnAt === null) run.seasonTurnAt = run.t + env.turnsInto.delay;
  if (run.seasonTurnAt !== null && !run.seasonTurned && run.t >= run.seasonTurnAt) turnSeason(run);

  // Wind: from ג to ל. The player can steer across or along it, never against it.
  const w = windAt(run.cells, c.x, c.y);
  c.wind = w;
  const sp = Math.hypot(w.u, w.v);
  let sx = input.steerX, sy = input.steerY;
  const sl = Math.hypot(sx, sy);
  if (sl > 1) { sx /= sl; sy /= sl; }
  let vx = w.u + sx * STEER_KMS, vy = w.v + sy * STEER_KMS;
  if (input.puff && c.puffCd <= 0) {
    let px = sx, py = sy;
    if (Math.hypot(px, py) < 0.1) { px = sp > 0.1 ? -w.v / sp : 0; py = sp > 0.1 ? w.u / sp : 1; }
    const pl = Math.hypot(px, py) || 1;
    c.puffX = (px / pl) * PUFF_KMS; c.puffY = (py / pl) * PUFF_KMS; c.puffCd = PUFF_COOLDOWN;
  }
  c.puffCd = Math.max(0, c.puffCd - dt);
  vx += c.puffX; vy += c.puffY;
  const decay = Math.exp(-2.2 * dt);
  c.puffX *= decay; c.puffY *= decay;
  if (sp > 0.4) {
    const ux = w.u / sp, uy = w.v / sp;
    const along = vx * ux + vy * uy, minAlong = 0.3 * sp;
    if (along < minAlong) { vx += ux * (minAlong - along); vy += uy * (minAlong - along); }
  } else {
    vx = w.u + sx * STEER_KMS * 0.6 + c.puffX; vy = w.v + sy * STEER_KMS * 0.6 + c.puffY;
  }
  c.vx = vx; c.vy = vy;
  c.x = Math.min(MAP_W_KM - 2, Math.max(2, c.x + vx * dt));
  c.y = Math.min(MAP_H_KM - 2, Math.max(2, c.y + vy * dt));

  // Height: air is forced up slopes, rises under lows and over heated land, sinks under highs,
  // and follows the ground back down on the lee side.
  c.ground = groundHeight(c.x, c.y);
  c.surface = waterAt(c.x, c.y);
  if (c.ground > c.hEnv) c.hEnv = c.ground;
  else c.hEnv += (c.ground - c.hEnv) * Math.min(1, 0.45 * dt);
  const lowInf = cellInfluence(run.cells, 'L', c.x, c.y);
  const highInf = cellInfluence(run.cells, 'H', c.x, c.y);
  const thermal = c.surface === 'land' ? Math.max(0, landSeaContrast(env.hour, env.sunny)) / 9 : 0;
  const south = southFactor(env, c.y, c.x);
  c.E += (60 * lowInf - 95 * highInf + 55 * thermal - 0.06 * c.E - 70 * south) * dt;
  // Summer: the subtropical high's sinking air caps how high anything can rise.
  c.E = Math.max(0, Math.min(env.season === 'summer' ? 250 : 1400, c.E));
  c.z = c.hEnv + CLEARANCE_M + c.E;
  updateThermo(run);

  // Evaporation over warm water: the cloud grows, but surface air stays a little below saturation.
  if (c.surface !== 'land' && c.z < Math.max(0, c.ground) + SOAK_MAX_M) {
    const lake = c.surface === 'kinneret' ? 0.5 : c.surface === 'deadsea' ? 0.35 : 1;
    const k = 0.35 * Math.min(1.4, Math.max(0.25, (env.seaT - 8) / 14)) * lake;
    // Cold air over a much warmer sea saturates quickly (showers can start over the water).
    const targetRh = env.season === 'summer'
      ? 0.78 // summer air under the subtropical high stays dry
      : Math.min(1.03, 0.9 + 0.009 * Math.max(0, env.seaT - c.T));
    const want = targetRh * capacity(c.T) * 1.0;
    if (c.W < want) {
      const add = (want - c.W) * k * dt;
      c.W += add; run.absorbed += add;
    }
  }

  // Drying: dry air mixes in when RH is low, in the khamsin, and in the desert south.
  let loss = 0;
  if (c.rh < MIX_RH) loss += 0.3 * (MIX_RH - c.rh) * c.W * dt;
  const kh = khamsinAt(env, c.x, c.y, c.surface !== 'land');
  if (kh > 0) {
    const exposure = c.z < 1500 ? 1 : 0.35;
    loss += 0.16 * kh * exposure * c.W * dt;
    run.khamsinExposure += kh * exposure * dt;
    if (exposure > 0.5) pushOnce(run, { key: 'khamsin' });
  }
  if (south > 0 && c.surface === 'land') loss += 0.11 * south * c.W * dt;
  // Sinking air under a strong high is warm and dry (the summer high over Israel).
  if (highInf > 0.5 && c.surface === 'land') loss += 0.07 * (highInf - 0.5) * c.W * dt;
  if (loss > 0) { c.W -= loss; run.dissipated += loss; }
  updateThermo(run);

  // Pour: only saturated air can drop rain or snow.
  c.pouring = input.pour;
  if (input.pour) {
    if (c.excess > 0) {
      const p = Math.min(c.excess, POUR_RATE * dt);
      c.W -= p; run.poured += p;
      deposit(run, p);
      updateThermo(run);
    } else if (run.tTotal - run.lastDryPour > 1.5) {
      run.lastDryPour = run.tTotal;
      run.feedback.push({ key: 'dryPour', rh: c.rh });
    }
  }

  // Shade targets count seconds with the cloud overhead.
  for (const t of run.level.targets) {
    if (t.kind === 'shade' && targetCounts(t, run.storm) && inZones(t.zones, c.x, c.y)) {
      const before = targetMet(run, t);
      run.progress[t.id] += dt;
      run.perStorm[t.id][run.storm] += dt;
      if (!before && targetMet(run, t)) run.feedback.push({ key: 'targetDone', target: t.id });
    }
    if (t.drain && run.drainActive[t.id]) {
      run.progress[t.id] = Math.max(0, run.progress[t.id] - t.drain * dt);
    }
    if (t.drain && t.redLine !== undefined && run.tTotal > 6 && run.progress[t.id] < t.redLine) fail(run, 'redline');
  }
  for (const k of Object.keys(run.wadiLoad)) run.wadiLoad[k] *= Math.exp(-0.25 * dt);

  if (Math.round(run.tTotal / dt) % 8 === 0) {
    run.track.push({ t: run.tTotal, x: c.x, y: c.y, z: c.z, T: c.T, rh: c.rh, W: c.W, storm: run.storm });
  }
  if (run.status !== 'flying') return;

  if (!run.level.evaluateAtEnd && allMet(run)) { run.status = 'won'; return; }
  const dried = c.W < W_MIN;
  if (dried || run.t >= env.duration) {
    if (dried) run.dissipated += c.W, (c.W = 0);
    if (run.level.storms.length === 1 && dried) { fail(run, 'dried'); return; }
    finishStorm(run, dried);
  }
}

export function stepFor(run: Run, input: Input, seconds: number) {
  const n = Math.round(seconds / STEP);
  for (let i = 0; i < n && run.status === 'flying'; i++) step(run, input);
}

/** Water accounting: everything absorbed is still in the cloud, fell, or mixed back into the air. */
export function waterBalance(run: Run) {
  return { absorbed: run.absorbed, held: run.cloud.W, poured: run.poured, dissipated: run.dissipated };
}

export function stars(run: Run): number {
  if (run.status !== 'won') return 0;
  let s = 1;
  const eff = run.poured > 0 ? run.wasted / run.poured : 0;
  if (eff <= 0.3) s++;
  if (s === 2 && !run.hintUsed && run.floods.length === 0 && run.khamsinExposure < 2) s++;
  return s;
}

export { LAPSE_C_PER_100M };
