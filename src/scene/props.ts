// Everything standing on the diorama: scattered trees and towns, the level's targets (with their
// characters), zone rings, ג/ל tokens and plan slots, wadis with the jeep, khamsin haze, the arid line.
import * as THREE from 'three';
import { PLACES, rawElevation, toKm, waterAt, toLonLat, MAP_W_KM, MAP_H_KM } from '../rules/geo.ts';
import type { CellKind } from '../rules/atmosphere.ts';
import type { Circle, LevelDef, Target, TokenSlot, Wadi } from '../rules/types.ts';
import { Actor, std, type Assets } from './assets.ts';
import { surfaceY } from './terrain.ts';

function rand(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** A thin ribbon following the ground along a circle. */
export function drapedRing(c: Circle, width: number, color: THREE.ColorRepresentation, lift = 0.12): THREE.Mesh {
  const n = 96, pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    // one height for both edges so the ribbon stays flat on steep slopes
    const h = Math.max(surfaceY(c.x + ca * (c.r - width), c.y + sa * (c.r - width)), surfaceY(c.x + ca * c.r, c.y + sa * c.r), 0.02) + lift;
    for (const rr of [c.r - width, c.r]) pos.push(c.x + ca * rr, h, -(c.y + sa * rr));
    if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
  m.renderOrder = 4;
  return m;
}

/** A soft filled disc following the ground. */
function drapedDisc(c: Circle, color: THREE.ColorRepresentation, opacity: number, lift = 0.08): THREE.Mesh {
  const rings = 6, seg = 48, pos: number[] = [], idx: number[] = [];
  pos.push(c.x, Math.max(surfaceY(c.x, c.y), 0.02) + lift, -c.y);
  for (let r = 1; r <= rings; r++) {
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2, rr = (r / rings) * c.r;
      const x = c.x + Math.cos(a) * rr, y = c.y + Math.sin(a) * rr;
      pos.push(x, Math.max(surfaceY(x, y), 0.02) + lift, -y);
    }
  }
  for (let i = 0; i < seg; i++) idx.push(0, 1 + i, 1 + ((i + 1) % seg));
  for (let r = 1; r < rings; r++) {
    const a0 = 1 + (r - 1) * seg, a1 = 1 + r * seg;
    for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg;
      idx.push(a0 + i, a1 + i, a1 + j, a0 + i, a1 + j, a0 + j);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }));
  m.renderOrder = 3;
  return m;
}

/** A small patch of ground (field, wheat) following the terrain, with furrow stripes. */
function drapedPatch(cx: number, cy: number, w: number, h: number, rot: number): THREE.Mesh {
  const nx = 10, ny = 10, pos: number[] = [], col: number[] = [], idx: number[] = [];
  const cs = Math.cos(rot), sn = Math.sin(rot);
  for (let j = 0; j <= ny; j++) {
    for (let i = 0; i <= nx; i++) {
      const u = (i / nx - 0.5) * w, v = (j / ny - 0.5) * h;
      const x = cx + u * cs - v * sn, y = cy + u * sn + v * cs;
      pos.push(x, surfaceY(x, y) + 0.06, -y);
      const stripe = j % 2 === 0 ? 1 : 0.78;
      col.push(stripe, stripe, stripe);
    }
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, color: '#a5713f', polygonOffset: true, polygonOffsetFactor: -2 }));
  m.receiveShadow = true;
  return m;
}

function letterTexture(letter: string, bg: string, ring: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill();
  g.lineWidth = 16; g.strokeStyle = ring;
  g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#ffffff';
  g.font = '700 170px Rubik, system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 8;
  g.fillText(letter, 128, 140);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const TOKEN_STYLE: Record<CellKind, { letter: string; bg: string; ring: string; edge: string }> = {
  H: { letter: 'ג', bg: '#ff8a1f', ring: '#ffd27a', edge: '#c95a00' },
  L: { letter: 'ל', bg: '#2f7ff0', ring: '#9fd0ff', edge: '#1748a8' },
};

/** A ג/ל coin standing on the map. Fixed coins (part of the weather) have a grey rim. */
export function makeToken(kind: CellKind, fixed: boolean, size = 3.2): THREE.Group {
  const st = TOKEN_STYLE[kind];
  const g = new THREE.Group();
  const face = new THREE.MeshBasicMaterial({ map: letterTexture(st.letter, st.bg, fixed ? '#d9dde6' : st.ring), transparent: true });
  const edge = std(fixed ? '#8a93a6' : st.edge, { metalness: 0.3, roughness: 0.4 });
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(size / 2, size / 2, size * 0.16, 40), edge);
  coin.rotation.x = Math.PI / 2;
  coin.castShadow = true;
  // the letter sits on an upright plane in front of the coin, so it always reads the right way up
  const front = new THREE.Mesh(new THREE.CircleGeometry(size / 2, 40), face);
  front.position.z = size * 0.081;
  const holder = new THREE.Group();
  holder.add(coin, front);
  holder.position.y = size * 0.75;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, size * 0.6, 6), std('#ffffff', { transparent: true, opacity: 0.6 }));
  stem.position.y = size * 0.3;
  g.add(holder, stem);
  g.userData.holder = holder;
  return g;
}

export interface TargetView {
  t: Target;
  rings: THREE.Mesh[];
  discs: THREE.Mesh[];
  icon: THREE.Group;
  anchor: THREE.Vector3;
  actors: Actor[];
  update: (frac: number, met: boolean, over: boolean, dt: number, time: number) => void;
}

export class Props {
  group = new THREE.Group();
  level = new THREE.Group();
  private actors: Actor[] = [];
  targets: TargetView[] = [];
  slots: { slot: TokenSlot; ring: THREE.Mesh; pillar: THREE.Mesh; token: THREE.Group | null; kind: CellKind | null }[] = [];
  fixedTokens: THREE.Group[] = [];
  wadis: { w: Wadi; ribbon: THREE.Mesh; jeep: THREE.Object3D | null; flood: number }[] = [];
  private haze: THREE.Mesh[] = [];
  private time = 0;

  constructor(private assets: Assets) {
    this.group.add(this.level);
    this.scatter();
  }

  /** Trees on the wet north and west, towns at the cities, a boat off the coast. */
  private scatter() {
    const R = rand(11);
    const treeGeo = new THREE.IcosahedronGeometry(0.42, 0);
    treeGeo.translate(0, 0.55, 0);
    const trunkGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.4, 5);
    trunkGeo.translate(0, 0.2, 0);
    const N = 1400;
    const crowns = new THREE.InstancedMesh(treeGeo, std('#ffffff', { flatShading: true }), N);
    const trunks = new THREE.InstancedMesh(trunkGeo, std('#6b4a2b'), N);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const col = new THREE.Color();
    let k = 0;
    for (let tries = 0; tries < 30000 && k < N; tries++) {
      const x = R() * MAP_W_KM, y = R() * MAP_H_KM;
      if (waterAt(x, y) !== 'land') continue;
      const { lat, lon } = toLonLat(x, y);
      const h = rawElevation(x, y);
      let chance = THREE.MathUtils.clamp((lat - 31.4) / 1.2, 0, 1);
      if (lon > 35.32 && lat < 32.6) chance *= 0.15;
      if (h < -100) chance = 0;
      if (R() > chance * 0.9) continue;
      const sc = 0.4 + R() * 0.5;
      p.set(x, surfaceY(x, y) - 0.05, -y);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), R() * 6);
      s.set(sc, sc * (0.9 + R() * 0.5), sc);
      m.compose(p, q, s);
      crowns.setMatrixAt(k, m);
      trunks.setMatrixAt(k, m);
      crowns.setColorAt(k, col.set(R() > 0.5 ? '#7fb24a' : '#5c9a3e').offsetHSL(0, 0, (R() - 0.5) * 0.08));
      this.treeMats.push(m.clone());
      k++;
    }
    crowns.count = trunks.count = k;
    this.crowns = crowns; this.trunks = trunks;
    crowns.castShadow = true;
    this.group.add(crowns, trunks);

    // towns: white-limestone blocks, denser in the city centre
    const towns: [string, number, number][] = [
      ['telaviv', 6, 260], ['haifa', 4, 130], ['jerusalem', 5, 220], ['beersheva', 4, 110], ['eilat', 2.5, 50],
      ['netanya', 3, 70], ['ashkelon', 3, 60], ['safed', 2, 40], ['kiryatgat', 2, 40],
    ];
    const boxGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    boxGeo.translate(0, 0.25, 0);
    const total = towns.reduce((a, t) => a + t[2], 0);
    const houses = new THREE.InstancedMesh(boxGeo, std('#f1e7d0'), total);
    let h = 0;
    for (const [id, r, n] of towns) {
      const c = PLACES[id];
      for (let i = 0; i < n; i++) {
        const a = R() * Math.PI * 2, d = Math.sqrt(R()) * r;
        const x = c.x + Math.cos(a) * d, y = c.y + Math.sin(a) * d;
        if (waterAt(x, y) !== 'land') continue;
        const tall = id === 'telaviv' && d < 2.5 ? 1 + R() * 4 : 0.6 + R() * 0.8;
        p.set(x, surfaceY(x, y) - 0.05, -y);
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), R() * 0.4);
        s.set(0.7 + R() * 0.6, tall, 0.7 + R() * 0.6);
        m.compose(p, q, s);
        houses.setMatrixAt(h++, m);
      }
    }
    houses.count = h;
    houses.castShadow = houses.receiveShadow = true;
    this.group.add(houses);

    // two fishing boats off the coast
    for (const [lon, lat, rot] of [[34.62, 32.3, 0.4], [34.83, 32.86, -0.6]] as const) {
      const b = this.assets.prop('boat', 2.2);
      const { x, y } = toKm(lon, lat);
      b.position.set(x, 0.05, -y);
      b.rotation.y = rot;
      b.userData.bob = R() * 6;
      this.group.add(b);
      this.boats.push(b);
    }
  }
  private boats: THREE.Object3D[] = [];
  private crowns!: THREE.InstancedMesh;
  private trunks!: THREE.InstancedMesh;
  private treeMats: THREE.Matrix4[] = [];

  /** Clear scattered trees out of target zones so fields, snowmen and characters stay visible. */
  private clearTrees(zones: Circle[]) {
    const p = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
    this.treeMats.forEach((m, i) => {
      p.setFromMatrixPosition(m);
      const inside = zones.some((z) => Math.hypot(p.x - z.x, -p.z - z.y) < Math.min(z.r * 0.8, 7));
      this.crowns.setMatrixAt(i, inside ? zero : m);
      this.trunks.setMatrixAt(i, inside ? zero : m);
    });
    this.crowns.instanceMatrix.needsUpdate = this.trunks.instanceMatrix.needsUpdate = true;
  }

  clearLevel() {
    this.group.remove(this.level);
    this.level = new THREE.Group();
    this.group.add(this.level);
    this.actors = [];
    this.targets = [];
    this.slots = [];
    this.fixedTokens = [];
    this.wadis = [];
    this.haze = [];
  }

  buildLevel(level: LevelDef) {
    this.clearLevel();
    this.clearTrees(level.targets.filter((t) => ['field', 'wheat', 'snowman', 'city', 'lifeguard', 'fire', 'bloom'].includes(t.icon)).flatMap((t) => t.zones));
    for (const t of level.targets) this.targets.push(this.buildTarget(t));
    for (const w of level.wadis ?? []) this.buildWadi(w);
    for (const s of level.plan.slots ?? []) {
      const ring = drapedRing({ x: s.x, y: s.y, r: 6 }, 1.1, '#ffffff', 0.3);
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 7, 8, 1, true),
        new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false }));
      pillar.position.set(s.x, Math.max(0, surfaceY(s.x, s.y)) + 3.5, -s.y);
      this.level.add(ring, pillar);
      this.slots.push({ slot: s, ring, pillar, token: null, kind: null });
    }
    // khamsin haze over its zones (any storm)
    for (const st of level.storms) {
      for (const z of st.khamsin?.zones ?? []) {
        const haze = new THREE.Mesh(new THREE.CylinderGeometry(z.r, z.r, 14, 48, 1, true),
          new THREE.MeshBasicMaterial({ color: '#e0a25a', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
        haze.position.set(z.x, 6, -z.y);
        this.level.add(haze);
        this.haze.push(haze);
      }
    }
    // the arid line (schematic, ~200 mm a year) when a level reaches the south
    if (level.id >= 11 && level.id !== 13) {
      const pts: THREE.Vector3[] = [];
      for (let lon = 34.25; lon <= 35.4; lon += 0.02) {
        const lat = 31.3 + Math.sin(lon * 9) * 0.03;
        const { x, y } = toKm(lon, lat);
        pts.push(new THREE.Vector3(x, Math.max(0, surfaceY(x, y)) + 0.25, -y));
      }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: '#b5462a', dashSize: 1.4, gapSize: 0.9 }));
      line.computeLineDistances();
      line.userData.arid = true;
      this.level.add(line);
    }
  }

  showFixedTokens(cells: { kind: CellKind; x: number; y: number }[]) {
    for (const t of this.fixedTokens) this.level.remove(t);
    this.fixedTokens = [];
    for (const c of cells) {
      if (c.x < -10 || c.y < -10 || c.x > MAP_W_KM + 10 || c.y > MAP_H_KM + 10) continue;
      const tok = makeToken(c.kind, true, 7);
      const x = THREE.MathUtils.clamp(c.x, 3, MAP_W_KM - 3), y = THREE.MathUtils.clamp(c.y, 3, MAP_H_KM - 3);
      tok.position.set(x, Math.max(0.1, surfaceY(x, y)) + 0.2, -y);
      this.level.add(tok);
      this.fixedTokens.push(tok);
    }
  }

  setFixedTokensVisible(v: boolean) { for (const t of this.fixedTokens) t.visible = v; }

  placeToken(slotId: string, kind: CellKind | null) {
    const s = this.slots.find((q) => q.slot.id === slotId);
    if (!s) return;
    if (s.token) { this.level.remove(s.token); s.token = null; }
    s.kind = kind;
    if (kind) {
      s.token = makeToken(kind, false, 7);
      s.token.position.set(s.slot.x, Math.max(0.1, surfaceY(s.slot.x, s.slot.y)) + 0.4, -s.slot.y);
      s.token.scale.setScalar(0.01);
      this.level.add(s.token);
    }
  }

  setSlotsVisible(v: boolean, hint: string | null = null) {
    for (const s of this.slots) {
      s.ring.visible = v && !s.token;
      s.pillar.visible = v && !s.token;
      (s.ring.material as THREE.MeshBasicMaterial).color.set(hint === s.slot.id ? '#5dff8a' : '#ffffff');
    }
  }

  private buildTarget(t: Target): TargetView {
    const colorFor = () => (t.optional ? '#c78bff' : '#ffd84a');
    const rings = t.zones.map((z) => drapedRing(z, Math.max(0.5, z.r * 0.07), colorFor()));
    const discs = t.zones.map((z) => drapedDisc(z, colorFor(), 0.1));
    for (const r of [...rings, ...discs]) this.level.add(r);
    const z0 = t.zones[0];
    const icon = new THREE.Group();
    const gy = Math.max(0.05, surfaceY(z0.x, z0.y));
    icon.position.set(z0.x, gy, -z0.y);
    this.level.add(icon);
    const actors: Actor[] = [];
    let update: TargetView['update'] = () => {};
    const R = rand(t.id.length * 97 + z0.x * 13);
    const local = (dx: number, dy: number) => new THREE.Vector3(dx, Math.max(0.05, surfaceY(z0.x + dx, z0.y + dy)) - gy, -dy);

    if (t.icon === 'field' || t.icon === 'wheat') {
      const patches = t.zones.map((z, i) => {
        const p = drapedPatch(z.x, z.y, Math.min(5, z.r * 0.7), Math.min(4, z.r * 0.55), 0.3 + i);
        this.level.add(p);
        return p;
      });
      const dry = new THREE.Color(t.icon === 'wheat' ? '#d9b04a' : '#a5713f');
      const wet = new THREE.Color('#58b83a');
      const farmer = this.assets.actor('farmer', 1.6);
      farmer.root.position.copy(local(2.6, -1.4));
      farmer.root.rotation.y = -0.6;
      farmer.play('idle');
      icon.add(farmer.root);
      actors.push(farmer);
      update = (frac, met) => {
        for (const p of patches) (p.material as THREE.MeshStandardMaterial).color.copy(dry).lerp(wet, Math.min(1, frac));
        farmer.play(met ? 'cheer' : 'idle');
      };
    } else if (t.icon === 'fire') {
      const N = 90;
      const pos = new Float32Array(N * 3), seeds = new Float32Array(N);
      for (let i = 0; i < N; i++) seeds[i] = R();
      const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const flames = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ff7a1a', size: 0.7, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, map: flameTex() }));
      flames.frustumCulled = false;
      const smoke = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#555', size: 2.2, transparent: true, opacity: 0.25, depthWrite: false, map: flameTex() }));
      smoke.frustumCulled = false;
      smoke.scale.set(1.2, 3, 1.2);
      icon.add(flames, smoke);
      for (let i = 0; i < 9; i++) {
        const tr = this.tree('cypress', 1.4 + R() * 0.8);
        tr.position.copy(local((R() - 0.5) * 6, (R() - 0.5) * 6));
        icon.add(tr);
      }
      update = (frac, _met, _o, _dt, time) => {
        const k = Math.max(0, 1 - frac);
        for (let i = 0; i < N; i++) {
          const s = seeds[i], life = (time * (0.6 + s) + s * 10) % 1;
          const a = s * 40, d = 2.6 * Math.sqrt(s);
          pos.set([Math.cos(a) * d, local(Math.cos(a) * d, Math.sin(a) * d).y + life * 1.6 * k, Math.sin(a) * d], i * 3);
        }
        geo.attributes.position.needsUpdate = true;
        (flames.material as THREE.PointsMaterial).opacity = 0.9 * k;
        (smoke.material as THREE.PointsMaterial).opacity = 0.25 * Math.min(1, k + 0.3) * (frac >= 1 ? 0.4 : 1);
      };
    } else if (t.icon === 'snowman') {
      const sm = snowman();
      sm.position.copy(local(0, 0));
      icon.add(sm);
      const kids: Actor[] = [];
      for (const [dx, dy, ry] of [[1.6, 0.4, -1.2], [-1.4, 0.8, 1.0]] as const) {
        const kid = this.assets.actor('kid', 1.1);
        kid.root.position.copy(local(dx, dy));
        kid.root.rotation.y = ry;
        kid.play('idle');
        icon.add(kid.root);
        kids.push(kid); actors.push(kid);
      }
      for (let i = 0; i < 4; i++) {
        const hs = this.assets.prop('stone-house', 1.3);
        hs.position.copy(local(-3.5 + i * 2.2, -2.8 - (i % 2)));
        hs.rotation.y = R() * 0.5;
        icon.add(hs);
      }
      update = (frac, met) => {
        sm.scale.setScalar(0.2 + 0.8 * Math.min(1, frac));
        sm.visible = frac > 0.02;
        for (const k of kids) k.play(met ? 'cheer' : 'idle');
      };
    } else if (t.icon === 'kinneret') {
      const post = new THREE.Group();
      const H = 6;
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, H, 20, 1, true), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
      tube.position.y = H / 2;
      const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1, 20), std('#2aa7e0', { emissive: '#0b5c8a', emissiveIntensity: 0.4 }));
      const red = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 6, 24), std('#ff3b30', { emissive: '#ff3b30', emissiveIntensity: 0.6 }));
      red.rotation.x = Math.PI / 2;
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), std('#ffffff'));
      cap.position.y = H;
      post.add(tube, fill, red, cap);
      // stand the gauge on the north shore
      const sx = PLACES.kinneret.x - 1, sy = PLACES.kinneret.y + 8;
      post.position.set(sx - z0.x, Math.max(0, surfaceY(sx, sy)) - gy, -(sy - z0.y));
      icon.add(post);
      const need = t.need, rl = t.redLine ?? 0;
      red.position.y = (rl / (need * 1.15)) * H;
      update = (frac) => {
        const h = Math.max(0.05, Math.min(1.15, frac) / 1.15) * H;
        fill.scale.y = h;
        fill.position.y = h / 2;
      };
    } else if (t.icon === 'lifeguard') {
      const tower = this.assets.prop('lifeguard-tower', 2.4);
      tower.position.copy(local(0, 0));
      tower.rotation.y = -Math.PI / 2;
      icon.add(tower);
      const umbrellas = [0xff5a4e, 0xffc93c, 0x35d0ff].map((c, i) => {
        const u = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.35, 10), std(c));
        u.position.copy(local(1.5 + i * 0.9, -1.5 + i * 1.2)).add(new THREE.Vector3(0, 1.0, 0));
        icon.add(u);
        return u;
      });
      update = (frac) => { for (const u of umbrellas) u.rotation.y += 0.002 + frac * 0.0; };
    } else if (t.icon === 'forest') {
      for (let i = 0; i < 14; i++) {
        const tr = this.tree(i % 3 === 0 ? 'olive' : 'cypress', 1.2 + R() * 1.0);
        tr.position.copy(local((R() - 0.5) * 7, (R() - 0.5) * 7));
        icon.add(tr);
      }
      update = () => {};
    } else if (t.icon === 'city') {
      for (let i = 0; i < 6; i++) {
        const hs = this.assets.prop('stone-house', 1.2 + R() * 0.6);
        hs.position.copy(local((R() - 0.5) * 6, (R() - 0.5) * 5));
        hs.rotation.y = R() * Math.PI;
        icon.add(hs);
      }
    } else if (t.icon === 'aquifer') {
      for (let i = 0; i < 10; i++) {
        const tr = this.tree('olive', 0.9 + R() * 0.5);
        tr.position.copy(local((R() - 0.5) * 8, (R() - 0.5) * 8));
        icon.add(tr);
      }
      const well = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.6, 14), std('#d8c9a6'));
      well.position.copy(local(0, 0)).add(new THREE.Vector3(0, 0.3, 0));
      const water = new THREE.Mesh(new THREE.CircleGeometry(0.5, 14), std('#2aa7e0', { emissive: '#1a6fa0', emissiveIntensity: 0.3 }));
      water.rotation.x = -Math.PI / 2;
      water.position.copy(well.position).add(new THREE.Vector3(0, 0.31, 0));
      icon.add(well, water);
      update = (frac) => { water.visible = frac > 0.05; };
    } else if (t.icon === 'bloom') {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), std('#7a5a3a'));
      post.position.copy(local(0, 0)).add(new THREE.Vector3(0, 0.8, 0));
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.08), std('#f6d77a'));
      board.position.copy(post.position).add(new THREE.Vector3(0, 0.7, 0));
      icon.add(post, board);
      const flowers = new THREE.Group();
      for (let i = 0; i < 18; i++) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 4), std(['#ff5a8a', '#ffc93c', '#c78bff'][i % 3]));
        f.position.copy(local((R() - 0.5) * 4, (R() - 0.5) * 4)).add(new THREE.Vector3(0, 0.12, 0));
        flowers.add(f);
      }
      icon.add(flowers);
      update = (frac) => { flowers.visible = frac > 0.3; };
    }
    const anchor = new THREE.Vector3(z0.x, gy + (t.icon === 'kinneret' ? 7.5 : 3.6), -z0.y);
    const view: TargetView = {
      t, rings, discs, icon, anchor, actors,
      update: (frac, met, over, dt, time) => {
        const c = over ? '#ff5a4e' : met ? '#5dff8a' : t.optional ? '#c78bff' : '#ffd84a';
        for (const r of rings) (r.material as THREE.MeshBasicMaterial).color.set(c);
        for (const d of discs) (d.material as THREE.MeshBasicMaterial).color.set(c);
        update(frac, met, over, dt, time);
      },
    };
    this.actors.push(...actors);
    return view;
  }

  private tree(kind: 'olive' | 'cypress', h: number): THREE.Object3D {
    const c = this.assets.clone(kind);
    if (c) {
      const g = new THREE.Group();
      g.add(c);
      c.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(c);
      c.scale.multiplyScalar(h / Math.max(0.01, box.max.y - box.min.y));
      return g;
    }
    const t = new THREE.Mesh(kind === 'cypress' ? new THREE.ConeGeometry(h * 0.18, h, 7) : new THREE.IcosahedronGeometry(h * 0.4, 0), std(kind === 'cypress' ? '#2f6b34' : '#7c9a52', { flatShading: true }));
    t.position.y = h / 2;
    t.castShadow = true;
    const g = new THREE.Group();
    g.add(t);
    return g;
  }

  private buildWadi(w: Wadi) {
    const ribbon = drapedDisc(w.zone, '#8a5a32', 0.0, 0.14);
    this.level.add(ribbon);
    this.level.add(drapedRing(w.zone, 0.35, '#b5462a', 0.16));
    let jeep: THREE.Object3D | null = null;
    if (w.jeep) {
      jeep = this.assets.prop('jeep', 1.8);
      jeep.position.set(w.zone.x + 1, Math.max(0, surfaceY(w.zone.x + 1, w.zone.y)), -w.zone.y);
      jeep.rotation.y = 0.8;
      this.level.add(jeep);
    }
    this.wadis.push({ w, ribbon, jeep, flood: 0 });
  }

  /** Muddy water spreads in a wadi as its load nears the flood threshold; a flood carries the jeep off. */
  updateWadis(load: Record<string, number>, flooded: string[], dt: number) {
    for (const v of this.wadis) {
      const f = THREE.MathUtils.clamp((load[v.w.id] ?? 0) / v.w.threshold, 0, 1);
      (v.ribbon.material as THREE.MeshBasicMaterial).opacity = f * 0.55 + (flooded.includes(v.w.id) ? 0.25 : 0);
      if (flooded.includes(v.w.id) && v.jeep) {
        v.flood += dt;
        v.jeep.position.x += dt * 1.4;
        v.jeep.position.z += dt * 0.6;
        v.jeep.rotation.y += dt * 1.2;
        v.jeep.rotation.z = Math.sin(v.flood * 4) * 0.25;
      }
    }
  }

  update(dt: number, time: number, camera?: THREE.Camera) {
    this.time = time;
    if (camera) {
      const q = new THREE.Quaternion();
      for (const t of [...this.fixedTokens, ...this.slots.map((x) => x.token).filter((x): x is THREE.Group => !!x)]) {
        // face the camera: undo the parent's (identity) rotation and copy the camera's
        q.copy(camera.quaternion);
        (t.userData.holder as THREE.Object3D).quaternion.copy(q);
        // never let a coin block the chase camera's view of the cloud
        t.visible = t.position.distanceTo(camera.position) > 40;
      }
    }
    for (const a of this.actors) a.update(dt);
    for (const b of this.boats) { b.position.y = 0.05 + Math.sin(time * 1.5 + b.userData.bob) * 0.05; b.rotation.z = Math.sin(time + b.userData.bob) * 0.05; }
    for (const s of this.slots) {
      if (s.token) {
        const k = Math.min(1, s.token.scale.x + dt * 5);
        s.token.scale.setScalar(k);
      }
      (s.pillar.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(time * 3) * 0.12;
    }
    for (const h of this.haze) h.rotation.y += dt * 0.05;
  }
}

function snowman(): THREE.Group {
  const g = new THREE.Group();
  const white = std('#ffffff', { roughness: 0.7 });
  const parts: [number, number][] = [[0.55, 0.5], [0.4, 1.25], [0.28, 1.8]];
  for (const [r, y] of parts) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), white);
    b.position.y = y;
    b.castShadow = true;
    g.add(b);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 8), std('#ff7a1a'));
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 1.82, 0.32);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.28, 12), std('#c0392b'));
  hat.position.y = 2.1;
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 6, 16), std('#2f7ff0'));
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 1.55;
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), std('#111'));
    eye.position.set(s * 0.1, 1.9, 0.25);
    g.add(eye);
  }
  g.add(nose, hat, scarf);
  return g;
}

let fTex: THREE.Texture | null = null;
function flameTex() {
  if (fTex) return fTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,220,1)');
  grd.addColorStop(0.4, 'rgba(255,200,120,0.7)');
  grd.addColorStop(1, 'rgba(255,120,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  fTex = new THREE.CanvasTexture(c);
  return fTex;
}
