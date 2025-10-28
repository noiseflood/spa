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
  const [showAddLayerMenu, setShowAddLayerMenu] = useState(false)
  const [importText, setImportText] = useState('')
  const [showPresets, setShowPresets] = useState(true)
  const [expandedCategory, setExpandedCategory] = useState<string | null>('UI Feedback')
  const [xmlExpanded, setXmlExpanded] = useState(false)
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

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<spa version="1.0">\n'

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

      if (tone.filter) {
        xml += ` filter="${tone.filter.type}" cutoff="${tone.filter.cutoff}"`
        if (tone.filter.resonance !== undefined && tone.filter.resonance !== 1) {
          xml += ` resonance="${tone.filter.resonance}"`
        }
      }

      if (tone.envelope) {
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

      if (noise.filter) {
        xml += ` filter="${noise.filter.type}" cutoff="${noise.filter.cutoff}"`
        if (noise.filter.resonance !== undefined && noise.filter.resonance !== 1) {
          xml += ` resonance="${noise.filter.resonance}"`
        }
      }

      if (noise.envelope) {
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

      doc.sounds.forEach(sound => {
        if (sound.type === 'group') {
          const group = sound as GroupElement
          group.sounds?.forEach(groupSound => {
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

        doc.sounds.forEach(sound => {
          if (sound.type === 'group') {
            const group = sound as GroupElement
            group.sounds?.forEach(groupSound => {
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

        doc.sounds.forEach(sound => {
          if (sound.type === 'group') {
            const group = sound as GroupElement
            group.sounds?.forEach(groupSound => {
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
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              ← Back
            </Link>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SPA Sound Editor
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-1.5 text-sm bg-surface border border-primary/30 hover:bg-primary/10 rounded transition-colors"
            >
              Import
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
                onClick={() => setShowPresets(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-3">
              {Object.entries(presetCategories).map(([category, presets]) => (
                <div key={category} className="mb-3">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
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
                          onClick={() => loadPreset(category, presetName)}
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

        {/* Layers & Parameters */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Layers Panel */}
          <div className="bg-surface border-b border-primary/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-primary font-semibold text-sm">Layers</h2>
              <div className="relative">
                <button
                  onClick={() => setShowAddLayerMenu(!showAddLayerMenu)}
                  className="px-3 py-1 text-sm bg-primary hover:bg-primary/80 rounded transition-colors"
                >
                  + Add Layer
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
              <p className="text-gray-500 text-xs">No layers yet</p>
            ) : (
              <div className="flex gap-2 overflow-x-auto">
                {layers.map(layer => (
                  <div
                    key={layer.id}
                    className={`px-3 py-1.5 bg-background rounded cursor-pointer border transition-colors flex-shrink-0 ${
                      currentLayerId === layer.id
                        ? 'border-primary ring-1 ring-primary'
                        : 'border-transparent hover:border-primary/50'
                    }`}
                    onClick={() => setCurrentLayerId(layer.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
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
                        className="text-red-500 hover:text-red-400 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Parameters Panel */}
          <div className="flex-1 overflow-y-auto p-4">
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
              <p className="text-gray-500 text-center mt-8">Select a layer to edit its parameters</p>
            )}
          </div>

          {/* Waveform Visualization */}
          <div className="bg-surface border-t border-primary/10 p-4">
            <h3 className="text-primary font-semibold text-sm mb-2">Waveform</h3>
            <div className="h-40 bg-background rounded-lg overflow-hidden relative">
              {layers.length > 0 ? (
                <svg width="100%" height="160" viewBox="0 0 1000 160" preserveAspectRatio="none" className="w-full h-full">
                  {(() => {
                    // Calculate total timeline
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

                      // Position on timeline
                      const startX = (startTime / maxTime) * 1000
                      const endX = ((startTime + duration) / maxTime) * 1000
                      const width = endX - startX
                      const samples = Math.max(50, Math.floor(width / 5))

                      // Generate waveform
                      const points: string[] = []
                      const centerY = 80

                      for (let i = 0; i <= samples; i++) {
                        const x = startX + (i / samples) * width
                        const progress = i / samples
                        let y = centerY

                        // Calculate amplitude with envelope
                        let amplitude = 35
                        if (sound.type === 'tone' || sound.type === 'noise') {
                          const envelope = sound.envelope
                          const env = typeof envelope === 'object' ? envelope : { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }
                          const amp = typeof sound.amp === 'number' ? sound.amp : 1

                          // ADSR envelope
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

                        // Generate wave shape
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
                          {isActive && (
                            <path
                              d={`${pathData} L ${endX} ${centerY} L ${startX} ${centerY} Z`}
                              fill="rgba(124, 58, 237, 0.15)"
                            />
                          )}
                          <path
                            d={pathData}
                            stroke={isActive ? 'rgb(124, 58, 237)' : 'rgba(124, 58, 237, 0.4)'}
                            strokeWidth={isActive ? 2 : 1}
                            fill="none"
                          />
                        </g>
                      )
                    })
                  })()}
                  <line x1="0" y1="80" x2="1000" y2="80" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                </svg>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Add layers to see waveform</p>
                </div>
              )}
            </div>
          </div>

          {/* XML Output Panel with bottom padding for play button */}
          <div className="bg-surface border-t border-primary/10 pb-28">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-primary font-semibold text-sm">SPA Code</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(xmlOutput)
                  }}
                  className="px-3 py-1.5 bg-primary hover:bg-primary/80 rounded text-xs font-medium transition-colors"
                >
                  Copy Code
                </button>
              </div>
              <div className="relative">
                <pre className="bg-background text-accent p-3 rounded-lg font-mono text-xs overflow-x-auto border border-primary/10">
                  {xmlExpanded ? xmlOutput : xmlOutput.split('\n').slice(0, 4).join('\n') + '\n  ...'}
                </pre>
                <button
                  onClick={() => setXmlExpanded(!xmlExpanded)}
                  className="absolute bottom-2 right-2 px-2 py-1 bg-surface hover:bg-primary/20 rounded text-xs text-primary border border-primary/30 transition-colors"
                >
                  {xmlExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>
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

// Tone Parameters Component
function ToneParameters({ layer, updateLayerSound }: {
  layer: EditorLayer
  updateLayerSound: (id: number, updates: Partial<SPASound>) => void
}) {
  const tone = layer.sound as ToneElement

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Waveform */}
      <div className="bg-surface p-3 rounded-lg">
        <h3 className="text-accent font-medium text-sm mb-2">Waveform</h3>
        <div className="grid grid-cols-2 gap-2">
          {['sine', 'square', 'saw', 'triangle'].map(wave => (
            <button
              key={wave}
              onClick={() => updateLayerSound(layer.id, { wave } as Partial<ToneElement>)}
              className={`px-2 py-1.5 text-xs rounded transition-colors ${
                tone.wave === wave
                  ? 'bg-primary text-white'
                  : 'bg-background border border-primary/20 hover:bg-primary/10'
              }`}
            >
              {wave === 'saw' ? 'sawtooth' : wave}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div className="bg-surface p-3 rounded-lg">
        <h3 className="text-accent font-medium text-sm mb-2">Frequency</h3>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Hz</span>
            <input
              type="number"
              value={typeof tone.freq === 'number' ? tone.freq : (tone.freq as AutomationCurve).start}
              onChange={(e) => updateLayerSound(layer.id, { freq: parseFloat(e.target.value) || 440 } as Partial<ToneElement>)}
              className="w-20 px-2 py-1 text-xs bg-background rounded border border-primary/20 text-right"
            />
          </div>
          <input
            type="range"
            value={typeof tone.freq === 'number' ? tone.freq : (tone.freq as AutomationCurve).start}
            onChange={(e) => updateLayerSound(layer.id, { freq: parseFloat(e.target.value) } as Partial<ToneElement>)}
            className="w-full"
            min="20"
            max="2000"
          />
        </div>
      </div>

      {/* Duration */}
      <div className="bg-surface p-3 rounded-lg">
        <h3 className="text-accent font-medium text-sm mb-2">Duration</h3>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Seconds</span>
            <span className="text-xs">{tone.dur.toFixed(2)}s</span>
          </div>
          <input
            type="range"
            value={tone.dur}
            onChange={(e) => updateLayerSound(layer.id, { dur: parseFloat(e.target.value) } as Partial<ToneElement>)}
            className="w-full"
            min="0.01"
            max="5"
            step="0.01"
          />
        </div>
      </div>

      {/* Start Time (at) */}
      <div className="bg-surface p-3 rounded-lg">
        <h3 className="text-accent font-medium text-sm mb-2">Start Time</h3>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">At (seconds)</span>
            <input
              type="number"
              value={(tone as any).at || 0}
              onChange={(e) => updateLayerSound(layer.id, { at: parseFloat(e.target.value) || 0 } as any)}
              className="w-20 px-2 py-1 text-xs bg-background rounded border border-primary/20 text-right"
              min="0"
              step="0.01"
            />
          </div>
          <input
            type="range"
            value={(tone as any).at || 0}
            onChange={(e) => updateLayerSound(layer.id, { at: parseFloat(e.target.value) } as any)}
            className="w-full"
            min="0"
            max="10"
            step="0.01"
          />
        </div>
      </div>

      {/* Amplitude */}
      <div className="bg-surface p-3 rounded-lg">
        <h3 className="text-accent font-medium text-sm mb-2">Amplitude</h3>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Volume</span>
            <span className="text-xs">{(typeof tone.amp === 'number' ? tone.amp : (tone.amp as AutomationCurve)?.start || 1).toFixed(2)}</span>
          </div>
          <input
            type="range"
            value={typeof tone.amp === 'number' ? tone.amp : (tone.amp as AutomationCurve)?.start || 1}
            onChange={(e) => updateLayerSound(layer.id, { amp: parseFloat(e.target.value) } as Partial<ToneElement>)}
            className="w-full"
            min="0"
            max="1"
            step="0.01"
          />
        </div>
      </div>

      {/* Filter */}
      <div className="bg-surface p-3 rounded-lg col-span-2">
        <h3 className="text-accent font-medium text-sm mb-2">Filter</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Type</label>
            <select
              value={tone.filter?.type || 'none'}
              onChange={(e) => {
                if (e.target.value === 'none') {
                  updateLayerSound(layer.id, { filter: undefined } as Partial<ToneElement>)
                } else {
                  updateLayerSound(layer.id, {
                    filter: {
                      type: e.target.value as 'lowpass' | 'highpass' | 'bandpass',
                      cutoff: tone.filter?.cutoff || 1000,
                      resonance: tone.filter?.resonance || 1
                    }
                  } as Partial<ToneElement>)
                }
              }}
              className="w-full px-2 py-1 text-xs bg-background rounded border border-primary/20"
            >
              <option value="none">None</option>
              <option value="lowpass">Lowpass</option>
              <option value="highpass">Highpass</option>
              <option value="bandpass">Bandpass</option>
            </select>
          </div>
          {tone.filter && (
            <>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Cutoff</label>
                <input
                  type="range"
                  value={tone.filter.cutoff || 1000}
                  onChange={(e) => updateLayerSound(layer.id, {
                    filter: { ...tone.filter!, cutoff: parseFloat(e.target.value) }
                  } as Partial<ToneElement>)}
                  className="w-full"
                  min="20"
                  max="20000"
                />
                <span className="text-xs text-gray-500">{Math.round(tone.filter.cutoff || 1000)} Hz</span>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Resonance</label>
                <input
                  type="range"
                  value={tone.filter.resonance || 1}
                  onChange={(e) => updateLayerSound(layer.id, {
                    filter: { ...tone.filter!, resonance: parseFloat(e.target.value) }
                  } as Partial<ToneElement>)}
                  className="w-full"
                  min="0.1"
                  max="30"
                  step="0.1"
                />
                <span className="text-xs text-gray-500">{(tone.filter.resonance || 1).toFixed(1)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Envelope (ADSR) */}
      <div className="bg-surface p-3 rounded-lg col-span-2">
        <h3 className="text-accent font-medium text-sm mb-2">Envelope (ADSR)</h3>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Attack</label>
            <input
              type="range"
              value={tone.envelope?.attack || 0.01}
              onChange={(e) => updateLayerSound(layer.id, {
                envelope: { ...(tone.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }), attack: parseFloat(e.target.value) }
              } as Partial<ToneElement>)}
              className="w-full"
              min="0"
              max="2"
              step="0.001"
            />
            <span className="text-xs text-gray-500">{(tone.envelope?.attack || 0.01).toFixed(3)}s</span>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Decay</label>
            <input
              type="range"
              value={tone.envelope?.decay || 0.1}
              onChange={(e) => updateLayerSound(layer.id, {
                envelope: { ...(tone.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }), decay: parseFloat(e.target.value) }
              } as Partial<ToneElement>)}
              className="w-full"
              min="0"
              max="2"
              step="0.001"
            />
            <span className="text-xs text-gray-500">{(tone.envelope?.decay || 0.1).toFixed(3)}s</span>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Sustain</label>
            <input
              type="range"
              value={tone.envelope?.sustain || 0.7}
              onChange={(e) => updateLayerSound(layer.id, {
                envelope: { ...(tone.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }), sustain: parseFloat(e.target.value) }
              } as Partial<ToneElement>)}
              className="w-full"
              min="0"
              max="1"
              step="0.01"
            />
            <span className="text-xs text-gray-500">{(tone.envelope?.sustain || 0.7).toFixed(2)}</span>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Release</label>
            <input
              type="range"
              value={tone.envelope?.release || 0.2}
              onChange={(e) => updateLayerSound(layer.id, {
                envelope: { ...(tone.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }), release: parseFloat(e.target.value) }
              } as Partial<ToneElement>)}
              className="w-full"
              min="0"
              max="2"
              step="0.001"
            />
            <span className="text-xs text-gray-500">{(tone.envelope?.release || 0.2).toFixed(3)}s</span>
          </div>
        </div>
      </div>

      {/* Repeat */}
      <div className="bg-surface p-3 rounded-lg col-span-2">
        <h3 className="text-accent font-medium text-sm mb-2">Repeat</h3>
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Count</label>
            <input
              type="number"
              value={tone.repeat ?? 1}
              onChange={(e) => updateLayerSound(layer.id, { repeat: parseInt(e.target.value) || 1 } as Partial<ToneElement>)}
              className="w-full px-2 py-1 text-xs bg-background rounded border border-primary/20"
              min="1"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Interval</label>
            <input
              type="number"
              value={tone.repeatInterval ?? 0}
              onChange={(e) => updateLayerSound(layer.id, { repeatInterval: parseFloat(e.target.value) || 0 } as Partial<ToneElement>)}
              className="w-full px-2 py-1 text-xs bg-background rounded border border-primary/20"
              step="0.01"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Delay</label>
            <input
              type="number"
              value={tone.repeatDelay ?? 0}
              onChange={(e) => updateLayerSound(layer.id, { repeatDelay: parseFloat(e.target.value) ?? 0 } as Partial<ToneElement>)}
              className="w-full px-2 py-1 text-xs bg-background rounded border border-primary/20"
              step="0.01"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Decay</label>
            <input
              type="number"
              value={tone.repeatDecay ?? 0}
              onChange={(e) => updateLayerSound(layer.id, { repeatDecay: parseFloat(e.target.value) ?? 0 } as Partial<ToneElement>)}
              className="w-full px-2 py-1 text-xs bg-background rounded border border-primary/20"
              step="0.01"
              min="0"
              max="1"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Pitch Shift</label>
            <input
              type="number"
              value={tone.repeatPitchShift ?? 0}
              onChange={(e) => updateLayerSound(layer.id, { repeatPitchShift: parseFloat(e.target.value) ?? 0 } as Partial<ToneElement>)}
              className="w-full px-2 py-1 text-xs bg-background rounded border border-primary/20"
              step="0.1"
              min="-12"
              max="12"
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

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Noise Type */}
      <div className="bg-surface p-3 rounded-lg">
        <h3 className="text-accent font-medium text-sm mb-2">Noise Type</h3>
        <div className="grid grid-cols-3 gap-2">
          {['white', 'pink', 'brown'].map(color => (
            <button
              key={color}
              onClick={() => updateLayerSound(layer.id, { color } as Partial<NoiseElement>)}
              className={`px-2 py-1.5 text-xs rounded transition-colors ${
                noise.color === color
                  ? 'bg-primary text-white'
                  : 'bg-background border border-primary/20 hover:bg-primary/10'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="bg-surface p-3 rounded-lg">
        <h3 className="text-accent font-medium text-sm mb-2">Duration</h3>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Seconds</span>
            <span className="text-xs">{noise.dur.toFixed(2)}s</span>
          </div>
          <input
            type="range"
            value={noise.dur}
            onChange={(e) => updateLayerSound(layer.id, { dur: parseFloat(e.target.value) } as Partial<NoiseElement>)}
            className="w-full"
            min="0.01"
            max="5"
            step="0.01"
          />
        </div>
      </div>

      {/* Start Time (at) */}
      <div className="bg-surface p-3 rounded-lg">
        <h3 className="text-accent font-medium text-sm mb-2">Start Time</h3>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">At (seconds)</span>
            <input
              type="number"
              value={(noise as any).at || 0}
              onChange={(e) => updateLayerSound(layer.id, { at: parseFloat(e.target.value) || 0 } as any)}
              className="w-20 px-2 py-1 text-xs bg-background rounded border border-primary/20 text-right"
              min="0"
              step="0.01"
            />
          </div>
          <input
            type="range"
            value={(noise as any).at || 0}
            onChange={(e) => updateLayerSound(layer.id, { at: parseFloat(e.target.value) } as any)}
            className="w-full"
            min="0"
            max="10"
            step="0.01"
          />
        </div>
      </div>

      {/* Amplitude */}
      <div className="bg-surface p-3 rounded-lg">
        <h3 className="text-accent font-medium text-sm mb-2">Amplitude</h3>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Volume</span>
            <span className="text-xs">{(noise.amp || 1).toFixed(2)}</span>
          </div>
          <input
            type="range"
            value={noise.amp || 1}
            onChange={(e) => updateLayerSound(layer.id, { amp: parseFloat(e.target.value) } as Partial<NoiseElement>)}
            className="w-full"
            min="0"
            max="1"
            step="0.01"
          />
        </div>
      </div>

      {/* Filter */}
      <div className="bg-surface p-3 rounded-lg col-span-2">
        <h3 className="text-accent font-medium text-sm mb-2">Filter</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Type</label>
            <select
              value={noise.filter?.type || 'none'}
              onChange={(e) => {
                if (e.target.value === 'none') {
                  updateLayerSound(layer.id, { filter: undefined } as Partial<NoiseElement>)
                } else {
                  updateLayerSound(layer.id, {
                    filter: {
                      type: e.target.value as 'lowpass' | 'highpass' | 'bandpass',
                      cutoff: noise.filter?.cutoff || 1000,
                      resonance: noise.filter?.resonance || 1
                    }
                  } as Partial<NoiseElement>)
                }
              }}
              className="w-full px-2 py-1 text-xs bg-background rounded border border-primary/20"
            >
              <option value="none">None</option>
              <option value="lowpass">Lowpass</option>
              <option value="highpass">Highpass</option>
              <option value="bandpass">Bandpass</option>
            </select>
          </div>
          {noise.filter && (
            <>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Cutoff</label>
                <input
                  type="range"
                  value={noise.filter.cutoff || 1000}
                  onChange={(e) => updateLayerSound(layer.id, {
                    filter: { ...noise.filter!, cutoff: parseFloat(e.target.value) }
                  } as Partial<NoiseElement>)}
                  className="w-full"
                  min="20"
                  max="20000"
                />
                <span className="text-xs text-gray-500">{Math.round(noise.filter.cutoff || 1000)} Hz</span>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Resonance</label>
                <input
                  type="range"
                  value={noise.filter.resonance || 1}
                  onChange={(e) => updateLayerSound(layer.id, {
                    filter: { ...noise.filter!, resonance: parseFloat(e.target.value) }
                  } as Partial<NoiseElement>)}
                  className="w-full"
                  min="0.1"
                  max="30"
                  step="0.1"
                />
                <span className="text-xs text-gray-500">{(noise.filter.resonance || 1).toFixed(1)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Envelope (ADSR) */}
      <div className="bg-surface p-3 rounded-lg col-span-2">
        <h3 className="text-accent font-medium text-sm mb-2">Envelope (ADSR)</h3>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Attack</label>
            <input
              type="range"
              value={noise.envelope?.attack || 0.01}
              onChange={(e) => updateLayerSound(layer.id, {
                envelope: { ...(noise.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }), attack: parseFloat(e.target.value) }
              } as Partial<NoiseElement>)}
              className="w-full"
              min="0"
              max="2"
              step="0.001"
            />
            <span className="text-xs text-gray-500">{(noise.envelope?.attack || 0.01).toFixed(3)}s</span>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Decay</label>
            <input
              type="range"
              value={noise.envelope?.decay || 0.1}
              onChange={(e) => updateLayerSound(layer.id, {
                envelope: { ...(noise.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }), decay: parseFloat(e.target.value) }
              } as Partial<NoiseElement>)}
              className="w-full"
              min="0"
              max="2"
              step="0.001"
            />
            <span className="text-xs text-gray-500">{(noise.envelope?.decay || 0.1).toFixed(3)}s</span>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Sustain</label>
            <input
              type="range"
              value={noise.envelope?.sustain || 0.7}
              onChange={(e) => updateLayerSound(layer.id, {
                envelope: { ...(noise.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }), sustain: parseFloat(e.target.value) }
              } as Partial<NoiseElement>)}
              className="w-full"
              min="0"
              max="1"
              step="0.01"
            />
            <span className="text-xs text-gray-500">{(noise.envelope?.sustain || 0.7).toFixed(2)}</span>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Release</label>
            <input
              type="range"
              value={noise.envelope?.release || 0.2}
              onChange={(e) => updateLayerSound(layer.id, {
                envelope: { ...(noise.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 }), release: parseFloat(e.target.value) }
              } as Partial<NoiseElement>)}
              className="w-full"
              min="0"
              max="2"
              step="0.001"
            />
            <span className="text-xs text-gray-500">{(noise.envelope?.release || 0.2).toFixed(3)}s</span>
          </div>
        </div>
      </div>

      {/* Repeat */}
      <div className="bg-surface p-3 rounded-lg col-span-2">
        <h3 className="text-accent font-medium text-sm mb-2">Repeat</h3>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Count</label>
            <input
              type="number"
              value={noise.repeat || 1}
              onChange={(e) => updateLayerSound(layer.id, { repeat: parseInt(e.target.value) || 1 } as Partial<NoiseElement>)}
              className="w-full px-2 py-1 text-xs bg-background rounded border border-primary/20"
              min="1"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Interval</label>
            <input
              type="number"
              value={noise.repeatInterval || 0}
              onChange={(e) => updateLayerSound(layer.id, { repeatInterval: parseFloat(e.target.value) || 0 } as Partial<NoiseElement>)}
              className="w-full px-2 py-1 text-xs bg-background rounded border border-primary/20"
              step="0.01"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Delay</label>
            <input
              type="number"
              value={noise.repeatDelay || 0}
              onChange={(e) => updateLayerSound(layer.id, { repeatDelay: parseFloat(e.target.value) || 0 } as Partial<NoiseElement>)}
              className="w-full px-2 py-1 text-xs bg-background rounded border border-primary/20"
              step="0.01"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Decay</label>
            <input
              type="number"
              value={noise.repeatDecay || 0}
              onChange={(e) => updateLayerSound(layer.id, { repeatDecay: parseFloat(e.target.value) || 0 } as Partial<NoiseElement>)}
              className="w-full px-2 py-1 text-xs bg-background rounded border border-primary/20"
              step="0.01"
              min="0"
              max="1"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
