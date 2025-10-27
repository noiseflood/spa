/**
 * useWebAudio Hook - Manages Web Audio API context and provides audio utilities
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebAudioState {
  context: AudioContext | null;
  isInitialized: boolean;
  isPlaying: boolean;
  currentTime: number;
  sampleRate: number;
}

export interface UseWebAudioOptions {
  autoInit?: boolean;
  latencyHint?: AudioContextLatencyCategory;
  sampleRate?: number;
}

export function useWebAudio(options: UseWebAudioOptions = {}) {
  const {
    autoInit = false,
    latencyHint = 'interactive',
    sampleRate
  } = options;

  const contextRef = useRef<AudioContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const animationFrameRef = useRef<number>();

  // Initialize audio context
  const initContext = useCallback(async () => {
    if (contextRef.current) return contextRef.current;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }

      const contextOptions: AudioContextOptions = { latencyHint };
      if (sampleRate) {
        contextOptions.sampleRate = sampleRate;
      }

      contextRef.current = new AudioContextClass(contextOptions);

      // Resume context if suspended (required for some browsers)
      if (contextRef.current.state === 'suspended') {
        await contextRef.current.resume();
      }

      setIsInitialized(true);
      return contextRef.current;
    } catch (error) {
      console.error('Failed to initialize Web Audio context:', error);
      throw error;
    }
  }, [latencyHint, sampleRate]);

  // Clean up on unmount
  useEffect(() => {
    if (autoInit) {
      initContext();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (contextRef.current) {
        contextRef.current.close();
      }
    };
  }, [autoInit, initContext]);

  // Update current time while playing
  useEffect(() => {
    if (isPlaying && contextRef.current) {
      const updateTime = () => {
        if (contextRef.current) {
          setCurrentTime(contextRef.current.currentTime);
          animationFrameRef.current = requestAnimationFrame(updateTime);
        }
      };
      updateTime();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isPlaying]);

  // Resume context (for browsers that require user interaction)
  const resume = useCallback(async () => {
    if (!contextRef.current) {
      await initContext();
    }

    if (contextRef.current?.state === 'suspended') {
      await contextRef.current.resume();
    }
  }, [initContext]);

  // Suspend context
  const suspend = useCallback(async () => {
    if (contextRef.current?.state === 'running') {
      await contextRef.current.suspend();
    }
  }, []);

  // Get analyzer node for visualization
  const createAnalyzer = useCallback((fftSize = 2048) => {
    if (!contextRef.current) {
      throw new Error('Audio context not initialized');
    }

    const analyzer = contextRef.current.createAnalyser();
    analyzer.fftSize = fftSize;
    return analyzer;
  }, []);

  // Create gain node for volume control
  const createGain = useCallback((initialValue = 1) => {
    if (!contextRef.current) {
      throw new Error('Audio context not initialized');
    }

    const gain = contextRef.current.createGain();
    gain.gain.value = initialValue;
    return gain;
  }, []);

  // Create compressor for dynamics
  const createCompressor = useCallback(() => {
    if (!contextRef.current) {
      throw new Error('Audio context not initialized');
    }

    return contextRef.current.createDynamicsCompressor();
  }, []);

  return {
    context: contextRef.current,
    isInitialized,
    isPlaying,
    currentTime,
    sampleRate: contextRef.current?.sampleRate || 0,
    initContext,
    resume,
    suspend,
    createAnalyzer,
    createGain,
    createCompressor,
    setIsPlaying
  };
}

export default useWebAudio;