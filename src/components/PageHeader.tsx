import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MoonMark } from './MoonMark'
import { HeaderMenu } from './HeaderMenu'
import { IconChevronRight } from './DashboardIcons'

interface PageHeaderProps {
  backTo?: { to: string; label: string }
}

export function PageHeader({ backTo }: PageHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const canGoBack = location.key !== 'default'

  const handleBack = () => {
    if (canGoBack) navigate(-1)
    else navigate(backTo?.to ?? '/')
  }

  return (
    <header className="sticky top-0 z-40 -mx-4 -mt-10 mb-6 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-2.5 shadow-sm backdrop-blur">
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          onClick={handleBack}
          aria-label="이전 화면으로"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-input hover:text-accent"
        >
          <IconChevronRight className="h-4 w-4 rotate-180" />
        </button>
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <MoonMark className="h-7 w-7 shrink-0" />
          <span className="truncate font-serif-kr text-base font-bold text-foreground">하미담</span>
        </Link>
      </div>
      <HeaderMenu links={[...(backTo ? [backTo] : []), { to: '/', label: '대시보드로' }]} />
    </header>
  )
}
