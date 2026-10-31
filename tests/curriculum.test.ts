// Curriculum tests: the pure atmosphere rules match the documented model values
// (docs/research/model-values.md) and the curriculum map covers every level.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  CAPACITY_TABLE, LAPSE_C_PER_100M, SLUSH_MAX_C, SNOW_MAX_C, capacity, landSeaContrast, precipKind,
  pressureAt, seaBreezeCells, tempAt, windAt, type PressureCell,
} from '../src/rules/atmosphere.ts';
import { PLACES, groundHeight } from '../src/rules/geo.ts';
import { LEVELS, levelById } from '../src/rules/levels.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

describe('saturation capacity', () => {
  // docs/research/model-values.md §3 (HyperPhysics table / Bolton 1980), g/m³
  const MODEL_VALUES: [number, number][] = [
    [-10, 2.36], [-5, 3.41], [0, 4.85], [5, 6.79], [10, 9.39], [15, 12.81],
    [20, 17.27], [25, 23.02], [30, 30.35], [35, 39.6], [40, 51.17],
  ];

  test('matches model-values.md within 0.3 g/m³ (sub-zero rows may use over-ice values)', () => {
    for (const [T, want] of MODEL_VALUES) {
      const got = capacity(T);
      assert.ok(Math.abs(got - want) <= 0.3, `${T} °C: ${got} vs ${want}`);
    }
  });

  test('table rows are strictly increasing in both temperature and capacity', () => {
    for (let i = 1; i < CAPACITY_TABLE.length; i++) {
      assert.ok(CAPACITY_TABLE[i][0] > CAPACITY_TABLE[i - 1][0]);
      assert.ok(CAPACITY_TABLE[i][1] > CAPACITY_TABLE[i - 1][1]);
    }
  });

  test('capacity(T) is monotonic between -25 and 50 °C', () => {
    let prev = -Infinity;
    for (let T = -25; T <= 50; T += 0.25) {
      const c = capacity(T);
      assert.ok(c >= prev, `drops at ${T} °C`);
      prev = c;
    }
  });

  test('warm air holds more: roughly double per +10 °C (0-30 °C)', () => {
    for (let T = 0; T <= 30; T += 5) {
      const ratio = capacity(T + 10) / capacity(T);
      assert.ok(ratio > 1.6 && ratio < 2.2, `${T}→${T + 10} °C ratio ${ratio.toFixed(2)}`);
    }
  });
});

describe('altitude cooling and precipitation type', () => {
  test('displayed lapse rate is 0.6 °C per 100 m (העשרה)', () => {
    assert.equal(LAPSE_C_PER_100M, 0.6);
    assert.ok(Math.abs(tempAt(5, 800) - 0.2) < 1e-9);
    assert.ok(Math.abs(tempAt(10, -430) - 12.58) < 1e-9, 'descending below sea level warms');
  });

  test('thresholds: snow ≤ 1 °C, slush 1-3 °C, rain above', () => {
    assert.equal(SNOW_MAX_C, 1);
    assert.equal(SLUSH_MAX_C, 3);
    assert.equal(precipKind(-5), 'snow');
    assert.equal(precipKind(1), 'snow');
    assert.equal(precipKind(2), 'slush');
    assert.equal(precipKind(3.5), 'rain');
  });

  test('same storm (level 7, sea level 4.6 °C): Tel Aviv rain, Jerusalem snow, 400-550 m slopes slush', () => {
    const T0 = levelById(7).storms[0].T0;
    const kindAt = (h: number) => precipKind(tempAt(T0, Math.max(0, h)));
    assert.equal(kindAt(groundHeight(PLACES.telaviv.x, PLACES.telaviv.y)), 'rain');
    const jh = groundHeight(PLACES.jerusalem.x, PLACES.jerusalem.y);
    assert.ok(jh > 700 && jh < 850, `Jerusalem DEM height ${jh.toFixed(0)} m (module: 800 m)`);
    assert.equal(kindAt(jh), 'snow');
    for (const h of [400, 450, 500, 550]) assert.equal(kindAt(h), 'slush', `${h} m`);
    assert.equal(kindAt(groundHeight(PLACES.hermon.x, PLACES.hermon.y)), 'snow');
  });

  test('snow is decided by height, not distance from the sea: Tiberias/Kinneret (inland, below sea level) gets rain', () => {
    const T0 = levelById(7).storms[0].T0;
    assert.equal(precipKind(tempAt(T0, groundHeight(PLACES.kinneret.x, PLACES.kinneret.y))), 'rain');
  });
});

describe('wind blows from ג to ל', () => {
  const H = (x: number, y: number, s = 1.2, r = 75): PressureCell => ({ kind: 'H', x, y, s, r });
  const L = (x: number, y: number, s = 1.2, r = 75): PressureCell => ({ kind: 'L', x, y, s, r });
  const ORIENTATIONS: [string, number, number][] = [
    ['east', 60, 0], ['west', -60, 0], ['north', 0, 60], ['south', 0, -60], ['north-east', 42, 42], ['south-west', -42, -42],
  ];

  for (const [name, lx, ly] of ORIENTATIONS) {
    test(`ל to the ${name} of ג: wind at the midpoint points from ג toward ל`, () => {
      const cx = 200, cy = 200;
      const cells = [H(cx, cy), L(cx + lx, cy + ly)];
      assert.ok(pressureAt(cells, cx, cy) > pressureAt(cells, cx + lx, cy + ly), 'pressure is higher at ג');
      const w = windAt(cells, cx + lx / 2, cy + ly / 2);
      const sp = Math.hypot(w.u, w.v), d = Math.hypot(lx, ly);
      const cos = (w.u * lx + w.v * ly) / (sp * d);
      assert.ok(sp > 0.5, `speed ${sp}`);
      assert.ok(cos > 0.99, `direction cosine ${cos.toFixed(3)}`);
      // off the axis it still has a component toward ל
      const w2 = windAt(cells, cx + lx / 2 - ly / 4, cy + ly / 2 + lx / 4);
      assert.ok(w2.u * lx + w2.v * ly > 0);
    });
  }

  test('a lone ג blows outward, a lone ל pulls inward', () => {
    const out = windAt([H(100, 100)], 140, 100);
    assert.ok(out.u > 0 && Math.abs(out.v) < 1e-9);
    const inn = windAt([L(100, 100)], 140, 100);
    assert.ok(inn.u < 0 && Math.abs(inn.v) < 1e-9);
  });

  test('a bigger pressure difference gives a stronger wind', () => {
    const speed = (s: number) => { const w = windAt([H(0, 0, s), L(60, 0, s)], 30, 0); return Math.hypot(w.u, w.v); };
    assert.ok(speed(1.2) > speed(0.6) * 1.5, `${speed(1.2)} vs ${speed(0.6)}`);
    assert.ok(speed(0.6) > speed(0.3));
  });
});

describe('sea breeze', () => {
  test('no land-sea contrast at dawn; contrast grows to a mid-afternoon peak', () => {
    assert.ok(landSeaContrast(6, 1) <= 0);
    assert.deepEqual(seaBreezeCells(6, 1, { x: 0, y: 0 }).filter((c) => c.kind === 'L' && c.x > 0), []);
    assert.ok(landSeaContrast(14, 1) > landSeaContrast(10, 1));
    assert.ok(landSeaContrast(14, 1) > landSeaContrast(18, 1));
  });

  test('in the afternoon ל sits over the land and ג over the sea, so the breeze blows onshore', () => {
    const coast = { x: 100, y: 100 };
    const cells = seaBreezeCells(14, 1, coast);
    const low = cells.find((c) => c.kind === 'L')!, high = cells.find((c) => c.kind === 'H')!;
    assert.ok(low.x > coast.x && high.x < coast.x, 'land is east of the coast in this map');
    assert.ok(windAt(cells, coast.x, coast.y).u > 0, 'wind from sea (west) to land (east)');
  });
});

describe('curriculum map', () => {
  const MODULES = [
    'grade-8/chapter-3/atmosphere', 'grade-8/chapter-3/sun-energy', 'grade-8/chapter-3/weather-phenomena',
    'grade-8/chapter-3/climate-zones', 'grade-9/chapter-2/israel-climate', 'grade-9/chapter-2/natural-water-sources',
    'grade-9/chapter-2/landform-belts',
  ];
  const url = (m: string) => `https://geography.workbook.co.il/${m}`;
  const curriculum = read('CURRICULUM.md');

  test('all seven Workbook snapshots are saved and listed in SOURCES.md', () => {
    const sources = read('docs/curriculum/SOURCES.md');
    for (const m of MODULES) {
      const file = `docs/curriculum/${m.replace(/\//g, '_')}.md`;
      assert.ok(existsSync(join(ROOT, file)), file);
      assert.ok(read(file).includes(`כתובת: ${url(m)}`), `${file} carries its canonical URL`);
      assert.ok(sources.includes(url(m)), `SOURCES.md lists ${m}`);
    }
  });

  test('CURRICULUM.md only links the seven module IDs', () => {
    const links = curriculum.match(/https:\/\/geography\.workbook\.co\.il\/[a-z0-9/-]+/g) ?? [];
    assert.ok(links.length > 18);
    for (const l of links) assert.ok(MODULES.some((m) => l === url(m)), `unknown module link ${l}`);
  });

  test('every level has a section with its in-game title, module URL, Hebrew feedback, misconception and transfer evidence', () => {
    const sections = curriculum.split(/^#### /m).slice(1);
    assert.equal(sections.length, 18);
    for (const lv of LEVELS) {
      const s = sections.find((x) => x.startsWith(`${lv.id}. `));
      assert.ok(s, `section for level ${lv.id}`);
      const heading = s.split('\n')[0];
      assert.ok(heading.includes(lv.title), `level ${lv.id} heading "${heading}" names "${lv.title}"`);
      assert.match(s, /\*\*Modules:\*\*[^\n]*https:\/\/geography\.workbook\.co\.il\//);
      for (const field of ['**Skill:**', '**State/action:**', '**Feedback:**', '**Misconception:**', '**Transfer evidence:**']) {
        assert.ok(s.includes(field), `level ${lv.id} has ${field}`);
      }
      assert.match(s, /✔ «[^»]*[א-ת][^»]*»/, `level ${lv.id} has a Hebrew success line`);
      assert.match(s, /✘[^«]*«[^»]*[א-ת][^»]*»/, `level ${lv.id} has a Hebrew failure line`);
    }
  });

  test('CURRICULUM.md has the required sections', () => {
    for (const h of ['## Rule summary', '## Hebrew glossary', '## Source simplifications and inconsistencies', '## Honest limits']) {
      assert.ok(curriculum.includes(h), h);
    }
    assert.ok(curriculum.includes('No Ministry of Education approval'));
  });
});

describe('student-facing level text', () => {
  const texts = LEVELS.flatMap((l) => [
    [l.id, l.title], [l.id, l.brief], [l.id, l.goal], [l.id, l.success],
    ...l.targets.map((t) => [l.id, t.he] as [number, string]),
    ...(l.wadis ?? []).map((w) => [l.id, w.he] as [number, string]),
  ] as [number, string][]);

  test('every level has Hebrew title, brief, goal and success line', () => {
    for (const l of LEVELS) for (const s of [l.title, l.brief, l.goal, l.success]) assert.match(s, /[א-ת]/, `level ${l.id}`);
  });

  test('no terms the Workbook modules do not teach (fronts, convection, orographic, Coriolis)', () => {
    const banned = ['חזית', 'הסעה', 'קונבקטיב', 'אורוגרפ', 'קוריוליס'];
    for (const [id, s] of texts) for (const b of banned) assert.ok(!s.includes(b), `level ${id}: "${b}" in "${s}"`);
  });

  test('wind is never described as blowing from ל to ג', () => {
    for (const [id, s] of texts) assert.ok(!/מ[־-]?ל אל ג|מהשקע אל הרמה/.test(s), `level ${id}: "${s}"`);
  });

  test('the aquifer recharge zone is not called "העשרה" (that word is our enrichment badge)',
    () => {
      const l8 = levelById(8);
      for (const s of [l8.brief, ...l8.targets.map((t) => t.he)]) assert.ok(!s.includes('העשרה'), s);
    });
});
