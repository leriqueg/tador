/**
 * Password recovery routes.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';

export function registerRecoveryRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
): void {
  // POST /auth/recovery/request
  app.post('/auth/recovery/request', async (request, reply) => {
    const { email } = request.body as { email: string };

    if (!email) {
      return reply.status(400).send({ error: 'Email is required' });
    }

    try {
      await authService.requestRecovery(email);
      return reply.status(200).send({
        message:
          'If the email is registered, a recovery link has been sent',
      });
    } catch (err) {
      request.log.error(err, 'Recovery request failed');
      return reply.status(500).send({ error: 'Failed to process recovery request' });
    }
  });

  // POST /auth/recovery/reset
  app.post('/auth/recovery/reset', async (request, reply) => {
    const { token, newPassword } = request.body as {
      token: string;
      newPassword: string;
    };

    if (!token || !newPassword) {
      return reply
        .status(400)
        .send({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return reply
        .status(400)
        .send({ error: 'Password must be at least 8 characters' });
    }

    try {
      const user = await authService.resetPassword(token, newPassword);
      return reply.status(200).send({
        message: 'Password reset successfully',
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Password reset failed';
      if (
        message === 'Invalid or expired recovery token' ||
        message === 'Recovery token has expired'
      ) {
        return reply.status(400).send({ error: message });
      }
      request.log.error(err, 'Password reset failed');
      return reply.status(500).send({ error: 'Password reset failed' });
    }
  });
}
