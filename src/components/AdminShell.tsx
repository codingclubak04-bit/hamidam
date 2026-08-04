import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MoonMark } from './MoonMark'
import { ThemeToggle } from './ThemeToggle'
import { IconBox, IconBuilding, IconKey, IconUsers } from './DashboardIcons'

interface AdminShellProps {
  title: string
  children: ReactNode
}

const navItems = [
  { to: '/admin/accounts', label: '관리자 계정 관리', icon: IconKey },
  { to: '/admin/products', label: '상품 관리', icon: IconBox },
  { to: '/admin/partners', label: '파트너사 관리', icon: IconBuilding },
  { to: '/admin/sales-reps', label: '팀장 관리', icon: IconUsers },
]

export function AdminShell({ title, children }: AdminShellProps) {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10 lg:pl-72">
      <ThemeToggle />

      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-surface/80 backdrop-blur lg:flex">
        <Link to="/admin" className="flex items-center gap-2.5 px-6 py-6">
          <MoonMark className="h-8 w-8" />
          <span className="font-serif-kr text-lg font-bold text-foreground">슈퍼관리자 콘솔</span>
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ' +
                  (active
                    ? 'bg-accent/15 text-accent'
                    : 'text-muted-foreground hover:bg-input hover:text-foreground')
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </Link>
            )
          })}
        </nav>
        <Link
          to="/"
          className="border-t border-border px-6 py-4 text-sm text-muted-foreground hover:text-accent hover:underline"
        >
          ← 대시보드로
        </Link>
      </aside>

      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <MoonMark className="h-9 w-9" />
          <div>
            <Link to="/" className="text-base text-muted-foreground hover:text-accent hover:underline">
              ← 대시보드로
            </Link>
            <h1 className="font-serif-kr text-2xl font-bold text-foreground">{title}</h1>
          </div>
        </div>
        <h1 className="mb-6 hidden font-serif-kr text-2xl font-bold text-foreground lg:block">{title}</h1>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  )
}
