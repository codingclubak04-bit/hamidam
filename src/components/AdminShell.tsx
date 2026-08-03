import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MoonMark } from './MoonMark'
import { ThemeToggle } from './ThemeToggle'

interface AdminShellProps {
  title: string
  children: ReactNode
}

export function AdminShell({ title, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10">
      <ThemeToggle />
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <MoonMark className="h-9 w-9" />
          <div>
            <Link to="/" className="text-base text-muted-foreground hover:text-accent hover:underline">
              ← 대시보드로
            </Link>
            <h1 className="font-serif-kr text-2xl font-bold text-foreground">{title}</h1>
          </div>
        </div>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  )
}
