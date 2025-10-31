# SPA - Build Instructions for Claude
## Complete Implementation Guide

This document provides step-by-step instructions for building the entire SPA ecosystem from scratch. Follow this sequentially.

---

## Project Structure

```
spa/                          (this directory - not a monorepo)
├── README.md                 (overview)
├── SPA_SPEC_v1.0.md         (specification)
├── SPA_ROADMAP.md           (roadmap)
├── SPA_QUICKSTART.md        (quick start)
├── BUILD_INSTRUCTIONS.md    (this file)
│
├── spa-spec/                (spec repo - examples and schema)
├── spa-js/                  (core JavaScript library)
├── spa-web/                 (promo website with designer)
├── spa-react/               (React integration)
├── spa-vue/                 (Vue integration)
├── spa-vscode/              (VS Code extension)
└── spa-cli/                 (CLI tools)
```

---

## Phase 1: Core Library (Week 1-3)

### Step 1.1: Create `spa-spec` Repository

**Purpose:** Central repository for the specification, examples, and JSON schema.

```bash
mkdir spa-spec && cd spa-spec
git init
npm init -y
```

**File Structure:**
```
spa-spec/
├── README.md
├── SPEC.md                   (copy from SPA_SPEC_v1.0.md)
├── QUICKSTART.md             (copy from SPA_QUICKSTART.md)
├── schema/
│   └── spa-v1.schema.json  (JSON Schema for validation)
├── examples/
│   ├── ui/
│   │   ├── button-click.spa
│   │   ├── button-hover.spa
│   │   ├── toggle-on.spa
│   │   ├── toggle-off.spa
│   │   ├── error.spa
│   │   ├── success.spa
│   │   ├── notification.spa
│   │   ├── modal-open.spa
│   │   ├── modal-close.spa
│   │   └── loading-tick.spa
│   ├── forms/
│   │   ├── input-focus.spa
│   │   ├── input-valid.spa
│   │   └── input-invalid.spa
│   ├── game/
│   │   ├── coin.spa
│   │   ├── laser.spa
│   │   ├── jump.spa
│   │   └── power-up.spa
│   └── ambient/
│       ├── wind.spa
│       ├── whoosh.spa
│       └── page-transition.spa
└── tests/
    └── compliance-suite.json  (expected audio outputs for validation)
```

**Task:** Create all 20+ example .spa files from the spec.

**JSON Schema:** Create a JSON Schema that validates:
- Required `<spa>` root element with version attribute
- Valid element types (tone, noise, group)
- Valid attributes for each element
- Valid value ranges (amp: 0-1, freq: positive number, etc.)

---

### Step 1.2: Create `spa-js` Repository

**Purpose:** Core JavaScript library for parsing and rendering SPA.

```bash
mkdir spa-js && cd spa-js
npm init -y
npm install -D typescript @types/node jest @types/jest ts-jest
npm install -D rollup @rollup/plugin-typescript @rollup/plugin-node-resolve
```

**File Structure:**
```
spa-js/
├── package.json
├── tsconfig.json
├── rollup.config.js
├── README.md
├── src/
│   ├── index.ts              (main exports)
│   ├── parser.ts             (XML → AST)
│   ├── renderer.ts           (AST → Web Audio API)
│   ├── validator.ts          (schema validation)
│   ├── types.ts              (TypeScript interfaces)
│   └── utils/
│       ├── oscillators.ts    (wave generation)
│       ├── noise.ts          (noise generation)
│       ├── envelopes.ts      (ADSR implementation)
│       ├── filters.ts        (biquad filters)
│       └── automation.ts     (parameter curves)
├── dist/                     (built files)
│   ├── spa.js               (UMD bundle)
│   ├── spa.esm.js           (ES module)
│   └── spa.d.ts             (TypeScript definitions)
└── tests/
    ├── parser.test.ts
    ├── renderer.test.ts
    ├── oscillators.test.ts
    ├── noise.test.ts
    ├── envelopes.test.ts
    └── integration.test.ts
```

#### Implementation Order:

**1. Define Types (`types.ts`):**
```typescript
export interface SPADocument {
  version: string;
  defs?: SPADefinitions;
  sounds: SPASound[];
}

export interface SPADefinitions {
  envelopes: Record<string, ADSREnvelope>;
}

export interface ADSREnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export type SPASound = ToneElement | NoiseElement | GroupElement;

export interface ToneElement {
  type: 'tone';
  wave: 'sine' | 'square' | 'triangle' | 'saw';
  freq: number | AutomationCurve;
  dur: number;
  amp?: number | AutomationCurve;
  envelope?: ADSREnvelope | string; // string = reference to def
  pan?: number;
  filter?: FilterConfig;
}

export interface NoiseElement {
  type: 'noise';
  color: 'white' | 'pink' | 'brown';
  dur: number;
  amp?: number | AutomationCurve;
  envelope?: ADSREnvelope | string;
  pan?: number;
  filter?: FilterConfig;
}

export interface GroupElement {
  type: 'group';
  id?: string;
  sounds: SPASound[];
}

export interface AutomationCurve {
  start: number;
  end: number;
  curve: 'linear' | 'exp' | 'log' | 'smooth';
}

export interface FilterConfig {
  type: 'lowpass' | 'highpass' | 'bandpass';
  cutoff: number | AutomationCurve;
  resonance?: number;
}

export interface RenderOptions {
  sampleRate?: number;
  channels?: number;
}
```

**2. Parser (`parser.ts`):**
```typescript
export function parseSPA(xml: string): SPADocument {
  // Use DOMParser in browser, or xmldom/fast-xml-parser in Node
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  // Check for parsing errors
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`XML parsing error: ${parserError.textContent}`);
  }
  
  const root = doc.documentElement;
  if (root.tagName !== 'spa') {
    throw new Error('Root element must be <spa>');
  }
  
  const version = root.getAttribute('version');
  if (!version) {
    throw new Error('Missing version attribute');
  }
  
  // Parse <defs> if present
  const defs = parseDefinitions(root);
  
  // Parse sound elements
  const sounds = parseChildren(root, defs);
  
  return { version, defs, sounds };
}

function parseDefinitions(root: Element): SPADefinitions | undefined {
  const defsEl = root.querySelector('defs');
  if (!defsEl) return undefined;
  
  const envelopes: Record<string, ADSREnvelope> = {};
  
  defsEl.querySelectorAll('envelope').forEach(el => {
    const id = el.getAttribute('id');
    if (!id) throw new Error('Envelope missing id');
    
    envelopes[id] = {
      attack: parseFloat(el.getAttribute('attack') || '0'),
      decay: parseFloat(el.getAttribute('decay') || '0'),
      sustain: parseFloat(el.getAttribute('sustain') || '1'),
      release: parseFloat(el.getAttribute('release') || '0'),
    };
  });
  
  return { envelopes };
}

function parseChildren(parent: Element, defs?: SPADefinitions): SPASound[] {
  const sounds: SPASound[] = [];
  
  for (const child of Array.from(parent.children)) {
    if (child.tagName === 'defs') continue;
    
    if (child.tagName === 'tone') {
      sounds.push(parseTone(child, defs));
    } else if (child.tagName === 'noise') {
      sounds.push(parseNoise(child, defs));
    } else if (child.tagName === 'group') {
      sounds.push(parseGroup(child, defs));
    }
  }
  
  return sounds;
}

function parseTone(el: Element, defs?: SPADefinitions): ToneElement {
  const wave = el.getAttribute('wave') as any;
  if (!['sine', 'square', 'triangle', 'saw'].includes(wave)) {
    throw new Error(`Invalid wave type: ${wave}`);
  }
  
  return {
    type: 'tone',
    wave,
    freq: parseNumericOrAutomation(el, 'freq'),
    dur: parseFloat(el.getAttribute('dur') || '0'),
    amp: parseNumericOrAutomation(el, 'amp'),
    envelope: parseEnvelope(el, defs),
    pan: parseFloat(el.getAttribute('pan') || '0'),
    filter: parseFilter(el),
  };
}

function parseNumericOrAutomation(el: Element, param: string): number | AutomationCurve {
  const value = el.getAttribute(param);
  const start = el.getAttribute(`${param}.start`);
  const end = el.getAttribute(`${param}.end`);
  const curve = el.getAttribute(`${param}.curve`) as any;
  
  if (start && end) {
    return {
      start: parseFloat(start),
      end: parseFloat(end),
      curve: curve || 'linear',
    };
  }
  
  return parseFloat(value || '1');
}

function parseEnvelope(el: Element, defs?: SPADefinitions): ADSREnvelope | string | undefined {
  const envAttr = el.getAttribute('envelope');
  if (!envAttr) return undefined;
  
  // Check if it's a reference (#id)
  if (envAttr.startsWith('#')) {
    return envAttr.slice(1); // Return reference string
  }
  
  // Parse inline format: "a,d,s,r"
  const [a, d, s, r] = envAttr.split(',').map(parseFloat);
  return { attack: a, decay: d, sustain: s, release: r };
}

// Similar implementations for parseNoise, parseGroup, parseFilter...
```

**3. Oscillators (`utils/oscillators.ts`):**
```typescript
export function generateWaveform(
  wave: 'sine' | 'square' | 'triangle' | 'saw',
  frequency: number,
  duration: number,
  sampleRate: number
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const buffer = new Float32Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const phase = (frequency * t) % 1.0;
    
    switch (wave) {
      case 'sine':
        buffer[i] = Math.sin(2 * Math.PI * phase);
        break;
      case 'square':
        buffer[i] = phase < 0.5 ? 1 : -1;
        break;
      case 'triangle':
        buffer[i] = 4 * Math.abs(phase - 0.5) - 1;
        break;
      case 'saw':
        buffer[i] = 2 * phase - 1;
        break;
    }
  }
  
  return buffer;
}
```

**4. Noise Generation (`utils/noise.ts`):**
```typescript
export function generateNoise(
  color: 'white' | 'pink' | 'brown',
  duration: number,
  sampleRate: number
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const buffer = new Float32Array(numSamples);
  
  switch (color) {
    case 'white':
      for (let i = 0; i < numSamples; i++) {
        buffer[i] = Math.random() * 2 - 1;
      }
      break;
      
    case 'pink':
      // Pink noise using Paul Kellet's algorithm
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < numSamples; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        buffer[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        buffer[i] *= 0.11; // Normalize
        b6 = white * 0.115926;
      }
      break;
      
    case 'brown':
      // Brown noise (integrated white noise)
      let lastOut = 0;
      for (let i = 0; i < numSamples; i++) {
        const white = Math.random() * 2 - 1;
        buffer[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = buffer[i];
        buffer[i] *= 3.5; // Normalize
      }
      break;
  }
  
  return buffer;
}
```

**5. ADSR Envelopes (`utils/envelopes.ts`):**
```typescript
export function applyEnvelope(
  buffer: Float32Array,
  envelope: ADSREnvelope,
  duration: number,
  sampleRate: number
): Float32Array {
  const numSamples = buffer.length;
  const attackSamples = Math.floor(envelope.attack * sampleRate);
  const decaySamples = Math.floor(envelope.decay * sampleRate);
  const releaseSamples = Math.floor(envelope.release * sampleRate);
  const sustainSamples = numSamples - attackSamples - decaySamples - releaseSamples;
  
  for (let i = 0; i < numSamples; i++) {
    let gain = 1.0;
    
    if (i < attackSamples) {
      // Attack phase
      gain = i / attackSamples;
    } else if (i < attackSamples + decaySamples) {
      // Decay phase
      const decayProgress = (i - attackSamples) / decaySamples;
      gain = 1.0 - (decayProgress * (1.0 - envelope.sustain));
    } else if (i < attackSamples + decaySamples + sustainSamples) {
      // Sustain phase
      gain = envelope.sustain;
    } else {
      // Release phase
      const releaseProgress = (i - attackSamples - decaySamples - sustainSamples) / releaseSamples;
      gain = envelope.sustain * (1.0 - releaseProgress);
    }
    
    buffer[i] *= gain;
  }
  
  return buffer;
}
```

**6. Renderer (`renderer.ts`):**
```typescript
export async function renderSPA(
  xml: string | SPADocument,
  options: RenderOptions = {}
): Promise<AudioBuffer> {
  const { sampleRate = 48000, channels = 2 } = options;
  
  // Parse if string
  const doc = typeof xml === 'string' ? parseSPA(xml) : xml;
  
  // Render each sound
  const renderedSounds = doc.sounds.map(sound => 
    renderSound(sound, doc.defs, sampleRate)
  );
  
  // Find max length
  const maxLength = Math.max(...renderedSounds.map(s => s.length));
  
  // Mix all sounds
  const mixedMono = new Float32Array(maxLength);
  for (const sound of renderedSounds) {
    for (let i = 0; i < sound.length; i++) {
      mixedMono[i] += sound[i];
    }
  }
  
  // Normalize
  const peak = Math.max(...Array.from(mixedMono).map(Math.abs));
  if (peak > 1.0) {
    for (let i = 0; i < mixedMono.length; i++) {
      mixedMono[i] /= peak;
    }
  }
  
  // Create stereo AudioBuffer
  const audioBuffer = new AudioContext().createBuffer(channels, maxLength, sampleRate);
  
  // Copy to channels (with panning if needed)
  audioBuffer.copyToChannel(mixedMono, 0);
  audioBuffer.copyToChannel(mixedMono, 1);
  
  return audioBuffer;
}

function renderSound(
  sound: SPASound,
  defs: SPADefinitions | undefined,
  sampleRate: number
): Float32Array {
  if (sound.type === 'tone') {
    return renderTone(sound, defs, sampleRate);
  } else if (sound.type === 'noise') {
    return renderNoise(sound, defs, sampleRate);
  } else if (sound.type === 'group') {
    return renderGroup(sound, defs, sampleRate);
  }
  throw new Error(`Unknown sound type: ${(sound as any).type}`);
}

function renderTone(
  tone: ToneElement,
  defs: SPADefinitions | undefined,
  sampleRate: number
): Float32Array {
  // Handle frequency automation
  let buffer: Float32Array;
  if (typeof tone.freq === 'number') {
    buffer = generateWaveform(tone.wave, tone.freq, tone.dur, sampleRate);
  } else {
    buffer = generateWaveformWithAutomation(tone.wave, tone.freq, tone.dur, sampleRate);
  }
  
  // Apply envelope
  if (tone.envelope) {
    const env = resolveEnvelope(tone.envelope, defs);
    if (env) {
      buffer = applyEnvelope(buffer, env, tone.dur, sampleRate);
    }
  }
  
  // Apply amplitude
  const amp = typeof tone.amp === 'number' ? tone.amp : 1.0;
  if (amp !== 1.0) {
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] *= amp;
    }
  }
  
  // Apply filter if present
  if (tone.filter) {
    buffer = applyFilter(buffer, tone.filter, sampleRate);
  }
  
  return buffer;
}

// Similar for renderNoise, renderGroup...
```

**7. Public API (`index.ts`):**
```typescript
export { parseSPA } from './parser';
export { renderSPA } from './renderer';
export { validate } from './validator';

export async function playSPA(xml: string, options?: RenderOptions): Promise<void> {
  const buffer = await renderSPA(xml, options);
  const ctx = new AudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
}

export const SPA = {
  parse: parseSPA,
  render: renderSPA,
  play: playSPA,
  validate,
};
```

**Build Configuration (`rollup.config.js`):**
```javascript
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/spa.js',
      format: 'umd',
      name: 'SPA',
    },
    {
      file: 'dist/spa.esm.js',
      format: 'es',
    },
  ],
  plugins: [
    resolve(),
    typescript({ tsconfig: './tsconfig.json' }),
  ],
};
```

**Package.json Scripts:**
```json
{
  "name": "spa-audio",
  "version": "1.0.0",
  "description": "Synthetic Parametric Audio - procedural sound effects",
  "main": "dist/spa.js",
  "module": "dist/spa.esm.js",
  "types": "dist/spa.d.ts",
  "scripts": {
    "build": "rollup -c",
    "test": "jest",
    "test:watch": "jest --watch",
    "prepublishOnly": "npm run build && npm test"
  }
}
```

---

## Phase 2: Visual Designer Website (Week 4)

### Step 2.1: Create `spa-web` Repository

**Purpose:** Promo website with visual sound designer as the main feature.

```bash
mkdir spa-web && cd spa-web
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
npm install spa-audio monaco-editor @monaco-editor/react
```

**File Structure:**
```
spa-web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx               (Visual Designer - MAIN PAGE)
│   ├── playground/
│   │   └── page.tsx           (Code Playground)
│   ├── examples/
│   │   └── page.tsx           (Example Library)
│   ├── docs/
│   │   └── page.tsx           (Documentation)
│   └── why/
│       └── page.tsx           (Why SPA?)
├── components/
│   ├── SoundDesigner/
│   │   ├── SoundDesigner.tsx  (Main component)
│   │   ├── LayerPanel.tsx     (Layer list)
│   │   ├── ToneEditor.tsx     (Tone parameter controls)
│   │   ├── NoiseEditor.tsx    (Noise parameter controls)
│   │   ├── EnvelopeEditor.tsx (Visual ADSR editor)
│   │   ├── Waveform.tsx       (Visual waveform display)
│   │   └── SPAOutput.tsx      (Generated SPA code)
│   ├── CodePlayground/
│   │   ├── Editor.tsx         (Monaco editor)
│   │   └── AudioPlayer.tsx    (Playback controls)
│   └── ExampleLibrary/
│       ├── ExampleCard.tsx    (Sound card with play button)
│       └── CategoryFilter.tsx (Filter by category)
├── public/
│   └── examples/              (Copy all .spa files from spa-spec)
└── lib/
    └── spa.ts                 (Import spa-audio)
```

### CRITICAL: Visual Designer Specification

**Main Page Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  SPA - The SVG of Sound Effects             [GitHub] [Docs] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  Build Your Sound                          [▶ Play]  │ │
│  │                                                        │ │
│  │  Layers:                                              │ │
│  │  ┌──────────────────────────────────────────────────┐│ │
│  │  │ ▶ Tone 1 (Sine)                      [−] [+]     ││ │
│  │  │   Wave: [Sine ▼]  Freq: [440] Hz                 ││ │
│  │  │   Duration: [1.0] s   Amp: [1.0]                 ││ │
│  │  │                                                    ││ │
│  │  │   ┌─ Envelope ────────────────────────────────┐  ││ │
│  │  │   │    1.0 │     ┌───┐                        │  ││ │
│  │  │   │        │    ╱     ╲___________           │  ││ │
│  │  │   │    0.0 └───┘                  ╲_____     │  ││ │
│  │  │   │         A    D    S          R           │  ││ │
│  │  │   │   A:[0.01] D:[0.2] S:[0.3] R:[0.5]      │  ││ │
│  │  │   └────────────────────────────────────────┘  ││ │
│  │  │                                                    ││ │
│  │  │   □ Frequency Automation                         ││ │
│  │  │   □ Filter (Lowpass)                             ││ │
│  │  └──────────────────────────────────────────────────┘│ │
│  │                                                        │ │
│  │  [+ Add Tone] [+ Add Noise]                          │ │
│  │                                                        │ │
│  │  ┌─ Waveform Preview ──────────────────────────────┐ │ │
│  │  │                                                  │ │ │
│  │  │      ╱╲      ╱╲      ╱╲      ╱╲      ╱╲        │ │ │
│  │  │     ╱  ╲    ╱  ╲    ╱  ╲    ╱  ╲    ╱  ╲       │ │ │
│  │  │    ╱    ╲  ╱    ╲  ╱    ╲  ╱    ╲  ╱    ╲      │ │ │
│  │  │   ╱      ╲╱      ╲╱      ╲╱      ╲╱      ╲     │ │ │
│  │  │                                                  │ │ │
│  │  │  [▶ Play]  Duration: 1.0s                       │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  ┌─ Generated SPA ─────────────────────────────────┐ │ │
│  │  │  <spa xmlns="https://spa.audio/ns" version="1.0">                            │ │ │
│  │  │    <tone wave="sine" freq="440" dur="1.0"       │ │ │
│  │  │          envelope="0.01,0.2,0.3,0.5"/>          │ │ │
│  │  │  </spa>                                          │ │ │
│  │  │                                                   │ │ │
│  │  │  [Copy] [Download .spa] [Export .wav]           │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  ┌─ Presets ──────────────────────────────────────┐  │ │
│  │  │  [Button Click] [Laser] [Coin] [Error]         │  │ │
│  │  │  [Success] [Notification] [Whoosh] [Wind]      │  │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  Why SPA?                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                               │
│  ✓ 100x Smaller     ✓ Parametric     ✓ AI-Friendly          │
│    80 bytes vs      Edit without     Generate with           │
│    9.6 KB          re-exporting      ChatGPT                 │
│                                                               │
│  [View Examples →]  [Read Docs →]  [Code Playground →]       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Key Features of Visual Designer:**

1. **Layer-Based Interface**
   - Add/remove tones and noise
   - Reorder layers (drag & drop)
   - Each layer expandable/collapsible
   - Visual indicators for layer type (icon for tone/noise)

2. **Parameter Controls**
   - Sliders for numeric values (freq, amp, dur)
   - Dropdowns for enums (wave type, noise color, filter type)
   - Real-time preview as you adjust
   - Tooltips explaining each parameter

3. **Visual ADSR Envelope Editor**
   - Draggable points on a graph
   - Shows the envelope shape visually
   - Numeric inputs below for precision
   - Default presets (pluck, pad, stab)

4. **Automation Toggle**
   - Checkbox to enable freq/amp automation
   - When enabled, shows start/end/curve controls
   - Visual representation of the curve

5. **Waveform Preview**
   - Real-time waveform visualization
   - Updates as you change parameters
   - Shows the final mixed output

6. **SPA Code Output**
   - Auto-generates as you design
   - Syntax-highlighted
   - Copy button (with toast notification)
   - Download .spa button
   - Export to .wav button

7. **Presets**
   - Load common sounds with one click
   - User can modify after loading
   - Shows file size comparison

**Component Implementation (`SoundDesigner.tsx`):**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { renderSPA, playSPA } from 'spa-audio';
import LayerPanel from './LayerPanel';
import SPAOutput from './SPAOutput';
import Waveform from './Waveform';

interface Layer {
  id: string;
  type: 'tone' | 'noise';
  params: Record<string, any>;
}

export default function SoundDesigner() {
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: '1',
      type: 'tone',
      params: {
        wave: 'sine',
        freq: 440,
        dur: 1.0,
        amp: 1.0,
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 },
      },
    },
  ]);
  
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [spaCode, setSpaCode] = useState<string>('');
  
  // Generate SPA code from layers
  useEffect(() => {
    const code = generateSPACode(layers);
    setSpaCode(code);
    
    // Render audio
    renderSPA(code).then(setAudioBuffer);
  }, [layers]);
  
  const addTone = () => {
    setLayers([...layers, {
      id: Math.random().toString(),
      type: 'tone',
      params: {
        wave: 'sine',
        freq: 440,
        dur: 1.0,
        amp: 1.0,
        envelope: { attack: 0, decay: 0, sustain: 1, release: 0 },
      },
    }]);
  };
  
  const addNoise = () => {
    setLayers([...layers, {
      id: Math.random().toString(),
      type: 'noise',
      params: {
        color: 'white',
        dur: 1.0,
        amp: 1.0,
        envelope: { attack: 0, decay: 0, sustain: 1, release: 0 },
      },
    }]);
  };
  
  const updateLayer = (id: string, params: Record<string, any>) => {
    setLayers(layers.map(l => l.id === id ? { ...l, params } : l));
  };
  
  const removeLayer = (id: string) => {
    setLayers(layers.filter(l => l.id !== id));
  };
  
  const playSound = async () => {
    await playSPA(spaCode);
  };
  
  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Build Your Sound</h1>
        <p className="text-gray-600">Design sound effects visually, get tiny SPA code</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Layers */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Layers</h2>
          {layers.map(layer => (
            <LayerPanel
              key={layer.id}
              layer={layer}
              onUpdate={(params) => updateLayer(layer.id, params)}
              onRemove={() => removeLayer(layer.id)}
            />
          ))}
          <div className="flex gap-2 mt-4">
            <button onClick={addTone} className="btn btn-navy-light">+ Add Tone</button>
            <button onClick={addNoise} className="btn btn-secondary">+ Add Noise</button>
          </div>
        </div>
        
        {/* Waveform Preview */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <Waveform audioBuffer={audioBuffer} />
          <button onClick={playSound} className="btn btn-navy-light mt-4">▶ Play</button>
        </div>
        
        {/* SPA Output */}
        <SPAOutput code={spaCode} />
      </div>
    </div>
  );
}

function generateSPACode(layers: Layer[]): string {
  let code = '<spa xmlns="https://spa.audio/ns" version="1.0">\n';
  
  if (layers.length > 1) {
    code += '  <group>\n';
  }
  
  for (const layer of layers) {
    const indent = layers.length > 1 ? '    ' : '  ';
    
    if (layer.type === 'tone') {
      const p = layer.params;
      const env = `${p.envelope.attack},${p.envelope.decay},${p.envelope.sustain},${p.envelope.release}`;
      code += `${indent}<tone wave="${p.wave}" freq="${p.freq}" dur="${p.dur}" amp="${p.amp}" envelope="${env}"/>\n`;
    } else {
      const p = layer.params;
      const env = `${p.envelope.attack},${p.envelope.decay},${p.envelope.sustain},${p.envelope.release}`;
      code += `${indent}<noise color="${p.color}" dur="${p.dur}" amp="${p.amp}" envelope="${env}"/>\n`;
    }
  }
  
  if (layers.length > 1) {
    code += '  </group>\n';
  }
  
  code += '</spa>';
  return code;
}
```

**Envelope Editor Component (`EnvelopeEditor.tsx`):**
```typescript
interface EnvelopeEditorProps {
  envelope: { attack: number; decay: number; sustain: number; release: number };
  onChange: (envelope: any) => void;
}

export default function EnvelopeEditor({ envelope, onChange }: EnvelopeEditorProps) {
  // Canvas-based visual editor
  // Draw ADSR curve
  // Draggable points for each stage
  // Numeric inputs below
  
  return (
    <div className="border rounded p-4">
      <h3 className="font-semibold mb-2">Envelope</h3>
      <canvas
        width={400}
        height={100}
        className="border mb-2"
        // Draw envelope curve with draggable points
      />
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-sm">Attack</label>
          <input
            type="number"
            value={envelope.attack}
            onChange={(e) => onChange({ ...envelope, attack: parseFloat(e.target.value) })}
            step="0.01"
            className="input"
          />
        </div>
        <div>
          <label className="text-sm">Decay</label>
          <input
            type="number"
            value={envelope.decay}
            onChange={(e) => onChange({ ...envelope, decay: parseFloat(e.target.value) })}
            step="0.01"
            className="input"
          />
        </div>
        <div>
          <label className="text-sm">Sustain</label>
          <input
            type="number"
            value={envelope.sustain}
            onChange={(e) => onChange({ ...envelope, sustain: parseFloat(e.target.value) })}
            step="0.01"
            min="0"
            max="1"
            className="input"
          />
        </div>
        <div>
          <label className="text-sm">Release</label>
          <input
            type="number"
            value={envelope.release}
            onChange={(e) => onChange({ ...envelope, release: parseFloat(e.target.value) })}
            step="0.01"
            className="input"
          />
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 3: Additional Tools (Weeks 5-8)

### Step 3.1: VS Code Extension

```bash
mkdir spa-vscode && cd spa-vscode
npm init -y
npm install -D @types/vscode @types/node typescript
yo code  # Use Yeoman generator
```

**Key Files:**
```
spa-vscode/
├── package.json
├── syntaxes/
│   └── spa.tmLanguage.json
├── snippets/
│   └── spa.json
├── src/
│   └── extension.ts
└── language-configuration.json
```

**Syntax Highlighting (TextMate grammar):**
- Highlight XML elements
- Highlight attribute names
- Highlight numeric values
- Highlight string values

**Snippets:**
- `spa` → full document template
- `tone` → tone element
- `noise` → noise element
- `group` → group element

### Step 3.2: React Integration

```bash
mkdir spa-react && cd spa-react
npm init -y
npm install react spa-audio
npm install -D @types/react typescript
```

**Simple wrapper component:**
```typescript
import { useEffect, useRef } from 'react';
import { playSPA } from 'spa-audio';

interface SPASoundProps {
  children?: string;
  src?: string;
  autoPlay?: boolean;
}

export function SPASound({ children, src, autoPlay }: SPASoundProps) {
  const spaCode = children || '';
  
  useEffect(() => {
    if (autoPlay) {
      if (src) {
        fetch(src).then(r => r.text()).then(playSPA);
      } else if (spaCode) {
        playSPA(spaCode);
      }
    }
  }, [src, spaCode, autoPlay]);
  
  return null; // No visual output
}
```

---

## Deployment & Launch

### Deploy Website (spa-web)
```bash
# Vercel
vercel --prod

# Or Netlify
netlify deploy --prod
```

### Publish npm Packages
```bash
# spa-js
cd spa-js
npm publish

# spa-react
cd spa-react
npm publish

# spa-vue
cd spa-vue
npm publish
```

### Publish VS Code Extension
```bash
cd spa-vscode
vsce package
vsce publish
```

---

## Testing Checklist

### Core Library Tests
- [ ] Parser handles all valid SPA
- [ ] Parser rejects invalid SPA
- [ ] Tone generation for all wave types
- [ ] Noise generation for all colors
- [ ] ADSR envelope application
- [ ] Parameter automation
- [ ] Filter application
- [ ] Group/layering
- [ ] Cross-browser compatibility

### Website Tests
- [ ] Visual designer loads
- [ ] Adding/removing layers works
- [ ] Parameter changes update audio
- [ ] SPA code generation is correct
- [ ] Play button works
- [ ] Copy/download buttons work
- [ ] Presets load correctly
- [ ] Mobile responsive
- [ ] Accessibility (keyboard navigation)

### Integration Tests
- [ ] React component works
- [ ] Vue component works
- [ ] VS Code extension highlights syntax
- [ ] CLI tools work

---

## Launch Marketing

### Week 1: Soft Launch
- Tweet with video demo
- Post to personal blog
- Share in developer communities

### Week 2: Public Launch
- Show HN: "SPA - The SVG of Sound Effects"
- r/webdev, r/javascript, r/gamedev
- Dev.to article
- Product Hunt

### Week 3: Content Push
- YouTube demo video
- Blog post: "Why Your Web App Should Use SPA"
- Tutorial: "Build UI Sounds with SPA"

---

## Success Criteria

**Week 4:**
- [ ] All repos created and public
- [ ] npm package published
- [ ] Website live at spa.audio
- [ ] 500+ playground visits

**Month 2:**
- [ ] 500+ npm downloads/week
- [ ] VS Code extension published
- [ ] 3+ sites using SPA in production

**Month 6:**
- [ ] 5,000+ npm downloads/week
- [ ] Community library with 100+ sounds
- [ ] Featured in web dev newsletter

---

## Priority Order

**Do First (Critical Path):**
1. Core library (spa-js) - parsing and rendering
2. Visual designer (spa-web main page)
3. Example library (20+ sounds)
4. Documentation

**Do Second (Nice to Have):**
5. Code playground page
6. VS Code extension
7. React/Vue integrations
8. CLI tools

**Do Later (Growth):**
9. Community features
10. AI integration
11. Advanced editor features
12. Mobile app

---

## Notes for Implementation

### Performance Targets
- Parser: < 1ms for typical sounds
- Renderer: < 10ms for typical sounds
- Bundle size: < 20KB gzipped
- Website: < 2s first contentful paint

### Browser Support
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari, Chrome Android

### Accessibility
- Keyboard navigation for all controls
- ARIA labels on interactive elements
- Focus indicators
- Screen reader support

---

## Getting Help

If you get stuck on any of these steps:

1. **Parser/Renderer Issues:** Reference the Web Audio API docs
2. **UI/UX Questions:** Look at existing synth UIs for inspiration
3. **Build Issues:** Check rollup/webpack docs
4. **Deployment:** Vercel/Netlify have excellent docs

---

## Final Checklist

Before considering "done":

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Examples work
- [ ] Website deployed
- [ ] npm packages published
- [ ] GitHub repos public
- [ ] README files written
- [ ] Marketing materials ready
- [ ] Launch plan executed

---

**Now start building! Begin with spa-js parser implementation.**
