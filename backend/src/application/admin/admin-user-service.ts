/**
 * Admin user support application service (013 US2).
 */

import { createHash } from 'node:crypto';
import type { User } from '../../domain/user.js';
import { isUserBlocked } from '../../domain/user.js';
import { generateRecoveryToken } from '../../domain/auth.js';
import type { UserRepository } from '../ports/user-repository.js';
import type { SessionService } from '../ports/session-service.js';
import type { AuthTokenRepository } from '../ports/auth-token-repository.js';
import type { EmailService } from '../ports/email-service.js';
import type {
  AdminUserDetail,
  AdminUserListItem,
  AdminUserListQuery,
  AdminUserQueryRepository,
} from '../ports/admin-user-query-repository.js';
import type { AdminAuditService } from './admin-audit-service.js';

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export interface AdminUserApplicationService {
  list(query: AdminUserListQuery): Promise<{ users: AdminUserListItem[]; total: number }>;
  get(id: string): Promise<AdminUserDetail | null>;
  block(operatorId: string, userId: string, reason?: string | null): Promise<User>;
  unblock(operatorId: string, userId: string): Promise<User>;
  forceRecovery(operatorId: string, userId: string): Promise<{ userId: string }>;
}

export function createAdminUserApplicationService(
  userRepo: UserRepository,
  userQuery: AdminUserQueryRepository,
  sessionService: SessionService,
  authTokenRepo: AuthTokenRepository,
  emailService: EmailService,
  audit: AdminAuditService,
): AdminUserApplicationService {
  return {
    list(query) {
      return userQuery.list(query);
    },

    get(id) {
      return userQuery.getDetail(id);
    },

    async block(operatorId, userId, reason) {
      const user = await userRepo.findById(userId);
      if (!user) throw new Error('User not found');

      if (!isUserBlocked(user)) {
        user.blockedAt = new Date();
        user.blockedReason = reason?.trim() || null;
        await userRepo.update(user);
        await sessionService.deleteAllForUser(userId);
      }

      await audit.append({
        operatorId,
        action: 'user.block',
        targetType: 'User',
        targetId: userId,
        payloadAfter: {
          blockedAt: user.blockedAt,
          blockedReason: user.blockedReason,
        },
      });
      return user;
    },

    async unblock(operatorId, userId) {
      const user = await userRepo.findById(userId);
      if (!user) throw new Error('User not found');
      const before = { blockedAt: user.blockedAt, blockedReason: user.blockedReason };
      user.blockedAt = null;
      user.blockedReason = null;
      await userRepo.update(user);
      await audit.append({
        operatorId,
        action: 'user.unblock',
        targetType: 'User',
        targetId: userId,
        payloadBefore: before,
        payloadAfter: { blockedAt: null, blockedReason: null },
      });
      return user;
    },

    async forceRecovery(operatorId, userId) {
      const user = await userRepo.findById(userId);
      if (!user) throw new Error('User not found');

      const token = generateRecoveryToken();
      await authTokenRepo.issue(
        user.id,
        'PASSWORD_RECOVERY',
        hashToken(token),
        new Date(Date.now() + 24 * 60 * 60 * 1000),
      );
      await sessionService.deleteAllForUser(userId);
      await emailService.sendRecoveryEmail(user.email, token);

      await audit.append({
        operatorId,
        action: 'user.force_password_recovery',
        targetType: 'User',
        targetId: userId,
        payloadAfter: { email: user.email },
      });

      return { userId };
    },
  };
}
