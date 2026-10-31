import { levelById } from '../src/rules/levels.ts';
import { play, routePilot } from '../src/rules/autopilot.ts';
const lv = levelById(12);
for (const id of ['yeruham', 'ramon']) {
  const z = lv.targets.find((t) => t.id === id)!.zones[0];
  const r = play(lv, lv.solution.plan, routePilot({ plan: lv.solution.plan, routes: [[z], [z], [z]], pourIn: [id] }));
  console.log(id, r.progress[id].toFixed(0));
}
