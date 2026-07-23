import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Group,
  Select,
  Table,
  Text,
  TextInput,
  Title,
  Anchor,
} from '@mantine/core'
import { adminFetch } from '../services/admin-api'

interface UserRow {
  id: string
  email: string
  fullName: string | null
  blockedAt: string | null
  createdAt: string
}

export default function UsersPage() {
  const [q, setQ] = useState('')
  const [blocked, setBlocked] = useState<string | null>('all')
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function load(search = q, filter = blocked) {
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      if (filter && filter !== 'all') params.set('blocked', filter)
      const data = await adminFetch<{ users: UserRow[]; total: number }>(
        `/api/admin/users?${params.toString()}`,
      )
      setUsers(data.users)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios')
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Title order={2} mb="md">
        Usuarios
      </Title>
      <Group mb="md" align="flex-end">
        <TextInput
          label="Buscar por correo"
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          w={280}
        />
        <Select
          label="Estado"
          data={[
            { value: 'all', label: 'Todos' },
            { value: 'false', label: 'Activos' },
            { value: 'true', label: 'Bloqueados' },
          ]}
          value={blocked}
          onChange={setBlocked}
          w={160}
        />
        <Button onClick={() => void load()}>Buscar</Button>
      </Group>
      {error && <Text c="red" mb="sm">{error}</Text>}
      <Text size="sm" c="dimmed" mb="xs">
        {total} resultado(s)
      </Text>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Correo</Table.Th>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((u) => (
            <Table.Tr key={u.id}>
              <Table.Td>{u.email}</Table.Td>
              <Table.Td>{u.fullName ?? '—'}</Table.Td>
              <Table.Td>{u.blockedAt ? 'Bloqueado' : 'Activo'}</Table.Td>
              <Table.Td>
                <Anchor component={Link} to={`/users/${u.id}`}>
                  Ver
                </Anchor>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  )
}
