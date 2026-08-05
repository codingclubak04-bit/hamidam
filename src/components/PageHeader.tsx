import { Link } from 'react-router-dom'
import { MoonMark } from './MoonMark'
import { HeaderMenu } from './HeaderMenu'

interface PageHeaderProps {
  backTo?: { to: string; label: string }
}

export function PageHeader({ backTo }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 -mx-4 -mt-10 mb-6 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-2.5 shadow-sm backdrop-blur">
      <Link to="/" className="flex items-center gap-2">
        <MoonMark className="h-7 w-7" />
        <span className="font-serif-kr text-base font-bold text-foreground">하미담</span>
      </Link>
      <HeaderMenu links={[...(backTo ? [backTo] : []), { to: '/', label: '대시보드로' }]} />
    </header>
  )
}
