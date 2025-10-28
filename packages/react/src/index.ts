/**
 * @spa-audio/react - React integration for SPA (Synthetic Parametric Audio)
 */

// Hooks
export { useWebAudio } from './hooks/useWebAudio';
export { useSPALoader } from './hooks/useSPALoader';
export { useSPAPlayer } from './hooks/useSPAPlayer';

// Components
export { SPAPlayer } from './components/SPAPlayer';
export { SPAButton } from './components/SPAButton';
export { TransportControls } from './components/TransportControls';
export { VolumeControl } from './components/VolumeControl';
export { ProgressBar } from './components/ProgressBar';
export { FileUploader } from './components/FileUploader';

// Engine
export { SPAAudioEngine } from './engine/SPAAudioEngine';

// Types
export type {
  WebAudioState,
  UseWebAudioOptions
} from './hooks/useWebAudio';

export type {
  SPALoaderState,
  UseSPALoaderOptions
} from './hooks/useSPALoader';

export type {
  PlayerState,
  UseSPAPlayerOptions
} from './hooks/useSPAPlayer';

export type {
  EngineOptions,
  ScheduledSound
} from './engine/SPAAudioEngine';

export type {
  SPAPlayerProps
} from './components/SPAPlayer';

export type {
  SPAButtonProps
} from './components/SPAButton';

export type {
  TransportControlsProps
} from './components/TransportControls';

export type {
  VolumeControlProps
} from './components/VolumeControl';

export type {
  ProgressBarProps
} from './components/ProgressBar';

export type {
  FileUploaderProps
} from './components/FileUploader';

// Re-export core functionality
export { parseSPA } from '@spa-audio/core';

// Re-export types from @spa-audio/types
export type {
  SPADocument,
  SPASound,
  ToneElement,
  NoiseElement,
  GroupElement,
  ADSREnvelope,
  AutomationCurve,
  FilterConfig,
  WaveformType,
  NoiseColor,
  FilterType
} from '@spa-audio/types';