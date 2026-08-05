import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface BgmContextValue {
  isPlaying: boolean
  toggle: () => void
  play: () => void
}

const BgmContext = createContext<BgmContextValue | null>(null)

export function BgmProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const audio = new Audio('/audio/bgm.mp3')
    audio.loop = true
    audio.volume = 0.35
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audioRef.current = null
    }
  }, [])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [])

  const play = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audio.paused) return
    audio.play().catch(() => {})
  }, [])

  return <BgmContext.Provider value={{ isPlaying, toggle, play }}>{children}</BgmContext.Provider>
}

export function useBgm() {
  const ctx = useContext(BgmContext)
  if (!ctx) throw new Error('useBgm must be used within BgmProvider')
  return ctx
}
