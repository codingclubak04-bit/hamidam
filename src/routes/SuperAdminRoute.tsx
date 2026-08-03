import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SuperAdminRoute() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-base text-muted-foreground">
        불러오는 중...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!profile || profile.role !== 'super_admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
