import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Button,
  Group,
  NumberInput,
  Table,
  Text,
  TextInput,
  Title,
  Paper,
  Stack,
  Badge,
} from '@mantine/core'
import { adminFetch } from '../services/admin-api'

interface ReadinessLine {
  id: number
  label: string
  side: string
  availableCount: number
}

interface PreviewLine {
  lineId: number
  label: string
  side: string
  accountId: string
  accountName: string
  debito: string
  credito: string
}

export default function TemplatePreviewPage() {
  const { code = '' } = useParams()
  const [userId, setUserId] = useState('')
  const [amount, setAmount] = useState<number | string>(42.5)
  const [account1, setAccount1] = useState('')
  const [account2, setAccount2] = useState('')
  const [ready, setReady] = useState<boolean | null>(null)
  const [lines, setLines] = useState<ReadinessLine[]>([])
  const [preview, setPreview] = useState<{
    balanced: boolean
    persisted: boolean
    lines: PreviewLine[]
    concept: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadReadiness() {
    if (!userId.trim()) {
      setError('Indica un userId de muestra para readiness')
      return
    }
    setError(null)
    try {
      const data = await adminFetch<{
        ready: boolean
        lines: ReadinessLine[]
      }>(
        `/api/admin/templates/${code}/readiness?mode=hogar&userId=${encodeURIComponent(userId.trim())}`,
      )
      setReady(data.ready)
      setLines(data.lines)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de readiness')
    }
  }

  async function runPreview() {
    if (!userId.trim()) {
      setError('Indica un userId de muestra')
      return
    }
    setError(null)
    try {
      const data = await adminFetch<{
        balanced: boolean
        persisted: boolean
        lines: PreviewLine[]
        concept: string
      }>(`/api/admin/templates/${code}/preview`, {
        method: 'POST',
        body: JSON.stringify({
          userId: userId.trim(),
          amount: Number(amount),
          concept: `Preview ${code}`,
          mode: 'hogar',
          lines: [
            { id: 1, accountId: account1.trim() },
            { id: 2, accountId: account2.trim() },
          ],
        }),
      })
      setPreview(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en preview')
    }
  }

  useEffect(() => {
    setPreview(null)
    setReady(null)
    setLines([])
  }, [code])

  return (
    <Stack maw={720}>
      <Title order={2}>Plantilla: {code}</Title>
      <TextInput
        label="UserId de muestra"
        description="Usuario de producto para resolver cuentas (sin persistir)"
        value={userId}
        onChange={(e) => setUserId(e.currentTarget.value)}
      />
      <Group>
        <Button onClick={() => void loadReadiness()}>Ver readiness</Button>
        {ready !== null && (
          <Badge color={ready ? 'green' : 'orange'}>
            {ready ? 'Lista' : 'Incompleta'}
          </Badge>
        )}
      </Group>
      {lines.length > 0 && (
        <Paper withBorder p="sm">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Línea</Table.Th>
                <Table.Th>Lado</Table.Th>
                <Table.Th>Cuentas</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lines.map((l) => (
                <Table.Tr key={l.id}>
                  <Table.Td>{l.label}</Table.Td>
                  <Table.Td>{l.side}</Table.Td>
                  <Table.Td>{l.availableCount}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
      <NumberInput
        label="Monto"
        value={amount}
        onChange={setAmount}
        decimalScale={2}
      />
      <TextInput
        label="AccountId línea 1 (débito)"
        value={account1}
        onChange={(e) => setAccount1(e.currentTarget.value)}
      />
      <TextInput
        label="AccountId línea 2 (crédito)"
        value={account2}
        onChange={(e) => setAccount2(e.currentTarget.value)}
      />
      <Button onClick={() => void runPreview()}>Generar mock asiento</Button>
      {error && <Text c="red">{error}</Text>}
      {preview && (
        <Paper withBorder p="md">
          <Text fw={600}>{preview.concept}</Text>
          <Text size="sm" c="dimmed" mb="sm">
            balanced={String(preview.balanced)} · persisted=
            {String(preview.persisted)}
          </Text>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Cuenta</Table.Th>
                <Table.Th>Débito</Table.Th>
                <Table.Th>Crédito</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {preview.lines.map((l) => (
                <Table.Tr key={l.lineId}>
                  <Table.Td>
                    {l.accountName} ({l.side})
                  </Table.Td>
                  <Table.Td>{l.debito}</Table.Td>
                  <Table.Td>{l.credito}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  )
}
