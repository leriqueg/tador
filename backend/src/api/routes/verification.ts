/**
 * Email verification routes.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';

export function registerVerificationRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
): void {
  // GET /auth/verify/:token
  app.get('/auth/verify/:token', async (request, reply) => {
    const { token } = request.params as { token: string };

    if (!token) {
      return reply.status(400).send({ error: 'Verification token is required' });
    }

    try {
      const user = await authService.verifyEmail(token);
      return reply.status(200).send({
        message: 'Email verified successfully',
        user: {
          id: user.id,
          email: user.email,
          verifiedAt: user.verifiedAt,
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Verification failed';
      if (
        message === 'Invalid or expired verification token' ||
        message === 'Verification token has expired'
      ) {
        return reply.status(400).send({ error: message });
      }
      request.log.error(err, 'Verification failed');
      return reply.status(500).send({ error: 'Verification failed' });
    }
  });

  // POST /auth/resend-verification
  app.post('/auth/resend-verification', async (request, reply) => {
    const { email } = request.body as { email: string };

    if (!email) {
      return reply.status(400).send({ error: 'Email is required' });
    }

    try {
      await authService.resendVerification(email);
      return reply.status(200).send({
        message:
          'If the email is registered, a verification link has been sent',
      });
    } catch (err) {
      request.log.error(err, 'Resend verification failed');
      return reply.status(500).send({ error: 'Failed to resend verification' });
    }
  });
}
