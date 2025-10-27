/**
 * TransportControls Component - Play, Pause, Stop buttons
 */

import React from 'react';

export interface TransportControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  className?: string;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  isPlaying,
  isPaused,
  onPlay,
  onPause,
  onStop,
  className = ''
}) => {
  return (
    <div className={`spa-transport ${className}`}>
      {!isPlaying ? (
        <button
          className="spa-transport-play"
          onClick={onPlay}
          aria-label={isPaused ? 'Resume' : 'Play'}
          title={isPaused ? 'Resume' : 'Play'}
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </button>
      ) : (
        <button
          className="spa-transport-pause"
          onClick={onPause}
          aria-label="Pause"
          title="Pause"
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor" />
          </svg>
        </button>
      )}

      <button
        className="spa-transport-stop"
        onClick={onStop}
        aria-label="Stop"
        title="Stop"
        disabled={!isPlaying && !isPaused}
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M6 6h12v12H6z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
};

export default TransportControls;