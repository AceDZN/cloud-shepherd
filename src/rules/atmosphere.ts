// Pure atmosphere rules. Every number the player sees comes from here.
// Simplified teaching model; values marked "enrichment" (העשרה) are not given by Workbook.

/** Temperature falls with height. Workbook says "colder higher up"; the rate is enrichment. */
export const LAPSE_C_PER_100M = 0.6;

/** Saturation vapour content of air (g/m³) by temperature (°C). Standard psychrometric values. */
export const CAPACITY_TABLE: ReadonlyArray<readonly [number, number]> = [
  [-20, 0.9], [-10, 2.1], [-5, 3.3], [0, 4.8], [5, 6.8], [10, 9.4], [15, 12.8],
  [20, 17.3], [25, 23.0], [30, 30.4], [35, 39.6], [40, 51.1], [45, 65.4],
];

export function capacity(tempC: number): number {
  const t = CAPACITY_TABLE;
  if (tempC <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++) {
    if (tempC <= t[i][0]) {
      const [t0, c0] = t[i - 1], [t1, c1] = t[i];
      return c0 + ((tempC - t0) / (t1 - t0)) * (c1 - c0);
    }
  }
  return t[t.length - 1][1];
}

export function tempAt(seaLevelTempC: number, heightM: number): number {
  return seaLevelTempC - (LAPSE_C_PER_100M * heightM) / 100;
}

export type PrecipKind = 'rain' | 'slush' | 'snow';

/** What reaches the ground depends on the ground's temperature, i.e. its height. Simplified thresholds. */
export const SNOW_MAX_C = 1.0;
export const SLUSH_MAX_C = 3.0;
export function precipKind(groundTempC: number): PrecipKind {
  if (groundTempC <= SNOW_MAX_C) return 'snow';
  if (groundTempC <= SLUSH_MAX_C) return 'slush';
  return 'rain';
}

export type CellKind = 'H' | 'L';
export interface PressureCell {
  kind: CellKind;
  x: number;
  y: number;
  /** relative strength (1 = standard synoptic cell) */
  s: number;
  /** radius of influence in km */
  r: number;
}

/** Wind speed scale: km per game-second per unit of pressure gradient (per km). */
export const WIND_K = 125;
export const WIND_MAX = 4.2;

export function pressureAt(cells: readonly PressureCell[], x: number, y: number): number {
  let p = 0;
  for (const c of cells) {
    const d2 = ((x - c.x) ** 2 + (y - c.y) ** 2) / (c.r * c.r);
    p += (c.kind === 'H' ? 1 : -1) * c.s * Math.exp(-d2);
  }
  return p;
}

/**
 * Air flows from high (ג) to low (ל): wind = −K·∇P. A bigger pressure difference over a
 * shorter distance means a stronger wind. No Coriolis deflection (not in the Workbook modules).
 */
export function windAt(cells: readonly PressureCell[], x: number, y: number): { u: number; v: number } {
  let gx = 0, gy = 0;
  for (const c of cells) {
    const dx = x - c.x, dy = y - c.y, r2 = c.r * c.r;
    const e = Math.exp(-(dx * dx + dy * dy) / r2) * (c.kind === 'H' ? 1 : -1) * c.s;
    gx += (e * -2 * dx) / r2;
    gy += (e * -2 * dy) / r2;
  }
  let u = -WIND_K * gx, v = -WIND_K * gy;
  const sp = Math.hypot(u, v);
  if (sp > WIND_MAX) { u *= WIND_MAX / sp; v *= WIND_MAX / sp; }
  return { u, v };
}

/** Influence (0…~1) of lows or highs at a point: rising air under ל, sinking air under ג. */
export function cellInfluence(cells: readonly PressureCell[], kind: CellKind, x: number, y: number): number {
  let s = 0;
  for (const c of cells) {
    if (c.kind !== kind) continue;
    s += c.s * Math.exp(-((x - c.x) ** 2 + (y - c.y) ** 2) / (c.r * c.r * 0.6));
  }
  return s;
}

/**
 * Land heats faster than sea. Land–sea temperature difference (°C) by hour on a sunny summer
 * day: zero before mid-morning, peaking mid-afternoon, slightly negative at night.
 */
export function landSeaContrast(hour: number, sunny: number): number {
  if (hour >= 8 && hour <= 19) return 9 * sunny * Math.sin((Math.PI * (hour - 8)) / 12);
  return -1.5 * sunny;
}

export function seaBreezeCells(hour: number, sunny: number, coast: { x: number; y: number }): PressureCell[] {
  const d = landSeaContrast(hour, sunny);
  if (d < -0.5) {
    // at night the land is cooler than the sea: a weak land breeze blows out to sea
    return [
      { kind: 'H', x: coast.x + 22, y: coast.y, s: 0.55, r: 26 },
      { kind: 'L', x: coast.x - 30, y: coast.y, s: 0.55, r: 30 },
    ];
  }
  if (d <= 0.3) return [];
  const s = d / 9;
  return [
    { kind: 'L', x: coast.x + 34, y: coast.y, s: 0.75 * s, r: 30 },
    { kind: 'H', x: coast.x - 34, y: coast.y, s: 0.75 * s, r: 30 },
  ];
}

/** Daily temperature swing at sea level (°C relative to the daily mean): warmest mid-afternoon. */
export function diurnal(hour: number): number {
  return 1.5 * Math.cos((Math.PI * (hour - 14)) / 12);
}
