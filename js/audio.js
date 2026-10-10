/**
 * The Elder Scrolls V: Skyrim Procedural Sound Synthesizer
 * Procedural Web Audio API sound generator for rotating Dragon Shouts (Thu'um),
 * spells, sword clashes, and ambient Skyrim music.
 */

export const SKYRIM_SHOUTS = [
  { words: "FUS • RO • DAH", name: "Unrelenting Force", type: "force" },
  { words: "WULD • NAH • KEST", name: "Whirlwind Sprint", type: "wind" },
  { words: "YOL • TOOR • SHUL", name: "Fire Breath", type: "fire" },
  { words: "FO • KRAH • DIIN", name: "Frost Breath", type: "frost" },
  { words: "IIZ • SLEN • NUS", name: "Ice Form", type: "ice" },
  { words: "STRUN • BAH • QO", name: "Storm Call", type: "storm" },
  { words: "TIID • KLO • UL", name: "Slow Time", type: "time" },
  { words: "SU • GRAH • DUN", name: "Elemental Fury", type: "fury" },
  { words: "JOOR • ZAH • FRUL", name: "Dragonrend", type: "rend" },
  { words: "FEIM • ZII • GRON", name: "Become Ethereal", type: "ethereal" },
  { words: "OD • AH • VIING", name: "Call Dragon", type: "dragon" },
  { words: "ZUN • HAAL • VIIK", name: "Disarm", type: "disarm" },
  { words: "LOK • VAH • KOOR", name: "Clear Skies", type: "clear" },
  { words: "FAAS • RU • MAAR", name: "Dismay", type: "dismay" },
  { words: "KRII • LUN • AUS", name: "Marked for Death", type: "death" },
  { words: "RII • VAAZ • ZOL", name: "Soul Tear", type: "soul" }
];

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isMusicMuted = false;
    this.isThemeSongPlaying = false;
    this.themeSongTimer = null;
    this.musicGain = null;
    this.activeMusicNodes = [];
    this.initialized = false;
    this.currentShoutIndex = 0;
  }

  init() {
    if (this.initialized && this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.isMusicMuted ? 0 : 0.85, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported', e);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  toggleMusicMute() {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.ctx && this.musicGain) {
      const t = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(t);
      this.musicGain.gain.linearRampToValueAtTime(this.isMusicMuted ? 0 : 0.85, t + 0.08);
    }
    return this.isMusicMuted;
  }

  // =========================================================================
  // SKYRIM DRAGONBORN THEME SONG (SONS OF SKYRIM)
  // Procedural orchestration featuring brass horns, war-drums, and choir drone
  // =========================================================================

  toggleDragonbornSong() {
    if (this.isThemeSongPlaying) {
      this.stopDragonbornSong();
      return false;
    } else {
      this.playDragonbornSong();
      return true;
    }
  }

  playDragonbornSong() {
    this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.stopDragonbornSong();
    this.isThemeSongPlaying = true;

    if (this.musicGain) {
      const t = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(t);
      this.musicGain.gain.setValueAtTime(this.isMusicMuted ? 0 : 0.85, t);
    }

    const bpm = 102;
    const beat = 60 / bpm; // ~0.588s per quarter note

    // Note frequencies in Hz
    const N = {
      C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46
    };

    // Melody: [frequency, durationInBeats]
    const melody = [
      // Phrase 1: Iconic Nordic opening
      [N.D4, 1.5], [N.E4, 0.5], [N.F4, 1.0], [N.G4, 1.0],
      [N.F4, 1.0], [N.E4, 1.0], [N.D4, 2.0],
      [N.C4, 1.0], [N.D4, 1.0], [N.E4, 1.0], [N.C4, 1.0],
      [N.D4, 3.5], [0, 0.5],

      // Phrase 2: Building grandeur
      [N.D4, 1.5], [N.E4, 0.5], [N.F4, 1.0], [N.G4, 1.0],
      [N.A4, 2.0], [N.G4, 1.0], [N.F4, 1.0],
      [N.E4, 1.0], [N.F4, 1.0], [N.G4, 1.0], [N.E4, 1.0],
      [N.D4, 3.5], [0, 0.5],

      // Phrase 3: Triumphant Anthem (Dovahkiin, Dovahkiin, naal ok zin los vahriin)
      [N.D5, 1.5], [N.C5, 0.5], [N.A4, 1.0], [N.G4, 1.0],
      [N.A4, 2.5], [0, 0.5],
      [N.D5, 1.5], [N.C5, 0.5], [N.A4, 1.0], [N.C5, 1.0],
      [N.D5, 3.0], [0, 1.0],

      // Phrase 4: Final glorious resolution
      [N.F4, 1.5], [N.G4, 0.5], [N.A4, 1.5], [N.G4, 0.5],
      [N.F4, 1.0], [N.E4, 1.0], [N.D4, 2.0],
      [N.C4, 1.0], [N.E4, 1.0], [N.D4, 3.5], [0, 0.5]
    ];

    const totalBeats = melody.reduce((acc, curr) => acc + curr[1], 0);
    const loopDuration = totalBeats * beat;

    const playLoop = () => {
      if (!this.isThemeSongPlaying || !this.ctx) return;
      const startTime = this.ctx.currentTime + 0.05;

      // 1. Bass & Cello Drone Foundation
      this.scheduleDrone(startTime, loopDuration);

      // 2. Nordic War-Drum Rhythm (Timpani cadence)
      this.scheduleWarDrums(startTime, totalBeats, beat);

      // 3. Horns & Strings Melody
      let cursor = 0;
      melody.forEach(([freq, dur]) => {
        if (freq > 0) {
          const noteTime = startTime + cursor * beat;
          const noteDur = dur * beat;
          this.scheduleHornNote(freq, noteTime, noteDur);
        }
        cursor += dur;
      });

      // Repeat loop
      this.themeSongTimer = setTimeout(() => {
        if (this.isThemeSongPlaying) {
          playLoop();
        }
      }, loopDuration * 1000);
    };

    playLoop();
    return true;
  }

  scheduleHornNote(freq, time, duration) {
    if (!this.ctx || !this.musicGain) return;

    // French Horn / Brass multi-oscillator
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const oscSub = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.002, time);

    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(freq * 0.5, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, time);
    filter.frequency.exponentialRampToValueAtTime(1400, time + 0.1);
    filter.frequency.exponentialRampToValueAtTime(800, time + duration);

    // Brass attack & swell
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.14, time + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    oscSub.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(time);
    osc2.start(time);
    oscSub.start(time);

    osc1.stop(time + duration);
    osc2.stop(time + duration);
    oscSub.stop(time + duration);

    this.trackMusicNode(osc1);
    this.trackMusicNode(osc2);
    this.trackMusicNode(oscSub);
  }

  scheduleWarDrums(startTime, totalBeats, beat) {
    if (!this.ctx) return;
    // Nordic battle drum pattern: Beat 1 (BOOM), Beat 2.5 (boom), Beat 3 (BOOM)
    for (let b = 0; b < totalBeats; b += 2) {
      this.playDrumHit(startTime + b * beat, 1.0);
      if (b + 0.75 < totalBeats) {
        this.playDrumHit(startTime + (b + 0.75) * beat, 0.45);
      }
      if (b + 1 < totalBeats) {
        this.playDrumHit(startTime + (b + 1) * beat, 0.85);
      }
    }
  }

  playDrumHit(time, strength) {
    if (!this.ctx || !this.musicGain) return;
    // Low pitched boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.28);

    gain.gain.setValueAtTime(0.28 * strength, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.35);

    this.trackMusicNode(osc);
  }

  scheduleDrone(startTime, duration) {
    if (!this.ctx || !this.musicGain) return;
    // D Minor low strings drone (D2 = 73.4 Hz, A2 = 110 Hz)
    [73.42, 110.0].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      const timeSafe = (t) => Math.max(0, t);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, timeSafe(startTime));

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, timeSafe(startTime));

      gain.gain.setValueAtTime(0.0001, timeSafe(startTime));
      gain.gain.linearRampToValueAtTime(0.08, timeSafe(startTime) + 1.2);
      gain.gain.setValueAtTime(0.08, timeSafe(startTime) + duration - 1.0);
      gain.gain.linearRampToValueAtTime(0.0001, timeSafe(startTime) + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(timeSafe(startTime));
      osc.stop(timeSafe(startTime) + duration);

      this.trackMusicNode(osc);
    });
  }

  trackMusicNode(node) {
    this.activeMusicNodes.push(node);
    node.onended = () => {
      const idx = this.activeMusicNodes.indexOf(node);
      if (idx > -1) this.activeMusicNodes.splice(idx, 1);
    };
  }

  stopDragonbornSong() {
    this.isThemeSongPlaying = false;
    if (this.themeSongTimer) {
      clearTimeout(this.themeSongTimer);
      this.themeSongTimer = null;
    }
    for (const node of this.activeMusicNodes) {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {}
    }
    this.activeMusicNodes = [];
  }

  // =========================================================================
  // ROTATING SKYRIM DRAGON SHOUTS (THU'UM)
  // Each shout has a bespoke procedural acoustic signature
  // =========================================================================

  getNextShout() {
    const shout = SKYRIM_SHOUTS[this.currentShoutIndex];
    this.currentShoutIndex = (this.currentShoutIndex + 1) % SKYRIM_SHOUTS.length;
    return shout;
  }

  playShout(type = 'force') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;

    switch (type) {
      case 'wind':
        this.synthWhirlwindSprint(t);
        break;
      case 'fire':
        this.synthFireBreath(t);
        break;
      case 'frost':
      case 'ice':
        this.synthIceForm(t);
        break;
      case 'storm':
        this.synthStormCall(t);
        break;
      case 'time':
        this.synthSlowTime(t);
        break;
      case 'fury':
      case 'disarm':
        this.synthElementalFury(t);
        break;
      case 'dragon':
      case 'rend':
        this.synthDragonRend(t);
        break;
      case 'ethereal':
      case 'soul':
      case 'clear':
      case 'death':
      case 'dismay':
        this.synthEtherealShout(t);
        break;
      case 'force':
      default:
        this.synthFusRoDah(t);
        break;
    }
  }

  // 1. Fus Ro Dah (Unrelenting Force)
  synthFusRoDah(t) {
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(145, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.5);

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(400, t);
    subFilter.frequency.exponentialRampToValueAtTime(60, t + 0.55);

    subGain.gain.setValueAtTime(1.1, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + 0.6);

    this.playNoiseBlast(t, 800, 200, 0.55, 0.85);
    this.playChoirSwell(t, [220, 277.18, 329.63, 440], 0.7);
  }

  // 2. Wuld Nah Kest (Whirlwind Sprint)
  synthWhirlwindSprint(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.18);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.45);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(2800, t + 0.15);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.5);
    filter.Q.value = 4.0;

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.9, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.6);

    this.playNoiseBlast(t, 2200, 600, 0.45, 0.9);
  }

  // 3. Yol Toor Shul (Fire Breath)
  synthFireBreath(t) {
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(85, t);
    sub.frequency.exponentialRampToValueAtTime(45, t + 0.7);
    subGain.gain.setValueAtTime(0.8, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(t);
    sub.stop(t + 0.75);

    // Crackling Fire Noise
    this.playNoiseBlast(t, 550, 180, 0.75, 1.0);
    this.playChoirSwell(t, [174.61, 220, 261.63], 0.8); // F Major flame triad
  }

  // 4. Iiz Slen Nus (Ice Form) & Frost Breath
  synthIceForm(t) {
    const freqs = [1760, 2637, 3520];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.5);

      gain.gain.setValueAtTime(0.001, t + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.04);
      osc.stop(t + 0.7);
    });

    this.playNoiseBlast(t, 3200, 1200, 0.5, 0.6);
  }

  // 5. Strun Bah Qo (Storm Call)
  synthStormCall(t) {
    // Thunderclap explosive hit
    const sub = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(180, t);
    sub.frequency.exponentialRampToValueAtTime(32, t + 0.6);

    gain.gain.setValueAtTime(1.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    sub.connect(gain);
    gain.connect(this.ctx.destination);
    sub.start(t);
    sub.stop(t + 0.65);

    this.playNoiseBlast(t, 900, 80, 0.8, 1.1);
  }

  // 6. Tiid Klo Ul (Slow Time)
  synthSlowTime(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.8);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.65, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.9);

    this.playChoirSwell(t, [130.81, 164.81, 196.00], 0.9);
  }

  // 7. Su Grah Dun (Elemental Fury) & Disarm
  synthElementalFury(t) {
    const ring = this.ctx.createOscillator();
    const rGain = this.ctx.createGain();
    ring.type = 'sine';
    ring.frequency.setValueAtTime(2800, t);
    ring.frequency.exponentialRampToValueAtTime(1900, t + 0.4);

    rGain.gain.setValueAtTime(0.45, t);
    rGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

    ring.connect(rGain);
    rGain.connect(this.ctx.destination);
    ring.start(t);
    ring.stop(t + 0.48);

    this.playNoiseBlast(t, 2400, 800, 0.35, 0.8);
  }

  // 8. Joor Zah Frul (Dragonrend) & Call Dragon
  synthDragonRend(t) {
    const sub = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(220, t);
    sub.frequency.exponentialRampToValueAtTime(65, t + 0.6);

    sGain.gain.setValueAtTime(0.9, t);
    sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    sub.connect(sGain);
    sGain.connect(this.ctx.destination);
    sub.start(t);
    sub.stop(t + 0.65);

    this.playNoiseBlast(t, 600, 160, 0.65, 0.9);
    this.playChoirSwell(t, [146.83, 220, 293.66], 0.8); // D minor power chord
  }

  // 9. Ethereal / Soul / Clear / Death / Dismay
  synthEtherealShout(t) {
    this.playChoirSwell(t, [220, 329.63, 440, 659.25], 0.9);
    this.playNoiseBlast(t, 1400, 400, 0.45, 0.5);
  }

  // Helper: Noise burst
  playNoiseBlast(t, startFreq, endFreq, duration, volume) {
    const bufferSize = this.ctx.sampleRate * duration;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * (duration * 0.35)));
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(startFreq, t);
    noiseFilter.Q.value = 2.5;
    noiseFilter.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(volume, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    whiteNoise.start(t);
  }

  // Helper: Resonant Choir Swell
  playChoirSwell(t, freqs, duration) {
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.2 / (idx + 1), t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.05);
    });
  }

  // =========================================================================
  // STANDARD INTERACTIVE SFX
  // =========================================================================

  playLevelUp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const notes = [293.66, 349.23, 440.0, 587.33];
    notes.forEach((freq, i) => {
      const noteTime = t + i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.3, noteTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.85);
    });
  }

  playSwordDraw() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, t);
    osc.frequency.exponentialRampToValueAtTime(1850, t + 0.35);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.42);
  }

  playSpellRecharge() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const bubTime = t + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + i * 150, bubTime);
      osc.frequency.exponentialRampToValueAtTime(950 + i * 180, bubTime + 0.07);

      gain.gain.setValueAtTime(0.18, bubTime);
      gain.gain.exponentialRampToValueAtTime(0.001, bubTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(bubTime);
      osc.stop(bubTime + 0.09);
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, t + 0.3);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.65);

    gain.gain.setValueAtTime(0.001, t + 0.3);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t + 0.3);
    osc.stop(t + 0.75);
  }

  playUiBeep(freq = 800) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  playEmptyClick() {
    this.playUiBeep(320);
  }
}

export const sound = new SoundSystem();
