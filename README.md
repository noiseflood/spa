# SPA - Synthetic Parametric Audio
## The SVG of Sound Effects

A declarative XML format for procedural sound effects on the web.

---

## 🏗️ Monorepo Structure

This is a monorepo managed with pnpm workspaces containing all SPA packages:

```
spa/
├── packages/
│   ├── core/              # @spa-audio/core - Core JS library (parser + renderer)
│   └── react/             # @spa-audio/react - React component integration
├── apps/
│   └── web/               # @spa-audio/web - Website with visual designer
├── docs/                  # Documentation
│   ├── SPEC.md           # Technical specification
│   ├── QUICKSTART.md     # 5-minute tutorial
│   └── ROADMAP.md        # Implementation roadmap
├── examples/              # Example .spa files
│   ├── ui/               # UI sounds
│   ├── forms/            # Form validation
│   ├── game/             # Game effects
│   └── ambient/          # Atmospheric sounds
└── schema/               # JSON Schema for validation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+ (`npm install -g pnpm`)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/spa.git
cd spa

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development
```bash
# Run all packages in dev mode
pnpm dev

# Run specific package
pnpm web:dev    # Website with visual designer
pnpm core:test  # Run core library tests
```

## 📦 Packages

### @spa-audio/core
Core JavaScript library for parsing and rendering SPA files.
- **Zero dependencies** - Uses native Web Audio API
- **< 20KB gzipped**
- **TypeScript support**
- Renders sounds in < 10ms

```javascript
import { renderSPA, playSPA } from '@spa-audio/core';

// Play a simple click sound
await playSPA(`
  <spa xmlns="https://spa.audio/ns" version="1.0">
    <tone wave="sine" freq="800" dur="0.05"
          envelope="0,0.02,0,0.03"/>
  </spa>
`);
```

### @spa-audio/react
React component for easy SPA integration.

```jsx
import { SPASound } from '@spa-audio/react';

function Button() {
  return (
    <button>
      Click Me
      <SPASound autoPlay>
        {`<spa xmlns="https://spa.audio/ns" version="1.0">
          <tone wave="sine" freq="800" dur="0.05"/>
        </spa>`}
      </SPASound>
    </button>
  );
}
```

### @spa-audio/web
Visual designer and documentation website.
- **Visual Sound Designer** - Build sounds with a GUI
- **Live Playground** - Write and test SPA code
- **Example Library** - 50+ ready-to-use sounds
- **Documentation** - Complete reference

## 💡 The Big Idea

**Problem:** Web developers need sound effects but WAV/MP3 files are huge, static, and non-parametric.

**Solution:** SPA - a tiny XML format that describes sounds procedurally, just like SVG describes graphics.

**Example:**
```xml
<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="800" dur="0.05" envelope="0,0.02,0,0.03"/>
</spa>
```

- **File size:** 80 bytes
- **Equivalent WAV:** 9.6 KB
- **Savings:** 120x smaller

## 🎯 Why SPA?

### 1. Tiny File Sizes
50-100x smaller than WAV/MP3 for simple sounds

### 2. Parametric
```javascript
// Dynamic pitch based on user score
const freq = 400 + (score * 10);
playSPA(`<tone wave="sine" freq="${freq}" dur="0.1"/>`);
```

### 3. No Network Requests
Inline sounds directly in your HTML/JS

### 4. AI-Friendly
LLMs can generate SPA syntax easily

```
Here is a comprehensive guide to composing audio in SPA: 
<paste (docs/SPA_LLM_PROMPT.md)>

Can you compose a sound effect that sounds like a tidal wave?
```

## 📚 Documentation

- [Technical Specification](docs/SPEC.md) - Complete format reference
- [Quick Start Guide](docs/QUICKSTART.md) - Learn SPA in 5 minutes
- [Roadmap](docs/ROADMAP.md) - Development timeline
- [Build Instructions](docs/BUILD_INSTRUCTIONS.md) - Detailed implementation guide

## 🎵 Example Sounds

```xml
<!-- Button Click -->
<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="800" dur="0.05"
        envelope="0,0.02,0,0.03"/>
</spa>

<!-- Laser Effect -->
<spa xmlns="https://spa.audio/ns" version="1.0">
  <group>
    <tone wave="saw" dur="0.3"
          freq.start="1200" freq.end="200" freq.curve="exp"
          envelope="0,0.1,0,0.2"/>
    <noise color="white" dur="0.1" amp="0.3"/>
  </group>
</spa>

<!-- Success Chime -->
<spa xmlns="https://spa.audio/ns" version="1.0">
  <group>
    <tone wave="sine" freq="523" dur="0.15"/>
    <tone wave="sine" freq="659" dur="0.3"/>
  </group>
</spa>

<!-- Heartbeat (NEW: Using repeat!) -->
<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="60" dur="0.1"
        repeat="100" repeat.interval="0.8"
        envelope="0.01,0.05,0.3,0.1"/>
</spa>

<!-- Echo Effect (NEW: With decay and pitch shift!) -->
<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="440" dur="0.2"
        repeat="8" repeat.interval="0.15"
        repeat.decay="0.3" repeat.pitchShift="-2"
        envelope="0.01,0.05,0.5,0.1"/>
</spa>

<!-- Musical Melody (NEW: Using sequence!) -->
<spa xmlns="https://spa.audio/ns" version="1.0">
  <sequence>
    <tone wave="sine" freq="261.63" dur="0.2" at="0"/>
    <tone wave="sine" freq="329.63" dur="0.2" at="0.25"/>
    <tone wave="sine" freq="392" dur="0.2" at="0.5"/>
    <tone wave="sine" freq="523.25" dur="0.4" at="0.75"/>
  </sequence>
</spa>
```

## 🛠️ Development

### Commands
```bash
pnpm dev          # Run all packages in dev mode
pnpm build        # Build all packages
pnpm test         # Run all tests
pnpm lint         # Lint all packages
pnpm typecheck    # Type check all packages
```

### Package-Specific Commands
```bash
pnpm --filter @spa-audio/core test     # Test core library
pnpm --filter @spa-audio/web dev       # Run website locally
pnpm --filter @spa-audio/react build   # Build React component
```

## 📈 Roadmap

### Phase 1: MVP (Weeks 1-4)
- ✅ Core library (parser + renderer)
- ✅ Basic website with visual designer
- ✅ 20+ example sounds
- ⬜ npm package published

### Phase 2: Polish (Weeks 5-8)
- ⬜ VS Code extension
- ⬜ Vue integration
- ⬜ CLI tools
- ⬜ 50+ example sounds

### Phase 3: Growth (Months 3-6)
- ⬜ Community sound library
- ⬜ AI integration
- ⬜ Browser DevTools support
- ⬜ W3C proposal

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines (coming soon).

## 📄 License

MIT

## 🔗 Links

- [Website](https://spa.audio) (coming soon)
- [NPM Package](https://www.npmjs.com/package/@spa-audio/core) (coming soon)
- [Discord Community](https://discord.gg/spa-audio) (coming soon)

---

**Let's make web audio better.** 🔊