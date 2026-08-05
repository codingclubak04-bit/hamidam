import { useBgm } from '../context/BgmContext'

export function BgmToggleButton({ inline = false }: { inline?: boolean }) {
  const { isPlaying, toggle } = useBgm()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isPlaying ? '배경음악 정지' : '배경음악 재생'}
      className={
        inline
          ? 'inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:bg-input hover:text-accent'
          : 'fixed right-4 top-4 z-40 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/95 text-foreground/70 shadow-sm backdrop-blur transition hover:border-accent hover:text-accent'
      }
    >
      {isPlaying ? (
        <span className="flex h-4 w-4 origin-bottom items-end justify-center gap-[2px]" aria-hidden="true">
          <span
            className="h-full w-[3px] rounded-full bg-current animate-[hamidam-eq-bounce_0.7s_ease-in-out_infinite]"
            style={{ transformOrigin: 'bottom' }}
          />
          <span
            className="h-full w-[3px] rounded-full bg-current animate-[hamidam-eq-bounce_0.6s_ease-in-out_infinite]"
            style={{ transformOrigin: 'bottom', animationDelay: '0.15s' }}
          />
          <span
            className="h-full w-[3px] rounded-full bg-current animate-[hamidam-eq-bounce_0.8s_ease-in-out_infinite]"
            style={{ transformOrigin: 'bottom', animationDelay: '0.3s' }}
          />
        </span>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M7 4.5v15l13-7.5z" />
        </svg>
      )}
    </button>
  )
}
