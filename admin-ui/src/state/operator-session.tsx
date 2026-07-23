import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { adminApi, type OperatorDto } from '../services/admin-api'

interface OperatorSessionState {
  operator: OperatorDto | null
  loading: boolean
  mustChangePassword: boolean
  refresh: () => Promise<void>
  setOperator: (operator: OperatorDto | null) => void
  logout: () => Promise<void>
}

const OperatorSessionContext = createContext<OperatorSessionState | null>(null)

export function OperatorSessionProvider({ children }: { children: ReactNode }) {
  const [operator, setOperator] = useState<OperatorDto | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await adminApi.me()
      setOperator(data.operator)
    } catch {
      setOperator(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    try {
      await adminApi.logout()
    } finally {
      setOperator(null)
    }
  }, [])

  return (
    <OperatorSessionContext.Provider
      value={{
        operator,
        loading,
        mustChangePassword: operator?.mustChangePassword ?? false,
        refresh,
        setOperator,
        logout,
      }}
    >
      {children}
    </OperatorSessionContext.Provider>
  )
}

export function useOperatorSession(): OperatorSessionState {
  const ctx = useContext(OperatorSessionContext)
  if (!ctx) {
    throw new Error('useOperatorSession must be used within OperatorSessionProvider')
  }
  return ctx
}
