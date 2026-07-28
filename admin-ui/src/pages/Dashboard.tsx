import { Title, Text, Stack, Anchor } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useOperatorSession } from '../state/operator-session'

export default function DashboardPage() {
  const { operator } = useOperatorSession()

  return (
    <Stack>
      <Title order={2}>Panel</Title>
      <Text>
        Operador: {operator?.displayName ?? operator?.email} ({operator?.role})
      </Text>
      <Text c="dimmed">
        Usa el menú lateral para usuarios, plantillas, cuentas globales y
        estadísticas.
      </Text>
      <Anchor component={Link} to="/users">
        Ir a usuarios
      </Anchor>
    </Stack>
  )
}
