import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';
import { playSPA } from '@spa-audio/core';
import { useSound } from '../contexts/SoundContext';

type Section = {
  id: string;
  title: string;
  subsections?: { id: string; title: string }[];
};

const sections: Section[] = [
  { id: 'overview', title: 'Overview' },
  {
    id: 'elements',
    title: 'Elements',
    subsections: [
      { id: 'tone', title: 'Tone' },
      { id: 'noise', title: 'Noise' },
      { id: 'group', title: 'Group' },
      { id: 'sequence', title: 'Sequence' },
    ],
  },
  {
    id: 'sound-shaping',
    title: 'Sound Shaping',
    subsections: [
      { id: 'envelopes', title: 'Envelopes (ADSR)' },
      { id: 'filters', title: 'Filters' },
      { id: 'panning', title: 'Panning' },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced Features',
    subsections: [
      { id: 'automation', title: 'Parameter Automation' },
      { id: 'repeat', title: 'Repeat Functionality' },
      { id: 'effects', title: 'Effects' },
      { id: 'definitions', title: 'Definitions & Reusability' },
    ],
  },
  { id: 'reference', title: 'Complete Reference' },
  { id: 'examples', title: 'Example Library' },
];

export default function Docs() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['overview', 'elements'])
  );
  const { playSound } = useSound();

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string,
    parentId?: string
  ) => {
    e.preventDefault();

    // Expand the parent section if clicking a subsection
    if (parentId) {
      setExpandedSections((prev) => new Set(prev).add(parentId));
    } else {
      // Expand the main section
      setExpandedSections((prev) => new Set(prev).add(sectionId));
    }

    // Wait for the DOM to update after expansion, then scroll
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        // Get the element's position and add a small offset to account for any fixed headers
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - 20; // 20px offset from top

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }, 100); // Small delay to ensure DOM has updated
  };

  const playExample = async (spaXml: string) => {
    try {
      await playSPA(spaXml);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  return (
    <>
      <Head>
        <title>Documentation - SPA</title>
        <meta
          name="description"
          content="Complete documentation for SPA - Synthetic Parametric Audio"
        />
      </Head>

      <div className="min-h-screen bg-navy text-white overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <Link
              href="/"
              className="text-white/60 hover:text-green-bright transition-colors inline-block mb-6"
            >
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-green-bright mb-4">SPA Documentation</h1>
            <p className="text-lg text-white/60">
              Complete reference for Synthetic Parametric Audio format v1.1
            </p>
          </div>

          <div className="lg:flex gap-8">
            {/* Table of Contents - Sticky Sidebar */}
            <nav className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-4">
                <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">
                  Contents
                </h2>
                <ul className="space-y-1">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        onClick={(e) => handleNavClick(e, section.id)}
                        className="block py-2 px-3 text-white/60 hover:text-green-bright hover:bg-navy-dark/50 rounded transition-colors"
                      >
                        {section.title}
                      </a>
                      {section.subsections && (
                        <ul className="ml-4 mt-1 space-y-1">
                          {section.subsections.map((sub) => (
                            <li key={sub.id}>
                              <a
                                href={`#${sub.id}`}
                                onClick={(e) => handleNavClick(e, sub.id, section.id)}
                                className="block py-1 px-3 text-sm text-white/40 hover:text-green-bright hover:bg-navy-dark/50 rounded transition-colors"
                              >
                                {sub.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-8">
              {/* Overview Section */}
              <section id="overview" className="scroll-mt-8">
                <h2
                  onClick={() => toggleSection('overview')}
                  className="text-2xl font-semibold text-green-bright mb-4 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
                >
                  <span className="text-white/40">
                    {expandedSections.has('overview') ? '−' : '+'}
                  </span>
                  Overview
                </h2>
                {expandedSections.has('overview') && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-green-bright">What is SPA?</h3>
                      <p className="text-white/70 mb-4">
                        SPA (Synthetic Parametric Audio) is an XML-based format for procedural sound
                        generation. Unlike traditional audio files that store waveform data, SPA
                        files contain instructions for generating sounds algorithmically.
                      </p>
                      <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright overflow-x-auto">
                        <pre>{`<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="440" dur="1" />
</spa>`}</pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-green-bright">Key Benefits</h3>
                      <ul className="space-y-2 text-white/70">
                        <li className="flex gap-3">
                          <span className="text-green-bright">•</span>
                          <div>
                            <strong className="text-white">Tiny file sizes:</strong> A complex sound
                            effect can be just 200 bytes vs 200KB for WAV
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <span className="text-green-bright">•</span>
                          <div>
                            <strong className="text-white">AI-friendly:</strong> Declarative XML
                            format that AI models can easily understand and generate
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <span className="text-green-bright">•</span>
                          <div>
                            <strong className="text-white">Procedural:</strong> Parameters can be
                            modified in real-time for dynamic sound generation
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <span className="text-green-bright">•</span>
                          <div>
                            <strong className="text-white">Cross-platform:</strong> Works in
                            browsers, Node.js, and any platform with audio synthesis
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-green-bright">
                        Basic Structure
                      </h3>
                      <p className="text-white/70 mb-4">
                        Every SPA file starts with an XML declaration and a root{' '}
                        <code className="text-green-bright">&lt;spa&gt;</code> element with
                        namespace and version attributes:
                      </p>
                      <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright overflow-x-auto">
                        <pre>{`<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <!-- Sound elements go here -->
</spa>`}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Elements Section */}
              <section id="elements" className="scroll-mt-8">
                <h2
                  onClick={() => toggleSection('elements')}
                  className="text-2xl font-semibold text-green-bright mb-4 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
                >
                  <span className="text-white/40">
                    {expandedSections.has('elements') ? '−' : '+'}
                  </span>
                  Elements
                </h2>
                {expandedSections.has('elements') && (
                  <div className="space-y-6">
                    {/* Tone Element */}
                    <div id="tone" className="scroll-mt-8">
                      <h3 className="text-lg font-semibold mb-3 text-green-bright">Tone Element</h3>
                      <p className="text-white/70 mb-4">
                        Generates oscillator-based sounds with various waveforms. The fundamental
                        building block for melodic and harmonic content.
                      </p>

                      <h4 className="font-semibold text-white mb-2">Required Attributes</h4>
                      <ul className="space-y-2 text-white/70 mb-4">
                        <li>
                          <code className="text-green-bright">wave</code>: Waveform type - sine,
                          square, triangle, saw, pulse
                        </li>
                        <li>
                          <code className="text-green-bright">freq</code>: Frequency in Hz
                          (20-20000)
                        </li>
                        <li>
                          <code className="text-green-bright">dur</code>: Duration in seconds
                          (0.01-60)
                        </li>
                      </ul>

                      <h4 className="font-semibold text-white mb-2">Optional Attributes</h4>
                      <ul className="space-y-2 text-white/70 mb-4">
                        <li>
                          <code className="text-green-bright">amp</code>: Amplitude/volume (0-1,
                          default: 1)
                        </li>
                        <li>
                          <code className="text-green-bright">envelope</code>: ADSR envelope
                          (default: "0,0,1,0")
                        </li>
                        <li>
                          <code className="text-green-bright">pan</code>: Stereo position (-1 to 1,
                          default: 0)
                        </li>
                        <li>
                          <code className="text-green-bright">filter</code>: Filter type (lowpass,
                          highpass, bandpass)
                        </li>
                        <li>
                          <code className="text-green-bright">cutoff</code>: Filter cutoff frequency
                          (20-20000 Hz)
                        </li>
                        <li>
                          <code className="text-green-bright">resonance</code>: Filter resonance
                          (0.1-20, default: 1)
                        </li>
                        <li>
                          <code className="text-green-bright">phase</code>: Initial phase offset
                          (0-360 degrees)
                        </li>
                        <li>
                          <code className="text-green-bright">at</code>: Start time in seconds (for
                          root-level timing)
                        </li>
                        <li>
                          <code className="text-green-bright">effect</code>: Effect chain
                          (comma-separated IDs)
                        </li>
                      </ul>

                      <h4 className="font-semibold text-white mb-2">Wave Types</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {['sine', 'square', 'triangle', 'saw'].map((wave) => (
                          <div key={wave} className="bg-navy rounded p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-mono text-green-bright">{wave}</span>
                              <button
                                onClick={() =>
                                  playExample(`<spa xmlns="https://spa.audio/ns" version="1.0">
                                    <tone wave="${wave}" freq="440" dur="0.5" amp="0.3" envelope="0.01,0.1,0.7,0.2" />
                                  </spa>`)
                                }
                                className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                              >
                                Play
                              </button>
                            </div>
                            <p className="text-sm text-white/60">
                              {wave === 'sine' && 'Pure, smooth tone - fundamental frequency only'}
                              {wave === 'square' && 'Hollow, buzzy sound - odd harmonics'}
                              {wave === 'triangle' && 'Mellow, flute-like - weak harmonics'}
                              {wave === 'saw' && 'Bright, rich sound - all harmonics'}
                            </p>
                          </div>
                        ))}
                      </div>

                      <h4 className="font-semibold text-white mb-2">Example</h4>
                      <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright overflow-x-auto">
                        <pre>{`<tone wave="sine"
      freq="440"
      dur="1"
      amp="0.8"
      envelope="0.01,0.1,0.7,0.2"
      pan="0.5"
      filter="lowpass"
      cutoff="2000"
      resonance="2" />`}</pre>
                      </div>
                    </div>

                    {/* Noise Element */}
                    <div id="noise" className="scroll-mt-8">
                      <h3 className="text-lg font-semibold mb-3 text-green-bright">
                        Noise Element
                      </h3>
                      <p className="text-white/70 mb-4">
                        Generates various types of noise for percussive sounds, textures, and
                        ambient effects.
                      </p>

                      <h4 className="font-semibold text-white mb-2">Required Attributes</h4>
                      <ul className="space-y-2 text-white/70 mb-4">
                        <li>
                          <code className="text-green-bright">color</code>: Noise type - white,
                          pink, brown, blue, violet, grey
                        </li>
                        <li>
                          <code className="text-green-bright">dur</code>: Duration in seconds
                          (0.01-60)
                        </li>
                      </ul>

                      <h4 className="font-semibold text-white mb-2">Noise Colors</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {['white', 'pink', 'brown', 'blue'].map((color) => (
                          <div key={color} className="bg-navy rounded p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-mono text-green-bright">{color}</span>
                              <button
                                onClick={() =>
                                  playExample(`<spa xmlns="https://spa.audio/ns" version="1.0">
                                    <noise color="${color}" dur="0.5" amp="0.2" envelope="0.01,0.05,0.3,0.3" />
                                  </spa>`)
                                }
                                className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                              >
                                Play
                              </button>
                            </div>
                            <p className="text-sm text-white/60">
                              {color === 'white' && 'Equal energy at all frequencies - hiss'}
                              {color === 'pink' && 'Natural sounding - rain, wind'}
                              {color === 'brown' && 'Deep rumble - thunder, ocean'}
                              {color === 'blue' && 'High frequency emphasis - steam'}
                            </p>
                          </div>
                        ))}
                      </div>

                      <h4 className="font-semibold text-white mb-2">Example</h4>
                      <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright overflow-x-auto">
                        <pre>{`<noise color="pink"
       dur="2"
       amp="0.3"
       envelope="0.5,0,1,0.5"
       filter="highpass"
       cutoff="500" />`}</pre>
                      </div>
                    </div>

                    {/* Group Element */}
                    <div id="group" className="scroll-mt-8">
                      <h3 className="text-lg font-semibold mb-3 text-green-bright">
                        Group Element
                      </h3>
                      <p className="text-white/70 mb-4">
                        Container element for layering multiple sounds that play simultaneously.
                        Groups can be nested for complex hierarchies.
                      </p>

                      <h4 className="font-semibold text-white mb-2">Characteristics</h4>
                      <ul className="space-y-2 text-white/70 mb-4">
                        <li>• All child elements play at the same time</li>
                        <li>• Can contain: tone, noise, and nested group elements</li>
                        <li>• Supports optional id, amp, pan, at, and effect attributes</li>
                        <li>• Group-level attributes affect all children</li>
                        <li>• Can use repeat functionality for echo effects</li>
                      </ul>

                      <h4 className="font-semibold text-white mb-2">Example - C Major Chord</h4>
                      <div className="bg-navy rounded p-4">
                        <div className="flex justify-end mb-2">
                          <button
                            onClick={() =>
                              playExample(`<spa xmlns="https://spa.audio/ns" version="1.0">
                                <group amp="0.5">
                                  <tone wave="sine" freq="261.63" dur="1" />
                                  <tone wave="sine" freq="329.63" dur="1" />
                                  <tone wave="sine" freq="392" dur="1" />
                                </group>
                              </spa>`)
                            }
                            className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                          >
                            Play
                          </button>
                        </div>
                        <div className="font-mono text-sm text-green-bright">
                          <pre>{`<group amp="0.5">
  <tone wave="sine" freq="261.63" dur="1" /> <!-- C -->
  <tone wave="sine" freq="329.63" dur="1" /> <!-- E -->
  <tone wave="sine" freq="392" dur="1" />    <!-- G -->
</group>`}</pre>
                        </div>
                      </div>
                    </div>

                    {/* Sequence Element */}
                    <div id="sequence" className="scroll-mt-8">
                      <h3 className="text-lg font-semibold mb-3 text-green-bright">
                        Sequence Element
                      </h3>
                      <p className="text-white/70 mb-4">
                        Container for creating timed sequences of sounds. Each child element must
                        have an <code className="text-green-bright">at</code> attribute specifying
                        when it plays.
                      </p>

                      <h4 className="font-semibold text-white mb-2">Attributes</h4>
                      <ul className="space-y-2 text-white/70 mb-4">
                        <li>
                          <code className="text-green-bright">tempo</code>: BPM for beat-based
                          timing (20-300, optional)
                        </li>
                        <li>
                          <code className="text-green-bright">effect</code>: Apply effects to entire
                          sequence
                        </li>
                      </ul>

                      <h4 className="font-semibold text-white mb-2">Timing</h4>
                      <ul className="space-y-2 text-white/70 mb-4">
                        <li>
                          • Time-based: Use <code className="text-green-bright">at</code> in seconds
                        </li>
                        <li>
                          • Beat-based: Set <code className="text-green-bright">tempo</code> and use{' '}
                          <code className="text-green-bright">at</code> as beat numbers
                        </li>
                        <li>
                          • All children MUST have <code className="text-green-bright">at</code>{' '}
                          attribute
                        </li>
                      </ul>

                      <h4 className="font-semibold text-white mb-2">Example - Simple Melody</h4>
                      <div className="bg-navy rounded p-4">
                        <div className="flex justify-end mb-2">
                          <button
                            onClick={() =>
                              playExample(`<spa xmlns="https://spa.audio/ns" version="1.0">
                                <sequence>
                                  <tone wave="sine" freq="262" dur="0.25" at="0" />
                                  <tone wave="sine" freq="294" dur="0.25" at="0.25" />
                                  <tone wave="sine" freq="330" dur="0.25" at="0.5" />
                                  <tone wave="sine" freq="349" dur="0.25" at="0.75" />
                                  <tone wave="sine" freq="392" dur="0.5" at="1" />
                                </sequence>
                              </spa>`)
                            }
                            className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                          >
                            Play
                          </button>
                        </div>
                        <div className="font-mono text-sm text-green-bright">
                          <pre>{`<sequence>
  <tone wave="sine" freq="262" dur="0.25" at="0" />    <!-- C -->
  <tone wave="sine" freq="294" dur="0.25" at="0.25" /> <!-- D -->
  <tone wave="sine" freq="330" dur="0.25" at="0.5" />  <!-- E -->
  <tone wave="sine" freq="349" dur="0.25" at="0.75" /> <!-- F -->
  <tone wave="sine" freq="392" dur="0.5" at="1" />     <!-- G -->
</sequence>`}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Sound Shaping Section */}
              <section id="sound-shaping" className="scroll-mt-8">
                <h2
                  onClick={() => toggleSection('sound-shaping')}
                  className="text-2xl font-semibold text-green-bright mb-4 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
                >
                  <span className="text-white/40">
                    {expandedSections.has('sound-shaping') ? '−' : '+'}
                  </span>
                  Sound Shaping
                </h2>
                {expandedSections.has('sound-shaping') && (
                  <div className="space-y-6">
                    {/* Envelopes */}
                    <div id="envelopes" className="scroll-mt-8">
                      <h3 className="text-lg font-semibold mb-3 text-green-bright">
                        Envelopes (ADSR)
                      </h3>
                      <p className="text-white/70 mb-4">
                        ADSR envelopes control how a sound's amplitude changes over time. They
                        consist of four stages:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="bg-navy rounded p-4">
                          <h4 className="font-semibold text-green-bright mb-2">Attack</h4>
                          <p className="text-sm text-white/70">
                            Time to reach peak amplitude (0-10s)
                          </p>
                        </div>
                        <div className="bg-navy rounded p-4">
                          <h4 className="font-semibold text-green-bright mb-2">Decay</h4>
                          <p className="text-sm text-white/70">
                            Time to fall to sustain level (0-10s)
                          </p>
                        </div>
                        <div className="bg-navy rounded p-4">
                          <h4 className="font-semibold text-green-bright mb-2">Sustain</h4>
                          <p className="text-sm text-white/70">Level to hold at (0-1)</p>
                        </div>
                        <div className="bg-navy rounded p-4">
                          <h4 className="font-semibold text-green-bright mb-2">Release</h4>
                          <p className="text-sm text-white/70">Time to fade to silence (0-10s)</p>
                        </div>
                      </div>

                      <h4 className="font-semibold text-white mb-2">Common Envelope Patterns</h4>
                      <div className="space-y-3">
                        {[
                          { name: 'Pluck', value: '0,0.1,0,0.5', desc: 'Guitar, harp, piano' },
                          { name: 'Pad', value: '0.5,0.2,0.8,1', desc: 'Strings, synth pads' },
                          {
                            name: 'Stab',
                            value: '0,0.05,0.3,0.05',
                            desc: 'Brass hits, percussion',
                          },
                          { name: 'Gate', value: '0,0,1,0', desc: 'Instant on/off' },
                        ].map((env) => (
                          <div key={env.name} className="bg-navy rounded p-4">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="font-semibold text-green-bright">{env.name}</span>
                                <span className="ml-3 font-mono text-sm text-white/60">
                                  {env.value}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  playExample(`<spa xmlns="https://spa.audio/ns" version="1.0">
                                    <tone wave="sine" freq="440" dur="1" envelope="${env.value}" />
                                  </spa>`)
                                }
                                className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                              >
                                Play
                              </button>
                            </div>
                            <p className="text-sm text-white/60">{env.desc}</p>
                          </div>
                        ))}
                      </div>

                      <h4 className="font-semibold text-white mb-2 mt-4">Referenced Envelopes</h4>
                      <p className="text-white/70 mb-2">
                        Define reusable envelopes in{' '}
                        <code className="text-green-bright">&lt;defs&gt;</code> section:
                      </p>
                      <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright overflow-x-auto">
                        <pre>{`<spa xmlns="https://spa.audio/ns" version="1.0">
  <defs>
    <envelope id="pluck" value="0,0.1,0,0.5" />
    <envelope id="pad" value="0.5,0.2,0.8,1" />
  </defs>

  <tone wave="sine" freq="440" dur="1" envelope="#pluck" />
  <tone wave="sine" freq="220" dur="2" envelope="#pad" />
</spa>`}</pre>
                      </div>
                    </div>

                    {/* Filters */}
                    <div id="filters" className="scroll-mt-8">
                      <h3 className="text-lg font-semibold mb-3 text-green-bright">Filters</h3>
                      <p className="text-white/70 mb-4">
                        Filters shape the frequency content of sounds by attenuating certain
                        frequencies.
                      </p>

                      <h4 className="font-semibold text-white mb-2">Filter Types</h4>
                      <div className="space-y-3 mb-4">
                        <div className="bg-navy rounded p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-green-bright">Lowpass</span>
                            <button
                              onClick={() =>
                                playExample(`<spa xmlns="https://spa.audio/ns" version="1.0">
                                  <noise color="white" dur="1"
                                         filter="lowpass" cutoff="1000" resonance="5" />
                                </spa>`)
                              }
                              className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                            >
                              Play
                            </button>
                          </div>
                          <p className="text-sm text-white/60">
                            Removes high frequencies - creates warmth, muffle effects
                          </p>
                        </div>
                        <div className="bg-navy rounded p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-green-bright">Highpass</span>
                            <button
                              onClick={() =>
                                playExample(`<spa xmlns="https://spa.audio/ns" version="1.0">
                                  <noise color="pink" dur="1"
                                         filter="highpass" cutoff="2000" resonance="2" />
                                </spa>`)
                              }
                              className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                            >
                              Play
                            </button>
                          </div>
                          <p className="text-sm text-white/60">
                            Removes low frequencies - creates thin, tinny sounds
                          </p>
                        </div>
                        <div className="bg-navy rounded p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-green-bright">Bandpass</span>
                            <button
                              onClick={() =>
                                playExample(`<spa xmlns="https://spa.audio/ns" version="1.0">
                                  <noise color="white" dur="1"
                                         filter="bandpass" cutoff="1000" resonance="10" />
                                </spa>`)
                              }
                              className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                            >
                              Play
                            </button>
                          </div>
                          <p className="text-sm text-white/60">
                            Keeps only frequencies around cutoff - telephone, radio effects
                          </p>
                        </div>
                      </div>

                      <h4 className="font-semibold text-white mb-2">Parameters</h4>
                      <ul className="space-y-2 text-white/70 mb-4">
                        <li>
                          <code className="text-green-bright">cutoff</code>: Frequency where
                          filtering begins (20-20000 Hz)
                        </li>
                        <li>
                          <code className="text-green-bright">resonance</code>: Emphasis at cutoff
                          frequency (0.1-20, default: 1)
                        </li>
                      </ul>

                      <h4 className="font-semibold text-white mb-2">Example - Filter Sweep</h4>
                      <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright overflow-x-auto">
                        <pre>{`<tone wave="saw" freq="110" dur="2"
      filter="lowpass"
      cutoff.start="200"
      cutoff.end="5000"
      cutoff.curve="exp"
      resonance="5" />`}</pre>
                      </div>
                    </div>

                    {/* Panning */}
                    <div id="panning" className="scroll-mt-8">
                      <h3 className="text-lg font-semibold mb-3 text-green-bright">Panning</h3>
                      <p className="text-white/70 mb-4">
                        Control the stereo position of sounds in the left-right soundfield.
                      </p>

                      <div className="bg-navy rounded p-4 mb-4">
                        <h4 className="font-semibold text-white mb-2">Pan Values</h4>
                        <div className="flex justify-between text-sm text-white/70 mb-2">
                          <span>Hard Left</span>
                          <span>Center</span>
                          <span>Hard Right</span>
                        </div>
                        <div className="h-2 rounded-full relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-green-bright/30 via-green-bright/60 to-green-bright/30 rounded-full"></div>
                        </div>
                        <div className="flex justify-between text-sm font-mono text-green-bright mt-2">
                          <span>-1.0</span>
                          <span>0</span>
                          <span>1.0</span>
                        </div>
                      </div>

                      <h4 className="font-semibold text-white mb-2">Examples</h4>
                      <div className="space-y-3">
                        <div className="bg-navy rounded p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-green-bright">Stereo Spread</span>
                            <button
                              onClick={() =>
                                playExample(`<spa xmlns="https://spa.audio/ns" version="1.0">
                                  <group>
                                    <tone wave="sine" freq="440" dur="1" pan="-0.7" />
                                    <tone wave="sine" freq="554" dur="1" pan="0.7" />
                                  </group>
                                </spa>`)
                              }
                              className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                            >
                              Play
                            </button>
                          </div>
                          <p className="text-sm text-white/60">Different frequencies in each ear</p>
                        </div>
                        <div className="bg-navy rounded p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-green-bright">Auto-Pan</span>
                            <button
                              onClick={() =>
                                playExample(`<spa xmlns="https://spa.audio/ns" version="1.0">
                                  <tone wave="sine" freq="440" dur="2"
                                        pan.start="-1" pan.end="1" pan.curve="linear" />
                                </spa>`)
                              }
                              className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                            >
                              Play
                            </button>
                          </div>
                          <p className="text-sm text-white/60">Sound moves from left to right</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Advanced Features Section */}
              <section id="advanced" className="scroll-mt-8">
                <h2
                  onClick={() => toggleSection('advanced')}
                  className="text-2xl font-semibold text-green-bright mb-4 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
                >
                  <span className="text-white/40">
                    {expandedSections.has('advanced') ? '−' : '+'}
                  </span>
                  Advanced Features
                </h2>
                {expandedSections.has('advanced') && (
                  <div className="space-y-6">
                    {/* Parameter Automation */}
                    <div id="automation" className="scroll-mt-8">
                      <h3 className="text-lg font-semibold mb-3 text-green-bright">
                        Parameter Automation
                      </h3>
                      <p className="text-white/70 mb-4">
                        Any numeric parameter can be automated over time using .start, .end, and
                        .curve suffixes.
                      </p>

                      <h4 className="font-semibold text-white mb-2">Automation Syntax</h4>
                      <div className="bg-navy rounded p-4 mb-4">
                        <p className="text-white/70 mb-2">For any parameter:</p>
                        <ul className="space-y-1 font-mono text-sm text-green-bright">
                          <li>param.start="value" - Starting value</li>
                          <li>param.end="value" - Ending value</li>
                          <li>param.curve="type" - Interpolation curve</li>
                        </ul>
                      </div>

                      <h4 className="font-semibold text-white mb-2">Curve Types</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {[
                          { type: 'linear', desc: 'Constant rate of change' },
                          { type: 'exp', desc: 'Exponential - natural for frequency' },
                          { type: 'log', desc: 'Logarithmic - inverse of exponential' },
                          { type: 'smooth', desc: 'S-curve - ease in and out' },
                          { type: 'step', desc: 'Instant jump to end value' },
                          { type: 'ease-in', desc: 'Slow start, fast end' },
                          { type: 'ease-out', desc: 'Fast start, slow end' },
                        ].map((curve) => (
                          <div key={curve.type} className="bg-navy rounded p-3">
                            <span className="font-mono text-green-bright text-sm">
                              {curve.type}
                            </span>
                            <p className="text-xs text-white/60 mt-1">{curve.desc}</p>
                          </div>
                        ))}
                      </div>

                      <h4 className="font-semibold text-white mb-2">Examples</h4>
                      <div className="space-y-3">
                        <div className="bg-navy rounded p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-green-bright">Frequency Sweep</span>
                            <button
                              onClick={() =>
                                playExample(`<spa xmlns="https://spa.audio/ns" version="1.0">
                                  <tone wave="sine" dur="2"
                                        freq.start="200" freq.end="2000" freq.curve="exp" />
                                </spa>`)
                              }
                              className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                            >
                              Play
                            </button>
                          </div>
                          <div className="font-mono text-xs text-green-bright">
                            freq.start="200" freq.end="2000" freq.curve="exp"
                          </div>
                        </div>
                        <div className="bg-navy rounded p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-green-bright">Volume Fade</span>
                            <button
                              onClick={() =>
                                playExample(`<spa xmlns="https://spa.audio/ns" version="1.0">
                                  <tone wave="square" freq="440" dur="2"
                                        amp.start="0.5" amp.end="0" amp.curve="smooth" />
                                </spa>`)
                              }
                              className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                            >
                              Play
                            </button>
                          </div>
                          <div className="font-mono text-xs text-green-bright">
                            amp.start="0.5" amp.end="0" amp.curve="smooth"
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Repeat Functionality */}
                    <div id="repeat" className="scroll-mt-8">
                      <h3 className="text-lg font-semibold mb-3 text-green-bright">
                        Repeat Functionality
                      </h3>
                      <p className="text-white/70 mb-4">
                        Create echoes, delays, and rhythmic patterns by repeating elements with
                        optional transformations.
                      </p>

                      <h4 className="font-semibold text-white mb-2">Repeat Parameters</h4>
                      <ul className="space-y-2 text-white/70 mb-4">
                        <li>
                          <code className="text-green-bright">repeat</code>: Number of repetitions
                          (integer ≥ 1)
                        </li>
                        <li>
                          <code className="text-green-bright">repeat.interval</code>: Time between
                          repeats (seconds, required)
                        </li>
                        <li>
                          <code className="text-green-bright">repeat.delay</code>: Delay before
                          first repeat (optional)
                        </li>
                        <li>
                          <code className="text-green-bright">repeat.decay</code>: Volume reduction
                          per repeat (0-1)
                        </li>
                        <li>
                          <code className="text-green-bright">repeat.pitchShift</code>: Semitones
                          change per repeat (-12 to 12)
                        </li>
                      </ul>

                      <h4 className="font-semibold text-white mb-2">Examples</h4>
                      <div className="space-y-3">
                        <div className="bg-navy rounded p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-green-bright">Echo Effect</span>
                            <button
                              onClick={() =>
                                playExample(`<spa xmlns="https://spa.audio/ns" version="1.0">
                                  <tone wave="sine" freq="440" dur="0.1"
                                        repeat="5" repeat.interval="0.15"
                                        repeat.decay="0.2" />
                                </spa>`)
                              }
                              className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                            >
                              Play
                            </button>
                          </div>
                          <p className="text-sm text-white/60">Decaying echo with 5 repeats</p>
                        </div>
                        <div className="bg-navy rounded p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-green-bright">Arpeggio</span>
                            <button
                              onClick={() =>
                                playExample(`<spa xmlns="https://spa.audio/ns" version="1.0">
                                  <tone wave="square" freq="220" dur="0.1" amp="0.3"
                                        repeat="8" repeat.interval="0.1"
                                        repeat.pitchShift="3" />
                                </spa>`)
                              }
                              className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                            >
                              Play
                            </button>
                          </div>
                          <p className="text-sm text-white/60">Rising pitch pattern</p>
                        </div>
                      </div>
                    </div>

                    {/* Effects */}
                    <div id="effects" className="scroll-mt-8">
                      <h3 className="text-lg font-semibold mb-3 text-green-bright">Effects</h3>
                      <p className="text-white/70 mb-4">
                        Apply reverb and delay effects to add space and depth to sounds.
                      </p>

                      <h4 className="font-semibold text-white mb-2">Reverb</h4>
                      <div className="bg-navy rounded p-4 mb-4">
                        <p className="text-white/70 mb-2">Presets:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
                          {['room', 'hall', 'cathedral', 'cave', 'plate', 'spring'].map(
                            (preset) => (
                              <span key={preset} className="font-mono text-sm text-green-bright">
                                {preset}
                              </span>
                            )
                          )}
                        </div>
                        <p className="text-white/70 mb-2">Custom parameters:</p>
                        <ul className="space-y-1 text-sm text-white/60">
                          <li>
                            • <code className="text-green-bright">decay</code>: Reverb tail length
                            (0.1-10s)
                          </li>
                          <li>
                            • <code className="text-green-bright">preDelay</code>: Delay before
                            reverb (0-0.1s)
                          </li>
                          <li>
                            • <code className="text-green-bright">damping</code>: High frequency
                            damping (0-1)
                          </li>
                          <li>
                            • <code className="text-green-bright">roomSize</code>: Virtual room size
                            (0-1)
                          </li>
                          <li>
                            • <code className="text-green-bright">mix</code>: Dry/wet balance (0-1)
                          </li>
                        </ul>
                      </div>

                      <h4 className="font-semibold text-white mb-2">Delay</h4>
                      <div className="bg-navy rounded p-4 mb-4">
                        <p className="text-white/70 mb-2">Parameters:</p>
                        <ul className="space-y-1 text-sm text-white/60">
                          <li>
                            • <code className="text-green-bright">delayTime</code>: Delay in seconds
                            (0.01-2s)
                          </li>
                          <li>
                            • <code className="text-green-bright">feedback</code>: Regeneration
                            amount (0-0.95)
                          </li>
                          <li>
                            • <code className="text-green-bright">mix</code>: Dry/wet balance (0-1)
                          </li>
                        </ul>
                      </div>

                      <h4 className="font-semibold text-white mb-2">Example</h4>
                      <div className="bg-navy rounded p-4">
                        <div className="flex justify-end mb-2">
                          <button
                            onClick={() =>
                              playExample(`<spa xmlns="https://spa.audio/ns" version="1.0">
                                <defs>
                                  <effect id="verb" type="reverb" preset="hall" mix="0.3" />
                                  <effect id="echo" type="delay" delayTime="0.2" feedback="0.4" mix="0.5" />
                                </defs>
                                <tone wave="sine" freq="440" dur="0.5" effect="verb,echo" />
                              </spa>`)
                            }
                            className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                          >
                            Play
                          </button>
                        </div>
                        <div className="font-mono text-sm text-green-bright">
                          <pre>{`<defs>
  <effect id="verb" type="reverb" preset="hall" mix="0.3" />
  <effect id="echo" type="delay" delayTime="0.2"
          feedback="0.4" mix="0.5" />
</defs>

<tone wave="sine" freq="440" dur="0.5" effect="verb,echo" />`}</pre>
                        </div>
                      </div>
                    </div>

                    {/* Definitions & Reusability */}
                    <div id="definitions" className="scroll-mt-8">
                      <h3 className="text-lg font-semibold mb-3 text-green-bright">
                        Definitions & Reusability
                      </h3>
                      <p className="text-white/70 mb-4">
                        Use the <code className="text-green-bright">&lt;defs&gt;</code> section to
                        define reusable components that can be referenced throughout the document.
                      </p>

                      <h4 className="font-semibold text-white mb-2">What Can Be Defined</h4>
                      <ul className="space-y-2 text-white/70 mb-4">
                        <li>• Envelopes - ADSR patterns</li>
                        <li>• Effects - Reverb and delay configurations</li>
                        <li>
                          • Reference with <code className="text-green-bright">#id</code> syntax
                        </li>
                      </ul>

                      <h4 className="font-semibold text-white mb-2">
                        Example - Reusable Components
                      </h4>
                      <div className="bg-navy rounded p-4 font-mono text-sm text-green-bright overflow-x-auto">
                        <pre>{`<spa xmlns="https://spa.audio/ns" version="1.0">
  <defs>
    <!-- Define envelopes -->
    <envelope id="soft" value="0.1,0.2,0.6,0.3" />
    <envelope id="punch" value="0,0.05,0.8,0.1" />

    <!-- Define effects -->
    <effect id="space" type="reverb" preset="cathedral" mix="0.4" />
    <effect id="slapback" type="delay" delayTime="0.08"
            feedback="0.2" mix="0.3" />
  </defs>

  <!-- Use references -->
  <group effect="space">
    <tone wave="sine" freq="440" dur="1" envelope="#soft" />
    <tone wave="sine" freq="550" dur="1" envelope="#punch"
          effect="slapback" />
  </group>
</spa>`}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Complete Reference Section */}
              <section id="reference" className="scroll-mt-8">
                <h2
                  onClick={() => toggleSection('reference')}
                  className="text-2xl font-semibold text-green-bright mb-4 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
                >
                  <span className="text-white/40">
                    {expandedSections.has('reference') ? '−' : '+'}
                  </span>
                  Complete Reference
                </h2>
                {expandedSections.has('reference') && (
                  <div className="pl-4 sm:pl-6 lg:pl-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-green-bright">
                        All Attributes Reference
                      </h3>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-navy-light/20">
                              <th className="text-left py-2 px-3 text-green-bright">Attribute</th>
                              <th className="text-left py-2 px-3 text-green-bright">Elements</th>
                              <th className="text-left py-2 px-3 text-green-bright">
                                Range/Values
                              </th>
                              <th className="text-left py-2 px-3 text-green-bright">Default</th>
                            </tr>
                          </thead>
                          <tbody className="text-white/70">
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">wave</td>
                              <td className="py-2 px-3">tone</td>
                              <td className="py-2 px-3">sine, square, triangle, saw, pulse</td>
                              <td className="py-2 px-3">-</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">freq</td>
                              <td className="py-2 px-3">tone</td>
                              <td className="py-2 px-3">20-20000 Hz</td>
                              <td className="py-2 px-3">-</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">color</td>
                              <td className="py-2 px-3">noise</td>
                              <td className="py-2 px-3">white, pink, brown, blue, violet, grey</td>
                              <td className="py-2 px-3">-</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">dur</td>
                              <td className="py-2 px-3">tone, noise</td>
                              <td className="py-2 px-3">0.01-60 seconds</td>
                              <td className="py-2 px-3">-</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">amp</td>
                              <td className="py-2 px-3">all sound elements</td>
                              <td className="py-2 px-3">0-1</td>
                              <td className="py-2 px-3">1</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">envelope</td>
                              <td className="py-2 px-3">tone, noise</td>
                              <td className="py-2 px-3">A,D,S,R values or #ref</td>
                              <td className="py-2 px-3">0,0,1,0</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">pan</td>
                              <td className="py-2 px-3">all sound elements</td>
                              <td className="py-2 px-3">-1 to 1</td>
                              <td className="py-2 px-3">0</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">filter</td>
                              <td className="py-2 px-3">tone, noise</td>
                              <td className="py-2 px-3">lowpass, highpass, bandpass</td>
                              <td className="py-2 px-3">-</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">cutoff</td>
                              <td className="py-2 px-3">tone, noise (with filter)</td>
                              <td className="py-2 px-3">20-20000 Hz</td>
                              <td className="py-2 px-3">-</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">resonance</td>
                              <td className="py-2 px-3">tone, noise (with filter)</td>
                              <td className="py-2 px-3">0.1-20</td>
                              <td className="py-2 px-3">1</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">phase</td>
                              <td className="py-2 px-3">tone</td>
                              <td className="py-2 px-3">0-360 degrees</td>
                              <td className="py-2 px-3">0</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">at</td>
                              <td className="py-2 px-3">all sound elements</td>
                              <td className="py-2 px-3">0+ seconds</td>
                              <td className="py-2 px-3">0</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">tempo</td>
                              <td className="py-2 px-3">sequence</td>
                              <td className="py-2 px-3">20-300 BPM</td>
                              <td className="py-2 px-3">-</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">repeat</td>
                              <td className="py-2 px-3">tone, noise, group</td>
                              <td className="py-2 px-3">1+ integer</td>
                              <td className="py-2 px-3">-</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">repeat.interval</td>
                              <td className="py-2 px-3">tone, noise, group</td>
                              <td className="py-2 px-3">0-10 seconds</td>
                              <td className="py-2 px-3">-</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">repeat.decay</td>
                              <td className="py-2 px-3">tone, noise, group</td>
                              <td className="py-2 px-3">0-1</td>
                              <td className="py-2 px-3">0</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">repeat.pitchShift</td>
                              <td className="py-2 px-3">tone</td>
                              <td className="py-2 px-3">-12 to 12 semitones</td>
                              <td className="py-2 px-3">0</td>
                            </tr>
                            <tr className="border-b border-navy-light/10">
                              <td className="py-2 px-3 font-mono">effect</td>
                              <td className="py-2 px-3">all elements</td>
                              <td className="py-2 px-3">effect ID or comma-separated IDs</td>
                              <td className="py-2 px-3">-</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <h3 className="text-lg font-semibold mb-3 mt-6 text-green-bright">
                        Parameter Automation
                      </h3>
                      <p className="text-white/70 mb-3">
                        Add <code className="text-green-bright">.start</code>,{' '}
                        <code className="text-green-bright">.end</code>, and{' '}
                        <code className="text-green-bright">.curve</code> suffixes to any numeric
                        parameter:
                      </p>
                      <ul className="space-y-2 text-white/70">
                        <li>• freq, amp, pan, cutoff, resonance</li>
                        <li>• Curve types: linear, exp, log, smooth, step, ease-in, ease-out</li>
                      </ul>
                    </div>
                  </div>
                )}
              </section>

              {/* Examples Library Section */}
              <section id="examples" className="scroll-mt-8">
                <h2
                  onClick={() => toggleSection('examples')}
                  className="text-2xl font-semibold text-green-bright mb-4 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
                >
                  <span className="text-white/40">
                    {expandedSections.has('examples') ? '−' : '+'}
                  </span>
                  Example Library
                </h2>
                {expandedSections.has('examples') && (
                  <div className="pl-4 sm:pl-6 lg:pl-8">
                    <div className="space-y-6">
                      {/* UI Feedback */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-green-bright">
                          UI Feedback
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            {
                              name: 'Button Click',
                              xml: `<tone wave="sine" freq="800" dur="0.05"
      amp="0.8" envelope="0,0.02,0,0.03"/>`,
                            },
                            {
                              name: 'Hover',
                              xml: `<tone wave="sine" freq="1200" dur="0.03"
      amp="0.3" envelope="0,0.01,0,0.02"/>`,
                            },
                            {
                              name: 'Toggle On',
                              xml: `<tone wave="sine" freq="600" dur="0.1"
      amp="0.4" envelope="0.01,0.02,0.3,0.07"/>`,
                            },
                            {
                              name: 'Toggle Off',
                              xml: `<tone wave="sine" freq="400" dur="0.1"
      amp="0.4" envelope="0.01,0.02,0.3,0.07"/>`,
                            },
                          ].map((example) => (
                            <div key={example.name} className="bg-navy rounded p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-green-bright text-sm">
                                  {example.name}
                                </span>
                                <button
                                  onClick={() =>
                                    playExample(
                                      `<spa xmlns="https://spa.audio/ns" version="1.0">${example.xml}</spa>`
                                    )
                                  }
                                  className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                                >
                                  Play
                                </button>
                              </div>
                              <div className="font-mono text-xs text-white/60 overflow-x-auto">
                                <pre>{example.xml}</pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notifications */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-green-bright">
                          Notifications
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            {
                              name: 'Success',
                              xml: `<group>
  <tone wave="sine" freq="392" dur="0.12" amp="0.5"/>
  <tone wave="sine" freq="523.25" dur="0.12" amp="0.5"/>
  <tone wave="sine" freq="783.99" dur="0.25" amp="0.6"/>
</group>`,
                            },
                            {
                              name: 'Error',
                              xml: `<group>
  <tone wave="square" freq="200" dur="0.15" amp="0.3"/>
  <noise color="pink" dur="0.1" amp="0.2"/>
</group>`,
                            },
                            {
                              name: 'Warning',
                              xml: `<tone wave="triangle" freq="550" dur="0.3"
      amp="0.4" envelope="0.01,0.05,0.5,0.2"/>`,
                            },
                            {
                              name: 'Alert',
                              xml: `<tone wave="square" freq="880" dur="0.05"
      repeat="3" repeat.interval="0.1"/>`,
                            },
                          ].map((example) => (
                            <div key={example.name} className="bg-navy rounded p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-green-bright text-sm">
                                  {example.name}
                                </span>
                                <button
                                  onClick={() =>
                                    playExample(
                                      `<spa xmlns="https://spa.audio/ns" version="1.0">${example.xml}</spa>`
                                    )
                                  }
                                  className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                                >
                                  Play
                                </button>
                              </div>
                              <div className="font-mono text-xs text-white/60 overflow-x-auto">
                                <pre>{example.xml}</pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Game Sounds */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-green-bright">
                          Game Sounds
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            {
                              name: 'Laser',
                              xml: `<group>
  <tone wave="saw" dur="0.3"
        freq.start="1000" freq.end="200" freq.curve="exp"/>
  <noise color="white" dur="0.15" amp="0.15"
         filter="highpass" cutoff="5000"/>
</group>`,
                            },
                            {
                              name: 'Explosion',
                              xml: `<group>
  <noise color="brown" dur="0.5" amp="0.8"
         envelope="0,0.1,0,0.4"/>
  <tone wave="sine" freq="50" dur="0.3" amp="0.5"/>
</group>`,
                            },
                            {
                              name: 'Jump',
                              xml: `<tone wave="square" dur="0.15"
      freq.start="200" freq.end="600" freq.curve="exp"
      amp="0.3"/>`,
                            },
                            {
                              name: 'Coin',
                              xml: `<group>
  <tone wave="square" freq="988" dur="0.08" at="0"/>
  <tone wave="square" freq="1319" dur="0.4" at="0.08"/>
</group>`,
                            },
                          ].map((example) => (
                            <div key={example.name} className="bg-navy rounded p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-green-bright text-sm">
                                  {example.name}
                                </span>
                                <button
                                  onClick={() =>
                                    playExample(
                                      `<spa xmlns="https://spa.audio/ns" version="1.0">${example.xml}</spa>`
                                    )
                                  }
                                  className="text-xs px-2 py-1 bg-green-bright/20 hover:bg-green-bright/30 text-green-bright rounded transition-colors"
                                >
                                  Play
                                </button>
                              </div>
                              <div className="font-mono text-xs text-white/60 overflow-x-auto">
                                <pre>{example.xml}</pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
