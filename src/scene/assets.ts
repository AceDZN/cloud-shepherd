// Loads the Tripo GLBs (public/models) and hands out normalized clones.
// Every model has a procedural stand-in so the game still runs if a file is missing.
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export type ModelName = 'anani' | 'farmer' | 'kid' | 'jeep' | 'boat' | 'lifeguard-tower' | 'stone-house' | 'olive' | 'cypress';
const NAMES: ModelName[] = ['anani', 'farmer', 'kid', 'jeep', 'boat', 'lifeguard-tower', 'stone-house', 'olive', 'cypress'];

interface LoadedModel { scene: THREE.Object3D; clips: THREE.AnimationClip[] }

export function std(color: THREE.ColorRepresentation, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
}

/** Scale so the bounding-box height is h (or longest horizontal side is len), sit on y = 0, center in xz. */
export function normalize(obj: THREE.Object3D, opts: { height?: number; length?: number }): THREE.Group {
  const wrap = new THREE.Group();
  wrap.add(obj);
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  let s = 1;
  if (opts.height) s = opts.height / Math.max(1e-6, size.y);
  else if (opts.length) s = opts.length / Math.max(1e-6, Math.max(size.x, size.z));
  obj.scale.multiplyScalar(s);
  obj.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(obj);
  const c = b2.getCenter(new THREE.Vector3());
  obj.position.x -= c.x;
  obj.position.z -= c.z;
  obj.position.y -= b2.min.y;
  return wrap;
}

/** A character with its own mixer and named actions. */
export class Actor {
  mixer: THREE.AnimationMixer;
  private actions = new Map<string, THREE.AnimationAction>();
  current = '';
  constructor(public root: THREE.Object3D, clips: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(root);
    for (const c of clips) this.actions.set(c.name, this.mixer.clipAction(c));
  }
  play(name: string, once = false) {
    const key = [...this.actions.keys()].find((k) => k === name || k.startsWith(name)) ?? '';
    if (!key || key === this.current) return;
    const next = this.actions.get(key)!;
    next.reset();
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = once;
    next.fadeIn(0.25).play();
    const prev = this.actions.get(this.current);
    prev?.fadeOut(0.25);
    this.current = key;
  }
  update(dt: number) { this.mixer.update(dt); }
}

export class Assets {
  private models = new Map<ModelName, LoadedModel>();
  loaded: ModelName[] = [];
  missing: ModelName[] = [];

  async load(base = './models/', onProgress?: (f: number) => void): Promise<void> {
    const loader = new GLTFLoader();
    let done = 0;
    await Promise.all(
      NAMES.map(async (n) => {
        try {
          const g: GLTF = await loader.loadAsync(`${base}${n}.glb`);
          g.scene.traverse((o) => {
            const m = o as THREE.Mesh;
            if (m.isMesh) {
              m.castShadow = true;
              m.receiveShadow = n !== 'anani';
              const mat = m.material as THREE.MeshStandardMaterial;
              if (mat && 'roughness' in mat) mat.roughness = Math.max(0.5, mat.roughness ?? 0.8);
            }
          });
          this.models.set(n, { scene: g.scene, clips: g.animations });
          this.loaded.push(n);
        } catch {
          this.missing.push(n);
        } finally {
          onProgress?.(++done / NAMES.length);
        }
      }),
    );
  }

  has(n: ModelName) { return this.models.has(n); }

  clone(n: ModelName): THREE.Object3D | null {
    const m = this.models.get(n);
    if (!m) return null;
    return m.clips.length ? SkeletonUtils.clone(m.scene) : m.scene.clone(true);
  }

  /** A rigged character (farmer / kid) with its clips, or a simple stand-in. */
  actor(n: 'farmer' | 'kid', height: number): Actor {
    const c = this.clone(n);
    if (c) return new Actor(normalize(c, { height }), this.models.get(n)!.clips);
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(height * 0.16, height * 0.45, 4, 8), std(n === 'kid' ? '#ff7a1a' : '#4f7f3a'));
    body.position.y = height * 0.4;
    const head = new THREE.Mesh(new THREE.SphereGeometry(height * 0.13, 12, 8), std('#f2c9a0'));
    head.position.y = height * 0.85;
    g.add(body, head);
    return new Actor(g, []);
  }

  /** The cloud's face core. Pivot at its centre, ~size units across. */
  anani(size: number): THREE.Object3D {
    const c = this.clone('anani');
    if (c) {
      const w = normalize(c, { height: size });
      w.children[0].position.y -= size / 2;
      w.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          const mat = (m.material as THREE.MeshStandardMaterial).clone();
          mat.roughness = 0.75;
          m.material = mat;
        }
      });
      return w;
    }
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(size / 2, 24, 16), std('#ffffff')));
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(size * 0.07, 10, 8), std('#1a2440'));
      eye.position.set(s * size * 0.15, size * 0.06, size * 0.45);
      g.add(eye);
    }
    return g;
  }

  prop(n: 'jeep' | 'boat' | 'lifeguard-tower' | 'stone-house', size: number): THREE.Object3D {
    const c = this.clone(n);
    if (c) return n === 'jeep' || n === 'boat' ? normalize(c, { length: size }) : normalize(c, { height: size });
    const g = new THREE.Group();
    const colors: Record<string, string> = { jeep: '#d9a53a', boat: '#f2f2f2', 'lifeguard-tower': '#f04e3e', 'stone-house': '#efe3c4' };
    const box = new THREE.Mesh(new THREE.BoxGeometry(size * 0.6, size * 0.6, size), std(colors[n]));
    box.position.y = size * 0.3;
    g.add(box);
    return g;
  }

  /** Raw geometry+material pairs of a static model, for instancing (trees). */
  parts(n: 'olive' | 'cypress' | 'stone-house', height: number): { geo: THREE.BufferGeometry; mat: THREE.Material }[] {
    const c = this.clone(n);
    if (!c) {
      const geo = n === 'cypress' ? new THREE.ConeGeometry(height * 0.18, height, 7) : new THREE.IcosahedronGeometry(height * 0.45, 0);
      geo.translate(0, height * 0.5, 0);
      return [{ geo, mat: std(n === 'cypress' ? '#2f6b34' : n === 'olive' ? '#7c9a52' : '#efe3c4', { flatShading: true }) }];
    }
    const w = normalize(c, { height });
    w.updateMatrixWorld(true);
    const out: { geo: THREE.BufferGeometry; mat: THREE.Material }[] = [];
    w.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const geo = m.geometry.clone().applyMatrix4(m.matrixWorld);
      out.push({ geo, mat: m.material as THREE.Material });
    });
    return out;
  }
}
