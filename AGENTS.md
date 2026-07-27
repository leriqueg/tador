# TADOR agent skills

Project skills live under `.agents/skills/`. Cursor subagents live under `.cursor/agents/`.

| Skill | Trigger (summary) | Path |
|-------|-------------------|------|
| `ui-storybook-sync` | UI audit, Storybook↔front, views, exceptions, polish, promote | [`.agents/skills/ui-storybook-sync/SKILL.md`](.agents/skills/ui-storybook-sync/SKILL.md) |
| `backend-development` | APIs, auth, DB, security, DevOps | [`.agents/skills/backend-development/SKILL.md`](.agents/skills/backend-development/SKILL.md) |
| `clean-architecture` | Layers, use cases, dependency direction | [`.agents/skills/clean-architecture/SKILL.md`](.agents/skills/clean-architecture/SKILL.md) |
| `web-design-guidelines` | UI a11y / Web Interface Guidelines review | [`.agents/skills/web-design-guidelines/SKILL.md`](.agents/skills/web-design-guidelines/SKILL.md) |

## Subagents

| Agent | When | Path |
|-------|------|------|
| `ui-design-governance` | **Prefer for audits & Storybook→front polish** | [`.cursor/agents/ui-design-governance.md`](.cursor/agents/ui-design-governance.md) |
| `ui-storybook-sync` | Drift sync when product changed first | [`.cursor/agents/ui-storybook-sync.md`](.cursor/agents/ui-storybook-sync.md) |

## UI governance (non-negotiable)

| Artifact | Path |
|----------|------|
| Policy ADR | [`docs/adr/0007-ui-catalog-governance.md`](docs/adr/0007-ui-catalog-governance.md) |
| Catalog rule | [`.cursor/rules/ui-catalog-governance.mdc`](.cursor/rules/ui-catalog-governance.mdc) |
| Density rule | [`.cursor/rules/hogar-pro-ui-density.mdc`](.cursor/rules/hogar-pro-ui-density.mdc) |
| View docs | [`frontend/docs/views/index.md`](frontend/docs/views/index.md) |
| Exceptions | [`frontend/docs/ui-exceptions.md`](frontend/docs/ui-exceptions.md) |
| Inventory | [`frontend/docs/component-inventory.md`](frontend/docs/component-inventory.md) |
| Mode intent | [`specs/foundation/modos-hogar-pro.md`](specs/foundation/modos-hogar-pro.md) |
