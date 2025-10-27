# SPA Web

Official website and visual designer for SPA (Scalable Parametric Audio).

## Features

### Visual Sound Designer (Main Page)
- **Layer-based interface** - Build complex sounds by layering tones and noise
- **Real-time preview** - Hear changes instantly as you design
- **Visual ADSR editor** - Draw envelope curves with draggable points
- **Parameter automation** - Animate frequency, amplitude, and filters over time
- **Waveform visualization** - See your sound's waveform in real-time
- **Code generation** - Get clean SPA XML as you design
- **Export options** - Download as .spa file or export to .wav

### Additional Pages
- **Playground** - Write SPA code with live preview and syntax highlighting
- **Examples** - Browse and play 50+ example sounds with source code
- **Documentation** - Complete reference guide and tutorials
- **Why SPA?** - Learn about the benefits and use cases

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Code Editor**: Monaco Editor
- **Audio**: spa-audio library + Web Audio API
- **Language**: TypeScript

## Project Structure

```
spa-web/
├── app/                      # Next.js app directory
│   ├── page.tsx             # Main visual designer
│   ├── playground/          # Code playground
│   ├── examples/            # Example library
│   ├── docs/                # Documentation
│   └── why/                 # Why SPA? page
├── components/
│   ├── SoundDesigner/       # Visual designer components
│   │   ├── LayerPanel.tsx   # Sound layer controls
│   │   ├── ToneEditor.tsx   # Tone parameters
│   │   ├── NoiseEditor.tsx  # Noise parameters
│   │   ├── EnvelopeEditor.tsx # ADSR envelope editor
│   │   ├── Waveform.tsx     # Waveform display
│   │   └── SPAOutput.tsx    # Generated code display
│   ├── CodePlayground/      # Playground components
│   └── ExampleLibrary/      # Example browser
├── public/
│   └── examples/            # Static .spa files
└── lib/                     # Utility functions
```

## Key Features Implementation

### Visual ADSR Editor
- Canvas-based drawing with draggable control points
- Real-time curve calculation
- Preset patterns (pluck, pad, stab)
- Numeric input fallback for precision

### Parameter Automation
- Start/end value controls
- Curve type selection (linear, exp, log, smooth)
- Visual curve preview
- Real-time audio updates

### Waveform Visualization
- Web Audio API AnalyserNode for real-time data
- Canvas rendering at 60fps
- Zoom and pan controls
- Time ruler display

### Code Generation
- Real-time XML generation from visual parameters
- Syntax highlighting with Prism.js
- Copy to clipboard functionality
- File download as .spa

## Deployment

The site is designed to be deployed to Vercel or Netlify:

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

## Environment Variables

None required for basic operation. Optional:

- `NEXT_PUBLIC_ANALYTICS_ID` - Analytics tracking ID
- `NEXT_PUBLIC_API_URL` - API endpoint for community features (future)

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 14+
- Mobile browsers with Web Audio API support

## Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 2.5s
- Bundle size: < 200KB gzipped
- Sound rendering: < 10ms

## Related Projects

- [spa-spec](https://github.com/yourusername/spa-spec) - Official specification
- [spa-js](https://github.com/yourusername/spa-js) - Core JavaScript library
- [spa-react](https://github.com/yourusername/spa-react) - React component
- [spa-vscode](https://github.com/yourusername/spa-vscode) - VS Code extension

## License

MIT