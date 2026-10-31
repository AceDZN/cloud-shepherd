// Geography of the diorama: elevation from NOAA ETOPO1, water bodies and named places.
// Coordinates are kilometres: x grows east from the DEM's west edge, y grows north
// from its south edge. Positions are real; heights are metres above sea level.
import { DEM_B64, DEM_H, DEM_LAT0, DEM_LON0, DEM_STEP_DEG, DEM_W } from './demData.ts';

export const KM_PER_DEG_LAT = 111.2;
export const KM_PER_DEG_LON = 111.32 * Math.cos((31.45 * Math.PI) / 180);
export const MAP_W_KM = (DEM_W - 1) * DEM_STEP_DEG * KM_PER_DEG_LON;
export const MAP_H_KM = (DEM_H - 1) * DEM_STEP_DEG * KM_PER_DEG_LAT;
export const KINNERET_LEVEL = -210;
export const DEAD_SEA_LEVEL = -430;

let grid: Int16Array | null = null;
function dem(): Int16Array {
  if (grid) return grid;
  const bin = atob(DEM_B64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  grid = new Int16Array(bytes.buffer);
  return grid;
}

export function toKm(lon: number, lat: number): { x: number; y: number } {
  return { x: (lon - DEM_LON0) * KM_PER_DEG_LON, y: (lat - DEM_LAT0) * KM_PER_DEG_LAT };
}

export function toLonLat(x: number, y: number): { lon: number; lat: number } {
  return { lon: DEM_LON0 + x / KM_PER_DEG_LON, lat: DEM_LAT0 + y / KM_PER_DEG_LAT };
}

/** Raw DEM value (metres, sea floor negative), bilinear. */
export function rawElevation(x: number, y: number): number {
  const g = dem();
  const fx = Math.min(DEM_W - 1.001, Math.max(0, x / (DEM_STEP_DEG * KM_PER_DEG_LON)));
  const fy = Math.min(DEM_H - 1.001, Math.max(0, y / (DEM_STEP_DEG * KM_PER_DEG_LAT)));
  const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
  const a = g[iy * DEM_W + ix], b = g[iy * DEM_W + ix + 1];
  const c = g[(iy + 1) * DEM_W + ix], d = g[(iy + 1) * DEM_W + ix + 1];
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}

export type Water = 'land' | 'sea' | 'kinneret' | 'deadsea';

/** Which surface is under a point. The Mediterranean and the Gulf of Eilat count as sea. */
export function waterAt(x: number, y: number): Water {
  const h = rawElevation(x, y);
  const { lon, lat } = toLonLat(x, y);
  if (h < 1 && lat > 31.2 && lon < 35.12 - (lat - 33) * 0.08) return 'sea';
  if (h < 1 && lat <= 31.2 && lon < 34.42 + (lat - 31.2) * -0.12 && lat > 30.9) return 'sea';
  if (h < 1 && lon < 34.25) return 'sea';
  if (lat < 29.56 && h < 1 && lon > 34.88 && lon < 35.02) return 'sea';
  if (h < -150 && lat > 32.7 && lat < 32.92 && lon > 35.5 && lon < 35.66) return 'kinneret';
  if (h < -380 && lat > 31.0 && lat < 31.8 && lon > 35.35 && lon < 35.62) return 'deadsea';
  return 'land';
}

/** Ground or water-surface height the air must pass over (metres). */
export function groundHeight(x: number, y: number): number {
  const w = waterAt(x, y);
  if (w === 'sea') return 0;
  if (w === 'kinneret') return KINNERET_LEVEL;
  if (w === 'deadsea') return DEAD_SEA_LEVEL;
  return rawElevation(x, y);
}

export interface Place { id: string; he: string; x: number; y: number }

function place(id: string, he: string, lon: number, lat: number): Place {
  return { id, he, ...toKm(lon, lat) };
}

/** Named places (WGS84 lon/lat converted to map km). The map is schematic, not GIS. */
export const PLACES: Record<string, Place> = Object.fromEntries(
  [
    place('telaviv', 'תל אביב', 34.81, 32.08),
    place('haifa', 'חיפה', 34.99, 32.8),
    place('carmel', 'הכרמל', 35.05, 32.69),
    place('jezreel', 'עמק יזרעאל', 35.3, 32.6),
    place('jerusalem', 'ירושלים', 35.21, 31.78),
    place('shephelah', 'השפלה', 34.92, 31.72),
    place('judeanSlopes', 'המדרונות המערביים', 35.06, 31.74),
    place('judeanDesert', 'מדבר יהודה', 35.36, 31.62),
    place('deadsea', 'ים המלח', 35.5, 31.5),
    place('hebron', 'הר חברון', 35.1, 31.53),
    place('samaria', 'הרי שומרון', 35.22, 32.2),
    place('beersheva', 'באר שבע', 34.79, 31.25),
    place('kiryatgat', 'קריית גת', 34.77, 31.61),
    place('yeruham', 'ירוחם', 34.93, 30.99),
    place('mitzperamon', 'מצפה רמון', 34.8, 30.61),
    place('eilat', 'אילת', 34.95, 29.56),
    place('kinneret', 'הכנרת', 35.59, 32.82),
    place('golan', 'רמת הגולן', 35.76, 32.98),
    place('hermon', 'החרמון', 35.8, 33.36),
    place('safed', 'צפת', 35.5, 32.96),
    place('meron', 'הר מירון', 35.41, 32.99),
    place('metula', 'מטולה', 35.58, 33.28),
    place('upperGalilee', 'הגליל העליון', 35.4, 33.03),
    place('westGalilee', 'הגליל המערבי', 35.18, 32.98),
    place('ashkelon', 'אשקלון', 34.6, 31.66),
    place('ramon', 'נחל צין', 35.05, 30.86),
    place('eingedi', 'עין גדי', 35.37, 31.46),
    place('netanya', 'נתניה', 34.86, 32.33),
  ].map((p) => [p.id, p]),
);

export function distKm(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}
