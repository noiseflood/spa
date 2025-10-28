import Link from 'next/link'
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { playSPA } from '@spa.audio/core'

export default function Home() {
  const [presets, setPresets] = useState<{ path: string; name: string }[]>([])
  const [currentPreset, setCurrentPreset] = useState<{ path: string; name: string } | null>(null)
  const [displayedName, setDisplayedName] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Load all preset files on mount
  useEffect(() => {
    async function loadPresets() {
      try {
        const response = await fetch('/api/presets')
        const files: string[] = await response.json()
        // Convert paths to objects with path and simple name
        const presetObjects = files.map(path => ({
          path,
          name: path.split('/').pop() || path
        }))
        setPresets(presetObjects)
        if (presetObjects.length > 0) {
          setCurrentPreset(presetObjects[0])
        }
      } catch (error) {
        console.error('Error loading presets:', error)
      }
    }
    loadPresets()
  }, [])

  // Typing animation
  useEffect(() => {
    if (!currentPreset) return

    let timeout: NodeJS.Timeout
    if (displayedName.length < currentPreset.name.length) {
      timeout = setTimeout(() => {
        setDisplayedName(currentPreset.name.slice(0, displayedName.length + 1))
      }, 50)
    }
    return () => clearTimeout(timeout)
  }, [displayedName, currentPreset])

  const handleClick = async () => {
    if (isPlaying || isTyping || !currentPreset) return

    setIsPlaying(true)

    try {
      // Fetch and play the SPA file (API expects .spa extension)
      const response = await fetch(`/api/presets/${currentPreset.path}.spa`)
      if (!response.ok) {
        throw new Error(`Failed to fetch preset: ${response.statusText}`)
      }
      const spaContent = await response.text()

      // Play the SPA using the playSPA function
      await playSPA(spaContent)
    } catch (error) {
      console.error('Error playing SPA:', error)
      setIsPlaying(false)
      return
    }

    setIsPlaying(false)

    // Start deleting animation
    setIsTyping(true)
    const deleteInterval = setInterval(() => {
      setDisplayedName(prev => {
        if (prev.length === 0) {
          clearInterval(deleteInterval)

          // Pick new random preset
          const available = presets.filter(p => p.path !== currentPreset.path)
          const newPreset = available[Math.floor(Math.random() * available.length)]
          setCurrentPreset(newPreset)
          setIsTyping(false)
          return ''
        }
        return prev.slice(0, -1)
      })
    }, 30)
  }

  return (
    <>
      <Head>
        <title>SPA - Synthetic Parametric Audio</title>
        <meta name="description" content="The SVG of Sound Effects - Empowering AI to generate procedural audio" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-background text-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <header className="font-mono flex flex-col text-center items-center justify-between h-[70vh]">
            <div className="h-full" />
            <div
              onClick={handleClick}
              className="cursor-pointer transition-transform h-full flex flex-grow items-center justify-center hover:scale-105 active:scale-95"
              title="Click to play sound"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-primary bg-clip-text text-transparent animate-glow tracking-tighter select-none">
                &lt;spa name=&quot;{displayedName}
                <span className="animate-pulse">{displayedName.length < (currentPreset?.name.length || 0) ? '|' : ''}</span>
                &quot; ... /&gt;
              </h1>
            </div>
            <div className="h-full">
              <p className="text-2xl text-gray-400 font-light mb-8">
                The SVG of Sound Effects
              </p>

              {/* <div className="max-w-3xl mx-auto mb-12">
                <p className="text-lg text-gray-200 mb-4">
                  Empowering AI to generate procedural audio through simple, declarative XML.
                  Just as SVG revolutionized vector graphics on the web, SPA brings the same
                  simplicity and power to sound design.
                </p>
                <p className="text-gray-400">
                  Create rich, dynamic sound effects with human-readable code that AI models
                  can understand, generate, and manipulate as easily as they do with text.
                </p>
              </div> */}

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
              SPA - Synthetic Parametric Audio | Open Source | MIT License
            </p>
            <div className="flex gap-8 justify-center">
              <a href="https://github.com/noiseflood/spa" className="text-primary hover:text-secondary transition-colors">
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