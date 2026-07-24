import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Alert,
  Anchor,
  Button,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { adminFetch, AdminApiError } from '../services/admin-api'
import { useOperatorSession } from '../state/operator-session'

interface UserDetail {
  id: string
  email: string
  fullName: string | null
  blockedAt: string | null
  blockedReason: string | null
  sessionCount: number
  bookId: string | null
  createdAt: string
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { operator } = useOperatorSession()
  const canMutate = operator?.role === 'admin' || operator?.role === 'superadmin'
  const [user, setUser] = useState<UserDetail | null>(null)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!id) return
    setError(null)
    try {
      const data = await adminFetch<{ user: UserDetail }>(`/api/admin/users/${id}`)
      setUser(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function block() {
    if (!id) return
    try {
      await adminFetch(`/api/admin/users/${id}/block`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
      setMessage('Usuario bloqueado')
      await load()
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'No se pudo bloquear')
    }
  }

  async function unblock() {
    if (!id) return
    try {
      await adminFetch(`/api/admin/users/${id}/unblock`, { method: 'POST' })
      setMessage('Usuario desbloqueado')
      await load()
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'No se pudo desbloquear')
    }
  }

  async function forceRecovery() {
    if (!id) return
    try {
      await adminFetch(`/api/admin/users/${id}/force-password-recovery`, {
        method: 'POST',
      })
      setMessage('Recuperación de contraseña iniciada')
      await load()
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : 'No se pudo forzar recuperación',
      )
    }
  }

  return (
    <>
      <Title order={2} mb="sm">
        Detalle de usuario
      </Title>
      <Anchor component={Link} to="/users" mb="md" display="inline-block">
        Volver
      </Anchor>
      {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}
      {message && (
        <Alert color="green" mb="md">
          {message}
        </Alert>
      )}
      {user && (
        <Stack maw={520} gap="sm">
          <Text>
            <strong>Correo:</strong> {user.email}
          </Text>
          <Text>
            <strong>Nombre:</strong> {user.fullName ?? '—'}
          </Text>
          <Text>
            <strong>Estado:</strong> {user.blockedAt ? 'Bloqueado' : 'Activo'}
          </Text>
          {user.blockedReason && (
            <Text>
              <strong>Motivo:</strong> {user.blockedReason}
            </Text>
          )}
          <Text>
            <strong>Sesiones activas:</strong> {user.sessionCount}
          </Text>
          {canMutate && (
            <Stack mt="md" gap="sm">
              {!user.blockedAt ? (
                <>
                  <TextInput
                    label="Motivo de bloqueo"
                    value={reason}
                    onChange={(e) => setReason(e.currentTarget.value)}
                  />
                  <Button color="red" onClick={() => void block()}>
                    Bloquear
                  </Button>
                </>
              ) : (
                <Button onClick={() => void unblock()}>Desbloquear</Button>
              )}
              <Button variant="light" onClick={() => void forceRecovery()}>
                Forzar recuperación de contraseña
              </Button>
            </Stack>
          )}
        </Stack>
      )}
    </>
  )
}
