/**
 * ProgressBar Component - Shows playback progress with seek functionality
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';

export interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const calculateTime = useCallback((clientX: number): number => {
    if (!progressRef.current) return 0;

    const rect = progressRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return percentage * duration;
  }, [duration]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const time = calculateTime(e.clientX);
    onSeek(time);
  }, [calculateTime, onSeek]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const time = calculateTime(e.clientX);
    setHoverTime(time);
  }, [calculateTime]);

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const time = calculateTime(e.clientX);
      onSeek(time);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, calculateTime, onSeek]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`spa-progress ${className} ${isDragging ? 'dragging' : ''}`}
      ref={progressRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="spa-progress-track">
        <div
          className="spa-progress-fill"
          style={{ width: `${progress}%` }}
        />

        {hoverTime !== null && (
          <div
            className="spa-progress-hover"
            style={{
              left: `${(hoverTime / duration) * 100}%`,
              opacity: 0.5
            }}
          />
        )}

        <div
          className="spa-progress-handle"
          style={{ left: `${progress}%` }}
        />
      </div>

      {hoverTime !== null && (
        <div
          className="spa-progress-tooltip"
          style={{
            left: `${(hoverTime / duration) * 100}%`,
            transform: 'translateX(-50%)'
          }}
        >
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;