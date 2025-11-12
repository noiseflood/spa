import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';
import { useSound } from '../contexts/SoundContext';

export default function GettingStarted() {
  const [activeTab, setActiveTab] = useState<'web' | 'react' | 'node'>('react');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const { playSound } = useSound();

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommand(id);
      playSound('ui-feedback/success');
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAIPrompt = async () => {
    const prompt = `# SPA (Synthetic Parametric Audio) Expert Assistant

You are an expert sound designer helping users create SPA audio files. SPA is an XML format for creating synthesized sound effects using declarative code. Think of it as "SVG for sound" - instead of audio files, you describe sounds parametrically.

## Basic Structure
Every SPA file must follow this structure:
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <!-- Sound elements go here -->
</spa>
\`\`\`

## Core Elements

### 1. Tone (Oscillator)
Generates periodic waveforms:
\`\`\`xml
<tone wave="sine|square|triangle|saw|pulse" freq="440" dur="1.0"
      amp="0.5" envelope="0.01,0.1,0.7,0.2" pan="-0.5"/>
\`\`\`
- **wave**: Waveform shape (sine=smooth, square=harsh/digital, triangle=mellow, saw=bright, pulse=punchy)
- **freq**: Frequency in Hz (20-20000, middle C=261.63, A=440)
- **dur**: Duration in seconds
- **amp**: Volume 0-1 (default 1)
- **envelope**: Attack,Decay,Sustain,Release times (see ADSR section)
- **pan**: -1=left, 0=center, 1=right

### 2. Noise
Random waveforms for texture:
\`\`\`xml
<noise color="white|pink|brown" dur="0.5" amp="0.3" envelope="0,0.05,0,0.1"/>
\`\`\`
- **white**: Bright hiss (rain, steam)
- **pink**: Natural, balanced (wind, waves)
- **brown**: Deep rumble (thunder, earthquakes)

### 3. Group
Layer multiple sounds that play simultaneously:
\`\`\`xml
<group>
  <tone wave="sine" freq="200" dur="0.5"/>
  <tone wave="sine" freq="400" dur="0.5"/>
</group>
\`\`\`

### 4. Sequence
Schedule sounds over time:
\`\`\`xml
<sequence>
  <tone wave="sine" freq="523" dur="0.2" at="0"/>
  <tone wave="sine" freq="659" dur="0.2" at="0.3"/>
  <tone wave="sine" freq="784" dur="0.2" at="0.6"/>
</sequence>
\`\`\`

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
\`\`\`xml
<!-- Frequency sweep (laser) -->
<tone wave="saw" dur="0.5"
      freq.start="2000" freq.end="100" freq.curve="exp"/>

<!-- Volume fade -->
<tone wave="sine" freq="440" dur="2"
      amp.start="0" amp.end="1" amp.curve="smooth"/>

<!-- Filter sweep -->
<tone wave="saw" freq="220" dur="1" filter="lowpass"
      cutoff.start="200" cutoff.end="5000" cutoff.curve="exp"/>
\`\`\`
Curves: linear, exp (fast then slow), log (slow then fast), smooth (ease in/out)

## Filters
Shape the timbre:
\`\`\`xml
<tone wave="saw" freq="220" dur="1"
      filter="lowpass" cutoff="1000" resonance="2"/>
\`\`\`
- **lowpass**: Remove high frequencies (muffled)
- **highpass**: Remove low frequencies (tinny)
- **bandpass**: Keep only middle frequencies (telephone)
- **resonance**: 0.1-20, emphasis at cutoff

## Repeat
Create rhythmic patterns:
\`\`\`xml
<!-- Heartbeat -->
<tone wave="sine" freq="60" dur="0.1"
      repeat="100" repeat.interval="0.8"/>

<!-- Echo with decay -->
<tone wave="sine" freq="440" dur="0.2"
      repeat="5" repeat.interval="0.2"
      repeat.decay="0.3" repeat.pitchShift="-2"/>
\`\`\`

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

## Example: Laser Shot
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <group>
    <tone wave="saw" dur="0.3"
          freq.start="1200" freq.end="200" freq.curve="exp"
          envelope="0,0.1,0,0.2"/>
    <noise color="white" dur="0.1" amp="0.3" envelope="0,0.05,0,0.05"/>
  </group>
</spa>
\`\`\`

## Example: Notification
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <sequence>
    <tone wave="sine" freq="523" dur="0.15" at="0" envelope="0.01,0.03,0.6,0.11"/>
    <tone wave="sine" freq="659" dur="0.15" at="0.2" envelope="0.01,0.03,0.6,0.11"/>
    <tone wave="sine" freq="784" dur="0.25" at="0.4" envelope="0.01,0.04,0.7,0.20"/>
  </sequence>
</spa>
\`\`\`

## Tips
1. Start simple - single tone with envelope
2. Layer sounds with groups for richness
3. Use automation for dynamic effects
4. Combine tones + noise for realism
5. Short sounds (<1s) work best
6. Test different waveforms for character
7. Filters dramatically change sound
8. Small frequency changes = big perceptual difference

## Instructions
When a user asks for a sound:
1. Generate valid SPA XML code with proper structure
2. Explain your design choices briefly
3. Always include the <?xml> declaration and <spa> root element with xmlns and version
4. Keep sounds simple and effective
5. Ensure your XML is valid and follows the SPA specification exactly

Now, generate a SPA file for the following sound:`;

    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      playSound('ui-feedback/success');
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  return (
    <>
      <Head>
        <title>Getting Started - SPA</title>
        <meta name="description" content="Learn how to use SPA - Synthetic Parametric Audio" />
      </Head>

      <div className="min-h-screen bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <Link
              href="/"
              className="text-white/60 hover:text-green-bright transition-colors inline-block mb-6"
            >
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-green-bright mb-4">Getting Started with SPA</h1>
            <p className="text-lg text-white/60">
              Learn how to create and play procedural audio with SPA in just a few steps
            </p>
          </div>

          {/* Section 1: Installation */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-bright/20 flex items-center justify-center text-green-bright font-bold">
                1
              </div>
              <h2 className="text-2xl font-semibold text-green-bright">Install the Packages</h2>
            </div>

            <p className="text-white/70 mb-6">
              Choose your platform and install the SPA packages. All packages are lightweight and have zero dependencies.
            </p>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('web')}
                className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                  activeTab === 'web'
                    ? 'bg-navy-dark text-green-bright border-b-2 border-green-bright'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Web Browser
              </button>
              <button
                onClick={() => setActiveTab('react')}
                className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                  activeTab === 'react'
                    ? 'bg-navy-dark text-green-bright border-b-2 border-green-bright'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                React
              </button>
              <button
                onClick={() => setActiveTab('node')}
                className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                  activeTab === 'node'
                    ? 'bg-navy-dark text-green-bright border-b-2 border-green-bright'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Node.js
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-navy-dark rounded-lg p-6 border border-navy-light/20">
              {activeTab === 'web' && (
                <div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">CDN (quickest)</h4>
                        <button
                          onClick={() => copyToClipboard('<script src="https://unpkg.com/@spa-audio/core"></script>', 'cdn')}
                          className="text-xs px-3 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                        >
                          {copiedCommand === 'cdn' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="bg-navy rounded p-3 font-mono text-sm text-green-bright overflow-x-auto">
                        <pre>{`<script src="https://unpkg.com/@spa-audio/core"></script>`}</pre>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">NPM</h4>
                        <button
                          onClick={() => copyToClipboard('npm install @spa-audio/core', 'npm-web')}
                          className="text-xs px-3 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                        >
                          {copiedCommand === 'npm-web' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="bg-navy rounded p-3 font-mono text-sm text-green-bright overflow-x-auto">
                        <pre>npm install @spa-audio/core</pre>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-navy rounded">
                      <p className="text-white/70 text-sm mb-2">Basic usage:</p>
                      <div className="font-mono text-xs text-green-bright">
                        <pre>{`import { parseSPA, playSPA } from '@spa-audio/core';

// Play directly from XML
await playSPA('<spa>...</spa>');

// Or parse first
const sound = parseSPA('<spa>...</spa>');
await sound.play();`}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'react' && (
                <div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">Install React package</h4>
                        <button
                          onClick={() => copyToClipboard('npm install @spa-audio/react', 'npm-react')}
                          className="text-xs px-3 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                        >
                          {copiedCommand === 'npm-react' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="bg-navy rounded p-3 font-mono text-sm text-green-bright">
                        <pre>npm install @spa-audio/react</pre>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-navy rounded">
                      <p className="text-white/70 text-sm mb-2">Components:</p>
                      <div className="font-mono text-xs text-green-bright">
                        <pre>{`import { SPAButton, SPAPlayer } from '@spa-audio/react';

// Button with sound
<SPAButton src="/sounds/click.spa">
  Click Me
</SPAButton>

// Inline SPA
<SPAButton spa='<spa><tone wave="sine" freq="800" dur="0.05"/></spa>'>
  Play
</SPAButton>

// Full player
<SPAPlayer src="/sounds/music.spa" />`}</pre>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-navy rounded">
                      <p className="text-white/70 text-sm mb-2">Hook for custom usage:</p>
                      <div className="font-mono text-xs text-green-bright">
                        <pre>{`import { useSPA } from '@spa-audio/react';

const { play, stop, loading } = useSPA('/sound.spa');

// Trigger playback
<button onClick={play}>Play</button>`}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'node' && (
                <div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">Install core package</h4>
                        <button
                          onClick={() => copyToClipboard('npm install @spa-audio/core', 'npm-node')}
                          className="text-xs px-3 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                        >
                          {copiedCommand === 'npm-node' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="bg-navy rounded p-3 font-mono text-sm text-green-bright">
                        <pre>npm install @spa-audio/core</pre>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-navy rounded">
                      <p className="text-white/70 text-sm mb-2">Parse and play SPA files:</p>
                      <div className="font-mono text-xs text-green-bright">
                        <pre>{`import { parseSPA, playSPA } from '@spa-audio/core';
import fs from 'fs';

// Read and parse SPA file
const spaXML = fs.readFileSync('sound.spa', 'utf-8');
const sound = parseSPA(spaXML);

// Play the sound (if audio context available)
await sound.play();

// Or play directly from XML
await playSPA(spaXML);`}</pre>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-navy rounded">
                      <p className="text-white/70 text-sm mb-2">Generate audio data:</p>
                      <div className="font-mono text-xs text-green-bright">
                        <pre>{`// Note: Check package docs for exact API
// This shows the conceptual workflow

import { parseSPA } from '@spa-audio/core';
import fs from 'fs';

const spaXML = fs.readFileSync('sound.spa', 'utf-8');
const sound = parseSPA(spaXML);

// Generate audio buffer (API may vary)
const audioBuffer = await sound.toBuffer({
  sampleRate: 44100,
  format: 'wav'
});

// Save to file
fs.writeFileSync('output.wav', audioBuffer);`}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Generate with AI */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-bright/20 flex items-center justify-center text-green-bright font-bold">
                2
              </div>
              <h2 className="text-2xl font-semibold text-green-bright">Generate with AI</h2>
            </div>

            <p className="text-white/70 mb-6">
              SPA was designed to be AI-friendly. LLMs can easily generate valid SPA files because the format is declarative XML with clear parameters.
            </p>

            <div className="bg-navy-dark rounded-lg p-6 border border-navy-light/20">
              <h3 className="text-lg font-semibold mb-4 text-green-bright">How to Generate SPA with AI</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/70">
                  <span className="text-green-bright font-bold">1.</span>
                  <span>Copy the prompt template below</span>
                </div>

                <div className="flex items-center gap-2 text-white/70">
                  <span className="text-green-bright font-bold">2.</span>
                  <span>Paste it into your favorite AI (ChatGPT, Claude, etc.)</span>
                </div>

                <div className="flex items-center gap-2 text-white/70">
                  <span className="text-green-bright font-bold">3.</span>
                  <span>Add your sound description at the end</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-navy rounded">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white">AI Prompt Template</h4>
                  <button
                    onClick={copyAIPrompt}
                    className="px-4 py-2 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors font-semibold"
                  >
                    {copiedPrompt ? 'Copied to Clipboard!' : 'Copy Prompt'}
                  </button>
                </div>
                <div className="text-sm text-white/60 font-mono">
                  <p className="mb-2">This comprehensive prompt includes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Complete SPA documentation and specification</li>
                    <li>All core elements: tone, noise, group, sequence</li>
                    <li>ADSR envelopes, filters, and parameter automation</li>
                    <li>Sound design patterns for UI, games, and music</li>
                    <li>Working examples with explanations</li>
                    <li>Expert instructions for generating valid SPA files</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-navy rounded">
                <h4 className="font-semibold text-white mb-2">Example Descriptions to Try</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>• "A retro 8-bit coin collection sound"</li>
                  <li>• "A soft notification chime with 3 harmonious tones"</li>
                  <li>• "A laser gun sound effect for a sci-fi game"</li>
                  <li>• "A gentle wave crashing sound using filtered noise"</li>
                  <li>• "An error sound that's not too harsh"</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Learn the Format */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-bright/20 flex items-center justify-center text-green-bright font-bold">
                3
              </div>
              <h2 className="text-2xl font-semibold text-green-bright">Learn the Format</h2>
            </div>

            <p className="text-white/70 mb-6">
              Understand how to construct SPA files from basic building blocks. Every sound starts with these fundamentals.
            </p>

            <div className="space-y-6">
              {/* Basic Structure */}
              <div className="bg-navy-dark rounded-lg p-6 border border-navy-light/20">
                <h3 className="text-lg font-semibold mb-3 text-green-bright">Basic Structure</h3>
                <p className="text-white/70 mb-4">Every SPA file follows this structure:</p>
                <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright overflow-x-auto">
                  <pre>{`<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <!-- Your sound elements go here -->
  <tone wave="sine" freq="440" dur="1" />
</spa>`}</pre>
                </div>
              </div>

              {/* Core Elements */}
              <div className="bg-navy-dark rounded-lg p-6 border border-navy-light/20">
                <h3 className="text-lg font-semibold mb-3 text-green-bright">Core Elements</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      <code className="text-green-bright">&lt;tone&gt;</code> - Oscillator sounds
                    </h4>
                    <p className="text-white/60 text-sm mb-2">Create pure tones with different waveforms</p>
                    <div className="bg-navy rounded p-3 font-mono text-xs text-green-bright">
                      <pre>{`<tone wave="sine" freq="440" dur="1" amp="0.5" />`}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      <code className="text-green-bright">&lt;noise&gt;</code> - Noise generators
                    </h4>
                    <p className="text-white/60 text-sm mb-2">Generate different colors of noise</p>
                    <div className="bg-navy rounded p-3 font-mono text-xs text-green-bright">
                      <pre>{`<noise color="white" dur="0.5" amp="0.3" />`}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      <code className="text-green-bright">&lt;group&gt;</code> - Layer sounds
                    </h4>
                    <p className="text-white/60 text-sm mb-2">Play multiple sounds simultaneously</p>
                    <div className="bg-navy rounded p-3 font-mono text-xs text-green-bright">
                      <pre>{`<group>
  <tone wave="sine" freq="261.63" dur="1" /> <!-- C -->
  <tone wave="sine" freq="329.63" dur="1" /> <!-- E -->
  <tone wave="sine" freq="392" dur="1" />    <!-- G -->
</group>`}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      <code className="text-green-bright">&lt;sequence&gt;</code> - Time events
                    </h4>
                    <p className="text-white/60 text-sm mb-2">Play sounds in sequence with timing</p>
                    <div className="bg-navy rounded p-3 font-mono text-xs text-green-bright">
                      <pre>{`<sequence>
  <tone wave="sine" freq="261.63" dur="0.25" at="0" />
  <tone wave="sine" freq="329.63" dur="0.25" at="0.25" />
  <tone wave="sine" freq="392" dur="0.25" at="0.5" />
</sequence>`}</pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div className="bg-navy-dark rounded-lg p-6 border border-navy-light/20">
                <h3 className="text-lg font-semibold mb-4 text-green-bright">Resources</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/docs"
                    className="block p-4 bg-navy rounded border border-navy-light/20 hover:border-green-bright/50 transition-colors group"
                  >
                    <h4 className="font-semibold text-green-bright mb-2 group-hover:text-green-bright/80">
                      📖 Full Documentation
                    </h4>
                    <p className="text-sm text-white/60">
                      Complete reference for all elements, attributes, and advanced features
                    </p>
                  </Link>

                  <Link
                    href="/editor"
                    className="block p-4 bg-navy rounded border border-navy-light/20 hover:border-green-bright/50 transition-colors group"
                  >
                    <h4 className="font-semibold text-green-bright mb-2 group-hover:text-green-bright/80">
                      🎵 Interactive Editor
                    </h4>
                    <p className="text-sm text-white/60">
                      Try SPA in your browser with instant playback and examples
                    </p>
                  </Link>
                </div>

                <div className="mt-4 p-4 bg-navy rounded">
                  <h4 className="font-semibold text-white mb-2">Quick Tips</h4>
                  <ul className="space-y-1 text-sm text-white/60">
                    <li>• All durations are in seconds</li>
                    <li>• Frequencies are in Hz (440 = A4)</li>
                    <li>• Amplitudes range from 0 to 1</li>
                    <li>• Pan values: -1 (left) to 1 (right)</li>
                    <li>• Use ADSR envelopes: "attack,decay,sustain,release"</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
