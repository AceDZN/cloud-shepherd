// Synthesized sound (no files): wind that follows the wind speed, a rain hiss while pouring,
// thunder, chimes and a soft pad. Starts after the first gesture.

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private nextBeat = 0;
  private beat = 0;
  muted = false;
  mood = 0; // 0 calm, 1 storm

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.7;
    this.master.connect(this.ctx.destination);
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const loop = (type: BiquadFilterType, f: number, q: number) => {
      const src = this.ctx!.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filt = this.ctx!.createBiquadFilter();
      filt.type = type; filt.frequency.value = f; filt.Q.value = q;
      const g = this.ctx!.createGain();
      g.gain.value = 0;
      src.connect(filt).connect(g).connect(this.master!);
      src.start();
      return { filt, g };
    };
    const w = loop('bandpass', 400, 0.6);
    this.windGain = w.g; this.windFilter = w.filt;
    this.rainGain = loop('highpass', 3500, 0.4).g;
    this.startMusic();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.05);
  }

  /** Continuous ambience: wind speed (km/s game units) and pouring intensity 0…1. */
  ambience(wind: number, rain: number): void {
    if (!this.ctx || !this.windGain || !this.windFilter || !this.rainGain) return;
    const t = this.ctx.currentTime;
    this.windGain.gain.setTargetAtTime(Math.min(0.35, 0.04 + wind * 0.07), t, 0.2);
    this.windFilter.frequency.setTargetAtTime(250 + wind * 160, t, 0.2);
    this.rainGain.gain.setTargetAtTime(rain * 0.22, t, 0.15);
  }

  silence(): void { this.ambience(0, 0); if (this.windGain && this.ctx) this.windGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2); }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.25, when = 0, slide = 0): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, freq: number, vol = 0.5, when = 0): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + when;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    s.connect(f).connect(g).connect(this.master);
    s.start(t);
  }

  private startMusic(): void {
    if (!this.ctx || !this.master || this.musicTimer !== null) return;
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.13;
    this.musicGain.connect(this.master);
    this.nextBeat = this.ctx.currentTime + 0.1;
    this.musicTimer = window.setInterval(() => this.schedule(), 120);
  }

  private schedule(): void {
    if (!this.ctx || !this.musicGain) return;
    const spb = 60 / 84 / 2;
    // Dorian-ish sway: Am – G – F – G (minor in storms, the same chords brighter when calm)
    const chords = [[57, 60, 64], [55, 59, 62], [53, 57, 60], [55, 59, 62]];
    const hz = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
    while (this.nextBeat < this.ctx.currentTime + 0.4) {
      const t = this.nextBeat;
      const ch = chords[Math.floor(this.beat / 8) % 4];
      const step = this.beat % 8;
      if (step === 0) for (const n of ch) this.voice(hz(n - 12), t, spb * 8, 'sine', 0.05, 0.8);
      if (step % 2 === 0 || this.mood > 0.5) this.voice(hz(ch[[0, 2, 1, 2, 0, 1, 2, 1][step]] + 12), t, spb * 1.4, 'triangle', 0.035, 0.01);
      this.nextBeat += spb;
      this.beat++;
    }
  }

  private voice(freq: number, t: number, dur: number, type: OscillatorType, vol: number, attack: number): void {
    const o = this.ctx!.createOscillator();
    const g = this.ctx!.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.musicGain!);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  click(): void { this.tone(880, 0.05, 'triangle', 0.12); }
  place(): void { this.tone(523, 0.08, 'triangle', 0.2); this.tone(784, 0.12, 'triangle', 0.18, 0.06); }
  go(): void { this.tone(392, 0.12, 'triangle', 0.25); this.tone(587, 0.18, 'triangle', 0.25, 0.1); }
  saturated(): void { this.tone(1046, 0.25, 'sine', 0.16); this.tone(1318, 0.35, 'sine', 0.14, 0.08); }
  denied(): void { this.tone(220, 0.18, 'square', 0.08, 0, 0.7); }
  puff(): void { this.noise(0.4, 1800, 0.35); }
  target(): void { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.18, i * 0.07)); }
  thunder(): void { this.noise(1.6, 260, 1.1, 0.15); this.noise(0.3, 1400, 0.4); }
  fail(): void { this.tone(392, 0.3, 'triangle', 0.2); this.tone(311, 0.5, 'triangle', 0.2, 0.25); }
  win(): void { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.22, i * 0.11)); }
  star(i: number): void { this.tone(880 + i * 220, 0.22, 'sine', 0.2); }
  splash(): void { this.noise(0.5, 900, 0.6); }
}
