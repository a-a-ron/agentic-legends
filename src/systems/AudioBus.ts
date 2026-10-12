/**
 * Web Audio synth bus for retro SFX, plus a looping MP3 background theme.
 * Mute state is persisted in localStorage.
 */
import themeUrl from "../assets/audio/theme.mp3?url";

const KEY = "agentic-legends:muted";

class AudioBusImpl {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private music: HTMLAudioElement | null = null;
  private wantMusic = false;
  private gestureBound = false;
  private muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem(KEY) === "1";
    } catch {
      this.muted = false;
    }
  }

  private ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();

      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.65;
      this.sfxGain.connect(this.master);
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  isMuted() { return this.muted; }

  toggleMute(): boolean {
    this.muted = !this.muted;
    try { localStorage.setItem(KEY, this.muted ? "1" : "0"); } catch { /* ignore */ }
    if (this.master) {
      this.master.gain.value = this.muted ? 0 : 0.5;
    }
    if (this.music) this.music.muted = this.muted;
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try { localStorage.setItem(KEY, this.muted ? "1" : "0"); } catch { /* ignore */ }
    if (this.master) {
      this.master.gain.value = this.muted ? 0 : 0.5;
    }
    if (this.music) this.music.muted = this.muted;
  }

  /** Play a frequency sweep (glide) with exponential envelope */
  private sweep(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = "sine",
    peakGain: number = 0.25,
  ) {
    this.ensure();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peakGain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(g).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /** Short single blip */
  private blip(freq: number, duration: number, type: OscillatorType = "square", peakGain = 0.2) {
    this.ensure();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peakGain, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(g).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // --- Sound Effects ---

  /** Classic retro jump: rising pitch sweep */
  jump() {
    this.sweep(220, 560, 0.12, "triangle", 0.28);
  }

  /** High-flying double jump / super leap chirp */
  doubleJump() {
    this.sweep(440, 840, 0.15, "triangle", 0.3);
  }

  /** Soft landing thump */
  land() {
    this.sweep(140, 50, 0.08, "triangle", 0.18);
  }

  /** Collect power-up reward: sparkling major arpeggio */
  collect() {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.blip(freq, 0.14, "sine", 0.3), i * 75);
    });
  }

  /** Player damage / enemy hit */
  hit() {
    this.sweep(240, 60, 0.18, "sawtooth", 0.32);
  }

  /** Knowledge check passed: triumphant chime */
  quizCorrect() {
    const notes = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, i) => {
      setTimeout(() => this.blip(freq, 0.16, "triangle", 0.28), i * 90);
    });
  }

  /** Knowledge check wrong: low error buzzer */
  quizWrong() {
    this.blip(160, 0.14, "sawtooth", 0.25);
    setTimeout(() => this.blip(120, 0.18, "sawtooth", 0.28), 120);
  }

  /** Button / option click */
  uiClick() {
    this.blip(880, 0.04, "square", 0.18);
  }

  /** Button hover tick */
  uiHover() {
    this.blip(1200, 0.02, "sine", 0.06);
  }

  /** Victory fanfare at game complete */
  victory() {
    const melody = [
      { f: 523.25, d: 0.18, delay: 0 },
      { f: 659.25, d: 0.18, delay: 140 },
      { f: 783.99, d: 0.18, delay: 280 },
      { f: 1046.5, d: 0.4, delay: 420 },
      { f: 880.0, d: 0.18, delay: 650 },
      { f: 1046.5, d: 0.6, delay: 820 },
    ];
    melody.forEach((note) => {
      setTimeout(() => this.blip(note.f, note.d, "triangle", 0.32), note.delay);
    });
  }

  /** Game over sad tone */
  gameOver() {
    const notes = [392, 349.23, 311.13, 261.63];
    notes.forEach((freq, i) => {
      setTimeout(() => this.sweep(freq, freq * 0.95, 0.32, "triangle", 0.25), i * 220);
    });
  }

  // --- Background Music ---

  /** Starts (or resumes) the looping MP3 theme. Does not restart if already playing. */
  startBackground() {
    this.ensure();
    if (!this.music) {
      this.music = new Audio(themeUrl);
      this.music.loop = true;
      this.music.volume = 0.35;
    }
    this.music.muted = this.muted;
    this.wantMusic = true;
    this.tryPlayMusic();
  }

  stopBackground() {
    this.wantMusic = false;
    this.music?.pause();
  }

  private tryPlayMusic() {
    this.music?.play().catch(() => {
      // Autoplay blocked until the first user gesture — retry once then.
      if (this.gestureBound) return;
      this.gestureBound = true;
      const retry = () => {
        this.gestureBound = false;
        if (this.wantMusic) this.music?.play().catch(() => {});
      };
      window.addEventListener("pointerdown", retry, { once: true });
      window.addEventListener("keydown", retry, { once: true });
    });
  }
}

export const AudioBus = new AudioBusImpl();
