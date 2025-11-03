/**
 * useSPAPlayer Hook - Complete SPA playback solution
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { SPAAudioEngine, EngineOptions } from '../engine/SPAAudioEngine';
import { useWebAudio } from './useWebAudio';
import { useSPALoader } from './useSPALoader';
import type { SPADocument } from '@spa-audio/types';

export interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  tempo: number;
  loop: boolean;
}

export interface UseSPAPlayerOptions extends EngineOptions {
  autoPlay?: boolean;
  preload?: boolean;
}

export function useSPAPlayer(initialUrl?: string, options: UseSPAPlayerOptions = {}) {
  const {
    autoPlay = false,
    preload = true,
    tempo = 120,
    masterVolume = 0.8,
    loop = false,
    onComplete,
  } = options;

  // Audio context and loader
  const webAudio = useWebAudio({ autoInit: preload });
  const loader = useSPALoader(initialUrl, { autoLoad: preload });

  // Engine and state refs
  const engineRef = useRef<SPAAudioEngine | null>(null);
  const pauseOffsetRef = useRef<number>(0);

  // Player state
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: masterVolume,
    tempo,
    loop,
  });

  // Initialize engine when context is ready
  useEffect(() => {
    if (webAudio.context && !engineRef.current) {
      engineRef.current = new SPAAudioEngine(webAudio.context, {
        tempo,
        masterVolume,
        loop,
        onComplete: () => {
          setState((prev) => ({
            ...prev,
            isPlaying: false,
            isPaused: false,
            currentTime: 0,
          }));
          onComplete?.();
        },
      });
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [webAudio.context, tempo, masterVolume, loop, onComplete]);

  // Calculate duration when document loads
  useEffect(() => {
    if (loader.document) {
      const duration = calculateDocumentDuration(loader.document);
      setState((prev) => ({ ...prev, duration }));
    }
  }, [loader.document]);

  // Update current time while playing
  useEffect(() => {
    let animationFrame: number;

    if (state.isPlaying && webAudio.context) {
      const updateTime = () => {
        setState((prev) => ({
          ...prev,
          currentTime: webAudio.currentTime,
        }));
        animationFrame = requestAnimationFrame(updateTime);
      };
      updateTime();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [state.isPlaying, webAudio]);

  // Play function
  const play = useCallback(
    async (document?: SPADocument) => {
      // Use provided document or loaded one
      const doc = document || loader.document;
      if (!doc) {
        console.error('No SPA document to play');
        return;
      }

      // Initialize context on first play (browser requirement)
      if (!webAudio.context) {
        await webAudio.initContext();
      }

      if (!engineRef.current && webAudio.context) {
        engineRef.current = new SPAAudioEngine(webAudio.context, {
          tempo: state.tempo,
          masterVolume: state.volume,
          loop: state.loop,
          onComplete: () => {
            setState((prev) => ({
              ...prev,
              isPlaying: false,
              isPaused: false,
              currentTime: 0,
            }));
            onComplete?.();
          },
        });
      }

      if (engineRef.current) {
        await webAudio.resume();

        // Start from pause offset if paused, otherwise from beginning
        const startOffset = state.isPaused ? pauseOffsetRef.current : 0;
        await engineRef.current.play(doc, startOffset);

        setState((prev) => ({
          ...prev,
          isPlaying: true,
          isPaused: false,
        }));

        webAudio.setIsPlaying(true);
      }
    },
    [loader.document, webAudio, state.tempo, state.volume, state.loop, state.isPaused, onComplete]
  );

  // Pause function
  const pause = useCallback(() => {
    if (engineRef.current && state.isPlaying) {
      pauseOffsetRef.current = engineRef.current.pause();
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: true,
      }));
      webAudio.setIsPlaying(false);
    }
  }, [state.isPlaying, webAudio]);

  // Stop function
  const stop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      pauseOffsetRef.current = 0;
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
      }));
      webAudio.setIsPlaying(false);
    }
  }, [webAudio]);

  // Toggle play/pause
  const toggle = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState((prev) => ({ ...prev, volume: clampedVolume }));

    if (engineRef.current) {
      engineRef.current.setVolume(clampedVolume);
    }
  }, []);

  // Set tempo
  const setTempo = useCallback((bpm: number) => {
    const clampedTempo = Math.max(20, Math.min(999, bpm));
    setState((prev) => ({ ...prev, tempo: clampedTempo }));

    if (engineRef.current) {
      engineRef.current.setTempo(clampedTempo);
    }
  }, []);

  // Set loop
  const setLoop = useCallback((shouldLoop: boolean) => {
    setState((prev) => ({ ...prev, loop: shouldLoop }));
  }, []);

  // Load a new SPA file
  const load = useCallback(
    async (url: string) => {
      stop();
      return loader.loadFromURL(url);
    },
    [stop, loader]
  );

  // Load from XML string
  const loadXML = useCallback(
    (xml: string) => {
      stop();
      return loader.loadFromXML(xml);
    },
    [stop, loader]
  );

  // Load from File
  const loadFile = useCallback(
    async (file: File) => {
      stop();
      return loader.loadFromFile(file);
    },
    [stop, loader]
  );

  // Seek to position
  const seek = useCallback(
    (position: number) => {
      if (state.duration > 0) {
        const clampedPosition = Math.max(0, Math.min(position, state.duration));
        pauseOffsetRef.current = clampedPosition;

        if (state.isPlaying && engineRef.current && loader.document) {
          engineRef.current.stop();
          engineRef.current.play(loader.document, clampedPosition);
        }

        setState((prev) => ({ ...prev, currentTime: clampedPosition }));
      }
    },
    [state.duration, state.isPlaying, loader.document]
  );

  // Auto-play when document loads
  useEffect(() => {
    if (autoPlay && loader.document && !state.isPlaying) {
      play(loader.document);
    }
  }, [autoPlay, loader.document, state.isPlaying, play]);

  return {
    // State
    ...state,
    document: loader.document,
    error: loader.error,
    isLoading: loader.isLoading,

    // Playback controls
    play,
    pause,
    stop,
    toggle,
    seek,

    // Settings
    setVolume,
    setTempo,
    setLoop,

    // Loading
    load,
    loadXML,
    loadFile,

    // Utility
    webAudio,
    loader,
  };
}

// Helper function to calculate document duration
function calculateDocumentDuration(document: SPADocument): number {
  let maxDuration = 0;

  const calculateSoundDuration = (sound: any): number => {
    switch (sound.type) {
      case 'tone':
      case 'noise':
        return sound.dur || 0;
      case 'group':
        return Math.max(...(sound.sounds || []).map(calculateSoundDuration));
      default:
        return 0;
    }
  };

  for (const sound of document.sounds || []) {
    maxDuration = Math.max(maxDuration, calculateSoundDuration(sound));
  }

  return maxDuration;
}

export default useSPAPlayer;
