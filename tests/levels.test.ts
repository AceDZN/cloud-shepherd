// Level tests: every authored level is solvable, wrong plans and naive pilots fail, and the
// geography the level teaches is what actually decides the outcome.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, levelById } from '../src/rules/levels.ts';
import { play, playSolution, routePilot, pourAlways, alwaysEast, type Pilot } from '../src/rules/autopilot.ts';
import { createRun, step, inZones, waterBalance, NO_INPUT, type Run } from '../src/rules/sim.ts';
import { PLACES } from '../src/rules/geo.ts';
import type { LevelDef, PlanChoice } from '../src/rules/types.ts';

const describeRun = (r: Run) =>
  `${r.status}/${r.failReason ?? '-'} ` + Object.entries(r.progress).map(([k, v]) => `${k}:${v.toFixed(1)}`).join(' ');

// Solution runs are reused by several tests; cache them.
const solved = new Map<number, Run>();
function solutionRun(level: LevelDef): Run {
  if (!solved.has(level.id)) solved.set(level.id, playSolution(level));
  return solved.get(level.id)!;
}

describe('campaign shape', () => {
  test('exactly 18 levels, ids 1..18 in order, worlds 1-4 in blocks of 5/5/5/3', () => {
    assert.equal(LEVELS.length, 18);
    assert.deepEqual(LEVELS.map((l) => l.id), Array.from({ length: 18 }, (_, i) => i + 1));
    const worlds = LEVELS.map((l) => l.world);
    assert.deepEqual(worlds, [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4]);
  });

  test('only levels 1-2 show wind arrows (tutorials)', () => {
    assert.deepEqual(LEVELS.filter((l) => l.showArrows).map((l) => l.id), [1, 2]);
  });

  test('levels 3, 5, 10, 13 and 18 (and only those) require token placement', () => {
    assert.deepEqual(LEVELS.filter((l) => l.plan.mustPlace).map((l) => l.id), [3, 5, 10, 13, 18]);
    for (const id of [3, 5, 10, 13, 18]) {
      const l = levelById(id);
      assert.ok((l.plan.slots?.length ?? 0) >= 2, `level ${id} needs at least two slots to choose from`);
      assert.ok(l.solution.plan.tokens.length >= 1, `level ${id} solution places a token`);
    }
  });

  test('the final level has no hints (handoff: "no hints")', () => {
    assert.equal(levelById(18).hints, false);
  });

  test('every target zone and wadi lies inside the map and every level has a required target', () => {
    for (const l of LEVELS) {
      assert.ok(l.targets.some((t) => !t.optional), `level ${l.id} has a required target`);
      for (const t of l.targets) for (const z of t.zones) assert.ok(z.x > 0 && z.y > 0 && z.r > 0, `level ${l.id} ${t.id}`);
    }
  });
});

describe('every level is solvable', () => {
  for (const level of LEVELS) {
    test(`level ${level.id} ${level.title}: playSolution wins`, () => {
      const r = solutionRun(level);
      assert.equal(r.status, 'won', describeRun(r));
      assert.equal(r.floods.length, 0, 'no flash flood in a winning solution');
    });
  }
});

describe('wrong plans fail', () => {
  /** Plans the tests accept as alternative solutions (documented in levels.ts / tune.ts). */
  const acceptedAlternates: Record<number, string[]> = { 18: ['south'] };

  for (const id of [3, 5, 10, 13, 18]) {
    const level = levelById(id);
    const solSlots = level.solution.plan.tokens.map((t) => t.slot);
    for (const slot of level.plan.slots ?? []) {
      if (solSlots.includes(slot.id)) continue;
      const accepted = acceptedAlternates[id]?.includes(slot.id);
      test(`level ${id}: ל in slot "${slot.id}" ${accepted ? 'is an accepted alternate' : 'fails'}`, () => {
        const plan: PlanChoice = { tokens: [{ slot: slot.id, kind: 'L' }], hour: level.solution.plan.hour };
        const r = play(level, plan, routePilot(level.solution));
        assert.equal(r.status, accepted ? 'won' : 'failed', describeRun(r));
      });
    }
  }

  test('level 18: the afternoon hour (15:00) fails for every slot; only center/south at 03:00 win', () => {
    const l = levelById(18);
    const results: string[] = [];
    for (const slot of l.plan.slots!) {
      for (const hour of l.plan.hours!) {
        const r = play(l, { tokens: [{ slot: slot.id, kind: 'L' }], hour }, routePilot(l.solution));
        if (r.status === 'won') results.push(`${slot.id}@${hour}`);
      }
    }
    assert.deepEqual(results.sort(), ['center@3', 'south@3']);
  });

  test('level 18: at 15:00 Jerusalem gets no snow (too warm), at 03:00 it does', () => {
    const l = levelById(18);
    const warm = play(l, { tokens: [{ slot: 'center', kind: 'L' }], hour: 15 }, routePilot(l.solution));
    assert.equal(warm.progress.jerusalem, 0, describeRun(warm));
    assert.ok(warm.events.some((e) => e.kind !== 'snow' && inZones(l.targets.find((t) => t.id === 'jerusalem')!.zones, e.x, e.y)),
      'at 15:00 what falls on Jerusalem is rain or slush');
    assert.ok(solutionRun(l).progress.jerusalem >= 10);
  });

  test('level 4: dawn (06:00) fails, 10:00 and 14:00 succeed (land heats faster than sea)', () => {
    const l = levelById(4);
    const outcome = (hour: number) => play(l, { tokens: [], hour }, routePilot(l.solution));
    const dawn = outcome(6);
    assert.equal(dawn.status, 'failed', describeRun(dawn));
    assert.equal(dawn.progress.lifeguard, 0, 'no breeze at dawn, so no shade');
    for (const h of [10, 14]) assert.equal(outcome(h).status, 'won', `hour ${h}`);
  });
});

describe('naive pilots fail', () => {
  const pilots: [string, Pilot][] = [['pourAlways', pourAlways], ['alwaysEast', alwaysEast]];
  for (const id of [2, 7, 11, 12, 13, 14, 15, 16, 17, 18]) {
    for (const [name, pilot] of pilots) {
      test(`level ${id}: ${name} fails`, () => {
        const l = levelById(id);
        const r = play(l, l.solution.plan, pilot);
        assert.equal(r.status, 'failed', describeRun(r));
      });
    }
  }
});

describe('geography decides the outcome', () => {
  test('level 12: fields south of the aridity line (Yeruham, Mitzpe Ramon) get 0 mm even when targeted', () => {
    const l = levelById(12);
    for (const id of ['yeruham', 'ramon']) {
      const t = l.targets.find((x) => x.id === id)!;
      const z = t.zones[0];
      const pilot = routePilot({ plan: l.solution.plan, routes: l.storms.map(() => [{ x: z.x, y: z.y }]), pourIn: [id] });
      const r = play(l, l.solution.plan, pilot);
      assert.equal(r.progress[id], 0, `${id}: ${describeRun(r)}`);
      // naive pilots don't reach them either
      for (const p of [pourAlways, alwaysEast]) assert.equal(play(l, l.solution.plan, p).progress[id], 0);
    }
    const sol = solutionRun(l);
    assert.ok(sol.progress.gat >= 200 && sol.progress.beersheva >= 200, 'fields north of the line reach 200 mm');
  });

  test('level 8: the solution keeps every drop west of the ridge (bloom stays at 0)', () => {
    const r = solutionRun(levelById(8));
    assert.equal(r.progress.bloom, 0);
    assert.ok(r.progress.aquifer >= 36);
  });

  /** Hold all water, fly from the coast over the ridge toward the Dead Sea; try to pour whenever `tryPour` says so. */
  function crossRidge(tryPour: (run: Run) => boolean) {
    const l = levelById(8);
    const run = createRun(l, l.solution.plan);
    const dest = PLACES.deadsea, ridgeX = PLACES.jerusalem.x;
    let crestRh = 0, minRhRift = 2, rift = 0, pouredEastOfCrest = 0;
    for (let i = 0; i < 30 * 60 && run.status === 'flying' && run.cloud.x < dest.x + 4; i++) {
      const c = run.cloud;
      const dx = dest.x - c.x, dy = dest.y - c.y, d = Math.hypot(dx, dy) || 1;
      const before = run.poured;
      step(run, { ...NO_INPUT, steerX: dx / d, steerY: dy / d, pour: tryPour(run) });
      if (Math.abs(c.x - ridgeX) < 3) crestRh = Math.max(crestRh, c.rh);
      if (c.x > ridgeX + 3) pouredEastOfCrest += run.poured - before;
      if (c.ground <= -300) { rift++; minRhRift = Math.min(minRhRift, c.rh); }
    }
    return { run, crestRh, minRhRift, rift, pouredEastOfCrest };
  }

  test('level 8: holding water across the ridge, the air is saturated at the crest and RH falls below 100% on the descent to the Dead Sea', () => {
    const r = crossRidge(() => false);
    assert.ok(r.rift > 0, 'the pilot reached the rift');
    assert.equal(r.crestRh, 1, 'saturated at the crest');
    assert.ok(r.minRhRift < 0.95, `RH over the Dead Sea floor ${(r.minRhRift * 100).toFixed(0)}%`);
  });

  test('level 8: once the descending air is below 100% RH, pouring delivers nothing and explains why', () => {
    const r = crossRidge((run) => run.cloud.x > PLACES.jerusalem.x && run.cloud.rh < 1);
    assert.equal(r.pouredEastOfCrest, 0);
    const dry = r.run.feedback.filter((f) => f.key === 'dryPour');
    assert.ok(dry.length > 0 && dry.every((f) => f.key === 'dryPour' && f.rh < 1));
  });

  test('level 8 (curriculum): with all the water held, nothing can be poured east of the crest',
    () => {
      const r = crossRidge((run) => run.cloud.x > PLACES.jerusalem.x + 3);
      assert.equal(r.pouredEastOfCrest, 0, `poured ${r.pouredEastOfCrest.toFixed(3)} units east of the crest`);
    });

  test('level 8 (curriculum): holding all the water and pouring on the Judean Desert "bloom" sign should not get rain there',
    () => {
      const l = levelById(8);
      const bloom = l.targets.find((t) => t.id === 'bloom')!;
      const z = bloom.zones[0];
      const run = createRun(l, l.solution.plan);
      for (let i = 0; i < 30 * 75 && run.status === 'flying'; i++) {
        const c = run.cloud;
        const dx = z.x - c.x, dy = z.y - c.y, d = Math.hypot(dx, dy) || 1;
        step(run, { ...NO_INPUT, steerX: d > 2 ? dx / d : 0, steerY: d > 2 ? dy / d : 0, pour: inZones(bloom.zones, c.x, c.y) });
      }
      assert.ok(run.progress.bloom < bloom.need, `bloom got ${run.progress.bloom.toFixed(1)} mm`);
    });

  test('level 7: under the same storm, Tel Aviv gets rain and Jerusalem gets snow', () => {
    const l = levelById(7);
    const r = solutionRun(l);
    const zone = (id: string) => l.targets.find((t) => t.id === id)!.zones;
    const ta = r.events.filter((e) => inZones(zone('telaviv'), e.x, e.y));
    const jm = r.events.filter((e) => inZones(zone('snowman'), e.x, e.y));
    assert.ok(ta.length > 0 && jm.length > 0);
    assert.ok(ta.every((e) => e.kind === 'rain'), 'sea level: rain');
    assert.ok(jm.every((e) => e.kind === 'snow'), '~800 m: snow');
  });

  test('level 7: pouring on the ~400-550 m western slopes gives slush (neither rain nor snow)', () => {
    const l = levelById(7);
    // Ride the solution route toward Jerusalem but pour on the middle slopes instead.
    const run = createRun(l, l.solution.plan);
    const pilot = routePilot({ ...l.solution, pourIn: [] });
    const slushHeights: number[] = [];
    for (let i = 0; i < 30 * 75 && run.status === 'flying'; i++) {
      const input = pilot(run);
      const g = run.cloud.ground;
      const onSlope = g >= 400 && g <= 550 && run.cloud.x > PLACES.telaviv.x;
      const before = run.events.length;
      step(run, { ...input, pour: onSlope });
      for (const e of run.events.slice(before)) {
        slushHeights.push(g);
        assert.equal(e.kind, 'slush', `ground ${g.toFixed(0)} m`);
      }
    }
    assert.ok(slushHeights.length > 0, 'the route crosses 400-550 m slopes while saturated');
  });

  test('level 2: pouring at RH < 100% over the coast delivers nothing and gives the dryPour feedback', () => {
    const l = levelById(2);
    const run = createRun(l, l.solution.plan);
    assert.ok(run.cloud.rh >= 0.85 && run.cloud.rh < 1, `starts nearly full: ${(run.cloud.rh * 100).toFixed(0)}%`);
    for (let i = 0; i < 45; i++) step(run, { ...NO_INPUT, pour: true });
    assert.ok(run.cloud.x < PLACES.telaviv.x, 'still over the sea/coast');
    assert.equal(run.poured, 0);
    assert.equal(run.events.length, 0);
    const dry = run.feedback.find((f) => f.key === 'dryPour');
    assert.ok(dry && dry.key === 'dryPour' && dry.rh < 1 && dry.rh >= 0.85, JSON.stringify(dry));
  });

  test('level 15: in summer under the ג, the cloud cannot saturate over land', () => {
    const l = levelById(15);
    const r = play(l, l.solution.plan, (run) => ({ ...NO_INPUT, steerX: 1, pour: true }));
    assert.equal(r.status, 'failed');
    assert.equal(r.poured, 0);
    assert.ok(r.maxRh < 1);
  });
});

describe('water is conserved', () => {
  const pilots: [string, (l: LevelDef) => Pilot][] = [
    ['solution', (l) => routePilot(l.solution)],
    ['pourAlways', () => pourAlways],
    ['alwaysEast', () => alwaysEast],
  ];
  for (const id of [1, 2, 7, 8, 11, 13, 15, 16, 17, 18]) {
    test(`level ${id}: absorbed = held + poured + dissipated`, () => {
      const l = levelById(id);
      for (const [name, mk] of pilots) {
        const r = name === 'solution' ? solutionRun(l) : play(l, l.solution.plan, mk(l));
        const b = waterBalance(r);
        const sum = b.held + b.poured + b.dissipated;
        assert.ok(Math.abs(b.absorbed - sum) <= 1e-6 * Math.max(1, b.absorbed), `${name}: ${JSON.stringify(b)}`);
        assert.ok(b.held >= 0 && b.poured >= 0 && b.dissipated >= 0);
      }
    });
  }
});
