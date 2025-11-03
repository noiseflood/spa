import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { playSPA } from '@spa-audio/core';
import { useSound } from '../contexts/SoundContext';
import MuteButton from '../components/MuteButton';

// Cookie helper functions
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

export default function Home() {
  const [showIntro, setShowIntro] = useState(false); // Default to false, will be determined by cookie
  const [visibleWords, setVisibleWords] = useState(0);
  const [presets, setPresets] = useState<{ path: string; name: string }[]>([]);
  const [currentPreset, setCurrentPreset] = useState<{ path: string; name: string } | null>(null);
  const [displayedName, setDisplayedName] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { playSound } = useSound();

  // Check if intro should be shown based on cookie
  useEffect(() => {
    const lastVisit = getCookie('spa_last_visit');
    const now = Date.now();

    if (!lastVisit) {
      // First visit - show intro
      setShowIntro(true);
    } else {
      // Check if 10 minutes (600000ms) have passed since last visit
      const timeSinceLastVisit = now - parseInt(lastVisit, 10);
      const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

      if (timeSinceLastVisit >= tenMinutes) {
        setShowIntro(true);
      } else {
        setShowIntro(false);
      }
    }

    // Update the last visit timestamp
    setCookie('spa_last_visit', now.toString());
  }, []);

  // Animate intro text and transition to homepage
  useEffect(() => {
    if (!showIntro) return;

    // Show words one by one
    const wordTimers = [
      setTimeout(() => setVisibleWords(1), 0), // "Unmute" immediately
      setTimeout(() => setVisibleWords(2), 300), // "the" after 0.3 seconds
      setTimeout(() => setVisibleWords(3), 600), // "internet" after 0.6 seconds
    ];

    // Transition to homepage after 1.2 seconds
    const transitionTimer = setTimeout(() => {
      setShowIntro(false);
    }, 1200);

    return () => {
      wordTimers.forEach((timer) => clearTimeout(timer));
      clearTimeout(transitionTimer);
    };
  }, [showIntro]);

  // Load all preset files on mount (for original landing page)
  useEffect(() => {
    if (showIntro) return; // Don't load if showing intro

    async function loadPresets() {
      try {
        const response = await fetch('/presets.json');
        const files: string[] = await response.json();
        const presetObjects = files.map((path) => ({
          path,
          name: path.split('/').pop() || path,
        }));
        setPresets(presetObjects);
        if (presetObjects.length > 0) {
          setCurrentPreset(presetObjects[0]);
        }
      } catch (error) {
        console.error('Error loading presets:', error);
      }
    }
    loadPresets();
  }, [showIntro]);

  // Typing animation
  useEffect(() => {
    if (!currentPreset) return;

    let timeout: NodeJS.Timeout;
    if (displayedName.length < currentPreset.name.length) {
      timeout = setTimeout(() => {
        setDisplayedName(currentPreset.name.slice(0, displayedName.length + 1));
      }, 50);
    }
    return () => clearTimeout(timeout);
  }, [displayedName, currentPreset]);

  const handleClick = async () => {
    if (isPlaying || isTyping || !currentPreset) return;

    setIsPlaying(true);

    try {
      const response = await fetch(`/presets/${currentPreset.path}.spa`);
      if (!response.ok) {
        throw new Error(`Failed to fetch preset: ${response.statusText}`);
      }
      const spaContent = await response.text();
      await playSPA(spaContent);
    } catch (error) {
      console.error('Error playing SPA:', error);
      setIsPlaying(false);
      return;
    }

    setIsPlaying(false);

    // Start deleting animation
    setIsTyping(true);
    const deleteInterval = setInterval(() => {
      setDisplayedName((prev) => {
        if (prev.length === 0) {
          clearInterval(deleteInterval);

          const available = presets.filter((p) => p.path !== currentPreset.path);
          const newPreset = available[Math.floor(Math.random() * available.length)];
          setCurrentPreset(newPreset);
          setIsTyping(false);
          return '';
        }
        return prev.slice(0, -1);
      });
    }, 30);
  };

  // Show intro animation
  if (showIntro) {
    return (
      <>
        <Head>
          <title>SPA - Unmute the Internet</title>
          <meta
            name="description"
            content="Procedural audio for the web - XML-based format for defining sound effects"
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <div className="min-h-screen bg-navy flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-[0.2em] text-green-bright font-[Verdana,sans-serif] text-right">
            <span
              className={`block transition-opacity duration-500 ${
                visibleWords >= 1 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Unmute
            </span>
            <span
              className={`block transition-opacity duration-500 ${
                visibleWords >= 2 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              the
            </span>
            <span
              className={`block transition-opacity duration-500 ${
                visibleWords >= 3 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              internet
            </span>
          </h1>
        </div>
      </>
    );
  }

  // Show original landing page if accepted
  return (
    <>
      <Head>
        <title>SPA - Synthetic Parametric Audio</title>
        <meta
          name="description"
          content="Procedural audio for the web - XML-based format for defining sound effects"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <MuteButton />

      <div className="min-h-screen bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <header className="font-mono flex flex-col text-center items-center justify-between h-[70vh]">
            <div className="h-full" />
            <div
              onClick={handleClick}
              className="cursor-pointer transition-transform h-full flex flex-grow items-center justify-center hover:scale-105 active:scale-95 focus:outline-none"
              title="Click to play sound"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-green-bright tracking-tighter select-none">
                &lt;spa name=&quot;{displayedName}
                <span className="animate-pulse">
                  {displayedName.length < (currentPreset?.name.length || 0) ? '|' : ''}
                </span>
                &quot; ... /&gt;
              </h1>
            </div>
            <div className="h-full">
              <p className="text-2xl text-white/60 font-light mb-8">The SVG of audio</p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/editor"
                  onMouseEnter={() => playSound('ui-feedback/hover')}
                  onClick={() => playSound('ui-feedback/button-click')}
                  className="inline-flex items-center justify-center px-8 py-4 bg-navy-dark text-green-bright border-2 border-green-bright font-semibold text-lg rounded-lg shadow-lg hover:bg-green-bright hover:text-navy-dark hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Create a Sound
                </Link>
                <Link
                  href="/getting-started"
                  onMouseEnter={() => playSound('ui-feedback/hover')}
                  onClick={() => playSound('ui-feedback/button-click')}
                  className="inline-flex items-center justify-center px-8 py-4 bg-navy-dark border-2 border-navy-light text-white font-semibold text-lg rounded-lg hover:bg-navy-light hover:text-white transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </header>

          {/* Features Section */}
          <section className="grid md:grid-cols-3 gap-8 py-16">
            <div
              onMouseEnter={() => playSound('ui-feedback/hover')}
              className="bg-navy-dark p-8 rounded-xl border border-navy-light/20 hover:border-green-bright/40 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-green-bright mb-2">Declarative Audio</h3>
              <p className="text-white/60">
                Define sounds with XML tags. No complex audio programming required.
              </p>
            </div>

            <div
              onMouseEnter={() => playSound('ui-feedback/hover')}
              className="bg-navy-dark p-8 rounded-xl border border-navy-light/20 hover:border-green-bright/40 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-green-bright mb-2">AI-Friendly</h3>
              <p className="text-white/60">
                Designed for AI to read, write, and understand. Generate sounds with natural
                language.
              </p>
            </div>

            <div
              onMouseEnter={() => playSound('ui-feedback/hover')}
              className="bg-navy-dark p-8 rounded-xl border border-navy-light/20 hover:border-green-bright/40 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-green-bright mb-2">Web-Native</h3>
              <p className="text-white/60">
                Runs directly in browsers using Web Audio API. No plugins or downloads needed.
              </p>
            </div>
          </section>

          {/* Example Section */}
          <section className="py-16 text-center">
            <h2 className="text-3xl font-bold text-green-bright mb-8">Example</h2>
            <div className="max-w-2xl mx-auto bg-navy-dark rounded-xl p-8 border border-navy-light/20">
              <pre className="text-green-bright font-mono text-sm sm:text-base text-left overflow-x-auto">
                <code>{`<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="440" dur="0.5" />
</spa>`}</code>
              </pre>
            </div>
            <p className="text-white/60 mt-4">
              A 440Hz sine wave (A note) that plays for half a second
            </p>
          </section>

          {/* Use Cases */}
          <section className="py-16">
            <h2 className="text-3xl font-bold text-center text-green-bright mb-12">Perfect For</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                onMouseEnter={() => playSound('ui-feedback/hover')}
                className="bg-navy-dark p-6 rounded-lg border-l-4 border-green-bright hover:bg-navy-light/10 transition-colors cursor-pointer"
              >
                <strong className="text-green-bright block mb-2">UI Sound Effects</strong>
                <p className="text-white/60 text-sm">Button clicks, notifications, transitions</p>
              </div>
              <div
                onMouseEnter={() => playSound('ui-feedback/hover')}
                className="bg-navy-dark p-6 rounded-lg border-l-4 border-green-bright hover:bg-navy-light/10 transition-colors cursor-pointer"
              >
                <strong className="text-green-bright block mb-2">Game Audio</strong>
                <p className="text-white/60 text-sm">Procedural sound effects, dynamic music</p>
              </div>
              <div
                onMouseEnter={() => playSound('ui-feedback/hover')}
                className="bg-navy-dark p-6 rounded-lg border-l-4 border-green-bright hover:bg-navy-light/10 transition-colors cursor-pointer"
              >
                <strong className="text-green-bright block mb-2">AI Applications</strong>
                <p className="text-white/60 text-sm">Generate context-aware audio on the fly</p>
              </div>
              <div
                onMouseEnter={() => playSound('ui-feedback/hover')}
                className="bg-navy-dark p-6 rounded-lg border-l-4 border-green-bright hover:bg-navy-light/10 transition-colors cursor-pointer"
              >
                <strong className="text-green-bright block mb-2">Education</strong>
                <p className="text-white/60 text-sm">Teach audio synthesis concepts visually</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-12 mt-16 border-t border-navy-light/20 text-center">
            <p className="text-white/60 mb-4">
              SPA - Synthetic Parametric Audio | Open Source | MIT License
            </p>
            <div className="flex gap-8 justify-center">
              <a
                href="https://github.com/noiseflood/spa"
                onMouseEnter={() => playSound('ui-feedback/hover')}
                className="text-white/60 hover:text-green-bright transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://www.npmjs.com/org/spa-audio"
                onMouseEnter={() => playSound('ui-feedback/hover')}
                className="text-white/60 hover:text-green-bright transition-colors"
              >
                npm
              </a>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
