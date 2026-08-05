import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/PageHeader'
import OrderStats from './OrderStats'

export default function Stats() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-base text-muted-foreground">
        불러오는 중...
      </div>
    )
  }

  const allowed = profile?.role === 'super_admin' || (profile?.role === 'sales_rep' && profile.can_view_all_stats)
  if (!allowed) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10">
      <PageHeader />
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 font-sans-kr text-2xl font-bold text-foreground">전체 판매 현황</h1>
        <OrderStats />
      </div>
    </div>
  )
}
