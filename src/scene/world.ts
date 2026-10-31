// Renderer, sky, lights and the tilt-shift miniature look. Map km → world units:
// X = x (east), Z = −y (north is −Z), Y = metres / 1000 × EXAG (stated vertical exaggeration).
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { HorizontalTiltShiftShader } from 'three/examples/jsm/shaders/HorizontalTiltShiftShader.js';
import { VerticalTiltShiftShader } from 'three/examples/jsm/shaders/VerticalTiltShiftShader.js';

export const EXAG = 5;
export const toWorldY = (m: number) => (m / 1000) * EXAG;
export const toWorld = (x: number, y: number, m: number) => new THREE.Vector3(x, toWorldY(m), -y);

export interface Mood { night: number; storm: number; summer: number; dust?: number }

const SkyShader = {
  uniforms: {
    top: { value: new THREE.Color('#3f8fe0') },
    mid: { value: new THREE.Color('#9fd3ff') },
    bottom: { value: new THREE.Color('#ffe2b0') },
    sunDir: { value: new THREE.Vector3(0.3, 0.35, -0.6).normalize() },
    sunColor: { value: new THREE.Color('#fff4d6') },
    stars: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec3 vDir;
    void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunColor; uniform float stars;
    varying vec3 vDir;
    float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
    void main() {
      float h = vDir.y;
      vec3 c = h > 0.08 ? mix(mid, top, smoothstep(0.08, 0.7, h)) : mix(bottom, mid, smoothstep(-0.15, 0.08, h));
      float sd = max(dot(vDir, sunDir), 0.0);
      c += sunColor * (pow(sd, 900.0) * 3.0 + pow(sd, 12.0) * 0.35);
      if (stars > 0.0 && h > 0.05) {
        vec3 q = floor(vDir * 420.0);
        float s = step(0.9975, hash(q));
        c += vec3(s) * stars * smoothstep(0.05, 0.4, h);
      }
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export class World {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  private sky: THREE.Mesh;
  private composer: EffectComposer;
  private hTilt: ShaderPass;
  private vTilt: ShaderPass;
  tiltOn = true;
  lightning = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.3, 2500);
    this.scene.fog = new THREE.Fog('#bfe0ff', 160, 520);

    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(1500, 32, 16),
      new THREE.ShaderMaterial({ ...SkyShader, side: THREE.BackSide, depthWrite: false, fog: false }),
    );
    this.sky.renderOrder = -10;
    this.scene.add(this.sky);

    this.hemi = new THREE.HemisphereLight('#dff1ff', '#8a6b45', 1.15);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff1d6', 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 260;
    this.sun.shadow.bias = -0.0008;
    this.scene.add(this.sun, this.sun.target);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.hTilt = new ShaderPass(HorizontalTiltShiftShader);
    this.vTilt = new ShaderPass(VerticalTiltShiftShader);
    this.hTilt.uniforms.r.value = this.vTilt.uniforms.r.value = 0.5;
    this.composer.addPass(this.hTilt);
    this.composer.addPass(this.vTilt);
    this.composer.addPass(new OutputPass());
    this.resize();
  }

  resize() {
    const w = this.renderer.domElement.clientWidth || window.innerWidth;
    const h = this.renderer.domElement.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const dpr = this.renderer.getPixelRatio();
    this.hTilt.uniforms.h.value = 1.6 / (w * dpr);
    this.vTilt.uniforms.v.value = 1.6 / (h * dpr);
  }

  /** Focus the miniature blur band: 0.5 = screen middle. */
  setFocus(r: number, strength = 1) {
    this.hTilt.uniforms.r.value = this.vTilt.uniforms.r.value = r;
    const w = this.renderer.domElement.clientWidth || window.innerWidth;
    const h = this.renderer.domElement.clientHeight || window.innerHeight;
    const dpr = this.renderer.getPixelRatio();
    this.hTilt.uniforms.h.value = (1.6 * strength) / (w * dpr);
    this.vTilt.uniforms.v.value = (1.6 * strength) / (h * dpr);
  }

  /** Follow the action with the sun's shadow box. */
  aimSun(center: THREE.Vector3) {
    const u = (this.sky.material as THREE.ShaderMaterial).uniforms;
    const dir = (u.sunDir.value as THREE.Vector3);
    this.sun.position.copy(center).addScaledVector(dir, 120);
    this.sun.target.position.copy(center);
    this.sky.position.copy(this.camera.position);
  }

  setMood(m: Mood) {
    const u = (this.sky.material as THREE.ShaderMaterial).uniforms;
    const day = { top: '#3f8fe0', mid: '#a6d8ff', bottom: '#e9e6dc' };
    const storm = { top: '#3b4a66', mid: '#7d8ca6', bottom: '#c9a98a' };
    const night = { top: '#070d24', mid: '#1b2a55', bottom: '#4a3a5a' };
    const dust = { top: '#c99a5e', mid: '#e7c08a', bottom: '#f0d2a0' };
    const mix = (k: 'top' | 'mid' | 'bottom') => {
      const c = new THREE.Color(day[k]).lerp(new THREE.Color(storm[k]), m.storm);
      c.lerp(new THREE.Color(dust[k]), (m.dust ?? 0) * 0.8);
      return c.lerp(new THREE.Color(night[k]), m.night);
    };
    (u.top.value as THREE.Color).copy(mix('top'));
    (u.mid.value as THREE.Color).copy(mix('mid'));
    (u.bottom.value as THREE.Color).copy(mix('bottom'));
    u.stars.value = m.night * (1 - m.storm * 0.6);
    const sunDir = new THREE.Vector3(m.night > 0.5 ? -0.4 : 0.35, m.night > 0.5 ? 0.5 : 0.32 + m.summer * 0.25, -0.6).normalize();
    (u.sunDir.value as THREE.Vector3).copy(sunDir);
    (u.sunColor.value as THREE.Color).set(m.night > 0.5 ? '#9fb4ff' : '#fff1d6');
    this.sun.color.set(m.night > 0.5 ? '#8fa6ff' : m.summer > 0.5 ? '#fff3dc' : '#ffe9c8');
    this.sun.intensity = (2.7 - m.storm * 1.3) * (1 - m.night * 0.62);
    this.hemi.intensity = (1.2 - m.storm * 0.3) * (1 - m.night * 0.3);
    this.hemi.color.set(m.night > 0.5 ? '#5d6fa8' : '#dff1ff');
    (this.scene.fog as THREE.Fog).color.copy(mix('mid'));
    this.renderer.toneMappingExposure = 1.05 + m.summer * 0.08 - m.night * 0.1;
  }

  render(dt: number) {
    if (this.lightning > 0) {
      this.lightning = Math.max(0, this.lightning - dt * 3);
      this.renderer.toneMappingExposure += this.lightning * 0.6;
    }
    if (this.tiltOn) this.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);
    if (this.lightning > 0) this.renderer.toneMappingExposure -= this.lightning * 0.6;
  }
}
