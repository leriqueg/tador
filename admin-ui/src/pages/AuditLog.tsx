import { useEffect, useState } from 'react'
import { Table, Text, Title } from '@mantine/core'
import { adminFetch } from '../services/admin-api'

interface AuditEntry {
  id: string
  operatorId: string
  action: string
  targetType: string
  targetId: string | null
  createdAt: string
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<{ entries: AuditEntry[]; total: number }>(
          '/api/admin/audit?page=1&pageSize=50',
        )
        setEntries(data.entries)
        setTotal(data.total)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar auditoría')
      }
    })()
  }, [])

  return (
    <>
      <Title order={2} mb="md">
        Auditoría
      </Title>
      {error && <Text c="red" mb="sm">{error}</Text>}
      <Text size="sm" c="dimmed" mb="xs">
        {total} evento(s)
      </Text>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Fecha</Table.Th>
            <Table.Th>Acción</Table.Th>
            <Table.Th>Objetivo</Table.Th>
            <Table.Th>Operator</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {entries.map((e) => (
            <Table.Tr key={e.id}>
              <Table.Td>{new Date(e.createdAt).toLocaleString()}</Table.Td>
              <Table.Td>{e.action}</Table.Td>
              <Table.Td>
                {e.targetType}
                {e.targetId ? `:${e.targetId.slice(0, 8)}` : ''}
              </Table.Td>
              <Table.Td>{e.operatorId.slice(0, 8)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  )
}
