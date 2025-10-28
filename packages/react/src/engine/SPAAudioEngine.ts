/**
 * SPAAudioEngine - Renders SPA documents using Web Audio API
 */

import type {
  SPADocument,
  SPASound,
  ToneElement,
  NoiseElement,
  GroupElement,
  ADSREnvelope,
  AutomationCurve,
  FilterConfig,
  WaveformType,
  NoiseColor,
  FilterType
} from '@spa-audio/types';

export interface EngineOptions {
  tempo?: number;          // BPM for tempo-relative timing
  masterVolume?: number;   // Global volume (0-1)
  loop?: boolean;          // Loop playback
  onComplete?: () => void; // Callback when playback completes
}

export interface ScheduledSound {
  startTime: number;
  node: AudioScheduledSourceNode;
  gainNode: GainNode;
  element: SPASound;
}

export class SPAAudioEngine {
  private context: AudioContext;
  private masterGain: GainNode;
  private compressor: DynamicsCompressorNode;
  private scheduledSounds: ScheduledSound[] = [];
  private startTime: number = 0;
  private isPlaying: boolean = false;
  private options: EngineOptions;

  constructor(context: AudioContext, options: EngineOptions = {}) {
    this.context = context;
    this.options = {
      tempo: 120,
      masterVolume: 0.8,
      loop: false,
      ...options
    };

    // Create master audio chain
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.options.masterVolume!;

    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.1;

    // Connect chain: sounds -> masterGain -> compressor -> destination
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.context.destination);
  }

  /**
   * Play a SPA document
   */
  async play(document: SPADocument, startOffset = 0): Promise<void> {
    if (this.isPlaying) {
      this.stop();
    }

    this.isPlaying = true;
    this.startTime = this.context.currentTime + 0.05; // Small delay to avoid clicks

    // Schedule all sounds
    for (const sound of document.sounds) {
      this.scheduleSound(sound, this.startTime + startOffset);
    }

    // Calculate total duration and set up completion callback
    const duration = this.calculateDuration(document);

    if (this.options.loop) {
      // Schedule loop restart
      setTimeout(() => {
        if (this.isPlaying) {
          this.play(document, 0);
        }
      }, duration * 1000);
    } else if (this.options.onComplete) {
      setTimeout(() => {
        if (this.isPlaying) {
          this.isPlaying = false;
          this.options.onComplete!();
        }
      }, duration * 1000);
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.isPlaying = false;

    // Stop all scheduled sounds
    for (const scheduled of this.scheduledSounds) {
      try {
        scheduled.node.stop();
        scheduled.node.disconnect();
        scheduled.gainNode.disconnect();
      } catch (e) {
        // Node might already be stopped
      }
    }

    this.scheduledSounds = [];
  }

  /**
   * Pause playback (stop and remember position)
   */
  pause(): number {
    const pauseOffset = this.context.currentTime - this.startTime;
    this.stop();
    return pauseOffset;
  }

  /**
   * Set master volume
   */
  setVolume(volume: number): void {
    this.options.masterVolume = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.setTargetAtTime(
      this.options.masterVolume,
      this.context.currentTime,
      0.01
    );
  }

  /**
   * Set tempo (affects tempo-relative timing)
   */
  setTempo(bpm: number): void {
    this.options.tempo = Math.max(20, Math.min(999, bpm));
  }

  /**
   * Schedule a single sound element
   */
  private scheduleSound(sound: SPASound, startTime: number): void {
    switch (sound.type) {
      case 'tone':
        this.scheduleTone(sound, startTime);
        break;
      case 'noise':
        this.scheduleNoise(sound, startTime);
        break;
      case 'group':
        this.scheduleGroup(sound, startTime);
        break;
    }
  }

  /**
   * Schedule a tone/oscillator
   */
  private scheduleTone(tone: ToneElement, startTime: number): void {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    // Set waveform
    oscillator.type = tone.wave as OscillatorType;

    // Set frequency
    if (typeof tone.freq === 'number') {
      oscillator.frequency.value = tone.freq;
    } else if ('start' in tone.freq) {
      // Automation curve
      this.applyAutomation(oscillator.frequency, tone.freq as AutomationCurve, startTime);
    }

    // Set phase if specified
    if (tone.phase !== undefined) {
      oscillator.detune.value = tone.phase * 100; // Convert to cents
    }

    // Apply envelope
    const envelope = this.resolveEnvelope(tone.envelope);
    if (envelope) {
      this.applyEnvelope(gainNode.gain, envelope, startTime, tone.dur);
    } else {
      // Simple fade in/out if no envelope
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(tone.amp || 1, startTime + 0.01);
      gainNode.gain.setValueAtTime(tone.amp || 1, startTime + tone.dur - 0.01);
      gainNode.gain.linearRampToValueAtTime(0, startTime + tone.dur);
    }

    // Apply amplitude
    if (typeof tone.amp === 'number') {
      gainNode.gain.value *= tone.amp;
    } else if (tone.amp && 'start' in tone.amp) {
      this.applyAutomation(gainNode.gain, tone.amp as AutomationCurve, startTime);
    }

    // Apply filter if specified
    let lastNode: AudioNode = oscillator;
    if (tone.filter) {
      const filterNode = this.createFilter(tone.filter);
      if (filterNode) {
        lastNode.connect(filterNode);
        lastNode = filterNode;
      }
    }

    // Apply panning
    if (tone.pan !== undefined) {
      const panNode = this.context.createStereoPanner();
      if (typeof tone.pan === 'number') {
        panNode.pan.value = tone.pan;
      } else if ('start' in tone.pan) {
        this.applyAutomation(panNode.pan, tone.pan as AutomationCurve, startTime);
      }
      lastNode.connect(panNode);
      lastNode = panNode;
    }

    // Connect audio graph
    lastNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Schedule playback
    oscillator.start(startTime);
    oscillator.stop(startTime + tone.dur);

    // Track scheduled sound
    this.scheduledSounds.push({
      startTime,
      node: oscillator,
      gainNode,
      element: tone
    });
  }

  /**
   * Schedule a noise generator
   */
  private scheduleNoise(noise: NoiseElement, startTime: number): void {
    // Create noise using buffer source with generated noise
    const bufferSize = this.context.sampleRate * noise.dur;
    const buffer = this.context.createBuffer(2, bufferSize, this.context.sampleRate);

    // Generate noise based on color
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      this.generateNoise(data, noise.color);
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.context.createGain();

    // Apply envelope
    const envelope = this.resolveEnvelope(noise.envelope);
    if (envelope) {
      this.applyEnvelope(gainNode.gain, envelope, startTime, noise.dur);
    } else {
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(noise.amp || 1, startTime + 0.01);
      gainNode.gain.setValueAtTime(noise.amp || 1, startTime + noise.dur - 0.01);
      gainNode.gain.linearRampToValueAtTime(0, startTime + noise.dur);
    }

    // Apply amplitude
    if (typeof noise.amp === 'number') {
      gainNode.gain.value *= noise.amp;
    }

    // Apply filter if specified
    let lastNode: AudioNode = source;
    if (noise.filter) {
      const filterNode = this.createFilter(noise.filter);
      if (filterNode) {
        lastNode.connect(filterNode);
        lastNode = filterNode;
      }
    }

    // Apply panning
    if (noise.pan !== undefined) {
      const panNode = this.context.createStereoPanner();
      panNode.pan.value = noise.pan;
      lastNode.connect(panNode);
      lastNode = panNode;
    }

    // Connect audio graph
    lastNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Schedule playback
    source.start(startTime);
    source.stop(startTime + noise.dur);

    // Track scheduled sound
    this.scheduledSounds.push({
      startTime,
      node: source,
      gainNode,
      element: noise
    });
  }

  /**
   * Schedule a group of sounds
   */
  private scheduleGroup(group: GroupElement, startTime: number): void {
    // Groups play all sounds simultaneously
    for (const sound of group.sounds) {
      this.scheduleSound(sound, startTime);
    }
  }

  /**
   * Generate noise data based on color
   */
  private generateNoise(data: Float32Array, color: NoiseColor): void {
    const length = data.length;

    switch (color) {
      case 'white':
        // White noise: random values
        for (let i = 0; i < length; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        break;

      case 'pink':
        // Pink noise: 1/f spectrum
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
        break;

      case 'brown':
        // Brown noise: Brownian motion
        let lastOut = 0;
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + (0.02 * white)) / 1.02;
          data[i] = lastOut * 3.5;
        }
        break;

      case 'blue':
        // Blue noise: inverse of pink
        let lastValue = 0;
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (white - lastValue) * 0.5;
          lastValue = white;
        }
        break;
    }
  }

  /**
   * Create a filter node
   */
  private createFilter(filter: FilterConfig | string): BiquadFilterNode | null {
    if (typeof filter === 'string') {
      // Would resolve from definitions here
      return null;
    }

    const filterNode = this.context.createBiquadFilter();
    filterNode.type = filter.type as BiquadFilterType;

    if (typeof filter.cutoff === 'number') {
      filterNode.frequency.value = filter.cutoff;
    }

    if (filter.resonance !== undefined && typeof filter.resonance === 'number') {
      filterNode.Q.value = filter.resonance;
    }

    if (filter.gain !== undefined) {
      filterNode.gain.value = filter.gain;
    }

    if (filter.detune !== undefined) {
      filterNode.detune.value = filter.detune;
    }

    return filterNode;
  }

  /**
   * Apply ADSR envelope to an audio parameter
   */
  private applyEnvelope(
    param: AudioParam,
    envelope: ADSREnvelope,
    startTime: number,
    duration: number
  ): void {
    const { attack, decay, sustain, release } = envelope;

    // Initial value
    param.setValueAtTime(0, startTime);

    // Attack
    param.linearRampToValueAtTime(1, startTime + attack);

    // Decay
    param.linearRampToValueAtTime(sustain, startTime + attack + decay);

    // Sustain
    const sustainTime = Math.max(0, duration - attack - decay - release);
    param.setValueAtTime(sustain, startTime + attack + decay + sustainTime);

    // Release
    param.linearRampToValueAtTime(0, startTime + duration);
  }

  /**
   * Apply automation curve to an audio parameter
   */
  private applyAutomation(
    param: AudioParam,
    curve: AutomationCurve,
    startTime: number
  ): void {
    const duration = curve.duration || 1;

    switch (curve.curve) {
      case 'linear':
        param.linearRampToValueAtTime(curve.start, startTime);
        param.linearRampToValueAtTime(curve.end, startTime + duration);
        break;

      case 'exp':
        param.exponentialRampToValueAtTime(
          Math.max(0.0001, curve.start),
          startTime
        );
        param.exponentialRampToValueAtTime(
          Math.max(0.0001, curve.end),
          startTime + duration
        );
        break;

      case 'step':
        param.setValueAtTime(curve.start, startTime);
        param.setValueAtTime(curve.end, startTime + duration);
        break;

      default:
        // Default to linear
        param.linearRampToValueAtTime(curve.start, startTime);
        param.linearRampToValueAtTime(curve.end, startTime + duration);
    }
  }

  /**
   * Resolve envelope from definition or object
   */
  private resolveEnvelope(envelope?: ADSREnvelope | string): ADSREnvelope | null {
    if (!envelope) return null;

    if (typeof envelope === 'string') {
      // Would resolve from document definitions here
      return null;
    }

    return envelope;
  }

  /**
   * Calculate total duration of document
   */
  private calculateDuration(document: SPADocument): number {
    let maxDuration = 0;

    const calculateSoundDuration = (sound: SPASound): number => {
      switch (sound.type) {
        case 'tone':
        case 'noise':
          return sound.dur;
        case 'group':
          return Math.max(...sound.sounds.map(calculateSoundDuration));
        default:
          return 0;
      }
    };

    for (const sound of document.sounds) {
      maxDuration = Math.max(maxDuration, calculateSoundDuration(sound));
    }

    return maxDuration;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.masterGain.disconnect();
    this.compressor.disconnect();
  }
}