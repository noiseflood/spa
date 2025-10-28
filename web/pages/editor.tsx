import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import {
  parseSPA,
  playSPA,
  type SPASound,
  type ToneElement,
  type NoiseElement,
  type GroupElement,
  type SequenceElement,
  type AutomationCurve
} from '@spa-audio/core'
import { getPresetCategories, loadPreset as loadPresetFile, getPresetPath } from '../utils/presetLoader'
import { useSound } from '../contexts/SoundContext'

// Editor-specific types for UI state
interface EditorLayer {
  id: number
  sound: SPASound
}

export default function Editor() {
  const [layers, setLayers] = useState<EditorLayer[]>([])
  const [currentLayerId, setCurrentLayerId] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const { playSound: playSoundEffect } = useSound()
  const [xmlOutput, setXmlOutput] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [showAddLayerMenu, setShowAddLayerMenu] = useState(false)
  const [importText, setImportText] = useState('')
  const [showPresets, setShowPresets] = useState(true)
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
        },
        repeat: 1,
        repeatInterval: 0,
        repeatDelay: 0,
        repeatDecay: 0,
        repeatPitchShift: 0
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
        },
        repeat: 1,
        repeatInterval: 0,
        repeatDelay: 0,
        repeatDecay: 0
      } as NoiseElement
    }
  }

  const addLayer = (type: 'tone' | 'noise' = 'tone') => {
    if (isPlaying) {
      stopSound()
    }

    const newLayer: EditorLayer = {
      id: layerIdCounterRef.current++,
      sound: getDefaultSound(type)
    }

    setLayers([...layers, newLayer])
    setCurrentLayerId(newLayer.id)
    setShowAddLayerMenu(false)
  }

  const removeLayer = (id: number) => {
    if (isPlaying) {
      stopSound()
    }

    setLayers(layers.filter(l => l.id !== id))

    if (currentLayerId === id) {
      const remaining = layers.filter(l => l.id !== id)
      setCurrentLayerId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const _updateLayer = (id: number, updates: Partial<EditorLayer>) => {
    setLayers(layers.map(l =>
      l.id === id ? { ...l, ...updates } : l
    ))
  }

  const updateLayerSound = (id: number, soundUpdates: Partial<SPASound>) => {
    setLayers(layers.map(l =>
      l.id === id ? { ...l, sound: { ...l.sound, ...soundUpdates } as SPASound } : l
    ))
  }

  const updateXMLOutput = () => {
    if (layers.length === 0) {
      setXmlOutput(`<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <!-- Add layers to create your sound -->
</spa>`)
      return
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<spa xmlns="https://spa.audio/ns" version="1.0">\n'

    // Check if any layer has an 'at' parameter to determine if we need a sequence
    const hasTimingInfo = layers.some(layer => (layer.sound as any).at && (layer.sound as any).at > 0)

    if (layers.length > 1) {
      if (hasTimingInfo) {
        // Use sequence for timed layers
        xml += '  <sequence>\n'
        layers.forEach(layer => {
          xml += '    ' + soundToXML(layer.sound) + '\n'
        })
        xml += '  </sequence>\n'
      } else {
        // Use group for simultaneous layers
        xml += '  <group>\n'
        layers.forEach(layer => {
          xml += '    ' + soundToXML(layer.sound) + '\n'
        })
        xml += '  </group>\n'
      }
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

      if (typeof tone.freq === 'object' && 'start' in tone.freq) {
        const freq = tone.freq as AutomationCurve
        xml += ` freq.start="${freq.start}" freq.end="${freq.end}" freq.curve="${freq.curve}"`
      } else {
        xml += ` freq="${tone.freq}"`
      }

      xml += ` dur="${tone.dur}"`

      // Add 'at' attribute if present
      if ((tone as any).at !== undefined && (tone as any).at !== 0) {
        xml += ` at="${(tone as any).at}"`
      }

      if (typeof tone.amp === 'object' && 'start' in tone.amp) {
        const amp = tone.amp as AutomationCurve
        xml += ` amp.start="${amp.start}" amp.end="${amp.end}" amp.curve="${amp.curve}"`
      } else if (tone.amp !== undefined && tone.amp !== 1) {
        xml += ` amp="${tone.amp}"`
      }

      if (tone.pan !== undefined && tone.pan !== 0) {
        xml += ` pan="${tone.pan}"`
      }

      if (tone.filter && typeof tone.filter === 'object') {
        xml += ` filter="${tone.filter.type}" cutoff="${tone.filter.cutoff}"`
        if (tone.filter.resonance !== undefined && tone.filter.resonance !== 1) {
          xml += ` resonance="${tone.filter.resonance}"`
        }
      }

      if (tone.envelope && typeof tone.envelope === 'object') {
        const env = tone.envelope
        xml += ` envelope="${env.attack},${env.decay},${env.sustain},${env.release}"`
      }

      if (tone.repeat !== undefined && tone.repeat !== 1 && tone.repeatInterval !== undefined && tone.repeatInterval !== 0) {
        xml += ` repeat="${tone.repeat}" repeat.interval="${tone.repeatInterval}"`
        if (tone.repeatDelay && tone.repeatDelay !== 0) xml += ` repeat.delay="${tone.repeatDelay}"`
        if (tone.repeatDecay && tone.repeatDecay !== 0) xml += ` repeat.decay="${tone.repeatDecay}"`
        if (tone.repeatPitchShift && tone.repeatPitchShift !== 0) xml += ` repeat.pitchShift="${tone.repeatPitchShift}"`
      }

      xml += '/>'
    } else if (sound.type === 'noise') {
      const noise = sound as NoiseElement
      xml += `noise color="${noise.color}" dur="${noise.dur}"`

      // Add 'at' attribute if present
      if ((noise as any).at !== undefined && (noise as any).at !== 0) {
        xml += ` at="${(noise as any).at}"`
      }

      if (noise.amp !== undefined && noise.amp !== 1) {
        xml += ` amp="${noise.amp}"`
      }

      if (noise.pan !== undefined && noise.pan !== 0) {
        xml += ` pan="${noise.pan}"`
      }

      if (noise.filter && typeof noise.filter === 'object') {
        xml += ` filter="${noise.filter.type}" cutoff="${noise.filter.cutoff}"`
        if (noise.filter.resonance !== undefined && noise.filter.resonance !== 1) {
          xml += ` resonance="${noise.filter.resonance}"`
        }
      }

      if (noise.envelope && typeof noise.envelope === 'object') {
        const env = noise.envelope
        xml += ` envelope="${env.attack},${env.decay},${env.sustain},${env.release}"`
      }

      if (noise.repeat !== undefined && noise.repeat !== 1 && noise.repeatInterval !== undefined && noise.repeatInterval !== 0) {
        xml += ` repeat="${noise.repeat}" repeat.interval="${noise.repeatInterval}"`
        if (noise.repeatDelay && noise.repeatDelay !== 0) xml += ` repeat.delay="${noise.repeatDelay}"`
        if (noise.repeatDecay && noise.repeatDecay !== 0) xml += ` repeat.decay="${noise.repeatDecay}"`
      }

      xml += '/>'
    } else {
      console.error('Unexpected sound type in soundToXML:', sound.type)
      xml = '<!-- Unknown sound type -->'
    }

    return xml
  }

  const playSound = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    if (isPlaying) {
      stopSound()
      return
    }

    setIsPlaying(true)

    try {
      currentPlaybackRef.current = playSPA(xmlOutput)
      await currentPlaybackRef.current
    } catch (error) {
      console.error('Error playing sound:', error)
      console.error('XML that caused error:', xmlOutput)
    } finally {
      setIsPlaying(false)
      currentPlaybackRef.current = null
    }
  }

  const stopSound = () => {
    setIsPlaying(false)
    currentPlaybackRef.current = null
  }

  const importFromText = () => {
    try {
      const doc = parseSPA(importText)

      const editorLayers: EditorLayer[] = []
      let layerId = 0

      doc.sounds.forEach((sound: SPASound) => {
        if (sound.type === 'group') {
          const group = sound as GroupElement
          group.sounds?.forEach((groupSound: SPASound) => {
            editorLayers.push({
              id: layerId++,
              sound: normalizeSound(groupSound)
            })
          })
        } else if (sound.type === 'sequence') {
          const sequence = sound as SequenceElement
          sequence.elements?.forEach((timedSound: any) => {
            // Add the 'at' timing to the sound object for the editor
            const soundWithTiming = { ...timedSound.sound, at: timedSound.at }
            editorLayers.push({
              id: layerId++,
              sound: normalizeSound(soundWithTiming)
            })
          })
        } else {
          editorLayers.push({
            id: layerId++,
            sound: normalizeSound(sound)
          })
        }
      })

      if (editorLayers.length > 0) {
        if (isPlaying) {
          stopSound()
        }
        setLayers(editorLayers)
        layerIdCounterRef.current = layerId
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

        const editorLayers: EditorLayer[] = []
        let layerId = 0

        doc.sounds.forEach((sound: SPASound) => {
          if (sound.type === 'group') {
            const group = sound as GroupElement
            group.sounds?.forEach((groupSound: SPASound) => {
              editorLayers.push({
                id: layerId++,
                sound: normalizeSound(groupSound)
              })
            })
          } else {
            editorLayers.push({
              id: layerId++,
              sound: normalizeSound(sound)
            })
          }
        })

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

  const normalizeSound = (sound: SPASound): SPASound => {
    if (sound.type === 'tone') {
      return {
        ...sound,
        repeat: sound.repeat ?? (sound.repeatInterval ? 1 : undefined),
        repeatInterval: sound.repeatInterval,
        repeatDelay: sound.repeatDelay,
        repeatDecay: sound.repeatDecay,
        repeatPitchShift: sound.repeatPitchShift
      } as ToneElement
    } else if (sound.type === 'noise') {
      return {
        ...sound,
        repeat: sound.repeat ?? (sound.repeatInterval ? 1 : undefined),
        repeatInterval: sound.repeatInterval,
        repeatDelay: sound.repeatDelay,
        repeatDecay: sound.repeatDecay
      } as NoiseElement
    } else if (sound.type === 'group') {
      const group = sound as GroupElement
      return {
        ...group,
        sounds: group.sounds?.map(normalizeSound) || []
      } as GroupElement
    }
    return sound
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

        const editorLayers: EditorLayer[] = []
        let layerId = 0

        doc.sounds.forEach((sound: SPASound) => {
          if (sound.type === 'group') {
            const group = sound as GroupElement
            group.sounds?.forEach((groupSound: SPASound) => {
              editorLayers.push({
                id: layerId++,
                sound: normalizeSound(groupSound)
              })
            })
          } else if (sound.type === 'sequence') {
            const sequence = sound as SequenceElement
            sequence.elements?.forEach((timedSound: any) => {
              // Add the 'at' timing to the sound object for the editor
              const soundWithTiming = { ...timedSound.sound, at: timedSound.at }
              editorLayers.push({
                id: layerId++,
                sound: normalizeSound(soundWithTiming)
              })
            })
          } else {
            editorLayers.push({
              id: layerId++,
              sound: normalizeSound(sound)
            })
          }
        })

        if (editorLayers.length > 0) {
          layerIdCounterRef.current = layerId
          setLayers(editorLayers)
          setCurrentLayerId(editorLayers[0].id)
        }
      } catch (error) {
        console.error(`Failed to load preset ${preset}:`, error)
        alert(`Failed to load preset: ${error}`)
      }
    } else {
      alert(`Preset not found: ${preset}`)
    }
  }

  const currentLayer = layers.find(l => l.id === currentLayerId)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const activeElement = document.activeElement as HTMLElement
        if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
          return
        }
        e.preventDefault()
        if (layers.length > 0) {
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
      <header className="bg-surface border-b border-primary/20 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
              onClick={() => playSoundEffect('ui-feedback/button-click')}
              className="text-sm text-gray-400 hover:text-white"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SPA Sound Editor
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
              onClick={() => {
                playSoundEffect('ui-feedback/button-click')
                setShowImportModal(true)
              }}
              className="px-3 py-1.5 text-sm bg-surface border border-primary/30 hover:bg-primary/10 rounded transition-colors"
            >
              Import
            </button>
            <button
              onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
              onClick={() => {
                playSoundEffect('ui-feedback/button-click')
                const blob = new Blob([xmlOutput], { type: 'text/xml' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'sound.spa'
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="px-3 py-1.5 text-sm bg-surface border border-primary/30 hover:bg-primary/10 rounded transition-colors"
            >
              Export
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Presets Sidebar */}
        {showPresets && (
          <div className="w-64 bg-surface border-r border-primary/10 overflow-y-auto flex-shrink-0">
            <div className="sticky top-0 bg-surface p-3 border-b border-primary/10 flex items-center justify-between">
              <h2 className="text-primary font-semibold">Presets</h2>
              <button
                onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
                onClick={() => {
                  playSoundEffect('ui-feedback/button-click')
                  setShowPresets(false)
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-3">
              {Object.entries(presetCategories).map(([category, presets]) => (
                <div key={category} className="mb-3">
                  <button
                    onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
                    onClick={() => {
                      playSoundEffect('ui-feedback/tab-switch')
                      setExpandedCategory(expandedCategory === category ? null : category)
                    }}
                    className="w-full flex items-center justify-between p-2 bg-background rounded hover:bg-primary/10 transition-colors"
                  >
                    <span className="text-sm font-medium text-primary">{category}</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${expandedCategory === category ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {expandedCategory === category && (
                    <div className="space-y-0.5 ml-2 mt-1">
                      {Object.keys(presets).map((presetName) => (
                        <button
                          key={presetName}
                          onMouseEnter={() => playSoundEffect('ui-feedback/hover')}
                          onClick={() => {
                            playSoundEffect('ui-feedback/button-click')
                            loadPreset(category, presetName)
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs text-gray-300 hover:bg-primary/20 hover:text-white rounded transition-colors truncate"
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

        {/* Main Content: Synth-style Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Synth Controls */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar: Layers + Waveform */}
            <div className="bg-surface border-b border-primary/10 p-4 flex gap-4">
              {/* Left: Layer Selection */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-primary font-semibold text-xs uppercase tracking-wider">Layers</h3>
                  <div className="relative">
                    <button
                      onClick={() => setShowAddLayerMenu(!showAddLayerMenu)}
                      className="px-2 py-1 text-xs bg-primary hover:bg-primary/80 rounded transition-colors"
                    >
                      + Add
                    </button>
                    {showAddLayerMenu && (
                      <div className="absolute right-0 mt-1 bg-surface border border-primary/20 rounded shadow-lg z-10">
                        <button
                          onClick={() => addLayer('tone')}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-primary/10 transition-colors"
                        >
                          Tone
                        </button>
                        <button
                          onClick={() => addLayer('noise')}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-primary/10 transition-colors"
                        >
                          Noise
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {layers.length === 0 ? (
                  <p className="text-gray-500 text-xs">No layers</p>
                ) : (
                  <div className="flex gap-2 overflow-x-auto">
                    {layers.map(layer => (
                      <div
                        key={layer.id}
                        className={`px-2 py-1 bg-background rounded cursor-pointer border transition-colors flex-shrink-0 ${
                          currentLayerId === layer.id
                            ? 'border-primary ring-1 ring-primary'
                            : 'border-transparent hover:border-primary/50'
                        }`}
                        onClick={() => setCurrentLayerId(layer.id)}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">
                            {layer.sound.type === 'tone'
                              ? `${(layer.sound as ToneElement).wave}`
                              : `${(layer.sound as NoiseElement).color}`
                            }
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeLayer(layer.id)
                            }}
                            className="text-red-500 hover:text-red-400 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Waveform Display */}
              <div className="w-96">
                <h3 className="text-primary font-semibold text-xs uppercase tracking-wider mb-2">Oscilloscope</h3>
                <div className="h-24 bg-black rounded border-2 border-primary/30 overflow-hidden relative">
                  {layers.length > 0 ? (
                    <svg width="100%" height="96" viewBox="0 0 1000 96" preserveAspectRatio="none" className="w-full h-full">
                      {(() => {
                        const maxTime = Math.max(1, ...layers.map(l => {
                          const s = l.sound
                          const at = (s as any).at || 0
                          const dur = (s.type === 'tone' || s.type === 'noise') ? s.dur : 1
                          return at + dur
                        }))

                        return layers.map((layer) => {
                          const isActive = layer.id === currentLayerId
                          const sound = layer.sound
                          const startTime = (sound as any).at || 0
                          const duration = (sound.type === 'tone' || sound.type === 'noise') ? sound.dur : 1

                          const startX = (startTime / maxTime) * 1000
                          const endX = ((startTime + duration) / maxTime) * 1000
                          const width = endX - startX
                          const samples = Math.max(50, Math.floor(width / 5))

                          const points: string[] = []
                          const centerY = 48

                          for (let i = 0; i <= samples; i++) {
                            const x = startX + (i / samples) * width
                            const progress = i / samples
                            let y = centerY

                            let amplitude = 22
                            if (sound.type === 'tone' || sound.type === 'noise') {
                              const envelope = sound.envelope
                              const env = typeof envelope === 'object' ? envelope : { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }
                              const amp = typeof sound.amp === 'number' ? sound.amp : 1

                              const attackEnd = env.attack / duration
                              const decayEnd = (env.attack + env.decay) / duration
                              const releaseStart = 1 - (env.release / duration)

                              let envValue = 1
                              if (progress < attackEnd) {
                                envValue = progress / attackEnd
                              } else if (progress < decayEnd) {
                                const decayProg = (progress - attackEnd) / (decayEnd - attackEnd)
                                envValue = 1 - (1 - env.sustain) * decayProg
                              } else if (progress < releaseStart) {
                                envValue = env.sustain
                              } else {
                                const releaseProg = (progress - releaseStart) / (1 - releaseStart)
                                envValue = env.sustain * (1 - releaseProg)
                              }

                              amplitude *= envValue * amp
                            }

                            if (sound.type === 'tone') {
                              const tone = sound as ToneElement
                              const freq = typeof tone.freq === 'number' ? tone.freq : 440
                              const cycles = (freq / 100) * progress * duration

                              if (tone.wave === 'sine') {
                                y = centerY + Math.sin(cycles * Math.PI * 2) * amplitude
                              } else if (tone.wave === 'square') {
                                y = centerY + (Math.sin(cycles * Math.PI * 2) > 0 ? amplitude : -amplitude)
                              } else if (tone.wave === 'saw') {
                                y = centerY + ((cycles % 1) * 2 - 1) * amplitude
                              } else if (tone.wave === 'triangle') {
                                const t = (cycles % 1) * 4
                                y = centerY + (t < 1 ? t : t < 3 ? 2 - t : t - 4) * amplitude
                              }
                            } else if (sound.type === 'noise') {
                              y = centerY + (Math.random() * 2 - 1) * amplitude
                            }

                            points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`)
                          }

                          const pathData = points.join(' ')

                          return (
                            <g key={layer.id} onClick={() => setCurrentLayerId(layer.id)} style={{ cursor: 'pointer' }}>
                              <path
                                d={pathData}
                                stroke={isActive ? '#22c55e' : 'rgba(34, 197, 94, 0.4)'}
                                strokeWidth={isActive ? 2 : 1}
                                fill="none"
                                style={{ filter: 'drop-shadow(0 0 3px currentColor)' }}
                              />
                            </g>
                          )
                        })
                      })()}
                      <line x1="0" y1="48" x2="1000" y2="48" stroke="rgba(34, 197, 94, 0.1)" strokeWidth="1" />
                      <line x1="0" y1="24" x2="1000" y2="24" stroke="rgba(34, 197, 94, 0.05)" strokeWidth="1" />
                      <line x1="0" y1="72" x2="1000" y2="72" stroke="rgba(34, 197, 94, 0.05)" strokeWidth="1" />
                    </svg>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-green-500/50 text-xs font-mono">NO SIGNAL</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Synth Control Panel */}
            <div className="flex-1 overflow-y-auto p-4 pb-24 bg-gradient-to-b from-background to-surface/30">
              {!showPresets && (
                <button
                  onClick={() => setShowPresets(true)}
                  className="mb-3 px-3 py-1.5 text-sm bg-surface border border-primary/30 hover:bg-primary/10 rounded transition-colors"
                >
                  Show Presets
                </button>
              )}
              {currentLayer ? (
                <div className="max-w-6xl">
                  {currentLayer.sound.type === 'tone' ? (
                    <ToneParameters layer={currentLayer} updateLayerSound={updateLayerSound} />
                  ) : (
                    <NoiseParameters layer={currentLayer} updateLayerSound={updateLayerSound} />
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center mt-8">Select a layer to edit</p>
              )}
            </div>
          </div>

          {/* Right: XML Code Sidebar */}
          <div className="w-80 bg-surface border-l border-primary/10 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-primary/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-primary font-semibold text-xs uppercase tracking-wider">SPA Code</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(xmlOutput)
                  }}
                  className="px-3 py-1.5 bg-primary hover:bg-primary/80 rounded text-xs font-medium transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="bg-background text-accent p-3 rounded-lg font-mono text-xs border border-primary/10 whitespace-pre-wrap break-words">
                {xmlOutput}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Play Button - Sticky at bottom */}
      <button
        onClick={playSound}
        disabled={layers.length === 0}
        className={`fixed bottom-0 right-0 left-0 md:left-auto md:bottom-6 md:right-6 md:rounded-lg shadow-2xl transition-all z-50 ${
          isPlaying
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-green-600 hover:bg-green-700'
        } disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-4`}
      >
        <div className="flex items-center gap-3">
          {isPlaying ? (
            <>
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="white">
                <path d="M6 6h12v12H6z"/>
              </svg>
              <div className="text-left">
                <div className="text-white font-bold text-lg">STOP</div>
                <div className="text-white/70 text-xs">Spacebar</div>
              </div>
            </>
          ) : (
            <>
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <div className="text-left">
                <div className="text-white font-bold text-lg">PLAY</div>
                <div className="text-white/70 text-xs">Spacebar</div>
              </div>
            </>
          )}
        </div>
      </button>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-primary rounded-lg max-w-2xl w-full">
            <div className="bg-surface border-b border-primary/20 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">Import SPA File</h2>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportText('')
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <h3 className="text-primary font-semibold">Load from file</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".spa,.xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-surface border-2 border-dashed border-primary/40 rounded-lg hover:border-primary transition-colors"
                >
                  Click to select a .spa file
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-primary font-semibold">Paste SPA XML</h3>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste your SPA XML here..."
                  className="w-full h-48 bg-surface text-white p-4 rounded-lg border border-primary/20 font-mono text-sm"
                />
                <button
                  onClick={importFromText}
                  disabled={!importText.trim()}
                  className="w-full py-3 bg-primary hover:bg-primary/80 disabled:bg-surface disabled:text-gray-500 rounded-lg font-semibold transition-colors"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Knob Component
function Knob({ label, value, onChange, min = 0, max = 1, step = 0.01, displayValue }: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  displayValue?: string
}) {
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  const startValue = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    startY.current = e.clientY
    startValue.current = value
    e.preventDefault()
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY.current - e.clientY
      const range = max - min
      const sensitivity = range / 150
      const newValue = Math.max(min, Math.min(max, startValue.current + deltaY * sensitivity))
      onChange(parseFloat(newValue.toFixed(4)))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, min, max, onChange])

  const rotation = ((value - min) / (max - min)) * 270 - 135

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 cursor-ns-resize shadow-lg"
        onMouseDown={handleMouseDown}
        style={{
          boxShadow: isDragging ? 'inset 0 2px 8px rgba(0,0,0,0.5), 0 0 0 2px rgba(124, 58, 237, 0.5)' : 'inset 0 2px 8px rgba(0,0,0,0.5)',
          userSelect: 'none'
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className="w-1 h-5 bg-primary rounded-full shadow-lg" style={{ marginTop: '-10px' }} />
        </div>
      </div>
      <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-xs text-primary font-mono">{displayValue || value.toFixed(2)}</span>
    </div>
  )
}

// Slider Component
function Slider({ label, value, onChange, min = 0, max = 1, step = 0.01, displayValue }: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  displayValue?: string
}) {
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  const startValue = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    startY.current = e.clientY
    startValue.current = value
    e.preventDefault()
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY.current - e.clientY
      const range = max - min
      const sensitivity = range / 150
      const newValue = Math.max(min, Math.min(max, startValue.current + deltaY * sensitivity))
      onChange(parseFloat(newValue.toFixed(4)))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, min, max, onChange])

  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative w-8 h-24 bg-gradient-to-r from-gray-800 to-gray-900 border-2 border-gray-700 rounded cursor-ns-resize shadow-inner"
        onMouseDown={handleMouseDown}
        style={{ userSelect: 'none' }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 bg-primary/30 rounded transition-all"
          style={{ height: `${percentage}%` }}
        />
        <div
          className="absolute left-0 right-0 h-3 bg-gradient-to-b from-gray-300 to-gray-500 border border-gray-600 rounded shadow-md"
          style={{
            bottom: `calc(${percentage}% - 6px)`,
            boxShadow: isDragging ? '0 0 0 2px rgba(124, 58, 237, 0.5), 0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.3)'
          }}
        />
      </div>
      <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-xs text-primary font-mono">{displayValue || value.toFixed(2)}</span>
    </div>
  )
}

// Tone Parameters Component
function ToneParameters({ layer, updateLayerSound }: {
  layer: EditorLayer
  updateLayerSound: (id: number, updates: Partial<SPASound>) => void
}) {
  const tone = layer.sound as ToneElement

  const isFreqModulated = typeof tone.freq === 'object' && tone.freq !== null && 'start' in tone.freq
  const freq = typeof tone.freq === 'number' ? tone.freq : 440
  const freqMod = isFreqModulated ? (tone.freq as AutomationCurve) : { start: 440, end: 880, curve: 'linear' as const }
  const amp = typeof tone.amp === 'number' ? tone.amp : 1
  const env = typeof tone.envelope === 'object' ? tone.envelope : { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }
  const filter = typeof tone.filter === 'object' ? tone.filter : undefined
  const repeat = typeof tone.repeat === 'number' ? tone.repeat : 1

  return (
    <div className="bg-gradient-to-br from-surface to-background border-2 border-primary/20 rounded-lg p-6 shadow-xl">
      {/* Top Row: Oscillator + Filter */}
      <div className="flex gap-12 mb-8 pb-8 border-b border-primary/20">
        {/* Oscillator */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <h3 className="text-primary font-bold text-xs uppercase tracking-widest mb-2">Oscillator</h3>
            <div className="flex gap-1.5">
              {[
                { wave: 'sine', path: 'M2,12 Q8,2 14,12 T26,12' },
                { wave: 'square', path: 'M2,12 L2,4 L10,4 L10,20 L18,20 L18,4 L26,4 L26,12' },
                { wave: 'saw', path: 'M2,20 L8,4 L8,20 L14,4 L14,20 L20,4 L20,20 L26,4' },
                { wave: 'triangle', path: 'M2,20 L8,4 L14,20 L20,4 L26,20' }
              ].map(({ wave, path }) => (
                <button
                  key={wave}
                  onClick={() => updateLayerSound(layer.id, { wave } as Partial<ToneElement>)}
                  className={`w-8 h-8 rounded transition-all flex items-center justify-center ${
                    tone.wave === wave
                      ? 'bg-primary shadow-lg shadow-primary/50'
                      : 'bg-gray-800 border border-gray-700 hover:border-primary/50'
                  }`}
                  title={wave}
                >
                  <svg width="28" height="24" viewBox="0 0 28 24" className="opacity-90">
                    <path
                      d={path}
                      stroke={tone.wave === wave ? 'white' : 'rgb(156, 163, 175)'}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                if (isFreqModulated) {
                  // Switch to simple freq
                  updateLayerSound(layer.id, { freq: freqMod.start } as Partial<ToneElement>)
                } else {
                  // Switch to freq modulation
                  updateLayerSound(layer.id, { freq: { start: freq, end: freq * 2, curve: 'linear' } } as Partial<ToneElement>)
                }
              }}
              className={`ml-2 px-2 py-1 text-xs rounded transition-all ${
                isFreqModulated
                  ? 'bg-secondary text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-primary/50'
              }`}
              title="Toggle frequency modulation"
            >
              {isFreqModulated ? '↗' : '→'}
            </button>
          </div>

          {!isFreqModulated ? (
            <div className="flex gap-6 w-full">
              <Knob
                label="Freq"
                value={freq}
                onChange={(v) => updateLayerSound(layer.id, { freq: v } as Partial<ToneElement>)}
                min={20}
                max={2000}
                displayValue={`${Math.round(freq)}Hz`}
              />
              <Knob
                label="Amp"
                value={amp}
                onChange={(v) => updateLayerSound(layer.id, { amp: v } as Partial<ToneElement>)}
                min={0}
                max={1}
              />
              <Knob
                label="Dur"
                value={tone.dur || 0.5}
                onChange={(v) => updateLayerSound(layer.id, { dur: v } as Partial<ToneElement>)}
                min={0.01}
                max={5}
                displayValue={`${(tone.dur || 0.5).toFixed(2)}s`}
              />
              <Knob
                label="Start"
                value={(tone as any).at || 0}
                onChange={(v) => updateLayerSound(layer.id, { at: v } as any)}
                min={0}
                max={10}
                displayValue={`${((tone as any).at || 0).toFixed(2)}s`}
              />
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-2">
                {['linear', 'exp', 'log', 'smooth', 'step'].map(curve => (
                  <button
                    key={curve}
                    onClick={() => updateLayerSound(layer.id, {
                      freq: { ...freqMod, curve: curve as any }
                    } as Partial<ToneElement>)}
                    className={`px-2 py-1 text-xs uppercase tracking-wide rounded transition-all ${
                      freqMod.curve === curve
                        ? 'bg-secondary text-white shadow-lg shadow-secondary/50'
                        : 'bg-gray-800 border border-gray-700 hover:border-secondary/50 text-gray-300'
                    }`}
                  >
                    {curve}
                  </button>
                ))}
              </div>
              <div className="flex gap-6 w-full">
                <Knob
                  label="F.Start"
                  value={freqMod.start}
                  onChange={(v) => updateLayerSound(layer.id, {
                    freq: { ...freqMod, start: v }
                  } as Partial<ToneElement>)}
                  min={20}
                  max={2000}
                  displayValue={`${Math.round(freqMod.start)}Hz`}
                />
                <Knob
                  label="F.End"
                  value={freqMod.end}
                  onChange={(v) => updateLayerSound(layer.id, {
                    freq: { ...freqMod, end: v }
                  } as Partial<ToneElement>)}
                  min={20}
                  max={2000}
                  displayValue={`${Math.round(freqMod.end)}Hz`}
                />
                <Knob
                  label="Amp"
                  value={amp}
                  onChange={(v) => updateLayerSound(layer.id, { amp: v } as Partial<ToneElement>)}
                  min={0}
                  max={1}
                />
                <Knob
                  label="Dur"
                  value={tone.dur || 0.5}
                  onChange={(v) => updateLayerSound(layer.id, { dur: v } as Partial<ToneElement>)}
                  min={0.01}
                  max={5}
                  displayValue={`${(tone.dur || 0.5).toFixed(2)}s`}
                />
                <Knob
                  label="Start"
                  value={(tone as any).at || 0}
                  onChange={(v) => updateLayerSound(layer.id, { at: v } as any)}
                  min={0}
                  max={10}
                  displayValue={`${((tone as any).at || 0).toFixed(2)}s`}
                />
              </div>
            </>
          )}
        </div>

        {/* Filter */}
        <div className="flex flex-col gap-6 items-end">
          <div className="flex gap-3 items-center">
            <h3 className="text-primary font-bold text-xs uppercase tracking-widest mb-2">Filter</h3>
            <div className="flex gap-1.5">
              {['none', 'lowpass', 'highpass', 'bandpass'].map(type => (
                <button
                  key={type}
                  onClick={() => {
                    if (type === 'none') {
                      updateLayerSound(layer.id, { filter: undefined } as Partial<ToneElement>)
                    } else {
                      updateLayerSound(layer.id, {
                        filter: {
                          type: type as 'lowpass' | 'highpass' | 'bandpass',
                          cutoff: filter?.cutoff || 1000,
                          resonance: filter?.resonance || 1
                        }
                      } as Partial<ToneElement>)
                    }
                  }}
                  className={`px-3 py-1 text-xs uppercase tracking-wide rounded transition-all ${
                    (filter?.type || 'none') === type
                      ? 'bg-primary text-white shadow-lg shadow-primary/50'
                      : 'bg-gray-800 border border-gray-700 hover:border-primary/50 text-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className={`flex gap-6 w-full ${!filter ? 'opacity-40 pointer-events-none' : ''}`}>
            <Knob
              label="Cutoff"
              value={typeof filter?.cutoff === 'number' ? filter.cutoff : 1000}
              onChange={(v) => {
                if (filter) {
                  updateLayerSound(layer.id, {
                    filter: { ...filter, cutoff: v }
                  } as Partial<ToneElement>)
                }
              }}
              min={20}
              max={20000}
              displayValue={`${Math.round(typeof filter?.cutoff === 'number' ? filter.cutoff : 1000)}Hz`}
            />
            <Knob
              label="Res"
              value={typeof filter?.resonance === 'number' ? filter.resonance : 1}
              onChange={(v) => {
                if (filter) {
                  updateLayerSound(layer.id, {
                    filter: { ...filter, resonance: v }
                  } as Partial<ToneElement>)
                }
              }}
              min={0.1}
              max={30}
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Envelope + Repeat */}
      <div className="flex gap-12">
        {/* Envelope */}
        <div>
          <h3 className="text-primary font-bold text-xs uppercase tracking-widest mb-3">Envelope</h3>
          <div className="flex gap-6">
            <Slider
              label="Attack"
              value={env.attack}
              onChange={(v) => updateLayerSound(layer.id, {
                envelope: { ...env, attack: v }
              } as Partial<ToneElement>)}
              min={0}
              max={2}
              displayValue={`${env.attack.toFixed(3)}s`}
            />
            <Slider
              label="Decay"
              value={env.decay}
              onChange={(v) => updateLayerSound(layer.id, {
                envelope: { ...env, decay: v }
              } as Partial<ToneElement>)}
              min={0}
              max={2}
              displayValue={`${env.decay.toFixed(3)}s`}
            />
            <Slider
              label="Sustain"
              value={env.sustain}
              onChange={(v) => updateLayerSound(layer.id, {
                envelope: { ...env, sustain: v }
              } as Partial<ToneElement>)}
              min={0}
              max={1}
            />
            <Slider
              label="Release"
              value={env.release}
              onChange={(v) => updateLayerSound(layer.id, {
                envelope: { ...env, release: v }
              } as Partial<ToneElement>)}
              min={0}
              max={2}
              displayValue={`${env.release.toFixed(3)}s`}
            />
          </div>
        </div>

        {/* Repeat */}
        <div>
          <h3 className="text-primary font-bold text-xs uppercase tracking-widest mb-3">Repeat</h3>
          <div className="flex gap-4">
            <Knob
              label="Count"
              value={repeat}
              onChange={(v) => updateLayerSound(layer.id, { repeat: Math.round(v) } as Partial<ToneElement>)}
              min={1}
              max={20}
              displayValue={`${Math.round(repeat)}`}
            />
            <Knob
              label="Interval"
              value={tone.repeatInterval ?? 0}
              onChange={(v) => updateLayerSound(layer.id, { repeatInterval: v } as Partial<ToneElement>)}
              min={0}
              max={2}
              displayValue={`${(tone.repeatInterval ?? 0).toFixed(2)}s`}
            />
            <Knob
              label="Delay"
              value={tone.repeatDelay ?? 0}
              onChange={(v) => updateLayerSound(layer.id, { repeatDelay: v } as Partial<ToneElement>)}
              min={0}
              max={2}
              displayValue={`${(tone.repeatDelay ?? 0).toFixed(2)}s`}
            />
            <Knob
              label="Decay"
              value={tone.repeatDecay ?? 0}
              onChange={(v) => updateLayerSound(layer.id, { repeatDecay: v } as Partial<ToneElement>)}
              min={0}
              max={1}
            />
            <Knob
              label="Pitch"
              value={tone.repeatPitchShift ?? 0}
              onChange={(v) => updateLayerSound(layer.id, { repeatPitchShift: v } as Partial<ToneElement>)}
              min={-12}
              max={12}
              displayValue={`${(tone.repeatPitchShift ?? 0).toFixed(1)}`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Noise Parameters Component
function NoiseParameters({ layer, updateLayerSound }: {
  layer: EditorLayer
  updateLayerSound: (id: number, updates: Partial<SPASound>) => void
}) {
  const noise = layer.sound as NoiseElement

  const amp = typeof noise.amp === 'number' ? noise.amp : 1
  const env = typeof noise.envelope === 'object' ? noise.envelope : { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }
  const filter = typeof noise.filter === 'object' ? noise.filter : undefined
  const repeat = typeof noise.repeat === 'number' ? noise.repeat : 1

  return (
    <div className="bg-gradient-to-br from-surface to-background border-2 border-primary/20 rounded-lg p-6 shadow-xl">
      {/* Top Row: Noise Generator + Filter */}
      <div className="flex gap-12 mb-8 pb-8 border-b border-primary/20">
        {/* Noise Generator */}
        <div className="flex gap-6 items-end">
          <div className="flex flex-col gap-1">
            <h3 className="text-primary font-bold text-xs uppercase tracking-widest mb-2">Noise Generator</h3>
            <div className="flex flex-col gap-1.5">
              {['white', 'pink', 'brown'].map(color => (
                <button
                  key={color}
                  onClick={() => updateLayerSound(layer.id, { color } as Partial<NoiseElement>)}
                  className={`px-3 py-1 text-xs uppercase tracking-wide rounded transition-all ${
                    noise.color === color
                      ? 'bg-primary text-white shadow-lg shadow-primary/50'
                      : 'bg-gray-800 border border-gray-700 hover:border-primary/50 text-gray-300'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
          <Knob
            label="Amp"
            value={amp}
            onChange={(v) => updateLayerSound(layer.id, { amp: v } as Partial<NoiseElement>)}
            min={0}
            max={1}
          />
          <Knob
            label="Dur"
            value={noise.dur || 0.5}
            onChange={(v) => updateLayerSound(layer.id, { dur: v } as Partial<NoiseElement>)}
            min={0.01}
            max={5}
            displayValue={`${(noise.dur || 0.5).toFixed(2)}s`}
          />
          <Knob
            label="Start"
            value={(noise as any).at || 0}
            onChange={(v) => updateLayerSound(layer.id, { at: v } as any)}
            min={0}
            max={10}
            displayValue={`${((noise as any).at || 0).toFixed(2)}s`}
          />
        </div>

        {/* Filter */}
        <div className="flex gap-6 items-end">
          <div className="flex flex-col gap-1">
            <h3 className="text-primary font-bold text-xs uppercase tracking-widest mb-2">Filter</h3>
            <div className="flex gap-1.5">
              {['none', 'lowpass', 'highpass', 'bandpass'].map(type => (
                <button
                  key={type}
                  onClick={() => {
                    if (type === 'none') {
                      updateLayerSound(layer.id, { filter: undefined } as Partial<NoiseElement>)
                    } else {
                      updateLayerSound(layer.id, {
                        filter: {
                          type: type as 'lowpass' | 'highpass' | 'bandpass',
                          cutoff: filter?.cutoff || 1000,
                          resonance: filter?.resonance || 1
                        }
                      } as Partial<NoiseElement>)
                    }
                  }}
                  className={`px-3 py-1 text-xs uppercase tracking-wide rounded transition-all ${
                    (filter?.type || 'none') === type
                      ? 'bg-primary text-white shadow-lg shadow-primary/50'
                      : 'bg-gray-800 border border-gray-700 hover:border-primary/50 text-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className={`flex gap-6 ${!filter ? 'opacity-40 pointer-events-none' : ''}`}>
            <Knob
              label="Cutoff"
              value={typeof filter?.cutoff === 'number' ? filter.cutoff : 1000}
              onChange={(v) => {
                if (filter) {
                  updateLayerSound(layer.id, {
                    filter: { ...filter, cutoff: v }
                  } as Partial<NoiseElement>)
                }
              }}
              min={20}
              max={20000}
              displayValue={`${Math.round(typeof filter?.cutoff === 'number' ? filter.cutoff : 1000)}Hz`}
            />
            <Knob
              label="Res"
              value={typeof filter?.resonance === 'number' ? filter.resonance : 1}
              onChange={(v) => {
                if (filter) {
                  updateLayerSound(layer.id, {
                    filter: { ...filter, resonance: v }
                  } as Partial<NoiseElement>)
                }
              }}
              min={0.1}
              max={30}
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Envelope + Repeat */}
      <div className="flex gap-12">
        {/* Envelope */}
        <div>
          <h3 className="text-primary font-bold text-xs uppercase tracking-widest mb-3">Envelope</h3>
          <div className="flex gap-6">
            <Slider
              label="Attack"
              value={env.attack}
              onChange={(v) => updateLayerSound(layer.id, {
                envelope: { ...env, attack: v }
              } as Partial<NoiseElement>)}
              min={0}
              max={2}
              displayValue={`${env.attack.toFixed(3)}s`}
            />
            <Slider
              label="Decay"
              value={env.decay}
              onChange={(v) => updateLayerSound(layer.id, {
                envelope: { ...env, decay: v }
              } as Partial<NoiseElement>)}
              min={0}
              max={2}
              displayValue={`${env.decay.toFixed(3)}s`}
            />
            <Slider
              label="Sustain"
              value={env.sustain}
              onChange={(v) => updateLayerSound(layer.id, {
                envelope: { ...env, sustain: v }
              } as Partial<NoiseElement>)}
              min={0}
              max={1}
            />
            <Slider
              label="Release"
              value={env.release}
              onChange={(v) => updateLayerSound(layer.id, {
                envelope: { ...env, release: v }
              } as Partial<NoiseElement>)}
              min={0}
              max={2}
              displayValue={`${env.release.toFixed(3)}s`}
            />
          </div>
        </div>

        {/* Repeat */}
        <div>
          <h3 className="text-primary font-bold text-xs uppercase tracking-widest mb-3">Repeat</h3>
          <div className="flex gap-4">
            <Knob
              label="Count"
              value={repeat}
              onChange={(v) => updateLayerSound(layer.id, { repeat: Math.round(v) } as Partial<NoiseElement>)}
              min={1}
              max={20}
              displayValue={`${Math.round(repeat)}`}
            />
            <Knob
              label="Interval"
              value={noise.repeatInterval || 0}
              onChange={(v) => updateLayerSound(layer.id, { repeatInterval: v } as Partial<NoiseElement>)}
              min={0}
              max={2}
              displayValue={`${(noise.repeatInterval || 0).toFixed(2)}s`}
            />
            <Knob
              label="Delay"
              value={noise.repeatDelay || 0}
              onChange={(v) => updateLayerSound(layer.id, { repeatDelay: v } as Partial<NoiseElement>)}
              min={0}
              max={2}
              displayValue={`${(noise.repeatDelay || 0).toFixed(2)}s`}
            />
            <Knob
              label="Decay"
              value={noise.repeatDecay || 0}
              onChange={(v) => updateLayerSound(layer.id, { repeatDecay: v } as Partial<NoiseElement>)}
              min={0}
              max={1}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
