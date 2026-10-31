// Weather effects: rain streaks, snowflakes, vapour rising off the sea, wisps lost to dry air,
// wind streaks that ride the simulated wind field, tutorial wind arrows, and lightning bolts.
import * as THREE from 'three';
import { windAt, type PressureCell, type PrecipKind } from '../rules/atmosphere.ts';
import { surfaceY } from './terrain.ts';

const RAIN_N = 2400;
const SNOW_N = 1400;
const MIST_N = 260;
const STREAK_N = 170;

function rand(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

export class Fx {
  group = new THREE.Group();
  private rnd = rand(7);

  private rainPos = new Float32Array(RAIN_N * 6);
  private rainVel = new Float32Array(RAIN_N);
  private rainAlive = new Uint8Array(RAIN_N);
  private rainGeo = new THREE.BufferGeometry();
  private rainMat = new THREE.LineBasicMaterial({ color: '#dcecff', transparent: true, opacity: 0.85 });
  private rainNext = 0;

  private snowPos = new Float32Array(SNOW_N * 3);
  private snowAlive = new Uint8Array(SNOW_N);
  private snowGeo = new THREE.BufferGeometry();
  private snowNext = 0;

  private mistPos = new Float32Array(MIST_N * 3);
  private mistVel = new Float32Array(MIST_N * 3);
  private mistLife = new Float32Array(MIST_N);
  private mistCol = new Float32Array(MIST_N * 3);
  private mistGeo = new THREE.BufferGeometry();
  private mistNext = 0;

  private streakPos = new Float32Array(STREAK_N * 6);
  private streakXY = new Float32Array(STREAK_N * 3); // x, y (km), life
  private streakGeo = new THREE.BufferGeometry();
  private streakMat = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55 });

  private arrows: THREE.InstancedMesh;
  private bolt: THREE.Line;
  private boltT = 0;

  constructor() {
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPos, 3));
    const rain = new THREE.LineSegments(this.rainGeo, this.rainMat);
    rain.frustumCulled = false;

    this.snowGeo.setAttribute('position', new THREE.BufferAttribute(this.snowPos, 3));
    const snow = new THREE.Points(this.snowGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 0.32, transparent: true, opacity: 0.95, depthWrite: false, map: dotTexture() }));
    snow.frustumCulled = false;

    this.mistGeo.setAttribute('position', new THREE.BufferAttribute(this.mistPos, 3));
    this.mistGeo.setAttribute('color', new THREE.BufferAttribute(this.mistCol, 3));
    const mist = new THREE.Points(this.mistGeo, new THREE.PointsMaterial({ size: 1.1, vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false, map: dotTexture() }));
    mist.frustumCulled = false;

    this.streakGeo.setAttribute('position', new THREE.BufferAttribute(this.streakPos, 3));
    const streaks = new THREE.LineSegments(this.streakGeo, this.streakMat);
    streaks.frustumCulled = false;

    // a flat arrow lying on the ground, pointing along +Z
    const shape = new THREE.Shape();
    shape.moveTo(-0.22, -1); shape.lineTo(0.22, -1); shape.lineTo(0.22, 0.25); shape.lineTo(0.62, 0.25);
    shape.lineTo(0, 1.1); shape.lineTo(-0.62, 0.25); shape.lineTo(-0.22, 0.25); shape.closePath();
    const arrowGeo = new THREE.ShapeGeometry(shape);
    arrowGeo.rotateX(Math.PI / 2);
    this.arrows = new THREE.InstancedMesh(arrowGeo, new THREE.MeshBasicMaterial({ color: '#eaf6ff', transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }), 140);
    this.arrows.renderOrder = 5;
    this.arrows.count = 0;
    this.arrows.frustumCulled = false;

    this.bolt = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 3), 3)),
      new THREE.LineBasicMaterial({ color: '#f4f0ff', transparent: true, opacity: 0 }));
    this.bolt.frustumCulled = false;

    this.group.add(rain, snow, mist, streaks, this.arrows, this.bolt);
    this.clear();
  }

  clear() {
    this.rainAlive.fill(0);
    this.rainPos.fill(-999);
    this.snowAlive.fill(0);
    this.snowPos.fill(-999);
    this.mistLife.fill(0);
    this.mistPos.fill(-999);
    this.streakXY.fill(0);
    this.streakPos.fill(-999);
    this.arrows.count = 0;
    for (const g of [this.rainGeo, this.snowGeo, this.mistGeo, this.streakGeo]) g.attributes.position.needsUpdate = true;
  }

  /** Emit precipitation under a cloud at world position `at` with radius r (world units). */
  precip(dt: number, at: THREE.Vector3, r: number, kind: PrecipKind, rate: number) {
    const R = this.rnd;
    if (kind !== 'snow') {
      const n = Math.round(rate * dt * 2600);
      this.rainMat.color.set(kind === 'slush' ? '#e6eef8' : '#cfe6ff');
      for (let k = 0; k < n; k++) {
        const i = this.rainNext = (this.rainNext + 1) % RAIN_N;
        const a = R() * Math.PI * 2, d = Math.sqrt(R()) * r;
        const x = at.x + Math.cos(a) * d, z = at.z + Math.sin(a) * d, y = at.y - 0.6 - R() * 0.8;
        this.rainPos.set([x, y, z, x - 0.05, y - 0.7, z], i * 6);
        this.rainVel[i] = 9 + R() * 4;
        this.rainAlive[i] = 1;
      }
    }
    if (kind !== 'rain') {
      const n = Math.round(rate * dt * (kind === 'snow' ? 750 : 240));
      for (let k = 0; k < n; k++) {
        const i = this.snowNext = (this.snowNext + 1) % SNOW_N;
        const a = R() * Math.PI * 2, d = Math.sqrt(R()) * r;
        this.snowPos.set([at.x + Math.cos(a) * d, at.y - 0.6 - R() * 0.6, at.z + Math.sin(a) * d], i * 3);
        this.snowAlive[i] = 1;
      }
    }
  }

  /** Vapour rising into the cloud (gain) or wisps leaving it (loss). */
  mist(dt: number, cloud: THREE.Vector3, r: number, mode: 'gain' | 'loss' | 'khamsin', seaY: number, rate: number) {
    const R = this.rnd;
    const n = Math.round(rate * dt * 60);
    for (let k = 0; k < n; k++) {
      const i = this.mistNext = (this.mistNext + 1) % MIST_N;
      const a = R() * Math.PI * 2;
      if (mode === 'gain') {
        const d = r * (0.8 + R() * 1.4);
        this.mistPos.set([cloud.x + Math.cos(a) * d, seaY + 0.1, cloud.z + Math.sin(a) * d], i * 3);
        const ty = (cloud.y - seaY) / 1.6;
        this.mistVel.set([-Math.cos(a) * d / 1.6, ty, -Math.sin(a) * d / 1.6], i * 3);
        this.mistCol.set([0.55, 0.8, 1.0], i * 3);
      } else {
        const d = r * 0.8;
        this.mistPos.set([cloud.x + Math.cos(a) * d, cloud.y + (R() - 0.5) * r * 0.6, cloud.z + Math.sin(a) * d], i * 3);
        this.mistVel.set([Math.cos(a) * 2.2, 0.4, Math.sin(a) * 2.2], i * 3);
        if (mode === 'khamsin') this.mistCol.set([0.9, 0.55, 0.25], i * 3);
        else this.mistCol.set([0.75, 0.78, 0.85], i * 3);
      }
      this.mistLife[i] = 1.6;
    }
  }

  lightning(from: THREE.Vector3, groundY: number) {
    const R = this.rnd;
    const arr = this.bolt.geometry.attributes.position.array as Float32Array;
    const n = arr.length / 3;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const j = i === 0 || i === n - 1 ? 0 : 1;
      arr[i * 3] = from.x + (R() - 0.5) * 1.6 * j;
      arr[i * 3 + 1] = from.y + (groundY - from.y) * f;
      arr[i * 3 + 2] = from.z + (R() - 0.5) * 1.6 * j;
    }
    this.bolt.geometry.attributes.position.needsUpdate = true;
    this.boltT = 0.35;
  }

  /** Tutorial wind arrows on a grid around a point (levels 1–2 only). */
  setArrows(cells: readonly PressureCell[] | null, cx: number, cy: number, liftY: number) {
    if (!cells) { this.arrows.count = 0; return; }
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const up = new THREE.Vector3(0, 0, 1);
    let k = 0;
    const step = 14;
    const gx = Math.round(cx / step) * step, gy = Math.round(cy / step) * step;
    for (let j = -4; j <= 4; j++) {
      for (let i = -5; i <= 6; i++) {
        const x = gx + i * step, y = gy + j * step;
        if (x < 2 || y < 2 || x > 188 || y > 454) continue;
        const w = windAt(cells, x, y);
        const sp = Math.hypot(w.u, w.v);
        if (sp < 0.15) continue;
        q.setFromUnitVectors(up, new THREE.Vector3(w.u / sp, 0, -w.v / sp));
        const sc = 0.9 + Math.min(1.4, sp * 0.45);
        s.set(sc, sc, sc);
        p.set(x, surfaceY(x, y) + liftY, -y);
        m.compose(p, q, s);
        this.arrows.setMatrixAt(k++, m);
        if (k >= 140) break;
      }
    }
    this.arrows.count = k;
    this.arrows.instanceMatrix.needsUpdate = true;
  }

  update(dt: number, cells: readonly PressureCell[] | null, focus: { x: number; y: number }, streakY: number) {
    // rain
    for (let i = 0; i < RAIN_N; i++) {
      if (!this.rainAlive[i]) continue;
      const o = i * 6;
      const v = this.rainVel[i] * dt;
      this.rainPos[o + 1] -= v; this.rainPos[o + 4] -= v;
      if (this.rainPos[o + 4] < surfaceY(this.rainPos[o], -this.rainPos[o + 2])) { this.rainAlive[i] = 0; this.rainPos[o + 1] = this.rainPos[o + 4] = -999; }
    }
    this.rainGeo.attributes.position.needsUpdate = true;
    // snow
    for (let i = 0; i < SNOW_N; i++) {
      if (!this.snowAlive[i]) continue;
      const o = i * 3;
      this.snowPos[o + 1] -= 1.1 * dt;
      this.snowPos[o] += Math.sin(this.snowPos[o + 1] * 3 + i) * 0.6 * dt;
      if (this.snowPos[o + 1] < surfaceY(this.snowPos[o], -this.snowPos[o + 2])) { this.snowAlive[i] = 0; this.snowPos[o + 1] = -999; }
    }
    this.snowGeo.attributes.position.needsUpdate = true;
    // mist
    for (let i = 0; i < MIST_N; i++) {
      if (this.mistLife[i] <= 0) continue;
      this.mistLife[i] -= dt;
      const o = i * 3;
      for (let a = 0; a < 3; a++) this.mistPos[o + a] += this.mistVel[o + a] * dt;
      if (this.mistLife[i] <= 0) this.mistPos[o + 1] = -999;
    }
    this.mistGeo.attributes.position.needsUpdate = true;
    // wind streaks ride the simulated wind
    if (cells) {
      const R = this.rnd;
      for (let i = 0; i < STREAK_N; i++) {
        const o = i * 3;
        let life = this.streakXY[o + 2] - dt;
        let x = this.streakXY[o], y = this.streakXY[o + 1];
        if (life <= 0 || Math.abs(x - focus.x) > 60 || Math.abs(y - focus.y) > 60) {
          x = focus.x + (R() - 0.5) * 100; y = focus.y + (R() - 0.5) * 100; life = 1 + R() * 2.5;
        }
        const w = windAt(cells, x, y);
        const nx = x + w.u * dt * 4, ny = y + w.v * dt * 4;
        this.streakXY.set([nx, ny, life], o);
        const sp = Math.hypot(w.u, w.v);
        const len = sp < 0.2 ? 0 : 1.2 + sp * 0.8;
        const hy = Math.max(surfaceY(nx, ny), 0) + streakY + Math.sin(i) * 0.6;
        this.streakPos.set([nx, hy, -ny, nx - (w.u / (sp || 1)) * len, hy, -(ny - (w.v / (sp || 1)) * len)], i * 6);
      }
      this.streakGeo.attributes.position.needsUpdate = true;
    }
    this.boltT = Math.max(0, this.boltT - dt);
    (this.bolt.material as THREE.LineBasicMaterial).opacity = this.boltT > 0 ? (Math.sin(this.boltT * 60) > -0.3 ? 1 : 0.2) : 0;
  }

  set streaksVisible(v: boolean) { this.streakMat.opacity = v ? 0.55 : 0; }
}

let dotTex: THREE.Texture | null = null;
function dotTexture(): THREE.Texture {
  if (dotTex) return dotTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0.6)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  dotTex = new THREE.CanvasTexture(c);
  return dotTex;
}
