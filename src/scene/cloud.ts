// ענני on screen: the Tripo face core inside a cluster of soft puffs. Size follows the water it holds,
// colour turns slate as it saturates, it squashes when it pours and frays when dry air mixes in.
import * as THREE from 'three';
import type { Cloud } from '../rules/sim.ts';
import { MIX_RH } from '../rules/sim.ts';
import type { Assets } from './assets.ts';
import { toWorldY } from './world.ts';

const WHITE = new THREE.Color('#ffffff');
const SLATE = new THREE.Color('#3d465c');
const NIGHT = new THREE.Color('#9aa7c8');

/** Cloud display height above its simulated air parcel (world units), so it never clips hilltops. */
export const CLOUD_LIFT = 1.4;

export function cloudWorld(c: { x: number; y: number; z: number }, out = new THREE.Vector3()) {
  return out.set(c.x, toWorldY(c.z) + CLOUD_LIFT, -c.y);
}

interface Puff { mesh: THREE.Mesh; base: THREE.Vector3; r: number; phase: number }

export class CloudVisual {
  group = new THREE.Group();
  private body = new THREE.Group();
  private core: THREE.Object3D;
  private coreMats: THREE.MeshStandardMaterial[] = [];
  private puffs: Puff[] = [];
  private puffMat: THREE.MeshStandardMaterial;
  private rimColor = { value: new THREE.Color('#ffd9a0') };
  private rimPower = { value: 0.45 };
  private glow: THREE.PointLight;
  private shadowDisk: THREE.Mesh;
  private t = 0;
  private blinkT = 2;
  private squash = 0;
  scale = 1;
  /** yaw that points the face (+Z) where the game wants it, usually toward the camera */
  faceYaw = 0;
  /** set to 1 to light the cloud from inside (lightning) */
  flash = 0;

  constructor(assets: Assets) {
    this.group.add(this.body);
    this.core = assets.anani(3.0);
    this.core.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.castShadow = true; this.coreMats.push(m.material as THREE.MeshStandardMaterial); }
    });
    this.core.position.set(0, 0.05, 0.25);
    this.body.add(this.core);

    this.puffMat = new THREE.MeshStandardMaterial({ color: '#f7f9ff', roughness: 0.95, emissive: '#ffffff', emissiveIntensity: 0.32 });
    // a fresnel rim: backlit edges glow warm by day and blue when the cloud is ready to pour
    this.puffMat.onBeforeCompile = (sh) => {
      sh.uniforms.rimColor = this.rimColor;
      sh.uniforms.rimPower = this.rimPower;
      sh.fragmentShader = 'uniform vec3 rimColor;\nuniform float rimPower;\n' + sh.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n  float rimF = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 2.5);\n  totalEmissiveRadiance += rimColor * rimF * rimPower;',
      );
    };
    const geo = new THREE.IcosahedronGeometry(1, 3);
    // a deterministic lumpy cluster around and behind the face
    const spots: [number, number, number, number][] = [
      [-1.3, 0.1, -0.2, 0.95], [1.3, 0.05, -0.2, 0.95], [0, 0.65, -0.55, 1.05], [-0.75, 0.6, 0.1, 0.7], [0.75, 0.62, 0.1, 0.7],
      [-1.9, -0.3, -0.6, 0.7], [1.9, -0.3, -0.6, 0.7], [0, -0.35, -0.9, 1.0], [-0.9, -0.45, 0.25, 0.6], [0.9, -0.45, 0.25, 0.6],
      [-0.5, 1.05, -0.9, 0.7], [0.55, 1.0, -1.0, 0.75], [-1.5, 0.55, -0.95, 0.7], [1.5, 0.55, -0.95, 0.7], [0, 0.25, -1.45, 0.95],
      [-2.4, 0.05, -1.2, 0.55], [2.4, 0.05, -1.2, 0.55], [-1.0, -0.2, -1.5, 0.8], [1.0, -0.2, -1.5, 0.8], [0, -0.6, 0.15, 0.55],
    ];
    spots.forEach(([x, y, z, r], i) => {
      const mesh = new THREE.Mesh(geo, this.puffMat);
      mesh.castShadow = true;
      const p = { mesh, base: new THREE.Vector3(x, y, z), r, phase: i * 1.7 };
      mesh.position.copy(p.base);
      mesh.scale.setScalar(r);
      this.body.add(mesh);
      this.puffs.push(p);
    });

    this.glow = new THREE.PointLight('#cfd8ff', 0, 14, 1.5);
    this.glow.position.set(0, 0, -0.4);
    this.body.add(this.glow);

    this.shadowDisk = new THREE.Mesh(
      new THREE.CircleGeometry(1, 32),
      new THREE.MeshBasicMaterial({ color: '#0b1630', transparent: true, opacity: 0.18, depthWrite: false }),
    );
    this.shadowDisk.rotation.x = -Math.PI / 2;
    this.shadowDisk.renderOrder = 3;
    this.group.add(this.shadowDisk);
  }

  /** Update from the simulated cloud. groundY is the surface height right below (world units). */
  update(dt: number, c: Cloud, groundY: number, night: number) {
    this.t += dt;
    const target = Math.min(2.6, 0.6 + c.W / 14);
    this.scale += (target - this.scale) * Math.min(1, dt * 2.5);
    const pos = cloudWorld(c);
    this.group.position.copy(pos);
    // turn the face three-quarters toward the camera
    let d = this.faceYaw - this.body.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.body.rotation.y += d * Math.min(1, dt * 3);
    const sp = Math.hypot(c.vx, c.vy);

    // squash while pouring, stretch with speed, gentle breathing
    this.squash += ((c.pouring && c.excess > 0 ? 1 : 0) - this.squash) * Math.min(1, dt * 4);
    const breathe = Math.sin(this.t * 1.8) * 0.03;
    const stretch = Math.min(0.12, sp * 0.025);
    const s = this.scale;
    this.body.scale.set(s * (1 + this.squash * 0.1 + stretch * 0.5), s * (1 - this.squash * 0.14 + breathe), s * (1 + stretch));

    // saturation darkens it, dry air frays it
    const sat = THREE.MathUtils.clamp((c.rh - 0.8) / 0.2, 0, 1) * 0.55 + THREE.MathUtils.clamp(c.excess / 2.5, 0, 1) * 0.45;
    const col = WHITE.clone().lerp(NIGHT, night * 0.45).lerp(SLATE, sat * 0.9);
    this.puffMat.color.copy(col);
    this.puffMat.emissiveIntensity = (0.32 + night * 0.12) * (1 - sat * 0.8);
    for (const m of this.coreMats) {
      m.color.copy(WHITE).lerp(SLATE, sat * 0.6);
      // a soft self-glow keeps the face readable in storms and at night
      if (m.map && m.emissiveMap !== m.map) { m.emissiveMap = m.map; m.emissive.set('#ffffff'); m.needsUpdate = true; }
      m.emissiveIntensity = (0.14 + night * 0.3) * (1 - sat * 0.5);
    }
    const dry = THREE.MathUtils.clamp((MIX_RH - c.rh) / 0.3, 0, 1);
    for (const p of this.puffs) {
      const wob = Math.sin(this.t * 1.3 + p.phase) * 0.06;
      p.mesh.position.set(p.base.x * (1 + dry * 0.25), p.base.y + wob, p.base.z * (1 + dry * 0.25));
      p.mesh.scale.setScalar(p.r * (1 - dry * 0.35) * (1 + Math.sin(this.t * 0.9 + p.phase) * 0.04));
    }
    this.rimColor.value.set(c.excess > 0 ? '#9fd7ff' : night > 0.5 ? '#9fb4ff' : '#ffd9a0');
    this.rimPower.value = c.excess > 0 ? 0.6 + Math.sin(this.t * 5) * 0.15 : 0.4;
    this.flash = Math.max(0, this.flash - dt * 4);
    this.glow.intensity = this.flash * 40;

    // blink: a quick vertical squish of the face core
    this.blinkT -= dt;
    const blink = this.blinkT < 0 && this.blinkT > -0.14;
    if (this.blinkT < -0.14) this.blinkT = 2.5 + ((this.t * 7.13) % 2.5);
    this.core.scale.set(1, blink ? 0.86 : 1, 1);

    this.shadowDisk.position.set(0, groundY - pos.y + 0.08, 0);
    this.shadowDisk.scale.setScalar(2.4 * s);
    (this.shadowDisk.material as THREE.MeshBasicMaterial).opacity = 0.12 + sat * 0.12;
  }
}
