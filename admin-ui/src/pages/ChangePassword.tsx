import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Alert, Button, Paper, PasswordInput, Stack, Title, Text } from '@mantine/core'
import { adminApi, AdminApiError } from '../services/admin-api'
import { useOperatorSession } from '../state/operator-session'

export default function ChangePasswordPage() {
  const { operator, setOperator, loading } = useOperatorSession()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && !operator) {
    return <Navigate to="/login" replace />
  }
  if (!loading && operator && !operator.mustChangePassword) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 12) {
      setError('La nueva contraseña debe tener al menos 12 caracteres')
      return
    }
    if (newPassword !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setSubmitting(true)
    try {
      const data = await adminApi.changePassword(currentPassword, newPassword)
      setOperator(data.operator)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'No se pudo cambiar la contraseña')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack maw={420} mx="auto" mt={80} gap="md">
      <Title order={2}>Cambiar contraseña</Title>
      <Text c="dimmed" size="sm">
        Debes establecer una nueva contraseña antes de continuar.
      </Text>
      <Paper withBorder p="lg" radius="md">
        <form onSubmit={onSubmit}>
          <Stack gap="md">
            {error && <Alert color="red">{error}</Alert>}
            <PasswordInput
              label="Contraseña actual"
              value={currentPassword}
              onChange={(ev) => setCurrentPassword(ev.currentTarget.value)}
              required
            />
            <PasswordInput
              label="Nueva contraseña"
              description="Mínimo 12 caracteres"
              value={newPassword}
              onChange={(ev) => setNewPassword(ev.currentTarget.value)}
              required
            />
            <PasswordInput
              label="Confirmar nueva contraseña"
              value={confirm}
              onChange={(ev) => setConfirm(ev.currentTarget.value)}
              required
            />
            <Button type="submit" loading={submitting}>
              Guardar
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  )
}
