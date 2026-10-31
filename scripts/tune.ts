import { LEVELS } from '../src/rules/levels.ts';
import { play, routePilot, pourAlways, alwaysEast } from '../src/rules/autopilot.ts';
import { stars, type Run } from '../src/rules/sim.ts';
import type { PlanChoice } from '../src/rules/types.ts';
const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
const fmt = (r: Run) => `${r.status.padEnd(6)} ${(r.failReason ?? '').padEnd(8)} t=${r.tTotal.toFixed(0).padStart(4)} ★${stars(r)} ` +
  Object.entries(r.progress).map(([k, v]) => `${k}:${v.toFixed(0)}`).join(' ') + ` maxRH=${(r.maxRh*100).toFixed(0)} W=${r.cloud.W.toFixed(1)} poured=${r.poured.toFixed(2)} wasted=${r.wasted.toFixed(2)} storm=${r.storm}`;
for (const lv of LEVELS) {
  if (only && !only.includes(lv.id)) continue;
  console.log(`\n#${lv.id} ${lv.title}`);
  const sol = lv.solution;
  console.log('  solution   ', fmt(play(lv, sol.plan, routePilot(sol))));
  console.log('  pourAlways ', fmt(play(lv, sol.plan, pourAlways)));
  console.log('  alwaysEast ', fmt(play(lv, sol.plan, alwaysEast)));
  const alts: PlanChoice[] = [];
  for (const s of lv.plan.slots ?? []) if (!sol.plan.tokens.some((t) => t.slot === s.id)) alts.push({ tokens: [{ slot: s.id, kind: 'L' }], hour: sol.plan.hour });
  for (const h of lv.plan.hours ?? []) if (h !== sol.plan.hour) alts.push({ tokens: sol.plan.tokens, hour: h });
  if (lv.plan.slots) alts.push({ tokens: [], hour: sol.plan.hour });
  for (const a of alts) console.log(`  alt ${JSON.stringify(a.tokens.map(t=>t.slot))} h=${a.hour}`.padEnd(26), fmt(play(lv, a, routePilot(sol))));
}
