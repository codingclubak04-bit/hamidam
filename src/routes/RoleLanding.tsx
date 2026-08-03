import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { MoonMark } from '../components/MoonMark'
import { ThemeToggle } from '../components/ThemeToggle'

export default function RoleLanding() {
  const { profile, signOut } = useAuth()

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
    <Shell onSignOut={signOut}>
      <h1 className="font-serif-kr text-xl font-bold text-foreground">{profile.name}님, 안녕하세요</h1>
      <p className="mt-2 text-base text-muted-foreground">{roleLabel} 대시보드는 준비 중입니다.</p>
    </Shell>
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
