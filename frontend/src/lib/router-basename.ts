/** React Router basename from Vite `base` (e.g. `/webapp/` → `/webapp`). */
export function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL ?? '/'
  const trimmed = base.replace(/\/$/, '')
  return trimmed === '' ? undefined : trimmed
}
