// The workbook bridge in a real embed: a localhost parent page with the built game in an iframe at ?level=N.
// Checks `ready` before `level-start` for the deep-linked (locked) level, `level-complete` after the authored
// solution route wins, nothing more after the replay, and that a standalone page posts nothing.
// Builds nothing: run `npm run build` first. Serves dist/ with `vite preview` on :4241 (started and stopped here),
// or set BASE to a running server.  Usage: node tests/host-embed.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

const LEVEL = 2; // locked in a fresh save, no plan step
let preview = null;
const GAME = process.env.BASE ?? 'http://localhost:4241/';
if (!process.env.BASE) {
  preview = spawn(new URL('../node_modules/.bin/vite', import.meta.url).pathname, ['preview', '--host', '127.0.0.1', '--port', '4241', '--strictPort'], { stdio: 'ignore' });
  process.on('exit', () => preview.kill());
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(GAME)).ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
}

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
let ok = false;
const errs = [];
const parent = createServer((_, res) => {
  res.setHeader('content-type', 'text/html');
  res.end(`<body style="margin:0"><script>window.msgs=[];addEventListener('message',e=>msgs.push({origin:e.origin,...e.data}))</script><iframe id="g" src="${GAME}?level=${LEVEL}" style="width:100vw;height:100vh;border:0"></iframe></body>`);
}).listen(0); // any free port: other games' embed tests may hold 4999
await new Promise((r) => parent.once('listening', r));
const PARENT = `http://localhost:${parent.address().port}/`;
try {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(PARENT);
  const frame = await (await page.waitForSelector('#g')).contentFrame();
  await page.waitForFunction(() => window.msgs.some((m) => m.type === 'level-start'), null, { timeout: 90000 });
  const opened = JSON.parse(await frame.evaluate(() => window.render_game_to_text()));
  // the intro's go button, then the authored solution route in the real loop
  await frame.click('[data-act=go]');
  await frame.evaluate(() => { window.advanceTime(16); window.__game.autopilot(); });
  for (let i = 0; i < 120; i++) {
    const s = JSON.parse(await frame.evaluate(() => { window.advanceTime(1000); return window.render_game_to_text(); }));
    if (s.mode === 'result') break;
  }
  // replay and back to the card must not post a second level-complete
  if (await frame.$('[data-act=replay]')) {
    await frame.click('[data-act=replay]');
    await frame.evaluate(() => window.advanceTime(500));
    await frame.click('[data-act=back]');
  }
  const msgs = await page.evaluate(() => window.msgs);
  console.log('opened', opened.mode, 'level', opened.level?.id ?? opened.level);
  console.log(msgs.map((m) => `${m.type}${m.level ? ' L' + m.level : ''}${m.stars ? ' ★' + m.stars : ''}${m.durationMs ? ' ' + m.durationMs + 'ms' : ''}`).join(', '));
  const types = msgs.map((m) => m.type);
  ok =
    msgs.every((m) => m.source === 'workbook-game' && m.slug === 'cloud-shepherd' && m.version === 1) &&
    types[0] === 'ready' && types[1] === 'level-start' && msgs[1].level === LEVEL &&
    types.filter((t) => t === 'level-complete').length === 1 &&
    msgs.some((m) => m.type === 'level-complete' && m.level === LEVEL && m.stars >= 1 && m.durationMs > 0) &&
    !types.includes('error');

  // standalone: no parent, nothing posted and no errors
  const solo = await (await browser.newContext()).newPage();
  solo.on('pageerror', (e) => errs.push(String(e)));
  await solo.addInitScript(() => {
    window.__posted = 0;
    const post = window.postMessage.bind(window);
    window.parent.postMessage = (...a) => { window.__posted++; return post(...a); };
  });
  await solo.goto(GAME + '?level=3');
  await solo.waitForFunction(() => window.render_game_to_text && !document.getElementById('boot'), null, { timeout: 90000 });
  const solo3 = JSON.parse(await solo.evaluate(() => window.render_game_to_text()));
  const posted = await solo.evaluate(() => window.__posted);
  console.log('standalone ?level=3 opens', solo3.mode, solo3.level?.id ?? solo3.level, '| posts', posted);
  ok = ok && posted === 0 && solo3.mode === 'intro' && solo3.level?.id === 3;
} finally {
  console.log(ok && !errs.length ? 'bridge OK' : 'bridge FAILED', errs);
  await browser.close();
  parent.close();
  preview?.kill();
}
process.exit(ok && !errs.length ? 0 : 1);
