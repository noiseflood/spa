/**
 * ADSR Envelope utilities
 */

import type { ADSREnvelope } from '@spa.audio/types';

/**
 * Apply ADSR envelope to a buffer
 */
export function applyEnvelope(
  buffer: Float32Array,
  envelope: ADSREnvelope,
  duration: number,
  sampleRate: number
): Float32Array {
  const numSamples = buffer.length;
  const result = new Float32Array(numSamples);

  const attackSamples = Math.floor(envelope.attack * sampleRate);
  const decaySamples = Math.floor(envelope.decay * sampleRate);
  const releaseSamples = Math.floor(envelope.release * sampleRate);
  const sustainSamples = Math.max(0, numSamples - attackSamples - decaySamples - releaseSamples);

  for (let i = 0; i < numSamples; i++) {
    let gain = 1.0;

    if (i < attackSamples) {
      // Attack phase
      gain = i / attackSamples;
    } else if (i < attackSamples + decaySamples) {
      // Decay phase
      const decayProgress = (i - attackSamples) / decaySamples;
      gain = 1.0 - (decayProgress * (1.0 - envelope.sustain));
    } else if (i < attackSamples + decaySamples + sustainSamples) {
      // Sustain phase
      gain = envelope.sustain;
    } else {
      // Release phase
      const releaseProgress = (i - attackSamples - decaySamples - sustainSamples) / releaseSamples;
      gain = envelope.sustain * (1.0 - releaseProgress);
    }

    result[i] = buffer[i] * gain;
  }

  return result;
}

/**
 * Create a simple envelope shape
 */
export function createEnvelope(
  type: 'pluck' | 'pad' | 'stab' | 'gate'
): ADSREnvelope {
  switch (type) {
    case 'pluck':
      return {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.2,
        release: 0.1
      };
    case 'pad':
      return {
        attack: 0.5,
        decay: 0.3,
        sustain: 0.7,
        release: 1.0
      };
    case 'stab':
      return {
        attack: 0,
        decay: 0.1,
        sustain: 0,
        release: 0.1
      };
    case 'gate':
    default:
      return {
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0
      };
  }
}

/**
 * Apply a simple fade in
 */
export function fadeIn(
  buffer: Float32Array,
  fadeTime: number,
  sampleRate: number
): Float32Array {
  const fadeSamples = Math.floor(fadeTime * sampleRate);
  const result = new Float32Array(buffer.length);

  for (let i = 0; i < buffer.length; i++) {
    const gain = i < fadeSamples ? i / fadeSamples : 1.0;
    result[i] = buffer[i] * gain;
  }

  return result;
}

/**
 * Apply a simple fade out
 */
export function fadeOut(
  buffer: Float32Array,
  fadeTime: number,
  sampleRate: number
): Float32Array {
  const fadeSamples = Math.floor(fadeTime * sampleRate);
  const fadeStart = buffer.length - fadeSamples;
  const result = new Float32Array(buffer.length);

  for (let i = 0; i < buffer.length; i++) {
    const gain = i >= fadeStart
      ? 1.0 - ((i - fadeStart) / fadeSamples)
      : 1.0;
    result[i] = buffer[i] * gain;
  }

  return result;
}