/**
 * @spa.audio/core - Core library for parsing and rendering SPA (Synthetic Parametric Audio)
 */

export { parseSPA } from './parser';
export { renderSPA, renderToBuffer } from './renderer';
export { validate, validateSPA } from './validator';

// Re-export types
export type {
  SPADocument,
  SPASound,
  ToneElement,
  NoiseElement,
  GroupElement,
  ADSREnvelope,
  AutomationCurve,
  FilterConfig,
  RenderOptions,
  RenderResult,
  ParseOptions,
  ParseResult,
  ValidationResult
} from '@spa.audio/types';

/**
 * Play SPA directly through the default audio output
 */
export async function playSPA(
  xml: string,
  options?: import('@spa.audio/types').RenderOptions
): Promise<void> {
  const { renderSPA } = await import('./renderer');
  const buffer = await renderSPA(xml, options);

  if (typeof window === 'undefined') {
    throw new Error('playSPA requires a browser environment with Web Audio API');
  }

  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);

  // Return a promise that resolves when playback ends
  return new Promise((resolve) => {
    source.onended = () => {
      resolve();
      ctx.close();
    };
  });
}

/**
 * Main SPA API
 */
import { parseSPA as parse } from './parser';
import { renderSPA as render } from './renderer';
import { validateSPA as validate } from './validator';

export const SPA = {
  parse,
  render,
  play: playSPA,
  validate
} as const;

// Default export
export default SPA;