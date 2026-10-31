// Browser playtest of the running game (dev server on 5241, not started or stopped here).
// It drives the real game loop: scripted pilots press the same inputs a player can, and the
// "keys" sections send real keyboard/mouse/touch events through the page.
// Captures go to tmp/playtest/ (git-ignored: never commit screenshots). A JSON summary goes to
// docs/playtest/results.json.
// usage: node scripts/playtest.mjs [section,section] ; sections: solutions naive accept keys ui mobile progress text
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const URL = process.env.URL ?? 'http://localhost:5241/';
const SHOTS = 'tmp/playtest';
const only = process.argv[2]?.split(',') ?? null;
mkdirSync(SHOTS, { recursive: true });
mkdirSync('docs/playtest', { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const results = [];
const errors = [];
let pass = 0, fail = 0;

function check(section, name, ok, detail = '') {
  results.push({ section, name, ok: !!ok, detail });
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} [${section}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function open({ size = [1280, 800], touch = false, clear = true, query = '' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(URL + query);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function' && !document.getElementById('boot'), null, { timeout: 90000 });
  if (clear) await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.evaluate(() => window.advanceTime(16)); // switch to manual stepping
  return page;
}
const close = (p) => p.context().close();
const state = (p) => p.evaluate(() => JSON.parse(window.render_game_to_text()));
const adv = (p, ms) => p.evaluate((ms) => window.advanceTime(ms), ms);
const shot = async (p, name) => { await adv(p, 16); await p.screenshot({ path: `${SHOTS}/${name}.png` }); };

async function setPilot(p, id, pilot) {
  await p.evaluate(async ({ id, pilot }) => {
    const ap = await import('/src/rules/autopilot.ts');
    const { levelById } = await import('/src/rules/levels.ts');
    const { NO_INPUT } = await import('/src/rules/sim.ts');
    const l = levelById(id);
    window.__game.pilot = pilot === 'route' ? ap.routePilot(l.solution) : pilot === 'pour' ? ap.pourAlways
      : pilot === 'east' ? ap.alwaysEast : pilot === 'none' ? null : () => NO_INPUT;
  }, { id, pilot });
}
async function fly(p, id, { plan, pilot = 'route' } = {}) {
  await setPilot(p, id, pilot);
  await p.evaluate(async ({ id, plan }) => {
    const { levelById } = await import('/src/rules/levels.ts');
    window.__game.quickStart(id, plan ?? levelById(id).solution.plan);
  }, { id, plan });
}
/** Advance in `chunk` ms steps until cond(state) or maxS game seconds. */
async function until(p, cond, maxS = 300, chunk = 250) {
  for (let t = 0; t < maxS * 1000; t += chunk) {
    await adv(p, chunk);
    const s = await state(p);
    if (cond(s)) return s;
  }
  return state(p);
}
const overlayText = (p) => p.evaluate(() => document.querySelector('.overlay')?.innerText ?? '');
const balanceOk = (b) => b && Math.abs(b.absorbed - (b.held + b.poured + b.dissipated)) < 1e-6 * Math.max(1, b.absorbed);
/** Result-card numbers as displayed (absorbed, poured, dissipated, held). */
const shownBalance = (p) => p.evaluate(() => [...document.querySelectorAll('.balance b')].map((b) => Number(b.textContent)));

// ───────────────────────── sections ─────────────────────────

const sections = {
  /** 1. every level wins in the real loop with the solution pilot */
  async solutions() {
    const p = await open();
    for (let id = 1; id <= 18; id++) {
      await fly(p, id);
      const s = await until(p, (s) => s.mode === 'result', 400, 1000);
      const shown = await shownBalance(p);
      const b = s.balance;
      const shownOk = shown.length === 4 && b && Math.abs(shown[0] - (shown[1] + shown[2] + shown[3])) <= 0.15
        && Math.abs(shown[0] - b.absorbed) < 0.051;
      check('solutions', `level ${id} wins with the solution pilot`, s.status === 'won', `${s.status}/${s.failReason ?? '-'} ★${b?.stars} t=${s.storm?.t}`);
      check('solutions', `level ${id} water balance (sim + result card)`, balanceOk(b) && shownOk, `card ${shown.join(' / ')}`);
      if ([1, 7, 8, 11, 14, 17, 18].includes(id)) {
        await p.waitForTimeout(1400); // star pop-in is a real-time CSS animation
        const on = await p.evaluate(() => document.querySelectorAll('.stars span.on').length);
        check('solutions', `level ${id} result card shows ${b?.stars} lit stars`, on === b?.stars, `lit ${on}`);
        await shot(p, `solution-l${String(id).padStart(2, '0')}-result`);
      }
    }
    await close(p);
  },

  /** 1b. naive pilots fail where the tests say they should */
  async naive() {
    const p = await open();
    for (const id of [2, 7, 11, 12, 13, 14, 15, 16, 17, 18]) {
      for (const pilot of ['pour', 'east']) {
        await fly(p, id, { pilot });
        const s = await until(p, (s) => s.mode === 'result', 400, 1000);
        check('naive', `level ${id} ${pilot === 'pour' ? 'pourAlways' : 'alwaysEast'} fails`, s.status === 'failed', `${s.status}/${s.failReason}`);
      }
    }
    // wrong plans
    const wrong = [[3, 'south'], [3, 'northwest'], [5, 's1'], [5, 's3'], [5, 's4'], [10, 'east'], [13, 'negev'], [13, 'center'], [18, 'sea']];
    for (const [id, slot] of wrong) {
      await fly(p, id, { plan: { tokens: [{ slot, kind: 'L' }], hour: id === 18 ? 3 : undefined } });
      const s = await until(p, (s) => s.mode === 'result', 400, 1000);
      check('naive', `level ${id} with ל in "${slot}" fails`, s.status === 'failed', `${s.status}/${s.failReason}`);
    }
    await fly(p, 18, { plan: { tokens: [{ slot: 'center', kind: 'L' }], hour: 15 } });
    let s = await until(p, (s) => s.mode === 'result', 400, 1000);
    check('naive', 'level 18 at 15:00 fails', s.status === 'failed', s.failReason);
    await fly(p, 4, { plan: { tokens: [], hour: 6 } });
    s = await until(p, (s) => s.mode === 'result', 100, 1000);
    check('naive', 'level 4 at 06:00 fails', s.status === 'failed', s.failReason);
    await close(p);
  },

  /** 2–3. acceptance of levels 1 and 2 */
  async accept() {
    const p = await open();
    // level 1 from the title screen, as a new player: title → play → intro → go
    await p.click('[data-act=play]');
    await adv(p, 1500);
    const intro = await overlayText(p);
    check('accept', 'title → level 1 intro shows the controls help', intro.includes('להמטיר') && intro.includes('נשימה ראשונה'));
    await shot(p, 'l1-intro');
    await setPilot(p, 1, 'route');
    await p.click('[data-act=go]');
    const t0 = Date.now();
    let soak = null, sat = null, pourAt = null, won = null, rh = [];
    for (let i = 0; i < 160 && !won; i++) {
      await adv(p, 250);
      const s = await state(p);
      if (!s.cloud) continue;
      rh.push(s.cloud.rhPct);
      if (soak === null && s.cloud.surface === 'sea' && s.cloud.water > 0) soak = s.storm.t;
      if (sat === null && s.cloud.canPour) { sat = s.storm.t; await shot(p, 'l1-saturated'); }
      if (pourAt === null && s.cloud.pouring && s.cloud.canPour) { pourAt = s.storm.t; }
      if (pourAt !== null && s.targets[0].value > 6 && !p._pourShot) { p._pourShot = true; await shot(p, 'l1-downpour'); }
      if (s.status === 'won') won = s.storm.t;
    }
    void t0;
    check('accept', 'L1: soaks up vapour over the sea (RH rises before landfall)', rh.length > 3 && Math.max(...rh.slice(0, 12)) > rh[0], `RH ${rh.slice(0, 12).join(',')}`);
    check('accept', 'L1: reaches 100 % on the Carmel slope', sat !== null, `t=${sat}s`);
    check('accept', 'L1: pours on the field and wins within 30 s of launch', won !== null && won <= 30, `saturated ${sat}s, pour ${pourAt}s, won ${won}s`);
    await adv(p, 300);
    const gr = await p.evaluate(() => {
      // terrain greening: count painted precipitation on the terrain if exposed, else rely on capture
      const t = window.__game.terrain; return t && typeof t === 'object' ? Object.keys(t).filter((k) => /wet|green|paint|precip/i.test(k)) : [];
    });
    check('accept', 'L1: terrain has a precipitation/greening layer', gr.length > 0, gr.join(','));

    // level 2: pour at about 90 % over the coast
    await fly(p, 2, { pilot: 'pour' });
    await adv(p, 600);
    let s = await state(p);
    const firstRh = s.cloud.rhPct;
    s = await until(p, (s) => s.line.length > 0, 5, 100);
    check('accept', 'L2: starts at about 90 %', firstRh >= 85 && firstRh < 100, `${firstRh}%`);
    check('accept', 'L2: pouring below 100 % drops nothing', s.targets[0].value === 0 && s.balance.poured === 0, `poured ${s.balance.poured}`);
    check('accept', 'L2: one explanatory line appears', /הלחות היחסית רק\s*\d+%/.test(s.line) && s.line.includes('100%'), s.line);
    await shot(p, 'l2-dry-pour');
    await close(p);
  },

  /** Hand play with real keys (keyboard pilot reads the map like a player would). */
  async keys() {
    const p = await open();
    await setPilot(p, 1, 'none');
    // helper: hold keys for ms while stepping
    async function hold(keys, ms) {
      for (const k of keys) await p.keyboard.down(k);
      await adv(p, ms);
      for (const k of keys) await p.keyboard.up(k);
    }
    /** Steer toward the next waypoint using arrow keys relative to the chase camera; Space to pour inside targets. */
    async function keyFly(id, { maxS = 200, pourIn, waypoints, season } = {}) {
      const sol = await p.evaluate(async (id) => (await import('/src/rules/levels.ts')).levelById(id).solution, id);
      const route = sol.routes;
      pourIn = pourIn ?? sol.pourIn;
      const avoid = sol.avoid ?? [];
      let storm = -1, wp = 0, s;
      for (let t = 0; t < maxS * 4; t++) {
        s = await state(p);
        if (s.mode !== 'flight' || s.status !== 'flying') break;
        if (s.storm.index !== storm) { storm = s.storm.index; wp = 0; }
        const r = waypoints ?? route[storm] ?? [];
        const c = s.cloud;
        while (wp < r.length && Math.hypot(r[wp].x - c.x, r[wp].y - c.y) < 5) wp++;
        const heading = await p.evaluate(() => window.__game.heading);
        const keys = [];
        if (wp < r.length) {
          const dx = r[wp].x - c.x, dy = r[wp].y - c.y, d = Math.hypot(dx, dy);
          const fwd = (dx * Math.sin(heading) + dy * Math.cos(heading)) / d;
          const rgt = (dx * Math.cos(heading) - dy * Math.sin(heading)) / d;
          if (fwd > 0.35) keys.push('ArrowUp'); else if (fwd < -0.35) keys.push('ArrowDown');
          if (rgt > 0.35) keys.push('ArrowRight'); else if (rgt < -0.35) keys.push('ArrowLeft');
          // a player taps Shift when the wind pushes them off their line
          const sp = Math.hypot(c.wind.u, c.wind.v);
          if (sp > 0.5 && Math.abs((c.wind.u * dy - c.wind.v * dx) / (sp * d)) > 0.35 && c.puffCooldown <= 0) await p.keyboard.press('ShiftLeft');
        }
        const want = s.targets.some((t) => t.cloudInside && !t.optional && (pourIn ? pourIn.includes(t.id) : true)
          && (t.max ? t.value < t.max - 30 : !t.met || t.id === 'kinneret'));
        const bad = s.targets.some((t) => t.cloudInside && avoid.includes(t.id));
        if (want && !bad && c.canPour) keys.push('Space');
        if (season && s.storm.t >= season && !p._season) { p._season = true; await p.keyboard.press('KeyQ'); }
        await hold(keys, 250);
      }
      return until(p, (s) => s.mode === 'result', 5, 250);
    }

    // level 1 by keys
    await p.evaluate(() => window.__game.loadLevel(1));
    await adv(p, 300);
    await p.keyboard.press('Enter'); // intro "יוצאים!"
    let s = await keyFly(1);
    check('keys', 'L1 by keyboard: win', s.status === 'won', `${s.status}/${s.failReason}`);

    // level 2: Space early at 90 % first (like a curious student), then fly
    await p.evaluate(() => window.__game.loadLevel(2));
    await adv(p, 300);
    await p.keyboard.press('Enter');
    await hold(['Space'], 1500);
    s = await state(p);
    check('keys', 'L2 by keyboard: Space at ~90 % gives the dry-pour line', s.line.includes('הלחות היחסית רק'), s.line);
    s = await keyFly(2);
    check('keys', 'L2 by keyboard: win', s.status === 'won', `${s.status}/${s.failReason}`);

    // level 3: plan clicks with the mouse
    await p.evaluate(() => window.__game.loadLevel(3));
    await adv(p, 300);
    await p.keyboard.press('Enter'); // to plan
    await adv(p, 2500);
    const launchDisabled = await p.evaluate(() => document.querySelector('[data-act=launch]')?.disabled);
    check('keys', 'L3 plan: launch is disabled until the ל is placed', launchDisabled === true);
    const slotXY = (id) => p.evaluate(async (id) => {
      const g = window.__game;
      const s = g.level.plan.slots.find((q) => q.id === id);
      const { surfaceY } = await import('/src/scene/terrain.ts');
      const V3 = g.world.camera.position.constructor;
      const v = new V3(s.x, Math.max(0, surfaceY(s.x, s.y)) + 1, -s.y).project(g.world.camera);
      const r = g.world.renderer.domElement.getBoundingClientRect();
      return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
    }, id);
    let xy = await slotXY('south');
    await p.mouse.click(xy.x, xy.y);
    await adv(p, 100);
    xy = await slotXY('east');
    await p.mouse.click(xy.x, xy.y); // moves the single token
    await adv(p, 300);
    s = await state(p);
    check('keys', 'L3 plan: clicking a second slot moves the only ל', JSON.stringify(s.plan.tokens) === JSON.stringify([{ slot: 'east', kind: 'L' }]), JSON.stringify(s.plan.tokens));
    await shot(p, 'l3-plan-clicked');
    await p.click('[data-act=launch]');
    s = await keyFly(3);
    check('keys', 'L3 by mouse plan + keyboard: win', s.status === 'won', `${s.status}/${s.failReason}`);
    // R on result? restart from flight keeps the plan
    await p.evaluate(() => window.__game.loadLevel(3));
    await adv(p, 200);
    await p.keyboard.press('Enter');
    await adv(p, 2500);
    xy = await slotXY('northwest');
    await p.mouse.click(xy.x, xy.y);
    await p.click('[data-act=launch]');
    await adv(p, 1500);
    await p.keyboard.press('KeyR');
    await adv(p, 500);
    s = await state(p);
    check('keys', 'R restarts a plan level back to the plan with the same token', s.mode === 'plan' && s.plan?.tokens?.[0]?.slot === 'northwest', `${s.mode} ${JSON.stringify(s.plan?.tokens)}`);

    // level 4: hour buttons
    await p.evaluate(() => window.__game.loadLevel(4));
    await adv(p, 300);
    await p.keyboard.press('Enter');
    await adv(p, 300);
    s = await state(p);
    check('keys', 'L4: Enter on the intro opens the plan (hour choice)', s.mode === 'plan', `mode after Enter: ${s.mode}`);
    // continue with the mouse, like a player would after that
    await p.evaluate(() => window.__game.loadLevel(4));
    await adv(p, 300);
    await p.click('[data-act=go]');
    await adv(p, 1500);
    s = await state(p);
    check('keys', 'L4 plan: default hour is 06:00', s.plan.hour === 6, String(s.plan.hour));
    await p.click('[data-hour="14"]');
    await adv(p, 200);
    await shot(p, 'l4-plan-hour14');
    await p.click('[data-act=launch]');
    s = await keyFly(4, { maxS: 40 });
    check('keys', 'L4 at 14:00 by keyboard: win', s.status === 'won', `${s.status}/${s.failReason}`);
    // Enter on the result card ("לשלב הבא") should open level 5's intro
    await adv(p, 500);
    await p.keyboard.press('Enter');
    await adv(p, 300);
    s = await state(p);
    check('keys', 'Enter on the result card opens the next level intro', s.level?.id === 5 && s.mode === 'intro', `level ${s.level?.id} mode ${s.mode}`);

    // level 15: season dial with Q
    await p.evaluate(() => window.__game.loadLevel(15));
    await adv(p, 300);
    await p.keyboard.press('Enter');
    p._season = false;
    s = await keyFly(15, { season: 22 });
    check('keys', 'L15 by keyboard with Q (season dial): win', s.status === 'won', `${s.status}/${s.failReason}`);

    // level 17 and 18
    await p.evaluate(() => window.__game.loadLevel(17));
    await adv(p, 300);
    await p.keyboard.press('Enter');
    s = await keyFly(17, { maxS: 160 });
    check('keys', 'L17 by keyboard: win', s.status === 'won', `${s.status}/${s.failReason} kinneret=${s.targets?.[0]?.value}`);
    await shot(p, 'l17-keys-result');

    await p.evaluate(() => window.__game.loadLevel(18));
    await adv(p, 300);
    await p.keyboard.press('Enter');
    await adv(p, 2500);
    xy = await slotXY('center');
    await p.mouse.click(xy.x, xy.y);
    await p.click('[data-hour="3"]');
    await adv(p, 200);
    const hintBtn = await p.evaluate(() => !!document.querySelector('.plan-panel [data-act=hint]'));
    check('keys', 'L18 plan has no hint button', !hintBtn);
    await p.click('[data-act=launch]');
    await adv(p, 300);
    await p.keyboard.press('KeyH');
    const hud18 = await p.evaluate(() => [!!document.querySelector('.hud:not(.hidden) [data-act=hint]'), window.__game.run.hintUsed]);
    check('keys', 'L18 flight: no hint button and H does nothing', !hud18[0] && !hud18[1], JSON.stringify(hud18));
    s = await keyFly(18, { maxS: 170 });
    check('keys', 'L18 by keyboard (center, 03:00): win', s.status === 'won', `${s.status}/${s.failReason} ${s.targets?.map((t) => `${t.id}:${t.value}`).join(' ')}`);
    await shot(p, 'l18-keys-result');
    await close(p);
  },

  /** 5. pause/blur, restart, mute, fast, hint, replay */
  async ui() {
    const p = await open();
    await fly(p, 6, { pilot: 'idle' });
    await adv(p, 1000);
    await p.keyboard.press('KeyP');
    let s = await state(p);
    const t1 = s.storm.t;
    await adv(p, 2000);
    s = await state(p);
    check('ui', 'P pauses (time stops, pause card shown)', s.paused && s.storm.t === t1 && (await overlayText(p)).includes('הפסקה'));
    await shot(p, 'ui-pause');
    await p.keyboard.press('KeyP');
    await adv(p, 500);
    s = await state(p);
    check('ui', 'P again resumes', !s.paused && s.storm.t > t1);
    await p.keyboard.press('Escape');
    s = await state(p);
    check('ui', 'Escape pauses', s.paused);
    await p.click('[data-act=resume]');
    await p.evaluate(() => window.dispatchEvent(new Event('blur')));
    s = await state(p);
    check('ui', 'window blur pauses', s.paused);
    await p.click('[data-act=resume]');
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    s = await state(p);
    check('ui', 'tab hidden pauses', s.paused);
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); });
    await p.click('[data-act=resume]');
    // mute
    const m0 = await p.evaluate(() => window.__game.sound.muted);
    await p.keyboard.press('KeyM');
    const m1 = await p.evaluate(() => [window.__game.sound.muted, JSON.parse(localStorage.getItem('cloud-shepherd-v1') ?? '{}').muted, document.querySelector('[data-act=mute]')?.textContent]);
    check('ui', 'M toggles mute, persists, and updates the button', m1[0] === !m0 && m1[1] === m1[0] && m1[2] === (m1[0] ? '🔇' : '🔊'), JSON.stringify(m1));
    await p.keyboard.press('KeyM');
    // fast
    await p.keyboard.press('KeyF');
    s = await state(p);
    const tf = s.storm.t;
    await adv(p, 1000);
    s = await state(p);
    check('ui', 'F runs 3× faster', s.fast && s.storm.t - tf > 2.5, `${(s.storm.t - tf).toFixed(1)} s in 1 s`);
    await p.keyboard.press('KeyF');
    // hint
    await p.keyboard.press('KeyH');
    await adv(p, 200);
    s = await state(p);
    const route = await p.evaluate(() => !!window.__game.routeLine);
    check('ui', 'H gives a hint line (and costs the 3rd star)', s.line.length > 0, `${s.line} | route line drawn: ${route}`);
    await shot(p, 'ui-hint');
    // restart mid-flight (non-plan level) → new flight at t≈0
    await p.keyboard.press('KeyR');
    await adv(p, 100);
    s = await state(p);
    check('ui', 'R restarts a non-plan level straight into flight', s.mode === 'flight' && s.storm.t < 0.5, `${s.mode} t=${s.storm.t}`);
    // replay
    await fly(p, 8);
    await until(p, (s) => s.mode === 'result', 120, 1000);
    await p.click('[data-act=replay]');
    await adv(p, 3000);
    s = await state(p);
    const rinfo = await p.evaluate(() => document.querySelector('[data-k=rinfo]')?.textContent ?? '');
    check('ui', 'replay opens and shows height/temp/RH', s.mode === 'replay' && /לחות יחסית/.test(rinfo), rinfo);
    await shot(p, 'ui-replay-l8');
    await p.click('[data-act=back]');
    s = await state(p);
    check('ui', 'replay back returns to the result', s.mode === 'result');
    // resize during flight
    await fly(p, 1, { pilot: 'idle' });
    await adv(p, 500);
    await p.setViewportSize({ width: 900, height: 600 });
    await p.waitForTimeout(600); // ResizeObserver fires on a real rendering step
    await adv(p, 100);
    const cv = await p.evaluate(() => { const c = document.querySelector('canvas'); const r = c.getBoundingClientRect(); return [c.width, c.height, Math.round(r.width), Math.round(r.height), innerWidth, innerHeight, window.__game.world.camera.aspect.toFixed(3)]; });
    check('ui', 'resize: canvas and camera follow the window', cv[2] === cv[4] && cv[3] === cv[5] && Math.abs(cv[6] - cv[4] / cv[5]) < 0.01, cv.join(','));
    await shot(p, 'ui-resized-900x600');
    await close(p);
  },

  /** 5b. mobile 390×844 touch layout */
  async mobile() {
    const p = await open({ size: [390, 844], touch: true });
    await shot(p, 'mobile-title');
    const noHScroll = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    check('mobile', 'title: no horizontal scroll', noHScroll);
    await p.tap('[data-act=levels]');
    await adv(p, 500);
    await shot(p, 'mobile-levels');
    await p.evaluate(() => window.__game.loadLevel(1));
    await adv(p, 800);
    await shot(p, 'mobile-intro');
    const goBox = await p.locator('[data-act=go]').boundingBox();
    check('mobile', 'intro: the go button is on screen', goBox && goBox.y + goBox.height <= 844 && goBox.x >= 0, JSON.stringify(goBox));
    await p.tap('[data-act=go]');
    await adv(p, 500);
    // HUD boxes inside the viewport and not overlapping each other
    const boxes = await p.evaluate(() => {
      const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return r.width ? { s, x: r.x, y: r.y, w: r.width, h: r.height } : null; };
      return ['.hud-top', '.hud-level', '.hud-btns', '.targets', '.gauges', '.actions', '.lines', '.schematic', '.storm-bar'].map(q).filter(Boolean);
    });
    const out = boxes.filter((b) => b.x < -1 || b.y < -1 || b.x + b.w > 391 || b.y + b.h > 845);
    const overlaps = [];
    const pairs = [['.gauges', '.actions'], ['.hud-level', '.hud-btns'], ['.targets', '.actions'], ['.targets', '.gauges'], ['.lines', '.actions'], ['.lines', '.gauges']];
    for (const [a, b] of pairs) {
      const A = boxes.find((x) => x.s === a), B = boxes.find((x) => x.s === b);
      if (A && B && A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h) overlaps.push(`${a}×${b}`);
    }
    check('mobile', 'flight HUD fits 390×844', out.length === 0, JSON.stringify(out));
    check('mobile', 'flight HUD panels do not overlap', overlaps.length === 0, overlaps.join(' '));
    // touch-drag joystick steers, pour button hold pours when saturated
    const c0 = (await state(p)).cloud;
    // real touch input through CDP (a finger drag on the canvas)
    const cdp = await p.context().newCDPSession(p);
    const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    await touch('touchStart', 200, 500);
    for (let i = 1; i <= 6; i++) await touch('touchMove', 200 + i * 10, 500);
    await adv(p, 100);
    const joyVisible = await p.evaluate(() => !document.querySelector('.joy')?.classList.contains('hidden'));
    await shot(p, 'mobile-joystick');
    check('mobile', 'touch drag shows the joystick', joyVisible);
    await adv(p, 2000);
    await touch('touchEnd');
    const c1 = (await state(p)).cloud;
    const idle = await (async () => { const q = await open({ size: [390, 844], touch: true }); await q.evaluate(() => window.__game.quickStart(1)); await adv(q, 16); await q.evaluate(() => window.advanceTime(2000)); const s = await state(q); await close(q); return s.cloud; })();
    check('mobile', 'touch drag on the canvas steers the cloud', Math.hypot(c1.x - idle.x, c1.y - idle.y) > 0.5, `with drag (${c1.x},${c1.y}) vs idle (${idle.x},${idle.y})`);
    void c0;
    const s = await until(p, (s) => s.cloud.canPour, 40, 250);
    const pb = await p.locator('[data-act=pour]').boundingBox();
    await touch('touchStart', pb.x + pb.width / 2, pb.y + pb.height / 2);
    await adv(p, 1500);
    const s2 = await state(p);
    await shot(p, 'mobile-pour');
    await touch('touchEnd');
    check('mobile', 'holding the pour button pours when saturated', s.cloud.canPour && s2.balance.poured > 0, `poured ${s2.balance.poured} button ${JSON.stringify(pb)}`);
    await close(p);
  },

  /** 5c. progress unlocking and the ?level deep link */
  async progress() {
    const p = await open();
    await p.click('[data-act=levels]');
    await adv(p, 300);
    let locked = await p.evaluate(() => [...document.querySelectorAll('.level-btn')].map((b) => b.classList.contains('locked')));
    check('progress', 'fresh save: only level 1 open', locked[0] === false && locked.slice(1).every(Boolean), locked.map((x) => (x ? 'L' : 'o')).join(''));
    await fly(p, 1);
    await until(p, (s) => s.mode === 'result', 60, 1000);
    const nextBtn = await p.evaluate(() => !!document.querySelector('[data-act=next]'));
    check('progress', 'win shows "next level"', nextBtn);
    await p.click('[data-act=levels]');
    await adv(p, 300);
    locked = await p.evaluate(() => [...document.querySelectorAll('.level-btn')].map((b) => b.classList.contains('locked')));
    const stars1 = await p.evaluate(() => document.querySelector('.level-btn .lv-s')?.textContent);
    check('progress', 'after winning 1: level 2 unlocks and 1 shows stars', !locked[1] && locked[2] && /★/.test(stars1), `${locked.map((x) => (x ? 'L' : 'o')).join('')} ${stars1}`);
    // persisted across reload
    await p.reload();
    await p.waitForFunction(() => typeof window.render_game_to_text === 'function' && !document.getElementById('boot'), null, { timeout: 90000 });
    await adv(p, 16);
    const title = await overlayText(p);
    check('progress', 'progress persists across reload (title says המשך)', title.includes('המשך'));
    await close(p);
    const q = await open({ query: '?level=12' });
    const s = await state(q);
    check('progress', '?level=12 deep link opens level 12 even when locked', s.level?.id === 12 && s.mode === 'intro', `${s.mode} ${s.level?.id}`);
    await close(q);
  },

  /** 4. Hebrew / RTL text */
  async text() {
    const p = await open();
    const dir = await p.evaluate(() => [document.documentElement.lang, document.documentElement.dir, getComputedStyle(document.body).direction]);
    check('text', 'html lang=he dir=rtl', dir[0] === 'he' && dir[1] === 'rtl' && dir[2] === 'rtl', dir.join(','));
    const fonts = await p.evaluate(async () => { await document.fonts.ready; return document.fonts.check('16px Rubik', 'שלום'); });
    check('text', 'bundled Rubik font loaded for Hebrew', fonts);
    const bad = [];
    for (let id = 1; id <= 18; id++) {
      await p.evaluate((id) => window.__game.loadLevel(id), id);
      await adv(p, 100);
      const t = await overlayText(p);
      if (/undefined|NaN|null|\[object/.test(t)) bad.push(`intro ${id}`);
      await fly(p, id, { pilot: 'route' });
      await adv(p, 3000);
      const hud = await p.evaluate(() => document.querySelector('.hud')?.innerText ?? '');
      if (/undefined|NaN|null|\[object/.test(hud)) bad.push(`hud ${id}: ${hud.match(/.{0,20}(undefined|NaN|null|\[object).{0,20}/)?.[0]}`);
      // every number in the HUD gauges sits in a <bdi>
      const naked = await p.evaluate(() => [...document.querySelectorAll('.gauges b, .tv, .rh-in b')].filter((e) => /\d/.test(e.textContent) && !e.querySelector('bdi')).map((e) => e.textContent));
      if (naked.length) bad.push(`naked numbers ${id}: ${naked.join('|')}`);
      if (id === 7 || id === 11 || id === 13) await shot(p, `hud-l${String(id).padStart(2, '0')}`);
    }
    check('text', 'no undefined/NaN in intros and HUDs; numbers isolated in <bdi>', bad.length === 0, bad.join(' ; '));
    await close(p);
  },
};

for (const [name, fn] of Object.entries(sections)) {
  if (only && !only.includes(name)) continue;
  // The dev server hot-reloads when src/ changes under it; rerun a section that a reload interrupted.
  for (let attempt = 1; attempt <= 3; attempt++) {
    const mark = [results.length, pass, fail];
    try { await fn(); break; } catch (e) {
      const reload = /context was destroyed|navigation|Target page, context or browser has been closed/.test(e.message);
      if (reload && attempt < 3) {
        results.length = mark[0]; pass = mark[1]; fail = mark[2];
        console.log(`(dev server reloaded during "${name}", rerunning)`);
        continue;
      }
      check(name, `section crashed: ${e.message.split('\n')[0]}`, false);
      break;
    }
  }
}
const uniq = [...new Set(errors)];
console.log(`\n${pass} pass, ${fail} fail${uniq.length ? `; console errors:\n${uniq.slice(0, 15).join('\n')}` : ''}`);
writeFileSync('docs/playtest/results.json', JSON.stringify({ date: new Date().toISOString(), url: URL, pass, fail, results, consoleErrors: uniq.slice(0, 50) }, null, 2));
await browser.close();
