import { useSound } from '../contexts/SoundContext'

export default function MuteButton() {
  const { isMuted, toggleMute, playSound } = useSound()

  const handleToggle = () => {
    toggleMute()
    // Play a sound when unmuting
    if (isMuted) {
      setTimeout(() => {
        playSound('ui-feedback/button-click')
      }, 50)
    }
  }

  return (
    <button
      onClick={handleToggle}
      className="fixed top-4 right-4 z-50 p-3 bg-surface border border-primary/20 rounded-lg hover:border-primary/40 hover:bg-primary/10 transition-all duration-200 group"
      title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {isMuted ? (
        <svg className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg className="w-6 h-6 text-primary group-hover:text-secondary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  )
}
