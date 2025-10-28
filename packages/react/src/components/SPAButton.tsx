/**
 * SPAButton Component - Simple button that plays a SPA sound on click
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { SPAAudioEngine } from '../engine/SPAAudioEngine';
import { useWebAudio } from '../hooks/useWebAudio';
import { parseSPA } from '@spa-audio/core';
import type { SPADocument } from '@spa-audio/types';

export interface SPAButtonProps {
  src?: string;           // URL to SPA file
  spa?: string;           // Inline SPA XML
  document?: SPADocument; // Pre-parsed SPA document
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  onPlay?: () => void;
  onError?: (error: Error) => void;
}

export const SPAButton: React.FC<SPAButtonProps> = ({
  src,
  spa,
  document,
  children,
  className = '',
  disabled = false,
  onClick,
  onPlay,
  onError
}) => {
  const webAudio = useWebAudio();
  const engineRef = useRef<SPAAudioEngine | null>(null);
  const documentRef = useRef<SPADocument | null>(document || null);

  // Load SPA from URL if provided
  useEffect(() => {
    if (!src) return;

    fetch(src)
      .then(res => res.text())
      .then(xml => {
        documentRef.current = parseSPA(xml);
      })
      .catch(error => {
        console.error('Failed to load SPA file:', error);
        onError?.(error);
      });
  }, [src, onError]);

  // Parse inline SPA if provided
  useEffect(() => {
    if (!spa) return;

    try {
      documentRef.current = parseSPA(spa);
    } catch (error) {
      console.error('Failed to parse SPA:', error);
      onError?.(error as Error);
    }
  }, [spa, onError]);

  // Initialize engine when context is ready
  useEffect(() => {
    if (webAudio.context && !engineRef.current) {
      engineRef.current = new SPAAudioEngine(webAudio.context, {
        masterVolume: 0.8
      });
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [webAudio.context]);

  const handleClick = useCallback(async () => {
    // Call onClick handler
    onClick?.();

    // Play sound
    if (!documentRef.current) {
      console.error('No SPA document to play');
      return;
    }

    try {
      // Initialize context on first user interaction
      if (!webAudio.context) {
        await webAudio.initContext();
      }

      if (!engineRef.current && webAudio.context) {
        engineRef.current = new SPAAudioEngine(webAudio.context, {
          masterVolume: 0.8
        });
      }

      if (engineRef.current) {
        await webAudio.resume();
        await engineRef.current.play(documentRef.current);
        onPlay?.();
      }
    } catch (error) {
      console.error('Failed to play SPA:', error);
      onError?.(error as Error);
    }
  }, [webAudio, onClick, onPlay, onError]);

  return (
    <button
      className={`spa-button ${className}`}
      onClick={handleClick}
      disabled={disabled || (!src && !spa && !document)}
    >
      {children}
    </button>
  );
};

export default SPAButton;