import { useEffect, useRef, useState } from 'react'
import { MoonMark } from './MoonMark'
import { useBgm } from '../context/BgmContext'

const EXIT_DURATION = 380

export function SplashIntro({ onDone }: { onDone: () => void }) {
  const { play: playBgm } = useBgm()
  const narrationRef = useRef<HTMLAudioElement | null>(null)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const narration = new Audio('/audio/narration-female.wav')
    narrationRef.current = narration
    narration.play().catch(() => {})
    playBgm()
    return () => narration.pause()
  }, [playBgm])

  const resumeAudioIfBlocked = () => {
    narrationRef.current?.play().catch(() => {})
    playBgm()
  }

  const handleConfirm = () => {
    setExiting(true)
    window.setTimeout(onDone, EXIT_DURATION)
  }

  return (
    <div
      onPointerDown={resumeAudioIfBlocked}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[radial-gradient(120%_100%_at_50%_20%,_var(--color-background-alt)_0%,_var(--color-background)_65%)] px-6 text-center transition-opacity duration-[380ms] ease-out ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[30%] h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-[110px] animate-[hamidam-moonlight-wash_7s_ease-in-out_infinite_alternate]"
        style={{ backgroundColor: 'var(--color-accent-light)' }}
      />
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div
          className="absolute h-28 w-28 rounded-full opacity-0 blur-2xl animate-[hamidam-glow-pulse_3.6s_ease-in-out_infinite]"
          style={{ backgroundColor: 'var(--color-accent-light)', animationDelay: '0.9s' }}
        />
        <span
          className="absolute h-2 w-2 rounded-full blur-[1px] opacity-0 animate-[hamidam-particle-rise_5s_ease-out_infinite]"
          style={{ backgroundColor: 'var(--color-accent-light)', top: '10%', left: '14%', animationDelay: '1.1s' }}
        />
        <span
          className="absolute h-1.5 w-1.5 rounded-full blur-[1px] opacity-0 animate-[hamidam-particle-rise_5.6s_ease-out_infinite]"
          style={{ backgroundColor: 'var(--color-accent-light)', top: '58%', right: '6%', animationDelay: '2.8s' }}
        />
        <span
          className="absolute h-1.5 w-1.5 rounded-full blur-[1px] opacity-0 animate-[hamidam-particle-rise_4.8s_ease-out_infinite]"
          style={{ backgroundColor: 'var(--color-accent)', bottom: '10%', left: '40%', animationDelay: '4s' }}
        />
        <MoonMark className="relative h-20 w-20 opacity-0 animate-[hamidam-scale-fade_1s_ease-out_forwards,hamidam-moon-glow_4.5s_ease-in-out_1s_infinite_alternate]" />
      </div>
      <div className="max-w-sm font-serif-kr text-lg leading-relaxed text-foreground">
        <span
          className="block whitespace-nowrap opacity-0 animate-[hamidam-fade-up_0.8s_ease-out_forwards]"
          style={{ animationDelay: '0.5s' }}
        >
          달빛은 길을 비춰주는
        </span>
        <span
          className="block whitespace-nowrap opacity-0 animate-[hamidam-fade-up_0.8s_ease-out_forwards]"
          style={{ animationDelay: '0.65s' }}
        >
          따뜻한 위로의 빛입니다.
        </span>
        <span
          className="block whitespace-nowrap opacity-0 animate-[hamidam-fade-up_0.8s_ease-out_forwards]"
          style={{ animationDelay: '0.8s' }}
        >
          그 빛처럼 하미담은
        </span>
        <span
          className="block whitespace-nowrap opacity-0 animate-[hamidam-fade-up_0.8s_ease-out_forwards]"
          style={{ animationDelay: '0.95s' }}
        >
          소중한 기억과 마음을
        </span>
        <span
          className="block whitespace-nowrap opacity-0 animate-[hamidam-fade-up_0.8s_ease-out_forwards]"
          style={{ animationDelay: '1.1s' }}
        >
          정성으로 담아 전합니다.
        </span>
      </div>
      <button
        type="button"
        onClick={handleConfirm}
        className="rounded-lg bg-gradient-to-r from-accent-light to-accent px-8 py-3 text-base font-semibold text-accent-foreground opacity-0 hover:brightness-105 animate-[hamidam-button-pop_1s_ease-out_forwards]"
        style={{ animationDelay: '1.9s' }}
      >
        확인
      </button>
    </div>
  )
}
