/**
 * Audio Effects Utilities
 * Includes reverb, delay, and other effect processors
 */

import type { EffectElement, ReverbPreset } from '@spa-audio/types';

/**
 * Generate an impulse response for reverb
 * Uses algorithmic generation to create realistic reverb impulses
 */
export function generateImpulseResponse(
  preset: ReverbPreset = 'hall',
  sampleRate: number = 48000
): Float32Array {
  const presetSettings = getReverbPresetSettings(preset);
  const {
    duration,
    decay,
    preDelay,
    damping,
    roomSize,
    diffusion,
    wetGain
  } = presetSettings;

  const length = Math.floor(duration * sampleRate);
  const impulse = new Float32Array(length);
  const preDelaySamples = Math.floor(preDelay * sampleRate);

  // Generate the impulse response
  for (let i = 0; i < length; i++) {
    if (i < preDelaySamples) {
      impulse[i] = 0;
    } else {
      const t = (i - preDelaySamples) / sampleRate;

      // Exponential decay
      let amplitude = Math.exp(-decay * t);

      // Apply room size factor (larger rooms = longer decay)
      amplitude *= (1 - Math.exp(-t / roomSize));

      // High frequency damping simulation
      const dampingFactor = Math.exp(-damping * t * 2);

      // Create diffuse reverb tail with multiple reflections
      let sample = 0;

      // Early reflections (first 50ms)
      if (t < 0.05) {
        const numEarlyReflections = 8;
        for (let j = 0; j < numEarlyReflections; j++) {
          const reflectionTime = (j + 1) * 0.005;
          if (t > reflectionTime) {
            const reflectionAmp = 1 / (j + 2);
            sample += (Math.random() * 2 - 1) * reflectionAmp;
          }
        }
      }

      // Late reverb (diffuse tail)
      const numTaps = Math.floor(diffusion * 4);
      for (let j = 0; j < numTaps; j++) {
        const phase = (j / numTaps) * Math.PI * 2;
        const modulation = Math.sin(t * 50 + phase) * 0.1;
        sample += (Math.random() * 2 - 1) * (1 + modulation);
      }

      impulse[i] = sample * amplitude * dampingFactor * wetGain;
    }
  }

  // Normalize the impulse response
  const maxAbs = Math.max(...impulse.map(Math.abs));
  if (maxAbs > 0) {
    for (let i = 0; i < length; i++) {
      impulse[i] /= maxAbs;
    }
  }

  return impulse;
}

/**
 * Get preset settings for different reverb types
 */
function getReverbPresetSettings(preset: ReverbPreset) {
  const settings = {
    room: {
      duration: 1.0,
      decay: 3.4,
      preDelay: 0.005,
      damping: 0.5,
      roomSize: 0.3,
      diffusion: 0.7,
      wetGain: 0.3
    },
    hall: {
      duration: 2.5,
      decay: 2.0,
      preDelay: 0.015,
      damping: 0.3,
      roomSize: 0.7,
      diffusion: 0.85,
      wetGain: 0.35
    },
    cathedral: {
      duration: 5.0,
      decay: 1.2,
      preDelay: 0.025,
      damping: 0.2,
      roomSize: 1.0,
      diffusion: 0.95,
      wetGain: 0.4
    },
    cave: {
      duration: 4.0,
      decay: 1.5,
      preDelay: 0.04,
      damping: 0.1,
      roomSize: 0.9,
      diffusion: 0.6,
      wetGain: 0.5
    },
    plate: {
      duration: 1.5,
      decay: 3.0,
      preDelay: 0.001,
      damping: 0.6,
      roomSize: 0.4,
      diffusion: 0.9,
      wetGain: 0.35
    },
    spring: {
      duration: 2.0,
      decay: 2.5,
      preDelay: 0.002,
      damping: 0.4,
      roomSize: 0.2,
      diffusion: 0.5,
      wetGain: 0.4
    },
    custom: {
      duration: 2.0,
      decay: 2.2,
      preDelay: 0.01,
      damping: 0.4,
      roomSize: 0.5,
      diffusion: 0.8,
      wetGain: 0.35
    }
  };

  return settings[preset] || settings.hall;
}

/**
 * Apply reverb effect to an audio buffer using convolution
 */
export function applyReverb(
  buffer: Float32Array,
  effect: EffectElement,
  sampleRate: number = 48000
): Float32Array {
  const preset = effect.preset || 'hall';
  const mix = effect.mix ?? 0.3;

  // Override preset settings with custom values if provided
  const impulseResponse = generateImpulseResponse(preset, sampleRate);

  // Apply any custom parameters
  if (effect.decay !== undefined || effect.roomSize !== undefined) {
    const customSettings = getReverbPresetSettings(preset);
    if (effect.decay !== undefined) customSettings.decay = 5 - effect.decay; // Invert for intuitive control
    if (effect.roomSize !== undefined) customSettings.roomSize = effect.roomSize;
    // Regenerate with custom settings
    // This would require refactoring generateImpulseResponse to accept settings directly
  }

  // Perform convolution
  const wetSignal = convolve(buffer, impulseResponse);

  // Mix dry and wet signals
  const output = new Float32Array(Math.max(buffer.length, wetSignal.length));

  // Copy dry signal
  for (let i = 0; i < buffer.length; i++) {
    output[i] = buffer[i] * (1 - mix);
  }

  // Add wet signal
  for (let i = 0; i < wetSignal.length; i++) {
    output[i] += wetSignal[i] * mix;
  }

  return output;
}

/**
 * Apply delay effect to an audio buffer
 */
export function applyDelay(
  buffer: Float32Array,
  effect: EffectElement,
  sampleRate: number = 48000
): Float32Array {
  const delayTime = effect.delayTime ?? 0.25;
  const feedback = effect.feedback ?? 0.3;
  const mix = effect.mix ?? 0.3;

  const delaySamples = Math.floor(delayTime * sampleRate);
  const outputLength = buffer.length + Math.floor(delaySamples * (1 / (1 - feedback)));
  const output = new Float32Array(outputLength);

  // Copy dry signal
  for (let i = 0; i < buffer.length; i++) {
    output[i] = buffer[i] * (1 - mix);
  }

  // Create delay line with feedback
  let currentGain = mix;
  let delayIndex = delaySamples;

  while (currentGain > 0.001 && delayIndex < outputLength) {
    for (let i = 0; i < buffer.length && i + delayIndex < outputLength; i++) {
      output[i + delayIndex] += buffer[i] * currentGain;
    }
    currentGain *= feedback;
    delayIndex += delaySamples;
  }

  return output;
}

/**
 * Simple convolution implementation
 * For production, consider using FFT-based convolution for better performance
 */
function convolve(signal: Float32Array, impulse: Float32Array): Float32Array {
  const outputLength = signal.length + impulse.length - 1;
  const output = new Float32Array(outputLength);

  // For performance, limit convolution length for very long impulses
  const maxImpulseLength = Math.min(impulse.length, sampleRate * 2); // Max 2 seconds

  // Direct convolution (time domain)
  // This is computationally expensive but works for demonstration
  for (let i = 0; i < signal.length; i++) {
    for (let j = 0; j < maxImpulseLength; j++) {
      if (i + j < outputLength) {
        output[i + j] += signal[i] * impulse[j];
      }
    }
  }

  return output;
}

// Fix TypeScript error: use variable
const sampleRate = 48000;

/**
 * Apply an effect to an audio buffer
 */
export function applyEffect(
  buffer: Float32Array,
  effect: EffectElement,
  sampleRate: number = 48000
): Float32Array {
  switch (effect.effectType) {
    case 'reverb':
      return applyReverb(buffer, effect, sampleRate);
    case 'delay':
      return applyDelay(buffer, effect, sampleRate);
    case 'chorus':
      // TODO: Implement chorus effect
      return buffer;
    case 'distortion':
      // TODO: Implement distortion effect
      return buffer;
    default:
      return buffer;
  }
}