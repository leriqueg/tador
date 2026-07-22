/**
 * TADOR Backend — Fastify server bootstrap.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';

import { createUserRepository } from './infrastructure/repositories/user-repo.js';
import { createBookRepository } from './infrastructure/repositories/book-repo.js';
import { createEmailService } from './infrastructure/services/email-service.js';
import { createSessionService } from './infrastructure/services/session-service.js';
import { createArgon2PasswordHasher } from './infrastructure/services/argon2-password-hasher.js';
import { createTagRepository } from './infrastructure/repositories/tag-repo.js';
import { createAccountRepository } from './infrastructure/repositories/account-repo.js';
import { createEntidadRepository } from './infrastructure/repositories/entidad-repo.js';
import { createAuthTokenRepository } from './infrastructure/repositories/auth-token-repo.js';
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
import { registerAdminRoutes } from './api/routes/admin/index.js';
import { createOperatorRepository } from './infrastructure/repositories/operator-repository.js';
import { createAdminAuditRepository } from './infrastructure/repositories/admin-audit-repository.js';
import { createAdminAuditService } from './application/admin/admin-audit-service.js';
import { createOperatorAuthApplicationService } from './application/admin/operator-auth-service.js';
import { createAdminUserApplicationService } from './application/admin/admin-user-service.js';
import { createAdminTemplateApplicationService } from './application/admin/admin-template-service.js';
import { createAdminGlobalAccountApplicationService } from './application/admin/admin-global-account-service.js';
import { createAdminStatisticsApplicationService } from './application/admin/admin-statistics-service.js';
import { createGlobalAccountAdminRepository } from './infrastructure/repositories/global-account-admin-repository.js';
import { createAdminStatisticsReadRepository } from './infrastructure/repositories/admin-statistics-read-repository.js';
import { createAdminUserQueryRepository } from './infrastructure/repositories/admin-user-query-repository.js';
import { ensureBootstrapOperator } from '../prisma/seed/ensure-bootstrap-operator.js';
import {
  deploymentAllowsAdmin,
  deploymentAllowsProduct,
  parseDeploymentProfile,
} from './deployment-profile.js';
import { loadPlantillas } from './plantillas/index.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production';
const OPERATOR_SESSION_SECRET =
  process.env.OPERATOR_SESSION_SECRET || SESSION_SECRET;

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export async function buildApp(opts?: { logger?: boolean | object }) {
  const deploymentProfile = parseDeploymentProfile();
  const allowProduct = deploymentAllowsProduct(deploymentProfile);
  const allowAdmin = deploymentAllowsAdmin(deploymentProfile);

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

  // Plugins — accept both product and operator cookie secrets for signed cookies.
  await app.register(fastifyCookie, {
    secret: [SESSION_SECRET, OPERATOR_SESSION_SECRET],
  });

  // CORS allowlist (OWASP A05). SPA uses Vite same-origin proxy in MVP;
  // allow explicit browser origins when FE/BE are split.
  const productCors = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const adminCors = allowAdmin
    ? (process.env.ADMIN_CORS_ORIGIN ?? 'http://localhost:5174')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];
  const corsOrigins = [...new Set([...productCors, ...adminCors])];
  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      // Non-browser / same-origin / inject clients omit Origin.
      if (!origin) {
        cb(null, true);
        return;
      }
      cb(null, corsOrigins.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Security headers (OWASP A05) — API JSON; CSP disabled to avoid breaking clients.
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  });

  // Global soft limit; auth routes apply a stricter override (see auth/recovery).
  // Integration suites create many users from one client — raise max under VITEST.
  const isTest = process.env.VITEST === 'true';
  await app.register(fastifyRateLimit, {
    global: true,
    max: isTest ? 10_000 : 200,
    timeWindow: '1 minute',
  });

  // Health check (no rate-limit noise in probes)
  app.get('/health', {
    config: { rateLimit: false },
  }, async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Dependencies
  const userRepo = createUserRepository();
  const bookRepo = createBookRepository();
  const emailService = createEmailService();
  const sessionService = createSessionService();
  const passwordHasher = createArgon2PasswordHasher();
  const authTokenRepo = createAuthTokenRepository();

  const authService = createAuthApplicationService(
    userRepo,
    bookRepo,
    sessionService,
    emailService,
    passwordHasher,
    authTokenRepo,
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

  const operatorRepo = createOperatorRepository();
  const adminAuditRepo = createAdminAuditRepository();
  const adminAuditService = createAdminAuditService(adminAuditRepo);
  const operatorAuthService = createOperatorAuthApplicationService(
    operatorRepo,
    passwordHasher,
  );
  const adminUserService = createAdminUserApplicationService(
    userRepo,
    createAdminUserQueryRepository(),
    sessionService,
    authTokenRepo,
    emailService,
    adminAuditService,
  );
  const adminTemplateService = createAdminTemplateApplicationService(
    accountRepo,
    bookService,
  );
  const adminGlobalAccountService = createAdminGlobalAccountApplicationService(
    createGlobalAccountAdminRepository(),
    adminAuditService,
  );
  const adminStatisticsService = createAdminStatisticsApplicationService(
    createAdminStatisticsReadRepository(),
  );

  // Routes — gated by DEPLOYMENT_PROFILE (ADR 0006).
  if (allowProduct) {
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
  }

  const plantillasAdminEnabled =
    process.env.NODE_ENV !== 'production' &&
    deploymentProfile !== 'product' &&
    process.env.ENABLE_PLANTILLAS_ADMIN !== 'false';
  if (allowProduct && plantillasAdminEnabled) {
    registerPlantillasAdminRoutes(app, authService, bookService, accountRepo);
  }

  if (allowAdmin) {
    registerAdminRoutes(app, {
      operatorAuth: operatorAuthService,
      adminUsers: adminUserService,
      adminTemplates: adminTemplateService,
      adminGlobalAccounts: adminGlobalAccountService,
      adminStatistics: adminStatisticsService,
      adminAuditRepo: adminAuditRepo,
    });
  }

  // Eagerly load plantillas into memory
  loadPlantillas();

  // Expose for tests / diagnostics without changing Fastify types.
  (app as FastifyInstance & { deploymentProfile?: string }).deploymentProfile =
    deploymentProfile;

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
  // Dev convenience: bootstrap first superadmin after migrate (staging/prod: release job).
  if (process.env.NODE_ENV !== 'production' && process.env.VITEST !== 'true') {
    try {
      await ensureBootstrapOperator(
        createOperatorRepository(),
        createArgon2PasswordHasher(),
        process.env,
        (msg) => console.log(msg),
      );
    } catch (err) {
      console.error('[admin-bootstrap] failed', err);
    }
  }

  const app = await buildApp();
  setupSignalHandlers(app);
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(
      `Server listening on ${HOST}:${PORT} (DEPLOYMENT_PROFILE=${parseDeploymentProfile()})`,
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
