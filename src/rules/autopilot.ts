// Scripted pilots used by tests and the tuning script. They only press the same inputs a player can.
import { NO_INPUT, createRun, inZones, step, targetMet, type Input, type Run } from './sim.ts';
import type { LevelDef, PlanChoice, Solution } from './types.ts';

export type Pilot = (run: Run) => Input;

export function routePilot(sol: Solution): Pilot {
  let storm = -1, wp = 0;
  return (run) => {
    if (run.storm !== storm) { storm = run.storm; wp = 0; }
    const c = run.cloud;
    const route = sol.routes[run.storm] ?? [];
    while (wp < route.length && Math.hypot(route[wp].x - c.x, route[wp].y - c.y) < 5) wp++;
    let steerX = 0, steerY = 0, puff = false;
    if (wp < route.length) {
      const dx = route[wp].x - c.x, dy = route[wp].y - c.y, d = Math.hypot(dx, dy);
      steerX = dx / d; steerY = dy / d;
      // puff when the wind would otherwise carry us well off the line
      const sp = Math.hypot(c.wind.u, c.wind.v);
      if (sp > 0.5) {
        const cross = (c.wind.u * dy - c.wind.v * dx) / (sp * d);
        puff = Math.abs(cross) > 0.35;
      }
    }
    const pourIds = sol.pourIn ?? run.level.targets.filter((t) => !t.optional && t.kind !== 'shade').map((t) => t.id);
    let pour = false;
    for (const t of run.level.targets) {
      if (!pourIds.includes(t.id) || !inZones(t.zones, c.x, c.y)) continue;
      if (t.storms && !t.storms.includes(run.storm)) continue;
      const room = t.max !== undefined ? run.progress[t.id] < t.max - 30 : !targetMet(run, t) || t.drain !== undefined;
      if (room && c.excess > 0) pour = true;
    }
    for (const t of run.level.targets) if (sol.avoid?.includes(t.id) && inZones(t.zones, c.x, c.y)) pour = false;
    for (const w of run.level.wadis ?? []) if (inZones([w.zone], c.x, c.y) && (run.wadiLoad[w.id] ?? 0) > w.threshold * 0.6) pour = false;
    const season = sol.seasonAt !== undefined && run.tTotal >= sol.seasonAt;
    return { steerX, steerY, pour, puff, season };
  };
}

/** Pours the whole time and steers nowhere. */
export const pourAlways: Pilot = () => ({ ...NO_INPUT, pour: true });
/** Steers east the whole time and pours whenever anything can fall. */
export const alwaysEast: Pilot = (run) => ({ ...NO_INPUT, steerX: 1, pour: run.cloud.excess > 0 });

export function play(level: LevelDef, plan: PlanChoice, pilot: Pilot, maxSeconds = 900): Run {
  const run = createRun(level, plan);
  const maxSteps = Math.round(maxSeconds * 30);
  for (let i = 0; i < maxSteps && run.status === 'flying'; i++) step(run, pilot(run));
  return run;
}

export function playSolution(level: LevelDef): Run {
  return play(level, level.solution.plan, routePilot(level.solution));
}
