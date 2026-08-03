import type { ReactNode } from 'react'
import { MoonMark } from './MoonMark'
import { ThemeToggle } from './ThemeToggle'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10">
      <ThemeToggle />
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <MoonMark className="mx-auto h-11 w-11" />
          <h1 className="mt-3 font-serif-kr text-xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface/80 p-6 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
      </div>
    </div>
  )
}
