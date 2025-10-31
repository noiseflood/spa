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

      <div className="min-h-screen bg-navy-dark text-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <Link
              href="/"
              className="text-navy-light hover:text-green transition-colors inline-block mb-6"
            >
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold bg-navy-dark bg-clip-text text-transparent mb-4">
              Getting Started with SPA
            </h1>
            <p className="text-lg text-gray-400">
              Learn how to create and play procedural audio with SPA in just a few steps
            </p>
          </div>

          {/* Step 1: Understanding SPA */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-navy-light mb-4">1. Understanding SPA</h2>
            <div className="bg-navy rounded-lg p-6 border border-navy-light/10">
              <p className="mb-4">
                SPA (Synthetic Parametric Audio) is an XML-based format for defining procedural
                sound effects. Think of it as "SVG for audio" - declarative, Synthetic, and perfect
                for AI generation.
              </p>
              <div className="bg-navy-dark rounded p-4 font-mono text-sm text-green">
                <pre>{`<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="440" dur="1" />
</spa>`}</pre>
              </div>
            </div>
          </section>

          {/* Step 2: Basic Elements */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-navy-light mb-4">2. Basic Elements</h2>

            <div className="space-y-4">
              <div className="bg-navy rounded-lg p-6 border border-navy-light/10">
                <h3 className="text-lg font-semibold mb-2">Tone Element</h3>
                <p className="text-gray-400 mb-4">Generate pure tones with various waveforms</p>
                <div className="bg-navy-dark rounded p-4 font-mono text-sm text-green">
                  <pre>{`<tone
  wave="sine|square|sawtooth|triangle"
  freq="20-20000"
  dur="0.01-10"
  amp="0-1"
  pan="-1 to 1"
/>`}</pre>
                </div>
              </div>

              <div className="bg-navy rounded-lg p-6 border border-navy-light/10">
                <h3 className="text-lg font-semibold mb-2">Noise Element</h3>
                <p className="text-gray-400 mb-4">Create various types of noise</p>
                <div className="bg-navy-dark rounded p-4 font-mono text-sm text-green">
                  <pre>{`<noise
  color="white|pink|brown|blue"
  dur="0.01-10"
  amp="0-1"
  pan="-1 to 1"
/>`}</pre>
                </div>
              </div>

              <div className="bg-navy rounded-lg p-6 border border-navy-light/10">
                <h3 className="text-lg font-semibold mb-2">Group Element</h3>
                <p className="text-gray-400 mb-4">Layer multiple sounds together</p>
                <div className="bg-navy-dark rounded p-4 font-mono text-sm text-green">
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
            <h2 className="text-2xl font-semibold text-navy-light mb-4">3. ADSR Envelopes</h2>
            <div className="bg-navy rounded-lg p-6 border border-navy-light/10">
              <p className="mb-4">
                Shape your sounds with Attack, Decay, Sustain, and Release envelopes:
              </p>
              <div className="bg-navy-dark rounded p-4 font-mono text-sm text-green mb-4">
                <pre>{`<tone
  wave="sine"
  freq="440"
  dur="1"
  envelope="0.01,0.1,0.7,0.2"
/>
<!-- attack,decay,sustain,release -->`}</pre>
              </div>
              <ul className="list-disc list-inside text-gray-400 space-y-1">
                <li>
                  <strong className="text-gray-200">Attack:</strong> Time to reach peak (0-1s)
                </li>
                <li>
                  <strong className="text-gray-200">Decay:</strong> Time to fall to sustain (0-1s)
                </li>
                <li>
                  <strong className="text-gray-200">Sustain:</strong> Level to hold (0-1)
                </li>
                <li>
                  <strong className="text-gray-200">Release:</strong> Time to fade out (0-1s)
                </li>
              </ul>
            </div>
          </section>

          {/* Step 4: Usage Examples */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-navy-light mb-4">4. Usage Examples</h2>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('web')}
                className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                  activeTab === 'web'
                    ? 'bg-navy text-navy-light border-b-2 border-navy-light'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Web Browser
              </button>
              <button
                onClick={() => setActiveTab('react')}
                className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                  activeTab === 'react'
                    ? 'bg-navy text-navy-light border-b-2 border-navy-light'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                React
              </button>
              <button
                onClick={() => setActiveTab('node')}
                className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                  activeTab === 'node'
                    ? 'bg-navy text-navy-light border-b-2 border-navy-light'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Node.js
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-navy rounded-lg p-6 border border-navy-light/10">
              {activeTab === 'web' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Using SPA in the Browser</h3>
                  <div className="bg-navy-dark rounded p-4 font-mono text-sm text-green overflow-x-auto">
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
                  <h3 className="text-lg font-semibold mb-4">Using SPA in React</h3>
                  <div className="space-y-4">
                    <div className="bg-navy-dark rounded p-4 font-mono text-sm text-green overflow-x-auto">
                      <pre>{`npm install @spa-audio/react`}</pre>
                    </div>
                    <div className="bg-navy-dark rounded p-4 font-mono text-sm text-green overflow-x-auto">
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
                  <h3 className="text-lg font-semibold mb-4">Using SPA in Node.js</h3>
                  <div className="space-y-4">
                    <div className="bg-navy-dark rounded p-4 font-mono text-sm text-green overflow-x-auto">
                      <pre>{`npm install @spa-audio/core`}</pre>
                    </div>
                    <div className="bg-navy-dark rounded p-4 font-mono text-sm text-green overflow-x-auto">
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
            <h2 className="text-2xl font-semibold text-navy-light mb-4">
              5. Common Sound Patterns
            </h2>

            <div className="grid gap-4">
              <div className="bg-navy rounded-lg p-6 border border-navy-light/10">
                <h3 className="text-lg font-semibold mb-2">Button Click</h3>
                <div className="bg-navy-dark rounded p-4 font-mono text-sm text-green">
                  <pre>{`<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="800" dur="0.05"
        envelope="0,0.02,0,0.03" />
</spa>`}</pre>
                </div>
              </div>

              <div className="bg-navy rounded-lg p-6 border border-navy-light/10">
                <h3 className="text-lg font-semibold mb-2">Success Chime</h3>
                <div className="bg-navy-dark rounded p-4 font-mono text-sm text-green">
                  <pre>{`<spa xmlns="https://spa.audio/ns" version="1.0">
  <group>
    <tone wave="sine" freq="523" dur="0.15" />
    <tone wave="sine" freq="659" dur="0.3" />
    <tone wave="sine" freq="784" dur="0.45" />
  </group>
</spa>`}</pre>
                </div>
              </div>

              <div className="bg-navy rounded-lg p-6 border border-navy-light/10">
                <h3 className="text-lg font-semibold mb-2">Error Sound</h3>
                <div className="bg-navy-dark rounded p-4 font-mono text-sm text-green">
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
            <h2 className="text-2xl font-semibold text-navy-light mb-4">6. Next Steps</h2>
            <div className="bg-navy rounded-lg p-6 border border-navy-light/10">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Try the Editor</h3>
                  <p className="text-gray-400 mb-4">
                    Experiment with creating sounds visually in our interactive editor
                  </p>
                  <Link
                    href="/editor"
                    className="inline-block px-4 py-2 bg-navy-light text-white rounded hover:bg-navy-light-dark transition-colors"
                  >
                    Open Editor →
                  </Link>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Explore Examples</h3>
                  <p className="text-gray-400 mb-4">
                    Browse our collection of pre-made sound effects and patterns
                  </p>
                  <Link
                    href="/examples"
                    className="inline-block px-4 py-2 bg-navy border border-navy-light text-gray-200 rounded hover:bg-navy-light hover:text-white transition-colors"
                  >
                    View Examples →
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* AI Integration */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-navy-light mb-4">7. AI Integration</h2>
            <div className="bg-navy-dark p-px rounded-lg">
              <div className="bg-navy rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Why SPA is Perfect for AI</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex gap-3">
                    <span className="text-navy-light">✓</span>
                    <span>
                      <strong>Declarative:</strong> AI can understand and generate XML easily
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-navy-light">✓</span>
                    <span>
                      <strong>Parametric:</strong> Clear parameters that AI can reason about
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-navy-light">✓</span>
                    <span>
                      <strong>Context-Aware:</strong> AI can generate appropriate sounds based on
                      context
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-navy-light">✓</span>
                    <span>
                      <strong>Learnable:</strong> Simple patterns that AI models can learn from
                      examples
                    </span>
                  </li>
                </ul>

                <div className="mt-6 p-4 bg-navy-dark rounded">
                  <p className="text-sm text-gray-400 mb-2">Example AI prompt:</p>
                  <p className="text-green italic">
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
