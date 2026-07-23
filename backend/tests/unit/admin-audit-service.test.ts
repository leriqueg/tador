/**
 * RED: AdminAuditService redacts secrets from payloads (T015).
 */

import { describe, expect, it, vi } from 'vitest';
import { createAdminAuditService } from '../../src/application/admin/admin-audit-service.js';
import type { AdminAuditLogRepository } from '../../src/application/ports/admin-audit-repository.js';

describe('AdminAuditService', () => {
  it('appends audit entry with redacted password and token fields', async () => {
    const append = vi.fn(async (entry) => ({
      id: 'audit-1',
      ...entry,
      createdAt: new Date('2026-07-22T00:00:00.000Z'),
    }));
    const repo: AdminAuditLogRepository = { append };

    const service = createAdminAuditService(repo);
    await service.append({
      operatorId: 'op-1',
      action: 'user.force_password_recovery',
      targetType: 'User',
      targetId: 'u-1',
      payloadBefore: { email: 'a@b.com', password: 'secret', token: 'raw-token' },
      payloadAfter: { recoveryToken: 'abc', passwordHash: 'hash', status: 'ok' },
      metadata: { ip: '127.0.0.1' },
    });

    expect(append).toHaveBeenCalledTimes(1);
    const saved = append.mock.calls[0]![0];
    expect(saved.payloadBefore).toEqual({
      email: 'a@b.com',
      password: '[REDACTED]',
      token: '[REDACTED]',
    });
    expect(saved.payloadAfter).toEqual({
      recoveryToken: '[REDACTED]',
      passwordHash: '[REDACTED]',
      status: 'ok',
    });
    expect(saved.metadata).toEqual({ ip: '127.0.0.1' });
  });

  it('leaves non-sensitive nested fields intact', async () => {
    const append = vi.fn(async (entry) => ({
      id: 'audit-2',
      ...entry,
      createdAt: new Date(),
    }));
    const service = createAdminAuditService({ append });
    await service.append({
      operatorId: 'op-1',
      action: 'user.block',
      targetType: 'User',
      targetId: 'u-1',
      payloadAfter: { blockedReason: 'spam', nested: { note: 'ok' } },
    });
    const saved = append.mock.calls[0]![0];
    expect(saved.payloadAfter).toEqual({
      blockedReason: 'spam',
      nested: { note: 'ok' },
    });
  });
});
