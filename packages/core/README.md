# spa-audio

Core JavaScript library for parsing and rendering SPA (Synthetic Parametric Audio) files.

## Features

- **Tiny**: < 20KB gzipped
- **Fast**: Renders sounds in < 10ms
- **Zero Dependencies**: Uses native Web Audio API
- **TypeScript Support**: Full type definitions included
- **Universal**: Works in browsers and Node.js

## Installation

```bash
npm install spa-audio
```

## Quick Start

```javascript
import { renderSPA, playSPA } from 'spa-audio';

// Play a simple click sound
await playSPA(`
  <spa version="1.0">
    <tone wave="sine" freq="800" dur="0.05"
          envelope="0,0.02,0,0.03"/>
  </spa>
`);

// Render to AudioBuffer for reuse
const buffer = await renderSPA(`
  <spa version="1.0">
    <tone wave="sine" freq="440" dur="1.0"/>
  </spa>
`);

// Play the buffer multiple times
const ctx = new AudioContext();
const source = ctx.createBufferSource();
source.buffer = buffer;
source.connect(ctx.destination);
source.start();
```

## API Reference

### `renderSPA(xml, options?)`

Renders SPA XML to an AudioBuffer.

```javascript
const buffer = await renderSPA(spaXML, {
  sampleRate: 48000,  // default: 48000
  channels: 2         // default: 2 (stereo)
});
```

### `playSPA(xml, options?)`

Plays SPA XML directly through the default audio output.

```javascript
await playSPA(spaXML);
```

### `parseSPA(xml)`

Parses SPA XML into a JavaScript object (AST).

```javascript
const ast = parseSPA(spaXML);
console.log(ast);
// { version: '1.0', sounds: [...] }
```

### `validate(xml)`

Validates SPA XML against the schema.

```javascript
const errors = validate(spaXML);
if (errors.length === 0) {
  console.log('Valid SPA!');
} else {
  console.error('Validation errors:', errors);
}
```

## Dynamic Sound Generation

Generate sounds parametrically:

```javascript
function createNotification(frequency, duration) {
  return `
    <spa version="1.0">
      <tone wave="sine" freq="${frequency}" dur="${duration}"
            envelope="0,0.05,0.6,0.15"/>
    </spa>
  `;
}

// Higher pitch for success
await playSPA(createNotification(880, 0.2));

// Lower pitch for error
await playSPA(createNotification(400, 0.3));
```

## Layering Sounds

Create complex effects with groups:

```javascript
const laserSound = `
  <spa version="1.0">
    <group>
      <tone wave="saw" dur="0.3"
            freq.start="1000" freq.end="200" freq.curve="exp"
            envelope="0,0.1,0,0.2"/>
      <noise color="white" dur="0.1" amp="0.3"
             envelope="0,0.05,0,0.05"/>
    </group>
  </spa>
`;

await playSPA(laserSound);
```

## Browser Support

- Chrome/Edge 66+
- Firefox 61+
- Safari 14.1+
- Opera 53+

Requires Web Audio API support.

## Node.js Usage

For server-side rendering or testing:

```javascript
// Node.js environment will use a Web Audio API polyfill
const { renderSPA } = require('spa-audio');

const buffer = await renderSPA(spaXML);
// Returns a Float32Array in Node.js
```

## Performance

Typical render times:
- Simple tone: < 1ms
- Complex layered sound: < 10ms
- 10 layered tones: < 15ms

## Examples

See the [spa-spec](https://github.com/yourusername/spa-spec) repository for a complete library of example sounds.

## Related Projects

- [spa-spec](https://github.com/yourusername/spa-spec) - Official specification
- [spa-web](https://spa.audio) - Visual designer and playground
- [spa-react](https://github.com/yourusername/spa-react) - React integration
- [spa-vscode](https://github.com/yourusername/spa-vscode) - VS Code extension

## License

MIT