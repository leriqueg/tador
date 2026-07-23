/**
 * Admin audit application service — append with secret redaction (013).
 */

import type {
  AdminAuditAppendInput,
  AdminAuditLogEntry,
  AdminAuditLogRepository,
} from '../ports/admin-audit-repository.js';

const SENSITIVE_KEY =
  /^(password|passwordhash|token|recoverytoken|sessiontoken|adminsession|authorization|secret|apikey)$/i;

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : redactValue(nested);
    }
    return out;
  }
  return value;
}

export interface AdminAuditService {
  append(input: AdminAuditAppendInput): Promise<AdminAuditLogEntry>;
}

export function createAdminAuditService(
  repo: AdminAuditLogRepository,
): AdminAuditService {
  return {
    async append(input: AdminAuditAppendInput): Promise<AdminAuditLogEntry> {
      return repo.append({
        ...input,
        payloadBefore:
          input.payloadBefore === undefined
            ? undefined
            : redactValue(input.payloadBefore),
        payloadAfter:
          input.payloadAfter === undefined
            ? undefined
            : redactValue(input.payloadAfter),
      });
    },
  };
}
