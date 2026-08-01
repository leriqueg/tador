import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Checkbox,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Anchor,
  Group,
} from '@mantine/core'
import { AdminApiError, adminFetch } from '../services/admin-api'

interface AccountRow {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  esPostable: boolean
  parentId: string | null
  reportRole?: 'normal' | 'contra'
  deprecatedAt?: string | null
}

export default function GlobalAccountFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [esPostable, setEsPostable] = useState(true)
  const [parentId, setParentId] = useState<string | null>(null)
  const [reportRole, setReportRole] = useState<'normal' | 'contra'>('normal')
  const [deprecatedAt, setDeprecatedAt] = useState<string | null>(null)
  const [parents, setParents] = useState<AccountRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<{ accounts: AccountRow[] }>(
          '/api/admin/global-accounts',
        )
        setParents(data.accounts.filter((a) => !a.esPostable))
        if (isEdit && id) {
          const detail = await adminFetch<{ account: AccountRow }>(
            `/api/admin/global-accounts/${id}`,
          )
          setCodigo(detail.account.codigo)
          setNombre(detail.account.nombre)
          setDescripcion(detail.account.descripcion)
          setEsPostable(detail.account.esPostable)
          setParentId(detail.account.parentId)
          setReportRole(detail.account.reportRole ?? 'normal')
          setDeprecatedAt(detail.account.deprecatedAt ?? null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar')
      }
    })()
  }, [id, isEdit])

  async function save() {
    setSaving(true)
    setError(null)
    try {
      if (isEdit && id) {
        await adminFetch('/api/admin/chart/commands/rename', {
          method: 'POST',
          body: JSON.stringify({
            accountId: id,
            nombre,
            descripcion,
            reportRole,
            dryRun: false,
          }),
        })
      } else {
        await adminFetch('/api/admin/chart/commands/create', {
          method: 'POST',
          body: JSON.stringify({
            codigo,
            nombre,
            descripcion,
            esPostable,
            parentId,
            reportRole,
            dryRun: false,
          }),
        })
      }
      navigate('/global-accounts')
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message)
      } else {
        setError('No se pudo guardar')
      }
    } finally {
      setSaving(false)
    }
  }

  async function deprecate() {
    if (!id) return
    setSaving(true)
    setError(null)
    try {
      await adminFetch('/api/admin/chart/commands/deprecate', {
        method: 'POST',
        body: JSON.stringify({ accountId: id, dryRun: false }),
      })
      navigate('/global-accounts')
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Error al deprecar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack maw={480}>
      <Title order={2}>
        {isEdit ? 'Editar cuenta global' : 'Nueva cuenta global'}
      </Title>
      <Anchor component={Link} to="/global-accounts">
        Volver
      </Anchor>
      <TextInput
        label="Código (8 dígitos)"
        value={codigo}
        onChange={(e) => setCodigo(e.currentTarget.value)}
        disabled={isEdit}
        required
      />
      <TextInput
        label="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.currentTarget.value)}
        required
      />
      <Textarea
        label="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.currentTarget.value)}
      />
      <Checkbox
        label="Postable"
        checked={esPostable}
        onChange={(e) => setEsPostable(e.currentTarget.checked)}
        disabled={isEdit}
      />
      <Select
        label="Rol de reporte"
        data={[
          { value: 'normal', label: 'Normal' },
          { value: 'contra', label: 'Contra (futuro neteo)' },
        ]}
        value={reportRole}
        onChange={(v) => setReportRole((v as 'normal' | 'contra') ?? 'normal')}
      />
      {!isEdit && (
        <Select
          label="Cuenta padre (grupo)"
          data={parents.map((p) => ({
            value: p.id,
            label: `${p.codigo} — ${p.nombre}`,
          }))}
          value={parentId}
          onChange={setParentId}
          searchable
          clearable
        />
      )}
      {isEdit && (
        <Text size="sm" c="dimmed">
          Para cambiar de padre usa Mover en el árbol (reparent + recode).
          {deprecatedAt ? ` Deprecada desde ${deprecatedAt}.` : ''}
        </Text>
      )}
      {error && <Text c="red">{error}</Text>}
      <Group>
        <Button loading={saving} onClick={() => void save()}>
          Guardar
        </Button>
        {isEdit && !deprecatedAt && (
          <Button
            color="orange"
            variant="light"
            loading={saving}
            onClick={() => void deprecate()}
          >
            Deprecar
          </Button>
        )}
      </Group>
    </Stack>
  )
}
