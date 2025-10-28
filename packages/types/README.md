# @spa.audio/types

Shared TypeScript type definitions for SPA (Synthetic Parametric Audio).

## Installation

```bash
npm install @spa.audio/types
```

## Usage

```typescript
import type {
  SPADocument,
  ToneElement,
  NoiseElement,
  ADSREnvelope
} from '@spa.audio/types';

// Use the types
const tone: ToneElement = {
  type: 'tone',
  wave: 'sine',
  freq: 440,
  dur: 1.0,
  envelope: {
    attack: 0.01,
    decay: 0.2,
    sustain: 0.3,
    release: 0.5
  }
};
```

## Available Types

### Core Document Types
- `SPADocument` - Root document structure
- `SPADefinitions` - Reusable definitions
- `SPASound` - Union type of all sound elements

### Element Types
- `ToneElement` - Oscillator/tone configuration
- `NoiseElement` - Noise generator configuration
- `GroupElement` - Sound layering configuration

### Parameter Types
- `ADSREnvelope` - Attack/Decay/Sustain/Release envelope
- `AutomationCurve` - Parameter automation over time
- `FilterConfig` - Filter configuration
- `WaveformType` - Valid waveform types
- `NoiseColor` - Valid noise colors
- `FilterType` - Valid filter types

### Utility Types
- `RenderOptions` - Audio rendering options
- `ParseOptions` - XML parsing options
- `ValidationError` - Validation error structure

## License

MIT