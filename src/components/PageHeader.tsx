import { Link } from 'react-router-dom'
import { MoonMark } from './MoonMark'
import { ThemeToggle } from './ThemeToggle'

export function PageHeader() {
  return (
    <header className="sticky top-0 z-40 -mx-4 -mt-10 mb-6 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-2.5 shadow-sm backdrop-blur">
      <Link to="/" className="flex items-center gap-2">
        <MoonMark className="h-7 w-7" />
        <span className="font-serif-kr text-base font-bold text-foreground">하미담</span>
      </Link>
      <div className="flex items-center gap-0.5">
        <ThemeToggle inline />
        <Link
          to="/"
          className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-input hover:text-accent"
        >
          대시보드로
        </Link>
      </div>
    </header>
  )
}
