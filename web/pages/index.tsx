import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
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
  const [rawContent, setRawContent] = useState<{ name: string; lines: string[] } | null>(null);
  const [fullCode, setFullCode] = useState<string[]>([]);
  const [displayedCode, setDisplayedCode] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [maxLineLength, setMaxLineLength] = useState(60);
  const codeContainerRef = useRef<HTMLDivElement>(null);
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
          // Select a random preset to start
          const randomIndex = Math.floor(Math.random() * presetObjects.length);
          setCurrentPreset(presetObjects[randomIndex]);
        }
      } catch (error) {
        console.error('Error loading presets:', error);
      }
    }
    loadPresets();
  }, [showIntro]);

  // Load SPA content when preset changes
  useEffect(() => {
    if (!currentPreset) return;

    async function loadSpaContent() {
      if (!currentPreset) return;

      try {
        const response = await fetch(`/presets/${currentPreset.path}.spa`);
        const content = await response.text();

        // Parse content to extract inner lines (skip opening <spa> and closing </spa>)
        const lines = content.split('\n');
        const innerLines = [];
        let insideSpa = false;

        for (const line of lines) {
          if (line.includes('<spa')) {
            insideSpa = true;
            continue;
          }
          if (line.includes('</spa>')) {
            break;
          }
          if (insideSpa) {
            const trimmed = line.trim();
            // Skip empty lines and HTML comments
            if (trimmed && !trimmed.startsWith('<!--')) {
              // Keep original line with indentation intact
              innerLines.push(line);
            }
          }
        }

        // Analyze structure and pick lines to show
        const hasGroup = innerLines.some((line) => line.includes('<group'));
        const totalLines = innerLines.length;

        // Take up to 4 lines to show actual content (leaving room for ellipsis and closing tags)
        const maxContentLines = 4;
        const displayLines = innerLines.slice(0, maxContentLines);

        // Add ellipsis line if there's more content
        const needsEllipsis = totalLines > maxContentLines;
        if (needsEllipsis) {
          // Get the indentation from first line for proper alignment
          const firstLineIndent = innerLines[0]?.match(/^\s*/)?.[0] || '  ';
          displayLines.push(firstLineIndent + '...');
        }

        // Close group tag if we have an opening group
        if (hasGroup && !displayLines.some((line) => line.includes('</group>'))) {
          displayLines.push('  </group>');
        }

        setRawContent({
          name: currentPreset.name,
          lines: displayLines,
        });
      } catch (error) {
        console.error('Error loading SPA content:', error);
      }
    }

    loadSpaContent();
  }, [currentPreset]);

  // Calculate max line length based on viewport width
  useEffect(() => {
    const calculateMaxLength = () => {
      // Use viewport width for more reliable calculation
      const viewportWidth = window.innerWidth;

      // Very aggressive truncation for clean, centered look
      // Mobile: ~25 chars, Tablet: ~30 chars, Desktop: ~35 chars
      if (viewportWidth < 640) {
        setMaxLineLength(25);
      } else if (viewportWidth < 1024) {
        setMaxLineLength(30);
      } else {
        setMaxLineLength(35);
      }
    };

    calculateMaxLength();

    const handleResize = () => calculateMaxLength();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Rebuild code with truncation when rawContent or maxLineLength changes
  useEffect(() => {
    if (!rawContent) return;

    const linesToShow = rawContent.lines.map((line) => {
      // Don't truncate lines that are just ellipsis or closing tags
      const trimmed = line.trim();
      if (trimmed === '...' || trimmed.startsWith('</')) {
        return line;
      }

      // Smart truncation - try to cut after first or second attribute
      const leadingSpaces = line.match(/^\s*/)?.[0] || '';
      const content = line.substring(leadingSpaces.length);

      // For element lines, truncate after tag name + first attribute
      if (content.startsWith('<') && !content.startsWith('</')) {
        // Try to find a good cut point after an attribute
        const tagMatch = content.match(/^<\w+\s+\w+="[^"]*"/);
        if (tagMatch && tagMatch[0].length <= maxLineLength - leadingSpaces.length - 3) {
          // If we can fit tag + first attribute, check for second
          const secondAttrMatch = content.match(/^<\w+\s+\w+="[^"]*"\s+\w+="[^"]*"/);
          if (
            secondAttrMatch &&
            secondAttrMatch[0].length <= maxLineLength - leadingSpaces.length - 3
          ) {
            return leadingSpaces + secondAttrMatch[0] + '...';
          }
          return leadingSpaces + tagMatch[0] + '...';
        }
        // Otherwise just truncate normally
      }

      if (line.length > maxLineLength) {
        // Account for '...' (3 chars) in the max length
        const maxContentLength = maxLineLength - leadingSpaces.length - 3;

        if (content.length > maxContentLength && maxContentLength > 0) {
          return leadingSpaces + content.substring(0, maxContentLength) + '...';
        }
      }
      return line;
    });

    // Build full code string with proper indentation
    const fullCodeLines = [`<spa name="${rawContent.name}">`, ...linesToShow, '</spa>'];

    setFullCode(fullCodeLines);
    setDisplayedCode(''); // Reset for typing animation
  }, [rawContent, maxLineLength]);

  // Typing animation for full code
  useEffect(() => {
    if (fullCode.length === 0) return;

    const fullText = fullCode.join('\n');

    let timeout: NodeJS.Timeout;
    if (displayedCode.length < fullText.length) {
      timeout = setTimeout(() => {
        setDisplayedCode(fullText.slice(0, displayedCode.length + 1));
      }, 20); // Faster typing for more code
    }
    return () => clearTimeout(timeout);
  }, [displayedCode, fullCode]);

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
      setDisplayedCode((prev) => {
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
    }, 10); // Fast deletion
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
          {/* Hero Section - Interactive Demo */}
          <header className="font-mono flex flex-col text-center items-center justify-center min-h-[80vh] py-12">
            <h1 className="text-4xl font-bold text-green-bright mb-6">SVG for sound</h1>
            <div
              onClick={handleClick}
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95 focus:outline-none mb-12 w-full px-4 flex justify-center"
              title="Click to play sound"
            >
              <div
                ref={codeContainerRef}
                className="inline-block h-[160px] sm:h-[180px] lg:h-[260px]"
              >
                <pre className="text-sm sm:text-base lg:text-lg font-mono text-green-bright select-none whitespace-pre text-left">
                  {displayedCode}
                  <span className="animate-pulse">
                    {displayedCode.length < fullCode.join('\n').length && displayedCode.length > 0
                      ? '|'
                      : ''}
                  </span>
                </pre>
              </div>
            </div>

            <p className="text-xl text-white/70 mb-12 max-w-2xl">
              Generate sound effects with code, designed for AI and the web.
            </p>

            <Link
              href="/editor"
              onMouseEnter={() => playSound('ui-feedback/hover')}
              onClick={() => playSound('ui-feedback/button-click')}
              className="inline-flex items-center justify-center px-8 py-4 bg-green-bright text-navy-dark font-semibold text-lg rounded hover:opacity-90 transition-all duration-200"
            >
              Try the Editor
            </Link>
          </header>

          {/* What & How Section - Asymmetric Layout */}
          <section className="py-16 border-t border-navy-light/20">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Left: What it is */}
              <div className="min-w-0">
                <h2 className="text-3xl font-bold text-green-bright mb-6">What is SPA?</h2>
                <div className="space-y-4 text-white/70 text-lg">
                  <p>
                    SPA (Synthetic Parametric Audio) lets you define sound effects with XML tags
                    instead of audio files. Think tones, noise, envelopes, and filters.
                  </p>
                  <p>Built on Web Audio API. Runs anywhere JavaScript runs.</p>
                </div>

                <div className="mt-8 p-4 bg-navy-dark rounded border-l-4 border-green-bright">
                  <code className="text-green-bright text-sm">npm install @spa-audio/core</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('npm install @spa-audio/core');
                      playSound('ui-feedback/button-click');
                    }}
                    className="ml-4 text-white/60 hover:text-green-bright text-sm"
                  >
                    copy
                  </button>
                </div>

                <div className="mt-4 p-4 bg-navy-dark rounded border-l-4 border-green-bright">
                  <code className="text-green-bright text-sm">npm install @spa-audio/react</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('npm install @spa-audio/react');
                      playSound('ui-feedback/button-click');
                    }}
                    className="ml-4 text-white/60 hover:text-green-bright text-sm"
                  >
                    copy
                  </button>
                </div>
              </div>

              {/* Right: Code Example */}
              <div className="min-w-0">
                <h2 className="text-3xl font-bold text-green-bright mb-6">Example</h2>
                <div className="bg-navy-dark p-6 rounded border border-navy-light/20 overflow-x-auto min-w-0">
                  <pre className="text-green-bright font-mono text-sm">
                    <code>{`<spa xmlns="https://spa.audio/ns" version="1.0">
  <group>
    <tone wave="sine" freq="800" dur="0.05"
          envelope="0,0.02,0,0.03" />
    <noise color="white" dur="0.02" amp="0.3" />
  </group>
</spa>
`}</code>
                  </pre>
                </div>

                <div className="mt-8 bg-navy-dark p-6 rounded border border-navy-light/20 overflow-x-auto min-w-0">
                  <pre className="text-green-bright font-mono text-sm">
                    <code>{`import { playSPA } from '@spa-audio/core';

const xml = \`<spa>...</spa>\`;
await playSPA(xml);`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Links Section */}
          <section className="py-16 border-t border-navy-light/20">
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
              <Link
                href="/getting-started"
                onMouseEnter={() => playSound('ui-feedback/hover')}
                className="text-white/60 hover:text-green-bright transition-colors text-lg"
              >
                Docs
              </Link>
              <a
                href="https://github.com/noiseflood/spa"
                onMouseEnter={() => playSound('ui-feedback/hover')}
                className="text-white/60 hover:text-green-bright transition-colors text-lg"
              >
                GitHub
              </a>
              <a
                href="https://www.npmjs.com/org/spa-audio"
                onMouseEnter={() => playSound('ui-feedback/hover')}
                className="text-white/60 hover:text-green-bright transition-colors text-lg"
              >
                npm
              </a>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-8 text-center">
            <p className="text-white/40 text-sm">MIT License</p>
          </footer>
        </div>
      </div>
    </>
  );
}
