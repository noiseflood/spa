# SPA (Synthetic Parametric Audio) Composition Guide

SPA is an XML format for creating synthesized sound effects using declarative code. Think of it as "SVG for sound" - instead of audio files, you describe sounds parametrically.

## Basic Structure
```xml
<?xml version="1.1" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.1">
  <!-- Sound elements go here -->
</spa>
```

## Core Elements

### 1. Tone (Oscillator)
Generates periodic waveforms:
```xml
<tone wave="sine|square|triangle|saw|pulse" freq="440" dur="1.0" 
      amp="0.5" envelope="0.01,0.1,0.7,0.2" pan="-0.5"/>
```
- **wave**: Waveform shape (sine=smooth, square=harsh/digital, triangle=mellow, saw=bright, pulse=punchy)
- **freq**: Frequency in Hz (20-20000, middle C=261.63, A=440)
- **dur**: Duration in seconds
- **amp**: Volume 0-1 (default 1)
- **envelope**: Attack,Decay,Sustain,Release times (see below)
- **pan**: -1=left, 0=center, 1=right

### 2. Noise
Random waveforms for texture:
```xml
<noise color="white|pink|brown" dur="0.5" amp="0.3" envelope="0,0.05,0,0.1"/>
```
- **white**: Bright hiss (rain, steam)
- **pink**: Natural, balanced (wind, waves)  
- **brown**: Deep rumble (thunder, earthquakes)

### 3. Group
Layer multiple sounds:
```xml
<group>
  <tone wave="sine" freq="200" dur="0.5"/>
  <tone wave="sine" freq="400" dur="0.5"/>
</group>
```

### 4. Sequence
Schedule sounds over time:
```xml
<sequence>
  <tone wave="sine" freq="523" dur="0.2" at="0"/>
  <tone wave="sine" freq="659" dur="0.2" at="0.3"/>
  <tone wave="sine" freq="784" dur="0.2" at="0.6"/>
</sequence>
```

## ADSR Envelopes
Control volume shape over time: "Attack,Decay,Sustain,Release"
- Attack: Time to reach peak (0-10s)
- Decay: Time to fall to sustain (0-10s)
- Sustain: Hold level (0-1)
- Release: Fade out time (0-10s)

Common patterns:
- Pluck: "0.01,0.1,0.2,0.1" (fast attack, quick decay)
- Pad: "0.5,0.3,0.7,1.0" (slow attack, long release)
- Stab: "0,0.1,0,0.1" (instant on, no sustain)
- Click: "0,0.02,0,0.03" (very short)

## Parameter Automation
Animate any numeric parameter:
```xml
<!-- Frequency sweep (laser) -->
<tone wave="saw" dur="0.5" 
      freq.start="2000" freq.end="100" freq.curve="exp"/>

<!-- Volume fade -->
<tone wave="sine" freq="440" dur="2" 
      amp.start="0" amp.end="1" amp.curve="smooth"/>

<!-- Filter sweep -->
<tone wave="saw" freq="220" dur="1" filter="lowpass"
      cutoff.start="200" cutoff.end="5000" cutoff.curve="exp"/>
```
Curves: linear, exp (fast then slow), log (slow then fast), smooth (ease in/out)

## Filters
Shape the timbre:
```xml
<tone wave="saw" freq="220" dur="1" 
      filter="lowpass" cutoff="1000" resonance="2"/>
```
- **lowpass**: Remove high frequencies (muffled)
- **highpass**: Remove low frequencies (tinny)
- **bandpass**: Keep only middle frequencies (telephone)
- **resonance**: 0.1-20, emphasis at cutoff

## Repeat
Create rhythmic patterns:
```xml
<!-- Heartbeat -->
<tone wave="sine" freq="60" dur="0.1" 
      repeat="100" repeat.interval="0.8"/>

<!-- Echo with decay -->
<tone wave="sine" freq="440" dur="0.2"
      repeat="5" repeat.interval="0.2" 
      repeat.decay="0.3" repeat.pitchShift="-2"/>
```

## Sound Design Patterns

### UI Sounds
- **Click**: Short sine 800Hz, 50ms, envelope "0,0.02,0,0.03"
- **Error**: Two square tones 400+350Hz, 150ms each
- **Success**: Ascending sines 523+659Hz
- **Hover**: Quiet sine 600Hz, 30ms

### Game Effects
- **Laser**: Saw wave, freq sweep 1200→200Hz exponential
- **Explosion**: White noise + low sine 50Hz
- **Coin**: Square wave sweep 988→1319Hz linear
- **Jump**: Square sweep 400→600Hz smooth

### Natural Sounds
- **Wind**: Pink noise with bandpass filter ~800Hz
- **Thunder**: Brown noise, long envelope
- **Water**: White noise, bandpass 2000Hz

### Musical
- **Bass**: Sine/triangle <200Hz
- **Lead**: Saw/square with filter
- **Pad**: Multiple sines, slow envelope

## Example Compositions

### Button Click
```xml
<spa xmlns="https://spa.audio/ns" version="1.1">
  <tone wave="sine" freq="800" dur="0.05" envelope="0,0.02,0,0.03"/>
</spa>
```

### Laser Shot
```xml
<spa xmlns="https://spa.audio/ns" version="1.1">
  <group>
    <tone wave="saw" dur="0.3" 
          freq.start="1200" freq.end="200" freq.curve="exp"
          envelope="0,0.1,0,0.2"/>
    <noise color="white" dur="0.1" amp="0.3" envelope="0,0.05,0,0.05"/>
  </group>
</spa>
```

### Notification
```xml
<spa xmlns="https://spa.audio/ns" version="1.1">
  <sequence>
    <tone wave="sine" freq="523" dur="0.15" at="0" envelope="0.01,0.03,0.6,0.11"/>
    <tone wave="sine" freq="659" dur="0.15" at="0.2" envelope="0.01,0.03,0.6,0.11"/>
    <tone wave="sine" freq="784" dur="0.25" at="0.4" envelope="0.01,0.04,0.7,0.20"/>
  </sequence>
</spa>
```

## Tips
1. Start simple - single tone with envelope
2. Layer sounds with groups for richness
3. Use automation for dynamic effects
4. Combine tones + noise for realism
5. Short sounds (<1s) work best
6. Test different waveforms for character
7. Filters dramatically change sound
8. Small frequency changes = big perceptual difference

When composing, think about:
- **Pitch**: Low=powerful, High=attention
- **Duration**: Short=UI, Long=ambient
- **Envelope**: Shape=character
- **Layers**: Complexity=richness
- **Movement**: Automation=interest
