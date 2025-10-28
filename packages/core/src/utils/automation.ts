/**
 * Parameter automation utilities
 */

import type { AutomationCurve, CurveType } from '@spa.audio/types';

/**
 * Apply automation curve to a buffer
 */
export function applyAutomation(
  buffer: Float32Array,
  automation: AutomationCurve,
  duration: number,
  sampleRate: number
): Float32Array {
  const result = new Float32Array(buffer.length);
  const numSamples = buffer.length;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = Math.min(1, t / duration);
    const value = interpolate(
      automation.start,
      automation.end,
      progress,
      automation.curve
    );
    result[i] = buffer[i] * value;
  }

  return result;
}

/**
 * Interpolate between two values using a curve
 */
export function interpolate(
  start: number,
  end: number,
  progress: number,
  curve: CurveType = 'linear'
): number {
  switch (curve) {
    case 'linear':
      return start + (end - start) * progress;

    case 'exp':
    case 'exponential':
      // Exponential curve (fast start, slow end)
      if (start === 0) start = 0.001; // Avoid log(0)
      return start * Math.pow(end / start, progress);

    case 'log':
    case 'logarithmic':
      // Logarithmic curve (slow start, fast end)
      return start + (end - start) * Math.log1p(progress * 9) / Math.log(10);

    case 'smooth':
    case 'ease-in-out':
      // Smooth S-curve (ease-in-out)
      const t = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      return start + (end - start) * t;

    case 'ease-in':
      // Quadratic ease in
      return start + (end - start) * progress * progress;

    case 'ease-out':
      // Quadratic ease out
      return start + (end - start) * (1 - Math.pow(1 - progress, 2));

    case 'step':
      // Step function (instant change at midpoint)
      return progress < 0.5 ? start : end;

    default:
      return start + (end - start) * progress;
  }
}

/**
 * Generate automation points for a curve
 */
export function generateAutomationPoints(
  automation: AutomationCurve,
  numPoints: number
): number[] {
  const points: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    const progress = i / (numPoints - 1);
    points.push(interpolate(
      automation.start,
      automation.end,
      progress,
      automation.curve
    ));
  }

  return points;
}

/**
 * Create an LFO (Low Frequency Oscillator) for modulation
 */
export function createLFO(
  frequency: number,
  depth: number,
  duration: number,
  sampleRate: number,
  waveform: 'sine' | 'triangle' | 'square' = 'sine'
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const lfo = new Float32Array(numSamples);
  const phaseIncrement = frequency / sampleRate;
  let phase = 0;

  for (let i = 0; i < numSamples; i++) {
    let value = 0;

    switch (waveform) {
      case 'sine':
        value = Math.sin(2 * Math.PI * phase);
        break;
      case 'triangle':
        value = 1 - 4 * Math.abs(phase - 0.5);
        break;
      case 'square':
        value = phase < 0.5 ? 1 : -1;
        break;
    }

    lfo[i] = 1 + (value * depth);
    phase = (phase + phaseIncrement) % 1.0;
  }

  return lfo;
}