/**
 * TADOR Backend — Fastify server bootstrap.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';

import { createUserRepository } from './infrastructure/repositories/user-repo.js';
import { createBookRepository } from './infrastructure/repositories/book-repo.js';
import { createEmailService } from './infrastructure/services/email-service.js';
import { createSessionService } from './infrastructure/services/session-service.js';
import { createArgon2PasswordHasher } from './infrastructure/services/argon2-password-hasher.js';
import { createTagRepository } from './infrastructure/repositories/tag-repo.js';
import { createAccountRepository } from './infrastructure/repositories/account-repo.js';
import { createEntidadRepository } from './infrastructure/repositories/entidad-repo.js';
import { createAuthApplicationService } from './application/auth-service.js';
import { createBookApplicationService } from './application/book-service.js';
import { createTagApplicationService } from './application/tag-service.js';
import { createChartApplicationService } from './application/chart-service.js';
import { createAccountApplicationService } from './application/account-service.js';
import { createEntityApplicationService } from './application/entity-service.js';
import { createJournalStore } from './infrastructure/repositories/journal-store.js';
import { createAccountingService } from './application/accounting-service.js';
import { createDashboardReportService } from './application/dashboard-report-service.js';
import { createFinancialAnalysisService } from './application/financial-analysis-service.js';
import { createDashboardReadRepository } from './infrastructure/repositories/dashboard-read-repo.js';
import { createFinancialAnalysisReadRepository } from './infrastructure/repositories/financial-analysis-read-repo.js';
import { createApunteRepository } from './infrastructure/repositories/apunte-repo.js';
import { createApunteApplicationService } from './application/apunte-service.js';
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
import { registerApunteRoutes } from './api/routes/apuntes.js';
import { registerPlantillasAdminRoutes } from './api/routes/plantillas-admin.js';
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
  const passwordHasher = createArgon2PasswordHasher();

  const authService = createAuthApplicationService(
    userRepo,
    bookRepo,
    sessionService,
    emailService,
    passwordHasher,
  );

  const bookService = createBookApplicationService(bookRepo, async (userId: string) => {
    const user = await userRepo.findById(userId);
    return user !== null && user !== undefined && user.verifiedAt !== null;
  });

  const dashboardReportService = createDashboardReportService(
    createDashboardReadRepository(),
  );
  const financialAnalysisService = createFinancialAnalysisService(
    createFinancialAnalysisReadRepository(),
  );
  const tagService = createTagApplicationService(createTagRepository());
  const accountRepo = createAccountRepository();
  const entidadRepo = createEntidadRepository();
  const chartService = createChartApplicationService(accountRepo, bookRepo);
  const accountService = createAccountApplicationService(accountRepo, bookRepo);
  const entityService = createEntityApplicationService(entidadRepo, accountRepo);
  const journalStore = createJournalStore();
  const accountingService = createAccountingService(journalStore);
  const apunteService = createApunteApplicationService({
    apuntes: createApunteRepository(),
    accounts: accountRepo,
    books: bookRepo,
    journalStore,
    accountingService,
  });

  // Routes
  registerAuthRoutes(app, authService);
  registerVerificationRoutes(app, authService);
  registerRecoveryRoutes(app, authService);
  registerBookRoutes(app, authService, bookService);
  registerChartRoutes(app, authService, chartService);
  registerAccountRoutes(app, authService, accountService);
  registerEntityRoutes(app, authService, entityService);
  registerTagRoutes(app, authService, tagService);
  registerEntryRoutes(app, authService, accountingService, bookService);
  registerBalanceRoutes(app, authService, accountingService, bookService);
  registerReportRoutes(
    app,
    authService,
    accountingService,
    bookService,
    dashboardReportService,
    financialAnalysisService,
  );
  registerPeriodRoutes(app, authService, accountingService, bookService);
  registerPlantillaRoutes(app, authService, accountRepo);
  registerApunteRoutes(app, authService, apunteService);
  registerPlantillasAdminRoutes(app, authService, bookService, accountRepo);

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
