/**
 * Noise generation utilities
 */

import type { NoiseColor } from '@spa-audio/types';

/**
 * Generate noise
 */
export function generateNoise(
  color: NoiseColor | string,
  duration: number,
  sampleRate: number
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const buffer = new Float32Array(numSamples);

  switch (color) {
    case 'white':
      return generateWhiteNoise(numSamples);
    case 'pink':
      return generatePinkNoise(numSamples);
    case 'brown':
    case 'red':
      return generateBrownNoise(numSamples);
    case 'blue':
      return generateBlueNoise(numSamples);
    case 'violet':
    case 'purple':
      return generateVioletNoise(numSamples);
    case 'grey':
    case 'gray':
      return generateGreyNoise(numSamples);
    default:
      return generateWhiteNoise(numSamples);
  }
}

/**
 * Generate white noise (equal energy at all frequencies)
 */
export function generateWhiteNoise(numSamples: number): Float32Array {
  const buffer = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    buffer[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Generate pink noise (1/f noise)
 * Using the Voss-McCartney algorithm
 */
export function generatePinkNoise(numSamples: number): Float32Array {
  const buffer = new Float32Array(numSamples);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

  for (let i = 0; i < numSamples; i++) {
    const white = Math.random() * 2 - 1;

    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;

    buffer[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    buffer[i] *= 0.11; // Normalize
    b6 = white * 0.115926;
  }

  return buffer;
}

/**
 * Generate brown/red noise (Brownian noise)
 * Integrated white noise
 */
export function generateBrownNoise(numSamples: number): Float32Array {
  const buffer = new Float32Array(numSamples);
  let lastOut = 0;

  for (let i = 0; i < numSamples; i++) {
    const white = Math.random() * 2 - 1;
    buffer[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = buffer[i];
    buffer[i] *= 3.5; // Normalize
  }

  return buffer;
}

/**
 * Generate blue noise (opposite of pink noise)
 * Differentiated white noise
 */
export function generateBlueNoise(numSamples: number): Float32Array {
  const buffer = new Float32Array(numSamples);
  let lastSample = 0;

  for (let i = 0; i < numSamples; i++) {
    const white = Math.random() * 2 - 1;
    buffer[i] = white - lastSample;
    lastSample = white;
    buffer[i] *= 0.5; // Normalize
  }

  return buffer;
}

/**
 * Generate violet/purple noise (opposite of brown noise)
 * Double differentiated white noise
 */
export function generateVioletNoise(numSamples: number): Float32Array {
  const buffer = new Float32Array(numSamples);
  let lastSample = 0;
  let lastDiff = 0;

  for (let i = 0; i < numSamples; i++) {
    const white = Math.random() * 2 - 1;
    const diff = white - lastSample;
    buffer[i] = diff - lastDiff;
    lastSample = white;
    lastDiff = diff;
    buffer[i] *= 0.25; // Normalize
  }

  return buffer;
}

/**
 * Generate grey noise (perceptually flat)
 * Simplified version - true grey noise requires psychoacoustic shaping
 */
export function generateGreyNoise(numSamples: number): Float32Array {
  // For simplicity, using pink noise as approximation
  // True grey noise requires A-weighting curve
  return generatePinkNoise(numSamples);
}