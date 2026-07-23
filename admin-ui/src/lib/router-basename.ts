/** React Router basename from Vite `base` (e.g. `/admin-ui/` → `/admin-ui`). */
export function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL ?? '/'
  const trimmed = base.replace(/\/$/, '')
  return trimmed === '' ? undefined : trimmed
}
