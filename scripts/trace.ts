import { levelById } from '../src/rules/levels.ts';
import { routePilot } from '../src/rules/autopilot.ts';
import { createRun, step } from '../src/rules/sim.ts';
const lv = levelById(Number(process.argv[2]));
const plan = process.argv[3] ? JSON.parse(process.argv[3]) : lv.solution.plan;
const run = createRun(lv, plan); const pilot = routePilot(lv.solution);
let i = 0;
while (run.status === 'flying' && i < 30 * 300) {
  const inp = pilot(run); step(run, inp); i++;
  if (i % 45 === 0) { const c = run.cloud; console.log(`t=${run.tTotal.toFixed(1)} s${run.storm} x=${c.x.toFixed(0)} y=${c.y.toFixed(0)} g=${c.ground.toFixed(0)} z=${c.z.toFixed(0)} E=${c.E.toFixed(0)} T=${c.T.toFixed(1)} W=${c.W.toFixed(2)} rh=${(c.rh*100).toFixed(0)} ex=${c.excess.toFixed(2)} wind=${c.wind.u.toFixed(1)},${c.wind.v.toFixed(1)} ${c.surface} pour=${inp.pour} ` + Object.entries(run.progress).map(([k,v])=>`${k}:${v.toFixed(0)}`).join(' ')); }
}
console.log(run.status, run.failReason);
