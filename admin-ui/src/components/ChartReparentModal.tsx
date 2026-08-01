import { useState } from 'react'
import {
  Button,
  Modal,
  Select,
  Stack,
  Text,
  Table,
  Checkbox,
  Group,
} from '@mantine/core'
import { AdminApiError, adminFetch } from '../services/admin-api'

interface AccountRow {
  id: string
  codigo: string
  nombre: string
  esPostable: boolean
  parentId: string | null
}

interface Impact {
  dryRun: boolean
  accountChanges: Array<{
    id: string
    nombre: string
    codigoBefore: string
    codigoAfter: string
  }>
  plantillaHits: Array<{ code: string; groupCodes: string[] }>
  warnings: string[]
}

export default function ChartReparentModal({
  account,
  accounts,
  onClose,
  onApplied,
}: {
  account: AccountRow
  accounts: AccountRow[]
  onClose: () => void
  onApplied: () => void
}) {
  const groups = accounts.filter((a) => !a.esPostable && a.id !== account.id)
  const [parentId, setParentId] = useState<string | null>(null)
  const [preview, setPreview] = useState<Impact | null>(null)
  const [cascadeUser, setCascadeUser] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(dryRun: boolean) {
    if (!parentId) {
      setError('Selecciona un padre')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const data = await adminFetch<Impact>(
        '/api/admin/chart/commands/reparent',
        {
          method: 'POST',
          body: JSON.stringify({
            accountId: account.id,
            newParentId: parentId,
            dryRun,
            cascadeUserCodigos: cascadeUser,
          }),
        },
      )
      if (dryRun) {
        setPreview(data)
      } else {
        onApplied()
      }
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : 'No se pudo ejecutar el comando',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      opened
      onClose={onClose}
      title={`Mover ${account.codigo} — ${account.nombre}`}
      size="lg"
    >
      <Stack>
        <Select
          label="Nuevo padre (grupo)"
          searchable
          data={groups.map((g) => ({
            value: g.id,
            label: `${g.codigo} — ${g.nombre}`,
          }))}
          value={parentId}
          onChange={(v) => {
            setParentId(v)
            setPreview(null)
          }}
        />
        <Checkbox
          label="Recodificar cuentas de usuario en cascada"
          checked={cascadeUser}
          onChange={(e) => setCascadeUser(e.currentTarget.checked)}
        />
        {preview && (
          <>
            <Text size="sm" fw={600}>
              Vista previa
            </Text>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Cuenta</Table.Th>
                  <Table.Th>Antes</Table.Th>
                  <Table.Th>Después</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {preview.accountChanges.map((c) => (
                  <Table.Tr key={c.id}>
                    <Table.Td>{c.nombre}</Table.Td>
                    <Table.Td>{c.codigoBefore}</Table.Td>
                    <Table.Td>{c.codigoAfter}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {preview.plantillaHits.length > 0 && (
              <Text size="sm" c="orange">
                Plantillas afectadas:{' '}
                {preview.plantillaHits.map((p) => p.code).join(', ')}
              </Text>
            )}
          </>
        )}
        {error && <Text c="red">{error}</Text>}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="light"
            loading={busy}
            onClick={() => void run(true)}
          >
            Vista previa
          </Button>
          <Button
            loading={busy}
            disabled={!preview}
            onClick={() => void run(false)}
          >
            Aplicar
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
