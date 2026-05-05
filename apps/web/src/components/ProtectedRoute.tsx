import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/types'

interface Props {
  roles: Role[]
}

export default function ProtectedRoute({ roles }: Props) {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) return <Navigate to="/login" replace />

  if (!roles.includes(user.role)) return <Navigate to="/unauthorized" replace />

  return <Outlet />
}
