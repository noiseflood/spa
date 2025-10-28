/**
 * Example React App - Demonstrates SPA player usage
 */

import React, { useState } from 'react';
import {
  SPAPlayer,
  SPAButton,
  useSPAPlayer,
  parseSPA
} from '@spa-audio/react';
import '@spa-audio/react/src/styles.css';

// Example inline SPA definitions for UI sounds
const buttonClickSPA = `<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="800" dur="0.05"
        envelope="0,0.02,0,0.03"/>
</spa>`;

const successSPA = `<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <group>
    <tone wave="sine" freq="523.25" dur="0.1" amp="0.6"/>
    <tone wave="sine" freq="659.25" dur="0.1" amp="0.4"/>
    <tone wave="sine" freq="783.99" dur="0.15" amp="0.3"/>
  </group>
</spa>`;

const errorSPA = `<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <group>
    <tone wave="square" freq="200" dur="0.1" amp="0.3"/>
    <noise color="pink" dur="0.05" amp="0.2"/>
  </group>
</spa>`;

function App() {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [customXML, setCustomXML] = useState('');
  const [showCustomEditor, setShowCustomEditor] = useState(false);

  // Example SPA files
  const exampleFiles = [
    { name: 'Button Click', path: '/examples/ui/button-click.spa' },
    { name: 'Notification', path: '/examples/ui/notification.spa' },
    { name: 'Loading Tick', path: '/examples/ui/loading-tick.spa' },
    { name: 'Drag Start', path: '/examples/ui/drag-start.spa' },
    { name: 'Button Hover', path: '/examples/ui/button-hover.spa' }
  ];

  const handlePlayCustom = () => {
    if (!customXML) return;

    try {
      // Validate the XML
      parseSPA(customXML);
      // If valid, close editor and play
      setShowCustomEditor(false);
    } catch (error) {
      alert(`Invalid SPA XML: ${error.message}`);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>SPA React Player Demo</h1>
        <p>Play procedural audio effects using the Web Audio API</p>
      </header>

      <main className="app-main">
        {/* Example Sound Buttons */}
        <section className="demo-section">
          <h2>Quick Sound Effects</h2>
          <p>Click these buttons to play inline SPA sounds:</p>

          <div className="button-grid">
            <SPAButton
              spa={buttonClickSPA}
              className="demo-button"
            >
              Click Sound
            </SPAButton>

            <SPAButton
              spa={successSPA}
              className="demo-button success"
            >
              Success Sound
            </SPAButton>

            <SPAButton
              spa={errorSPA}
              className="demo-button error"
            >
              Error Sound
            </SPAButton>
          </div>
        </section>

        {/* Example Files */}
        <section className="demo-section">
          <h2>Example SPA Files</h2>
          <p>Select a file to load in the player:</p>

          <div className="file-list">
            {exampleFiles.map((file) => (
              <button
                key={file.path}
                className={`file-item ${selectedFile === file.path ? 'selected' : ''}`}
                onClick={() => setSelectedFile(file.path)}
              >
                {file.name}
              </button>
            ))}
          </div>
        </section>

        {/* Main Player */}
        <section className="demo-section">
          <h2>SPA Player</h2>
          <SPAPlayer
            src={selectedFile}
            showUpload={true}
            showTempo={true}
            showLoop={true}
            onComplete={() => console.log('Playback complete')}
            onError={(error) => console.error('Player error:', error)}
          />
        </section>

        {/* Custom XML Editor */}
        <section className="demo-section">
          <h2>Custom SPA XML</h2>
          <button
            className="toggle-editor"
            onClick={() => setShowCustomEditor(!showCustomEditor)}
          >
            {showCustomEditor ? 'Hide' : 'Show'} XML Editor
          </button>

          {showCustomEditor && (
            <div className="xml-editor">
              <textarea
                value={customXML}
                onChange={(e) => setCustomXML(e.target.value)}
                placeholder={`Enter your SPA XML here, for example:

<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="440" dur="1" amp="0.5"/>
</spa>`}
                rows={15}
                className="xml-textarea"
              />

              <div className="editor-actions">
                <SPAButton
                  spa={customXML}
                  className="play-custom"
                  disabled={!customXML}
                  onClick={handlePlayCustom}
                >
                  Play Custom XML
                </SPAButton>

                <button
                  className="clear-button"
                  onClick={() => setCustomXML('')}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Hook Example */}
        <section className="demo-section">
          <h2>Using Hooks Directly</h2>
          <HookExample />
        </section>
      </main>

      <footer className="app-footer">
        <p>SPA (Synthetic Parametric Audio) - The SVG of Sound Effects</p>
      </footer>
    </div>
  );
}

// Example component using the hook directly
function HookExample() {
  const player = useSPAPlayer();
  const [xml, setXml] = useState('');

  const handlePlay = async () => {
    if (!xml) return;

    try {
      const doc = player.loadXML(xml);
      await player.play(doc);
    } catch (error) {
      console.error('Failed to play:', error);
    }
  };

  return (
    <div className="hook-example">
      <p>This example shows how to use the useSPAPlayer hook directly:</p>

      <div className="hook-controls">
        <input
          type="text"
          value={xml}
          onChange={(e) => setXml(e.target.value)}
          placeholder='<tone wave="sine" freq="440" dur="0.5"/>'
          className="xml-input"
        />

        <button
          onClick={handlePlay}
          disabled={!xml || player.isPlaying}
          className="play-button"
        >
          {player.isPlaying ? 'Playing...' : 'Play'}
        </button>

        {player.isPlaying && (
          <button onClick={player.stop} className="stop-button">
            Stop
          </button>
        )}
      </div>

      <div className="hook-info">
        <p>Status: {player.isPlaying ? 'Playing' : player.isPaused ? 'Paused' : 'Stopped'}</p>
        <p>Volume: {Math.round(player.volume * 100)}%</p>
        <p>Tempo: {player.tempo} BPM</p>
      </div>

      <div className="hook-controls-extra">
        <label>
          Volume:
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={player.volume}
            onChange={(e) => player.setVolume(Number(e.target.value))}
          />
        </label>

        <label>
          Tempo:
          <input
            type="range"
            min="60"
            max="180"
            step="10"
            value={player.tempo}
            onChange={(e) => player.setTempo(Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}

export default App;