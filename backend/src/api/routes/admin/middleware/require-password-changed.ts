/**
 * Block privileged admin routes until operator changes bootstrap password (013).
 */

import type { FastifyRequest, FastifyReply } from 'fastify';

export async function requirePasswordChanged(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (request.operator?.mustChangePassword) {
    reply.status(403).send({
      error: 'Password change required',
      mustChangePassword: true,
    });
  }
}
