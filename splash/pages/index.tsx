import Link from 'next/link'
import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>SPA - Scalable Parametric Audio</title>
        <meta name="description" content="The SVG of Sound Effects - Empowering AI to generate procedural audio" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-background text-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <header className="text-center py-16 lg:py-24">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black bg-gradient-primary bg-clip-text text-transparent animate-glow mb-4 tracking-tighter">
              &lt;spa /&gt;
            </h1>
            <p className="text-2xl text-gray-400 font-light mb-8">
              The SVG of Sound Effects
            </p>

            <div className="max-w-3xl mx-auto mb-12">
              <p className="text-lg text-gray-200 mb-4">
                Empowering AI to generate procedural audio through simple, declarative XML.
                Just as SVG revolutionized vector graphics on the web, SPA brings the same
                simplicity and power to sound design.
              </p>
              <p className="text-gray-400">
                Create rich, dynamic sound effects with human-readable code that AI models
                can understand, generate, and manipulate as easily as they do with text.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/editor"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-primary text-white font-semibold text-lg rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                Create a Sound
              </Link>
              <Link
                href="/getting-started"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-surface border-2 border-primary text-gray-200 font-semibold text-lg rounded-lg hover:bg-primary hover:text-white transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                Get Started
              </Link>
            </div>
          </header>

          {/* Features Section */}
          <section className="grid md:grid-cols-3 gap-8 py-16">
            <div className="bg-surface p-8 rounded-xl border border-primary/10 hover:border-primary/30 hover:-translate-y-1 transition-all duration-200">
              <div className="text-4xl mb-4">🎵</div>
              <h3 className="text-xl font-semibold text-primary mb-2">Declarative Audio</h3>
              <p className="text-gray-400">
                Define sounds with simple XML tags. No complex audio programming required.
              </p>
            </div>

            <div className="bg-surface p-8 rounded-xl border border-primary/10 hover:border-primary/30 hover:-translate-y-1 transition-all duration-200">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-primary mb-2">AI-Friendly</h3>
              <p className="text-gray-400">
                Designed for AI to read, write, and understand. Generate sounds with natural language.
              </p>
            </div>

            <div className="bg-surface p-8 rounded-xl border border-primary/10 hover:border-primary/30 hover:-translate-y-1 transition-all duration-200">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-primary mb-2">Web-Native</h3>
              <p className="text-gray-400">
                Runs directly in browsers using Web Audio API. No plugins or downloads needed.
              </p>
            </div>
          </section>

          {/* Example Section */}
          <section className="py-16 text-center">
            <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-8">
              Simple as XML
            </h2>
            <div className="max-w-2xl mx-auto bg-surface rounded-xl p-8 border border-primary/20">
              <pre className="text-accent font-mono text-sm sm:text-base text-left overflow-x-auto">
                <code>{`<spa version="1.0">
  <tone wave="sine" freq="440" dur="0.5" />
</spa>`}</code>
              </pre>
            </div>
            <p className="text-gray-400 mt-4">
              Create a 440Hz sine wave (A note) that plays for half a second
            </p>
          </section>

          {/* Use Cases */}
          <section className="py-16">
            <h2 className="text-3xl font-bold text-center bg-gradient-primary bg-clip-text text-transparent mb-12">
              Perfect For
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface p-6 rounded-lg border-l-4 border-primary">
                <strong className="text-primary block mb-2">UI Sound Effects</strong>
                <p className="text-gray-400 text-sm">Button clicks, notifications, transitions</p>
              </div>
              <div className="bg-surface p-6 rounded-lg border-l-4 border-primary">
                <strong className="text-primary block mb-2">Game Audio</strong>
                <p className="text-gray-400 text-sm">Procedural sound effects, dynamic music</p>
              </div>
              <div className="bg-surface p-6 rounded-lg border-l-4 border-primary">
                <strong className="text-primary block mb-2">AI Applications</strong>
                <p className="text-gray-400 text-sm">Generate context-aware audio on the fly</p>
              </div>
              <div className="bg-surface p-6 rounded-lg border-l-4 border-primary">
                <strong className="text-primary block mb-2">Education</strong>
                <p className="text-gray-400 text-sm">Teach audio synthesis concepts visually</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-12 mt-16 border-t border-primary/10 text-center">
            <p className="text-gray-400 mb-4">
              SPA - Scalable Parametric Audio | Open Source | MIT License
            </p>
            <div className="flex gap-8 justify-center">
              <a href="https://github.com/yourusername/spa" className="text-primary hover:text-secondary transition-colors">
                GitHub
              </a>
              <Link href="/docs" className="text-primary hover:text-secondary transition-colors">
                Documentation
              </Link>
              <Link href="/examples" className="text-primary hover:text-secondary transition-colors">
                Examples
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}