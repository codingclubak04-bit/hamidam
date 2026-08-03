import { useEffect } from 'react'
import { MoonMark } from './MoonMark'

export function SplashIntro({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3400)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div
      onClick={onDone}
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-6 bg-[radial-gradient(120%_100%_at_50%_20%,_var(--color-background-alt)_0%,_var(--color-background)_65%)] px-6 text-center"
    >
      <MoonMark className="h-20 w-20 opacity-0 animate-[hamidam-fade_1.2s_ease-out_forwards]" />
      <p
        className="max-w-sm font-serif-kr text-lg leading-relaxed text-foreground opacity-0 animate-[hamidam-fade-up_1.2s_ease-out_forwards]"
        style={{ animationDelay: '0.6s' }}
      >
        달빛은 길을 비춰주는 따뜻한 위로의 빛입니다.
        <br />그 빛처럼 하미담은 소중한 기억과 마음을
        <br />
        정성으로 담아 전합니다.
      </p>
      <p
        className="text-sm text-muted-foreground opacity-0 animate-[hamidam-fade_1s_ease-out_forwards]"
        style={{ animationDelay: '2.6s' }}
      >
        화면을 누르면 바로 시작합니다
      </p>
    </div>
  )
}
