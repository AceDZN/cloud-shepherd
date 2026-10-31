// The relief diorama of Israel: NOAA ETOPO1 heights (vertical exaggeration EXAG), climate-tinted
// vertex colours, earthy cut sides, a glittering sea and the two lakes. Rain and snow repaint it.
import * as THREE from 'three';
import {
  DEAD_SEA_LEVEL, KINNERET_LEVEL, MAP_H_KM, MAP_W_KM, PLACES, groundHeight, rawElevation, toLonLat, waterAt,
} from '../rules/geo.ts';
import type { PrecipKind } from '../rules/atmosphere.ts';
import { EXAG, toWorldY } from './world.ts';

const STEP_KM = 0.8;
const BASE_Y = -5;

/** Height of the drawn surface (world Y) at map km. */
export function surfaceY(x: number, y: number): number {
  const w = waterAt(x, y);
  if (w === 'sea') return Math.max(-0.5, rawElevation(x, y) * 0.0012);
  if (w === 'kinneret') return toWorldY(KINNERET_LEVEL) - 0.25;
  if (w === 'deadsea') return toWorldY(DEAD_SEA_LEVEL) - 0.25;
  return toWorldY(rawElevation(x, y));
}

/** Rough "how Mediterranean" a spot is (0 desert … 1 green), for colouring only. */
function wetness(x: number, y: number, h: number): number {
  const { lon, lat } = toLonLat(x, y);
  let w = THREE.MathUtils.clamp((lat - 30.85) / 1.5, 0, 1);
  // east of the mountain ridge the rain shadow dries the land quickly
  const ridge = lat > 32.6 ? 35.55 : 35.23 - (32.6 - lat) * 0.04;
  if (lon > ridge && lat < 32.65) w *= THREE.MathUtils.clamp(1 - (lon - ridge) / 0.18, 0, 1);
  if (h < -150 && lat < 32.6) w *= 0.25;
  if (lon > 35.62 && lat > 32.65) w = Math.max(w, 0.75); // Golan
  if (lon > 35.75 && lat < 32.6) w = Math.min(w, 0.35); // Gilead edge, keep tidy
  return w;
}

const C = {
  sand: new THREE.Color('#e9cf8c'),
  desert: new THREE.Color('#d6ad6c'),
  desertDark: new THREE.Color('#b9874e'),
  steppe: new THREE.Color('#c7b56c'),
  green: new THREE.Color('#79a94a'),
  forest: new THREE.Color('#4d8a3a'),
  rock: new THREE.Color('#a8957b'),
  stone: new THREE.Color('#e3d6b8'),
  snow: new THREE.Color('#f7fbff'),
  seabed: new THREE.Color('#3aa7b8'),
  lush: new THREE.Color('#3fcf3a'),
  white: new THREE.Color('#ffffff'),
  mud: new THREE.Color('#7a5a3a'),
};

export class Terrain {
  group = new THREE.Group();
  mesh: THREE.Mesh;
  private nx: number;
  private ny: number;
  private base: Float32Array;
  private colors: THREE.BufferAttribute;
  private wet: Float32Array;
  private snow: Float32Array;
  private dirty = false;
  private dirtyT = 0;
  private waterMats: THREE.ShaderMaterial[] = [];

  constructor() {
    this.nx = Math.floor(MAP_W_KM / STEP_KM) + 1;
    this.ny = Math.floor(MAP_H_KM / STEP_KM) + 1;
    const n = this.nx * this.ny;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    this.base = new Float32Array(n * 3);
    this.wet = new Float32Array(n);
    this.snow = new Float32Array(n);
    const tmp = new THREE.Color();
    for (let j = 0; j < this.ny; j++) {
      for (let i = 0; i < this.nx; i++) {
        const k = j * this.nx + i;
        const x = Math.min(MAP_W_KM, i * STEP_KM), y = Math.min(MAP_H_KM, j * STEP_KM);
        const Y = surfaceY(x, y);
        pos[k * 3] = x; pos[k * 3 + 1] = Y; pos[k * 3 + 2] = -y;
        this.baseColor(x, y, tmp);
        tmp.toArray(col, k * 3);
      }
    }
    this.base.set(col);
    const idx: number[] = [];
    for (let j = 0; j < this.ny - 1; j++) {
      for (let i = 0; i < this.nx - 1; i++) {
        const a = j * this.nx + i, b = a + 1, c = a + this.nx, d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.colors = new THREE.BufferAttribute(col, 3);
    geo.setAttribute('color', this.colors);
    geo.setIndex(idx);
    geo.computeVertexNormals();
    this.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0 }));
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.group.add(this.mesh);
    this.buildSides();
    this.buildWater();
  }

  private baseColor(x: number, y: number, out: THREE.Color) {
    const w = waterAt(x, y);
    const h = rawElevation(x, y);
    if (w === 'sea') { out.copy(C.seabed); return; }
    if (w !== 'land') { out.copy(C.seabed); return; }
    const wet = wetness(x, y, h);
    // slope steepness from neighbours
    const s = Math.abs(rawElevation(x + 1, y) - rawElevation(x - 1, y)) + Math.abs(rawElevation(x, y + 1) - rawElevation(x, y - 1));
    if (wet > 0.55) out.copy(C.green).lerp(C.forest, THREE.MathUtils.clamp((h - 250) / 600, 0, 1) * 0.8);
    else if (wet > 0.3) out.copy(C.steppe).lerp(C.green, (wet - 0.3) / 0.25);
    else out.copy(C.desert).lerp(C.desertDark, THREE.MathUtils.clamp((h - 300) / 700, 0, 1)).lerp(C.steppe, wet / 0.3 * 0.6);
    out.lerp(C.rock, THREE.MathUtils.clamp((s - 250) / 500, 0, 0.6));
    // yellow kurkar coast and dunes
    const nearSea = waterAt(x - 2.5, y) === 'sea' || waterAt(x - 1.2, y) === 'sea';
    if (nearSea && h < 60) out.lerp(C.sand, 0.85);
    // stone-coloured Jerusalem
    const J = PLACES.jerusalem;
    const dj = Math.hypot(x - J.x, y - J.y);
    if (dj < 6) out.lerp(C.stone, (1 - dj / 6) * 0.7);
    if (h > 1850) out.lerp(C.snow, THREE.MathUtils.clamp((h - 1850) / 350, 0, 1));
    const n = Math.sin(x * 1.7 + y * 0.9) * Math.sin(x * 0.6 - y * 1.3) * 0.04;
    out.offsetHSL(0, 0, n);
  }

  private buildSides() {
    const strata = [new THREE.Color('#a7794a'), new THREE.Color('#8b5e38'), new THREE.Color('#c39a62'), new THREE.Color('#6f4a2c')];
    const pos: number[] = [], col: number[] = [], idx: number[] = [];
    const edge = (pts: [number, number][]) => {
      const start = pos.length / 3;
      const rows = 6;
      for (const [x, y] of pts) {
        const top = surfaceY(x, y);
        for (let r = 0; r <= rows; r++) {
          const Y = top + (BASE_Y - top) * (r / rows);
          pos.push(x, Y, -y);
          const band = strata[Math.floor(((Y - BASE_Y) * 1.3 + x * 0.01) % strata.length + strata.length) % strata.length];
          col.push(band.r, band.g, band.b);
        }
      }
      for (let i = 0; i < pts.length - 1; i++) {
        for (let r = 0; r < rows; r++) {
          const a = start + i * (rows + 1) + r, b = a + 1, c = a + rows + 1, d = c + 1;
          idx.push(a, c, b, b, c, d);
        }
      }
    };
    const W = MAP_W_KM, H = MAP_H_KM;
    const line = (x0: number, y0: number, x1: number, y1: number) => {
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / STEP_KM);
      return Array.from({ length: n + 1 }, (_, i) => [x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n] as [number, number]);
    };
    edge(line(0, 0, W, 0));
    edge(line(W, 0, W, H));
    edge(line(W, H, 0, H));
    edge(line(0, H, 0, 0));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }));
    m.receiveShadow = true;
    this.group.add(m);
    const bottom = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ color: '#5a3c24' }));
    bottom.rotation.x = Math.PI / 2;
    bottom.position.set(W / 2, BASE_Y, -H / 2);
    this.group.add(bottom);
  }

  private buildWater() {
    const tw = 256, th = 512;
    const data = new Uint8Array(tw * th * 4);
    for (let j = 0; j < th; j++) {
      for (let i = 0; i < tw; i++) {
        const x = ((i + 0.5) / tw) * MAP_W_KM, y = ((j + 0.5) / th) * MAP_H_KM;
        const w = waterAt(x, y);
        const k = (j * tw + i) * 4;
        data[k] = w === 'sea' ? 255 : 0;
        data[k + 1] = w === 'kinneret' ? 255 : 0;
        data[k + 2] = w === 'deadsea' ? 255 : 0;
        data[k + 3] = Math.round(THREE.MathUtils.clamp(-rawElevation(x, y) / 600, 0, 1) * 255);
      }
    }
    const mask = new THREE.DataTexture(data, tw, th, THREE.RGBAFormat);
    mask.magFilter = THREE.LinearFilter;
    mask.minFilter = THREE.LinearFilter;
    mask.needsUpdate = true;
    const make = (channel: number, level: number, deep: string, shallow: string, x0: number, y0: number, x1: number, y1: number) => {
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          mask: { value: mask }, channel: { value: channel }, time: { value: 0 },
          deep: { value: new THREE.Color(deep) }, shallow: { value: new THREE.Color(shallow) },
          mapSize: { value: new THREE.Vector2(MAP_W_KM, MAP_H_KM) },
          sunDir: { value: new THREE.Vector3(0.35, 0.4, -0.6).normalize() },
          night: { value: 0 }, fogColor: { value: new THREE.Color('#bfe0ff') }, fogNear: { value: 160 }, fogFar: { value: 520 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vW; varying float vFog;
          void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vFog = -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D mask; uniform int channel; uniform float time; uniform vec3 deep; uniform vec3 shallow;
          uniform vec2 mapSize; uniform vec3 sunDir; uniform float night; uniform vec3 fogColor; uniform float fogNear; uniform float fogFar;
          varying vec3 vW; varying float vFog;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          void main() {
            vec2 uv = vec2(vW.x / mapSize.x, -vW.z / mapSize.y);
            vec4 m = texture2D(mask, uv);
            float a = channel == 0 ? m.r : channel == 1 ? m.g : m.b;
            if (a < 0.35) discard;
            float depth = channel == 0 ? m.a : 0.5;
            vec3 c = mix(shallow, deep, smoothstep(0.0, 0.5, depth));
            float waves = sin(vW.x * 2.1 + time * 1.3) * sin(vW.z * 1.7 - time * 1.1);
            c += waves * 0.025;
            vec2 cell = floor(vW.xz * 3.0 + vec2(time * 0.7, time * 0.4));
            float g = step(0.985, hash(cell)) * (0.5 + 0.5 * sin(time * 6.0 + hash(cell + 3.1) * 30.0));
            vec3 viewDir = normalize(cameraPosition - vW);
            float spec = pow(max(dot(reflect(-sunDir, vec3(0.0, 1.0, 0.0)), viewDir), 0.0), 60.0);
            c += (g * 0.9 + spec * 0.8) * (1.0 - night * 0.7) * vec3(1.0, 0.97, 0.88);
            c *= 1.0 - night * 0.55;
            float edge = smoothstep(0.35, 0.6, a);
            float f = smoothstep(fogNear, fogFar, vFog);
            gl_FragColor = vec4(mix(c, fogColor, f), 0.88 * edge);
          }`,
      });
      this.waterMats.push(mat);
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), mat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set((x0 + x1) / 2, level, -(y0 + y1) / 2);
      plane.renderOrder = 2;
      this.group.add(plane);
    };
    make(0, 0.02, '#0f6fae', '#3fd1d6', 0, 0, MAP_W_KM, MAP_H_KM);
    const k = PLACES.kinneret;
    make(1, toWorldY(KINNERET_LEVEL) + 0.02, '#1677b8', '#43c7d4', k.x - 12, k.y - 16, k.x + 12, k.y + 16);
    make(2, toWorldY(DEAD_SEA_LEVEL) + 0.02, '#1d6f9a', '#7fd8d0', 125, 170, 165, 270);
  }

  setMood(night: number, fog: THREE.Fog) {
    for (const m of this.waterMats) {
      m.uniforms.night.value = night;
      (m.uniforms.fogColor.value as THREE.Color).copy(fog.color);
      m.uniforms.fogNear.value = fog.near;
      m.uniforms.fogFar.value = fog.far;
    }
  }

  /** Rain greens the land, snow whitens it, slush darkens it; all decay back slowly between levels. */
  precip(x: number, y: number, mm: number, kind: PrecipKind) {
    const r = 5;
    const i0 = Math.max(0, Math.floor((x - r) / STEP_KM)), i1 = Math.min(this.nx - 1, Math.ceil((x + r) / STEP_KM));
    const j0 = Math.max(0, Math.floor((y - r) / STEP_KM)), j1 = Math.min(this.ny - 1, Math.ceil((y + r) / STEP_KM));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const d = Math.hypot(i * STEP_KM - x, j * STEP_KM - y);
        if (d > r) continue;
        const k = j * this.nx + i;
        const f = (1 - d / r) * mm * 0.05;
        if (kind === 'snow') this.snow[k] = Math.min(1, this.snow[k] + f * 1.4);
        else this.wet[k] = Math.min(1, this.wet[k] + f);
      }
    }
    this.dirty = true;
  }

  reset() {
    this.wet.fill(0);
    this.snow.fill(0);
    (this.colors.array as Float32Array).set(this.base);
    this.colors.needsUpdate = true;
  }

  update(dt: number, time: number) {
    for (const m of this.waterMats) m.uniforms.time.value = time;
    this.dirtyT -= dt;
    if (!this.dirty || this.dirtyT > 0) return;
    this.dirty = false;
    this.dirtyT = 0.15;
    const arr = this.colors.array as Float32Array;
    const tmp = new THREE.Color();
    for (let k = 0; k < this.wet.length; k++) {
      if (this.wet[k] === 0 && this.snow[k] === 0) continue;
      tmp.fromArray(this.base, k * 3).lerp(C.lush, this.wet[k] * 0.9).lerp(C.white, this.snow[k] * 0.9);
      tmp.toArray(arr, k * 3);
    }
    this.colors.needsUpdate = true;
  }

  heightAt(x: number, y: number) {
    return surfaceY(x, y);
  }
}

export { groundHeight, EXAG };
