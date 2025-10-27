# SPA - Scalable Parametric Audio
## Format Specification v1.0

### Overview

SPA (Scalable Parametric Audio) is a declarative, XML-based file format for defining simple synthesized sound effects. Inspired by SVG's approach to vector graphics, SPA provides a human-readable, text-based format for generating audio procedurally rather than storing raw waveform data.

**Key Features:**
- Declarative syntax (describe what you want, not how to generate it)
- Human-readable XML format
- Lightweight and text-based
- Easy for AI and humans to generate
- Perfect for simple sound effects and UI sounds

**What SPA Is NOT:**
- Not for complex music composition (use MIDI, MusicXML)
- Not for speech synthesis (use SSML)
- Not for sample playback (use SFZ, SF2)
- Not a replacement for audio editors

---

## Target Use Case: Web Audio SFX

SPA is designed specifically for **web developers** building interactive web applications that need simple sound effects.

### Primary Use Cases

**1. UI/UX Sounds**
- Button clicks, hovers, toggles
- Form validation feedback (success/error)
- Navigation sounds (page transitions, menu opens)
- Notification alerts
- Loading indicators

**2. Web Games (HTML5/JavaScript)**
- Simple arcade-style sound effects
- UI feedback in web-based games
- Placeholder sounds during prototyping
- Lightweight casual games where bundle size matters

**3. Interactive Web Experiences**
- Data sonification (convert data to sound)
- Educational/tutorial applications
- Accessible audio feedback
- Generative/procedural audio art

**4. Progressive Web Apps (PWAs)**
- Offline-capable sound effects
- Minimal bundle size for mobile
- Dynamic sound generation based on user actions

### Why SPA for Web Audio?

**File Size Savings:**
- Traditional: 50 UI sounds = ~500KB-1MB (compressed WAV/MP3)
- SPA: 50 UI sounds = ~5-10KB (XML text)
- **50-100x smaller** with gzip compression

**Dynamic & Parametric:**
```javascript
// Adjust pitch based on user action
const pitch = 400 + (score * 10);
const clickSound = `<tone wave="sine" freq="${pitch}" dur="0.05"/>`;
playSPA(clickSound);
```

**No HTTP Requests:**
- Inline tiny SPA sounds directly in HTML/JS
- No network latency for sound loading
- Perfect for snappy UI feedback

**Cacheable & Compressible:**
- Text compresses extremely well
- Browser caches work efficiently
- Service workers can intercept and modify

**AI-Generated:**
- Large language models can generate SPA syntax
- "Make me a laser sound" → instant SPA code
- No need for sound designers for simple effects

### Web Audio API Integration

SPA is designed to integrate seamlessly with the Web Audio API:

```javascript
import { renderSPA } from 'spa-audio';

// Render SPA to AudioBuffer
const buffer = await renderSPA(`
  <spa version="1.0">
    <tone wave="sine" freq="800" dur="0.05"/>
  </spa>
`);

// Play through Web Audio API
const ctx = new AudioContext();
const source = ctx.createBufferSource();
source.buffer = buffer;
source.connect(ctx.destination);
source.start();
```

**Browser Support:**
- Works anywhere Web Audio API works (all modern browsers)
- No plugins or native extensions required
- Degrades gracefully (silent fallback)

### When NOT to Use SPA

**Use traditional audio files (WAV/MP3) when:**
- You need realistic sounds (human voices, acoustic instruments)
- Sound quality matters more than file size
- You have existing audio assets
- You need complex layered production
- The sound is longer than ~5 seconds

**Use sample-based formats (SFZ) when:**
- You're building a musical instrument
- You need realistic instrument sounds
- You're creating a sampler-based experience

**Use MIDI when:**
- You need musical notation
- You're scoring full compositions
- You need external synthesizer control

SPA occupies the sweet spot: **simple, synthetic sound effects for web applications where file size and parametric control matter.**

---

## File Structure

### Basic Document
```xml
<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="http://spa.audio/ns" version="1.0">
  <!-- Sound elements go here -->
</spa>
```

**File Extension:** `.spa`  
**MIME Type:** `audio/spa+xml`

### With Reusable Definitions
```xml
<spa xmlns="http://spa.audio/ns" version="1.0">
  <defs>
    <!-- Reusable envelopes, filters, etc. -->
    <envelope id="pluck" attack="0.01" decay="0.2" sustain="0.3" release="0.5"/>
    <envelope id="pad" attack="0.5" decay="0.3" sustain="0.7" release="1.0"/>
  </defs>
  
  <tone wave="sine" freq="440" dur="1.0" envelope="#pluck"/>
</spa>
```

---

## Core Sound Elements

### 1. Tone (Oscillator)

Generates periodic waveforms.

```xml
<tone wave="sine|square|triangle|saw" 
      freq="440" 
      dur="1.0"
      amp="1.0"
      envelope="0.01,0.2,0.3,0.5"/>
```

**Required Attributes:**
- `wave` - Waveform type: `sine`, `square`, `triangle`, `saw`
- `freq` - Frequency in Hz (or use `note` attribute for musical notes)
- `dur` - Duration in seconds

**Optional Attributes:**
- `amp` - Amplitude/volume (0.0-1.0, default: 1.0)
- `envelope` - ADSR envelope (see Envelopes section)
- `pan` - Stereo panning (-1.0 left, 0 center, 1.0 right, default: 0)

**Examples:**
```xml
<!-- Simple 440Hz sine wave for 1 second -->
<tone wave="sine" freq="440" dur="1.0"/>

<!-- Plucked sound with fast attack/decay -->
<tone wave="triangle" freq="330" dur="0.5" 
      envelope="0.01,0.1,0.2,0.1"/>

<!-- Quieter tone panned left -->
<tone wave="saw" freq="220" dur="2.0" 
      amp="0.5" pan="-0.7"/>
```

### 2. Noise

Generates noise (random waveforms).

```xml
<noise color="white|pink|brown" 
       dur="1.0"
       amp="1.0"
       envelope="0.01,0.1,0,0.2"/>
```

**Required Attributes:**
- `color` - Noise type: `white`, `pink`, `brown`
- `dur` - Duration in seconds

**Optional Attributes:**
- `amp` - Amplitude (0.0-1.0, default: 1.0)
- `envelope` - ADSR envelope
- `pan` - Stereo panning

**Noise Types:**
- `white` - Equal energy at all frequencies (hiss)
- `pink` - More low-frequency energy (natural sound)
- `brown` - Even more low-frequency energy (rumble)

**Examples:**
```xml
<!-- Short white noise burst (hi-hat) -->
<noise color="white" dur="0.1" envelope="0,0.05,0,0.05"/>

<!-- Pink noise with slow fade (wind) -->
<noise color="pink" dur="3.0" envelope="0.5,0.5,0.8,1.0"/>
```

### 3. Group

Layers multiple sound elements together.

```xml
<group id="explosion">
  <noise color="white" dur="0.1" envelope="0,0.05,0,0.05"/>
  <tone wave="sine" freq="50" dur="0.5" envelope="0,0.2,0,0.3"/>
</group>
```

**Optional Attributes:**
- `id` - Identifier for referencing

**Notes:**
- All child elements play simultaneously
- Children inherit no attributes from parent (each is independent)
- Groups can contain tones, noise, and nested groups

**Example - Complex Sound Effect:**
```xml
<group id="laser">
  <!-- Main tone sweep -->
  <tone wave="saw" dur="0.3"
        freq.start="1000" freq.end="200" freq.curve="exp"
        envelope="0,0.1,0,0.2"/>
  
  <!-- Harmonic -->
  <tone wave="sine" dur="0.3"
        freq.start="2000" freq.end="400" freq.curve="exp"
        amp="0.3"
        envelope="0,0.1,0,0.2"/>
  
  <!-- Noise layer -->
  <noise color="white" dur="0.3"
         amp="0.2"
         envelope="0,0.1,0,0.2"/>
</group>
```

---

## Envelopes (ADSR)

Envelopes control how a sound's amplitude changes over time.

**ADSR Parameters:**
- **A**ttack - Time to reach peak (seconds)
- **D**ecay - Time to fall to sustain level (seconds)
- **S**ustain - Level to hold (0.0-1.0, as fraction of amp)
- **R**elease - Time to fade to silence after note ends (seconds)

### Inline Envelope
```xml
<tone wave="sine" freq="440" dur="1.0" 
      envelope="0.01,0.2,0.3,0.5"/>
      <!-- attack, decay, sustain, release -->
```

### Referenced Envelope
```xml
<defs>
  <envelope id="pluck" attack="0.01" decay="0.2" sustain="0.3" release="0.5"/>
</defs>

<tone wave="sine" freq="440" dur="1.0" envelope="#pluck"/>
```

### Default Envelope
If no envelope specified: `envelope="0,0,1,0"` (instant on/off, full sustain)

**Common Envelope Shapes:**
```xml
<!-- Plucked/percussive: fast attack, quick decay -->
envelope="0.01,0.1,0.2,0.1"

<!-- Pad/sustained: slow attack, long release -->
envelope="0.5,0.3,0.7,1.0"

<!-- Stab/accent: instant attack, no sustain -->
envelope="0,0.1,0,0.1"

<!-- Gate (square): instant on/off -->
envelope="0,0,1,0"
```

---

## Parameter Automation

Any numeric parameter can be automated using `.start`, `.end`, and `.curve` suffixes.

### Syntax
```xml
<tone wave="sine" dur="2.0"
      [param].start="[value]"
      [param].end="[value]"
      [param].curve="linear|exp|log|smooth"/>
```

**Curve Types:**
- `linear` - Straight line interpolation
- `exp` - Exponential curve (fast start, slow end)
- `log` - Logarithmic curve (slow start, fast end)
- `smooth` - Ease-in-ease-out (S-curve)

### Frequency Sweeps
```xml
<!-- Pitch drop (laser, coin) -->
<tone wave="saw" dur="0.5"
      freq.start="1000" freq.end="200" freq.curve="exp"/>

<!-- Pitch rise (boot up, power on) -->
<tone wave="sine" dur="1.0"
      freq.start="200" freq.end="800" freq.curve="log"/>

<!-- Siren (use nested automation for this - see Complex Curves) -->
```

### Amplitude Automation
```xml
<!-- Fade in -->
<tone wave="sine" freq="440" dur="2.0"
      amp.start="0" amp.end="1.0" amp.curve="smooth"/>

<!-- Fade out -->
<tone wave="sine" freq="440" dur="2.0"
      amp.start="1.0" amp.end="0" amp.curve="smooth"/>

<!-- Swell -->
<tone wave="sine" freq="440" dur="3.0"
      amp.start="0" amp.end="1.0" amp.curve="smooth"
      envelope="0.1,0.2,0.8,0.5"/>
```

### Filter Automation
```xml
<!-- Filter sweep (wah, opening) -->
<tone wave="saw" freq="220" dur="2.0"
      filter="lowpass"
      cutoff.start="200" cutoff.end="2000" cutoff.curve="exp"/>
```

### Signal Flow with Automation + Envelope

When both amplitude automation and envelope are present:
1. Oscillator generates base waveform
2. Envelope applies ADSR shape
3. Amplitude automation applies on top
4. Result is scaled by `amp` value

```xml
<!-- Gradual swell with pluck envelope -->
<tone wave="sine" freq="440" dur="3.0"
      amp.start="0.2" amp.end="1.0" amp.curve="smooth"
      envelope="0.01,0.1,0.8,0.3"/>
```

---

## Complex Curves (Verbose Syntax)

For multi-point automation curves, use nested elements.

```xml
<tone wave="sine" dur="2.0">
  <freq>
    <key at="0" value="440"/>
    <key at="0.5" value="880" curve="exp"/>
    <key at="1.0" value="220" curve="linear"/>
  </freq>
</tone>
```

**Attributes:**
- `at` - Time in seconds (0 = start of sound)
- `value` - Parameter value
- `curve` - Interpolation to next keyframe (optional, default: `linear`)

This allows arbitrary automation curves when shorthand isn't enough.

---

## Filters

Apply frequency filtering to shape timbre.

### Inline Filter Attributes
```xml
<tone wave="saw" freq="220" dur="1.0"
      filter="lowpass"
      cutoff="1000"
      resonance="2.0"/>
```

**Filter Types:**
- `lowpass` - Removes high frequencies (darker, warmer)
- `highpass` - Removes low frequencies (thinner, brighter)
- `bandpass` - Only keeps middle frequencies (nasal, vocal-like)

**Filter Parameters:**
- `cutoff` - Frequency in Hz where filtering begins
- `resonance` - Emphasis at cutoff frequency (0.1-20.0, default: 1.0)

### Examples
```xml
<!-- Muffled tone -->
<tone wave="square" freq="440" dur="1.0"
      filter="lowpass" cutoff="800" resonance="1.0"/>

<!-- Thin, tinny sound -->
<tone wave="saw" freq="220" dur="1.0"
      filter="highpass" cutoff="2000"/>

<!-- Vocal-like formant -->
<tone wave="saw" freq="110" dur="1.0"
      filter="bandpass" cutoff="800" resonance="4.0"/>

<!-- Filter sweep -->
<tone wave="saw" freq="220" dur="2.0"
      filter="lowpass" resonance="2.0"
      cutoff.start="200" cutoff.end="4000" cutoff.curve="exp"/>
```

---

## Default Values Summary

| Parameter | Default Value | Notes |
|-----------|---------------|-------|
| `amp` | `1.0` | Full volume |
| `envelope` | `0,0,1,0` | Instant gate |
| `pan` | `0` | Center |
| `filter` | none | No filtering |
| `resonance` | `1.0` | Minimal resonance |
| `*.curve` | `linear` | Linear interpolation |

---

## Example Library

### Web UI Sounds

**Button Click**
```xml
<spa version="1.0">
  <tone wave="sine" freq="800" dur="0.05" 
        envelope="0,0.02,0,0.03"/>
</spa>
```

**Button Hover**
```xml
<spa version="1.0">
  <tone wave="sine" freq="600" dur="0.03" 
        amp="0.3"
        envelope="0,0.01,0,0.02"/>
</spa>
```

**Toggle Switch (On)**
```xml
<spa version="1.0">
  <tone wave="sine" dur="0.08"
        freq.start="400" freq.end="600" freq.curve="smooth"
        envelope="0,0.03,0.5,0.05"/>
</spa>
```

**Toggle Switch (Off)**
```xml
<spa version="1.0">
  <tone wave="sine" dur="0.08"
        freq.start="600" freq.end="400" freq.curve="smooth"
        envelope="0,0.03,0.5,0.05"/>
</spa>
```

**Error Beep**
```xml
<spa version="1.0">
  <group>
    <tone wave="square" freq="400" dur="0.15" envelope="0,0.05,0.5,0.1"/>
    <tone wave="square" freq="350" dur="0.15" envelope="0,0.05,0.5,0.1"/>
  </group>
</spa>
```

**Success Chime**
```xml
<spa version="1.0">
  <group>
    <tone wave="sine" freq="523" dur="0.15" envelope="0,0.05,0.3,0.1"/>
    <tone wave="sine" freq="659" dur="0.3" envelope="0,0.1,0.5,0.2"/>
  </group>
</spa>
```

**Notification Alert**
```xml
<spa version="1.0">
  <tone wave="sine" freq="880" dur="0.2"
        amp.start="0.8" amp.end="0.3" amp.curve="exp"
        envelope="0,0.05,0.6,0.15"/>
</spa>
```

**Modal Open**
```xml
<spa version="1.0">
  <tone wave="sine" dur="0.15"
        freq.start="200" freq.end="400" freq.curve="smooth"
        envelope="0,0.05,0.4,0.1"/>
</spa>
```

**Modal Close**
```xml
<spa version="1.0">
  <tone wave="sine" dur="0.12"
        freq.start="400" freq.end="200" freq.curve="smooth"
        envelope="0,0.04,0.3,0.08"/>
</spa>
```

**Loading Tick**
```xml
<spa version="1.0">
  <tone wave="sine" freq="1200" dur="0.03" 
        amp="0.4"
        envelope="0,0.01,0,0.02"/>
</spa>
```

### Form Validation

**Input Focus**
```xml
<spa version="1.0">
  <tone wave="sine" freq="500" dur="0.04" 
        amp="0.2"
        envelope="0,0.01,0,0.03"/>
</spa>
```

**Valid Input**
```xml
<spa version="1.0">
  <tone wave="sine" dur="0.1"
        freq.start="440" freq.end="554" freq.curve="linear"
        envelope="0,0.03,0.4,0.07"/>
</spa>
```

**Invalid Input**
```xml
<spa version="1.0">
  <group>
    <tone wave="triangle" freq="300" dur="0.08" envelope="0,0.03,0.3,0.05"/>
    <tone wave="triangle" freq="280" dur="0.08" envelope="0,0.03,0.3,0.05"/>
  </group>
</spa>
```

### Web Game Sounds

**Coin Pickup**
```xml
<spa version="1.0">
  <tone wave="square" dur="0.3"
        freq.start="988" freq.end="1319" freq.curve="linear"
        envelope="0,0.1,0.2,0.1"/>
</spa>
```

**Laser Shot**
```xml
<spa version="1.0">
  <group>
    <tone wave="saw" dur="0.3"
          freq.start="1200" freq.end="200" freq.curve="exp"
          envelope="0,0.1,0,0.2"/>
    <noise color="white" dur="0.1" amp="0.3" envelope="0,0.05,0,0.05"/>
  </group>
</spa>
```

**Jump**
```xml
<spa version="1.0">
  <tone wave="square" dur="0.2"
        freq.start="400" freq.end="600" freq.curve="smooth"
        envelope="0,0.05,0.3,0.1"/>
</spa>
```

**Power Up**
```xml
<spa version="1.0">
  <tone wave="sine" dur="0.5"
        freq.start="220" freq.end="880" freq.curve="smooth"
        envelope="0,0.2,0.6,0.3"/>
</spa>
```

### Interactive Feedback

**Drag Start**
```xml
<spa version="1.0">
  <tone wave="sine" freq="600" dur="0.05" 
        amp="0.4"
        envelope="0,0.02,0,0.03"/>
</spa>
```

**Drop Success**
```xml
<spa version="1.0">
  <tone wave="sine" dur="0.12"
        freq.start="600" freq.end="800" freq.curve="smooth"
        envelope="0,0.04,0.5,0.08"/>
</spa>
```

**Swipe**
```xml
<spa version="1.0">
  <noise color="white" dur="0.15"
         filter="bandpass" resonance="2.0"
         cutoff.start="1000" cutoff.end="3000" cutoff.curve="linear"
         amp="0.3"
         envelope="0,0.05,0.4,0.1"/>
</spa>
```

**Progress Complete**
```xml
<spa version="1.0">
  <group>
    <tone wave="sine" freq="523" dur="0.1" envelope="0,0.03,0.3,0.07"/>
    <tone wave="sine" freq="659" dur="0.15" envelope="0,0.05,0.4,0.1"/>
    <tone wave="sine" freq="784" dur="0.2" envelope="0,0.07,0.5,0.13"/>
  </group>
</spa>
```

### Ambient & Atmosphere

**Wind**
```xml
<spa version="1.0">
  <group>
    <noise color="pink" dur="5.0" 
           filter="bandpass" cutoff="800" resonance="1.5"
           amp.start="0.3" amp.end="0.6" amp.curve="smooth"/>
    <noise color="brown" dur="5.0" amp="0.2"/>
  </group>
</spa>
```

**Whoosh**
```xml
<spa version="1.0">
  <noise color="white" dur="0.5"
         filter="bandpass" resonance="2.0"
         cutoff.start="2000" cutoff.end="200" cutoff.curve="exp"
         amp.start="0" amp.end="1.0" amp.curve="smooth"
         envelope="0,0.2,0.4,0.3"/>
</spa>
```

**Page Transition**
```xml
<spa version="1.0">
  <group>
    <tone wave="sine" dur="0.3"
          freq.start="400" freq.end="600" freq.curve="smooth"
          amp="0.4"
          envelope="0,0.1,0.5,0.2"/>
    <noise color="white" dur="0.2"
           filter="highpass" cutoff="2000"
           amp="0.1"
           envelope="0,0.05,0.3,0.15"/>
  </group>
</spa>
```

---

## Implementation Notes

### Target Sample Rate
- Default: 48kHz
- SPA files should be sample-rate agnostic
- Renderers can output at any sample rate

### Mono vs Stereo
- Individual elements can be panned (`pan` attribute)
- Final output is stereo
- Mono sources are centered by default

### Rendering Pipeline
1. Parse XML structure
2. Generate base waveforms (oscillators, noise)
3. Apply envelopes
4. Apply filters
5. Apply amplitude automation
6. Mix multiple elements
7. Apply panning
8. Output to stereo buffer

### Performance Considerations
- SPA files should be pre-rendered for performance-critical applications
- Real-time rendering is feasible for simple sounds
- Complex sounds with many layers may need buffering

---

## Future Considerations (Not in v1.0)

These features are being considered for future versions:

**Web Audio Extensions:**
- **Effects Chain** - `<reverb>`, `<delay>`, `<distortion>` elements
- **Modulation** - LFOs for vibrato, tremolo, and wobble effects
- **Dynamics** - Compression, limiting for consistent levels
- **Spatialization** - 3D audio positioning (Web Audio Spatial API)

**Advanced Synthesis:**
- **FM Synthesis** - `<fm>` element for frequency modulation
- **Wavetable** - Custom waveform definitions beyond basic shapes
- **Granular** - Micro-sampling and granular synthesis

**Interactivity:**
- **Parameters** - Variables that can be set at render time
- **Randomization** - `<random>` for procedural variation
- **Conditional Logic** - Simple if/then for dynamic sounds

**Integration:**
- **Sample Playback** - `<sample src="file.wav">` for hybrid approaches
- **MIDI Triggers** - Map MIDI events to SPA sounds
- **URL Parameters** - Pass parameters via query string for sharing

**Tooling Formats:**
- **Presets** - Named parameter sets (bright, dark, punchy)
- **Macros** - Reusable sound templates
- **Collections** - Bundle multiple sounds in one file

**Web-Specific:**
- **Streaming** - Progressive rendering for longer sounds
- **Service Worker** - Offline rendering and caching strategies
- **Web Components** - `<spa-sound>` custom element
- **CSS Integration** - Trigger sounds via CSS (experimental)

---

## Comparison to Existing Formats

| Format | Purpose | Declarative? | Generates Sound? |
|--------|---------|--------------|------------------|
| **SPA** | Simple SFX synthesis | ✅ Yes | ✅ Yes |
| SVG | Vector graphics | ✅ Yes | ✅ Yes (visuals) |
| SSML | Speech synthesis | ✅ Yes | ⚠️ TTS only |
| SFZ | Sample playback | ✅ Yes | ❌ No (maps samples) |
| MIDI | Musical notation | ⚠️ Events | ❌ No (needs synth) |
| MusicXML | Sheet music | ✅ Yes | ❌ No (notation) |
| Web Audio API | Audio processing | ❌ No (code) | ✅ Yes |
| CSound | Audio synthesis | ❌ No (code) | ✅ Yes |

---

## Design Philosophy

1. **Simplicity First** - Easy enough for non-programmers to hand-write
2. **Declarative** - Describe the sound, not how to generate it
3. **Human-Readable** - XML structure that's self-documenting
4. **AI-Friendly** - Simple enough for LLMs to generate correctly
5. **Composable** - Build complex sounds from simple primitives
6. **Portable** - Text-based format works everywhere
7. **Focused Scope** - SFX and UI sounds, not full music production
8. **Web-First** - Designed for modern web development workflows

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Weeks 1-4)

**Deliverable: JavaScript Library** (`spa-audio` npm package)
- XML parser (SPA → AST)
- Web Audio API renderer (AST → AudioBuffer)
- Schema validator
- Comprehensive test suite
- TypeScript definitions

```javascript
// Core API
import { renderSPA, playSPA, validate } from 'spa-audio';

// Async rendering
const buffer = await renderSPA(spaXML);

// Direct playback
await playSPA(spaXML);

// Validation
const errors = validate(spaXML);
```

### Phase 2: Developer Experience (Weeks 5-8)

**Deliverable: Documentation & Tooling**
- Documentation website (`spa.audio` or similar)
- Interactive playground (in-browser editor + live preview)
- VS Code extension (syntax highlighting, validation, snippets)
- npm package published and documented
- Example library (50+ sounds with audio preview)

**Website Structure:**
```
spa.audio/
├── / (homepage with demo)
├── /playground (interactive editor)
├── /docs (full reference)
├── /examples (sound library)
└── /why (use cases, comparisons)
```

### Phase 3: Integration & Polish (Months 3-4)

**Deliverable: Framework Integrations**
```javascript
// React
import { SPASound } from 'spa-react';
<SPASound src="/click.spa" onLoad={ready} />

// Vue
<spa-sound src="/click.spa" @ready="handleReady" />

// Web Component
<spa-sound src="/click.spa"></spa-sound>
```

**Additional Tooling:**
- CLI tool for validation and conversion
- Online converter (SPA ↔ WAV)
- Browser DevTools integration (preview .spa in Network tab)

### Phase 4: Community & Growth (Months 5-6)

**Deliverable: Ecosystem**
- Community sound library (user contributions)
- Visual editor (web-based synth UI → SPA export)
- AI integration (trained models for SPA generation)
- Tutorial series (blog posts, videos)
- Showcase gallery (sites using SPA)

### Success Metrics

**Week 4 Goals:**
- ✅ Working JavaScript library
- ✅ 20+ example sounds
- ✅ Documentation site live

**Month 2 Goals:**
- ✅ Playground with 1,000+ visits
- ✅ 100+ npm downloads/week
- ✅ VS Code extension published
- ✅ 3+ production sites using SPA

**Month 6 Goals:**
- ✅ 10,000+ npm downloads/month
- ✅ Framework integrations published
- ✅ Community library with 500+ sounds
- ✅ Featured in web dev tutorial/blog

### Repository Structure

**Primary Repositories:**
```
spa-format/
├── spec/              (this specification)
├── spa-js/            (JavaScript library)
├── spa.audio/         (documentation website)
└── spa-vscode/        (VS Code extension)
```

**Package Ecosystem:**
```
npm install spa-audio           # Core library
npm install spa-react           # React integration
npm install spa-vue             # Vue integration
npm install -g spa-cli          # CLI tools
```

---

## Version History

**v1.0** (Current)
- Initial specification
- Core elements: `<tone>`, `<noise>`, `<group>`
- ADSR envelopes
- Parameter automation
- Basic filters (lowpass, highpass, bandpass)

---

## Specification Status

**Status:** Draft  
**Version:** 1.0  
**Last Updated:** October 2025  
**Authors:** Working Group  
**License:** Open specification (to be determined)

---

## Contributing

This specification is in active development. Feedback and contributions are welcome.

**Contact:** [To be determined]  
**Repository:** [To be determined]  
**Discussion Forum:** [To be determined]
