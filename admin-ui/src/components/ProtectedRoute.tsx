import { Navigate, Outlet } from 'react-router-dom'
import { Center, Loader } from '@mantine/core'
import { useOperatorSession } from '../state/operator-session'

export function ProtectedRoute() {
  const { operator, loading, mustChangePassword } = useOperatorSession()

  if (loading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    )
  }
  if (!operator) {
    return <Navigate to="/login" replace />
  }
  if (mustChangePassword) {
    return <Navigate to="/change-password" replace />
  }
  return <Outlet />
}
