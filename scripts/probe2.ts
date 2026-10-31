import { toKm, groundHeight, waterAt } from '../src/rules/geo.ts';
for (const [lo, la] of [[34.81,32.08],[34.6,31.66],[35.8,33.36],[35.82,33.38],[35.85,33.41],[35.75,33.3],[35.0,32.68],[35.05,32.72]]) { const p = toKm(lo, la); console.log(lo, la, p.x.toFixed(1), p.y.toFixed(1), Math.round(groundHeight(p.x, p.y)), waterAt(p.x, p.y)); }
