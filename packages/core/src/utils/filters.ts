/**
 * Filter utilities
 */

import type { FilterConfig, FilterType } from '@spa-audio/types';

/**
 * Apply filter to buffer using biquad filters
 */
export function applyFilter(
  buffer: Float32Array,
  filter: FilterConfig,
  sampleRate: number
): Float32Array {
  // Check if we have automation
  const hasAutomation = typeof filter.cutoff === 'object' && 'start' in filter.cutoff;
  
  if (!hasAutomation && typeof filter.resonance !== 'object') {
    // Simple case - static filter
    const coeffs = calculateBiquadCoefficients(filter, sampleRate);
    return applyBiquad(buffer, coeffs);
  }
  
  // Complex case - time-varying filter
  return applyTimeVaryingFilter(buffer, filter, sampleRate);
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

/**
 * Apply time-varying filter with automation
 */
function applyTimeVaryingFilter(
  buffer: Float32Array,
  filter: FilterConfig,
  sampleRate: number
): Float32Array {
  const filtered = new Float32Array(buffer.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  
  const duration = buffer.length / sampleRate;
  const updateInterval = 64; // Update coefficients every N samples
  
  for (let i = 0; i < buffer.length; i++) {
    // Update coefficients periodically
    if (i % updateInterval === 0) {
      const progress = i / buffer.length;
      const currentTime = progress * duration;
      
      // Calculate current cutoff frequency
      let currentCutoff: number;
      if (typeof filter.cutoff === 'number') {
        currentCutoff = filter.cutoff;
      } else {
        const { start, end, curve = 'linear' } = filter.cutoff;
        currentCutoff = interpolateValue(start, end, progress, curve);
      }
      
      // Calculate current resonance
      let currentResonance = 1.0;
      if (typeof filter.resonance === 'number') {
        currentResonance = filter.resonance;
      } else if (filter.resonance && typeof filter.resonance === 'object') {
        const { start, end, curve = 'linear' } = filter.resonance;
        currentResonance = interpolateValue(start, end, progress, curve);
      }
      
      // Create temporary filter config with current values
      const currentFilter: FilterConfig = {
        type: filter.type,
        cutoff: currentCutoff,
        resonance: currentResonance,
        gain: filter.gain
      };
      
      const coeffs = calculateBiquadCoefficients(currentFilter, sampleRate);
      
      // Apply filter for this block
      const blockEnd = Math.min(i + updateInterval, buffer.length);
      for (let j = i; j < blockEnd; j++) {
        const x0 = buffer[j];
        const y0 = coeffs.b0 * x0 + coeffs.b1 * x1 + coeffs.b2 * x2
                   - coeffs.a1 * y1 - coeffs.a2 * y2;
        
        filtered[j] = y0;
        
        x2 = x1;
        x1 = x0;
        y2 = y1;
        y1 = y0;
      }
      
      // Skip ahead
      i = blockEnd - 1;
    }
  }
  
  return filtered;
}

/**
 * Interpolate value based on curve type
 */
function interpolateValue(
  start: number,
  end: number,
  progress: number,
  curve: 'linear' | 'exp' | 'log' | 'smooth'
): number {
  switch (curve) {
    case 'linear':
      return start + (end - start) * progress;
      
    case 'exp':
      // Exponential (fast start, slow end)
      const expProgress = 1 - Math.pow(1 - progress, 3);
      return start + (end - start) * expProgress;
      
    case 'log':
      // Logarithmic (slow start, fast end)
      const logProgress = Math.pow(progress, 3);
      return start + (end - start) * logProgress;
      
    case 'smooth':
      // Smooth ease-in-ease-out (S-curve)
      const smoothProgress = progress * progress * (3 - 2 * progress);
      return start + (end - start) * smoothProgress;
      
    default:
      return start + (end - start) * progress;
  }
}