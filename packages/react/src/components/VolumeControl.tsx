/**
 * VolumeControl Component - Volume slider with mute button
 */

import React, { useCallback, useState } from 'react';

export interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  onVolumeChange,
  className = '',
}) => {
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [isMuted, setIsMuted] = useState(volume === 0);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = Number(e.target.value);
      onVolumeChange(newVolume);
      setIsMuted(newVolume === 0);
      if (newVolume > 0) {
        setPreviousVolume(newVolume);
      }
    },
    [onVolumeChange]
  );

  const toggleMute = useCallback(() => {
    if (isMuted) {
      onVolumeChange(previousVolume || 0.5);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  }, [isMuted, volume, previousVolume, onVolumeChange]);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path
            d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
            fill="currentColor"
          />
        </svg>
      );
    } else if (volume < 0.5) {
      return (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M7 9v6h4l5 5V4l-5 5H7z" fill="currentColor" />
        </svg>
      );
    } else {
      return (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path
            d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
            fill="currentColor"
          />
        </svg>
      );
    }
  };

  return (
    <div className={`spa-volume ${className}`}>
      <button
        className="spa-volume-mute"
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {getVolumeIcon()}
      </button>

      <input
        className="spa-volume-slider"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
        aria-label="Volume"
        title={`Volume: ${Math.round(volume * 100)}%`}
      />

      <span className="spa-volume-value">{Math.round(volume * 100)}%</span>
    </div>
  );
};

export default VolumeControl;
