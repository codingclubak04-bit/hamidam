import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

export default function RoleLanding() {
  const { profile, signOut } = useAuth()

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        불러오는 중...
      </div>
    )
  }

  if (profile.status === 'pending') {
    return (
      <Shell onSignOut={signOut}>
        <h1 className="text-lg font-semibold text-slate-900">승인 대기 중입니다</h1>
        <p className="mt-2 text-sm text-slate-500">
          하미담 슈퍼관리자의 승인 후 이용하실 수 있습니다.
        </p>
      </Shell>
    )
  }

  if (profile.status === 'disabled') {
    return (
      <Shell onSignOut={signOut}>
        <h1 className="text-lg font-semibold text-slate-900">이용이 제한된 계정입니다</h1>
        <p className="mt-2 text-sm text-slate-500">문의사항은 하미담 관리자에게 연락해주세요.</p>
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
      <h1 className="text-lg font-semibold text-slate-900">{profile.name}님, 안녕하세요</h1>
      <p className="mt-2 text-sm text-slate-500">{roleLabel} 대시보드는 준비 중입니다.</p>
    </Shell>
  )
}

function Shell({ children, onSignOut }: { children: ReactNode; onSignOut: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-sm space-y-6 rounded-lg bg-white p-6 shadow-sm">
        {children}
        <button onClick={onSignOut} className="text-sm text-slate-500 underline">
          로그아웃
        </button>
      </div>
    </div>
  )
}
