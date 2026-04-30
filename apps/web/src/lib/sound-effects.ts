/**
 * Sound Effects Utility
 *
 * Generates satisfying sound effects using Web Audio API.
 * No external audio files needed - all sounds are generated programmatically.
 */

type SoundType = 'click' | 'pop' | 'success' | 'error' | 'whoosh';

interface SoundOptions {
  volume?: number; // 0.0 to 1.0
  pitch?: number; // Multiplier for frequency (1.0 = normal)
}

class SoundEffects {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize audio context lazily (requires user interaction)
    if (typeof window !== 'undefined') {
      this.enabled = this.loadPreference();
    }
  }

  private loadPreference(): boolean {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('soundEffectsEnabled');
    return stored !== 'false'; // Default to enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundEffectsEnabled', String(enabled));
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported:', e);
        return null;
      }
    }

    // Resume context if suspended (required after user interaction)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {
        // Ignore errors - user interaction required
      });
    }

    return this.audioContext;
  }

  /**
   * Play a satisfying click sound
   */
  playClick(options: SoundOptions = {}): void {
    if (!this.enabled) return;
    this.playTone({
      frequency: 800,
      duration: 0.05,
      type: 'sine',
      volume: options.volume ?? 0.3,
      pitch: options.pitch ?? 1.0,
    });
  }

  /**
   * Play a satisfying pop sound (for primary actions)
   */
  playPop(options: SoundOptions = {}): void {
    if (!this.enabled) return;
    const volume = options.volume ?? 0.4;
    const pitch = options.pitch ?? 1.0;

    // Create a quick ascending tone with a pop
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200 * pitch, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400 * pitch, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }

  /**
   * Play a success chime
   */
  playSuccess(options: SoundOptions = {}): void {
    if (!this.enabled) return;
    const volume = options.volume ?? 0.35;
    const pitch = options.pitch ?? 1.0;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Play two tones in quick succession
    const playTone = (freq: number, time: number, duration: number) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();

      osc.connect(gain);
      gain.connect(ctx!.destination);

      osc.type = 'sine';
      osc.frequency.value = freq * pitch;

      gain.gain.setValueAtTime(0, ctx!.currentTime + time);
      gain.gain.linearRampToValueAtTime(volume, ctx!.currentTime + time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx!.currentTime + time + duration);

      osc.start(ctx!.currentTime + time);
      osc.stop(ctx!.currentTime + time + duration);
    };

    playTone(523.25, 0, 0.15); // C5
    playTone(659.25, 0.05, 0.2); // E5
  }

  /**
   * Play an error sound
   */
  playError(options: SoundOptions = {}): void {
    if (!this.enabled) return;
    const volume = options.volume ?? 0.3;
    const pitch = options.pitch ?? 1.0;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150 * pitch, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100 * pitch, ctx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  }

  /**
   * Play a whoosh sound (for transitions)
   */
  playWhoosh(options: SoundOptions = {}): void {
    if (!this.enabled) return;
    const volume = options.volume ?? 0.25;
    const pitch = options.pitch ?? 1.0;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Create noise-like sound with filter sweep
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000 * pitch, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100 * pitch, ctx.currentTime + 0.2);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.2);
  }

  /**
   * Play a sound by type
   */
  play(type: SoundType, options: SoundOptions = {}): void {
    switch (type) {
      case 'click':
        this.playClick(options);
        break;
      case 'pop':
        this.playPop(options);
        break;
      case 'success':
        this.playSuccess(options);
        break;
      case 'error':
        this.playError(options);
        break;
      case 'whoosh':
        this.playWhoosh(options);
        break;
    }
  }

  /**
   * Internal helper to play a simple tone
   */
  private playTone(options: {
    frequency: number;
    duration: number;
    type: OscillatorType;
    volume: number;
    pitch: number;
  }): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = options.type;
    oscillator.frequency.value = options.frequency * options.pitch;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(options.volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + options.duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + options.duration);
  }
}

// Singleton instance
export const soundEffects = new SoundEffects();
