/**
 * Global chart browser — tabs by accounting class + accordion tree.
 *
 * Performance notes:
 * - open state is a Set; nodes receive boolean `isOpen` + memo so siblings skip re-render
 * - expansion reset only on tab / search / data reload (not on every toggle)
 * - native `title` instead of Mantine Tooltip (avoids hundreds of floating UIs)
 */

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ActionIcon,
  Badge,
  Group,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  UnstyledButton,
  Box,
} from '@mantine/core'
import { adminFetch } from '../services/admin-api'
import { useOperatorSession } from '../state/operator-session'
import ChartReparentModal from '../components/ChartReparentModal'
import {
  IconChevronDown,
  IconChevronRight,
  IconDownload,
  IconFold,
  IconMove,
  IconPencil,
  IconPlus,
  IconSearch,
  IconUnfold,
} from '../components/icons'

export interface AccountRow {
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
  depth: number
  /** Cached postable descendants (for “Mostrar N cuentas”). */
  leafCount: number
}

type ClassTab = '1' | '2' | '4' | '6' | 'all'

const CLASS_TABS: Array<{
  value: ClassTab
  label: string
  digit?: string
}> = [
  { value: '1', label: 'Activo', digit: '1' },
  { value: '2', label: 'Pasivo', digit: '2' },
  { value: '4', label: 'Ingreso', digit: '4' },
  { value: '6', label: 'Gasto', digit: '6' },
  { value: 'all', label: 'Todas' },
]

/** Depths ≤ this stay open by default (class root + first group level). */
const DEFAULT_OPEN_MAX_DEPTH = 1

function buildTree(accounts: AccountRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  for (const a of accounts) {
    map.set(a.id, { ...a, children: [], depth: 0, leafCount: 0 })
  }
  const roots: TreeNode[] = []
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  const assign = (nodes: TreeNode[], depth: number): number => {
    nodes.sort((a, b) => a.codigo.localeCompare(b.codigo))
    let leaves = 0
    for (const n of nodes) {
      n.depth = depth
      if (n.children.length === 0) {
        n.leafCount = n.esPostable ? 1 : 0
      } else {
        n.leafCount = assign(n.children, depth + 1)
      }
      leaves += n.leafCount
    }
    return leaves
  }
  assign(roots, 0)
  return roots
}

function collectExpandableIds(
  nodes: TreeNode[],
  maxDepthInclusive: number | null,
): string[] {
  const ids: string[] = []
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      if (n.children.length === 0) continue
      if (maxDepthInclusive === null || n.depth <= maxDepthInclusive) {
        ids.push(n.id)
      }
      walk(n.children)
    }
  }
  walk(nodes)
  return ids
}

function collectAncestorIds(
  byId: Map<string, AccountRow>,
  startParentId: string | null,
): string[] {
  const out: string[] = []
  let pid = startParentId
  while (pid) {
    out.push(pid)
    pid = byId.get(pid)?.parentId ?? null
  }
  return out
}

const AccountTreeNode = memo(
  function AccountTreeNode({
    node,
    isOpen,
    openIds,
    toggle,
    canEdit,
    onMove,
    searchActive,
  }: {
    node: TreeNode
    isOpen: boolean
    openIds: ReadonlySet<string>
    toggle: (id: string) => void
    canEdit: boolean
    onMove: (account: AccountRow) => void
    searchActive: boolean
  }) {
    const hasChildren = node.children.length > 0

    return (
      <Box>
        <Group
          gap="xs"
          wrap="nowrap"
          py={6}
          px="xs"
          style={{
            borderRadius: 6,
            background:
              node.depth === 0 ? 'var(--mantine-color-gray-1)' : undefined,
          }}
        >
          {hasChildren ? (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              aria-label={isOpen ? 'Contraer' : 'Expandir'}
              aria-expanded={isOpen}
              onClick={() => toggle(node.id)}
            >
              {isOpen ? (
                <IconChevronDown size={14} />
              ) : (
                <IconChevronRight size={14} />
              )}
            </ActionIcon>
          ) : (
            <Box w={28} />
          )}

          <Text size="sm" ff="monospace" c="dimmed" style={{ minWidth: 72 }}>
            {node.codigo}
          </Text>
          <Text size="sm" style={{ flex: 1 }} lineClamp={1}>
            {node.nombre}
          </Text>

          <Badge
            size="xs"
            variant="light"
            color={node.esPostable ? 'teal' : 'gray'}
          >
            {node.esPostable ? 'Postable' : 'Grupo'}
          </Badge>
          {node.reportRole === 'contra' && (
            <Badge size="xs" variant="outline" color="orange">
              Contra
            </Badge>
          )}
          {node.deprecatedAt && (
            <Badge size="xs" color="orange">
              Deprecada
            </Badge>
          )}

          <Group gap={4} wrap="nowrap" ml="auto">
            {canEdit && (
              <>
                <ActionIcon
                  component={Link}
                  to={`/global-accounts/${node.id}/edit`}
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label={`Editar ${node.nombre}`}
                  title="Editar"
                >
                  <IconPencil size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="teal"
                  size="sm"
                  aria-label={`Mover ${node.nombre}`}
                  title="Mover de padre"
                  onClick={() => onMove(node)}
                >
                  <IconMove size={14} />
                </ActionIcon>
              </>
            )}
          </Group>
        </Group>

        {hasChildren &&
          !isOpen &&
          !searchActive &&
          node.depth >= DEFAULT_OPEN_MAX_DEPTH && (
            <UnstyledButton
              onClick={() => toggle(node.id)}
              ml={44}
              mb={4}
              style={{ fontSize: 12, color: 'var(--mantine-color-teal-7)' }}
            >
              Mostrar{' '}
              {node.leafCount > 0
                ? `${node.leafCount} cuenta${node.leafCount === 1 ? '' : 's'}`
                : 'hijos'}
              …
            </UnstyledButton>
          )}

        {hasChildren && isOpen && (
          <Stack
            gap={0}
            ml="md"
            pl="sm"
            style={{ borderLeft: '1px solid var(--mantine-color-gray-3)' }}
          >
            {node.children.map((child) => (
              <AccountTreeNode
                key={child.id}
                node={child}
                isOpen={openIds.has(child.id)}
                openIds={openIds}
                toggle={toggle}
                canEdit={canEdit}
                onMove={onMove}
                searchActive={searchActive}
              />
            ))}
          </Stack>
        )}
      </Box>
    )
  },
  (prev, next) => {
    if (prev.isOpen !== next.isOpen) return false
    if (prev.node !== next.node) return false
    if (prev.canEdit !== next.canEdit) return false
    if (prev.searchActive !== next.searchActive) return false
    if (prev.toggle !== next.toggle || prev.onMove !== next.onMove) return false
    // Closed nodes ignore openIds identity — stops whole-tree re-renders on toggle.
    if (!prev.isOpen && !next.isOpen) return true
    for (const child of next.node.children) {
      if (prev.openIds.has(child.id) !== next.openIds.has(child.id)) return false
    }
    return true
  },
)

export default function GlobalAccountsPage() {
  const { operator } = useOperatorSession()
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<ClassTab>('1')
  const [error, setError] = useState<string | null>(null)
  const [moving, setMoving] = useState<AccountRow | null>(null)
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())
  const [dataEpoch, setDataEpoch] = useState(0)
  const [exporting, setExporting] = useState(false)
  const canEdit = operator?.role === 'admin' || operator?.role === 'superadmin'

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await adminFetch<{ accounts: AccountRow[] }>(
        '/api/admin/global-accounts',
      )
      setAccounts(data.accounts)
      setDataEpoch((n) => n + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cuentas')
    }
  }, [])

  const exportSeed = useCallback(async () => {
    setExporting(true)
    setError(null)
    try {
      const payload = await adminFetch<Record<string, unknown>>(
        '/api/admin/global-accounts/export/seed',
      )
      const stamp =
        typeof payload.exportedAt === 'string'
          ? payload.exportedAt.slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plan-de-cuentas-export-${stamp}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al exportar el plan de cuentas',
      )
    } finally {
      setExporting(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const accountsById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts],
  )

  const classCounts = useMemo(() => {
    const counts: Record<string, number> = {
      '1': 0,
      '2': 0,
      '4': 0,
      '6': 0,
      other: 0,
    }
    for (const a of accounts) {
      const d = a.codigo[0]
      if (d === '1' || d === '2' || d === '4' || d === '6') counts[d] += 1
      else counts.other += 1
    }
    return counts
  }, [accounts])

  const scopedAccounts = useMemo(() => {
    if (tab === 'all') return accounts
    return accounts.filter((a) => a.codigo.startsWith(tab))
  }, [accounts, tab])

  const searchNeedle = q.trim().toLowerCase()
  const searchActive = searchNeedle.length > 0

  const filteredAccounts = useMemo(() => {
    if (!searchActive) return scopedAccounts
    const matched = new Set<string>()
    for (const a of scopedAccounts) {
      if (
        a.codigo.toLowerCase().includes(searchNeedle) ||
        a.nombre.toLowerCase().includes(searchNeedle)
      ) {
        matched.add(a.id)
        for (const anc of collectAncestorIds(accountsById, a.parentId)) {
          matched.add(anc)
        }
      }
    }
    return scopedAccounts.filter((a) => matched.has(a.id))
  }, [scopedAccounts, searchActive, searchNeedle, accountsById])

  const tree = useMemo(() => buildTree(filteredAccounts), [filteredAccounts])

  // Only re-seed expansion when tab, search, or loaded data changes — never on toggle.
  useEffect(() => {
    if (searchActive) {
      const ancestors = new Set<string>()
      for (const a of filteredAccounts) {
        if (
          a.codigo.toLowerCase().includes(searchNeedle) ||
          a.nombre.toLowerCase().includes(searchNeedle)
        ) {
          for (const anc of collectAncestorIds(accountsById, a.parentId)) {
            ancestors.add(anc)
          }
        }
      }
      setOpenIds(ancestors)
      return
    }
    setOpenIds(new Set(collectExpandableIds(tree, DEFAULT_OPEN_MAX_DEPTH)))
  }, [tab, searchNeedle, searchActive, dataEpoch]) // eslint-disable-line react-hooks/exhaustive-deps -- intentional: tree/filtered derived

  const toggle = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setOpenIds(new Set(collectExpandableIds(tree, null)))
  }, [tree])

  const collapseAll = useCallback(() => {
    setOpenIds(new Set())
  }, [])

  const onMove = useCallback((account: AccountRow) => {
    setMoving(account)
  }, [])

  return (
    <>
      <Group justify="space-between" mb="sm" align="flex-end">
        <div>
          <Title order={2}>Plan de cuentas global</Title>
          <Text size="sm" c="dimmed">
            Catálogo por clase contable. Niveles profundos se ocultan hasta expandir.
          </Text>
        </div>
      </Group>

      <Tabs value={tab} onChange={(v) => setTab((v as ClassTab) ?? '1')} mb="md">
        <Tabs.List>
          {CLASS_TABS.map((t) => {
            const count =
              t.value === 'all' ? accounts.length : (classCounts[t.digit!] ?? 0)
            return (
              <Tabs.Tab key={t.value} value={t.value}>
                {t.label}{' '}
                <Text span size="xs" c="dimmed">
                  ({count})
                </Text>
              </Tabs.Tab>
            )
          })}
        </Tabs.List>
      </Tabs>

      <Group mb="md" justify="space-between" align="center" wrap="wrap">
        <TextInput
          placeholder="Buscar por código o nombre…"
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          leftSection={<IconSearch size={14} />}
          style={{ flex: 1, minWidth: 220, maxWidth: 420 }}
          aria-label="Buscar cuentas"
        />
        <Group gap={6} wrap="nowrap">
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Exportar seed"
            title="Exportar plan de cuentas (JSON seed)"
            onClick={() => void exportSeed()}
            loading={exporting}
          >
            <IconDownload size={16} />
          </ActionIcon>
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Expandir todos"
            title="Expandir todos los niveles"
            onClick={expandAll}
          >
            <IconUnfold size={16} />
          </ActionIcon>
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Recoger todos"
            title="Recoger todos los niveles"
            onClick={collapseAll}
          >
            <IconFold size={16} />
          </ActionIcon>
          {canEdit && (
            <ActionIcon
              component={Link}
              to="/global-accounts/new"
              variant="filled"
              color="teal"
              size="lg"
              aria-label="Nueva cuenta"
              title="Nueva cuenta"
            >
              <IconPlus size={16} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      {error && (
        <Text c="red" mb="sm">
          {error}
        </Text>
      )}

      {tree.length === 0 ? (
        <Text c="dimmed" size="sm">
          {searchActive
            ? 'Sin coincidencias en esta clase. Prueba otra pestaña o “Todas”.'
            : 'No hay cuentas en esta clase.'}
        </Text>
      ) : (
        <Stack gap={4}>
          {tree.map((node) => (
            <AccountTreeNode
              key={node.id}
              node={node}
              isOpen={openIds.has(node.id)}
              openIds={openIds}
              toggle={toggle}
              canEdit={canEdit}
              onMove={onMove}
              searchActive={searchActive}
            />
          ))}
        </Stack>
      )}

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
