// The game: title → level select → intro → plan (place ג/ל, pick the hour) → flight → result → replay.
// All outcomes come from the pure rules in src/rules; this file only reads inputs, steps the sim and draws.
import * as THREE from 'three';
import type { CellKind, PressureCell } from '../rules/atmosphere.ts';
import { capacity, precipKind } from '../rules/atmosphere.ts';
import { LEVELS, levelById } from '../rules/levels.ts';
import { PLACES } from '../rules/geo.ts';
import {
  NO_INPUT, STEP, createRun, defaultPlan, effectiveCells, inZones, step, targetMet, type Input, type Run,
} from '../rules/sim.ts';
import type { LevelDef, PlanChoice } from '../rules/types.ts';
import { Assets } from '../scene/assets.ts';
import { CloudVisual, cloudWorld } from '../scene/cloud.ts';
import { Fx } from '../scene/fx.ts';
import { Labels } from '../scene/labels.ts';
import { Props, makeToken } from '../scene/props.ts';
import { Terrain, surfaceY } from '../scene/terrain.ts';
import { World, toWorldY } from '../scene/world.ts';
import { Sound } from './audio.ts';
import { causeLine, deg, failLine, feedbackLine, n0, pct, resultSummary, unitFor } from './explain.ts';
import { progress } from './progress.ts';
import { postToHost } from '../host.ts';

export type Mode = 'title' | 'levels' | 'intro' | 'plan' | 'flight' | 'result' | 'replay';

const WORLDS = ['', 'הים והחוף', 'מעל ההרים', 'מפת הגשם של ישראל', 'החורף הארוך'];
const LABEL_PLACES = ['telaviv', 'haifa', 'jerusalem', 'beersheva', 'eilat', 'kinneret', 'hermon', 'deadsea', 'carmel', 'golan', 'safed', 'mitzperamon', 'ashkelon', 'netanya'];
const KIND_HE: Record<string, string> = { rain: 'גשם', slush: 'גשם ושלג', snow: 'שלג' };
const fmtHour = (h: number) => `${String(h).padStart(2, '0')}:00`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export class Game {
  world: World;
  assets = new Assets();
  terrain!: Terrain;
  cloud!: CloudVisual;
  fx = new Fx();
  props!: Props;
  labels: Labels;
  sound = new Sound();
  mode: Mode = 'title';
  level: LevelDef | null = null;
  run: Run | null = null;
  plan: PlanChoice = { tokens: [] };
  paused = false;
  fast = false;
  private acc = 0;
  private time = 0;
  private keys = new Set<string>();
  private pourBtn = false;
  private puffQueued = false;
  private seasonQueued = false;
  private joy = { id: -1, x0: 0, y0: 0, x: 0, y: 0 };
  private heading = Math.PI / 2;
  private camPos = new THREE.Vector3(95, 250, 50);
  private camLook = new THREE.Vector3(95, 0, -230);
  private camGoalPos = new THREE.Vector3();
  private camGoalLook = new THREE.Vector3();
  private camBlend = 1;
  private selectedKind: CellKind = 'L';
  private hintUsed = false;
  private hintSlot: string | null = null;
  private hintT = 0;
  private fbIdx = 0;
  private evIdx = 0;
  private line = { html: '', t: 0, prio: 0 };
  private wasSaturated = false;
  private boltCd = 3;
  private endT = 0;
  private hudT = 0;
  private arrowsT = 0;
  private replayT = 0;
  private replayObj: THREE.Group | null = null;
  private routeLine: THREE.Line | null = null;
  private flightCellsShown = '';

  // DOM
  private hud: HTMLDivElement;
  private overlay: HTMLDivElement;
  private planPanel: HTMLDivElement;
  private toast: HTMLDivElement;
  private joyEl: HTMLDivElement;
  private launchEl: HTMLDivElement;

  constructor(private root: HTMLElement) {
    const canvas = el('canvas', 'game-canvas');
    root.appendChild(canvas);
    this.world = new World(canvas);
    this.labels = new Labels(root);
    this.hud = el('div', 'hud hidden');
    this.planPanel = el('div', 'plan-panel hidden');
    this.overlay = el('div', 'overlay hidden');
    this.toast = el('div', 'toast hidden');
    this.joyEl = el('div', 'joy hidden', '<div class="joy-knob"></div>');
    this.launchEl = el('div', 'launch-wrap hidden');
    root.append(this.hud, this.planPanel, this.launchEl, this.toast, this.joyEl, this.overlay);
    this.sound.muted = progress.muted;
    this.bindInput(canvas);
  }

  async init(onProgress: (f: number) => void) {
    await this.assets.load('./models/', (f) => onProgress(f * 0.8));
    await document.fonts?.ready;
    this.terrain = new Terrain();
    onProgress(0.9);
    this.cloud = new CloudVisual(this.assets);
    this.props = new Props(this.assets);
    this.world.scene.add(this.terrain.group, this.props.group, this.cloud.group, this.fx.group);
    this.cloud.group.visible = false;
    this.world.setMood({ night: 0, storm: 0, summer: 0 });
    this.terrain.setMood(0, this.world.scene.fog as THREE.Fog);
    onProgress(1);
    this.showTitle();
  }

  // ───────────────────────── screens ─────────────────────────

  private setOverlay(html: string, cls = '') {
    this.overlay.className = `overlay ${cls}`;
    this.overlay.innerHTML = html;
  }

  private hideOverlay() { this.overlay.className = 'overlay hidden'; this.overlay.innerHTML = ''; }

  showTitle() {
    this.mode = 'title';
    this.leaveLevel();
    this.overviewCamera();
    const any = LEVELS.some((l) => progress.stars(l.id) > 0);
    this.setOverlay(`
      <div class="title-card">
        <div class="title-cloud">☁</div>
        <h1>רועה <span>העננים</span></h1>
        <p class="tag">הובילו את ענני מעל הים, במעלה ההרים ואל השדות. אוויר שמתקרר מגיע לרוויה, ואז יורד גשם.</p>
        <div class="row">
          <button class="btn primary" data-act="play">${any ? 'המשך' : 'שחקו'}</button>
          <button class="btn" data-act="levels">בחירת שלב</button>
        </div>
        <p class="fine">מפה סכמטית של ישראל (גובה מוגזם פי 5). ערכי המודל מפושטים לצורכי לימוד.</p>
      </div>`, 'title');
    this.overlay.querySelector('[data-act=play]')!.addEventListener('click', () => {
      this.sound.unlock(); this.sound.click();
      const next = LEVELS.find((l) => progress.stars(l.id) === 0 && progress.unlocked(l.id)) ?? LEVELS[0];
      this.loadLevel(next.id);
    });
    this.overlay.querySelector('[data-act=levels]')!.addEventListener('click', () => { this.sound.unlock(); this.sound.click(); this.showLevels(); });
  }

  showLevels() {
    this.mode = 'levels';
    this.leaveLevel();
    this.overviewCamera();
    let html = '<div class="levels-card"><div class="levels-head"><h2>בחירת שלב</h2><button class="btn small" data-act="back">חזרה</button></div>';
    for (let w = 1; w <= 4; w++) {
      html += `<h3>עולם <bdi class="num">${w}</bdi> · ${WORLDS[w]}</h3><div class="level-grid">`;
      for (const l of LEVELS.filter((x) => x.world === w)) {
        const s = progress.stars(l.id), open = progress.unlocked(l.id);
        html += `<button class="level-btn ${open ? '' : 'locked'}" data-id="${l.id}" ${open ? '' : 'disabled'}>
          <span class="lv-n"><bdi class="num">${l.id}</bdi></span><span class="lv-t">${l.title}</span>
          <span class="lv-s">${open ? '★'.repeat(s) + '☆'.repeat(3 - s) : '🔒'}</span></button>`;
      }
      html += '</div>';
    }
    html += '</div>';
    this.setOverlay(html, 'levels');
    this.overlay.querySelector('[data-act=back]')!.addEventListener('click', () => { this.sound.click(); this.showTitle(); });
    this.overlay.querySelectorAll<HTMLButtonElement>('.level-btn').forEach((b) =>
      b.addEventListener('click', () => { this.sound.unlock(); this.sound.click(); this.loadLevel(Number(b.dataset.id)); }));
  }

  private leaveLevel() {
    this.hud.className = 'hud hidden';
    this.planPanel.className = 'plan-panel hidden';
    this.launchEl.className = 'launch-wrap hidden';
    this.toast.className = 'toast hidden';
    this.cloud?.group && (this.cloud.group.visible = false);
    this.labels.clear();
    this.props?.clearLevel();
    this.fx.clear();
    this.clearReplay();
    this.run = null;
    this.level = null;
    this.paused = false;
    this.sound.silence();
  }

  loadLevel(id: number) {
    const level = levelById(id);
    this.leaveLevel();
    this.level = level;
    this.plan = { ...defaultPlan(level), tokens: [] };
    this.hintUsed = false;
    this.hintSlot = null;
    this.terrain.reset();
    this.props.buildLevel(level);
    this.props.showFixedTokens(level.storms[0].cells);
    this.props.setSlotsVisible(true);
    this.applyMood(level.storms[0]);
    this.placeLabels();
    this.mode = 'intro';
    this.planCamera(true);
    const t = level.targets.filter((x) => !x.optional);
    this.setOverlay(`
      <div class="intro-card">
        <div class="intro-world">עולם <bdi class="num">${level.world}</bdi> · ${WORLDS[level.world]} · שלב <bdi class="num">${level.id}</bdi></div>
        <h2>${level.title}</h2>
        <p>${level.brief}</p>
        <div class="goal">🎯 ${level.goal}</div>
        <ul class="intro-targets">${t.map((x) => `<li>${this.targetBadge(x.kind)} ${x.he}: ${x.max !== undefined ? `<bdi class="num">${x.need}–${x.max}</bdi>` : `<bdi class="num">${x.need}</bdi>`} ${unitFor(x)}</li>`).join('')}</ul>
        ${level.storms.length > 1 ? `<p class="fine">${level.storms.length} סערות. ${level.storms[0].mmScale ? `כל סערה מייצגת חודש או חורף שלם (ערכים מוקטנים).` : ''}</p>` : ''}
        ${!progress.seenControls ? `<div class="controls-help">
          <div><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> / גרירה: היטו את ענני לצדי הרוח</div>
          <div><kbd>רווח</kbd> / כפתור: להמטיר (רק באוויר רווי)</div>
          <div><kbd>Shift</kbd>: נשיפה לצד · <kbd>P</kbd> השהיה · <kbd>F</kbd> הרצה מהירה</div>
          <div class="fine">אי אפשר לטוס נגד הרוח: היא תמיד נושבת מהרמה (ג) אל השקע (ל).</div></div>` : ''}
        <button class="btn primary" data-act="go">${this.needsPlan(level) ? 'לתכנון' : 'יוצאים!'}</button>
      </div>`, 'intro');
    this.overlay.querySelector('[data-act=go]')!.addEventListener('click', () => {
      this.sound.unlock(); this.sound.go();
      progress.seenControls = true;
      this.hideOverlay();
      if (this.needsPlan(level)) this.enterPlan(); else this.startFlight();
    });
  }

  private needsPlan(l: LevelDef) { return !!(l.plan.slots?.length || l.plan.hours?.length); }

  private targetBadge(kind: string) {
    return kind === 'snow' ? '❄' : kind === 'shade' ? '⛱' : '💧';
  }

  private placeLabels() {
    const l = this.level!;
    if (l.labels) {
      for (const id of LABEL_PLACES) {
        const p = PLACES[id];
        if (l.targets.some((t) => t.zones.some((z) => Math.hypot(z.x - p.x, z.y - p.y) < z.r + 4))) continue;
        this.labels.set(`place:${id}`, [p.x, Math.max(0, surfaceY(p.x, p.y)) + 1.2, -p.y], p.he, 'lbl place');
      }
    }
    if (l.id >= 11 && l.id !== 13) this.labels.set('place:arid', [62, 1.5, -207], 'קו הצחיחות (סכמטי)', 'lbl arid');
  }

  // ───────────────────────── plan ─────────────────────────

  private enterPlan() {
    const l = this.level!;
    this.mode = 'plan';
    this.planCamera(false);
    this.props.setSlotsVisible(true, this.hintSlot);
    this.props.setFixedTokensVisible(true);
    this.renderPlanPanel();
  }

  private tokensLeft(kind: CellKind) {
    const total = this.level!.plan.tokens?.[kind] ?? 0;
    return total - this.plan.tokens.filter((t) => t.kind === kind).length;
  }

  private renderPlanPanel() {
    const l = this.level!;
    const p = l.plan;
    const kinds: CellKind[] = (['L', 'H'] as CellKind[]).filter((k) => (p.tokens?.[k] ?? 0) > 0);
    if (kinds.length && !kinds.includes(this.selectedKind)) this.selectedKind = kinds[0];
    const allPlaced = kinds.every((k) => this.tokensLeft(k) === 0);
    const canGo = !p.mustPlace || allPlaced;
    let html = `<div class="plan-head"><b>${l.title}</b><span>${l.goal}</span></div>`;
    if (kinds.length) {
      html += `<div class="plan-sec"><div class="plan-label">הניחו על המפה (לחצו על טבעת לבנה):</div><div class="tray">`;
      for (const k of kinds) {
        html += `<button class="tok tok-${k} ${this.selectedKind === k ? 'sel' : ''}" data-kind="${k}">
          <span class="coin">${k === 'H' ? 'ג' : 'ל'}</span><span>${k === 'H' ? 'רמה' : 'שקע'}</span>
          <span class="cnt">נותרו <bdi class="num">${this.tokensLeft(k)}</bdi></span></button>`;
      }
      html += `</div><div class="fine">האוויר זורם מהרמה (ג) אל השקע (ל). כל ג/ל אפור הוא חלק ממזג האוויר של היום.</div></div>`;
    }
    if (p.hours?.length) {
      html += `<div class="plan-sec"><div class="plan-label">באיזו שעה יוצאים?</div><div class="hours">`;
      for (const h of p.hours) {
        const icon = h >= 7 && h <= 18 ? '☀' : '🌙';
        html += `<button class="hour ${this.plan.hour === h ? 'sel' : ''}" data-hour="${h}">${icon} <bdi class="num">${fmtHour(h)}</bdi></button>`;
      }
      html += `</div></div>`;
    }
    html += `<div class="plan-actions">
      ${l.hints ? `<button class="btn small" data-act="hint">רמז</button>` : ''}
      <button class="btn small" data-act="clear">ניקוי</button></div>
      ${canGo ? '' : `<div class="fine warn">צריך להניח את כל האסימונים לפני היציאה.</div>`}`;
    this.launchEl.innerHTML = `<button class="btn primary launch" data-act="launch" ${canGo ? '' : 'disabled'}>יוצאים! ☁</button>`;
    this.launchEl.className = 'launch-wrap';
    this.launchEl.querySelector('[data-act=launch]')!.addEventListener('click', () => { this.sound.go(); this.startFlight(); });
    this.planPanel.innerHTML = html;
    this.planPanel.className = 'plan-panel';
    this.planPanel.querySelectorAll<HTMLButtonElement>('.tok').forEach((b) => b.addEventListener('click', () => {
      this.selectedKind = b.dataset.kind as CellKind; this.sound.click(); this.renderPlanPanel();
    }));
    this.planPanel.querySelectorAll<HTMLButtonElement>('.hour').forEach((b) => b.addEventListener('click', () => {
      this.plan.hour = Number(b.dataset.hour); this.sound.click(); this.applyMood(this.level!.storms[0]); this.renderPlanPanel();
    }));
    this.planPanel.querySelector('[data-act=clear]')?.addEventListener('click', () => {
      for (const t of this.plan.tokens) this.props.placeToken(t.slot, null);
      this.plan.tokens = [];
      this.props.setSlotsVisible(true, this.hintSlot);
      this.sound.click();
      this.renderPlanPanel();
    });
    this.planPanel.querySelector('[data-act=hint]')?.addEventListener('click', () => this.planHint());
  }

  private planHint() {
    const l = this.level!;
    this.hintUsed = true;
    const sol = l.solution.plan;
    const tk = sol.tokens[0];
    let msg = '';
    if (tk) {
      this.hintSlot = tk.slot;
      this.props.setSlotsVisible(true, this.hintSlot);
      msg = 'הטבעת הירוקה: חשבו לאן תזרום הרוח אם יהיה שם שקע. האם היא תעבור מעל היעד?';
    } else if (sol.hour !== undefined) {
      msg = 'מתי היבשה חמה הרבה יותר מהים? אז נוצר שקע מעל היבשה.';
    }
    this.showLine(msg, 3);
    this.sound.click();
  }

  /** Capture/test hook: place the selected token on a slot by id (same path as a click). */
  slotClickById(id: string) {
    const s = this.props.slots.find((q) => q.slot.id === id);
    if (!s) return;
    const v = new THREE.Vector3(s.slot.x, Math.max(0, surfaceY(s.slot.x, s.slot.y)) + 1, -s.slot.y).project(this.world.camera);
    const r = this.world.renderer.domElement.getBoundingClientRect();
    this.slotClick(r.left + (v.x * 0.5 + 0.5) * r.width, r.top + (-v.y * 0.5 + 0.5) * r.height);
  }

  private slotClick(sx: number, sy: number) {
    if (!this.level) return;
    const r = this.world.renderer.domElement.getBoundingClientRect();
    let best: string | null = null, bestD = 70;
    const v = new THREE.Vector3();
    for (const s of this.props.slots) {
      v.set(s.slot.x, Math.max(0, surfaceY(s.slot.x, s.slot.y)) + 1, -s.slot.y).project(this.world.camera);
      const px = (v.x * 0.5 + 0.5) * r.width, py = (-v.y * 0.5 + 0.5) * r.height;
      const d = Math.hypot(px - (sx - r.left), py - (sy - r.top));
      if (d < bestD) { bestD = d; best = s.slot.id; }
    }
    if (!best) return;
    const existing = this.plan.tokens.find((t) => t.slot === best);
    const slot = this.level.plan.slots!.find((s) => s.id === best)!;
    if (existing) {
      this.plan.tokens = this.plan.tokens.filter((t) => t !== existing);
      this.props.placeToken(best, null);
      this.sound.click();
    } else {
      let kind = this.selectedKind;
      if (!slot.kinds.includes(kind)) kind = slot.kinds[0];
      if (this.tokensLeft(kind) <= 0) {
        // move the token: take it from the slot where it was
        const prev = this.plan.tokens.find((t) => t.kind === kind);
        if (!prev) { this.sound.denied(); return; }
        this.plan.tokens = this.plan.tokens.filter((t) => t !== prev);
        this.props.placeToken(prev.slot, null);
      }
      this.plan.tokens.push({ slot: best, kind });
      this.props.placeToken(best, kind);
      this.sound.place();
    }
    this.props.setSlotsVisible(true, this.hintSlot);
    this.renderPlanPanel();
  }

  // ───────────────────────── flight ─────────────────────────

  startFlight() {
    const l = this.level!;
    this.hideOverlay();
    this.planPanel.className = 'plan-panel hidden';
    this.launchEl.className = 'launch-wrap hidden';
    this.props.setSlotsVisible(false);
    this.run = createRun(l, this.plan);
    this.run.hintUsed = this.hintUsed;
    this.dust = 0;
    this.fbIdx = 0; this.evIdx = 0; this.endT = 0; this.acc = 0;
    this.wasSaturated = false;
    this.flightCellsShown = '';
    this.mode = 'flight';
    this.paused = false;
    this.fast = false;
    this.terrain.reset();
    this.fx.clear();
    this.cloud.group.visible = true;
    this.heading = this.windHeading();
    this.camBlend = 0;
    this.buildHud();
    this.applyMood(this.run.env);
    postToHost({ type: 'level-start', level: l.id });
  }

  /** Before the first step: look from the start toward the first target. */
  private windHeading() {
    const r = this.run!;
    const t = r.level.targets[0]?.zones[0];
    return t ? Math.atan2(t.x - r.cloud.x, t.y - r.cloud.y) : Math.PI / 2;
  }

  private buildHud() {
    const l = this.level!;
    const r = this.run!;
    const multi = l.storms.length > 1;
    this.hud.innerHTML = `
      <div class="hud-top">
        <div class="hud-level"><span class="lv">שלב <bdi class="num">${l.id}</bdi></span> <b>${l.title}</b><div class="goal-s">${l.goal}</div></div>
        <div class="hud-btns">
          <button class="ib" data-act="pause" title="השהיה (P)">⏸</button>
          <button class="ib" data-act="fast" title="הרצה מהירה (F)">⏩</button>
          <button class="ib" data-act="mute" title="שקט (M)">${this.sound.muted ? '🔇' : '🔊'}</button>
          <button class="ib" data-act="restart" title="מהתחלה (R)">↻</button>
          ${l.hints ? `<button class="ib" data-act="hint" title="רמז (H)">💡</button>` : ''}
        </div>
      </div>
      ${multi ? `<div class="storm-bar"><span data-k="storm"></span><div class="sbar"><i data-k="stormfill"></i></div></div>` : ''}
      <div class="targets" data-k="targets"></div>
      <div class="gauges">
        <div class="rh-ring" data-k="rhring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="trk"/><circle cx="50" cy="50" r="42" class="val" data-k="rharc"/></svg>
          <div class="rh-in"><b data-k="rh"></b><span>לחות יחסית</span></div></div>
        <div class="bars">
          <div class="vbar alt" title="גובה"><i class="ground" data-k="altground"></i><i class="mark" data-k="altmark"></i><span>גובה</span></div>
          <div class="vbar temp" title="טמפרטורה"><i class="fill" data-k="tempfill"></i><i class="zero" data-k="tempzero"></i><span>°C</span></div>
        </div>
        <div class="gstack">
          <div class="g"><span>גובה</span><b data-k="alt"></b></div>
          <div class="g"><span>טמפרטורה</span><b data-k="temp"></b></div>
          <div class="g"><span>אדים בענן</span><b data-k="w"></b></div>
          <div class="g"><span>ענני יכול להכיל</span><b data-k="cap"></b></div>
          <div class="g"><span>על הקרקע</span><b data-k="ground"></b></div>
        </div>
      </div>
      <div class="actions">
        <button class="pour" data-act="pour"><span class="pi">💧</span><span data-k="pourlbl">להמטיר</span><small>רווח</small></button>
        <button class="puff" data-act="puff"><span>💨</span><span>נשיפה</span><i data-k="puffcd"></i></button>
        ${r.env.turnsInto ? `<button class="season" data-act="season"><span>🍂</span><span>סובבו עונה</span></button>` : ''}
      </div>
      <div class="lines"><div class="line" data-k="line"></div><div class="cause" data-k="cause"></div></div>
      <div class="schematic">מפה סכמטית · גובה ×5 · ערכים מפושטים</div>`;
    this.hud.className = 'hud';
    const act = (name: string, f: () => void) => this.hud.querySelector(`[data-act=${name}]`)?.addEventListener('click', f);
    act('pause', () => this.setPaused(!this.paused));
    act('fast', () => { this.fast = !this.fast; this.syncHudButtons(); });
    act('mute', () => this.toggleMute());
    act('restart', () => this.restart());
    act('hint', () => this.flightHint());
    act('puff', () => { this.puffQueued = true; });
    act('season', () => { this.seasonQueued = true; });
    const pour = this.hud.querySelector<HTMLButtonElement>('[data-act=pour]')!;
    pour.addEventListener('pointerdown', (e) => { e.preventDefault(); this.pourBtn = true; pour.setPointerCapture(e.pointerId); });
    const up = () => { this.pourBtn = false; };
    pour.addEventListener('pointerup', up);
    pour.addEventListener('pointercancel', up);
    pour.addEventListener('lostpointercapture', up);
  }

  private syncHudButtons() {
    const f = this.hud.querySelector('[data-act=fast]');
    f?.classList.toggle('on', this.fast);
    const p = this.hud.querySelector('[data-act=pause]');
    if (p) p.textContent = this.paused ? '▶' : '⏸';
    const m = this.hud.querySelector('[data-act=mute]');
    if (m) m.textContent = this.sound.muted ? '🔇' : '🔊';
  }

  toggleMute() {
    this.sound.setMuted(!this.sound.muted);
    progress.muted = this.sound.muted;
    this.syncHudButtons();
  }

  setPaused(p: boolean) {
    if (this.mode !== 'flight') return;
    this.paused = p;
    this.syncHudButtons();
    if (p) {
      this.sound.silence();
      this.setOverlay(`<div class="pause-card"><h2>הפסקה</h2>
        <button class="btn primary" data-act="resume">המשך</button>
        <button class="btn" data-act="restart">מהתחלה</button>
        <button class="btn" data-act="levels">בחירת שלב</button></div>`, 'pause');
      this.overlay.querySelector('[data-act=resume]')!.addEventListener('click', () => this.setPaused(false));
      this.overlay.querySelector('[data-act=restart]')!.addEventListener('click', () => this.restart());
      this.overlay.querySelector('[data-act=levels]')!.addEventListener('click', () => this.showLevels());
    } else this.hideOverlay();
  }

  restart() {
    if (!this.level) return;
    const plan = this.plan;
    const lv = this.level.id;
    const needsPlan = this.needsPlan(this.level);
    this.loadLevel(lv);
    this.hideOverlay();
    // keep the plan the player chose so a retry is one click
    this.plan = { tokens: [...plan.tokens], hour: plan.hour };
    for (const t of this.plan.tokens) this.props.placeToken(t.slot, t.kind);
    if (needsPlan) this.enterPlan(); else this.startFlight();
  }

  private flightHint() {
    const r = this.run;
    if (!r || !this.level?.hints) return;
    r.hintUsed = true;
    this.hintT = 8;
    const route = this.level.solution.routes[r.storm] ?? [];
    if (this.routeLine) this.world.scene.remove(this.routeLine);
    const pts = [new THREE.Vector3(r.cloud.x, toWorldY(r.cloud.z) + 1, -r.cloud.y)];
    for (const p of route) pts.push(new THREE.Vector3(p.x, Math.max(0, surfaceY(p.x, p.y)) + 3, -p.y));
    const curve = new THREE.CatmullRomCurve3(pts);
    this.routeLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(80)),
      new THREE.LineDashedMaterial({ color: '#5dff8a', dashSize: 1.2, gapSize: 0.8, transparent: true, opacity: 0.9 }));
    this.routeLine.computeLineDistances();
    this.world.scene.add(this.routeLine);
    this.showLine('הקו הירוק: דרך אפשרית. שימו לב איפה האוויר עולה ומתקרר.', 2);
  }

  /** Capture/test hook: a scripted pilot that presses the same inputs a player can. */
  pilot: ((run: Run) => Input) | null = null;

  /** Capture/test hook: open a level and launch it with a given plan. */
  quickStart(id: number, plan?: PlanChoice) {
    this.loadLevel(id);
    this.hideOverlay();
    if (plan) {
      this.plan = { tokens: [...plan.tokens], hour: plan.hour ?? this.plan.hour };
      for (const t of this.plan.tokens) this.props.placeToken(t.slot, t.kind);
    }
    this.startFlight();
  }

  private input(): Input {
    if (this.pilot && this.run) return this.pilot(this.run);
    const k = this.keys;
    const up = (k.has('ArrowUp') || k.has('KeyW') ? 1 : 0) - (k.has('ArrowDown') || k.has('KeyS') ? 1 : 0);
    const right = (k.has('ArrowRight') || k.has('KeyD') ? 1 : 0) - (k.has('ArrowLeft') || k.has('KeyA') ? 1 : 0);
    let fwd = up, rgt = right;
    if (this.joy.id >= 0) {
      const dx = this.joy.x - this.joy.x0, dy = this.joy.y - this.joy.y0;
      const len = Math.hypot(dx, dy);
      if (len > 8) { rgt = dx / Math.max(len, 60); fwd = -dy / Math.max(len, 60); }
    }
    const fx = Math.sin(this.heading), fy = Math.cos(this.heading);
    const rx = Math.cos(this.heading), ry = -Math.sin(this.heading);
    return {
      steerX: fwd * fx + rgt * rx,
      steerY: fwd * fy + rgt * ry,
      pour: this.pourBtn || k.has('Space'),
      puff: this.puffQueued,
      season: this.seasonQueued,
    };
  }

  private stepFlight(dt: number) {
    const r = this.run!;
    const speed = this.fast ? 3 : 1;
    this.acc += dt * speed;
    let n = 0;
    while (this.acc >= STEP && n < 12) {
      this.acc -= STEP;
      n++;
      const inp = r.status === 'flying' ? this.input() : NO_INPUT;
      if (inp.puff && r.cloud.puffCd <= 0) this.sound.puff();
      const stormBefore = r.storm, envBefore = r.env;
      step(r, inp);
      this.puffQueued = false;
      if (inp.season) this.seasonQueued = false;
      if (r.storm !== stormBefore) this.onNewStorm();
      else if (r.env !== envBefore) this.applyMood(r.env);
    }
    if (n === 12) this.acc = 0;
    // new precipitation paints the ground
    for (; this.evIdx < r.events.length; this.evIdx++) {
      const e = r.events[this.evIdx];
      this.terrain.precip(e.x, e.y, e.mm / (r.env.mmScale ?? 1), e.kind);
    }
    if (this.evIdx > r.events.length) this.evIdx = r.events.length;
    // feedback lines and sounds
    for (; this.fbIdx < r.feedback.length; this.fbIdx++) {
      const f = r.feedback[this.fbIdx];
      const line = feedbackLine(r, f);
      if (line) this.showLine(line, f.key === 'targetDone' ? 2 : 3);
      if (f.key === 'targetDone') this.sound.target();
      if (f.key === 'dryPour' || f.key === 'sinking') this.sound.denied();
      if (f.key === 'flood') this.sound.splash();
    }
    const sat = r.cloud.excess > 0;
    if (sat && !this.wasSaturated) { this.sound.saturated(); this.showLine(feedbackLine(r, { key: 'saturated' })!, 2); }
    this.wasSaturated = sat;
    if (r.status !== 'flying') {
      this.endT += dt;
      if (this.endT > 1.4) this.showResult();
    }
  }

  private onNewStorm() {
    const r = this.run!;
    this.applyMood(r.env);
    this.wasSaturated = false;
    this.flightCellsShown = '';
    const c = r.cloud;
    this.heading = Math.atan2(c.wind.u || 0.01, c.wind.v || 0);
    if (this.routeLine) { this.world.scene.remove(this.routeLine); this.routeLine = null; }
  }

  private dust = 0;

  private applyMood(env: { night?: boolean; hour: number; season: string; lightning?: boolean; khamsin?: unknown }) {
    const hour = this.mode === 'plan' || this.mode === 'intro' ? (this.plan.hour ?? env.hour) : env.hour;
    const night = env.night || hour < 6 || hour >= 19 ? 1 : 0;
    const storm = env.lightning ? 0.8 : env.season === 'winter' ? 0.35 : 0;
    const summer = env.season === 'summer' ? 1 : env.khamsin ? 0.6 : 0;
    this.world.setMood({ night, storm, summer, dust: this.dust });
    this.terrain.setMood(night, this.world.scene.fog as THREE.Fog);
    this.sound.mood = storm;
  }

  private showLine(html: string, prio: number) {
    if (!html) return;
    if (this.line.t > 0 && prio < this.line.prio) return;
    this.line = { html, t: prio >= 2 ? 4.5 : 3.5, prio };
    const e = this.hud.querySelector<HTMLElement>('[data-k=line]');
    if (e) { e.innerHTML = html; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }
    if (this.mode === 'plan') {
      this.toast.innerHTML = html;
      this.toast.className = 'toast';
      this.line.t = 5;
    }
  }

  private updateHud(dt: number) {
    const r = this.run!;
    this.hudT -= dt;
    if (this.line.t > 0) {
      this.line.t -= dt;
      if (this.line.t <= 0) {
        const e = this.hud.querySelector<HTMLElement>('[data-k=line]');
        if (e) e.innerHTML = '';
        this.line.prio = 0;
      }
    }
    if (this.hudT > 0) return;
    this.hudT = 0.08;
    const c = r.cloud;
    const q = (k: string) => this.hud.querySelector<HTMLElement>(`[data-k=${k}]`);
    const set = (k: string, h: string) => { const e = q(k); if (e && e.innerHTML !== h) e.innerHTML = h; };
    set('rh', pct(c.rh));
    const arc = q('rharc');
    if (arc) {
      const len = 2 * Math.PI * 42;
      arc.setAttribute('stroke-dasharray', `${len * Math.min(1, c.rh)} ${len}`);
      arc.classList.toggle('full', c.excess > 0);
    }
    q('rhring')?.classList.toggle('full', c.excess > 0);
    set('alt', `<bdi class="num">${Math.round(c.z / 10) * 10}</bdi> מ'`);
    set('temp', deg(c.T));
    // bars: 0–2,600 m and −10…35 °C
    const altPct = (m: number) => `${THREE.MathUtils.clamp(m / 2600, 0, 1) * 100}%`;
    const tPct = (t: number) => THREE.MathUtils.clamp((t + 10) / 45, 0, 1);
    const ag = q('altground'); if (ag) ag.style.height = altPct(Math.max(0, c.ground));
    const am = q('altmark'); if (am) am.style.bottom = altPct(c.z);
    const tf = q('tempfill');
    if (tf) { tf.style.height = `${tPct(c.T) * 100}%`; tf.classList.toggle('cold', c.T <= 1); }
    const tz = q('tempzero'); if (tz) tz.style.bottom = `${tPct(0) * 100}%`;
    set('w', `<bdi class="num">${c.W.toFixed(1)}</bdi> <small>ג'/מ"ק</small>`);
    set('cap', `<bdi class="num">${capacity(c.T).toFixed(1)}</bdi> <small>ב־${deg(c.T)}</small>`);
    const kind = precipKind(c.groundT);
    set('ground', `${deg(c.groundT)} · ${KIND_HE[kind]}`);
    set('pourlbl', c.excess > 0 ? KIND_HE[kind] : 'להמטיר');
    const pour = this.hud.querySelector('[data-act=pour]');
    pour?.classList.toggle('ready', c.excess > 0);
    pour?.classList.toggle('snow', kind === 'snow');
    pour?.classList.toggle('down', c.pouring);
    const pi = pour?.querySelector('.pi');
    if (pi) pi.textContent = kind === 'snow' ? '❄' : '💧';
    const cd = q('puffcd');
    if (cd) cd.style.transform = `scaleX(${Math.max(0, c.puffCd / 4)})`;
    const season = this.hud.querySelector<HTMLElement>('[data-act=season]');
    if (season) {
      season.classList.toggle('hidden', !r.env.turnsInto);
      season.classList.toggle('armed', r.seasonTurnAt !== null && !r.seasonTurned);
    }
    // targets
    let th = '';
    for (const t of r.level.targets) {
      if (t.storms && !t.storms.includes(r.storm) && r.level.storms.length > 1 && !t.max) continue;
      const v = r.progress[t.id];
      const metNow = targetMet(r, t);
      const over = t.max !== undefined && v > t.max;
      const top = t.max ?? t.need;
      const fill = Math.min(1, v / (top * (t.max ? 1.15 : 1)));
      const band = t.max ? `<i class="band" style="inset-inline-start:${(t.need / (top * 1.15)) * 100}%;width:${((t.max - t.need) / (top * 1.15)) * 100}%"></i>` : '';
      const red = t.redLine ? `<i class="redline" style="inset-inline-start:${(t.redLine / top) * 100}%"></i>` : '';
      th += `<div class="tgt ${metNow ? 'met' : ''} ${over ? 'over' : ''} ${t.optional ? 'opt' : ''} ${inZones(t.zones, c.x, c.y) ? 'here' : ''}">
        <div class="tn">${this.targetBadge(t.kind)} ${t.he}${t.optional ? ' <small>(בונוס?)</small>' : ''}</div>
        <div class="tb"><i style="width:${fill * 100}%"></i>${band}${red}</div>
        <div class="tv"><bdi class="num">${t.kind === 'shade' ? v.toFixed(1) : Math.round(v)} / ${t.max ? `${t.need}–${t.max}` : t.need}</bdi> ${unitFor(t)}</div></div>`;
    }
    set('targets', th);
    if (r.level.storms.length > 1) {
      set('storm', `סערה <bdi class="num">${r.storm + 1}/${r.level.storms.length}</bdi>${r.env.label ? ` · ${r.env.label}` : ''}${r.env.mmScale ? ` <small>(×<bdi class="num">${r.env.mmScale}</bdi>)</small>` : ''}`);
      const f = q('stormfill');
      if (f) f.style.width = `${Math.min(100, (r.t / r.env.duration) * 100)}%`;
    }
    set('cause', causeLine(r));
  }

  private updateFlightVisuals(dt: number) {
    const r = this.run!;
    const c = r.cloud;
    const night = r.env.night || r.env.hour < 6 || r.env.hour >= 19 ? 1 : 0;
    const groundY = Math.max(surfaceY(c.x, c.y), c.surface === 'land' ? -99 : 0.02);
    this.cloud.update(dt, c, groundY, night);
    const cp = cloudWorld(c);
    // precipitation and vapour
    if (c.pouring && c.excess > 0 && r.status === 'flying') {
      this.fx.precip(dt, cp, 1.6 * this.cloud.scale, precipKind(c.groundT), 1);
    }
    if (c.surface !== 'land' && c.rh < 0.99 && r.env.season !== 'summer') this.fx.mist(dt, cp, this.cloud.scale * 1.5, 'gain', groundY, 1);
    else if (c.surface !== 'land' && r.env.season === 'summer') this.fx.mist(dt, cp, this.cloud.scale * 1.5, 'gain', groundY, 0.4);
    if (c.rh < 0.65) this.fx.mist(dt, cp, this.cloud.scale * 1.6, r.khamsinExposure > 0 && r.env.khamsin ? 'khamsin' : 'loss', 0, 1.2);
    // khamsin: the sky turns dusty while ענני is inside the hot desert air
    let inK = 0;
    for (const z of r.env.khamsin?.zones ?? []) inK = Math.max(inK, THREE.MathUtils.clamp((z.r - Math.hypot(c.x - z.x, c.y - z.y)) / 20, 0, 1));
    if (Math.abs(inK - this.dust) > 0.02) { this.dust += (inK - this.dust) * Math.min(1, dt * 2); this.applyMood(r.env); }
    // lightning
    if (r.env.lightning && c.rh > 0.97 && r.status === 'flying') {
      this.boltCd -= dt;
      if (this.boltCd <= 0) {
        this.boltCd = 3 + Math.random() * 4;
        this.world.lightning = 1;
        this.cloud.flash = 1;
        this.fx.lightning(cp.clone().add(new THREE.Vector3(0, -0.6, 0)), groundY);
        this.sound.thunder();
      }
    }
    // wind cells as coins (fixed weather + sea-breeze cells); placed tokens are already on their slots
    const shown = effectiveCells(r.level, r.env, { tokens: [] });
    const key = JSON.stringify(shown.map((q) => [q.kind, Math.round(q.x), Math.round(q.y)]));
    if (key !== this.flightCellsShown) {
      this.flightCellsShown = key;
      this.props.showFixedTokens(shown);
    }
    this.arrowsT -= dt;
    if (this.arrowsT <= 0) {
      this.arrowsT = 0.4;
      this.fx.setArrows(r.level.showArrows ? r.cells : null, c.x, c.y, 2.2);
    }
    this.fx.update(dt, r.cells, { x: c.x, y: c.y }, toWorldY(c.z) + 0.5 - Math.max(0, surfaceY(c.x, c.y)));
    // targets
    for (const v of this.props.targets) {
      const t = v.t;
      const val = r.progress[t.id];
      const frac = t.drain ? val / t.need : val / t.need;
      v.update(frac, targetMet(r, t), t.max !== undefined && val > t.max, dt, this.time);
      this.labels.set(`tgt:${t.id}`, v.anchor, `${this.targetBadge(t.kind)} ${t.he} <bdi class="num">${t.kind === 'shade' ? val.toFixed(0) : Math.round(val)}/${t.max ? `${t.need}–${t.max}` : t.need}</bdi>`,
        `lbl tgt ${targetMet(r, t) ? 'met' : ''} ${t.optional ? 'opt' : ''}`);
    }
    this.props.updateWadis(r.wadiLoad, r.floods, dt);
    if (r.status === 'failed' && r.failReason === 'flood') { /* the jeep animation plays */ }
    this.sound.ambience(Math.hypot(c.wind.u, c.wind.v), c.pouring && c.excess > 0 ? 1 : 0);
    // chase camera: heading eases toward the travel direction
    const sp = Math.hypot(c.vx, c.vy);
    if (sp > 0.3) {
      const want = Math.atan2(c.vx, c.vy);
      let d = want - this.heading;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.heading += d * Math.min(1, dt * 0.5);
    }
    const fx = Math.sin(this.heading), fy = Math.cos(this.heading);
    this.cloud.faceYaw = -this.heading + 0.55;
    const dist = 15 + this.cloud.scale * 3.5;
    this.camGoalPos.set(cp.x - fx * dist, cp.y + 7 + this.cloud.scale * 1.8, cp.z + fy * dist);
    const minY = Math.max(0, surfaceY(this.camGoalPos.x, -this.camGoalPos.z)) + 2;
    if (this.camGoalPos.y < minY) this.camGoalPos.y = minY;
    this.camGoalLook.set(cp.x + fx * 7, cp.y - 1.5, cp.z - fy * 7);
    this.world.aimSun(cp);
    if (this.routeLine) {
      this.hintT -= dt;
      if (this.hintT <= 0) { this.world.scene.remove(this.routeLine); this.routeLine = null; }
    }
  }

  // ───────────────────────── result & replay ─────────────────────────

  private showResult() {
    const r = this.run!;
    const l = r.level;
    this.mode = 'result';
    this.sound.silence();
    const won = r.status === 'won';
    const s = resultSummary(r);
    if (won) { progress.record(l.id, s.stars); this.sound.win(); } else this.sound.fail();
    const next = LEVELS.find((x) => x.id === l.id + 1);
    this.hud.className = 'hud hidden';
    const why = won ? l.success : failLine(r, r.failReason!);
    const kinds = r.pouredByKind;
    const totalP = kinds.rain + kinds.slush + kinds.snow;
    this.setOverlay(`
      <div class="result-card ${won ? 'won' : 'lost'}">
        <h2>${won ? 'הצלחה!' : 'עוד ניסיון'}</h2>
        ${won ? `<div class="stars">${[0, 1, 2].map((i) => `<span class="${i < s.stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('')}</div>` : ''}
        <p class="why">${why}</p>
        <div class="balance">
          <div><span>ענני ספג</span><b><bdi class="num">${s.absorbed.toFixed(1)}</bdi></b></div>
          <div><span>ירד ${totalP > 0 ? (kinds.snow > kinds.rain ? 'כשלג' : 'כגשם') : ''}</span><b><bdi class="num">${s.poured.toFixed(1)}</bdi></b></div>
          <div><span>חזר לאוויר</span><b><bdi class="num">${s.dissipated.toFixed(1)}</bdi></b></div>
          <div><span>נשאר בענן</span><b><bdi class="num">${s.held.toFixed(1)}</bdi></b></div>
        </div>
        <div class="fine">יחידות מים מפושטות (ג'/מ"ק). כל מה שנספג נמצא באחד מהטורים, שום מים לא נעלמים.
        ${won ? `<br>★ ניצחון · ★ פחות מ־<bdi class="num">30%</bdi> גשם מחוץ ליעד (עכשיו ${pct(s.wastedPct)}) · ★ בלי רמז, שיטפון או חמסין` : ''}</div>
        <div class="row">
          <button class="btn" data-act="replay">שחזור המסלול</button>
          <button class="btn" data-act="retry">שוב</button>
          ${won && next ? `<button class="btn primary" data-act="next">לשלב הבא</button>` : ''}
          ${!won ? `<button class="btn primary" data-act="retry2">ננסה שוב</button>` : ''}
          <button class="btn small" data-act="levels">שלבים</button>
        </div>
      </div>`, 'result');
    if (won) s.stars && [0, 1, 2].slice(0, s.stars).forEach((i) => setTimeout(() => this.sound.star(i), 250 + i * 250));
    const on = (a: string, f: () => void) => this.overlay.querySelector(`[data-act=${a}]`)?.addEventListener('click', () => { this.sound.click(); f(); });
    on('replay', () => this.startReplay());
    on('retry', () => this.restart());
    on('retry2', () => this.restart());
    on('next', () => this.loadLevel(next!.id));
    on('levels', () => this.showLevels());
    if (won) postToHost({ type: 'level-complete', level: l.id, stars: s.stars, durationMs: Math.round(r.tTotal * 1000) });
  }

  private clearReplay() {
    if (this.replayObj) { this.world.scene.remove(this.replayObj); this.replayObj = null; }
    if (this.routeLine) { this.world.scene.remove(this.routeLine); this.routeLine = null; }
  }

  private startReplay() {
    const r = this.run!;
    this.mode = 'replay';
    this.clearReplay();
    this.fx.clear();
    this.props.showFixedTokens([]);
    this.replayT = 0;
    const g = new THREE.Group();
    const byStorm = new Map<number, typeof r.track>();
    for (const p of r.track) { if (!byStorm.has(p.storm)) byStorm.set(p.storm, []); byStorm.get(p.storm)!.push(p); }
    const dry = new THREE.Color('#ffd27a'), mid = new THREE.Color('#ffffff'), wet = new THREE.Color('#3b82f6');
    for (const pts of byStorm.values()) {
      if (pts.length < 2) continue;
      const v3 = pts.map((p) => new THREE.Vector3(p.x, toWorldY(p.z) + 1.4, -p.y));
      const segs = Math.min(400, pts.length * 2);
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(v3), segs, 0.32, 6, false);
      const col: number[] = [];
      for (let i = 0; i <= segs; i++) {
        const p = pts[Math.min(pts.length - 1, Math.round((i / segs) * (pts.length - 1)))];
        const c = p.rh < 0.8 ? dry.clone().lerp(mid, p.rh / 0.8) : mid.clone().lerp(wet, (p.rh - 0.8) / 0.2);
        for (let j = 0; j <= 6; j++) col.push(c.r, c.g, c.b);
      }
      tube.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.add(new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ vertexColors: true })));
      // drop lines to the ground every few points: the height profile
      const drop: number[] = [];
      for (let i = 0; i < pts.length; i += 6) {
        const p = pts[i];
        drop.push(p.x, toWorldY(p.z) + 1.4, -p.y, p.x, Math.max(0, surfaceY(p.x, p.y)), -p.y);
      }
      g.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(drop, 3)),
        new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.25 })));
    }
    const evPos: number[] = [], evCol: number[] = [];
    const kc = { rain: new THREE.Color('#2f7ff0'), slush: new THREE.Color('#9fb4c8'), snow: new THREE.Color('#ffffff') };
    for (let i = 0; i < r.events.length; i += 2) {
      const e = r.events[i];
      evPos.push(e.x, Math.max(0, surfaceY(e.x, e.y)) + 0.4, -e.y);
      const c = kc[e.kind];
      evCol.push(c.r, c.g, c.b);
    }
    const ev = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(evPos, 3)).setAttribute('color', new THREE.Float32BufferAttribute(evCol, 3)),
      new THREE.PointsMaterial({ size: 1.6, vertexColors: true }));
    g.add(ev);
    const marker = makeToken('L', true, 0.01);
    marker.visible = false;
    g.add(marker);
    this.replayObj = g;
    this.world.scene.add(g);
    this.cloud.group.visible = true;
    this.planCamera(false);
    this.setOverlay(`<div class="replay-bar">
        <div class="legend"><span class="sw dry"></span> יבש <span class="sw mid"></span> לח <span class="sw wet"></span> רווי · <span class="dot rain"></span> גשם <span class="dot snow"></span> שלג</div>
        <div class="replay-info" data-k="rinfo"></div>
        <button class="btn small" data-act="back">חזרה לתוצאה</button></div>`, 'replay');
    this.overlay.querySelector('[data-act=back]')!.addEventListener('click', () => { this.clearReplay(); this.showResult(); });
  }

  private updateReplay(dt: number) {
    const r = this.run!;
    if (!r.track.length) return;
    this.replayT += dt * 6;
    const end = r.track[r.track.length - 1].t;
    if (this.replayT > end + 2) this.replayT = 0;
    let i = 0;
    while (i < r.track.length - 1 && r.track[i + 1].t < this.replayT) i++;
    const p = r.track[i];
    const fake = { ...r.cloud, x: p.x, y: p.y, z: p.z, W: p.W, rh: p.rh, excess: p.rh >= 1 ? 1 : 0, pouring: false };
    this.cloud.update(dt, fake, Math.max(0, surfaceY(p.x, p.y)), 0);
    const info = this.overlay.querySelector('[data-k=rinfo]');
    if (info) info.innerHTML = `גובה <bdi class="num">${Math.round(p.z)} מ'</bdi> · ${deg(p.T)} · לחות יחסית ${pct(p.rh)}`;
  }

  // ───────────────────────── cameras ─────────────────────────

  private overviewCamera() {
    this.camGoalPos.set(150, 230, 40);
    this.camGoalLook.set(95, 0, -250);
    this.world.scene.fog = new THREE.Fog((this.world.scene.fog as THREE.Fog).color, 400, 1400);
    this.terrain?.setMood(0, this.world.scene.fog as THREE.Fog);
    this.world.setFocus(0.55, 0.5);
    this.camBlend = 0;
  }

  /** Top-down-ish view that frames the start, the targets and the slots. */
  private planCamera(intro: boolean) {
    const l = this.level!;
    const pts: { x: number; y: number }[] = [];
    for (const s of l.storms) pts.push(s.start);
    for (const t of l.targets) for (const z of t.zones) pts.push({ x: z.x - z.r, y: z.y - z.r }, { x: z.x + z.r, y: z.y + z.r });
    for (const s of l.plan.slots ?? []) pts.push(s);
    if (this.run && this.mode === 'replay') for (const p of this.run.track) pts.push(p);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    const pad = 18;
    x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const aspect = this.world.camera.aspect;
    const fov = THREE.MathUtils.degToRad(this.world.camera.fov);
    const spanY = Math.max(y1 - y0, (x1 - x0) / aspect) * (aspect < 1 ? 1.05 : 1.15);
    const h = Math.max(70, spanY / 2 / Math.tan(fov / 2));
    const tilt = intro ? 0.75 : 0.42;
    this.camGoalPos.set(cx + (intro ? 20 : 0), h * Math.cos(tilt * 0.6), -cy + h * Math.sin(tilt));
    this.camGoalLook.set(cx, 0, -cy - (intro ? 0 : 8));
    this.world.scene.fog = new THREE.Fog((this.world.scene.fog as THREE.Fog).color, h * 1.6, h * 4);
    this.terrain.setMood(0, this.world.scene.fog as THREE.Fog);
    this.world.setFocus(0.5, 0.45);
    this.world.aimSun(new THREE.Vector3(cx, 0, -cy));
    this.camBlend = 0;
  }

  // ───────────────────────── loop ─────────────────────────

  update(dt: number) {
    if (!this.terrain) return;
    this.time += dt;
    if (this.mode === 'flight' && !this.paused) {
      if (this.camBlend === 0) {
        this.world.scene.fog = new THREE.Fog((this.world.scene.fog as THREE.Fog).color, 110, 420);
        this.applyMood(this.run!.env);
        this.world.setFocus(0.55, 1.8);
      }
      // the sim waits until the launch swoop has landed behind the cloud
      if (this.camBlend > 0.85) this.stepFlight(dt);
      if (this.run && this.mode === 'flight') {
        this.updateFlightVisuals(dt);
        this.updateHud(dt);
      }
    } else if (this.mode === 'replay') {
      this.updateReplay(dt);
    } else if (this.mode === 'plan' || this.mode === 'intro') {
      for (const v of this.props.targets) {
        this.labels.set(`tgt:${v.t.id}`, v.anchor, `${this.targetBadge(v.t.kind)} ${v.t.he}`, `lbl tgt ${v.t.optional ? 'opt' : ''}`);
        v.update(0, false, false, dt, this.time);
      }
      const st = this.level!.storms[0].start;
      this.labels.set('start', [st.x, 3, -st.y], '☁ ענני', 'lbl start');
      if (this.line.t > 0) { this.line.t -= dt; if (this.line.t <= 0) this.toast.className = 'toast hidden'; }
    } else if (this.mode === 'title' || this.mode === 'levels') {
      const a = this.time * 0.05;
      this.camGoalPos.set(95 + Math.sin(a) * 120, 210, -230 + Math.cos(a) * 200);
    }
    if (this.mode !== 'flight' || !this.paused) {
      this.props.tokenScale = this.mode === 'plan' || this.mode === 'intro' ? 2.2 : 1;
    if (this.run) { this.props.cloudAt = { x: this.run.cloud.x, y: this.run.cloud.y }; this.props.failed = this.run.status === 'failed'; }
    else { this.props.cloudAt = { x: -999, y: -999 }; this.props.failed = false; }
    this.props.update(dt, this.time, this.world.camera);
      this.terrain.update(dt, this.time);
      if (this.mode !== 'flight') this.fx.update(dt, null, { x: 0, y: 0 }, 0);
    }
    // camera easing (a swoop when switching views)
    this.camBlend = Math.min(1, this.camBlend + dt * 0.8);
    const k = this.mode === 'flight' && this.camBlend >= 1 ? Math.min(1, dt * 3.5) : Math.min(1, dt * (0.6 + this.camBlend * 2.5));
    this.camPos.lerp(this.camGoalPos, k);
    this.camLook.lerp(this.camGoalLook, k);
    this.world.camera.position.copy(this.camPos);
    this.world.camera.lookAt(this.camLook);
  }

  render() {
    if (!this.terrain) return;
    this.world.render(1 / 60);
    const r = this.world.renderer.domElement;
    this.labels.update(this.world.camera, r.clientWidth, r.clientHeight);
  }

  resize() {
    this.world.resize();
    if (this.level && (this.mode === 'plan' || this.mode === 'intro')) this.planCamera(this.mode === 'intro');
  }

  // ───────────────────────── input ─────────────────────────

  private bindInput(canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      this.sound.unlock();
      const code = e.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(code);
      if (this.mode === 'flight') {
        if (code === 'KeyP' || code === 'Escape') this.setPaused(!this.paused);
        else if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyE') this.puffQueued = true;
        else if (code === 'KeyQ' || code === 'Tab') { e.preventDefault(); this.seasonQueued = true; }
        else if (code === 'KeyF') { this.fast = !this.fast; this.syncHudButtons(); }
        else if (code === 'KeyR') this.restart();
        else if (code === 'KeyH') this.flightHint();
        else if (code === 'KeyM') this.toggleMute();
      } else if (code === 'Enter') {
        (this.overlay.querySelector('.btn.primary') as HTMLButtonElement | null)?.click()
          ?? (this.launchEl.querySelector('[data-act=launch]') as HTMLButtonElement | null)?.click();
      } else if (code === 'KeyM') this.toggleMute();
      else if (this.mode === 'plan' && (code === 'Digit1' || code === 'Digit2')) {
        this.selectedKind = code === 'Digit1' ? 'L' : 'H';
        this.renderPlanPanel();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.pourBtn = false; });
    canvas.addEventListener('pointerdown', (e) => {
      this.sound.unlock();
      if (this.mode === 'plan') { this.slotClick(e.clientX, e.clientY); return; }
      if (this.mode !== 'flight' || this.paused) return;
      this.joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
      const r = this.root.getBoundingClientRect();
      this.joyEl.className = 'joy';
      this.joyEl.style.left = `${e.clientX - r.left}px`;
      this.joyEl.style.top = `${e.clientY - r.top}px`;
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.joy.id) return;
      this.joy.x = e.clientX; this.joy.y = e.clientY;
      const dx = THREE.MathUtils.clamp(e.clientX - this.joy.x0, -50, 50), dy = THREE.MathUtils.clamp(e.clientY - this.joy.y0, -50, 50);
      (this.joyEl.firstElementChild as HTMLElement).style.transform = `translate(${dx}px, ${dy}px)`;
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== this.joy.id) return;
      this.joy.id = -1;
      this.joyEl.className = 'joy hidden';
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }

  // ───────────────────────── test hooks ─────────────────────────

  textState(): string {
    const r = this.run;
    const l = this.level;
    const out: Record<string, unknown> = {
      coords: 'map km: x east, y north; heights in metres (display exaggerated x5)',
      mode: this.mode, paused: this.paused, fast: this.fast,
      level: l ? { id: l.id, title: l.title, goal: l.goal } : null,
    };
    if (l && (this.mode === 'plan' || this.mode === 'intro')) {
      out.plan = {
        tokens: this.plan.tokens, hour: this.plan.hour, mustPlace: !!l.plan.mustPlace,
        slots: (l.plan.slots ?? []).map((s) => ({ id: s.id, x: s.x, y: s.y, kinds: s.kinds })),
        tokensLeft: { L: l.plan.tokens?.L ? this.tokensLeft('L') : 0, H: l.plan.tokens?.H ? this.tokensLeft('H') : 0 },
        hours: l.plan.hours ?? [],
      };
    }
    if (r) {
      const c = r.cloud;
      out.status = r.status;
      out.failReason = r.failReason ?? null;
      out.storm = { index: r.storm, count: r.level.storms.length, t: +r.t.toFixed(1), duration: r.env.duration, label: r.env.label ?? null };
      out.cloud = {
        x: +c.x.toFixed(1), y: +c.y.toFixed(1), altitudeM: Math.round(c.z), groundM: Math.round(c.ground), surface: c.surface,
        tempC: +c.T.toFixed(1), groundTempC: +c.groundT.toFixed(1), water: +c.W.toFixed(2), capacity: +capacity(c.T).toFixed(2),
        rhPct: Math.round(c.rh * 100), canPour: c.excess > 0, precip: precipKind(c.groundT), pouring: c.pouring,
        wind: { u: +c.wind.u.toFixed(2), v: +c.wind.v.toFixed(2) }, puffCooldown: +c.puffCd.toFixed(1),
      };
      out.targets = r.level.targets.map((t) => ({ id: t.id, he: t.he, kind: t.kind, value: +r.progress[t.id].toFixed(1), need: t.need, max: t.max ?? null, met: targetMet(r, t), optional: !!t.optional, cloudInside: inZones(t.zones, c.x, c.y) }));
      out.wadis = r.floods;
      out.line = this.hud.querySelector('[data-k=line]')?.textContent ?? '';
      out.cause = this.hud.querySelector('[data-k=cause]')?.textContent ?? '';
      out.balance = resultSummary(r);
    }
    return JSON.stringify(out);
  }
}

export type { PressureCell };
void n0;
