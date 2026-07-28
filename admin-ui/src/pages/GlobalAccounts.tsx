import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Group,
  Table,
  Text,
  TextInput,
  Title,
  Anchor,
  Badge,
} from '@mantine/core'
import { adminFetch } from '../services/admin-api'
import { useOperatorSession } from '../state/operator-session'

interface AccountRow {
  id: string
  codigo: string
  nombre: string
  esPostable: boolean
  parentId: string | null
}

export default function GlobalAccountsPage() {
  const { operator } = useOperatorSession()
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const canEdit = operator?.role === 'admin' || operator?.role === 'superadmin'

  async function load() {
    setError(null)
    try {
      const data = await adminFetch<{ accounts: AccountRow[] }>(
        '/api/admin/global-accounts',
      )
      setAccounts(data.accounts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cuentas')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = accounts.filter((a) => {
    if (!q.trim()) return true
    const needle = q.trim().toLowerCase()
    return a.codigo.includes(needle) || a.nombre.toLowerCase().includes(needle)
  })

  return (
    <>
      <Title order={2} mb="md">
        Plan de cuentas global
      </Title>
      <Group mb="md" justify="space-between">
        <TextInput
          placeholder="Filtrar por código o nombre"
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          w={320}
        />
        {canEdit && (
          <Button component={Link} to="/global-accounts/new">
            Nueva cuenta
          </Button>
        )}
      </Group>
      {error && <Text c="red" mb="sm">{error}</Text>}
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Código</Table.Th>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Tipo</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtered.map((a) => (
            <Table.Tr key={a.id}>
              <Table.Td>{a.codigo}</Table.Td>
              <Table.Td>{a.nombre}</Table.Td>
              <Table.Td>
                <Badge variant="light" color={a.esPostable ? 'blue' : 'gray'}>
                  {a.esPostable ? 'Postable' : 'Grupo'}
                </Badge>
              </Table.Td>
              <Table.Td>
                {canEdit && (
                  <Anchor component={Link} to={`/global-accounts/${a.id}/edit`}>
                    Editar
                  </Anchor>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  )
}
