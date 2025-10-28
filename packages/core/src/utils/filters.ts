/**
 * Filter utilities
 */

import type { FilterConfig, FilterType } from '@spa-audio/types';

/**
 * Apply filter to buffer (simplified implementation)
 * Real implementation would use biquad filters
 */
export function applyFilter(
  buffer: Float32Array,
  filter: FilterConfig,
  sampleRate: number
): Float32Array {
  // For now, return unmodified buffer
  // Real implementation would apply biquad filtering
  return buffer;

  // TODO: Implement actual filtering using biquad coefficients
  // const filtered = new Float32Array(buffer.length);
  // const coeffs = calculateBiquadCoefficients(filter, sampleRate);
  // return applyBiquad(buffer, coeffs);
}

/**
 * Calculate biquad filter coefficients
 */
export function calculateBiquadCoefficients(
  filter: FilterConfig,
  sampleRate: number
): BiquadCoefficients {
  const freq = typeof filter.cutoff === 'number' ? filter.cutoff : filter.cutoff.start;
  const Q = filter.resonance || 1.0;
  const gain = filter.gain || 0;

  // Normalized frequency
  const omega = 2 * Math.PI * freq / sampleRate;
  const sin = Math.sin(omega);
  const cos = Math.cos(omega);
  const alpha = sin / (2 * Q);

  let b0 = 1, b1 = 0, b2 = 0;
  let a0 = 1, a1 = 0, a2 = 0;

  switch (filter.type) {
    case 'lowpass':
      b0 = (1 - cos) / 2;
      b1 = 1 - cos;
      b2 = (1 - cos) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;

    case 'highpass':
      b0 = (1 + cos) / 2;
      b1 = -(1 + cos);
      b2 = (1 + cos) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;

    case 'bandpass':
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;

    default:
      // Allpass (no filtering)
      break;
  }

  // Normalize coefficients
  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0
  };
}

/**
 * Apply biquad filter to buffer
 */
export function applyBiquad(
  buffer: Float32Array,
  coeffs: BiquadCoefficients
): Float32Array {
  const filtered = new Float32Array(buffer.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;

  for (let i = 0; i < buffer.length; i++) {
    const x0 = buffer[i];
    const y0 = coeffs.b0 * x0 + coeffs.b1 * x1 + coeffs.b2 * x2
               - coeffs.a1 * y1 - coeffs.a2 * y2;

    filtered[i] = y0;

    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }

  return filtered;
}

interface BiquadCoefficients {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}