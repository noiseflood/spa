/**
 * @spa-audio/core - Core library for parsing and rendering SPA (Synthetic Parametric Audio)
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
  SequenceElement,
  ADSREnvelope,
  AutomationCurve,
  FilterConfig,
  RenderOptions,
  RenderResult,
  ParseOptions,
  ParseResult,
  ValidationResult
} from '@spa-audio/types';

/**
 * Global sound manager for efficient playback
 */
class SPAPlayer {
  private audioContext: AudioContext | null = null;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private lastPlayTime: Map<string, number> = new Map();
  private maxConcurrentSounds = 10;
  private throttleMs = 30; // Minimum time between same sound plays

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      if (typeof window === 'undefined') {
        throw new Error('playSPA requires a browser environment with Web Audio API');
      }
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  async play(
    xml: string,
    options?: import('@spa-audio/types').RenderOptions
  ): Promise<void> {
    // Throttle: prevent same sound from playing too rapidly
    const now = Date.now();
    const lastPlay = this.lastPlayTime.get(xml) || 0;
    if (now - lastPlay < this.throttleMs) {
      return;
    }
    this.lastPlayTime.set(xml, now);

    // Limit concurrent sounds to prevent audio device errors
    if (this.activeSources.size >= this.maxConcurrentSounds) {
      // Stop oldest sound
      const oldest = this.activeSources.values().next().value;
      if (oldest) {
        try {
          oldest.stop();
        } catch (e) {
          // Already stopped
        }
        this.activeSources.delete(oldest);
      }
    }

    try {
      const ctx = this.getAudioContext();

      // Resume context if suspended (required for user interaction)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Get or render audio buffer (with caching)
      let buffer = this.bufferCache.get(xml);
      if (!buffer) {
        const { renderSPA } = await import('./renderer');
        buffer = await renderSPA(xml, { ...options, sampleRate: ctx.sampleRate });
        // Cache only if XML is reasonably small (< 10KB)
        if (xml.length < 10000) {
          this.bufferCache.set(xml, buffer);
        }
      }

      // Create and play source
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      // Track active source
      this.activeSources.add(source);

      // Clean up when done
      source.onended = () => {
        this.activeSources.delete(source);
      };

      source.start(0);

      // Return promise that resolves when playback ends
      return new Promise<void>((resolve) => {
        source.onended = () => {
          this.activeSources.delete(source);
          resolve();
        };
      });
    } catch (error) {
      console.error('Error playing SPA:', error);
      throw error;
    }
  }

  /**
   * Clear cached buffers to free memory
   */
  clearCache(): void {
    this.bufferCache.clear();
  }

  /**
   * Stop all currently playing sounds
   */
  stopAll(): void {
    this.activeSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.activeSources.clear();
  }

  /**
   * Clean up all resources (call when done)
   */
  cleanup(): void {
    this.stopAll();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.bufferCache.clear();
    this.lastPlayTime.clear();
  }
}

// Global player instance
const globalPlayer = new SPAPlayer();

/**
 * Play SPA directly through the default audio output
 *
 * Features:
 * - Shared AudioContext for efficient resource usage
 * - Automatic caching of small sounds for instant playback
 * - Throttling to prevent audio spam
 * - Concurrent playback limiting to prevent device errors
 * - Automatic cleanup of finished sounds
 *
 * @param xml - SPA XML string to play
 * @param options - Render options
 * @returns Promise that resolves when playback completes
 */
export async function playSPA(
  xml: string,
  options?: import('@spa-audio/types').RenderOptions
): Promise<void> {
  return globalPlayer.play(xml, options);
}

/**
 * Stop all currently playing sounds
 */
export function stopAllSounds(): void {
  globalPlayer.stopAll();
}

/**
 * Clear the sound cache to free memory
 */
export function clearSoundCache(): void {
  globalPlayer.clearCache();
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
  validate,
  stopAll: stopAllSounds,
  clearCache: clearSoundCache
} as const;

// Export SPA namespace as named export only (no default export to avoid rollup warnings)