/**
 * Port: outbound email.
 */

export interface EmailService {
  sendVerificationEmail(to: string, token: string): Promise<void>;
  sendRecoveryEmail(to: string, token: string): Promise<void>;
}
