import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Head from 'next/head'

type LayerType = 'tone' | 'noise'
type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle'
type NoiseColor = 'white' | 'pink' | 'brown' | 'blue'

interface Envelope {
  attack: number
  decay: number
  sustain: number
  release: number
}

interface FrequencyAutomation {
  start: number
  end: number
  curve: 'linear' | 'exp' | 'smooth'
}

interface AmplitudeAutomation {
  start: number
  end: number
  curve: 'linear' | 'exp' | 'smooth'
}

interface FilterParams {
  enabled: boolean
  type: 'lowpass' | 'highpass' | 'bandpass' | 'notch'
  freq: number
  resonance: number
}

interface ToneParams {
  wave: WaveType
  freq: number | FrequencyAutomation
  dur: number
  amp: number | AmplitudeAutomation
  pan: number
  envelope: Envelope
  useFreqAutomation?: boolean
  useAmpAutomation?: boolean
  filter?: FilterParams
}

interface NoiseParams {
  color: NoiseColor
  dur: number
  amp: number
  pan: number
  envelope: Envelope
  filter?: FilterParams
}

interface Layer {
  id: number
  type: LayerType
  params: ToneParams | NoiseParams
}

export default function Editor() {
  const [layers, setLayers] = useState<Layer[]>([])
  const [currentLayerId, setCurrentLayerId] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [xmlOutput, setXmlOutput] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [showPresets, setShowPresets] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>('ui')
  const audioContextRef = useRef<AudioContext | null>(null)
  const currentSourcesRef = useRef<any[]>([])
  const layerIdCounterRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const layersRef = useRef<Layer[]>(layers)

  useEffect(() => {
    // Add initial layer
    addLayer()
  }, [])

  // Move keyboard shortcut effect after function definitions

  useEffect(() => {
    updateXMLOutput()
    // Keep the ref in sync with current layers
    layersRef.current = layers
  }, [layers])

  const getDefaultParams = (type: LayerType): ToneParams | NoiseParams => {
    if (type === 'tone') {
      return {
        wave: 'sine',
        freq: 440,
        dur: 0.5,
        amp: 1,
        pan: 0,
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.7,
          release: 0.2
        },
        useFreqAutomation: false,
        useAmpAutomation: false,
        filter: {
          enabled: false,
          type: 'lowpass',
          freq: 1000,
          resonance: 1
        }
      } as ToneParams
    } else {
      return {
        color: 'white',
        dur: 0.5,
        amp: 0.5,
        pan: 0,
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.7,
          release: 0.2
        },
        filter: {
          enabled: false,
          type: 'lowpass',
          freq: 1000,
          resonance: 1
        }
      } as NoiseParams
    }
  }

  const addLayer = (type: LayerType = 'tone') => {
    // Stop any currently playing sound when adding a layer
    if (isPlaying) {
      stopSound()
    }
    const newLayer: Layer = {
      id: layerIdCounterRef.current++,
      type,
      params: getDefaultParams(type)
    }
    setLayers([...layers, newLayer])
    setCurrentLayerId(newLayer.id)
  }

  const deleteLayer = (id: number) => {
    // Stop any currently playing sound when deleting a layer
    if (isPlaying) {
      stopSound()
    }
    const newLayers = layers.filter(l => l.id !== id)
    setLayers(newLayers)
    if (currentLayerId === id) {
      setCurrentLayerId(newLayers.length > 0 ? newLayers[0].id : null)
    }
  }

  const updateLayer = (id: number, updates: Partial<Layer>) => {
    // Stop any currently playing sound when layer changes
    if (isPlaying) {
      stopSound()
    }
    setLayers(layers.map(layer =>
      layer.id === id ? { ...layer, ...updates } : layer
    ))
  }

  const updateLayerParam = (id: number, paramName: string, value: any) => {
    // Stop any currently playing sound when parameters change
    if (isPlaying) {
      stopSound()
    }
    setLayers(layers.map(layer => {
      if (layer.id !== id) return layer

      if (['attack', 'decay', 'sustain', 'release'].includes(paramName)) {
        return {
          ...layer,
          params: {
            ...layer.params,
            envelope: {
              ...layer.params.envelope,
              [paramName]: value
            }
          }
        }
      }

      return {
        ...layer,
        params: {
          ...layer.params,
          [paramName]: value
        }
      }
    }))
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

    if (layers.length > 1) {
      xml += '  <group>\n'
      layers.forEach(layer => {
        xml += '    ' + generateLayerXML(layer) + '\n'
      })
      xml += '  </group>\n'
    } else {
      xml += '  ' + generateLayerXML(layers[0]) + '\n'
    }

    xml += '</spa>'
    setXmlOutput(xml)
  }

  const generateLayerXML = (layer: Layer): string => {
    let xml = '<'

    if (layer.type === 'tone') {
      const params = layer.params as ToneParams
      xml += `tone wave="${params.wave}"`

      // Handle frequency
      if (params.useFreqAutomation && typeof params.freq === 'object') {
        xml += ` freq.start="${params.freq.start}" freq.end="${params.freq.end}" freq.curve="${params.freq.curve}"`
      } else {
        xml += ` freq="${typeof params.freq === 'number' ? params.freq : 440}"`
      }

      xml += ` dur="${params.dur}"`

      // Handle amplitude
      if (params.useAmpAutomation && typeof params.amp === 'object') {
        xml += ` amp.start="${params.amp.start}" amp.end="${params.amp.end}" amp.curve="${params.amp.curve}"`
      } else if (typeof params.amp === 'number' && params.amp !== 1) {
        xml += ` amp="${params.amp}"`
      }

      if (params.pan !== 0) {
        xml += ` pan="${params.pan}"`
      }

      // Handle filter
      if (params.filter?.enabled) {
        xml += ` filter="${params.filter.type}" cutoff="${params.filter.freq}"`
        if (params.filter.resonance !== 1) {
          xml += ` resonance="${params.filter.resonance}"`
        }
      }

      const env = params.envelope
      xml += `\n        envelope="${env.attack},${env.decay},${env.sustain},${env.release}"`
    } else {
      const params = layer.params as NoiseParams
      xml += `noise color="${params.color}" dur="${params.dur}"`

      if (params.amp !== 1) {
        xml += ` amp="${params.amp}"`
      }

      if (params.pan !== 0) {
        xml += ` pan="${params.pan}"`
      }

      // Handle filter
      if (params.filter?.enabled) {
        xml += ` filter="${params.filter.type}" cutoff="${params.filter.freq}"`
        if (params.filter.resonance !== 1) {
          xml += ` resonance="${params.filter.resonance}"`
        }
      }

      const env = params.envelope
      xml += `\n         envelope="${env.attack},${env.decay},${env.sustain},${env.release}"`
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

    const sources: any[] = []
    // Use layersRef.current to get the most current layers
    const currentLayers = layersRef.current
    const maxDuration = Math.max(...currentLayers.map(l => l.params.dur))

    for (const layer of currentLayers) {
      if (layer.type === 'tone') {
        const source = playTone(layer.params as ToneParams)
        sources.push(source)
      } else {
        const source = playNoise(layer.params as NoiseParams)
        sources.push(source)
      }
    }

    currentSourcesRef.current = sources

    setTimeout(() => {
      stopSound()
    }, maxDuration * 1000 + 100)
  }

  const playTone = (params: ToneParams) => {
    const ctx = audioContextRef.current!
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const panNode = ctx.createStereoPanner()

    oscillator.type = params.wave

    // Handle frequency automation
    if (params.useFreqAutomation && typeof params.freq === 'object') {
      const now = ctx.currentTime
      oscillator.frequency.setValueAtTime(params.freq.start, now)

      if (params.freq.curve === 'exp') {
        oscillator.frequency.exponentialRampToValueAtTime(params.freq.end, now + params.dur)
      } else if (params.freq.curve === 'smooth') {
        oscillator.frequency.setTargetAtTime(params.freq.end, now, params.dur / 4)
      } else {
        oscillator.frequency.linearRampToValueAtTime(params.freq.end, now + params.dur)
      }
    } else {
      oscillator.frequency.value = typeof params.freq === 'number' ? params.freq : 440
    }

    const now = ctx.currentTime
    const env = params.envelope

    // Get base amplitude
    let baseAmp = 1
    if (params.useAmpAutomation && typeof params.amp === 'object') {
      baseAmp = params.amp.start
    } else if (typeof params.amp === 'number') {
      baseAmp = params.amp
    }

    // Apply ADSR envelope
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(baseAmp, now + env.attack)
    gainNode.gain.linearRampToValueAtTime(baseAmp * env.sustain, now + env.attack + env.decay)
    gainNode.gain.setValueAtTime(baseAmp * env.sustain, now + params.dur - env.release)
    gainNode.gain.linearRampToValueAtTime(0, now + params.dur)

    panNode.pan.value = params.pan

    // Create filter if enabled
    let filterNode: BiquadFilterNode | null = null
    if (params.filter?.enabled && params.filter.freq && params.filter.resonance) {
      filterNode = ctx.createBiquadFilter()
      filterNode.type = params.filter.type || 'lowpass'
      filterNode.frequency.value = Math.max(20, Math.min(20000, params.filter.freq))
      filterNode.Q.value = Math.max(0.1, Math.min(30, params.filter.resonance))
    }

    // Build audio chain
    oscillator.connect(gainNode)

    // Apply amplitude automation if enabled
    if (params.useAmpAutomation && typeof params.amp === 'object') {
      const ampGain = ctx.createGain()
      ampGain.gain.setValueAtTime(1, now)

      const ratio = params.amp.end / params.amp.start
      if (params.amp.curve === 'exp' && ratio > 0) {
        ampGain.gain.exponentialRampToValueAtTime(ratio, now + params.dur)
      } else if (params.amp.curve === 'smooth') {
        ampGain.gain.setTargetAtTime(ratio, now, params.dur / 4)
      } else {
        ampGain.gain.linearRampToValueAtTime(ratio, now + params.dur)
      }

      gainNode.connect(ampGain)
      if (filterNode) {
        ampGain.connect(filterNode)
        filterNode.connect(panNode)
      } else {
        ampGain.connect(panNode)
      }
    } else {
      if (filterNode) {
        gainNode.connect(filterNode)
        filterNode.connect(panNode)
      } else {
        gainNode.connect(panNode)
      }
    }
    panNode.connect(ctx.destination)

    oscillator.start(now)
    oscillator.stop(now + params.dur)

    return oscillator
  }

  const playNoise = (params: NoiseParams) => {
    const ctx = audioContextRef.current!
    const bufferSize = ctx.sampleRate * params.dur
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      generateNoiseData(data, params.color)
    }

    const source = ctx.createBufferSource()
    const gainNode = ctx.createGain()
    const panNode = ctx.createStereoPanner()

    source.buffer = buffer

    const now = ctx.currentTime
    const env = params.envelope

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(params.amp, now + env.attack)
    gainNode.gain.linearRampToValueAtTime(params.amp * env.sustain, now + env.attack + env.decay)
    gainNode.gain.setValueAtTime(params.amp * env.sustain, now + params.dur - env.release)
    gainNode.gain.linearRampToValueAtTime(0, now + params.dur)

    panNode.pan.value = params.pan

    // Create filter if enabled
    let filterNode: BiquadFilterNode | null = null
    if (params.filter?.enabled && params.filter.freq && params.filter.resonance) {
      filterNode = ctx.createBiquadFilter()
      filterNode.type = params.filter.type || 'lowpass'
      filterNode.frequency.value = Math.max(20, Math.min(20000, params.filter.freq))
      filterNode.Q.value = Math.max(0.1, Math.min(30, params.filter.resonance))
    }

    // Build audio chain
    source.connect(gainNode)
    if (filterNode) {
      gainNode.connect(filterNode)
      filterNode.connect(panNode)
    } else {
      gainNode.connect(panNode)
    }
    panNode.connect(ctx.destination)

    source.start(now)

    return source
  }

  const generateNoiseData = (data: Float32Array, color: NoiseColor) => {
    const length = data.length

    switch (color) {
      case 'white':
        for (let i = 0; i < length; i++) {
          data[i] = Math.random() * 2 - 1
        }
        break
      case 'pink':
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1
          b0 = 0.99886 * b0 + white * 0.0555179
          b1 = 0.99332 * b1 + white * 0.0750759
          b2 = 0.96900 * b2 + white * 0.1538520
          b3 = 0.86650 * b3 + white * 0.3104856
          b4 = 0.55000 * b4 + white * 0.5329522
          b5 = -0.7616 * b5 - white * 0.0168980
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
          b6 = white * 0.115926
        }
        break
      case 'brown':
        let lastOut = 0
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1
          lastOut = (lastOut + (0.02 * white)) / 1.02
          data[i] = lastOut * 3.5
        }
        break
      case 'blue':
        let lastValue = 0
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1
          data[i] = (white - lastValue) * 0.5
          lastValue = white
        }
        break
    }
  }

  const stopSound = () => {
    // Stop all current sources
    currentSourcesRef.current.forEach(source => {
      try {
        source.stop()
        source.disconnect()
      } catch (e) {}
    })
    currentSourcesRef.current = []

    // Clear any scheduled timeouts
    if (audioContextRef.current) {
      // Suspend and resume the audio context to clear any scheduled events
      audioContextRef.current.suspend().then(() => {
        audioContextRef.current?.resume()
      })
    }

    setIsPlaying(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(xmlOutput)
  }

  const resetEditor = () => {
    // Stop any currently playing sound
    if (isPlaying) {
      stopSound()
    }
    setLayers([])
    setCurrentLayerId(null)
    layerIdCounterRef.current = 0
    addLayer()
  }

  const parseSPAXML = (xmlText: string): Layer[] => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlText, 'text/xml')

      // Check for parsing errors
      const parseError = doc.querySelector('parsererror')
      if (parseError) {
        throw new Error('Invalid XML format')
      }

      const spaElement = doc.querySelector('spa')
      if (!spaElement) {
        throw new Error('Invalid SPA file: missing <spa> root element')
      }

      const newLayers: Layer[] = []
      let layerId = 0

      // Parse all tone and noise elements
      const processElement = (element: Element) => {
        if (element.tagName === 'tone') {
          const wave = (element.getAttribute('wave') || 'sine') as WaveType
          const dur = parseFloat(element.getAttribute('dur') || '0.5')
          const pan = parseFloat(element.getAttribute('pan') || '0')

          // Parse frequency (might be automated)
          let freq: number | FrequencyAutomation = 440
          let useFreqAutomation = false

          if (element.hasAttribute('freq.start')) {
            freq = {
              start: parseFloat(element.getAttribute('freq.start') || '440'),
              end: parseFloat(element.getAttribute('freq.end') || '880'),
              curve: (element.getAttribute('freq.curve') || 'linear') as 'linear' | 'exp' | 'smooth'
            }
            useFreqAutomation = true
          } else {
            freq = parseFloat(element.getAttribute('freq') || '440')
          }

          // Parse amplitude (might be automated)
          let amp: number | AmplitudeAutomation = 1
          let useAmpAutomation = false

          if (element.hasAttribute('amp.start')) {
            amp = {
              start: parseFloat(element.getAttribute('amp.start') || '0.5'),
              end: parseFloat(element.getAttribute('amp.end') || '1'),
              curve: (element.getAttribute('amp.curve') || 'linear') as 'linear' | 'exp' | 'smooth'
            }
            useAmpAutomation = true
          } else {
            amp = parseFloat(element.getAttribute('amp') || '1')
          }

          // Parse envelope
          const envelopeStr = element.getAttribute('envelope') || '0.01,0.1,0.7,0.2'
          const envValues = envelopeStr.split(',').map(v => parseFloat(v))
          const envelope: Envelope = {
            attack: envValues[0] || 0.01,
            decay: envValues[1] || 0.1,
            sustain: envValues[2] || 0.7,
            release: envValues[3] || 0.2
          }

          // Parse filter
          let filter: FilterParams = {
            enabled: false,
            type: 'lowpass',
            freq: 1000,
            resonance: 1
          }

          if (element.hasAttribute('filter')) {
            filter = {
              enabled: true,
              type: (element.getAttribute('filter') || 'lowpass') as 'lowpass' | 'highpass' | 'bandpass' | 'notch',
              freq: parseFloat(element.getAttribute('cutoff') || '1000'),
              resonance: parseFloat(element.getAttribute('resonance') || '1')
            }
          }

          newLayers.push({
            id: layerId++,
            type: 'tone',
            params: {
              wave,
              freq,
              dur,
              amp,
              pan,
              envelope,
              useFreqAutomation,
              useAmpAutomation,
              filter
            } as ToneParams
          })
        } else if (element.tagName === 'noise') {
          const color = (element.getAttribute('color') || 'white') as NoiseColor
          const dur = parseFloat(element.getAttribute('dur') || '0.5')
          const amp = parseFloat(element.getAttribute('amp') || '0.5')
          const pan = parseFloat(element.getAttribute('pan') || '0')

          // Parse envelope
          const envelopeStr = element.getAttribute('envelope') || '0.01,0.1,0.7,0.2'
          const envValues = envelopeStr.split(',').map(v => parseFloat(v))
          const envelope: Envelope = {
            attack: envValues[0] || 0.01,
            decay: envValues[1] || 0.1,
            sustain: envValues[2] || 0.7,
            release: envValues[3] || 0.2
          }

          // Parse filter
          let filter: FilterParams = {
            enabled: false,
            type: 'lowpass',
            freq: 1000,
            resonance: 1
          }

          if (element.hasAttribute('filter')) {
            filter = {
              enabled: true,
              type: (element.getAttribute('filter') || 'lowpass') as 'lowpass' | 'highpass' | 'bandpass' | 'notch',
              freq: parseFloat(element.getAttribute('cutoff') || '1000'),
              resonance: parseFloat(element.getAttribute('resonance') || '1')
            }
          }

          newLayers.push({
            id: layerId++,
            type: 'noise',
            params: {
              color,
              dur,
              amp,
              pan,
              envelope,
              filter
            } as NoiseParams
          })
        } else if (element.tagName === 'group' || element.tagName === 'spa') {
          // Recursively process children
          Array.from(element.children).forEach(processElement)
        }
      }

      // Process all elements
      Array.from(spaElement.children).forEach(processElement)

      if (newLayers.length === 0) {
        throw new Error('No valid sound layers found in the file')
      }

      return newLayers
    } catch (error: any) {
      alert(`Failed to import SPA file: ${error.message}`)
      return []
    }
  }

  const importFromText = () => {
    const parsedLayers = parseSPAXML(importText)
    if (parsedLayers.length > 0) {
      // Stop any currently playing sound
      if (isPlaying) {
        stopSound()
      }
      setLayers(parsedLayers)
      layerIdCounterRef.current = parsedLayers.length
      setCurrentLayerId(parsedLayers[0].id)
      setShowImportModal(false)
      setImportText('')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const parsedLayers = parseSPAXML(content)
      if (parsedLayers.length > 0) {
        // Stop any currently playing sound
        if (isPlaying) {
          stopSound()
        }
        setLayers(parsedLayers)
        layerIdCounterRef.current = parsedLayers.length
        setCurrentLayerId(parsedLayers[0].id)
        setShowImportModal(false)
      }
    }
    reader.readAsText(file)

    // Reset the input so the same file can be selected again
    event.target.value = ''
  }

  // Comprehensive preset collection organized by category
  const presetCategories = {
    'UI Feedback': {
      'Button Click': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'sine',
          freq: 800,
          dur: 0.05,
          amp: 0.8,
          pan: 0,
          envelope: { attack: 0, decay: 0.02, sustain: 0, release: 0.03 }
        } as ToneParams
      }],
      'Button Hover': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'sine',
          freq: 600,
          dur: 0.03,
          amp: 0.3,
          pan: 0,
          envelope: { attack: 0, decay: 0.01, sustain: 0, release: 0.02 }
        } as ToneParams
      }],
      'Toggle On': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'triangle',
          freq: { start: 400, end: 800, curve: 'smooth' },
          dur: 0.1,
          amp: 0.5,
          pan: 0,
          envelope: { attack: 0.01, decay: 0.02, sustain: 0.3, release: 0.07 },
          useFreqAutomation: true
        } as ToneParams
      }],
      'Toggle Off': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'triangle',
          freq: { start: 800, end: 400, curve: 'smooth' },
          dur: 0.1,
          amp: 0.4,
          pan: 0,
          envelope: { attack: 0.01, decay: 0.02, sustain: 0.3, release: 0.07 },
          useFreqAutomation: true
        } as ToneParams
      }],
      'Modal Open': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'sine',
          freq: { start: 200, end: 600, curve: 'exp' },
          dur: 0.2,
          amp: 0.3,
          pan: 0,
          envelope: { attack: 0.05, decay: 0.05, sustain: 0.4, release: 0.1 },
          useFreqAutomation: true,
          filter: { enabled: true, type: 'lowpass', freq: 2000, resonance: 2 }
        } as ToneParams
      }],
      'Modal Close': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'sine',
          freq: { start: 600, end: 200, curve: 'exp' },
          dur: 0.15,
          amp: 0.3,
          pan: 0,
          envelope: { attack: 0.01, decay: 0.04, sustain: 0.3, release: 0.1 },
          useFreqAutomation: true,
          filter: { enabled: true, type: 'lowpass', freq: 1500, resonance: 1.5 }
        } as ToneParams
      }],
      'Tab Switch': [
        {
          id: 0,
          type: 'noise',
          params: {
            color: 'white',
            dur: 0.02,
            amp: 0.1,
            pan: 0,
            envelope: { attack: 0, decay: 0.005, sustain: 0, release: 0.015 },
            filter: { enabled: true, type: 'bandpass', freq: 4000, resonance: 3 }
          } as NoiseParams
        },
        {
          id: 1,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 1200,
            dur: 0.08,
            amp: 0.3,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.02, sustain: 0.2, release: 0.05 }
          } as ToneParams
        }
      ],
      'Dropdown Expand': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'sine',
          freq: { start: 400, end: 450, curve: 'linear' },
          dur: 0.08,
          amp: 0.25,
          pan: 0,
          envelope: { attack: 0.01, decay: 0.02, sustain: 0.5, release: 0.05 },
          useFreqAutomation: true
        } as ToneParams
      }],
      'Tooltip Show': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'triangle',
          freq: 2000,
          dur: 0.03,
          amp: 0.15,
          pan: 0,
          envelope: { attack: 0.005, decay: 0.01, sustain: 0, release: 0.015 }
        } as ToneParams
      }]
    },
    'Notifications': {
      'Success': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 392,  // G4
            dur: 0.12,
            amp: 0.5,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.02, sustain: 0.6, release: 0.09 }
          } as ToneParams
        },
        {
          id: 1,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 523.25,  // C5
            dur: 0.12,
            amp: 0.5,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.02, sustain: 0.6, release: 0.09 }
          } as ToneParams
        },
        {
          id: 2,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 783.99,  // G5
            dur: 0.25,
            amp: 0.6,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.03, sustain: 0.7, release: 0.21 }
          } as ToneParams
        }
      ],
      'Error': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'square',
            freq: 200,
            dur: 0.15,
            amp: 0.3,
            pan: 0,
            envelope: { attack: 0, decay: 0.05, sustain: 0.5, release: 0.1 }
          } as ToneParams
        },
        {
          id: 1,
          type: 'noise',
          params: {
            color: 'pink',
            dur: 0.1,
            amp: 0.2,
            pan: 0,
            envelope: { attack: 0, decay: 0.05, sustain: 0, release: 0.05 }
          } as NoiseParams
        }
      ],
      'Warning': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'triangle',
            freq: 440,
            dur: 0.15,
            amp: 0.4,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.03, sustain: 0.5, release: 0.11 }
          } as ToneParams
        },
        {
          id: 1,
          type: 'tone',
          params: {
            wave: 'triangle',
            freq: 330,
            dur: 0.15,
            amp: 0.3,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.03, sustain: 0.5, release: 0.11 }
          } as ToneParams
        }
      ],
      'Info': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'sine',
          freq: 660,
          dur: 0.1,
          amp: 0.4,
          pan: 0,
          envelope: { attack: 0.01, decay: 0.02, sustain: 0.4, release: 0.07 },
          filter: { enabled: true, type: 'lowpass', freq: 3000, resonance: 1 }
        } as ToneParams
      }],
      'Achievement': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 523.25,  // C5
            dur: 0.1,
            amp: 0.4,
            pan: -0.5,
            envelope: { attack: 0.01, decay: 0.02, sustain: 0.5, release: 0.07 }
          } as ToneParams
        },
        {
          id: 1,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 659.25,  // E5
            dur: 0.1,
            amp: 0.4,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.02, sustain: 0.5, release: 0.07 }
          } as ToneParams
        },
        {
          id: 2,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 783.99,  // G5
            dur: 0.1,
            amp: 0.4,
            pan: 0.5,
            envelope: { attack: 0.01, decay: 0.02, sustain: 0.5, release: 0.07 }
          } as ToneParams
        },
        {
          id: 3,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 1046.5,  // C6
            dur: 0.3,
            amp: 0.5,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.05, sustain: 0.6, release: 0.24 }
          } as ToneParams
        }
      ]
    },
    'Game Sounds': {
      'Coin Collect': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'square',
          freq: { start: 988, end: 1319, curve: 'linear' },
          dur: 0.3,
          amp: 0.4,
          pan: 0,
          envelope: { attack: 0, decay: 0.1, sustain: 0.2, release: 0.1 },
          useFreqAutomation: true
        } as ToneParams
      }],
      'Jump': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'triangle',
            freq: { start: 200, end: 400, curve: 'exp' },
            dur: 0.2,
            amp: 0.5,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.05, sustain: 0.2, release: 0.14 },
            useFreqAutomation: true
          } as ToneParams
        },
        {
          id: 1,
          type: 'noise',
          params: {
            color: 'white',
            dur: 0.05,
            amp: 0.1,
            pan: 0,
            envelope: { attack: 0, decay: 0.02, sustain: 0, release: 0.03 },
            filter: { enabled: true, type: 'highpass', freq: 2000, resonance: 1 }
          } as NoiseParams
        }
      ],
      'Power Up': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'sawtooth',
            freq: { start: 200, end: 800, curve: 'exp' },
            dur: 0.5,
            amp: 0.3,
            pan: 0,
            envelope: { attack: 0.1, decay: 0.1, sustain: 0.5, release: 0.3 },
            useFreqAutomation: true,
            filter: { enabled: true, type: 'lowpass', freq: 2000, resonance: 3 }
          } as ToneParams
        },
        {
          id: 1,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: { start: 400, end: 1600, curve: 'exp' },
            dur: 0.5,
            amp: 0.2,
            pan: 0,
            envelope: { attack: 0.15, decay: 0.1, sustain: 0.4, release: 0.25 },
            useFreqAutomation: true
          } as ToneParams
        }
      ],
      'Laser': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'sawtooth',
          freq: { start: 2000, end: 100, curve: 'exp' },
          dur: 0.3,
          amp: 0.5,
          pan: 0,
          envelope: { attack: 0, decay: 0.1, sustain: 0, release: 0.2 },
          useFreqAutomation: true,
          filter: {
            enabled: true,
            type: 'lowpass',
            freq: 3000,
            resonance: 5
          }
        } as ToneParams
      }],
      'Explosion': [
        {
          id: 0,
          type: 'noise',
          params: {
            color: 'brown',
            dur: 0.8,
            amp: 0.7,
            pan: 0,
            envelope: { attack: 0, decay: 0.2, sustain: 0.3, release: 0.5 },
            filter: { enabled: true, type: 'lowpass', freq: 500, resonance: 1 }
          } as NoiseParams
        },
        {
          id: 1,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 60,
            dur: 0.4,
            amp: 0.5,
            pan: 0,
            envelope: { attack: 0, decay: 0.1, sustain: 0.2, release: 0.3 }
          } as ToneParams
        }
      ],
      'Hit/Damage': [
        {
          id: 0,
          type: 'noise',
          params: {
            color: 'pink',
            dur: 0.1,
            amp: 0.6,
            pan: 0,
            envelope: { attack: 0, decay: 0.03, sustain: 0, release: 0.07 }
          } as NoiseParams
        },
        {
          id: 1,
          type: 'tone',
          params: {
            wave: 'square',
            freq: 150,
            dur: 0.1,
            amp: 0.4,
            pan: 0,
            envelope: { attack: 0, decay: 0.05, sustain: 0, release: 0.05 }
          } as ToneParams
        }
      ],
      'Level Complete': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 261.63,  // C4
            dur: 0.15,
            amp: 0.5,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.02, sustain: 0.7, release: 0.12 }
          } as ToneParams
        },
        {
          id: 1,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 329.63,  // E4
            dur: 0.15,
            amp: 0.5,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.02, sustain: 0.7, release: 0.12 }
          } as ToneParams
        },
        {
          id: 2,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 392,  // G4
            dur: 0.15,
            amp: 0.5,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.02, sustain: 0.7, release: 0.12 }
          } as ToneParams
        },
        {
          id: 3,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 523.25,  // C5
            dur: 0.4,
            amp: 0.6,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.05, sustain: 0.7, release: 0.34 }
          } as ToneParams
        }
      ]
    },
    'Ambient & Transitions': {
      'Whoosh': [{
        id: 0,
        type: 'noise',
        params: {
          color: 'white',
          dur: 0.5,
          amp: 0.4,
          pan: 0,
          envelope: { attack: 0.1, decay: 0.1, sustain: 0.3, release: 0.2 },
          filter: { enabled: true, type: 'bandpass', freq: 1000, resonance: 2 }
        } as NoiseParams
      }],
      'Page Turn': [
        {
          id: 0,
          type: 'noise',
          params: {
            color: 'white',
            dur: 0.3,
            amp: 0.3,
            pan: 0,
            envelope: { attack: 0.05, decay: 0.05, sustain: 0.2, release: 0.2 },
            filter: { enabled: true, type: 'highpass', freq: 3000, resonance: 1 }
          } as NoiseParams
        }
      ],
      'Slide In': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'sine',
          freq: { start: 100, end: 500, curve: 'exp' },
          dur: 0.2,
          amp: 0.3,
          pan: 0,
          envelope: { attack: 0.02, decay: 0.05, sustain: 0.4, release: 0.13 },
          useFreqAutomation: true,
          filter: { enabled: true, type: 'lowpass', freq: 2000, resonance: 1.5 }
        } as ToneParams
      }],
      'Fade Transition': [{
        id: 0,
        type: 'noise',
        params: {
          color: 'pink',
          dur: 0.4,
          amp: 0.2,
          pan: 0,
          envelope: { attack: 0.1, decay: 0.1, sustain: 0.5, release: 0.2 },
          filter: { enabled: true, type: 'lowpass', freq: 800, resonance: 1 }
        } as NoiseParams
      }],
      'Wind Ambience': [{
        id: 0,
        type: 'noise',
        params: {
          color: 'brown',
          dur: 2,
          amp: 0.2,
          pan: 0,
          envelope: { attack: 0.5, decay: 0.3, sustain: 0.5, release: 1.2 },
          filter: { enabled: true, type: 'lowpass', freq: 400, resonance: 1 }
        } as NoiseParams
      }]
    },
    'Communication': {
      'Message Sent': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 440,
            dur: 0.05,
            amp: 0.4,
            pan: 0,
            envelope: { attack: 0, decay: 0.02, sustain: 0, release: 0.03 }
          } as ToneParams
        },
        {
          id: 1,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 880,
            dur: 0.1,
            amp: 0.3,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.03, sustain: 0.2, release: 0.06 }
          } as ToneParams
        }
      ],
      'Message Received': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'triangle',
            freq: 880,
            dur: 0.08,
            amp: 0.4,
            pan: 0,
            envelope: { attack: 0.005, decay: 0.01, sustain: 0.2, release: 0.06 }
          } as ToneParams
        },
        {
          id: 1,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 1760,
            dur: 0.12,
            amp: 0.3,
            pan: 0,
            envelope: { attack: 0.005, decay: 0.02, sustain: 0.1, release: 0.09 }
          } as ToneParams
        }
      ],
      'Call Incoming': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 440,
            dur: 0.3,
            amp: { start: 0.3, end: 0, curve: 'linear' },
            pan: 0,
            envelope: { attack: 0.01, decay: 0.05, sustain: 0.8, release: 0.24 },
            useAmpAutomation: true
          } as ToneParams
        },
        {
          id: 1,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 350,
            dur: 0.3,
            amp: { start: 0.3, end: 0, curve: 'linear' },
            pan: 0,
            envelope: { attack: 0.01, decay: 0.05, sustain: 0.8, release: 0.24 },
            useAmpAutomation: true
          } as ToneParams
        }
      ],
      'Typing': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'square',
          freq: 1500,
          dur: 0.02,
          amp: 0.1,
          pan: 0,
          envelope: { attack: 0, decay: 0.005, sustain: 0, release: 0.015 }
        } as ToneParams
      }],
      'Video Call Start': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: { start: 400, end: 800, curve: 'smooth' },
            dur: 0.3,
            amp: 0.4,
            pan: 0,
            envelope: { attack: 0.05, decay: 0.05, sustain: 0.5, release: 0.2 },
            useFreqAutomation: true
          } as ToneParams
        },
        {
          id: 1,
          type: 'noise',
          params: {
            color: 'white',
            dur: 0.1,
            amp: 0.05,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.02, sustain: 0, release: 0.07 },
            filter: { enabled: true, type: 'highpass', freq: 4000, resonance: 1 }
          } as NoiseParams
        }
      ]
    },
    'Device & System': {
      'Camera Shutter': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 1000,
            dur: 0.05,
            amp: 0.5,
            pan: 0,
            envelope: { attack: 0, decay: 0.02, sustain: 0, release: 0.03 }
          } as ToneParams
        },
        {
          id: 1,
          type: 'noise',
          params: {
            color: 'white',
            dur: 0.08,
            amp: 0.3,
            pan: 0,
            envelope: { attack: 0, decay: 0.03, sustain: 0, release: 0.05 }
          } as NoiseParams
        }
      ],
      'Screenshot': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'sine',
          freq: { start: 2000, end: 1000, curve: 'linear' },
          dur: 0.1,
          amp: 0.3,
          pan: 0,
          envelope: { attack: 0, decay: 0.03, sustain: 0, release: 0.07 },
          useFreqAutomation: true
        } as ToneParams
      }],
      'USB Connect': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 500,
            dur: 0.1,
            amp: 0.3,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.02, sustain: 0.5, release: 0.07 }
          } as ToneParams
        },
        {
          id: 1,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 750,
            dur: 0.15,
            amp: 0.35,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.03, sustain: 0.6, release: 0.11 }
          } as ToneParams
        }
      ],
      'USB Disconnect': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 750,
            dur: 0.1,
            amp: 0.35,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.02, sustain: 0.5, release: 0.07 }
          } as ToneParams
        },
        {
          id: 1,
          type: 'tone',
          params: {
            wave: 'sine',
            freq: 500,
            dur: 0.15,
            amp: 0.3,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.03, sustain: 0.6, release: 0.11 }
          } as ToneParams
        }
      ],
      'Low Battery': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'square',
            freq: 300,
            dur: 0.2,
            amp: 0.4,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.05, sustain: 0.5, release: 0.14 }
          } as ToneParams
        },
        {
          id: 1,
          type: 'tone',
          params: {
            wave: 'square',
            freq: 250,
            dur: 0.2,
            amp: 0.3,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.05, sustain: 0.5, release: 0.14 }
          } as ToneParams
        }
      ],
      'Charging': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'sine',
          freq: { start: 400, end: 600, curve: 'smooth' },
          dur: 0.5,
          amp: 0.2,
          pan: 0,
          envelope: { attack: 0.1, decay: 0.1, sustain: 0.5, release: 0.3 },
          useFreqAutomation: true
        } as ToneParams
      }]
    },
    'Retro & 8-bit': {
      '8-bit Coin': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'square',
          freq: { start: 800, end: 1600, curve: 'linear' },
          dur: 0.15,
          amp: 0.4,
          pan: 0,
          envelope: { attack: 0, decay: 0.05, sustain: 0, release: 0.1 },
          useFreqAutomation: true
        } as ToneParams
      }],
      '8-bit Jump': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'square',
          freq: { start: 200, end: 600, curve: 'linear' },
          dur: 0.15,
          amp: 0.5,
          pan: 0,
          envelope: { attack: 0, decay: 0.05, sustain: 0.3, release: 0.1 },
          useFreqAutomation: true
        } as ToneParams
      }],
      '8-bit Death': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'square',
          freq: { start: 400, end: 50, curve: 'exp' },
          dur: 0.5,
          amp: 0.5,
          pan: 0,
          envelope: { attack: 0, decay: 0.1, sustain: 0.5, release: 0.4 },
          useFreqAutomation: true
        } as ToneParams
      }],
      'Arcade Blip': [{
        id: 0,
        type: 'tone',
        params: {
          wave: 'square',
          freq: 440,
          dur: 0.05,
          amp: 0.4,
          pan: 0,
          envelope: { attack: 0, decay: 0.02, sustain: 0, release: 0.03 }
        } as ToneParams
      }],
      'Retro Powerup': [
        {
          id: 0,
          type: 'tone',
          params: {
            wave: 'square',
            freq: { start: 200, end: 2000, curve: 'exp' },
            dur: 0.4,
            amp: 0.3,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.29 },
            useFreqAutomation: true
          } as ToneParams
        },
        {
          id: 1,
          type: 'tone',
          params: {
            wave: 'triangle',
            freq: { start: 100, end: 1000, curve: 'exp' },
            dur: 0.4,
            amp: 0.2,
            pan: 0,
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.29 },
            useFreqAutomation: true
          } as ToneParams
        }
      ]
    }
  }

  const loadPreset = (category: string, preset: string) => {
    // Stop any currently playing sound
    if (isPlaying) {
      stopSound()
    }

    const presets = presetCategories[category as keyof typeof presetCategories]
    if (presets && presets[preset as keyof typeof presets]) {
      const presetLayers = presets[preset as keyof typeof presets] as Layer[]
      layerIdCounterRef.current = presetLayers.length
      setLayers(presetLayers)
      setCurrentLayerId(0)
    }
  }

  const currentLayer = layers.find(l => l.id === currentLayerId)

  // Keyboard shortcut for play/stop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle spacebar for play/stop
      if (e.code === 'Space') {
        const activeElement = document.activeElement as HTMLElement

        // Only skip spacebar handling for textareas (where we need to type spaces)
        // For all other elements including sliders, we want spacebar to play/stop
        if (activeElement && activeElement.tagName === 'TEXTAREA') {
          return // Let textarea handle spacebar normally
        }

        // Prevent all default spacebar behaviors (scrolling, button clicking, slider focusing)
        e.preventDefault()

        // Trigger play/stop using current layer ref
        if (isPlaying) {
          stopSound()
        } else if (layersRef.current.length > 0) {
          playSound()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying]) // Removed layers.length dependency since we use ref now

  return (
    <>
      <Head>
        <title>SPA Sound Editor</title>
      </Head>

      <div className="min-h-screen bg-background text-gray-200 flex flex-col">
        {/* Header */}
        <header className="bg-surface px-6 py-4 flex items-center justify-between border-b border-primary/10">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-primary hover:text-secondary transition-colors">
              ← Back
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
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-surface border border-primary rounded-md hover:bg-primary transition-colors text-sm"
            >
              Import .spa
            </button>
            <button
              onClick={resetEditor}
              className="px-4 py-2 bg-surface border border-primary rounded-md hover:bg-primary transition-colors text-sm"
            >
              Reset
            </button>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-primary rounded-md hover:bg-primary-dark transition-colors text-sm"
            >
              Copy XML
            </button>
          </div>
        </header>

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

          {/* Main Editor */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_400px] gap-px bg-primary/10">
          {/* Layers Panel */}
          <div className="bg-background flex flex-col">
            <div className="bg-surface px-4 py-3 flex items-center justify-between border-b border-primary/10">
              <h2 className="text-primary font-semibold">Sound Layers</h2>
              <button
                onClick={() => addLayer()}
                className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-dark transition-colors"
              >
                + Add Layer
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {layers.map(layer => (
                <div
                  key={layer.id}
                  onClick={() => setCurrentLayerId(layer.id)}
                  className={`bg-surface border rounded-md mb-2 cursor-pointer transition-all ${
                    currentLayerId === layer.id
                      ? 'border-primary shadow-lg shadow-primary/20'
                      : 'border-primary/20 hover:border-primary/40'
                  }`}
                >
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-primary text-white text-xs rounded uppercase">
                        {layer.type}
                      </span>
                      <span className="text-sm">
                        {layer.type === 'tone'
                          ? (() => {
                              const params = layer.params as ToneParams
                              const freqDisplay = typeof params.freq === 'object'
                                ? `${params.freq.start}→${params.freq.end}Hz`
                                : `${params.freq}Hz`
                              return `${params.wave} @ ${freqDisplay}`
                            })()
                          : `${(layer.params as NoiseParams).color} noise`}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteLayer(layer.id)
                      }}
                      className="text-gray-400 hover:text-red-500 text-xl leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              {layers.length === 0 && (
                <p className="text-gray-500 text-center mt-8">No layers yet. Add one to start!</p>
              )}
            </div>
          </div>

          {/* Parameters Panel */}
          <div className="bg-background flex flex-col">
            <div className="bg-surface px-4 py-3 border-b border-primary/10">
              <h2 className="text-primary font-semibold">Layer Parameters</h2>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              {currentLayer ? (
                <div className="space-y-6">
                  {/* Type selector */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Type</label>
                    <select
                      value={currentLayer.type}
                      onChange={(e) => {
                        const newType = e.target.value as LayerType
                        updateLayer(currentLayer.id, {
                          type: newType,
                          params: getDefaultParams(newType)
                        })
                      }}
                      className="w-full px-3 py-2 bg-surface border border-primary/20 rounded text-white"
                    >
                      <option value="tone">Tone</option>
                      <option value="noise">Noise</option>
                    </select>
                  </div>

                  {/* Type-specific parameters */}
                  {currentLayer.type === 'tone' && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Waveform</label>
                        <select
                          value={(currentLayer.params as ToneParams).wave}
                          onChange={(e) => updateLayerParam(currentLayer.id, 'wave', e.target.value)}
                          className="w-full px-3 py-2 bg-surface border border-primary/20 rounded text-white"
                        >
                          <option value="sine">Sine</option>
                          <option value="square">Square</option>
                          <option value="sawtooth">Sawtooth</option>
                          <option value="triangle">Triangle</option>
                        </select>
                      </div>

                      {/* Frequency Control */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-400">
                            Frequency
                          </label>
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={(currentLayer.params as ToneParams).useFreqAutomation}
                              onChange={(e) => {
                                const params = currentLayer.params as ToneParams
                                if (e.target.checked) {
                                  updateLayer(currentLayer.id, {
                                    params: {
                                      ...params,
                                      freq: { start: 440, end: 880, curve: 'linear' },
                                      useFreqAutomation: true
                                    }
                                  })
                                } else {
                                  updateLayer(currentLayer.id, {
                                    params: {
                                      ...params,
                                      freq: 440,
                                      useFreqAutomation: false
                                    }
                                  })
                                }
                              }}
                            />
                            <span className="text-primary">Automate</span>
                          </label>
                        </div>

                        {(currentLayer.params as ToneParams).useFreqAutomation ? (
                          <div className="space-y-2 bg-surface/50 p-3 rounded">
                            <div>
                              <label className="text-xs text-gray-500">Start: {typeof (currentLayer.params as ToneParams).freq === 'object' ? (currentLayer.params as ToneParams).freq.start : 440}Hz</label>
                              <input
                                type="range"
                                min="20"
                                max="2000"
                                value={typeof (currentLayer.params as ToneParams).freq === 'object' ? (currentLayer.params as ToneParams).freq.start : 440}
                                onChange={(e) => {
                                  const params = currentLayer.params as ToneParams
                                  const freq = typeof params.freq === 'object' ? params.freq : { start: 440, end: 880, curve: 'linear' as const }
                                  updateLayer(currentLayer.id, {
                                    params: {
                                      ...params,
                                      freq: { ...freq, start: Number(e.target.value) }
                                    }
                                  })
                                }}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">End: {typeof (currentLayer.params as ToneParams).freq === 'object' ? (currentLayer.params as ToneParams).freq.end : 880}Hz</label>
                              <input
                                type="range"
                                min="20"
                                max="2000"
                                value={typeof (currentLayer.params as ToneParams).freq === 'object' ? (currentLayer.params as ToneParams).freq.end : 880}
                                onChange={(e) => {
                                  const params = currentLayer.params as ToneParams
                                  const freq = typeof params.freq === 'object' ? params.freq : { start: 440, end: 880, curve: 'linear' as const }
                                  updateLayer(currentLayer.id, {
                                    params: {
                                      ...params,
                                      freq: { ...freq, end: Number(e.target.value) }
                                    }
                                  })
                                }}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Curve</label>
                              <select
                                value={typeof (currentLayer.params as ToneParams).freq === 'object' ? (currentLayer.params as ToneParams).freq.curve : 'linear'}
                                onChange={(e) => {
                                  const params = currentLayer.params as ToneParams
                                  const freq = typeof params.freq === 'object' ? params.freq : { start: 440, end: 880, curve: 'linear' as const }
                                  updateLayer(currentLayer.id, {
                                    params: {
                                      ...params,
                                      freq: { ...freq, curve: e.target.value as 'linear' | 'exp' | 'smooth' }
                                    }
                                  })
                                }}
                                className="w-full px-2 py-1 bg-surface border border-primary/20 rounded text-white text-sm"
                              >
                                <option value="linear">Linear</option>
                                <option value="exp">Exponential</option>
                                <option value="smooth">Smooth</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="text-xs text-gray-500">{(currentLayer.params as ToneParams).freq}Hz</label>
                            <input
                              type="range"
                              min="20"
                              max="2000"
                              value={typeof (currentLayer.params as ToneParams).freq === 'number' ? (currentLayer.params as ToneParams).freq : 440}
                              onChange={(e) => updateLayerParam(currentLayer.id, 'freq', Number(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {currentLayer.type === 'noise' && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Color</label>
                      <select
                        value={(currentLayer.params as NoiseParams).color}
                        onChange={(e) => updateLayerParam(currentLayer.id, 'color', e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-primary/20 rounded text-white"
                      >
                        <option value="white">White</option>
                        <option value="pink">Pink</option>
                        <option value="brown">Brown</option>
                        <option value="blue">Blue</option>
                      </select>
                    </div>
                  )}

                  {/* Common parameters */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Duration: {currentLayer.params.dur}s
                    </label>
                    <input
                      type="range"
                      min="0.01"
                      max="3"
                      step="0.01"
                      value={currentLayer.params.dur}
                      onChange={(e) => updateLayerParam(currentLayer.id, 'dur', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Amplitude Control */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-400">
                        Amplitude
                      </label>
                      {currentLayer.type === 'tone' && (
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={(currentLayer.params as ToneParams).useAmpAutomation}
                            onChange={(e) => {
                              const params = currentLayer.params as ToneParams
                              if (e.target.checked) {
                                updateLayer(currentLayer.id, {
                                  params: {
                                    ...params,
                                    amp: { start: 0.5, end: 1, curve: 'linear' },
                                    useAmpAutomation: true
                                  }
                                })
                              } else {
                                updateLayer(currentLayer.id, {
                                  params: {
                                    ...params,
                                    amp: 1,
                                    useAmpAutomation: false
                                  }
                                })
                              }
                            }}
                          />
                          <span className="text-primary">Automate</span>
                        </label>
                      )}
                    </div>

                    {currentLayer.type === 'tone' && (currentLayer.params as ToneParams).useAmpAutomation ? (
                      <div className="space-y-2 bg-surface/50 p-3 rounded">
                        <div>
                          <label className="text-xs text-gray-500">Start: {typeof (currentLayer.params as ToneParams).amp === 'object' ? (currentLayer.params as ToneParams).amp.start : 0.5}</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={typeof (currentLayer.params as ToneParams).amp === 'object' ? (currentLayer.params as ToneParams).amp.start : 0.5}
                            onChange={(e) => {
                              const params = currentLayer.params as ToneParams
                              const amp = typeof params.amp === 'object' ? params.amp : { start: 0.5, end: 1, curve: 'linear' as const }
                              updateLayer(currentLayer.id, {
                                params: {
                                  ...params,
                                  amp: { ...amp, start: Number(e.target.value) }
                                }
                              })
                            }}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">End: {typeof (currentLayer.params as ToneParams).amp === 'object' ? (currentLayer.params as ToneParams).amp.end : 1}</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={typeof (currentLayer.params as ToneParams).amp === 'object' ? (currentLayer.params as ToneParams).amp.end : 1}
                            onChange={(e) => {
                              const params = currentLayer.params as ToneParams
                              const amp = typeof params.amp === 'object' ? params.amp : { start: 0.5, end: 1, curve: 'linear' as const }
                              updateLayer(currentLayer.id, {
                                params: {
                                  ...params,
                                  amp: { ...amp, end: Number(e.target.value) }
                                }
                              })
                            }}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Curve</label>
                          <select
                            value={typeof (currentLayer.params as ToneParams).amp === 'object' ? (currentLayer.params as ToneParams).amp.curve : 'linear'}
                            onChange={(e) => {
                              const params = currentLayer.params as ToneParams
                              const amp = typeof params.amp === 'object' ? params.amp : { start: 0.5, end: 1, curve: 'linear' as const }
                              updateLayer(currentLayer.id, {
                                params: {
                                  ...params,
                                  amp: { ...amp, curve: e.target.value as 'linear' | 'exp' | 'smooth' }
                                }
                              })
                            }}
                            className="w-full px-2 py-1 bg-surface border border-primary/20 rounded text-white text-sm"
                          >
                            <option value="linear">Linear</option>
                            <option value="exp">Exponential</option>
                            <option value="smooth">Smooth</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs text-gray-500">{typeof currentLayer.params.amp === 'number' ? currentLayer.params.amp : 1}</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={typeof currentLayer.params.amp === 'number' ? currentLayer.params.amp : 1}
                          onChange={(e) => updateLayerParam(currentLayer.id, 'amp', Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Pan: {currentLayer.params.pan}
                    </label>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.01"
                      value={currentLayer.params.pan}
                      onChange={(e) => updateLayerParam(currentLayer.id, 'pan', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Filter */}
                  <div className="bg-surface p-4 rounded-lg border border-primary/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-primary text-sm font-semibold uppercase tracking-wider">
                        Filter
                      </h4>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={currentLayer.params.filter?.enabled || false}
                          onChange={(e) => {
                            const currentFilter = currentLayer.params.filter || {
                              enabled: false,
                              type: 'lowpass' as const,
                              freq: 1000,
                              resonance: 1
                            }
                            updateLayer(currentLayer.id, {
                              params: {
                                ...currentLayer.params,
                                filter: {
                                  ...currentFilter,
                                  enabled: e.target.checked
                                }
                              }
                            })
                          }}
                        />
                        <span className="text-primary">Enable</span>
                      </label>
                    </div>

                    {currentLayer.params.filter?.enabled && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Type</label>
                          <select
                            value={currentLayer.params.filter?.type || 'lowpass'}
                            onChange={(e) => {
                              const currentFilter = currentLayer.params.filter || {
                                enabled: true,
                                type: 'lowpass' as const,
                                freq: 1000,
                                resonance: 1
                              }
                              updateLayer(currentLayer.id, {
                                params: {
                                  ...currentLayer.params,
                                  filter: {
                                    ...currentFilter,
                                    type: e.target.value as 'lowpass' | 'highpass' | 'bandpass' | 'notch'
                                  }
                                }
                              })
                            }}
                            className="w-full px-3 py-2 bg-surface border border-primary/20 rounded text-white"
                          >
                            <option value="lowpass">Lowpass</option>
                            <option value="highpass">Highpass</option>
                            <option value="bandpass">Bandpass</option>
                            <option value="notch">Notch</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Cutoff: {currentLayer.params.filter?.freq || 1000}Hz
                          </label>
                          <input
                            type="range"
                            min="20"
                            max="20000"
                            value={currentLayer.params.filter?.freq || 1000}
                            onChange={(e) => {
                              const currentFilter = currentLayer.params.filter || {
                                enabled: true,
                                type: 'lowpass' as const,
                                freq: 1000,
                                resonance: 1
                              }
                              updateLayer(currentLayer.id, {
                                params: {
                                  ...currentLayer.params,
                                  filter: {
                                    ...currentFilter,
                                    freq: Number(e.target.value)
                                  }
                                }
                              })
                            }}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Resonance (Q): {currentLayer.params.filter?.resonance || 1}
                          </label>
                          <input
                            type="range"
                            min="0.1"
                            max="30"
                            step="0.1"
                            value={currentLayer.params.filter?.resonance || 1}
                            onChange={(e) => {
                              const currentFilter = currentLayer.params.filter || {
                                enabled: true,
                                type: 'lowpass' as const,
                                freq: 1000,
                                resonance: 1
                              }
                              updateLayer(currentLayer.id, {
                                params: {
                                  ...currentLayer.params,
                                  filter: {
                                    ...currentFilter,
                                    resonance: Number(e.target.value)
                                  }
                                }
                              })
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Envelope */}
                  <div className="bg-surface p-4 rounded-lg border border-primary/10">
                    <h4 className="text-primary text-sm font-semibold mb-4 uppercase tracking-wider">
                      Envelope (ADSR)
                    </h4>
                    <div className="space-y-3">
                      {['attack', 'decay', 'sustain', 'release'].map(param => (
                        <div key={param}>
                          <label className="block text-sm text-gray-400 mb-1 capitalize">
                            {param}: {currentLayer.params.envelope[param as keyof Envelope]}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={currentLayer.params.envelope[param as keyof Envelope]}
                            onChange={(e) => updateLayerParam(currentLayer.id, param, Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center mt-8">Select a layer to edit its parameters</p>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-background flex flex-col">
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
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md font-semibold transition-colors flex items-center justify-center gap-2 relative"
                title="Press spacebar to play/stop"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play Sound
                <span className="text-xs opacity-75 absolute bottom-1 right-2">[Space]</span>
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
                  <svg className="w-8 h-8 mx-auto mb-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="text-sm">
                    Click to select a .spa file from your computer
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-primary/20"></div>
                <span className="text-gray-500 text-sm">OR</span>
                <div className="flex-1 h-px bg-primary/20"></div>
              </div>

              {/* Text Paste Option */}
              <div className="space-y-3">
                <h3 className="text-primary font-semibold">Option 2: Paste SPA XML</h3>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`<?xml version="1.0" encoding="UTF-8"?>
<spa version="1.0">
  <tone wave="sine" freq="440" dur="0.5"/>
</spa>`}
                  className="w-full h-48 bg-surface text-white p-4 rounded-lg border border-primary/20 font-mono text-sm resize-none focus:border-primary outline-none"
                />
                <button
                  onClick={importFromText}
                  disabled={!importText.trim()}
                  className="w-full py-2 bg-primary hover:bg-primary-dark disabled:bg-surface disabled:text-gray-500 disabled:cursor-not-allowed rounded-md font-semibold transition-colors"
                >
                  Import from Text
                </button>
              </div>

              {/* Example Files */}
              <div className="space-y-3">
                <h3 className="text-gray-400 text-sm">Example SPA files to try:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <button
                    onClick={() => setImportText(`<?xml version="1.0" encoding="UTF-8"?>
<spa version="1.0">
  <tone wave="sine" freq.start="200" freq.end="800" freq.curve="exp" dur="0.3" envelope="0,0.1,0,0.2"/>
</spa>`)}
                    className="py-2 px-3 bg-surface border border-primary/20 hover:bg-primary hover:border-primary rounded text-left transition-colors"
                  >
                    Sweep Effect
                  </button>
                  <button
                    onClick={() => setImportText(`<?xml version="1.0" encoding="UTF-8"?>
<spa version="1.0">
  <group>
    <tone wave="triangle" freq="261.63" dur="0.2" envelope="0.01,0.05,0.7,0.1"/>
    <tone wave="triangle" freq="329.63" dur="0.2" envelope="0.01,0.05,0.7,0.1"/>
    <tone wave="triangle" freq="392" dur="0.3" envelope="0.01,0.05,0.7,0.2"/>
  </group>
</spa>`)}
                    className="py-2 px-3 bg-surface border border-primary/20 hover:bg-primary hover:border-primary rounded text-left transition-colors"
                  >
                    Musical Chord
                  </button>
                  <button
                    onClick={() => setImportText(`<?xml version="1.0" encoding="UTF-8"?>
<spa version="1.0">
  <noise color="pink" dur="0.5" filter="highpass" cutoff="2000" envelope="0.1,0.1,0.3,0.2"/>
</spa>`)}
                    className="py-2 px-3 bg-surface border border-primary/20 hover:bg-primary hover:border-primary rounded text-left transition-colors"
                  >
                    Filtered Noise
                  </button>
                  <button
                    onClick={() => setImportText(`<?xml version="1.0" encoding="UTF-8"?>
<spa version="1.0">
  <tone wave="sawtooth" freq.start="2000" freq.end="100" freq.curve="exp" dur="0.3" filter="lowpass" cutoff="3000" resonance="5" envelope="0,0.1,0,0.2"/>
</spa>`)}
                    className="py-2 px-3 bg-surface border border-primary/20 hover:bg-primary hover:border-primary rounded text-left transition-colors"
                  >
                    Laser with Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}