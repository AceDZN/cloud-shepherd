// Passive drift paths (no steering) for each plan option of a level.
import { levelById } from '../src/rules/levels.ts';
import { createRun, step, NO_INPUT } from '../src/rules/sim.ts';
const lv = levelById(Number(process.argv[2]));
const opts = [[], ...(lv.plan.slots ?? []).map((s) => [{ slot: s.id, kind: 'L' as const }])];
for (const tokens of opts) {
  for (const hour of lv.plan.hours ?? [lv.solution.plan.hour]) {
    const run = createRun(lv, { tokens, hour });
    const pts: string[] = [];
    for (let i = 0; i < 30 * 40 && run.status === 'flying'; i++) { step(run, NO_INPUT); if (i % 90 === 0) pts.push(`${run.cloud.x.toFixed(0)},${run.cloud.y.toFixed(0)}`); }
    console.log((tokens[0]?.slot ?? 'none').padEnd(10), `h=${hour}`, pts.join(' '));
  }
}
