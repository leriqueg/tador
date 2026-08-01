# Quickstart: Chart of Accounts Engine (014)

## Prerequisites

- Spec 013 admin platform running (`DEPLOYMENT_PROFILE=full`)
- Operator with `admin` or `superadmin`
- `make db-setup` (or migrate after schema delta)

## Migrate

```bash
cd backend
npx prisma migrate dev
# expect migration adding CuentaGlobal.deprecatedAt + reportRole
```

## Dry-run reparent

```bash
# After admin login cookie:
curl -s -X POST http://localhost:3000/api/admin/chart/commands/reparent \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=..." \
  -d '{"accountId":"<id>","newParentId":"<parent>","dryRun":true}'
```

Expect `accountChanges` + `plantillaHits`; verify DB codigo unchanged.

## Apply

Same payload with `"dryRun":false`. Verify audit log + new codes; journal lines still point to same ids.

## Admin UI

1. Open http://localhost:5174/global-accounts  
2. Expand tree → Move → pick parent → review preview → Confirm  

## Tests

```bash
cd backend
npm run test:unit -- tests/unit/chart
npx vitest run --config vitest.integration.config.ts tests/admin/chart-commands.test.ts
cd ../admin-ui && npm run build
```
