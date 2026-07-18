/**
 * Accounts routes: list + create non-entity-provisioned accounts.
 * bank/card MUST be created via POST /api/entities.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import {
  AccountNotFoundError,
  BalancePolicyNotApplicableError,
  EntityProvisionRequiredError,
  ManualAccountTypeNotAllowedError,
  UnknownParentGroupError,
  type AccountApplicationService,
} from '../../application/account-service.js';
import type {
  CuentaUsuarioMetadata,
  TipoCuenta,
} from '../../domain/cuenta-usuario.js';
import { createAuthMiddleware } from '../middleware/auth.js';

interface CreateAccountBody {
  tipoCuenta: TipoCuenta;
  nombre: string;
  globalId?: string;
  parentGroupCodigo?: string;
  entidadId?: string;
  codigoPersonalizado?: string;
  metadata?: CuentaUsuarioMetadata;
}

interface UpdateBalancePolicyBody {
  enforceNonNegativeBalance: boolean;
}

export function registerAccountRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
  accountService: AccountApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  app.get(
    '/api/accounts',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;

      try {
        const accounts = await accountService.list(userId);
        return reply.status(200).send({ accounts });
      } catch (err) {
        request.log.error(err, 'Failed to list accounts');
        return reply.status(500).send({ error: 'Failed to list accounts' });
      }
    },
  );

  app.post(
    '/api/accounts',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const body = request.body as CreateAccountBody;
      const { tipoCuenta, nombre } = body;

      if (!tipoCuenta || !nombre) {
        return reply
          .status(400)
          .send({ error: 'tipoCuenta and nombre are required' });
      }

      try {
        const account = await accountService.create(userId, body);
        return reply.status(201).send({ account });
      } catch (err: unknown) {
        if (err instanceof EntityProvisionRequiredError) {
          return reply.status(422).send({ error: err.message });
        }
        if (err instanceof ManualAccountTypeNotAllowedError) {
          return reply.status(400).send({ error: err.message });
        }
        if (err instanceof UnknownParentGroupError) {
          return reply.status(400).send({ error: err.message });
        }
        request.log.error(err, 'Failed to create account');
        return reply.status(500).send({ error: 'Failed to create account' });
      }
    },
  );

  app.patch(
    '/api/accounts/:id/balance-policy',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };
      const { enforceNonNegativeBalance } =
        request.body as UpdateBalancePolicyBody;

      if (typeof enforceNonNegativeBalance !== 'boolean') {
        return reply.status(400).send({
          error: 'enforceNonNegativeBalance must be a boolean',
        });
      }

      try {
        const account = await accountService.updateBalancePolicy(
          userId,
          id,
          enforceNonNegativeBalance,
        );
        return reply.status(200).send({ account });
      } catch (err: unknown) {
        if (err instanceof AccountNotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof BalancePolicyNotApplicableError) {
          return reply.status(422).send({ error: err.message });
        }
        request.log.error(err, 'Failed to update account balance policy');
        return reply
          .status(500)
          .send({ error: 'Failed to update account balance policy' });
      }
    },
  );
}
