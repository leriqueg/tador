/**
 * TADOR Backend — Fastify server bootstrap.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';

import { createUserRepository } from './infrastructure/repositories/user-repo.js';
import { createBookRepository } from './infrastructure/repositories/book-repo.js';
import { createEmailService } from './infrastructure/services/email-service.js';
import { createSessionService } from './infrastructure/services/session-service.js';
import { createAuthApplicationService } from './application/auth-service.js';
import { createBookApplicationService } from './application/book-service.js';
import { createAccountingService } from './application/accounting-service.js';
import { registerAuthRoutes } from './api/routes/auth.js';
import { registerVerificationRoutes } from './api/routes/verification.js';
import { registerRecoveryRoutes } from './api/routes/recovery.js';
import { registerBookRoutes } from './api/routes/book.js';
import { registerChartRoutes } from './api/routes/chart.js';
import { registerAccountRoutes } from './api/routes/accounts.js';
import { registerEntityRoutes } from './api/routes/entities.js';
import { registerTagRoutes } from './api/routes/tags.js';
import { registerEntryRoutes } from './api/routes/entries.js';
import { registerBalanceRoutes } from './api/routes/balances.js';
import { registerReportRoutes } from './api/routes/reports.js';
import { registerPeriodRoutes } from './api/routes/periods.js';
import { registerPlantillaRoutes } from './api/routes/plantillas.js';
import { loadPlantillas } from './plantillas/index.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export async function buildApp(opts?: { logger?: boolean | object }) {
  const app = Fastify(
    opts?.logger !== undefined
      ? opts
      : {
          logger: {
            level: LOG_LEVEL,
            transport: {
              target: 'pino-pretty',
              options: { colorize: true },
            },
          },
        },
  );

  // Plugins
  await app.register(fastifyCookie, {
    secret: SESSION_SECRET,
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Dependencies
  const userRepo = createUserRepository();
  const bookRepo = createBookRepository();
  const emailService = createEmailService();
  const sessionService = createSessionService();

  const authService = createAuthApplicationService(
    userRepo,
    bookRepo,
    sessionService,
    emailService,
  );

  const bookService = createBookApplicationService(bookRepo, async (userId: string) => {
    const user = await userRepo.findById(userId);
    return user !== null && user !== undefined && user.verifiedAt !== null;
  });

  const accountingService = createAccountingService();

  // Routes
  registerAuthRoutes(app, authService);
  registerVerificationRoutes(app, authService);
  registerRecoveryRoutes(app, authService);
  registerBookRoutes(app, authService, bookService);
  registerChartRoutes(app, authService);
  registerAccountRoutes(app, authService);
  registerEntityRoutes(app, authService);
  registerTagRoutes(app, authService);
  registerEntryRoutes(app, authService, accountingService);
  registerBalanceRoutes(app, authService, accountingService);
  registerReportRoutes(app, authService, accountingService);
  registerPeriodRoutes(app, authService, accountingService);
  registerPlantillaRoutes(app, authService);

  // Eagerly load plantillas into memory
  loadPlantillas();

  return app;
}

export function setupSignalHandlers(app: FastifyInstance): void {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      await app.close();
      process.exit(0);
    });
  }
}

async function start() {
  const app = await buildApp();
  setupSignalHandlers(app);
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Server listening on ${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
