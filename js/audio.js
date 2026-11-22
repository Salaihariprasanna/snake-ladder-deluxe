/**
 * Snake & Ladder Deluxe - Procedural Web Audio Synthesizer
 * Zero external assets, 100% reliable, zero network latency
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.75;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.enabled = !muted;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
  }

  // Play a synthesized tone with envelope
  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.3, pitchDrop = 0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (pitchDrop !== 0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + pitchDrop), now + duration);
      }

      gain.gain.setValueAtTime(gainVal * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // UI Button Click
  playClick() {
    this.playTone(800, 'sine', 0.05, 0.15, -300);
  }

  // Dice Rolling Sound (rapid subtle clicks)
  playDiceRoll() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const count = 6;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const f = 200 + Math.random() * 300;
        this.playTone(f, 'triangle', 0.04, 0.25, -100);
      }, i * 70);
    }
  }

  // Pawn Step (Pitch increases as steps progress)
  playPawnStep(stepIndex = 1) {
    const baseFreq = 320;
    const freq = baseFreq + (stepIndex * 35);
    this.playTone(freq, 'sine', 0.08, 0.25);
  }

  // Snake Bite (Hiss + Descending slide whistle)
  playSnakeBite() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      // 1. Noise hiss
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1800;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3 * this.volume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      whiteNoise.start(now);

      // 2. Comical descending slide whistle
      setTimeout(() => {
        this.playTone(650, 'sawtooth', 0.5, 0.35, -450);
      }, 100);
    } catch (e) {
      console.warn('Snake sound error:', e);
    }
  }

  // Ladder Climb (Ascending harp-like arpeggio)
  playLadderClimb() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.2, 0.35);
      }, idx * 75);
    });
  }

  // Turn Notification
  playTurnSwitch() {
    this.playTone(587.33, 'sine', 0.1, 0.2); // D5
  }

  // Victory Fanfare
  playVictory() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Triumphant fanfare chords
    const chords = [
      { notes: [261.63, 329.63, 392.00], delay: 0 },       // C major
      { notes: [349.23, 440.00, 523.25], delay: 200 },     // F major
      { notes: [392.00, 493.88, 587.33], delay: 400 },     // G major
      { notes: [523.25, 659.25, 783.99, 1046.50], delay: 650, dur: 0.8 } // High C major
    ];

    chords.forEach(({ notes, delay, dur = 0.3 }) => {
      setTimeout(() => {
        notes.forEach(note => {
          this.playTone(note, 'triangle', dur, 0.25);
        });
      }, delay);
    });
  }
}

// Global Sound Engine Instance
window.soundEngine = new SoundEngine();
