// Hebrew explanation lines. Every number comes from the run; numbers sit in <bdi> so RTL never flips them.
import { cellInfluence, landSeaContrast, type PrecipKind } from '../rules/atmosphere.ts';
import type { Feedback, Run } from '../rules/sim.ts';
import { inZones, stars, waterBalance } from '../rules/sim.ts';
import type { FailReason, Target } from '../rules/types.ts';

export const n0 = (v: number) => `<bdi class="num">${Math.round(v)}</bdi>`;
export const pct = (v: number) => `<bdi class="num">${Math.round(v * 100)}%</bdi>`;
export const deg = (v: number) => `<bdi class="num">${v.toFixed(0) === '-0' ? '0' : v.toFixed(0)}°</bdi>`;

function targetName(run: Run, id: string) {
  return run.level.targets.find((t) => t.id === id)?.he ?? id;
}

/** One line per sim feedback event (shown at the bottom of the screen). */
export function feedbackLine(run: Run, f: Feedback): string | null {
  switch (f.key) {
    case 'dryPour':
      return `הלחות היחסית רק ${pct(f.rh)}. גשם יורד רק מאוויר רווי (<bdi class="num">100%</bdi>): עלו גבוה יותר כדי להתקרר.`;
    case 'sinking':
      return 'האוויר יורד במורד ההר ומתחמם: הטיפות מתאדות לפני שהן מגיעות לקרקע. זה צל הגשם.';
    case 'slush':
      return `על ${targetName(run, f.target)} ירד גשם מעורב בשלג: לא קר מספיק. שלג צריך קרקע קרה יותר, כלומר גבוהה יותר.`;
    case 'snowOnRain':
      return `על ${targetName(run, f.target)} ירד שלג, אבל כאן צריך גשם. נמוך יותר = חם יותר.`;
    case 'flood': {
      const w = run.level.wadis?.find((x) => x.id === f.wadi);
      return `שיטפון ב${w?.he ?? 'נחל'}! הגשם על המדרון זרם מהר אל הנחל.`;
    }
    case 'khamsin':
      return 'חמסין: אוויר חם ויבש מהמדבר. ענני מתחמם, הלחות היחסית צונחת והוא מתייבש.';
    case 'saturated':
      return `<bdi class="num">100%</bdi> לחות יחסית: האוויר רווי. עכשיו אפשר להמטיר!`;
    case 'targetDone':
      return `${targetName(run, f.target)}: קיבל מספיק! ✔`;
    case 'stormEnd':
      return `הסערה חלפה. ${run.level.storms[f.storm + 1]?.label ?? 'הסערה הבאה'}: ענן חדש נולד מעל הים.`;
    case 'seasonTurn':
      return 'העונה התחלפה: הרמה הקיצית נסוגה ושקע חורפי מתקרב.';
    case 'wasted':
      return 'הגשם ירד מחוץ ליעד.';
  }
  return null;
}

/** A flight hint: a question about the cause, never the route. */
export function flightHintLine(run: Run): string {
  const c = run.cloud;
  const sinking = c.surface === 'land' && c.ground < c.hEnv - 60;
  const open = run.level.targets.filter((t) => (run.progress[t.id] ?? 0) < t.need);
  const overTarget = open.some((t) => inZones(t.zones, c.x, c.y));
  if (sinking) return 'אתם בצד המוסתר של ההר: האוויר יורד ומתחמם. איזה צד של ההר פונה אל הרוח?';
  if (c.rh >= 0.995) return overTarget ? 'האוויר רווי ואתם מעל היעד: המטירו!' : 'האוויר רווי. החצים מראים לאן הרוח נושבת: איך תגיעו ליעד בלי לרדת במורד?';
  if (c.surface !== 'land' && c.rh < 0.92) return 'מעל מים חמים ענני סופג אדים. כמה מים יש לכם לפני שתפנו ליבשה?';
  return 'כדי להגיע ל-100% האוויר צריך להתקרר. איפה הרוח (בחצים) תדחוף אתכם במעלה מדרון, או אל שקע (ל)?';
}

/** What the air is doing right now and why (the live cause line). */
export function causeLine(run: Run): string {
  const c = run.cloud, env = run.env;
  const climbing = c.ground > c.hEnv - 5 && c.surface === 'land' && c.ground > 150;
  const sinking = c.surface === 'land' && c.ground < c.hEnv - 60;
  const hi = cellInfluence(run.cells, 'H', c.x, c.y), lo = cellInfluence(run.cells, 'L', c.x, c.y);
  if (env.khamsin && run.khamsinExposure > 0 && c.rh < 0.8) return 'אוויר מדברי חם ויבש סביב ענני: הוא מאבד מים.';
  if (c.surface !== 'land' && c.rh < 0.995) return env.season === 'summer'
    ? `מעל הים בקיץ: ענני סופג אדים, אבל הרמה הקיצית מונעת ממנו לעלות ולהתקרר.`
    : `מעל ${c.surface === 'sea' ? 'הים החם' : 'האגם'}: ענני סופג אדים וגדל.`;
  if (climbing) return `האוויר נדחף במעלה ההר ומתקרר: <bdi class="num">0.6°</bdi> לכל <bdi class="num">100</bdi> מ' <span class="enrich">העשרה</span>`;
  if (sinking) return 'במורד ההר האוויר יורד, מתחמם, והלחות היחסית יורדת.';
  if (hi > 0.6 && c.surface === 'land') return 'ברמה (ג) האוויר שוקע ומתחמם: קשה להגיע לרוויה.';
  if (lo > 0.4) return 'בשקע (ל) האוויר עולה ומתקרר.';
  if (env.breezeCoast && landSeaContrast(env.hour, env.sunny) > 0.3) return 'היבשה חמה מהים: מעל החוף נוצר שקע, והבריזה נושבת מהים.';
  if (c.excess > 0) return 'האוויר רווי: מעל היעד, המטירו!';
  return 'הרוח נושבת מהרמה (ג) אל השקע (ל).';
}

export function failLine(run: Run, r: FailReason): string {
  const c = run.cloud;
  switch (r) {
    case 'dried': {
      if (run.khamsinExposure > 1) return 'ענני התייבש בחמסין: האוויר החם והיבש מהמדבר "שתה" את המים.';
      const { y } = c;
      if (y < 220) return 'ענני התייבש מעל הדרום: באוויר המדברי היבש סערות דועכות.';
      return 'ענני התייבש: אוויר יורד או יבש גרם ללחות היחסית לצנוח.';
    }
    case 'timeout': return 'הסערה חלפה לפני שהיעד קיבל מספיק.';
    case 'flood': return 'הג\'יפ נסחף בשיטפון! גשם חזק על מדרון תלול מעל נחל זורם מהר אל הנחל.';
    case 'band': {
      const t = run.level.targets.find((x) => x.max !== undefined && run.progress[x.id] > x.max);
      return `יותר מדי גשם ב${t?.he ?? 'אזור'}: <bdi class="num">${Math.round(run.progress[t?.id ?? ''] ?? 0)}</bdi> מ"מ, מעל הטווח של האזור.`;
    }
    case 'redline': return 'מפלס הכנרת ירד אל מתחת לקו האדום. צריך גשם בגליל ובגולן, שזורם אל הכנרת.';
    case 'targets': {
      const miss = run.level.targets.filter((t) => !t.optional && !met(run, t));
      return `לא כל היעדים הושגו: ${miss.map((t) => t.he).join(', ')}.`;
    }
  }
}

function met(run: Run, t: Target) {
  const v = run.progress[t.id];
  return v >= t.need && (t.max === undefined || v <= t.max);
}

export function resultSummary(run: Run) {
  const b = waterBalance(run);
  return {
    stars: stars(run),
    absorbed: b.absorbed, poured: b.poured, dissipated: b.dissipated, held: b.held,
    wastedPct: run.poured > 0 ? run.wasted / run.poured : 0,
  };
}

export function unitFor(t: Target) {
  return t.kind === 'shade' ? 'שנ\'' : 'מ"מ';
}

const KIND_HE: Record<PrecipKind, string> = { rain: 'גשם', slush: 'גשם מעורב בשלג', snow: 'שלג' };

/** Each kind of precipitation that fell, in cloud water units (only kinds that fell). */
export function fellByKind(run: Run): string {
  const parts = (['rain', 'slush', 'snow'] as PrecipKind[])
    .filter((k) => run.pouredByKind[k] > 0.05)
    .map((k) => `${KIND_HE[k]} <bdi class="num">${run.pouredByKind[k].toFixed(1)}</bdi>`);
  return parts.length ? parts.join(' · ') : 'לא ירד כלום';
}

/** What each target received, in its own unit (מ"מ on the ground). */
export function targetResults(run: Run): { he: string; got: string; ok: boolean }[] {
  return run.level.targets.map((t) => ({
    he: t.he,
    got: `<bdi class="num">${Math.round(run.progress[t.id] ?? 0)}/${Math.round(t.need)}</bdi> ${unitFor(t)}`,
    ok: met(run, t),
  }));
}
