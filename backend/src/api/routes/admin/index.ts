/**
 * Admin routes entry — registered only when deployment profile allows admin (013).
 */

import type { FastifyInstance } from 'fastify';
import type { OperatorAuthApplicationService } from '../../../application/admin/operator-auth-service.js';
import type { AdminUserApplicationService } from '../../../application/admin/admin-user-service.js';
import type { AdminTemplateApplicationService } from '../../../application/admin/admin-template-service.js';
import type { AdminGlobalAccountApplicationService } from '../../../application/admin/admin-global-account-service.js';
import type { AdminStatisticsApplicationService } from '../../../application/admin/admin-statistics-service.js';
import type { AdminAuditLogRepository } from '../../../application/ports/admin-audit-repository.js';
import { registerAdminAuthRoutes } from './auth.js';
import { registerAdminUserRoutes } from './users.js';
import { registerAdminTemplateRoutes } from './templates.js';
import { registerAdminGlobalAccountRoutes } from './global-accounts.js';
import { registerAdminStatisticsRoutes } from './statistics.js';
import { registerAdminAuditRoutes } from './audit.js';

export interface AdminRouteDeps {
  operatorAuth: OperatorAuthApplicationService;
  adminUsers: AdminUserApplicationService;
  adminTemplates: AdminTemplateApplicationService;
  adminGlobalAccounts: AdminGlobalAccountApplicationService;
  adminStatistics: AdminStatisticsApplicationService;
  adminAuditRepo: AdminAuditLogRepository;
}

export function registerAdminRoutes(
  app: FastifyInstance,
  deps: AdminRouteDeps,
): void {
  registerAdminAuthRoutes(app, deps.operatorAuth);
  registerAdminUserRoutes(app, deps.operatorAuth, deps.adminUsers);
  registerAdminTemplateRoutes(app, deps.operatorAuth, deps.adminTemplates);
  registerAdminGlobalAccountRoutes(
    app,
    deps.operatorAuth,
    deps.adminGlobalAccounts,
  );
  registerAdminStatisticsRoutes(app, deps.operatorAuth, deps.adminStatistics);
  registerAdminAuditRoutes(app, deps.operatorAuth, deps.adminAuditRepo);
}
