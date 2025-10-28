/**
 * SPA Renderer - Converts SPA document to Web Audio
 */

import type {
  SPADocument,
  SPASound,
  ToneElement,
  NoiseElement,
  GroupElement,
  SequenceElement,
  TimedSound,
  RenderOptions,
  RenderResult,
  ADSREnvelope,
  AutomationCurve,
  RepeatConfig
} from '@spa/types';

import { parseSPA } from './parser';
import { generateWaveform } from './utils/oscillators';
import { generateNoise } from './utils/noise';
import { applyEnvelope } from './utils/envelopes';
import { applyFilter } from './utils/filters';
import { applyAutomation } from './utils/automation';

/**
 * Render SPA XML to AudioBuffer
 */
export async function renderSPA(
  xml: string | SPADocument,
  options: RenderOptions = {}
): Promise<AudioBuffer> {
  const {
    sampleRate = 48000,
    channels = 2,
    normalize = true,
    masterVolume = 1.0,
    offline = true
  } = options;

  // Parse if string
  const doc = typeof xml === 'string' ? parseSPA(xml) : xml;

  // Render each sound
  const renderedSounds = doc.sounds.map(sound =>
    renderSound(sound, doc.defs, sampleRate)
  );

  // Find max length (avoid spread operator for large arrays)
  let maxLength = 0;
  for (const sound of renderedSounds) {
    if (sound.length > maxLength) maxLength = sound.length;
  }

  // Mix all sounds
  const mixedMono = new Float32Array(maxLength);
  for (const sound of renderedSounds) {
    for (let i = 0; i < sound.length; i++) {
      mixedMono[i] += sound[i];
    }
  }

  // Apply master volume
  for (let i = 0; i < mixedMono.length; i++) {
    mixedMono[i] *= masterVolume;
  }

  // Normalize if requested
  if (normalize) {
    // Find peak without using spread operator (which can cause stack overflow on large arrays)
    let peak = 0;
    for (let i = 0; i < mixedMono.length; i++) {
      const abs = Math.abs(mixedMono[i]);
      if (abs > peak) peak = abs;
    }

    if (peak > 1.0) {
      for (let i = 0; i < mixedMono.length; i++) {
        mixedMono[i] /= peak;
      }
    }
  }

  // Create AudioBuffer
  const audioBuffer = createAudioBuffer(channels, maxLength, sampleRate);

  // Copy to channels (mono to stereo)
  for (let channel = 0; channel < channels; channel++) {
    audioBuffer.copyToChannel(mixedMono, channel);
  }

  return audioBuffer;
}

/**
 * Render to raw Float32Array buffer
 */
export async function renderToBuffer(
  xml: string | SPADocument,
  options: RenderOptions = {}
): Promise<Float32Array> {
  const audioBuffer = await renderSPA(xml, options);
  const buffer = new Float32Array(audioBuffer.length * audioBuffer.numberOfChannels);

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < channelData.length; i++) {
      buffer[i * audioBuffer.numberOfChannels + channel] = channelData[i];
    }
  }

  return buffer;
}

/**
 * Render a single sound element
 */
function renderSound(
  sound: SPASound,
  defs: any,
  sampleRate: number,
  startOffset: number = 0
): Float32Array {
  switch (sound.type) {
    case 'tone':
      return renderTone(sound, defs, sampleRate, startOffset);
    case 'noise':
      return renderNoise(sound, defs, sampleRate, startOffset);
    case 'group':
      return renderGroup(sound, defs, sampleRate, startOffset);
    case 'sequence':
      return renderSequence(sound, defs, sampleRate);
    default:
      throw new Error(`Unknown sound type: ${(sound as any).type}`);
  }
}

/**
 * Render tone element
 */
function renderTone(
  tone: ToneElement,
  defs: any,
  sampleRate: number,
  startOffset: number = 0
): Float32Array {
  let buffer: Float32Array;

  // Handle frequency automation
  if (typeof tone.freq === 'number') {
    buffer = generateWaveform(tone.wave, tone.freq, tone.dur, sampleRate);
  } else if (isAutomationCurve(tone.freq)) {
    // Generate with frequency automation
    buffer = generateWaveformWithAutomation(
      tone.wave,
      tone.freq,
      tone.dur,
      sampleRate
    );
  } else {
    buffer = generateWaveform(tone.wave, tone.freq as number, tone.dur, sampleRate);
  }

  // Apply envelope
  if (tone.envelope) {
    const env = resolveEnvelope(tone.envelope, defs);
    if (env) {
      buffer = applyEnvelope(buffer, env, tone.dur, sampleRate);
    }
  }

  // Apply amplitude
  if (tone.amp !== undefined) {
    if (typeof tone.amp === 'number') {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] *= tone.amp;
      }
    } else if (isAutomationCurve(tone.amp)) {
      buffer = applyAutomation(buffer, tone.amp, tone.dur, sampleRate);
    }
  }

  // Apply filter if present
  if (tone.filter) {
    const filterConfig = typeof tone.filter === 'string'
      ? defs?.filters?.[tone.filter.slice(1)]
      : tone.filter;
    if (filterConfig) {
      buffer = applyFilter(buffer, filterConfig, sampleRate);
    }
  }

  // Apply repeat if configured
  buffer = applyRepeat(buffer, tone, sampleRate);

  return buffer;
}

/**
 * Render noise element
 */
function renderNoise(
  noise: NoiseElement,
  defs: any,
  sampleRate: number,
  startOffset: number = 0
): Float32Array {
  let buffer = generateNoise(noise.color, noise.dur, sampleRate);

  // Apply envelope
  if (noise.envelope) {
    const env = resolveEnvelope(noise.envelope, defs);
    if (env) {
      buffer = applyEnvelope(buffer, env, noise.dur, sampleRate);
    }
  }

  // Apply amplitude
  if (noise.amp !== undefined) {
    if (typeof noise.amp === 'number') {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] *= noise.amp;
      }
    } else if (isAutomationCurve(noise.amp)) {
      buffer = applyAutomation(buffer, noise.amp, noise.dur, sampleRate);
    }
  }

  // Apply filter if present
  if (noise.filter) {
    const filterConfig = typeof noise.filter === 'string'
      ? defs?.filters?.[noise.filter.slice(1)]
      : noise.filter;
    if (filterConfig) {
      buffer = applyFilter(buffer, filterConfig, sampleRate);
    }
  }

  // Apply repeat if configured
  buffer = applyRepeat(buffer, noise, sampleRate);

  return buffer;
}

/**
 * Render group element
 */
function renderGroup(
  group: GroupElement,
  defs: any,
  sampleRate: number,
  startOffset: number = 0
): Float32Array {
  const renderedSounds = group.sounds.map(sound =>
    renderSound(sound, defs, sampleRate)
  );

  // Find max length (avoid spread operator for large arrays)
  let maxLength = 0;
  for (const sound of renderedSounds) {
    if (sound.length > maxLength) maxLength = sound.length;
  }

  // Mix all sounds in the group
  const mixed = new Float32Array(maxLength);
  for (const sound of renderedSounds) {
    for (let i = 0; i < sound.length; i++) {
      mixed[i] += sound[i];
    }
  }

  // Apply group amplitude if specified
  if (group.amp !== undefined) {
    for (let i = 0; i < mixed.length; i++) {
      mixed[i] *= group.amp;
    }
  }

  // Apply repeat if configured
  const result = applyRepeat(mixed, group, sampleRate);

  return result;
}

/**
 * Render sequence element with timed sounds
 */
function renderSequence(
  sequence: SequenceElement,
  defs: any,
  sampleRate: number
): Float32Array {
  // Find the total duration of the sequence
  let maxDuration = 0;
  for (const element of sequence.elements) {
    const endTime = element.at + getDuration(element.sound);
    maxDuration = Math.max(maxDuration, endTime);
  }

  // If looping, we need to handle it differently (for now, just play once)
  // TODO: Implement loop support

  const totalSamples = Math.ceil(maxDuration * sampleRate);
  const result = new Float32Array(totalSamples);

  // Render each timed element
  for (const element of sequence.elements) {
    const startSample = Math.floor(element.at * sampleRate);
    const soundBuffer = renderSound(element.sound, defs, sampleRate);

    // Mix the sound into the result at the correct position
    for (let i = 0; i < soundBuffer.length && startSample + i < totalSamples; i++) {
      result[startSample + i] += soundBuffer[i];
    }
  }

  return result;
}

/**
 * Get duration of a sound element
 */
function getDuration(sound: ToneElement | NoiseElement | GroupElement): number {
  if (sound.type === 'tone' || sound.type === 'noise') {
    let baseDur = sound.dur;

    // Account for repeat if present
    if (sound.repeat && sound.repeatInterval) {
      const repeatCount = sound.repeat === 'infinite' ? 20 : sound.repeat; // Cap at 20
      const totalRepeatTime = (repeatCount - 1) * (sound.dur + sound.repeatInterval);
      baseDur = sound.dur + totalRepeatTime + (sound.repeatDelay || 0);
    }

    return baseDur;
  } else if (sound.type === 'group') {
    // For groups, find the longest duration
    let maxDur = 0;
    for (const child of sound.sounds) {
      // Recursively get duration (though groups in sequences might be complex)
      if (child.type === 'tone' || child.type === 'noise') {
        maxDur = Math.max(maxDur, getDuration(child as ToneElement | NoiseElement));
      }
    }
    return maxDur;
  }
  return 0;
}

/**
 * Generate waveform with frequency automation
 */
function generateWaveformWithAutomation(
  wave: string,
  freqCurve: AutomationCurve,
  duration: number,
  sampleRate: number
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const buffer = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = t / duration;

    // Interpolate frequency
    let freq: number;
    switch (freqCurve.curve) {
      case 'exp':
        freq = freqCurve.start * Math.pow(freqCurve.end / freqCurve.start, progress);
        break;
      case 'log':
        freq = freqCurve.start + (freqCurve.end - freqCurve.start) * Math.log1p(progress * 9) / Math.log(10);
        break;
      case 'smooth':
        const smoothProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        freq = freqCurve.start + (freqCurve.end - freqCurve.start) * smoothProgress;
        break;
      default: // linear
        freq = freqCurve.start + (freqCurve.end - freqCurve.start) * progress;
    }

    // Generate sample at this frequency
    // This is simplified - a real implementation would track phase continuity
    const phase = (freq * t) % 1.0;
    buffer[i] = generateSample(wave, phase);
  }

  return buffer;
}

/**
 * Generate a single sample for a waveform
 */
function generateSample(wave: string, phase: number): number {
  switch (wave) {
    case 'sine':
      return Math.sin(2 * Math.PI * phase);
    case 'square':
      return phase < 0.5 ? 1 : -1;
    case 'triangle':
      return 4 * Math.abs(phase - 0.5) - 1;
    case 'saw':
      return 2 * phase - 1;
    default:
      return 0;
  }
}

/**
 * Resolve envelope reference
 */
function resolveEnvelope(
  envelope: ADSREnvelope | string,
  defs: any
): ADSREnvelope | null {
  if (typeof envelope === 'string') {
    if (envelope.startsWith('#') && defs?.envelopes) {
      return defs.envelopes[envelope.slice(1)] || null;
    }
    return null;
  }
  return envelope;
}

/**
 * Apply repeat to a buffer
 */
function applyRepeat(
  buffer: Float32Array,
  element: ToneElement | NoiseElement | GroupElement,
  sampleRate: number
): Float32Array {
  // Check if repeat is configured properly
  if (!element.repeat || element.repeat <= 1 || !element.repeatInterval || element.repeatInterval <= 0) {
    return buffer;
  }

  const repeatCount = element.repeat === 'infinite' ? 100 : element.repeat; // Cap infinite at 100 for practical reasons
  const intervalSamples = Math.floor(element.repeatInterval * sampleRate);
  const delaySamples = element.repeatDelay ? Math.floor(element.repeatDelay * sampleRate) : 0;
  const decay = element.repeatDecay || 0;
  const pitchShift = (element as ToneElement).repeatPitchShift || 0;

  // Calculate total length
  const totalLength = delaySamples + buffer.length + (repeatCount - 1) * (buffer.length + intervalSamples);

  // Safety check: prevent extremely large buffers
  if (totalLength > sampleRate * 60 || totalLength < 0 || !isFinite(totalLength)) {
    console.warn('Repeat would create too large or invalid buffer, skipping repeat');
    return buffer;
  }

  const result = new Float32Array(totalLength);

  // Copy original with initial delay
  for (let i = 0; i < buffer.length; i++) {
    result[delaySamples + i] = buffer[i];
  }

  // Add repetitions
  for (let rep = 1; rep < repeatCount; rep++) {
    const startIndex = delaySamples + rep * (buffer.length + intervalSamples);
    const amplitude = Math.pow(1 - decay, rep); // Exponential decay

    // Apply pitch shift if specified
    if (pitchShift !== 0) {
      const pitchRatio = Math.pow(2, (pitchShift * rep) / 12);
      const shiftedLength = Math.floor(buffer.length / pitchRatio);

      for (let i = 0; i < shiftedLength && startIndex + i < result.length; i++) {
        const sourceIndex = Math.floor(i * pitchRatio);
        if (sourceIndex < buffer.length) {
          result[startIndex + i] += buffer[sourceIndex] * amplitude;
        }
      }
    } else {
      // No pitch shift, just copy with amplitude
      for (let i = 0; i < buffer.length && startIndex + i < result.length; i++) {
        result[startIndex + i] += buffer[i] * amplitude;
      }
    }
  }

  return result;
}

/**
 * Type guard for automation curve
 */
function isAutomationCurve(value: any): value is AutomationCurve {
  return value && typeof value === 'object' && 'start' in value && 'end' in value;
}

/**
 * Create AudioBuffer (handles both browser and Node.js)
 */
function createAudioBuffer(
  channels: number,
  length: number,
  sampleRate: number
): AudioBuffer {
  if (typeof window !== 'undefined' && window.AudioContext) {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx.createBuffer(channels, length, sampleRate);
  }

  // Fallback for Node.js or testing
  return {
    numberOfChannels: channels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: (channel: number) => new Float32Array(length),
    copyToChannel: (source: Float32Array, channel: number) => {
      // No-op in Node.js
    },
    copyFromChannel: (destination: Float32Array, channel: number) => {
      // No-op in Node.js
    }
  } as AudioBuffer;
}