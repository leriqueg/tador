import { Link, Outlet, useLocation } from 'react-router-dom'
import { AppShell, Button, Group, NavLink, Stack, Text, Title } from '@mantine/core'
import { useOperatorSession } from '../state/operator-session'

interface NavItem {
  to: string
  label: string
  minRole?: 'support' | 'admin' | 'superadmin'
}

const NAV: NavItem[] = [
  { to: '/', label: 'Panel' },
  { to: '/users', label: 'Usuarios', minRole: 'support' },
  { to: '/templates', label: 'Plantillas', minRole: 'support' },
  { to: '/global-accounts', label: 'Cuentas globales', minRole: 'admin' },
  { to: '/statistics', label: 'Estadísticas', minRole: 'support' },
  { to: '/audit', label: 'Auditoría', minRole: 'superadmin' },
]

const ROLE_ORDER = { support: 1, admin: 2, superadmin: 3 } as const

export default function AdminLayout() {
  const { operator, logout } = useOperatorSession()
  const location = useLocation()
  const role = operator?.role ?? 'support'
  const level = ROLE_ORDER[role]

  const visible = NAV.filter((item) => {
    if (!item.minRole) return true
    return level >= ROLE_ORDER[item.minRole]
  })

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header px="md">
        <Group h="100%" justify="space-between">
          <Title order={3}>TADOR Admin</Title>
          <Group>
            <Text size="sm" c="dimmed">
              {operator?.email} ({operator?.role})
            </Text>
            <Button variant="subtle" onClick={() => void logout()}>
              Cerrar sesión
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="sm">
        <Stack gap={4}>
          {visible.map((item) => (
            <NavLink
              key={item.to}
              component={Link}
              to={item.to}
              label={item.label}
              active={
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to)
              }
            />
          ))}
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
