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
} from '@mantine/core'
import { AdminApiError, adminFetch } from '../services/admin-api'

interface AccountRow {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  esPostable: boolean
  parentId: string | null
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
        await adminFetch(`/api/admin/global-accounts/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nombre,
            descripcion,
            esPostable,
            parentId,
          }),
        })
      } else {
        await adminFetch('/api/admin/global-accounts', {
          method: 'POST',
          body: JSON.stringify({
            codigo,
            nombre,
            descripcion,
            esPostable,
            parentId,
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
      />
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
      {error && <Text c="red">{error}</Text>}
      <Button loading={saving} onClick={() => void save()}>
        Guardar
      </Button>
    </Stack>
  )
}
