import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MoonMark } from '../components/MoonMark'
import { ThemeToggle } from '../components/ThemeToggle'
import { SplashIntro } from '../components/SplashIntro'
import {
  IconBox,
  IconChevronRight,
  IconGallery,
  IconList,
  IconOrder,
  IconShield,
} from '../components/DashboardIcons'

const SPLASH_SEEN_KEY = 'hamidam-splash-shown'

export default function RoleLanding() {
  const { profile, signOut } = useAuth()
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem(SPLASH_SEEN_KEY))

  const dismissSplash = () => {
    sessionStorage.setItem(SPLASH_SEEN_KEY, '1')
    setShowSplash(false)
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-base text-muted-foreground">
        불러오는 중...
      </div>
    )
  }

  if (profile.status === 'pending') {
    return (
      <Shell onSignOut={signOut}>
        <h1 className="font-serif-kr text-xl font-bold text-foreground">승인 대기 중입니다</h1>
        <p className="mt-2 text-base text-muted-foreground">
          하미담 슈퍼관리자의 승인 후 이용하실 수 있습니다.
        </p>
      </Shell>
    )
  }

  if (profile.status === 'disabled') {
    return (
      <Shell onSignOut={signOut}>
        <h1 className="font-serif-kr text-xl font-bold text-foreground">이용이 제한된 계정입니다</h1>
        <p className="mt-2 text-base text-muted-foreground">문의사항은 하미담 관리자에게 연락해주세요.</p>
      </Shell>
    )
  }

  const roleLabel = {
    super_admin: '슈퍼관리자',
    org_admin: '조직관리자',
    sales_rep: '팀장',
  }[profile.role]

  return (
    <>
      {showSplash && <SplashIntro onDone={dismissSplash} />}
      <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-8">
        <ThemeToggle />
        <button
          onClick={signOut}
          className="fixed left-4 top-4 z-10 text-sm text-muted-foreground transition hover:text-accent"
        >
          로그아웃
        </button>

        <div className="mx-auto max-w-xl pt-10">
          <div className="mb-8 flex items-start gap-3">
            <MoonMark className="mt-1 h-11 w-11 shrink-0" />
            <div>
              <h1 className="font-serif-kr text-2xl font-bold text-foreground">{profile.name}님, 안녕하세요</h1>
              <span className="mt-1.5 inline-block rounded-full bg-accent/15 px-3 py-0.5 text-sm font-medium text-accent">
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              to="/gallery"
              className="group rounded-2xl border border-border bg-linear-to-br from-surface to-background-alt px-6 py-9 text-center shadow-[0_18px_38px_-20px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_46px_-16px_rgba(0,0,0,0.35)]"
            >
              <IconGallery className="mx-auto mb-3 h-8 w-8 text-accent transition-transform duration-200 group-hover:scale-110" />
              <span className="block font-serif-kr text-lg font-bold text-foreground">하미담 갤러리</span>
              <span className="mt-1 block text-sm text-muted-foreground">소중한 순간을 만나보세요</span>
            </Link>
            <Link
              to="/orders/new"
              className="group rounded-2xl bg-linear-to-br from-accent-light to-accent-dark px-6 py-9 text-center text-accent-foreground shadow-[0_18px_38px_-16px_rgba(184,134,63,0.5)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_46px_-12px_rgba(184,134,63,0.6)]"
            >
              <IconOrder className="mx-auto mb-3 h-8 w-8 transition-transform duration-200 group-hover:scale-110" />
              <span className="block font-serif-kr text-lg font-bold">주문하기</span>
              <span className="mt-1 block text-sm opacity-80">새로운 주문서 작성</span>
            </Link>
          </div>

          <div className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface/70 backdrop-blur">
            <MenuRow to="/orders" icon={<IconList className="h-[18px] w-[18px]" />}>
              주문 목록 보기
            </MenuRow>
            <MenuRow to="/products" icon={<IconBox className="h-[18px] w-[18px]" />}>
              상품 목록 보기
            </MenuRow>
            {profile.role === 'super_admin' && (
              <MenuRow to="/admin" icon={<IconShield className="h-[18px] w-[18px]" />}>
                슈퍼관리자 콘솔
              </MenuRow>
            )}
          </div>

          {profile.role === 'sales_rep' && profile.can_view_all_stats && (
            <p className="mt-4 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">
              전체 판매 현황 열람 권한이 있습니다 (통계 화면은 준비 중입니다).
            </p>
          )}
        </div>
      </div>
    </>
  )
}

function MenuRow({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link to={to} className="group flex items-center gap-3 px-5 py-4 text-base text-foreground transition-colors hover:bg-input">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
        {icon}
      </span>
      <span className="flex-1">{children}</span>
      <IconChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent" />
    </Link>
  )
}

function Shell({ children, onSignOut }: { children: ReactNode; onSignOut: () => void }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10">
      <ThemeToggle />
      <div className="mx-auto max-w-md">
        <MoonMark className="mx-auto mb-6 h-12 w-12" />
        <div className="space-y-4 rounded-2xl border border-border bg-surface/80 p-7 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
          {children}
          <button onClick={onSignOut} className="text-base text-muted-foreground underline hover:text-accent">
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
