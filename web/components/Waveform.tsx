import { ToneElement, NoiseElement } from '@spa-audio/core';

interface WaveformLayer {
  id: number;
  sound: ToneElement | NoiseElement;
}

interface WaveformProps {
  layers: WaveformLayer[];
  currentNodeId: number | null;
  onLayerClick?: (id: number) => void;
  height?: number;
}

export default function Waveform({
  layers,
  currentNodeId,
  onLayerClick,
  height = 96,
}: WaveformProps) {
  if (layers.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-green-500/50 text-xs font-mono">NO SIGNAL</p>
      </div>
    );
  }

  const maxTime = Math.max(
    1,
    ...layers.map((l) => {
      const s = l.sound;
      const at = (s as any).at || 0;
      const dur = s.type === 'tone' || s.type === 'noise' ? s.dur : 1;
      return at + dur;
    })
  );

  const centerY = height / 2;
  const baseAmplitude = height / 4.4;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 1000 ${height}`}
      preserveAspectRatio="none"
      className="w-full h-full"
    >
      {layers.map((layer) => {
        const isActive = layer.id === currentNodeId;
        const sound = layer.sound;
        const startTime = (sound as any).at || 0;
        const duration = sound.type === 'tone' || sound.type === 'noise' ? sound.dur : 1;

        const startX = (startTime / maxTime) * 1000;
        const endX = ((startTime + duration) / maxTime) * 1000;
        const width = endX - startX;
        const samples = Math.max(50, Math.floor(width / 5));

        const points: string[] = [];

        for (let i = 0; i <= samples; i++) {
          const x = startX + (i / samples) * width;
          const progress = i / samples;
          let y = centerY;

          let amplitude = baseAmplitude;
          if (sound.type === 'tone' || sound.type === 'noise') {
            const envelope = sound.envelope;
            const env =
              typeof envelope === 'object'
                ? envelope
                : { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 };
            const amp = typeof sound.amp === 'number' ? sound.amp : 1;

            const attackEnd = env.attack / duration;
            const decayEnd = (env.attack + env.decay) / duration;
            const releaseStart = 1 - env.release / duration;

            let envValue = 1;
            if (progress < attackEnd) {
              envValue = progress / attackEnd;
            } else if (progress < decayEnd) {
              const decayProg = (progress - attackEnd) / (decayEnd - attackEnd);
              envValue = 1 - (1 - env.sustain) * decayProg;
            } else if (progress < releaseStart) {
              envValue = env.sustain;
            } else {
              const releaseProg = (progress - releaseStart) / (1 - releaseStart);
              envValue = env.sustain * (1 - releaseProg);
            }

            amplitude *= envValue * amp;
          }

          if (sound.type === 'tone') {
            const tone = sound as ToneElement;
            const freq = typeof tone.freq === 'number' ? tone.freq : 440;
            const cycles = (freq / 100) * progress * duration;

            if (tone.wave === 'sine') {
              y = centerY + Math.sin(cycles * Math.PI * 2) * amplitude;
            } else if (tone.wave === 'square') {
              y = centerY + (Math.sin(cycles * Math.PI * 2) > 0 ? amplitude : -amplitude);
            } else if (tone.wave === 'saw') {
              y = centerY + ((cycles % 1) * 2 - 1) * amplitude;
            } else if (tone.wave === 'triangle') {
              const t = (cycles % 1) * 4;
              y = centerY + (t < 1 ? t : t < 3 ? 2 - t : t - 4) * amplitude;
            }
          } else if (sound.type === 'noise') {
            y = centerY + (Math.random() * 2 - 1) * amplitude;
          }

          points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
        }

        const pathData = points.join(' ');

        return (
          <g
            key={layer.id}
            onClick={() => onLayerClick?.(layer.id)}
            style={{ cursor: onLayerClick ? 'pointer' : 'default' }}
          >
            <path
              d={pathData}
              stroke={isActive ? '#22c55e' : 'rgba(34, 197, 94, 0.4)'}
              strokeWidth={isActive ? 2 : 1}
              fill="none"
              style={{ filter: 'drop-shadow(0 0 3px currentColor)' }}
            />
          </g>
        );
      })}
      {/* Grid lines */}
      <line
        x1="0"
        y1={centerY}
        x2="1000"
        y2={centerY}
        stroke="rgba(34, 197, 94, 0.1)"
        strokeWidth="1"
      />
      <line
        x1="0"
        y1={centerY - height / 4}
        x2="1000"
        y2={centerY - height / 4}
        stroke="rgba(34, 197, 94, 0.05)"
        strokeWidth="1"
      />
      <line
        x1="0"
        y1={centerY + height / 4}
        x2="1000"
        y2={centerY + height / 4}
        stroke="rgba(34, 197, 94, 0.05)"
        strokeWidth="1"
      />
    </svg>
  );
}
