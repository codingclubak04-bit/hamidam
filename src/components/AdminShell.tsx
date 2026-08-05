import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MoonMark } from './MoonMark'
import { ThemeToggle } from './ThemeToggle'
import { IconBox, IconBuilding, IconChevronRight, IconHome, IconKey, IconLogout, IconUsers } from './DashboardIcons'

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

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed'

export function AdminShell({ title, children }: AdminShellProps) {
  const { pathname } = useLocation()
  const { signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1')

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <div
      className={
        'min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10 transition-[padding-left] duration-200 ' +
        (collapsed ? 'lg:pl-28' : 'lg:pl-72')
      }
    >
      <div className="hidden lg:block">
        <ThemeToggle />
      </div>

      <aside
        className={
          'fixed inset-y-0 left-0 hidden flex-col border-r border-border bg-surface/80 backdrop-blur transition-[width] duration-200 lg:flex ' +
          (collapsed ? 'w-20' : 'w-64')
        }
      >
        <Link to="/admin" className="flex items-center gap-2.5 px-6 py-6">
          <MoonMark className="h-8 w-8 shrink-0" />
          {!collapsed && <span className="truncate font-serif-kr text-lg font-bold text-foreground">슈퍼관리자 콘솔</span>}
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ' +
                  (collapsed ? 'justify-center' : '') +
                  ' ' +
                  (active
                    ? 'bg-accent/15 text-accent'
                    : 'text-muted-foreground hover:bg-input hover:text-foreground')
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && label}
              </Link>
            )
          })}
        </nav>
        <div className="space-y-2 border-t border-border p-3">
          {pathname !== '/admin' && (
            <Link
              to="/admin"
              title={collapsed ? '관리자 홈으로' : undefined}
              className={
                'flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent ' +
                (collapsed ? 'justify-center' : '')
              }
            >
              <IconChevronRight className="h-4 w-4 rotate-180 shrink-0" />
              {!collapsed && '관리자 홈으로'}
            </Link>
          )}
          <Link
            to="/"
            title={collapsed ? '메인 대시보드로' : undefined}
            className={
              'flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent ' +
              (collapsed ? 'justify-center' : '')
            }
          >
            <IconHome className="h-4 w-4 shrink-0" />
            {!collapsed && '메인 대시보드로'}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          className="flex items-center justify-center gap-2 border-t border-border px-6 py-3 text-sm text-muted-foreground hover:text-accent"
        >
          <IconChevronRight className={'h-4 w-4 transition-transform ' + (collapsed ? '' : 'rotate-180')} />
          {!collapsed && '접기'}
        </button>
      </aside>

      <header className="sticky top-0 z-40 -mx-4 -mt-10 mb-6 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-2.5 shadow-sm backdrop-blur lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <MoonMark className="h-7 w-7 shrink-0" />
          {pathname !== '/admin' ? (
            <Link
              to="/admin"
              className="flex items-center gap-1 truncate text-sm font-medium text-muted-foreground hover:text-accent"
            >
              <IconChevronRight className="h-3.5 w-3.5 rotate-180 shrink-0" />
              관리자 홈으로
            </Link>
          ) : (
            <span className="truncate text-sm font-semibold text-foreground">슈퍼관리자 콘솔</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Link
            to="/"
            title="메인 대시보드로"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:bg-input hover:text-accent"
          >
            <IconHome className="h-[18px] w-[18px]" />
          </Link>
          <ThemeToggle inline />
          <button
            type="button"
            onClick={signOut}
            title="로그아웃"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:bg-input hover:text-accent"
          >
            <IconLogout className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 font-serif-kr text-2xl font-bold text-foreground">{title}</h1>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  )
}
