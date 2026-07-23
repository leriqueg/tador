import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Alert, Button, Paper, PasswordInput, Stack, TextInput, Title, Text } from '@mantine/core'
import { adminApi, AdminApiError } from '../services/admin-api'
import { useOperatorSession } from '../state/operator-session'

export default function LoginPage() {
  const { operator, setOperator, loading } = useOperatorSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@localhost')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && operator) {
    return (
      <Navigate
        to={operator.mustChangePassword ? '/change-password' : '/'}
        replace
      />
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const data = await adminApi.login(email, password)
      setOperator(data.operator)
      navigate(data.mustChangePassword ? '/change-password' : '/', { replace: true })
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack maw={420} mx="auto" mt={80} gap="md">
      <Title order={2}>TADOR Admin</Title>
      <Text c="dimmed" size="sm">
        Acceso exclusivo para operadores internos.
      </Text>
      <Paper withBorder p="lg" radius="md">
        <form onSubmit={onSubmit}>
          <Stack gap="md">
            {error && <Alert color="red">{error}</Alert>}
            <TextInput
              label="Correo"
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.currentTarget.value)}
              required
              autoComplete="username"
            />
            <PasswordInput
              label="Contraseña"
              value={password}
              onChange={(ev) => setPassword(ev.currentTarget.value)}
              required
              autoComplete="current-password"
            />
            <Button type="submit" loading={submitting}>
              Entrar
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  )
}
