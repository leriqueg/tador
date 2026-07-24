import { useEffect, useState } from 'react'
import {
  Button,
  Group,
  Select,
  Table,
  Text,
  TextInput,
  Title,
  SimpleGrid,
  Paper,
  Stack,
} from '@mantine/core'
import { adminFetch } from '../services/admin-api'

interface SeriesPoint {
  key: string
  registrations: number
  logins: number
  apuntesCreated: number
  activeUsers: number
}

export default function StatisticsPage() {
  const [from, setFrom] = useState('2026-07-01')
  const [to, setTo] = useState('2026-07-07')
  const [granularity, setGranularity] = useState<string | null>('day')
  const [series, setSeries] = useState<SeriesPoint[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const data = await adminFetch<{ series: SeriesPoint[] }>(
        `/api/admin/statistics/overview?from=${from}&to=${to}&granularity=${granularity ?? 'day'}`,
      )
      setSeries(data.series)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totals = series.reduce(
    (acc, s) => ({
      registrations: acc.registrations + s.registrations,
      logins: acc.logins + s.logins,
      apuntesCreated: acc.apuntesCreated + s.apuntesCreated,
      activeUsers: Math.max(acc.activeUsers, s.activeUsers),
    }),
    { registrations: 0, logins: 0, apuntesCreated: 0, activeUsers: 0 },
  )

  return (
    <Stack>
      <Title order={2}>Estadísticas</Title>
      <Group align="flex-end">
        <TextInput
          label="Desde"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.currentTarget.value)}
        />
        <TextInput
          label="Hasta"
          type="date"
          value={to}
          onChange={(e) => setTo(e.currentTarget.value)}
        />
        <Select
          label="Granularidad"
          data={[
            { value: 'day', label: 'Día' },
            { value: 'week', label: 'Semana' },
            { value: 'month', label: 'Mes' },
          ]}
          value={granularity}
          onChange={setGranularity}
          w={140}
        />
        <Button onClick={() => void load()}>Actualizar</Button>
      </Group>
      {error && <Text c="red">{error}</Text>}
      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Paper withBorder p="md">
          <Text size="sm" c="dimmed">
            Registros
          </Text>
          <Text fw={700} size="xl">
            {totals.registrations}
          </Text>
        </Paper>
        <Paper withBorder p="md">
          <Text size="sm" c="dimmed">
            Logins
          </Text>
          <Text fw={700} size="xl">
            {totals.logins}
          </Text>
        </Paper>
        <Paper withBorder p="md">
          <Text size="sm" c="dimmed">
            Apuntes
          </Text>
          <Text fw={700} size="xl">
            {totals.apuntesCreated}
          </Text>
        </Paper>
        <Paper withBorder p="md">
          <Text size="sm" c="dimmed">
            Activos (máx bucket)
          </Text>
          <Text fw={700} size="xl">
            {totals.activeUsers}
          </Text>
        </Paper>
      </SimpleGrid>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Periodo</Table.Th>
            <Table.Th>Registros</Table.Th>
            <Table.Th>Logins</Table.Th>
            <Table.Th>Apuntes</Table.Th>
            <Table.Th>Usuarios activos</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {series.map((s) => (
            <Table.Tr key={s.key}>
              <Table.Td>{s.key}</Table.Td>
              <Table.Td>{s.registrations}</Table.Td>
              <Table.Td>{s.logins}</Table.Td>
              <Table.Td>{s.apuntesCreated}</Table.Td>
              <Table.Td>{s.activeUsers}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}
