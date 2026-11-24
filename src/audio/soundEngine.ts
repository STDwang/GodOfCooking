import type { ChopSoundTexture, SeasoningCategory } from '../data/recipes';

class CulinarySoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;

  // Continuous flame & sizzle nodes
  private flameGain: GainNode | null = null;
  private flameFilter: BiquadFilterNode | null = null;
  private sizzleGain: GainNode | null = null;
  private sizzleFilter: BiquadFilterNode | null = null;
  private loopsInitialized = false;

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted && this.ctx) {
      this.setFlameAndSizzle(0, 0);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.noiseBuffer = this.createNoiseBuffer(this.ctx, 2.5);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private ensureLoops(): void {
    if (this.loopsInitialized || !this.ctx || !this.noiseBuffer) return;
    const ctx = this.ctx;

    // 1. Gas burner low roar
    const flameSrc = ctx.createBufferSource();
    flameSrc.buffer = this.noiseBuffer;
    flameSrc.loop = true;

    const flameFilter = ctx.createBiquadFilter();
    flameFilter.type = 'bandpass';
    flameFilter.frequency.value = 180;
    flameFilter.Q.value = 0.7;

    const flameGain = ctx.createGain();
    flameGain.gain.value = 0.0001;

    flameSrc.connect(flameFilter);
    flameFilter.connect(flameGain);
    flameGain.connect(ctx.destination);
    flameSrc.start();

    // 2. Wok oil sizzle high-frequency crackle
    const sizzleSrc = ctx.createBufferSource();
    sizzleSrc.buffer = this.noiseBuffer;
    sizzleSrc.loop = true;

    const sizzleFilter = ctx.createBiquadFilter();
    sizzleFilter.type = 'highpass';
    sizzleFilter.frequency.value = 3400;

    const sizzleGain = ctx.createGain();
    sizzleGain.gain.value = 0.0001;

    sizzleSrc.connect(sizzleFilter);
    sizzleFilter.connect(sizzleGain);
    sizzleGain.connect(ctx.destination);
    sizzleSrc.start();

    this.flameFilter = flameFilter;
    this.flameGain = flameGain;
    this.sizzleFilter = sizzleFilter;
    this.sizzleGain = sizzleGain;
    this.loopsInitialized = true;
  }

  public setFlameAndSizzle(flameLevel: 0 | 1 | 2 | 3, temp0to100: number): void {
    if (!this.ctx) return;
    if (this.muted) {
      if (this.flameGain && this.sizzleGain) {
        const now = this.ctx.currentTime;
        this.flameGain.gain.setTargetAtTime(0.0001, now, 0.08);
        this.sizzleGain.gain.setTargetAtTime(0.0001, now, 0.08);
      }
      return;
    }

    if (flameLevel > 0 || temp0to100 > 20) {
      this.ensureLoops();
    }
    if (!this.flameGain || !this.flameFilter || !this.sizzleGain || !this.sizzleFilter) return;

    const now = this.ctx.currentTime;
    const flameTarget =
      flameLevel === 0 ? 0.0001 : flameLevel === 1 ? 0.045 : flameLevel === 2 ? 0.09 : 0.16;
    const flameFreq = flameLevel === 1 ? 140 : flameLevel === 2 ? 220 : 340;

    this.flameGain.gain.setTargetAtTime(flameTarget, now, 0.12);
    this.flameFilter.frequency.setTargetAtTime(flameFreq, now, 0.12);

    const sizzleIntensity = Math.max(0, (temp0to100 - 25) / 75);
    const sizzleTarget = sizzleIntensity > 0.02 ? 0.015 + sizzleIntensity * 0.075 : 0.0001;
    this.sizzleGain.gain.setTargetAtTime(sizzleTarget, now, 0.15);
    this.sizzleFilter.frequency.setTargetAtTime(2800 + sizzleIntensity * 1800, now, 0.15);
  }

  /**
   * Satisfying layered Chinese cleaver + wooden chopping block sound
   */
  public playChop(texture: ChopSoundTexture, combo = 1): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.noiseBuffer) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const pitchBoost = Math.min(combo * 0.008, 0.2);
    const jitter = (Math.random() - 0.5) * 0.08;
    const pitchMult = 1 + pitchBoost + jitter;

    // Layer 1: Solid wooden chopping block resonant "du-du" thud
    const woodOsc = ctx.createOscillator();
    const woodGain = ctx.createGain();
    woodOsc.type = 'triangle';
    const baseFreq = texture === 'soft' ? 148 : texture === 'crisp' ? 196 : texture === 'firm' ? 178 : 138;
    woodOsc.frequency.setValueAtTime(baseFreq * 1.45 * pitchMult, now);
    woodOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.58 * pitchMult, now + 0.068);

    const woodPeak = texture === 'soft' ? 0.34 : 0.44;
    woodGain.gain.setValueAtTime(0.001, now);
    woodGain.gain.linearRampToValueAtTime(woodPeak, now + 0.004);
    woodGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.082);

    woodOsc.connect(woodGain);
    woodGain.connect(ctx.destination);
    woodOsc.start(now);
    woodOsc.stop(now + 0.09);

    // Layer 2: Secondary hollow wood knock harmonic
    const knockOsc = ctx.createOscillator();
    const knockGain = ctx.createGain();
    knockOsc.type = 'sine';
    knockOsc.frequency.setValueAtTime(420 * pitchMult, now);
    knockOsc.frequency.exponentialRampToValueAtTime(190 * pitchMult, now + 0.032);
    knockGain.gain.setValueAtTime(texture === 'soft' ? 0.12 : 0.2, now);
    knockGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.038);
    knockOsc.connect(knockGain);
    knockGain.connect(ctx.destination);
    knockOsc.start(now);
    knockOsc.stop(now + 0.042);

    // Layer 3: Ingredient slice texture burst
    const sliceSrc = ctx.createBufferSource();
    sliceSrc.buffer = this.noiseBuffer;
    const sliceFilter = ctx.createBiquadFilter();
    const sliceGain = ctx.createGain();

    if (texture === 'soft') {
      // Silken tofu: wet, silky slice
      sliceFilter.type = 'bandpass';
      sliceFilter.frequency.setValueAtTime(1250 * pitchMult, now);
      sliceFilter.Q.value = 1.6;
      sliceGain.gain.setValueAtTime(0.16, now);
      sliceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.048);
    } else if (texture === 'crisp') {
      // Potato / cucumber / scallion: super crisp snappy "ka-cha"
      sliceFilter.type = 'bandpass';
      sliceFilter.frequency.setValueAtTime(2650 * pitchMult, now);
      sliceFilter.Q.value = 1.2;
      sliceGain.gain.setValueAtTime(0.28, now);
      sliceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);
    } else if (texture === 'firm') {
      // Carrot / ginger: firm snap
      sliceFilter.type = 'bandpass';
      sliceFilter.frequency.setValueAtTime(2100 * pitchMult, now);
      sliceFilter.Q.value = 1.5;
      sliceGain.gain.setValueAtTime(0.25, now);
      sliceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.046);
    } else {
      // Meat: thick dampened slice
      sliceFilter.type = 'lowpass';
      sliceFilter.frequency.setValueAtTime(1350 * pitchMult, now);
      sliceGain.gain.setValueAtTime(0.2, now);
      sliceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    }

    sliceSrc.connect(sliceFilter);
    sliceFilter.connect(sliceGain);
    sliceGain.connect(ctx.destination);
    sliceSrc.start(now, Math.random() * 1.5, 0.065);

    // Layer 4: Subtle steel cleaver shimmer
    const metalOsc = ctx.createOscillator();
    const metalGain = ctx.createGain();
    metalOsc.type = 'sine';
    metalOsc.frequency.setValueAtTime(3400 * pitchMult, now);
    metalGain.gain.setValueAtTime(0.028, now);
    metalGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.032);
    metalOsc.connect(metalGain);
    metalGain.connect(ctx.destination);
    metalOsc.start(now);
    metalOsc.stop(now + 0.036);
  }

  public playIgnite(): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.noiseBuffer) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Spark click
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(1900, now);
    click.frequency.exponentialRampToValueAtTime(320, now + 0.018);
    clickGain.gain.setValueAtTime(0.14, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.start(now);
    click.stop(now + 0.025);

    // Gas "poof"
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now + 0.02);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.24);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now + 0.02);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now + 0.02, 0.2, 0.26);
  }

  public playSeasoningAdd(category: SeasoningCategory): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.noiseBuffer) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (category === 'liquid') {
      // Hot wok liquid splash & "ziiii-laaa" sizzle
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3800, now);
      filter.frequency.exponentialRampToValueAtTime(1900, now + 0.36);
      filter.Q.value = 0.85;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    } else if (category === 'powder') {
      // Soft salt/sugar/pepper sprinkle
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(5200, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    } else {
      // Paste / aromatics hit oil sizzle
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600, now);
      filter.Q.value = 0.9;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    }

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now, Math.random(), 0.45);
  }

  public playWokToss(): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.noiseBuffer) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Wok metallic spatula ring
    const ring = ctx.createOscillator();
    const ringGain = ctx.createGain();
    ring.type = 'triangle';
    ring.frequency.setValueAtTime(980, now);
    ring.frequency.exponentialRampToValueAtTime(520, now + 0.14);
    ringGain.gain.setValueAtTime(0.14, now);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    ring.connect(ringGain);
    ringGain.connect(ctx.destination);
    ring.start(now);
    ring.stop(now + 0.18);

    // Air & sizzle whoosh
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(3200, now + 0.16);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.34);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.09);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now, 0.3, 0.38);
  }

  public playStepComplete(): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.065;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public playDishComplete(): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    // Chinese pentatonic celebratory arpeggio: C5 D5 E5 G5 A5 C6
    const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.075;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.13, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.58);
    });
  }

  public playErrorCue(): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }
}

export const soundEngine = new CulinarySoundEngine();
