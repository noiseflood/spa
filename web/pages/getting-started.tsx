import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';

export default function GettingStarted() {
  const [activeTab, setActiveTab] = useState<'web' | 'react' | 'node'>('web');

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

          {/* Step 1: Understanding SPA */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-green-bright mb-4">1. Understanding SPA</h2>
            <div className="bg-navy-dark rounded-lg p-6 border border-navy-light/20">
              <p className="mb-4">
                SPA (Synthetic Parametric Audio) is an XML-based format for defining procedural
                sound effects.
              </p>
              <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright">
                <pre>{`<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="440" dur="1" />
</spa>`}</pre>
              </div>
            </div>
          </section>

          {/* Step 2: Basic Elements */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-green-bright mb-4">2. Basic Elements</h2>

            <div className="space-y-4">
              <div className="bg-navy-dark rounded-lg p-6 border border-navy-light/20">
                <h3 className="text-lg font-semibold mb-2 text-green-bright">Tone Element</h3>
                <p className="text-white/60 mb-4">Generate pure tones with various waveforms</p>
                <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright">
                  <pre>{`<tone
  wave="sine|square|sawtooth|triangle"
  freq="20-20000"
  dur="0.01-10"
  amp="0-1"
  pan="-1 to 1"
/>`}</pre>
                </div>
              </div>

              <div className="bg-navy-dark rounded-lg p-6 border border-navy-light/20">
                <h3 className="text-lg font-semibold mb-2 text-green-bright">Noise Element</h3>
                <p className="text-white/60 mb-4">Create various types of noise</p>
                <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright">
                  <pre>{`<noise
  color="white|pink|brown|blue"
  dur="0.01-10"
  amp="0-1"
  pan="-1 to 1"
/>`}</pre>
                </div>
              </div>

              <div className="bg-navy-dark rounded-lg p-6 border border-navy-light/20">
                <h3 className="text-lg font-semibold mb-2 text-green-bright">Group Element</h3>
                <p className="text-white/60 mb-4">Layer multiple sounds together</p>
                <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright">
                  <pre>{`<group>
  <tone wave="sine" freq="261.63" dur="1" />
  <tone wave="sine" freq="329.63" dur="1" />
  <tone wave="sine" freq="392.00" dur="1" />
</group>`}</pre>
                </div>
              </div>
            </div>
          </section>

          {/* Step 3: Envelopes */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-green-bright mb-4">3. ADSR Envelopes</h2>
            <div className="bg-navy-dark rounded-lg p-6 border border-navy-light/20">
              <p className="mb-4">
                Shape your sounds with Attack, Decay, Sustain, and Release envelopes:
              </p>
              <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright mb-4">
                <pre>{`<tone
  wave="sine"
  freq="440"
  dur="1"
  envelope="0.01,0.1,0.7,0.2"
/>
<!-- attack,decay,sustain,release -->`}</pre>
              </div>
              <ul className="list-disc list-inside text-white/60 space-y-1">
                <li>
                  <strong className="text-white">Attack:</strong> Time to reach peak (0-1s)
                </li>
                <li>
                  <strong className="text-white">Decay:</strong> Time to fall to sustain (0-1s)
                </li>
                <li>
                  <strong className="text-white">Sustain:</strong> Level to hold (0-1)
                </li>
                <li>
                  <strong className="text-white">Release:</strong> Time to fade out (0-1s)
                </li>
              </ul>
            </div>
          </section>

          {/* Step 4: Usage Examples */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-green-bright mb-4">4. Usage Examples</h2>

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
                  <h3 className="text-lg font-semibold mb-4 text-green-bright">
                    Using SPA in the Browser
                  </h3>
                  <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright overflow-x-auto">
                    <pre>{`<!-- Include the SPA library -->
<script src="https://unpkg.com/@spa-audio/core"></script>

<script>
  // Parse SPA XML
  const spaXML = \`
    <spa xmlns="https://spa.audio/ns" version="1.0">
      <tone wave="sine" freq="440" dur="0.5" />
    </spa>
  \`;

  // Create and play the sound
  const sound = SPA.parse(spaXML);
  await sound.play();
</script>`}</pre>
                  </div>
                </div>
              )}

              {activeTab === 'react' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-green-bright">
                    Using SPA in React
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright overflow-x-auto">
                      <pre>{`npm install @spa-audio/react`}</pre>
                    </div>
                    <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright overflow-x-auto">
                      <pre>{`import { SPAButton, SPAPlayer } from '@spa-audio/react';

// Simple button with sound
<SPAButton src="/sounds/click.spa">
  Click Me
</SPAButton>

// Inline SPA XML
<SPAButton spa={\`
  <spa xmlns="https://spa.audio/ns" version="1.0">
    <tone wave="sine" freq="800" dur="0.05" />
  </spa>
\`}>
  Play Sound
</SPAButton>

// Full player component
<SPAPlayer src="/sounds/music.spa" />`}</pre>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'node' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-green-bright">
                    Using SPA in Node.js
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright overflow-x-auto">
                      <pre>{`npm install @spa-audio/core`}</pre>
                    </div>
                    <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright overflow-x-auto">
                      <pre>{`import { parseSPA, renderToWAV } from '@spa-audio/core';
import fs from 'fs';

// Read SPA file
const spaXML = fs.readFileSync('sound.spa', 'utf-8');

// Parse the document
const doc = parseSPA(spaXML);

// Render to WAV file
const wavBuffer = await renderToWAV(doc, {
  sampleRate: 44100,
  bitDepth: 16
});

// Save the WAV file
fs.writeFileSync('output.wav', wavBuffer);`}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Step 5: Common Patterns */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-green-bright mb-4">
              5. Common Sound Patterns
            </h2>

            <div className="grid gap-4">
              <div className="bg-navy-dark rounded-lg p-6 border border-navy-light/20">
                <h3 className="text-lg font-semibold mb-2 text-green-bright">Button Click</h3>
                <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright">
                  <pre>{`<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="800" dur="0.05"
        envelope="0,0.02,0,0.03" />
</spa>`}</pre>
                </div>
              </div>

              <div className="bg-navy-dark rounded-lg p-6 border border-navy-light/20">
                <h3 className="text-lg font-semibold mb-2 text-green-bright">Success Chime</h3>
                <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright">
                  <pre>{`<spa xmlns="https://spa.audio/ns" version="1.0">
  <group>
    <tone wave="sine" freq="523" dur="0.15" />
    <tone wave="sine" freq="659" dur="0.3" />
    <tone wave="sine" freq="784" dur="0.45" />
  </group>
</spa>`}</pre>
                </div>
              </div>

              <div className="bg-navy-dark rounded-lg p-6 border border-navy-light/20">
                <h3 className="text-lg font-semibold mb-2 text-green-bright">Error Sound</h3>
                <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright">
                  <pre>{`<spa xmlns="https://spa.audio/ns" version="1.0">
  <group>
    <tone wave="square" freq="200" dur="0.15" amp="0.3" />
    <noise color="pink" dur="0.1" amp="0.2" />
  </group>
</spa>`}</pre>
                </div>
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-green-bright mb-4">6. Next Steps</h2>
            <div className="bg-navy-dark rounded-lg p-6 border border-navy-light/20">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-green-bright">Try the Editor</h3>
                <p className="text-white/60 mb-4">
                  Experiment with creating sounds in the interactive editor
                </p>
                <Link
                  href="/editor"
                  className="inline-block px-4 py-2 bg-navy text-green-bright border-2 border-green-bright rounded hover:bg-green-bright hover:text-navy-dark transition-colors"
                >
                  Open Editor
                </Link>
              </div>
            </div>
          </section>

          {/* AI Integration */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-green-bright mb-4">7. AI Integration</h2>
            <div className="bg-navy-dark p-px rounded-lg">
              <div className="bg-navy-dark rounded-lg p-6 border border-navy-light/20">
                <h3 className="text-lg font-semibold mb-4 text-green-bright">
                  Using SPA with AI
                </h3>
                <ul className="space-y-3 text-white/60 list-disc list-inside">
                  <li>
                    <strong className="text-white">Declarative:</strong> AI can understand and
                    generate XML easily
                  </li>
                  <li>
                    <strong className="text-white">Parametric:</strong> Clear parameters that AI
                    can reason about
                  </li>
                  <li>
                    <strong className="text-white">Context-Aware:</strong> AI can generate
                    appropriate sounds based on context
                  </li>
                  <li>
                    <strong className="text-white">Learnable:</strong> Simple patterns that AI
                    models can learn from examples
                  </li>
                </ul>

                <div className="mt-6 p-4 bg-navy rounded">
                  <p className="text-sm text-white/60 mb-2">Example AI prompt:</p>
                  <p className="text-green-bright italic">
                    "Generate a SPA file for a happy notification sound with 3 ascending tones"
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
