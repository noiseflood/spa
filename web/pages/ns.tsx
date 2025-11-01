import Head from 'next/head';

export default function Namespace() {
  return (
    <>
      <Head>
        <title>SPA Namespace - Synthetic Parametric Audio</title>
        <meta name="description" content="Official namespace for SPA (Synthetic Parametric Audio) v1.1 specification" />
      </Head>

      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-4">SPA (Synthetic Parametric Audio)</h1>
        <div className="mb-8 space-y-2">
          <p><strong>Namespace:</strong> <code className="bg-gray-100 px-2 py-1 rounded">https://spa.audio/ns</code></p>
          <p><strong>Version:</strong> 1.1</p>
          <p><strong>Status:</strong> Stable</p>
        </div>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">About</h2>
          <p className="text-gray-700 leading-relaxed">
            SPA (Synthetic Parametric Audio) is a declarative XML format for defining
            procedural sound effects. Think of it as "the SVG of sound effects" -
            instead of storing raw audio data, you describe how to generate sounds
            parametrically. This results in files that are 50-100x smaller than
            traditional WAV/MP3 files for simple sound effects.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Specification</h2>
          <p>
            <a href="/docs/SPEC.md" className="text-blue-600 hover:underline">View Full Specification →</a>
          </p>
          <p className="mt-2">
            <a href="/docs/QUICKSTART.md" className="text-blue-600 hover:underline">Quick Start Guide →</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Schema</h2>
          <p>
            <a href="/schema/spa-v1.1.schema.json" className="text-blue-600 hover:underline">
              JSON Schema Definition (v1.1) →
            </a>
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Example Usage</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
{`<?xml version="1.1" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.1">
  <tone wave="sine" freq="800" dur="0.05"
        envelope="0,0.02,0,0.03"/>
</spa>`}
          </pre>
          <p className="mt-3 text-sm text-gray-600">
            This creates a simple button click sound - an 800Hz sine wave lasting 50ms with a quick envelope.
            File size: ~80 bytes vs ~9.6KB for equivalent WAV file.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Tools</h2>
          <ul className="space-y-2">
            <li><a href="/" className="text-blue-600 hover:underline">Visual Designer</a> - Design sounds visually</li>
            <li><a href="/editor" className="text-blue-600 hover:underline">Code Editor</a> - Write and test SPA code</li>
            <li><a href="/getting-started" className="text-blue-600 hover:underline">Getting Started</a> - Learn SPA basics</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Packages</h2>
          <ul className="space-y-2">
            <li><code className="bg-gray-100 px-2 py-1 rounded">@spa-audio/core</code> - Core parser and renderer</li>
            <li><code className="bg-gray-100 px-2 py-1 rounded">@spa-audio/react</code> - React integration</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Key Features</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Tiny file sizes (50-100x smaller than WAV/MP3)</li>
            <li>Procedural generation using Web Audio API</li>
            <li>Parametric control for dynamic sounds</li>
            <li>Human-readable XML format</li>
            <li>No external dependencies</li>
            <li>Works in all modern browsers</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">License</h2>
          <p className="text-gray-700">MIT License - Free for commercial and personal use</p>
        </section>

        <footer className="mt-12 pt-8 border-t border-gray-300">
          <div className="flex flex-wrap gap-4 text-gray-600">
            <a href="https://github.com/gradywoodruff/spa" className="hover:underline">GitHub</a>
            <span className="text-gray-400">|</span>
            <a href="/docs/SPEC.md" className="hover:underline">Documentation</a>
            <span className="text-gray-400">|</span>
            <a href="https://www.npmjs.com/package/@spa-audio/core" className="hover:underline">npm</a>
            <span className="text-gray-400">|</span>
            <a href="/" className="hover:underline">Home</a>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            SPA v1.1 - The SVG of Sound Effects
          </p>
        </footer>
      </div>
    </>
  );
}