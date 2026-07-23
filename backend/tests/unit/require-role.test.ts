/**
 * Unit tests: requireRole ordering edge cases (013 T095).
 */

import { describe, it, expect, vi } from 'vitest';
import { requireRole } from '../../src/api/routes/admin/middleware/require-role.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

function mockReply() {
  const reply = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return reply as unknown as FastifyReply & {
    statusCode: number;
    body: unknown;
  };
}

describe('requireRole', () => {
  it('allows higher role when lower is required', async () => {
    const guard = requireRole('support');
    const request = {
      operatorRole: 'admin',
    } as FastifyRequest;
    const reply = mockReply();
    await guard(request, reply);
    expect(reply.statusCode).toBe(200);
    expect(reply.body).toBeNull();
  });

  it('denies lower role when higher is required', async () => {
    const guard = requireRole('admin');
    const request = {
      operatorRole: 'support',
    } as FastifyRequest;
    const reply = mockReply();
    await guard(request, reply);
    expect(reply.statusCode).toBe(403);
    expect(reply.body).toEqual({ error: 'Insufficient role' });
  });

  it('superadmin satisfies admin and support', async () => {
    const adminGate = requireRole('admin');
    const supportGate = requireRole('support');
    const request = { operatorRole: 'superadmin' } as FastifyRequest;
    const r1 = mockReply();
    const r2 = mockReply();
    await adminGate(request, r1);
    await supportGate(request, r2);
    expect(r1.statusCode).toBe(200);
    expect(r2.statusCode).toBe(200);
  });

  it('returns 401 when operator role missing', async () => {
    const guard = requireRole('support');
    const request = {} as FastifyRequest;
    const reply = mockReply();
    await guard(request, reply);
    expect(reply.statusCode).toBe(401);
  });
});
