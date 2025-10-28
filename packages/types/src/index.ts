/**
 * @spa.audio/types - Shared TypeScript types for SPA (Synthetic Parametric Audio)
 */

// ============================================================================
// Core Document Types
// ============================================================================

/**
 * Root SPA document structure
 */
export interface SPADocument {
  version: string;
  xmlns?: string;
  defs?: SPADefinitions;
  sounds: SPASound[];
}

/**
 * Reusable definitions within a document
 */
export interface SPADefinitions {
  envelopes: Record<string, ADSREnvelope>;
  filters?: Record<string, FilterConfig>;
}

// ============================================================================
// Sound Element Types
// ============================================================================

/**
 * Union type of all possible sound elements
 */
export type SPASound = ToneElement | NoiseElement | GroupElement | SequenceElement;

/**
 * Tone/Oscillator element
 */
export interface ToneElement {
  type: 'tone';
  id?: string;
  wave: WaveformType;
  freq: number | AutomationCurve | FrequencyModulation;
  dur: number;
  amp?: number | AutomationCurve;
  envelope?: ADSREnvelope | string; // string = reference to def
  pan?: number | AutomationCurve;
  filter?: FilterConfig | string;
  phase?: number;
  repeat?: number | 'infinite';
  repeatInterval?: number;
  repeatDelay?: number;
  repeatDecay?: number;
  repeatPitchShift?: number;
}

/**
 * Noise generator element
 */
export interface NoiseElement {
  type: 'noise';
  id?: string;
  color: NoiseColor;
  dur: number;
  amp?: number | AutomationCurve;
  envelope?: ADSREnvelope | string;
  pan?: number | AutomationCurve;
  filter?: FilterConfig | string;
  repeat?: number | 'infinite';
  repeatInterval?: number;
  repeatDelay?: number;
  repeatDecay?: number;
  repeatPitchShift?: number;
}

/**
 * Group element for layering sounds
 */
export interface GroupElement {
  type: 'group';
  id?: string;
  sounds: SPASound[];
  amp?: number;
  pan?: number;
  repeat?: number | 'infinite';
  repeatInterval?: number;
  repeatDelay?: number;
  repeatDecay?: number;
  repeatPitchShift?: number;
}

/**
 * Sequence element for timed sound sequences
 */
export interface SequenceElement {
  type: 'sequence';
  id?: string;
  elements: TimedSound[];
  loop?: boolean;
  tempo?: number; // BPM for beat-based timing
}

/**
 * Sound element with timing information for sequences
 */
export interface TimedSound {
  at: number; // Time in seconds when this element starts
  sound: ToneElement | NoiseElement | GroupElement;
}

// ============================================================================
// Parameter Types
// ============================================================================

/**
 * Repeat configuration for looping sounds
 */
export interface RepeatConfig {
  count: number | 'infinite';  // Number of repetitions
  interval: number;             // Time between repetitions in seconds
  delay?: number;               // Initial delay before first repetition
  decay?: number;               // Volume reduction per repeat (0-1)
  pitchShift?: number;          // Semitone shift per repeat
}

/**
 * ADSR Envelope configuration
 */
export interface ADSREnvelope {
  attack: number;  // Time in seconds to reach peak
  decay: number;   // Time in seconds to fall to sustain
  sustain: number; // Level to hold (0.0-1.0)
  release: number; // Time in seconds to fade to silence
}

/**
 * Parameter automation over time
 */
export interface AutomationCurve {
  start: number;
  end: number;
  curve: CurveType;
  duration?: number; // Optional explicit duration
}

/**
 * Multi-point automation (for complex curves)
 */
export interface ComplexAutomation {
  keys: AutomationKeyframe[];
}

/**
 * Single keyframe in complex automation
 */
export interface AutomationKeyframe {
  at: number;       // Time in seconds
  value: number;    // Parameter value
  curve?: CurveType; // Interpolation to next keyframe
}

/**
 * Frequency modulation for vibrato/FM synthesis
 */
export interface FrequencyModulation {
  base: number;
  modulator?: {
    freq: number;
    depth: number;
    wave?: WaveformType;
  };
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Filter configuration
 */
export interface FilterConfig {
  type: FilterType;
  cutoff: number | AutomationCurve;
  resonance?: number | AutomationCurve;
  gain?: number; // For peaking/shelf filters
  detune?: number; // Frequency detune in cents
}

// ============================================================================
// Enum Types
// ============================================================================

/**
 * Available waveform types for oscillators
 */
export type WaveformType = 'sine' | 'square' | 'triangle' | 'saw' | 'pulse' | 'custom';

/**
 * Available noise colors
 */
export type NoiseColor = 'white' | 'pink' | 'brown' | 'blue' | 'violet' | 'grey';

/**
 * Available filter types
 */
export type FilterType =
  | 'lowpass'
  | 'highpass'
  | 'bandpass'
  | 'bandstop'
  | 'notch'
  | 'allpass'
  | 'peaking'
  | 'lowshelf'
  | 'highshelf';

/**
 * Automation curve interpolation types
 */
export type CurveType = 'linear' | 'exp' | 'log' | 'smooth' | 'step' | 'ease-in' | 'ease-out';

// ============================================================================
// Rendering Types
// ============================================================================

/**
 * Options for rendering SPA to audio
 */
export interface RenderOptions {
  sampleRate?: number;     // Default: 48000
  channels?: number;        // Default: 2 (stereo)
  bitDepth?: number;        // Default: 16
  format?: AudioFormat;     // Default: 'float32'
  normalize?: boolean;      // Default: true
  masterVolume?: number;    // Default: 1.0
  offline?: boolean;        // Use offline context for faster rendering
}

/**
 * Audio format options
 */
export type AudioFormat = 'float32' | 'int16' | 'int24' | 'int32';

/**
 * Rendered audio result
 */
export interface RenderResult {
  buffer: AudioBuffer;
  duration: number;
  sampleRate: number;
  channels: number;
}

// ============================================================================
// Parsing Types
// ============================================================================

/**
 * Options for parsing SPA XML
 */
export interface ParseOptions {
  validate?: boolean;        // Validate against schema
  resolveReferences?: boolean; // Resolve def references
  strict?: boolean;          // Strict parsing mode
  allowComments?: boolean;   // Allow XML comments
}

/**
 * Parse result with optional validation errors
 */
export interface ParseResult {
  document?: SPADocument;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation error structure
 */
export interface ValidationError {
  type: 'error';
  code: string;
  message: string;
  line?: number;
  column?: number;
  element?: string;
  attribute?: string;
}

/**
 * Validation warning structure
 */
export interface ValidationWarning {
  type: 'warning';
  code: string;
  message: string;
  line?: number;
  column?: number;
  element?: string;
  attribute?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Deep partial type helper
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Options for creating sound elements programmatically
 */
export interface SoundOptions {
  tone?: Partial<ToneElement>;
  noise?: Partial<NoiseElement>;
  group?: Partial<GroupElement>;
}

/**
 * Web Audio API context options
 */
export interface AudioContextOptions {
  latencyHint?: 'balanced' | 'interactive' | 'playback';
  sampleRate?: number;
}

// ============================================================================
// Export groups for convenience
// ============================================================================

export * from './index';

// Type guards
export function isToneElement(sound: SPASound): sound is ToneElement {
  return sound.type === 'tone';
}

export function isNoiseElement(sound: SPASound): sound is NoiseElement {
  return sound.type === 'noise';
}

export function isGroupElement(sound: SPASound): sound is GroupElement {
  return sound.type === 'group';
}

export function isSequenceElement(sound: SPASound): sound is SequenceElement {
  return sound.type === 'sequence';
}

export function isAutomationCurve(value: any): value is AutomationCurve {
  return value && typeof value === 'object' && 'start' in value && 'end' in value;
}

// Default values
export const DEFAULT_ENVELOPE: ADSREnvelope = {
  attack: 0,
  decay: 0,
  sustain: 1,
  release: 0
};

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  sampleRate: 48000,
  channels: 2,
  bitDepth: 16,
  format: 'float32',
  normalize: true,
  masterVolume: 1.0,
  offline: false
};

export const DEFAULT_PARSE_OPTIONS: ParseOptions = {
  validate: true,
  resolveReferences: true,
  strict: false,
  allowComments: true
};