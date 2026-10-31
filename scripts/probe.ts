import { PLACES, MAP_W_KM, MAP_H_KM, groundHeight, waterAt, rawElevation } from '../src/rules/geo.ts';
console.log('map km', MAP_W_KM.toFixed(1), MAP_H_KM.toFixed(1));
for (const p of Object.values(PLACES)) console.log(p.id.padEnd(14), p.x.toFixed(1).padStart(6), p.y.toFixed(1).padStart(6), Math.round(groundHeight(p.x, p.y)).toString().padStart(6), waterAt(p.x, p.y));
// ASCII map every 5 km in x, 8 km in y, north at top
const ch = (x: number, y: number) => { const w = waterAt(x, y); if (w === 'sea') return '~'; if (w !== 'land') return 'o'; const h = rawElevation(x, y); return h < 0 ? '_' : h < 200 ? '.' : h < 500 ? ':' : h < 800 ? '+' : h < 1200 ? '#' : '^'; };
for (let y = MAP_H_KM - 4; y > 0; y -= 8) { let s = String(Math.round(y)).padStart(4) + ' '; for (let x = 0; x < MAP_W_KM; x += 4) s += ch(x, y); console.log(s); }
