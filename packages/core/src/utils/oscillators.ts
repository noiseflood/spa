/**
 * Oscillator utilities for waveform generation
 */

import type { WaveformType } from '@spa.audio/types';

/**
 * Generate a waveform
 */
export function generateWaveform(
  wave: WaveformType | string,
  frequency: number,
  duration: number,
  sampleRate: number
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const buffer = new Float32Array(numSamples);
  let phase = 0;
  const phaseIncrement = frequency / sampleRate;

  for (let i = 0; i < numSamples; i++) {
    buffer[i] = generateSample(wave, phase);
    phase = (phase + phaseIncrement) % 1.0;
  }

  return buffer;
}

/**
 * Generate a single sample for a waveform at a given phase
 */
export function generateSample(wave: WaveformType | string, phase: number): number {
  switch (wave) {
    case 'sine':
      return Math.sin(2 * Math.PI * phase);

    case 'square':
      return phase < 0.5 ? 1 : -1;

    case 'triangle':
      if (phase < 0.25) {
        return 4 * phase;
      } else if (phase < 0.75) {
        return 2 - 4 * phase;
      } else {
        return 4 * phase - 4;
      }

    case 'saw':
    case 'sawtooth':
      return 2 * phase - 1;

    case 'pulse':
      // Default pulse width of 0.25
      return phase < 0.25 ? 1 : -1;

    default:
      return 0;
  }
}

/**
 * Generate a pulse wave with custom width
 */
export function generatePulse(
  frequency: number,
  duration: number,
  sampleRate: number,
  pulseWidth: number = 0.5
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const buffer = new Float32Array(numSamples);
  let phase = 0;
  const phaseIncrement = frequency / sampleRate;

  for (let i = 0; i < numSamples; i++) {
    buffer[i] = phase < pulseWidth ? 1 : -1;
    phase = (phase + phaseIncrement) % 1.0;
  }

  return buffer;
}

/**
 * Mix multiple waveforms
 */
export function mixWaveforms(
  waveforms: Float32Array[],
  weights?: number[]
): Float32Array {
  if (waveforms.length === 0) {
    return new Float32Array(0);
  }

  const maxLength = Math.max(...waveforms.map(w => w.length));
  const mixed = new Float32Array(maxLength);

  for (let i = 0; i < waveforms.length; i++) {
    const waveform = waveforms[i];
    const weight = weights?.[i] ?? 1.0;

    for (let j = 0; j < waveform.length; j++) {
      mixed[j] += waveform[j] * weight;
    }
  }

  return mixed;
}