import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { playSPA } from '@spa-audio/core'

interface SoundContextType {
  isMuted: boolean
  toggleMute: () => void
  playSound: (presetPath: string) => Promise<void>
}

const SoundContext = createContext<SoundContextType | undefined>(undefined)

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(true) // Start muted by default
  const [isLoaded, setIsLoaded] = useState(false)

  // Load mute state from cookie on mount
  useEffect(() => {
    const cookies = document.cookie.split(';')
    const muteCookie = cookies.find(c => c.trim().startsWith('spa-muted='))
    if (muteCookie) {
      const value = muteCookie.split('=')[1]
      setIsMuted(value === 'true')
    }
    setIsLoaded(true)
  }, [])

  // Save mute state to cookie whenever it changes
  useEffect(() => {
    if (isLoaded) {
      document.cookie = `spa-muted=${isMuted}; path=/; max-age=${60 * 60 * 24 * 365}` // 1 year
    }
  }, [isMuted, isLoaded])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  const playSound = useCallback(async (presetPath: string) => {
    if (isMuted) return

    try {
      const response = await fetch(`/presets/${presetPath}.spa`)
      if (!response.ok) return
      const spaContent = await response.text()
      // Use built-in playSPA with automatic optimization
      await playSPA(spaContent)
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }, [isMuted])

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playSound }}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSound() {
  const context = useContext(SoundContext)
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider')
  }
  return context
}
