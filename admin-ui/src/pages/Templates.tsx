import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Group,
  Select,
  Table,
  Text,
  Title,
  Anchor,
  Badge,
} from '@mantine/core'
import { adminFetch } from '../services/admin-api'

interface TemplateRow {
  code: string
  name: string
  modes: string[]
  status: string
  kind: string
  category: string
}

export default function TemplatesPage() {
  const [mode, setMode] = useState<string | null>('hogar')
  const [plantillas, setPlantillas] = useState<TemplateRow[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load(selectedMode = mode) {
    setError(null)
    try {
      const data = await adminFetch<{ plantillas: TemplateRow[] }>(
        `/api/admin/templates?mode=${selectedMode ?? 'hogar'}`,
      )
      setPlantillas(data.plantillas)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar plantillas')
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Title order={2} mb="md">
        Plantillas
      </Title>
      <Group mb="md" align="flex-end">
        <Select
          label="Modo"
          data={[
            { value: 'hogar', label: 'Hogar' },
            { value: 'pro', label: 'PRO' },
          ]}
          value={mode}
          onChange={setMode}
          w={160}
        />
        <Button onClick={() => void load()}>Actualizar</Button>
      </Group>
      {error && <Text c="red" mb="sm">{error}</Text>}
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Código</Table.Th>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Modos</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {plantillas.map((p) => (
            <Table.Tr key={p.code}>
              <Table.Td>{p.code}</Table.Td>
              <Table.Td>{p.name}</Table.Td>
              <Table.Td>
                <Group gap={4}>
                  {p.modes.map((m) => (
                    <Badge key={m} size="sm" variant="light">
                      {m}
                    </Badge>
                  ))}
                </Group>
              </Table.Td>
              <Table.Td>{p.status}</Table.Td>
              <Table.Td>
                <Anchor component={Link} to={`/templates/${p.code}`}>
                  Vista previa
                </Anchor>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  )
}
