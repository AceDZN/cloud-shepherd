// Real browser captures of the running game (dev server on 5241). Flights use the same scripted
// pilots as the tests, pressing the same inputs a player can.
// usage: node scripts/shots.mjs [outDir=tmp/shots] [only=name,name]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] ?? 'tmp/shots'; // local only: screenshots never go in the repo
const only = process.argv[3]?.split(',') ?? null;
const url = process.env.URL ?? 'http://localhost:5241/';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const errors = [];

async function open(size = [1280, 800]) {
  const page = await browser.newPage({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`error: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(url);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function' && !document.getElementById('boot'), null, { timeout: 60000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  return page;
}

const state = (page) => page.evaluate(() => JSON.parse(window.render_game_to_text()));
async function shot(page, name) {
  await page.evaluate(() => window.advanceTime(16));
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log('shot', name);
}

/** Launch level `id` with its solution plan (or `plan`) and the route pilot (or `pilot`: 'route'|'pour'|'east'|'idle'). */
async function fly(page, id, { plan, pilot = 'route' } = {}) {
  await page.evaluate(async ({ id, plan, pilot }) => {
    const ap = await import('/src/rules/autopilot.ts');
    const { levelById } = await import('/src/rules/levels.ts');
    const { NO_INPUT } = await import('/src/rules/sim.ts');
    const l = levelById(id);
    const g = window.__game;
    g.pilot = pilot === 'route' ? ap.routePilot(l.solution) : pilot === 'pour' ? ap.pourAlways : pilot === 'east' ? ap.alwaysEast : () => NO_INPUT;
    g.quickStart(id, plan ?? l.solution.plan);
  }, { id, plan, pilot });
}

/** Advance until `cond(state)` or `maxS` seconds (in 0.25 s chunks). */
async function until(page, cond, maxS = 120) {
  for (let t = 0; t < maxS; t += 0.25) {
    await page.evaluate(() => window.advanceTime(250));
    const s = await state(page);
    if (cond(s)) return s;
  }
  return state(page);
}

const scenes = {
  async title() { const p = await open(); await p.evaluate(() => window.advanceTime(1500)); await shot(p, '01-title'); await p.close(); },
  async levels() { const p = await open(); await p.click('[data-act=levels]'); await p.evaluate(() => window.advanceTime(800)); await shot(p, '02-levels'); await p.close(); },
  async l1() {
    const p = await open();
    await p.click('[data-act=play]');
    await p.evaluate(() => window.advanceTime(2500));
    await shot(p, '03-l1-intro');
    await fly(p, 1);
    await until(p, (s) => s.storm?.t > 2.5);
    await shot(p, '04-l1-soak');
    const s = await until(p, (s) => s.cloud?.pouring && s.cloud.canPour && s.targets[0].value > 5);
    console.log('l1 pour at', s.storm.t, 's, field', s.targets[0].value);
    await shot(p, '05-l1-pour');
    await until(p, (s) => s.mode === 'result', 20);
    await p.evaluate(() => window.advanceTime(1200));
    await shot(p, '06-l1-result');
    await p.click('[data-act=replay]');
    await p.evaluate(() => window.advanceTime(3000));
    await shot(p, '07-l1-replay');
    await p.close();
  },
  async l2() {
    const p = await open();
    await fly(p, 2, { pilot: 'pour' });
    const s = await until(p, (s) => s.line.includes('לחות היחסית רק'), 10);
    console.log('l2 dry pour line:', s.line, 'rh', s.cloud.rhPct, 'orchard', s.targets[0].value);
    await shot(p, '08-l2-dry-pour');
    await p.close();
  },
  async l3() {
    const p = await open();
    await p.evaluate(() => window.__game.loadLevel(3));
    await p.click('[data-act=go]');
    await p.evaluate(() => window.advanceTime(2500));
    await p.evaluate(() => { window.__game.slotClickById('east'); window.advanceTime(800); });
    await shot(p, '09-l3-plan');
    await p.close();
  },
  async l7() {
    const p = await open();
    await fly(p, 7);
    await until(p, (s) => s.cloud?.pouring && s.cloud.precip === 'snow' && s.targets[1].value > 4, 90);
    await shot(p, '10-l7-jerusalem-snow');
    await p.close();
  },
  async l8() {
    const p = await open();
    await fly(p, 8);
    await until(p, (s) => s.targets[0].value > 20, 90);
    await shot(p, '11-l8-rain-shadow');
    await p.close();
  },
  async l10() {
    const p = await open();
    await fly(p, 10);
    await until(p, (s) => s.storm?.t > 4, 30);
    await shot(p, '12-l10-night');
    await p.close();
  },
  async l13() {
    const p = await open();
    await fly(p, 13, { plan: { tokens: [{ slot: 'negev', kind: 'L' }] } });
    await until(p, (s) => s.cloud && s.cloud.rhPct < 60, 60);
    await shot(p, '13-l13-khamsin');
    await p.close();
  },
  async l17() {
    const p = await open();
    await fly(p, 17);
    await until(p, (s) => s.storm?.index === 1 && s.storm.t > 12, 120);
    await shot(p, '14-l17-kinneret');
    await p.close();
  },
  async l18() {
    const p = await open();
    await fly(p, 18);
    await until(p, (s) => s.cloud?.pouring && s.cloud.precip === 'snow', 120);
    await shot(p, '15-l18-storm');
    await p.close();
  },
  async mobile() {
    const p = await open([390, 844]);
    await fly(p, 1);
    await until(p, (s) => s.cloud?.pouring, 20);
    await shot(p, '16-mobile-flight');
    await p.close();
  },
};

for (const [name, fn] of Object.entries(scenes)) {
  if (only && !only.includes(name)) continue;
  try { await fn(); } catch (e) { console.log('FAILED', name, e.message); }
}
if (errors.length) console.log('CONSOLE:\n' + [...new Set(errors)].slice(0, 20).join('\n'));
await browser.close();
