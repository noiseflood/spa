import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import {
  parseSPA,
  playSPA,
  type SPADocument,
  type SPASound,
  type ToneElement,
  type NoiseElement,
  type GroupElement,
  type ADSREnvelope,
  type AutomationCurve,
  type FilterConfig
} from '@spa/core'
import { getPresetCategories, loadPreset as loadPresetFile, getPresetPath } from '../utils/presetLoader'

// Editor-specific types for UI state
interface EditorLayer {
  id: number
  sound: SPASound
}

export default function Editor() {
  const [layers, setLayers] = useState<EditorLayer[]>([])
  const [currentLayerId, setCurrentLayerId] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [xmlOutput, setXmlOutput] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [showPresets, setShowPresets] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>('UI Feedback')
  const audioContextRef = useRef<AudioContext | null>(null)
  const layerIdCounterRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentPlaybackRef = useRef<Promise<void> | null>(null)

  // Get preset categories
  const presetCategories = getPresetCategories()

  useEffect(() => {
    // Add initial layer
    addLayer()
  }, [])

  useEffect(() => {
    updateXMLOutput()
  }, [layers])

  const getDefaultSound = (type: 'tone' | 'noise' = 'tone'): SPASound => {
    if (type === 'tone') {
      return {
        type: 'tone',
        wave: 'sine',
        freq: 440,
        dur: 0.5,
        amp: 1,
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.7,
          release: 0.2
        }
      } as ToneElement
    } else {
      return {
        type: 'noise',
        color: 'white',
        dur: 0.5,
        amp: 1,
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.7,
          release: 0.2
        }
      } as NoiseElement
    }
  }

  const addLayer = (type: 'tone' | 'noise' = 'tone') => {
    // Stop any currently playing sound when adding a layer
    if (isPlaying) {
      stopSound()
    }

    const newLayer: EditorLayer = {
      id: layerIdCounterRef.current++,
      sound: getDefaultSound(type)
    }

    setLayers([...layers, newLayer])
    setCurrentLayerId(newLayer.id)
  }

  const removeLayer = (id: number) => {
    // Stop any currently playing sound
    if (isPlaying) {
      stopSound()
    }

    setLayers(layers.filter(l => l.id !== id))

    // Update current layer selection
    if (currentLayerId === id) {
      const remaining = layers.filter(l => l.id !== id)
      setCurrentLayerId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const updateLayer = (id: number, updates: Partial<EditorLayer>) => {
    setLayers(layers.map(l =>
      l.id === id ? { ...l, ...updates } : l
    ))
  }

  const updateLayerSound = (id: number, soundUpdates: Partial<SPASound>) => {
    setLayers(layers.map(l =>
      l.id === id ? { ...l, sound: { ...l.sound, ...soundUpdates } } : l
    ))
  }

  const updateXMLOutput = () => {
    if (layers.length === 0) {
      setXmlOutput(`<?xml version="1.0" encoding="UTF-8"?>
<spa version="1.0">
  <!-- Add layers to create your sound -->
</spa>`)
      return
    }

    // Create a SPA document from our layers
    const doc: SPADocument = {
      version: '1.0',
      sounds: layers.map(l => l.sound)
    }

    // Generate XML manually (we could also add a toXML function to the package)
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<spa version="1.0">\n'

    if (layers.length > 1) {
      xml += '  <group>\n'
      layers.forEach(layer => {
        xml += '    ' + soundToXML(layer.sound) + '\n'
      })
      xml += '  </group>\n'
    } else {
      xml += '  ' + soundToXML(layers[0].sound) + '\n'
    }

    xml += '</spa>'
    setXmlOutput(xml)
  }

  const soundToXML = (sound: SPASound): string => {
    let xml = '<'

    if (sound.type === 'tone') {
      const tone = sound as ToneElement
      xml += `tone wave="${tone.wave}"`

      // Handle frequency
      if (typeof tone.freq === 'object' && 'start' in tone.freq) {
        const freq = tone.freq as AutomationCurve
        xml += ` freq.start="${freq.start}" freq.end="${freq.end}" freq.curve="${freq.curve}"`
      } else {
        xml += ` freq="${tone.freq}"`
      }

      xml += ` dur="${tone.dur}"`

      // Handle amplitude
      if (typeof tone.amp === 'object' && 'start' in tone.amp) {
        const amp = tone.amp as AutomationCurve
        xml += ` amp.start="${amp.start}" amp.end="${amp.end}" amp.curve="${amp.curve}"`
      } else if (tone.amp !== undefined && tone.amp !== 1) {
        xml += ` amp="${tone.amp}"`
      }

      if (tone.pan !== undefined && tone.pan !== 0) {
        xml += ` pan="${tone.pan}"`
      }

      // Handle filter
      if (tone.filter) {
        xml += ` filter="${tone.filter.type}" cutoff="${tone.filter.cutoff}"`
        if (tone.filter.resonance !== undefined && tone.filter.resonance !== 1) {
          xml += ` resonance="${tone.filter.resonance}"`
        }
      }

      // Handle envelope
      if (tone.envelope) {
        const env = tone.envelope
        xml += `\n        envelope="${env.attack},${env.decay},${env.sustain},${env.release}"`
      }

      // Handle repeat
      if (tone.repeat !== undefined && tone.repeatInterval !== undefined) {
        xml += `\n        repeat="${tone.repeat}" repeat.interval="${tone.repeatInterval}"`
        if (tone.repeatDelay) xml += ` repeat.delay="${tone.repeatDelay}"`
        if (tone.repeatDecay) xml += ` repeat.decay="${tone.repeatDecay}"`
        if (tone.repeatPitchShift) xml += ` repeat.pitchShift="${tone.repeatPitchShift}"`
      }

    } else if (sound.type === 'noise') {
      const noise = sound as NoiseElement
      xml += `noise color="${noise.color}" dur="${noise.dur}"`

      if (noise.amp !== undefined && noise.amp !== 1) {
        xml += ` amp="${noise.amp}"`
      }

      if (noise.pan !== undefined && noise.pan !== 0) {
        xml += ` pan="${noise.pan}"`
      }

      // Handle filter
      if (noise.filter) {
        xml += ` filter="${noise.filter.type}" cutoff="${noise.filter.cutoff}"`
        if (noise.filter.resonance !== undefined && noise.filter.resonance !== 1) {
          xml += ` resonance="${noise.filter.resonance}"`
        }
      }

      // Handle envelope
      if (noise.envelope) {
        const env = noise.envelope
        xml += `\n         envelope="${env.attack},${env.decay},${env.sustain},${env.release}"`
      }

      // Handle repeat
      if (noise.repeat !== undefined && noise.repeatInterval !== undefined) {
        xml += `\n         repeat="${noise.repeat}" repeat.interval="${noise.repeatInterval}"`
        if (noise.repeatDelay) xml += ` repeat.delay="${noise.repeatDelay}"`
        if (noise.repeatDecay) xml += ` repeat.decay="${noise.repeatDecay}"`
        if (noise.repeatPitchShift) xml += ` repeat.pitchShift="${noise.repeatPitchShift}"`
      }
    }

    xml += '/>'
    return xml
  }

  const playSound = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    stopSound()
    setIsPlaying(true)

    try {
      // Use the SPA package's playSPA function
      currentPlaybackRef.current = playSPA(xmlOutput)
      await currentPlaybackRef.current
    } catch (error) {
      console.error('Error playing sound:', error)
    } finally {
      setIsPlaying(false)
      currentPlaybackRef.current = null
    }
  }

  const stopSound = () => {
    // The playSPA function returns a promise, but we can't really stop it mid-playback
    // This is a limitation we should address in the package
    setIsPlaying(false)
    currentPlaybackRef.current = null
  }

  const importFromText = () => {
    try {
      const doc = parseSPA(importText)
      const editorLayers: EditorLayer[] = doc.sounds.map((sound, index) => ({
        id: index,
        sound
      }))

      if (editorLayers.length > 0) {
        if (isPlaying) {
          stopSound()
        }
        setLayers(editorLayers)
        layerIdCounterRef.current = editorLayers.length
        setCurrentLayerId(editorLayers[0].id)
        setShowImportModal(false)
        setImportText('')
      }
    } catch (error) {
      alert(`Failed to import SPA file: ${error}`)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      try {
        const doc = parseSPA(content)
        const editorLayers: EditorLayer[] = doc.sounds.map((sound, index) => ({
          id: index,
          sound
        }))

        if (editorLayers.length > 0) {
          if (isPlaying) {
            stopSound()
          }
          setLayers(editorLayers)
          layerIdCounterRef.current = editorLayers.length
          setCurrentLayerId(editorLayers[0].id)
          setShowImportModal(false)
        }
      } catch (error) {
        alert(`Failed to import SPA file: ${error}`)
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const loadPreset = async (category: string, preset: string) => {
    if (isPlaying) {
      stopSound()
    }

    const presetPath = getPresetPath(category, preset)
    if (presetPath) {
      try {
        const spaContent = await loadPresetFile(presetPath)
        const doc = parseSPA(spaContent)
        const editorLayers: EditorLayer[] = doc.sounds.map((sound, index) => ({
          id: index,
          sound
        }))

        if (editorLayers.length > 0) {
          layerIdCounterRef.current = editorLayers.length
          setLayers(editorLayers)
          setCurrentLayerId(editorLayers[0].id)
        }
      } catch (error) {
        console.error(`Failed to load preset ${preset}:`, error)
      }
    }
  }

  const currentLayer = layers.find(l => l.id === currentLayerId)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const activeElement = document.activeElement as HTMLElement
        if (activeElement && activeElement.tagName === 'TEXTAREA') {
          return
        }
        e.preventDefault()
        if (isPlaying) {
          stopSound()
        } else if (layers.length > 0) {
          playSound()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, layers, xmlOutput])

  return (
    <div className="min-h-screen bg-background text-white">
      <Head>
        <title>SPA Sound Editor</title>
      </Head>

      {/* Header */}
      <header className="bg-surface border-b border-primary">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              ← Back to Home
            </Link>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="px-3 py-1 bg-surface border border-primary rounded-md hover:bg-primary transition-colors text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              Presets
            </button>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            SPA Sound Editor
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Visual editor for creating SPA sound effects
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Toolbar */}
        <div className="bg-surface px-6 py-3 border-b border-primary/10 flex items-center gap-4">
          <button
            onClick={() => addLayer('tone')}
            className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-md transition-colors"
          >
            + Add Tone
          </button>
          <button
            onClick={() => addLayer('noise')}
            className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-md transition-colors"
          >
            + Add Noise
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-surface border border-primary hover:bg-primary/20 rounded-md transition-colors"
          >
            Import SPA
          </button>
          <button
            onClick={() => {
              const blob = new Blob([xmlOutput], { type: 'text/xml' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'sound.spa'
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="px-4 py-2 bg-surface border border-primary hover:bg-primary/20 rounded-md transition-colors"
          >
            Export SPA
          </button>
        </div>

        <div className="flex-1 flex">
          {/* Presets Sidebar */}
          {showPresets && (
            <div className="w-80 bg-surface border-r border-primary/10 overflow-y-auto">
              <div className="sticky top-0 bg-surface p-4 border-b border-primary/10">
                <h2 className="text-primary font-semibold text-lg">Sound Presets</h2>
              </div>
              <div className="p-4">
                {Object.entries(presetCategories).map(([category, presets]) => (
                  <div key={category} className="mb-4">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                      className="w-full flex items-center justify-between p-2 bg-background rounded hover:bg-primary/10 transition-colors mb-2"
                    >
                      <span className="text-sm font-medium text-primary">{category}</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${expandedCategory === category ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {expandedCategory === category && (
                      <div className="space-y-1 ml-2">
                        {Object.keys(presets).map((presetName) => (
                          <button
                            key={presetName}
                            onClick={() => loadPreset(category, presetName)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-primary/20 hover:text-white rounded transition-colors"
                          >
                            {presetName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editor Panel */}
          <div className="flex-1 flex">
            {/* Layers Panel */}
            <div className="w-80 bg-surface border-r border-primary/10 overflow-y-auto">
              <div className="p-4">
                <h2 className="text-primary font-semibold mb-4">Layers</h2>
                {layers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No layers yet. Add a tone or noise to start.</p>
                ) : (
                  <div className="space-y-2">
                    {layers.map(layer => (
                      <div
                        key={layer.id}
                        className={`p-3 bg-background rounded-lg cursor-pointer border-2 transition-colors ${
                          currentLayerId === layer.id
                            ? 'border-primary'
                            : 'border-transparent hover:border-primary/50'
                        }`}
                        onClick={() => setCurrentLayerId(layer.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {layer.sound.type === 'tone'
                              ? `Tone (${(layer.sound as ToneElement).wave})`
                              : `Noise (${(layer.sound as NoiseElement).color})`
                            }
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeLayer(layer.id)
                            }}
                            className="text-red-500 hover:text-red-400"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Parameters Panel */}
            <div className="flex-1 bg-background p-6 overflow-y-auto">
              <h2 className="text-primary font-semibold mb-4">Parameters</h2>
              {currentLayer ? (
                <div className="space-y-4 max-w-2xl">
                  {currentLayer.sound.type === 'tone' ? (
                    // Tone Parameters
                    <>
                      <div className="bg-surface p-4 rounded-lg space-y-4">
                        <h3 className="text-accent font-medium">Waveform</h3>
                        <div className="flex gap-2">
                          {['sine', 'square', 'sawtooth', 'triangle'].map(wave => (
                            <button
                              key={wave}
                              onClick={() => updateLayerSound(currentLayer.id, { wave } as Partial<ToneElement>)}
                              className={`px-4 py-2 rounded-md transition-colors ${
                                (currentLayer.sound as ToneElement).wave === wave
                                  ? 'bg-primary text-white'
                                  : 'bg-background border border-primary/20 hover:bg-primary/10'
                              }`}
                            >
                              {wave}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-surface p-4 rounded-lg space-y-4">
                        <h3 className="text-accent font-medium">Frequency</h3>
                        <div className="space-y-2">
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Frequency (Hz)</span>
                            <input
                              type="number"
                              value={typeof (currentLayer.sound as ToneElement).freq === 'number'
                                ? (currentLayer.sound as ToneElement).freq
                                : ((currentLayer.sound as ToneElement).freq as AutomationCurve).start}
                              onChange={(e) => updateLayerSound(currentLayer.id, { freq: parseFloat(e.target.value) || 440 } as Partial<ToneElement>)}
                              className="w-24 px-2 py-1 bg-background rounded border border-primary/20 text-right"
                              min="20"
                              max="20000"
                            />
                          </label>
                          <input
                            type="range"
                            value={typeof (currentLayer.sound as ToneElement).freq === 'number'
                              ? (currentLayer.sound as ToneElement).freq
                              : ((currentLayer.sound as ToneElement).freq as AutomationCurve).start}
                            onChange={(e) => updateLayerSound(currentLayer.id, { freq: parseFloat(e.target.value) } as Partial<ToneElement>)}
                            className="w-full"
                            min="20"
                            max="2000"
                          />
                        </div>
                      </div>

                      <div className="bg-surface p-4 rounded-lg space-y-4">
                        <h3 className="text-accent font-medium">Duration</h3>
                        <div className="space-y-2">
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Duration (s)</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as ToneElement).dur}
                              onChange={(e) => updateLayerSound(currentLayer.id, { dur: parseFloat(e.target.value) || 0.5 } as Partial<ToneElement>)}
                              className="w-24 px-2 py-1 bg-background rounded border border-primary/20 text-right"
                              min="0.01"
                              max="10"
                              step="0.01"
                            />
                          </label>
                          <input
                            type="range"
                            value={(currentLayer.sound as ToneElement).dur}
                            onChange={(e) => updateLayerSound(currentLayer.id, { dur: parseFloat(e.target.value) } as Partial<ToneElement>)}
                            className="w-full"
                            min="0.01"
                            max="5"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="bg-surface p-4 rounded-lg space-y-4">
                        <h3 className="text-accent font-medium">Amplitude</h3>
                        <div className="space-y-2">
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Volume</span>
                            <input
                              type="number"
                              value={typeof (currentLayer.sound as ToneElement).amp === 'number'
                                ? (currentLayer.sound as ToneElement).amp
                                : ((currentLayer.sound as ToneElement).amp as AutomationCurve)?.start || 1}
                              onChange={(e) => updateLayerSound(currentLayer.id, { amp: parseFloat(e.target.value) || 1 } as Partial<ToneElement>)}
                              className="w-24 px-2 py-1 bg-background rounded border border-primary/20 text-right"
                              min="0"
                              max="1"
                              step="0.01"
                            />
                          </label>
                          <input
                            type="range"
                            value={typeof (currentLayer.sound as ToneElement).amp === 'number'
                              ? (currentLayer.sound as ToneElement).amp
                              : ((currentLayer.sound as ToneElement).amp as AutomationCurve)?.start || 1}
                            onChange={(e) => updateLayerSound(currentLayer.id, { amp: parseFloat(e.target.value) } as Partial<ToneElement>)}
                            className="w-full"
                            min="0"
                            max="1"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="bg-surface p-4 rounded-lg space-y-4">
                        <h3 className="text-accent font-medium">Envelope (ADSR)</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <label className="space-y-1">
                            <span className="text-sm text-gray-400">Attack</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as ToneElement).envelope?.attack || 0.01}
                              onChange={(e) => {
                                const tone = currentLayer.sound as ToneElement
                                updateLayerSound(currentLayer.id, {
                                  envelope: {
                                    ...(tone.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }),
                                    attack: parseFloat(e.target.value) || 0.01
                                  }
                                } as Partial<ToneElement>)
                              }}
                              className="w-full px-2 py-1 bg-background rounded border border-primary/20"
                              min="0"
                              max="1"
                              step="0.01"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-sm text-gray-400">Decay</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as ToneElement).envelope?.decay || 0.1}
                              onChange={(e) => {
                                const tone = currentLayer.sound as ToneElement
                                updateLayerSound(currentLayer.id, {
                                  envelope: {
                                    ...(tone.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }),
                                    decay: parseFloat(e.target.value) || 0.1
                                  }
                                } as Partial<ToneElement>)
                              }}
                              className="w-full px-2 py-1 bg-background rounded border border-primary/20"
                              min="0"
                              max="1"
                              step="0.01"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-sm text-gray-400">Sustain</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as ToneElement).envelope?.sustain || 0.7}
                              onChange={(e) => {
                                const tone = currentLayer.sound as ToneElement
                                updateLayerSound(currentLayer.id, {
                                  envelope: {
                                    ...(tone.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }),
                                    sustain: parseFloat(e.target.value) || 0.7
                                  }
                                } as Partial<ToneElement>)
                              }}
                              className="w-full px-2 py-1 bg-background rounded border border-primary/20"
                              min="0"
                              max="1"
                              step="0.01"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-sm text-gray-400">Release</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as ToneElement).envelope?.release || 0.2}
                              onChange={(e) => {
                                const tone = currentLayer.sound as ToneElement
                                updateLayerSound(currentLayer.id, {
                                  envelope: {
                                    ...(tone.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }),
                                    release: parseFloat(e.target.value) || 0.2
                                  }
                                } as Partial<ToneElement>)
                              }}
                              className="w-full px-2 py-1 bg-background rounded border border-primary/20"
                              min="0"
                              max="1"
                              step="0.01"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="bg-surface p-4 rounded-lg space-y-4">
                        <h3 className="text-accent font-medium">Repeat</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Count</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as ToneElement).repeat || 1}
                              onChange={(e) => updateLayerSound(currentLayer.id, { repeat: parseInt(e.target.value) || 1 } as Partial<ToneElement>)}
                              className="w-24 px-2 py-1 bg-background rounded border border-primary/20 text-right"
                              min="1"
                              max="100"
                            />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Interval (s)</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as ToneElement).repeatInterval || 0}
                              onChange={(e) => updateLayerSound(currentLayer.id, { repeatInterval: parseFloat(e.target.value) || 0 } as Partial<ToneElement>)}
                              className="w-24 px-2 py-1 bg-background rounded border border-primary/20 text-right"
                              min="0"
                              max="10"
                              step="0.01"
                            />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Delay (s)</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as ToneElement).repeatDelay || 0}
                              onChange={(e) => updateLayerSound(currentLayer.id, { repeatDelay: parseFloat(e.target.value) || 0 } as Partial<ToneElement>)}
                              className="w-24 px-2 py-1 bg-background rounded border border-primary/20 text-right"
                              min="0"
                              max="10"
                              step="0.01"
                            />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Decay</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as ToneElement).repeatDecay || 0}
                              onChange={(e) => updateLayerSound(currentLayer.id, { repeatDecay: parseFloat(e.target.value) || 0 } as Partial<ToneElement>)}
                              className="w-24 px-2 py-1 bg-background rounded border border-primary/20 text-right"
                              min="0"
                              max="1"
                              step="0.01"
                            />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Pitch Shift</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as ToneElement).repeatPitchShift || 0}
                              onChange={(e) => updateLayerSound(currentLayer.id, { repeatPitchShift: parseFloat(e.target.value) || 0 } as Partial<ToneElement>)}
                              className="w-24 px-2 py-1 bg-background rounded border border-primary/20 text-right"
                              min="-12"
                              max="12"
                              step="0.1"
                            />
                          </label>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Noise Parameters
                    <>
                      <div className="bg-surface p-4 rounded-lg space-y-4">
                        <h3 className="text-accent font-medium">Noise Type</h3>
                        <div className="flex gap-2">
                          {['white', 'pink', 'brown'].map(color => (
                            <button
                              key={color}
                              onClick={() => updateLayerSound(currentLayer.id, { color } as Partial<NoiseElement>)}
                              className={`px-4 py-2 rounded-md transition-colors ${
                                (currentLayer.sound as NoiseElement).color === color
                                  ? 'bg-primary text-white'
                                  : 'bg-background border border-primary/20 hover:bg-primary/10'
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-surface p-4 rounded-lg space-y-4">
                        <h3 className="text-accent font-medium">Duration</h3>
                        <div className="space-y-2">
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Duration (s)</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as NoiseElement).dur}
                              onChange={(e) => updateLayerSound(currentLayer.id, { dur: parseFloat(e.target.value) || 0.5 } as Partial<NoiseElement>)}
                              className="w-24 px-2 py-1 bg-background rounded border border-primary/20 text-right"
                              min="0.01"
                              max="10"
                              step="0.01"
                            />
                          </label>
                          <input
                            type="range"
                            value={(currentLayer.sound as NoiseElement).dur}
                            onChange={(e) => updateLayerSound(currentLayer.id, { dur: parseFloat(e.target.value) } as Partial<NoiseElement>)}
                            className="w-full"
                            min="0.01"
                            max="5"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="bg-surface p-4 rounded-lg space-y-4">
                        <h3 className="text-accent font-medium">Amplitude</h3>
                        <div className="space-y-2">
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Volume</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as NoiseElement).amp || 1}
                              onChange={(e) => updateLayerSound(currentLayer.id, { amp: parseFloat(e.target.value) || 1 } as Partial<NoiseElement>)}
                              className="w-24 px-2 py-1 bg-background rounded border border-primary/20 text-right"
                              min="0"
                              max="1"
                              step="0.01"
                            />
                          </label>
                          <input
                            type="range"
                            value={(currentLayer.sound as NoiseElement).amp || 1}
                            onChange={(e) => updateLayerSound(currentLayer.id, { amp: parseFloat(e.target.value) } as Partial<NoiseElement>)}
                            className="w-full"
                            min="0"
                            max="1"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="bg-surface p-4 rounded-lg space-y-4">
                        <h3 className="text-accent font-medium">Envelope (ADSR)</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <label className="space-y-1">
                            <span className="text-sm text-gray-400">Attack</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as NoiseElement).envelope?.attack || 0.01}
                              onChange={(e) => {
                                const noise = currentLayer.sound as NoiseElement
                                updateLayerSound(currentLayer.id, {
                                  envelope: {
                                    ...(noise.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }),
                                    attack: parseFloat(e.target.value) || 0.01
                                  }
                                } as Partial<NoiseElement>)
                              }}
                              className="w-full px-2 py-1 bg-background rounded border border-primary/20"
                              min="0"
                              max="1"
                              step="0.01"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-sm text-gray-400">Decay</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as NoiseElement).envelope?.decay || 0.1}
                              onChange={(e) => {
                                const noise = currentLayer.sound as NoiseElement
                                updateLayerSound(currentLayer.id, {
                                  envelope: {
                                    ...(noise.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }),
                                    decay: parseFloat(e.target.value) || 0.1
                                  }
                                } as Partial<NoiseElement>)
                              }}
                              className="w-full px-2 py-1 bg-background rounded border border-primary/20"
                              min="0"
                              max="1"
                              step="0.01"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-sm text-gray-400">Sustain</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as NoiseElement).envelope?.sustain || 0.7}
                              onChange={(e) => {
                                const noise = currentLayer.sound as NoiseElement
                                updateLayerSound(currentLayer.id, {
                                  envelope: {
                                    ...(noise.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }),
                                    sustain: parseFloat(e.target.value) || 0.7
                                  }
                                } as Partial<NoiseElement>)
                              }}
                              className="w-full px-2 py-1 bg-background rounded border border-primary/20"
                              min="0"
                              max="1"
                              step="0.01"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-sm text-gray-400">Release</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as NoiseElement).envelope?.release || 0.2}
                              onChange={(e) => {
                                const noise = currentLayer.sound as NoiseElement
                                updateLayerSound(currentLayer.id, {
                                  envelope: {
                                    ...(noise.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }),
                                    release: parseFloat(e.target.value) || 0.2
                                  }
                                } as Partial<NoiseElement>)
                              }}
                              className="w-full px-2 py-1 bg-background rounded border border-primary/20"
                              min="0"
                              max="1"
                              step="0.01"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="bg-surface p-4 rounded-lg space-y-4">
                        <h3 className="text-accent font-medium">Repeat</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Count</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as NoiseElement).repeat || 1}
                              onChange={(e) => updateLayerSound(currentLayer.id, { repeat: parseInt(e.target.value) || 1 } as Partial<NoiseElement>)}
                              className="w-24 px-2 py-1 bg-background rounded border border-primary/20 text-right"
                              min="1"
                              max="100"
                            />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Interval (s)</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as NoiseElement).repeatInterval || 0}
                              onChange={(e) => updateLayerSound(currentLayer.id, { repeatInterval: parseFloat(e.target.value) || 0 } as Partial<NoiseElement>)}
                              className="w-24 px-2 py-1 bg-background rounded border border-primary/20 text-right"
                              min="0"
                              max="10"
                              step="0.01"
                            />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Delay (s)</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as NoiseElement).repeatDelay || 0}
                              onChange={(e) => updateLayerSound(currentLayer.id, { repeatDelay: parseFloat(e.target.value) || 0 } as Partial<NoiseElement>)}
                              className="w-24 px-2 py-1 bg-background rounded border border-primary/20 text-right"
                              min="0"
                              max="10"
                              step="0.01"
                            />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Decay</span>
                            <input
                              type="number"
                              value={(currentLayer.sound as NoiseElement).repeatDecay || 0}
                              onChange={(e) => updateLayerSound(currentLayer.id, { repeatDecay: parseFloat(e.target.value) || 0 } as Partial<NoiseElement>)}
                              className="w-24 px-2 py-1 bg-background rounded border border-primary/20 text-right"
                              min="0"
                              max="1"
                              step="0.01"
                            />
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center mt-8">Select a layer to edit its parameters</p>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-96 bg-background flex flex-col">
            <div className="bg-surface px-4 py-3 border-b border-primary/10">
              <h2 className="text-primary font-semibold">XML Output</h2>
            </div>

            <textarea
              value={xmlOutput}
              readOnly
              className="flex-1 bg-surface text-accent p-4 m-4 rounded-lg border border-primary/10 font-mono text-sm resize-none"
            />

            <div className="p-4 flex gap-2">
              <button
                onClick={playSound}
                disabled={isPlaying || layers.length === 0}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play Sound
              </button>
              <button
                onClick={stopSound}
                disabled={!isPlaying}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-surface disabled:text-gray-500 disabled:border disabled:border-gray-500 disabled:cursor-not-allowed rounded-md font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h12v12H6z"/>
                </svg>
                Stop
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-primary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-surface border-b border-primary/20 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">Import SPA File</h2>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportText('')
                }}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* File Upload Option */}
              <div className="space-y-3">
                <h3 className="text-primary font-semibold">Option 1: Load from file</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".spa,.xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-surface border-2 border-dashed border-primary/40 rounded-lg hover:border-primary transition-colors text-center"
                >
                  Click to select a .spa file
                </button>
              </div>

              {/* Text Input Option */}
              <div className="space-y-3">
                <h3 className="text-primary font-semibold">Option 2: Paste SPA XML</h3>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste your SPA XML here..."
                  className="w-full h-64 bg-surface text-white p-4 rounded-lg border border-primary/20 font-mono text-sm"
                />
                <button
                  onClick={importFromText}
                  disabled={!importText.trim()}
                  className="w-full py-3 bg-primary hover:bg-primary/80 disabled:bg-surface disabled:text-gray-500 rounded-lg font-semibold transition-colors"
                >
                  Import from Text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}