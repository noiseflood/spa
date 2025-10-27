/**
 * SPAPlayer Component - Complete SPA audio player with controls
 */

import React, { useCallback, useState } from 'react';
import { useSPAPlayer } from '../hooks/useSPAPlayer';
import { TransportControls } from './TransportControls';
import { VolumeControl } from './VolumeControl';
import { ProgressBar } from './ProgressBar';
import { FileUploader } from './FileUploader';

export interface SPAPlayerProps {
  src?: string;
  autoPlay?: boolean;
  showUpload?: boolean;
  showTempo?: boolean;
  showLoop?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export const SPAPlayer: React.FC<SPAPlayerProps> = ({
  src,
  autoPlay = false,
  showUpload = true,
  showTempo = true,
  showLoop = true,
  className = '',
  onPlay,
  onPause,
  onStop,
  onComplete,
  onError
}) => {
  const player = useSPAPlayer(src, {
    autoPlay,
    onComplete
  });

  const [isDragging, setIsDragging] = useState(false);

  // Handle play with callback
  const handlePlay = useCallback(() => {
    player.play();
    onPlay?.();
  }, [player, onPlay]);

  // Handle pause with callback
  const handlePause = useCallback(() => {
    player.pause();
    onPause?.();
  }, [player, onPause]);

  // Handle stop with callback
  const handleStop = useCallback(() => {
    player.stop();
    onStop?.();
  }, [player, onStop]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      await player.loadFile(file);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [player, onError]);

  // Handle URL input
  const handleURLLoad = useCallback(async (url: string) => {
    try {
      await player.load(url);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [player, onError]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`spa-player ${className}`}>
      {/* File Upload Area */}
      {showUpload && (
        <FileUploader
          onFileSelect={handleFileUpload}
          onURLSubmit={handleURLLoad}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
        />
      )}

      {/* Main Player */}
      {player.document && (
        <div className="spa-player-main">
          {/* Progress Bar */}
          <ProgressBar
            currentTime={player.currentTime}
            duration={player.duration}
            onSeek={player.seek}
          />

          {/* Time Display */}
          <div className="spa-player-time">
            <span className="current-time">{formatTime(player.currentTime)}</span>
            <span className="separator">/</span>
            <span className="total-time">{formatTime(player.duration)}</span>
          </div>

          {/* Transport Controls */}
          <TransportControls
            isPlaying={player.isPlaying}
            isPaused={player.isPaused}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
          />

          {/* Volume Control */}
          <VolumeControl
            volume={player.volume}
            onVolumeChange={player.setVolume}
          />

          {/* Additional Controls */}
          <div className="spa-player-extras">
            {showTempo && (
              <div className="tempo-control">
                <label htmlFor="tempo">Tempo:</label>
                <input
                  id="tempo"
                  type="range"
                  min="20"
                  max="300"
                  value={player.tempo}
                  onChange={(e) => player.setTempo(Number(e.target.value))}
                />
                <span>{player.tempo} BPM</span>
              </div>
            )}

            {showLoop && (
              <div className="loop-control">
                <label>
                  <input
                    type="checkbox"
                    checked={player.loop}
                    onChange={(e) => player.setLoop(e.target.checked)}
                  />
                  Loop
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {player.isLoading && (
        <div className="spa-player-loading">
          <div className="spinner"></div>
          <span>Loading SPA file...</span>
        </div>
      )}

      {/* Error State */}
      {player.error && (
        <div className="spa-player-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{player.error.message}</span>
        </div>
      )}
    </div>
  );
};

export default SPAPlayer;