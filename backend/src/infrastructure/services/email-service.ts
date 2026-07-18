/**
 * Email service — MVP stub implementation.
 * Logs emails to console instead of sending them.
 */

import type { EmailService } from '../../application/ports/email-service.js';

export type { EmailService };

export function createEmailService(): EmailService {
  return {
    async sendVerificationEmail(to: string, token: string): Promise<void> {
      console.log(`[EMAIL STUB] Verification email to ${to}`);
      console.log(`[EMAIL STUB] Token: ${token}`);
      console.log(
        `[EMAIL STUB] Verify URL: http://localhost:3000/auth/verify/${token}`,
      );
    },

    async sendRecoveryEmail(to: string, token: string): Promise<void> {
      console.log(`[EMAIL STUB] Recovery email to ${to}`);
      console.log(`[EMAIL STUB] Token: ${token}`);
      console.log(
        `[EMAIL STUB] Reset URL: http://localhost:3000/auth/recovery/reset?token=${token}`,
      );
    },
  };
}
