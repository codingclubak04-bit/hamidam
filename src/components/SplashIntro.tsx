import { useEffect } from 'react'
import { MoonMark } from './MoonMark'
import { useBgm } from '../context/BgmContext'

export function SplashIntro({ onDone }: { onDone: () => void }) {
  const { play: playBgm } = useBgm()

  useEffect(() => {
    const narration = new Audio('/audio/narration-female.wav')
    narration.play().catch(() => {})
    playBgm()
    return () => narration.pause()
  }, [playBgm])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[radial-gradient(120%_100%_at_50%_20%,_var(--color-background-alt)_0%,_var(--color-background)_65%)] px-6 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div
          className="absolute h-28 w-28 rounded-full opacity-0 blur-2xl animate-[hamidam-glow-pulse_3.2s_ease-in-out_infinite]"
          style={{ backgroundColor: 'var(--color-accent-light)', animationDelay: '0.9s' }}
        />
        <span
          className="absolute h-1.5 w-1.5 rounded-full opacity-0 animate-[hamidam-particle-rise_3.4s_ease-out_infinite]"
          style={{ backgroundColor: 'var(--color-accent-light)', top: '15%', left: '18%', animationDelay: '0.9s' }}
        />
        <span
          className="absolute h-1 w-1 rounded-full opacity-0 animate-[hamidam-particle-rise_3.4s_ease-out_infinite]"
          style={{ backgroundColor: 'var(--color-accent-light)', top: '55%', right: '8%', animationDelay: '2s' }}
        />
        <span
          className="absolute h-1.5 w-1.5 rounded-full opacity-0 animate-[hamidam-particle-rise_3.4s_ease-out_infinite]"
          style={{ backgroundColor: 'var(--color-accent-light)', bottom: '5%', left: '45%', animationDelay: '3.1s' }}
        />
        <MoonMark className="relative h-20 w-20 opacity-0 animate-[hamidam-scale-fade_1s_ease-out_forwards]" />
      </div>
      <div className="max-w-sm font-serif-kr text-lg leading-relaxed text-foreground">
        <span
          className="block whitespace-nowrap opacity-0 animate-[hamidam-fade-up_0.9s_ease-out_forwards]"
          style={{ animationDelay: '0.5s' }}
        >
          달빛은 길을 비춰주는
        </span>
        <span
          className="block whitespace-nowrap opacity-0 animate-[hamidam-fade-up_0.9s_ease-out_forwards]"
          style={{ animationDelay: '0.65s' }}
        >
          따뜻한 위로의 빛입니다.
        </span>
        <span
          className="block whitespace-nowrap opacity-0 animate-[hamidam-fade-up_0.9s_ease-out_forwards]"
          style={{ animationDelay: '0.8s' }}
        >
          그 빛처럼 하미담은
        </span>
        <span
          className="block whitespace-nowrap opacity-0 animate-[hamidam-fade-up_0.9s_ease-out_forwards]"
          style={{ animationDelay: '0.95s' }}
        >
          소중한 기억과 마음을
        </span>
        <span
          className="block whitespace-nowrap opacity-0 animate-[hamidam-fade-up_0.9s_ease-out_forwards]"
          style={{ animationDelay: '1.1s' }}
        >
          정성으로 담아 전합니다.
        </span>
      </div>
      <button
        type="button"
        onClick={onDone}
        className="rounded-lg bg-gradient-to-r from-accent-light to-accent px-8 py-3 text-base font-semibold text-accent-foreground opacity-0 hover:brightness-105 animate-[hamidam-button-pop_1s_ease-out_forwards]"
        style={{ animationDelay: '2.6s' }}
      >
        확인
      </button>
    </div>
  )
}
