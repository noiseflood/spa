# @spa.audio/react

React components and hooks for playing SPA (Synthetic Parametric Audio) files using the Web Audio API.

## Features

- **Complete Player Component** - Full-featured audio player with transport controls
- **Web Audio Hooks** - Low-level hooks for custom implementations
- **SPA File Support** - Load and play .spa files from URLs or inline XML
- **Real-time Synthesis** - Generate audio in real-time using oscillators and noise generators
- **Effects & Filters** - Support for ADSR envelopes, filters, and automation curves
- **TypeScript Support** - Fully typed for excellent DX

## Installation

```bash
npm install spa-react spa-audio
```

Note: `spa-audio` is a peer dependency and must be installed separately.

## Quick Start

### Using the Component

```jsx
import { SPASound } from 'spa-react';

function App() {
  return (
    <div>
      {/* Inline SPA */}
      <SPASound autoPlay>
        {`<spa version="1.0">
          <tone wave="sine" freq="800" dur="0.05"
                envelope="0,0.02,0,0.03"/>
        </spa>`}
      </SPASound>

      {/* Load from file */}
      <SPASound src="/sounds/click.spa" />

      {/* With event handlers */}
      <SPASound
        src="/sounds/notification.spa"
        onLoad={() => console.log('Sound loaded')}
        onPlay={() => console.log('Sound played')}
        onError={(err) => console.error('Error:', err)}
      />
    </div>
  );
}
```

### Using the Hook

```jsx
import { useSPA } from 'spa-react';

function Button() {
  const { play, stop, isPlaying } = useSPA(`
    <spa version="1.0">
      <tone wave="sine" freq="800" dur="0.05"
            envelope="0,0.02,0,0.03"/>
    </spa>
  `);

  return (
    <button onClick={play}>
      {isPlaying ? 'Playing...' : 'Click Me'}
    </button>
  );
}
```

### Programmatic Playback

```jsx
import { useSPA } from 'spa-react';

function GameComponent({ score }) {
  const { play } = useSPA();

  useEffect(() => {
    // Dynamic sound based on score
    const frequency = 400 + (score * 10);
    play(`
      <spa version="1.0">
        <tone wave="sine" freq="${frequency}" dur="0.1"/>
      </spa>
    `);
  }, [score, play]);

  return <div>Score: {score}</div>;
}
```

## API Reference

### `<SPASound />` Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `string` | - | Inline SPA XML content |
| `src` | `string` | - | URL to .spa file |
| `autoPlay` | `boolean` | `false` | Play immediately on mount |
| `loop` | `boolean` | `false` | Loop the sound |
| `volume` | `number` | `1.0` | Volume (0.0 to 1.0) |
| `onLoad` | `() => void` | - | Called when sound is loaded |
| `onPlay` | `() => void` | - | Called when playback starts |
| `onEnd` | `() => void` | - | Called when playback ends |
| `onError` | `(error: Error) => void` | - | Called on error |

### `useSPA` Hook

```typescript
const {
  play,       // (spa?: string) => Promise<void>
  stop,       // () => void
  pause,      // () => void
  resume,     // () => void
  isPlaying,  // boolean
  isLoaded,   // boolean
  error,      // Error | null
  duration,   // number (seconds)
} = useSPA(initialSPA?: string);
```

## Examples

### Button Click Sound

```jsx
import { SPASound } from 'spa-react';

function ClickButton({ onClick, children }) {
  return (
    <button onClick={onClick}>
      {children}
      <SPASound autoPlay>
        {`<spa version="1.0">
          <tone wave="sine" freq="800" dur="0.05"
                envelope="0,0.02,0,0.03"/>
        </spa>`}
      </SPASound>
    </button>
  );
}
```

### Form Validation Feedback

```jsx
import { useSPA } from 'spa-react';

function Form() {
  const successSound = useSPA(`
    <spa version="1.0">
      <group>
        <tone wave="sine" freq="523" dur="0.15" envelope="0,0.05,0.3,0.1"/>
        <tone wave="sine" freq="659" dur="0.3" envelope="0,0.1,0.5,0.2"/>
      </group>
    </spa>
  `);

  const errorSound = useSPA(`
    <spa version="1.0">
      <group>
        <tone wave="square" freq="400" dur="0.15" envelope="0,0.05,0.5,0.1"/>
        <tone wave="square" freq="350" dur="0.15" envelope="0,0.05,0.5,0.1"/>
      </group>
    </spa>
  `);

  const handleSubmit = async (data) => {
    try {
      await submitForm(data);
      successSound.play();
    } catch (error) {
      errorSound.play();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### Game Sound Effects

```jsx
import { useSPA } from 'spa-react';

function Game() {
  const sounds = {
    jump: useSPA(`
      <spa version="1.0">
        <tone wave="square" dur="0.2"
              freq.start="400" freq.end="600" freq.curve="smooth"
              envelope="0,0.05,0.3,0.1"/>
      </spa>
    `),
    coin: useSPA(`
      <spa version="1.0">
        <tone wave="square" dur="0.3"
              freq.start="988" freq.end="1319" freq.curve="linear"
              envelope="0,0.1,0.2,0.1"/>
      </spa>
    `),
    laser: useSPA(`
      <spa version="1.0">
        <group>
          <tone wave="saw" dur="0.3"
                freq.start="1200" freq.end="200" freq.curve="exp"
                envelope="0,0.1,0,0.2"/>
          <noise color="white" dur="0.1" amp="0.3"
                 envelope="0,0.05,0,0.05"/>
        </group>
      </spa>
    `)
  };

  const handleJump = () => {
    sounds.jump.play();
    // game logic
  };

  const handleCoinCollect = () => {
    sounds.coin.play();
    // game logic
  };

  return (
    <div>
      {/* game UI */}
    </div>
  );
}
```

## TypeScript

Full TypeScript support is included:

```typescript
import { SPASound, SPASoundProps, useSPA, UseSPAReturn } from 'spa-react';

const props: SPASoundProps = {
  src: '/sound.spa',
  autoPlay: true,
  onLoad: () => console.log('Loaded'),
};

const hook: UseSPAReturn = useSPA();
```

## Performance

- Components are memoized to prevent unnecessary re-renders
- Sounds are cached after first play
- Web Audio contexts are properly managed and cleaned up
- No UI rendering overhead - pure audio functionality

## Browser Support

Same as spa-audio:
- Chrome/Edge 66+
- Firefox 61+
- Safari 14.1+
- Opera 53+

## Related Projects

- [spa-spec](https://github.com/yourusername/spa-spec) - Official specification
- [spa-audio](https://github.com/yourusername/spa-js) - Core JavaScript library
- [spa-web](https://spa.audio) - Visual designer and playground
- [spa-vue](https://github.com/yourusername/spa-vue) - Vue integration
- [spa-vscode](https://github.com/yourusername/spa-vscode) - VS Code extension

## License

MIT