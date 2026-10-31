// The 18 authored levels. Positions are map km (x east, y north); see geo.ts.
// Rainfall in levels 11–18 is scaled (one storm stands for a month or a winter) and labelled as such.
import type { PressureCell } from './atmosphere.ts';
import { PLACES } from './geo.ts';
import type { Circle, LevelDef, StormEnv } from './types.ts';

const H = (x: number, y: number, s = 1.2, r = 75): PressureCell => ({ kind: 'H', x, y, s, r });
const L = (x: number, y: number, s = 1.2, r = 75): PressureCell => ({ kind: 'L', x, y, s, r });
const at = (id: string, r: number, dx = 0, dy = 0): Circle => ({ x: PLACES[id].x + dx, y: PLACES[id].y + dy, r });
const pt = (id: string, dx = 0, dy = 0) => ({ x: PLACES[id].x + dx, y: PLACES[id].y + dy });

const winter = (o: Partial<StormEnv> & Pick<StormEnv, 'cells' | 'start'>): StormEnv => ({
  T0: 13, seaT: 19, hour: 12, sunny: 0.2, season: 'winter', duration: 70, ...o,
});

export const LEVELS: LevelDef[] = [
  // ───────────── World 1 · The Sea and the Shore ─────────────
  {
    id: 1, world: 1, title: 'נשימה ראשונה',
    brief: 'מעל הים החם ענני שותה אדים וגדל. הרוח תיקח אותו מזרחה, אל מדרון הכרמל.',
    goal: 'המטירו על השדה של החקלאי במדרון הכרמל',
    showArrows: true, hints: true, labels: true, plan: {},
    storms: [winter({ cells: [H(25, 366, 1.3), L(165, 362, 1.3)], start: { x: 66, y: 367 } })],
    targets: [{ id: 'field', he: 'השדה של החקלאי', kind: 'rain', icon: 'field', zones: [at('carmel', 7, -3, 0)], need: 12 }],
    success: 'עליתם במדרון, התקררתם והגעתם לרוויה. הגשם השקה את השדה!',
    solution: { plan: { tokens: [] }, routes: [[pt('carmel', -3, 0)]] },
  },
  {
    id: 2, world: 1, title: 'מלא אבל יבש',
    brief: 'ענני כמעט מלא, אבל לחות גבוהה עדיין איננה גשם. נסו להמטיר מעל החוף, ואז עלו אל ההרים.',
    goal: 'השקו את המטע במדרונות המערביים',
    showArrows: true, hints: true, labels: true, plan: {},
    storms: [{
      T0: 22, seaT: 24, hour: 12, sunny: 0.3, season: 'autumn', duration: 70,
      cells: [H(20, 280, 1.2), L(175, 262, 1.2, 80)], start: { x: 58, y: 284, W: 16.3 },
    }],
    targets: [{ id: 'orchard', he: 'המטע', kind: 'rain', icon: 'field', zones: [at('judeanSlopes', 9, -1, 11)], need: 18 }],
    success: 'רק כשעליתם והתקררתם הלחות היחסית הגיעה ל־100 %. אז ירד גשם.',
    solution: { plan: { tokens: [] }, routes: [[pt('judeanSlopes', -1, 11)]] },
  },
  {
    id: 3, world: 1, title: 'מ־ג אל ל',
    brief: 'שריפה ביערות הכרמל! הניחו שקע אחד (ל). האוויר זורם מהרמה (ג) אל השקע.',
    goal: 'כבו את השריפה בכרמל',
    showArrows: false, hints: true, labels: true,
    plan: {
      tokens: { L: 1, H: 0 }, mustPlace: true,
      slots: [
        { id: 'east', x: 140, y: 362, kinds: ['L'] },
        { id: 'south', x: 98, y: 296, kinds: ['L'] },
        { id: 'northwest', x: 52, y: 430, kinds: ['L'] },
      ],
    },
    storms: [winter({ cells: [H(40, 330, 1.0, 60)], start: { x: 66, y: 366 }, duration: 60 })],
    targets: [{ id: 'fire', he: 'השריפה ביער', kind: 'rain', icon: 'fire', zones: [at('carmel', 6, -1, 5)], need: 10 }],
    success: 'הרוח נשבה מהרמה אל השקע שבחרתם, ישר אל הכרמל.',
    solution: { plan: { tokens: [{ slot: 'east', kind: 'L' }] }, routes: [[pt('carmel', -1, 5)]] },
  },
  {
    id: 4, world: 1, title: 'בריזת ים',
    brief: 'יום קיץ. היבשה מתחממת מהר יותר מהים. בחרו שעה, והגיעו לצל המציל שנשרף בשמש.',
    goal: 'הצלו על המציל בחוף תל אביב 3 שניות',
    showArrows: false, hints: true, labels: true,
    plan: { hours: [6, 10, 14], defaultHour: 6 },
    storms: [{
      T0: 29, seaT: 27, hour: 6, sunny: 1, season: 'summer', duration: 32,
      cells: [], start: { x: 57, y: 298, W: 20 }, breezeCoast: { x: 78, y: 298 },
    }],
    targets: [{ id: 'lifeguard', he: 'המציל', kind: 'shade', icon: 'lifeguard', zones: [{ x: 77, y: 298, r: 7 }], need: 3 }],
    success: 'בצהריים החוף חם מהים: נוצר שקע מעל היבשה ובריזה נשבה מהים אל החוף.',
    solution: { plan: { tokens: [], hour: 14 }, routes: [[{ x: 77, y: 298 }]] },
  },
  {
    id: 5, world: 1, title: 'מפת החזאי',
    brief: 'רק אותיות ג ו־ל על המפה. חזו לאן תנשב הרוח, הניחו שקע אחד ויוצאים.',
    goal: 'השקו את השדות במדרונות השומרון',
    showArrows: false, hints: true, labels: true,
    plan: {
      tokens: { L: 1, H: 0 }, mustPlace: true,
      slots: [
        { id: 's1', x: 112, y: 388, kinds: ['L'] },
        { id: 's2', x: 158, y: 318, kinds: ['L'] },
        { id: 's3', x: 125, y: 245, kinds: ['L'] },
        { id: 's4', x: 30, y: 262, kinds: ['L'] },
      ],
    },
    storms: [winter({ cells: [H(20, 285, 1.0, 70)], start: { x: 50, y: 322 }, duration: 40 })],
    targets: [{ id: 'fields', he: 'שדות השומרון', kind: 'rain', icon: 'field', zones: [at('samaria', 8, -8, 26)], need: 14 }],
    success: 'קראתם את המפה: מהרמה מעל הים אל השקע ממזרח, ובמעלה ההר.',
    solution: { plan: { tokens: [{ slot: 's2', kind: 'L' }] }, routes: [[pt('samaria', -8, 26)]] },
  },

  // ───────────── World 2 · Over the Mountains ─────────────
  {
    id: 6, world: 2, title: 'במעלה המדרון',
    brief: 'רוח מערבית. ככל שעולים במדרון, האוויר מתקרר.',
    goal: 'המטירו על המדרונות המערביים של הרי יהודה',
    showArrows: false, hints: true, labels: true, plan: {},
    storms: [winter({ cells: [H(15, 268, 1.3, 80), L(185, 262, 1.3, 80)], start: { x: 52, y: 268 } })],
    targets: [{ id: 'slopes', he: 'המדרונות המערביים', kind: 'rain', icon: 'forest', zones: [at('judeanSlopes', 9, 0, 3)], need: 20 }],
    success: 'המדרון הפונה מערבה אילץ את האוויר לעלות ולהתקרר. שם יורד הכי הרבה גשם.',
    solution: { plan: { tokens: [] }, routes: [[pt('judeanSlopes', 0, 3)]] },
  },
  {
    id: 7, world: 2, title: 'שלג בירושלים, גשם בתל אביב',
    brief: 'סערה קרה. אותו ענן, שני יעדים: גשם בגובה פני הים ושלג בגובה כ־800 מ\'.',
    goal: 'גשם על תל אביב ושלג לבובת השלג בירושלים',
    showArrows: false, hints: true, labels: true, plan: {},
    storms: [winter({
      T0: 4.6, seaT: 18, cells: [H(5, 285, 1.2, 80), L(124, 266, 1.3, 62)], start: { x: 40, y: 302 }, duration: 75,
    })],
    targets: [
      { id: 'telaviv', he: 'תל אביב', kind: 'rain', icon: 'city', zones: [at('telaviv', 8, 3, -2)], need: 8 },
      { id: 'snowman', he: 'בובת השלג בירושלים', kind: 'snow', icon: 'snowman', zones: [at('jerusalem', 6)], need: 12 },
    ],
    success: 'ירושלים גבוהה ב־800 מ\' ולכן קרה יותר: אותה סערה, שלג בהר וגשם בחוף.',
    solution: { plan: { tokens: [] }, routes: [[pt('telaviv', 4, -2), pt('jerusalem')]] },
  },
  {
    id: 8, world: 2, title: 'צל הגשם',
    brief: 'מלאו את אזור ההעשרה של אקוויפר ההר: הרכס והמדרונות המערביים. ושלט מפתה ממזרח...',
    goal: 'החדירו מים לאזור ההעשרה של אקוויפר ההר',
    showArrows: false, hints: true, labels: true, plan: {},
    storms: [winter({ T0: 12, cells: [H(8, 262, 1.3, 80), L(195, 250, 1.3, 90)], start: { x: 48, y: 262 }, duration: 75 })],
    targets: [
      { id: 'aquifer', he: 'אזור ההעשרה', kind: 'water', icon: 'aquifer',
        zones: [at('judeanSlopes', 8, 0, 2), at('jerusalem', 6, -2, 0), at('hebron', 7, -2, 4), at('samaria', 7, -6, -18)], need: 36 },
      { id: 'bloom', he: '"הפריחו את המדבר!"', kind: 'rain', icon: 'bloom', zones: [at('judeanDesert', 8)], need: 10, optional: true },
    ],
    success: 'כל הגשם נפל ממערב לרכס. ממזרח האוויר יורד, מתחמם והלחות היחסית צונחת: צל גשם.',
    solution: { plan: { tokens: [] }, routes: [[pt('judeanSlopes', 0, 2), pt('jerusalem', -2, 0)]], pourIn: ['aquifer'] },
  },
  {
    id: 9, world: 2, title: 'חרמון',
    brief: 'השלג על החרמון מזין את מקורות הירדן. תפסו את הזרם הצפוני ועלו אל הפסגה.',
    goal: 'שלג על החרמון',
    showArrows: false, hints: true, labels: true, plan: {},
    storms: [winter({ T0: 7, seaT: 18, cells: [H(40, 378, 1.2, 70), L(205, 470, 1.4, 80)], start: { x: 76, y: 402 }, duration: 80 })],
    targets: [{ id: 'hermon', he: 'שלג על החרמון', kind: 'snow', icon: 'snowman', zones: [at('hermon', 8)], need: 18 }],
    success: 'בגובה יותר מ־2,000 מ\' קר מספיק לשלג. כשהשלג יימס, המים יזרמו אל הירדן.',
    solution: { plan: { tokens: [] }, routes: [[pt('upperGalilee', 4, 6), pt('hermon')]], pourIn: ['hermon'] },
  },
  {
    id: 10, world: 2, title: 'רכס חדש',
    brief: 'לילה בגליל, ברקים. ענני מעל הכנרת. היכן להניח את השקע כדי שהיער שעל המדרון יקבל גשם?',
    goal: 'השקו את היער שעל המדרון',
    showArrows: false, hints: true, labels: false,
    plan: {
      tokens: { L: 1, H: 0 }, mustPlace: true,
      slots: [
        { id: 'west', x: 78, y: 412, kinds: ['L'] },
        { id: 'east', x: 205, y: 412, kinds: ['L'] },
      ],
    },
    storms: [winter({
      T0: 9, seaT: 18, hour: 1, night: true, lightning: true,
      cells: [H(140, 335, 1.1, 60)], start: { x: 151, y: 380, W: 9.5 }, duration: 60,
    })],
    targets: [{ id: 'forest', he: 'היער', kind: 'rain', icon: 'forest', zones: [at('safed', 6, -2, 2)], need: 12 }],
    success: 'הרוח נשבה ממזרח, ולכן המדרון המזרחי היה הצד הגשום. הכיוון של הרוח קובע איזה צד רטוב.',
    solution: { plan: { tokens: [{ slot: 'west', kind: 'L' }] }, routes: [[pt('safed', -2, 2)]] },
  },

  // ───────────── World 3 · Israel's Rain Map ─────────────
  {
    id: 11, world: 3, title: 'הצפון מקבל יותר',
    brief: 'חורף אחד, ארבע סערות (כל סערה = חודש גשמים, מפושט). כל אזור צריך את הכמות השנתית שלו.',
    goal: 'גליל 700–1000, מרכז 500–750, צפון הנגב 200–330 מ"מ',
    showArrows: false, hints: true, labels: true, plan: {}, evaluateAtEnd: true,
    storms: [
      winter({ label: 'דצמבר', mmScale: 14, cells: [H(40, 405, 1.2, 70), L(200, 410, 1.3, 80)], start: { x: 80, y: 405 }, duration: 45 }),
      winter({ label: 'ינואר', mmScale: 14, cells: [H(0, 285, 1.3, 80), L(170, 282, 1.3, 80)], start: { x: 36, y: 288 }, duration: 45 }),
      winter({ label: 'פברואר', mmScale: 14, T0: 12, seaT: 20, cells: [H(0, 240, 1.3, 80), L(118, 205, 1.3, 60)], start: { x: 22, y: 234 }, duration: 45 }),
      winter({ label: 'מרץ', mmScale: 14, cells: [H(40, 395, 1.2, 70), L(200, 400, 1.3, 80)], start: { x: 82, y: 398 }, duration: 45 }),
    ],
    targets: [
      { id: 'galilee', he: 'הגליל', kind: 'water', icon: 'field', zones: [at('upperGalilee', 12, -6, -2)], need: 700, max: 1000 },
      { id: 'center', he: 'המרכז', kind: 'water', icon: 'city', zones: [{ x: 103, y: 285, r: 12 }], need: 500, max: 750 },
      { id: 'negev', he: 'צפון הנגב', kind: 'water', icon: 'wheat', zones: [at('beersheva', 14, 5, 10)], need: 200, max: 330 },
    ],
    success: 'הצפון קיבל הכי הרבה: הגשם פוחת מצפון לדרום.',
    solution: {
      plan: { tokens: [] },
      routes: [[pt('upperGalilee', -6, -2)], [{ x: 101, y: 285 }], [pt('beersheva', 5, 10)], [pt('upperGalilee', -6, -2)]],
    },
  },
  {
    id: 12, world: 3, title: 'קו הצחיחות',
    brief: 'החקלאים שואלים איפה לזרוע חיטה בעל. חיטה בעל צריכה לפחות 200 מ"מ בשנה. (כל סערה = חודשיים של גשם, מפושט)',
    goal: 'לפחות 200 מ"מ בשדות החיטה',
    showArrows: false, hints: true, labels: true, plan: {}, evaluateAtEnd: true,
    storms: [
      winter({ label: 'דצמבר', mmScale: 25, seaT: 20, cells: [H(0, 250, 1.3, 80), L(108, 238, 1.3, 60)], start: { x: 30, y: 248 }, duration: 45 }),
      winter({ label: 'ינואר', mmScale: 25, seaT: 20, cells: [H(0, 225, 1.3, 80), L(112, 205, 1.3, 60)], start: { x: 22, y: 232 }, duration: 45 }),
      winter({ label: 'פברואר', mmScale: 25, seaT: 20, cells: [H(0, 215, 1.3, 80), L(118, 168, 1.3, 65)], start: { x: 18, y: 222 }, duration: 50 }),
    ],
    targets: [
      { id: 'gat', he: 'שדה ליד קריית גת', kind: 'water', icon: 'wheat', zones: [at('kiryatgat', 10, 6, 0)], need: 200 },
      { id: 'beersheva', he: 'שדה צפונית לבאר שבע', kind: 'water', icon: 'wheat', zones: [at('beersheva', 8, 2, 12)], need: 200 },
      { id: 'yeruham', he: 'שדה ליד ירוחם', kind: 'water', icon: 'wheat', zones: [at('yeruham', 8)], need: 200, optional: true },
      { id: 'ramon', he: 'שדה ליד מצפה רמון', kind: 'water', icon: 'wheat', zones: [at('mitzperamon', 8)], need: 200, optional: true },
    ],
    success: 'מצפון לקו הצחיחות (כ־200 מ"מ) חקלאות בעל אפשרית. מדרום לו הסערות דועכות לפני שהן מגיעות.',
    solution: {
      plan: { tokens: [] },
      routes: [[pt('kiryatgat', 6, 0)], [pt('beersheva', 2, 12)], [pt('kiryatgat', 6, 0)]],
      pourIn: ['gat', 'beersheva'],
    },
  },
  {
    id: 13, world: 3, title: 'חמסין',
    brief: 'אביב. רוח חמה ויבשה נושבת מהמדבר. שרדו את המעבר והביאו גשם אחרון לגליל.',
    goal: 'גשם אחרון לגליל המערבי',
    showArrows: false, hints: true, labels: true,
    plan: {
      tokens: { L: 1, H: 0 }, mustPlace: true,
      slots: [
        { id: 'galilee', x: 150, y: 410, kinds: ['L'] },
        { id: 'negev', x: 105, y: 235, kinds: ['L'] },
        { id: 'center', x: 125, y: 305, kinds: ['L'] },
      ],
    },
    storms: [{
      T0: 21, seaT: 21, hour: 13, sunny: 0.6, season: 'spring', duration: 80,
      cells: [H(200, 230, 1.1, 85)], start: { x: 55, y: 322, W: 15 },
      khamsin: { strength: 1, zones: [{ x: 110, y: 250, r: 95 }] },
    }],
    targets: [{ id: 'galilee', he: 'הגליל המערבי', kind: 'rain', icon: 'field', zones: [at('westGalilee', 8, 4, 2)], need: 10 }],
    success: 'נשארתם מעל הים, רחוק מהאוויר החם והיבש, ושקע בצפון משך אתכם אל הגליל.',
    solution: { plan: { tokens: [{ slot: 'galilee', kind: 'L' }] }, routes: [[pt('westGalilee', 4, 2)]] },
  },
  {
    id: 14, world: 3, title: 'בלש הקלימוגרף',
    brief: 'שלושה קלימוגרפים, שלוש ערים. הטיסו "עונה" לכל עיר כך שהקלימוגרף שלה יתאים. (כל סערה = חודש, מפושט)',
    goal: 'תל אביב 400–650, באר שבע 150–280, אילת עד 50 מ"מ',
    showArrows: false, hints: true, labels: true, plan: {}, evaluateAtEnd: true,
    storms: [
      ...(['נובמבר', 'דצמבר', 'ינואר', 'פברואר', 'מרץ'] as const).map((label, i) => {
        const south = i === 2 || i === 4;
        return winter({
          label, mmScale: 10, duration: 30,
          cells: south ? [H(0, 240, 1.3, 80), L(112, 203, 1.3, 58)] : [H(0, 300, 1.3, 80), L(100, 300, 1.3, 55)],
          start: south ? { x: 22, y: 234 } : { x: 38, y: 300 }, seaT: 20,
        });
      }),
      { label: 'יולי', mmScale: 8, T0: 29, seaT: 27, hour: 13, sunny: 1, season: 'summer' as const, duration: 18,
        cells: [H(100, 260, 1.4, 90)], start: { x: 50, y: 280, W: 16 } },
    ],
    targets: [
      { id: 'telaviv', he: 'תל אביב (ים תיכוני)', kind: 'water', icon: 'city', zones: [at('telaviv', 9, 4, -2)], need: 400, max: 650 },
      { id: 'beersheva', he: 'באר שבע (ערבתי)', kind: 'water', icon: 'city', zones: [at('beersheva', 13, 5, 10)], need: 150, max: 280 },
      { id: 'eilat', he: 'אילת (מדברי)', kind: 'water', icon: 'city', zones: [at('eilat', 10)], need: 0, max: 50 },
    ],
    success: 'שלושה אקלימים בארץ קטנה: ים תיכוני, ערבתי ומדברי. בקיץ, בכל השלושה, אין גשם.',
    solution: {
      plan: { tokens: [] },
      routes: [[pt('telaviv', 4, -2)], [pt('telaviv', 4, -2)], [pt('beersheva', 5, 10)], [pt('telaviv', 4, -2)], [pt('beersheva', 5, 10)], []],
      pourIn: ['telaviv', 'beersheva'],
    },
  },
  {
    id: 15, world: 3, title: 'הקיץ נשאר יבש',
    brief: 'קיץ. רמה (ג) יושבת מעל ישראל והאוויר היורד לא נותן לעלות. איך בכל זאת להשקות את השדה?',
    goal: 'השקו את השדה בשפלה',
    showArrows: false, hints: true, labels: true, plan: {},
    storms: [{
      T0: 30, seaT: 27, hour: 13, sunny: 1, season: 'summer', duration: 90,
      cells: [H(105, 280, 1.4, 90)], start: { x: 82, y: 268, W: 15 },
      turnsInto: {
        delay: 6, T0: 13, seaT: 21, hour: 12, sunny: 0.2, season: 'winter', label: 'חורף',
        cells: [H(5, 268, 1.3, 80), L(180, 262, 1.3, 80)],
      },
    }],
    targets: [{ id: 'field', he: 'השדה בשפלה', kind: 'rain', icon: 'field', zones: [at('judeanSlopes', 8, -6, 0)], need: 14 }],
    success: 'בקיץ אין גשם בישראל. שמרתם את המים מעל הים וחיכיתם לחורף.',
    solution: { plan: { tokens: [] }, routes: [[{ x: 40, y: 268 }, { x: 36, y: 268 }, pt('judeanSlopes', -6, 0)]], seasonAt: 22 },
  },

  // ───────────── World 4 · The Long Winter ─────────────
  {
    id: 16, world: 4, title: 'מזג אוויר או אקלים?',
    brief: 'שבוע גשום במיוחד! מועצת החקלאים שואלת: האם האקלים השתנה? הראו להם עשור שלם.',
    goal: 'שבוע גשום, ואחריו עשרה חורפים רגילים (420–620 מ"מ)',
    showArrows: false, hints: true, labels: true, plan: {}, evaluateAtEnd: true,
    storms: [
      winter({ label: 'השבוע הגשום', cells: [H(0, 300, 1.3, 80), L(100, 300, 1.4, 55)], start: { x: 40, y: 300 }, duration: 40 }),
      ...Array.from({ length: 10 }, (_, i) => winter({
        label: `חורף ${i + 1}`, mmScale: 24, cells: [H(0, 300, 1.3, 80), L(100, 300, 1.3, 55)], start: { x: 50, y: 300 }, duration: 18,
      })),
    ],
    targets: [
      { id: 'week', he: 'השבוע הגשום', kind: 'water', icon: 'field', zones: [at('telaviv', 10, 9, 0)], need: 30, storms: [0] },
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `y${i + 1}`, he: `חורף ${i + 1}`, kind: 'water' as const, icon: 'field' as const,
        zones: [at('telaviv', 10, 9, 0)], need: 420, max: 620, storms: [i + 1],
      })),
    ],
    success: 'שבוע גשום אחד הוא מזג אוויר. האקלים הוא ממוצע של 30 שנה ויותר, והוא כמעט לא זז.',
    solution: { plan: { tokens: [] }, routes: Array.from({ length: 11 }, () => [pt('telaviv', 9, 0)]) },
  },
  {
    id: 17, world: 4, title: 'למלא את הכנרת',
    brief: 'מסע של שלוש סערות. גשם על הגליל ועל הגולן ממלא את הכנרת. אל תתנו למד לרדת אל הקו האדום!',
    goal: 'מלאו את הכנרת ושמרו עליה מעל הקו האדום',
    showArrows: false, hints: true, labels: true, plan: {}, evaluateAtEnd: true,
    storms: [
      winter({ label: 'סערה 1', T0: 10, cells: [H(40, 390, 1.2, 70), L(205, 405, 1.3, 80)], start: { x: 84, y: 398 }, duration: 40 }),
      winter({ label: 'סערה 2', T0: 9, cells: [H(40, 360, 1.2, 70), L(210, 430, 1.3, 80)], start: { x: 80, y: 372 }, duration: 40 }),
      winter({ label: 'סערה 3', T0: 8, cells: [H(40, 410, 1.2, 70), L(205, 440, 1.3, 80)], start: { x: 86, y: 410 }, duration: 40 }),
    ],
    targets: [{
      id: 'kinneret', he: 'מד הכנרת', kind: 'water', icon: 'kinneret',
      zones: [at('upperGalilee', 9, 2, 0), at('golan', 9), at('hermon', 8, -2, -4), at('safed', 6)],
      need: 100, start: 45, drain: 0.45, redLine: 15,
    }],
    success: 'הגשם על הגליל ועל הגולן זרם אל הכנרת. הכנרת מלאה!',
    solution: {
      plan: { tokens: [] },
      routes: [[pt('upperGalilee', 2, 0), pt('golan')], [pt('safed'), pt('golan')], [pt('upperGalilee', 2, 0), pt('hermon', -2, -4)]],
    },
  },
  {
    id: 18, world: 4, title: 'הסערה הגדולה',
    brief: 'לילה, סערת חורף ארוכה מהמערב על כל הארץ. בלי רמזים ובלי שמות על המפה. בחרו שקע ושעה.',
    goal: 'גשם בחוף, שלג בירושלים ובחרמון, כנרת מלאה, ובלי שיטפון במדבר',
    showArrows: false, hints: false, labels: false,
    plan: {
      tokens: { L: 1, H: 0 }, mustPlace: true,
      slots: [
        { id: 'center', x: 128, y: 258, kinds: ['L'] },
        { id: 'south', x: 120, y: 200, kinds: ['L'] },
        { id: 'sea', x: 30, y: 330, kinds: ['L'] },
      ],
      hours: [15, 3], defaultHour: 15,
    },
    evaluateAtEnd: true,
    storms: [
      winter({ label: 'הסערה מגיעה', T0: 6.5, hour: 15, night: true, lightning: true, cells: [H(5, 285, 1.2, 80)], start: { x: 40, y: 300 }, duration: 75 }),
      winter({ label: 'הסערה בצפון', T0: 6.5, hour: 15, night: true, lightning: true, cells: [H(40, 380, 1.2, 70), L(205, 470, 1.4, 80)], start: { x: 76, y: 402 }, duration: 75 }),
    ],
    targets: [
      { id: 'coast', he: 'החוף', kind: 'rain', icon: 'city', zones: [at('telaviv', 8, 3, -2)], need: 6, storms: [0] },
      { id: 'jerusalem', he: 'שלג בירושלים', kind: 'snow', icon: 'snowman', zones: [at('jerusalem', 6)], need: 10, storms: [0] },
      { id: 'hermon', he: 'שלג בחרמון', kind: 'snow', icon: 'snowman', zones: [at('hermon', 8)], need: 14, storms: [1] },
      { id: 'kinneret', he: 'הכנרת', kind: 'water', icon: 'kinneret', zones: [{ x: 135, y: 414, r: 10 }, { x: 158, y: 423, r: 8 }], need: 10, storms: [1] },
    ],
    wadis: [
      { id: 'arugot', he: 'נחל ערוגות', zone: { x: PLACES.eingedi.x - 4, y: PLACES.eingedi.y + 8, r: 12 }, threshold: 25, jeep: true },
      { id: 'zin', he: 'נחל צין', zone: { x: PLACES.ramon.x, y: PLACES.ramon.y, r: 12 }, threshold: 25, jeep: true },
    ],
    success: 'קראתם את הלחץ, את הגובה ואת השעה. גשם בחוף, שלג בהרים, הכנרת מתמלאת והמדבר שקט.',
    solution: {
      plan: { tokens: [{ slot: 'center', kind: 'L' }], hour: 3 },
      routes: [[pt('telaviv', 4, -2), pt('jerusalem')], [{ x: 135, y: 414 }, pt('hermon')]],
    },
  },
];

export function levelById(id: number): LevelDef {
  const l = LEVELS.find((x) => x.id === id);
  if (!l) throw new Error(`no level ${id}`);
  return l;
}
