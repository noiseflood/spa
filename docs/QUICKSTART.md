# SPA Quick Start Guide

## What is SPA?

**SPA (Synthetic Parametric Audio)** is the SVG of sound effects - a tiny, declarative XML format for generating simple sounds procedurally.

**Perfect for:** Button clicks, UI feedback, web game sounds, notifications

**Not for:** Music, speech, realistic instruments, long audio

---

## Your First Sound (30 seconds)

```xml
<spa version="1.0">
  <tone wave="sine" freq="800" dur="0.05" envelope="0,0.02,0,0.03"/>
</spa>
```

**That's a button click.** 

- File size: 80 bytes
- Equivalent WAV: 9.6 KB
- **120x smaller**

---

## Core Concepts

### 1. Sound Elements

**Tone** (oscillator)
```xml
<tone wave="sine" freq="440" dur="1.0"/>
```

**Noise** (random)
```xml
<noise color="white" dur="0.5"/>
```

**Group** (layer sounds)
```xml
<group>
  <tone wave="sine" freq="440" dur="1.0"/>
  <tone wave="sine" freq="554" dur="1.0"/>
</group>
```

### 2. Envelopes (ADSR)

Control how volume changes over time:

```xml
<tone wave="sine" freq="440" dur="1.0" 
      envelope="0.01,0.2,0.3,0.5"/>
      <!-- attack, decay, sustain, release -->
```

**Presets:**
- Pluck: `"0.01,0.1,0.2,0.1"`
- Pad: `"0.5,0.3,0.7,1.0"`
- Stab: `"0,0.1,0,0.1"`

### 3. Parameter Automation

Animate any parameter:

```xml
<!-- Pitch sweep (laser) -->
<tone wave="saw" dur="0.5"
      freq.start="1000" freq.end="200" freq.curve="exp"/>

<!-- Fade in -->
<tone wave="sine" freq="440" dur="2.0"
      amp.start="0" amp.end="1.0" amp.curve="smooth"/>
```

**Curves:** `linear`, `exp`, `log`, `smooth`

### 4. Filters

Shape the timbre:

```xml
<tone wave="saw" freq="220" dur="1.0"
      filter="lowpass" 
      cutoff="1000" 
      resonance="2.0"/>
```

**Types:** `lowpass`, `highpass`, `bandpass`

---

## Common Patterns

### Button Click
```xml
<tone wave="sine" freq="800" dur="0.05" envelope="0,0.02,0,0.03"/>
```

### Error Beep
```xml
<group>
  <tone wave="square" freq="400" dur="0.15" envelope="0,0.05,0.5,0.1"/>
  <tone wave="square" freq="350" dur="0.15" envelope="0,0.05,0.5,0.1"/>
</group>
```

### Success Chime
```xml
<group>
  <tone wave="sine" freq="523" dur="0.15" envelope="0,0.05,0.3,0.1"/>
  <tone wave="sine" freq="659" dur="0.3" envelope="0,0.1,0.5,0.2"/>
</group>
```

### Laser
```xml
<group>
  <tone wave="saw" dur="0.3"
        freq.start="1200" freq.end="200" freq.curve="exp"
        envelope="0,0.1,0,0.2"/>
  <noise color="white" dur="0.1" amp="0.3" envelope="0,0.05,0,0.05"/>
</group>
```

### Whoosh
```xml
<noise color="white" dur="0.5"
       filter="bandpass" resonance="2.0"
       cutoff.start="2000" cutoff.end="200" cutoff.curve="exp"
       envelope="0,0.2,0.4,0.3"/>
```

---

## Using SPA in Code

### Install
```bash
npm install spa-audio
```

### Basic Usage
```javascript
import { playSPA, renderSPA } from 'spa-audio';

// Play directly
await playSPA('<spa version="1.0">...</spa>');

// Or from file
await playSPA.fromURL('/sounds/click.spa');

// Get AudioBuffer
const buffer = await renderSPA('<spa version="1.0">...</spa>');
```

### React
```bash
npm install spa-react
```

```jsx
import { SPASound } from 'spa-react';

<button onClick={() => sound.play()}>
  Click Me
  <SPASound ref={sound} src="/click.spa" />
</button>
```

### Inline in HTML
```html
<script type="module">
  import { playSPA } from 'https://cdn.skypack.dev/spa-audio';
  
  document.getElementById('btn').addEventListener('click', () => {
    playSPA('<spa version="1.0"><tone wave="sine" freq="800" dur="0.05"/></spa>');
  });
</script>
```

---

## Parameter Reference

### Common Attributes

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `wave` | sine, square, triangle, saw | - | Waveform type |
| `freq` | Number (Hz) | - | Frequency/pitch |
| `dur` | Number (seconds) | - | Duration |
| `amp` | 0.0-1.0 | 1.0 | Volume |
| `envelope` | "A,D,S,R" | "0,0,1,0" | ADSR envelope |
| `pan` | -1.0 to 1.0 | 0 | Stereo position |
| `color` | white, pink, brown | - | Noise type |
| `filter` | lowpass, highpass, bandpass | - | Filter type |
| `cutoff` | Number (Hz) | - | Filter frequency |
| `resonance` | 0.1-20.0 | 1.0 | Filter emphasis |

### Automation Suffixes

Add `.start`, `.end`, and `.curve` to any numeric parameter:

```xml
freq.start="440" freq.end="880" freq.curve="exp"
```

---

## Tips & Tricks

### File Size
- Average UI sound: ~100 bytes
- 50 sounds: ~5 KB
- Same as WAV: ~500 KB
- **100x savings**

### Dynamic Sounds
```javascript
// Change pitch based on user action
const freq = 400 + (score * 10);
playSPA(`<spa version="1.0">
  <tone wave="sine" freq="${freq}" dur="0.1"/>
</spa>`);
```

### Randomization
```javascript
// Slightly vary each play
const freq = 800 + Math.random() * 100;
const dur = 0.04 + Math.random() * 0.02;
```

### Reusable Envelopes
```xml
<spa version="1.0">
  <defs>
    <envelope id="pluck" attack="0.01" decay="0.2" sustain="0.3" release="0.5"/>
  </defs>
  
  <tone wave="sine" freq="440" dur="1.0" envelope="#pluck"/>
  <tone wave="sine" freq="554" dur="1.0" envelope="#pluck"/>
</spa>
```

---

## When to Use SPA

### ✅ Use SPA for:
- Button clicks and UI sounds
- Form validation feedback
- Notification alerts
- Simple game effects
- Placeholder sounds
- Generated/procedural audio
- Bundle size matters
- Dynamic pitch/timing needed

### ❌ Use WAV/MP3 for:
- Realistic instruments
- Human voices
- Complex production
- Long audio (>5s)
- Licensed music
- Quality over size

---

## Resources

**Documentation:** `spa.audio/docs`  
**Playground:** `spa.audio/playground`  
**Examples:** `spa.audio/examples`  
**GitHub:** `github.com/spa-audio/spa-js`  
**Discord:** `[link]`

---

## Next Steps

1. **Try the playground** - Edit SPA, hear results instantly
2. **Browse examples** - 50+ ready-to-use sounds
3. **Install the package** - Add to your project
4. **Read the full spec** - Deep dive into all features
5. **Join Discord** - Get help, share sounds

---

## Quick Reference Card

```xml
<spa version="1.0">
  <!-- Basic tone -->
  <tone wave="sine|square|triangle|saw" 
        freq="440" 
        dur="1.0"
        amp="1.0"
        envelope="0.01,0.2,0.3,0.5"/>
  
  <!-- Noise -->
  <noise color="white|pink|brown" 
         dur="1.0"/>
  
  <!-- Group/layer -->
  <group>
    <!-- Multiple sounds -->
  </group>
  
  <!-- Automation -->
  <tone wave="saw" dur="1.0"
        freq.start="1000" freq.end="200" freq.curve="exp"/>
  
  <!-- Filter -->
  <tone wave="saw" dur="1.0"
        filter="lowpass|highpass|bandpass"
        cutoff="1000"
        resonance="2.0"/>
  
  <!-- Reusable definitions -->
  <defs>
    <envelope id="name" attack="0.01" decay="0.2" sustain="0.3" release="0.5"/>
  </defs>
</spa>
```

---

**Welcome to SPA. Let's make web audio better.** 🔊
