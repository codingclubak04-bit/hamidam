import { useId } from 'react'

export function MoonMark({ className }: { className?: string }) {
  const id = useId()
  const gradientId = `moonMarkGradient-${id}`
  const maskId = `moonMarkMask-${id}`

  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--color-accent-light)' }} />
          <stop offset="60%" style={{ stopColor: 'var(--color-accent)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--color-accent-dark)' }} />
        </linearGradient>
        <mask id={maskId}>
          <rect width="120" height="120" fill="#fff" />
          <circle cx="80" cy="48" r="33" fill="#000" />
        </mask>
      </defs>
      <circle cx="58" cy="60" r="38" fill={`url(#${gradientId})`} mask={`url(#${maskId})`} />
    </svg>
  )
}
