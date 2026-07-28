# Data model: EntryBuilder decision graph

## DecisionGraph

- `rootId: string`
- `nodes: Record<string, DecisionNode>`

## DecisionNode (discriminated by `kind`)

| kind | Fields |
|------|--------|
| `choice` | `question`, `options[{ id, label, next }]` |
| `pick_entity` | `question`, `requiredCapability?`, `optional?`, `next` |
| `pick_account` | `question`, `role: debit\|credit`, `groupCodes?`, `tipoCuenta?`, `next` |
| `concept` | `question?`, `next` |
| `amount` | `question?`, `next` |
| `leaf` | `templateCode: string \| null` |

## WalkerState

- `nodeId`, `answers` (option ids), `entityId`, `debitAccountId`, `creditAccountId`, `concept`, `amount`, `history[]`

## Leaf → ApunteSubmitPayload

Same shape as today: `templateCode?`, `lines`, `entityId?`, `amount`, `concept`, `date`.
