import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Group,
  Text,
  TextInput,
  Title,
  Badge,
  Stack,
  UnstyledButton,
} from '@mantine/core'
import { adminFetch } from '../services/admin-api'
import { useOperatorSession } from '../state/operator-session'
import ChartReparentModal from '../components/ChartReparentModal'

interface AccountRow {
  id: string
  codigo: string
  nombre: string
  esPostable: boolean
  parentId: string | null
  deprecatedAt?: string | null
  reportRole?: string
}

interface TreeNode extends AccountRow {
  children: TreeNode[]
}

function buildTree(accounts: AccountRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  for (const a of accounts) {
    map.set(a.id, { ...a, children: [] })
  }
  const roots: TreeNode[] = []
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  const sortRec = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.codigo.localeCompare(b.codigo))
    for (const n of nodes) sortRec(n.children)
  }
  sortRec(roots)
  return roots
}

function TreeRows({
  nodes,
  depth,
  canEdit,
  onMove,
}: {
  nodes: TreeNode[]
  depth: number
  canEdit: boolean
  onMove: (account: AccountRow) => void
}) {
  return (
    <>
      {nodes.map((n) => (
        <Stack key={n.id} gap={2} ml={depth * 16}>
          <Group gap="xs" wrap="nowrap">
            <Text size="sm" ff="monospace">
              {n.codigo}
            </Text>
            <Text size="sm">{n.nombre}</Text>
            <Badge size="xs" variant="light" color={n.esPostable ? 'blue' : 'gray'}>
              {n.esPostable ? 'Postable' : 'Grupo'}
            </Badge>
            {n.deprecatedAt && (
              <Badge size="xs" color="orange">
                Deprecada
              </Badge>
            )}
            {canEdit && (
              <>
                <UnstyledButton
                  component={Link}
                  to={`/global-accounts/${n.id}/edit`}
                  style={{ fontSize: 12 }}
                >
                  Editar
                </UnstyledButton>
                <UnstyledButton
                  onClick={() => onMove(n)}
                  style={{ fontSize: 12, color: 'var(--mantine-color-blue-6)' }}
                >
                  Mover
                </UnstyledButton>
              </>
            )}
          </Group>
          {n.children.length > 0 && (
            <TreeRows
              nodes={n.children}
              depth={depth + 1}
              canEdit={canEdit}
              onMove={onMove}
            />
          )}
        </Stack>
      ))}
    </>
  )
}

export default function GlobalAccountsPage() {
  const { operator } = useOperatorSession()
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [moving, setMoving] = useState<AccountRow | null>(null)
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

  const filtered = useMemo(() => {
    if (!q.trim()) return accounts
    const needle = q.trim().toLowerCase()
    const matched = new Set<string>()
    for (const a of accounts) {
      if (
        a.codigo.includes(needle) ||
        a.nombre.toLowerCase().includes(needle)
      ) {
        matched.add(a.id)
        let pid = a.parentId
        while (pid) {
          matched.add(pid)
          pid = accounts.find((x) => x.id === pid)?.parentId ?? null
        }
      }
    }
    return accounts.filter((a) => matched.has(a.id))
  }, [accounts, q])

  const tree = useMemo(() => buildTree(filtered), [filtered])

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
      {error && (
        <Text c="red" mb="sm">
          {error}
        </Text>
      )}
      <Stack gap="xs">
        <TreeRows
          nodes={tree}
          depth={0}
          canEdit={canEdit}
          onMove={setMoving}
        />
      </Stack>
      {moving && (
        <ChartReparentModal
          account={moving}
          accounts={accounts}
          onClose={() => setMoving(null)}
          onApplied={() => {
            setMoving(null)
            void load()
          }}
        />
      )}
    </>
  )
}
