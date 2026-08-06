import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BgmToggleButton } from './BgmToggleButton'
import { ThemeToggle } from './ThemeToggle'
import { NotificationToggleButton } from './NotificationToggleButton'

interface HeaderMenuLink {
  to: string
  label: string
}

interface HeaderMenuProps {
  onSignOut?: () => void
  links?: HeaderMenuLink[]
  showBgm?: boolean
}

export function HeaderMenu({ onSignOut, links = [], showBgm = true }: HeaderMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="메뉴 열기"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:bg-input hover:text-accent"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-[0_18px_38px_-16px_rgba(0,0,0,0.3)] divide-y divide-border">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-left text-sm text-foreground transition hover:bg-input"
            >
              {link.label}
            </Link>
          ))}
          {showBgm && (
            <div className="flex items-center justify-between px-4 py-2.5 text-sm text-foreground">
              배경음악
              <BgmToggleButton inline />
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-2.5 text-sm text-foreground">
            다크 모드
            <ThemeToggle inline />
          </div>
          <NotificationToggleButton />
          {onSignOut && (
            <button
              type="button"
              onClick={() => {
                onSignOut()
                setOpen(false)
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-muted-foreground transition hover:bg-input hover:text-accent"
            >
              로그아웃
            </button>
          )}
        </div>
      )}
    </div>
  )
}
