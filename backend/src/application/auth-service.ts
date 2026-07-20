/**
 * Application service for authentication flows.
 * Orchestrates registration, login, verification, and recovery.
 */

import { createHash } from 'node:crypto';
import type { UserRepository } from './ports/user-repository.js';
import type { BookRepository } from './ports/book-repository.js';
import type { SessionService } from './ports/session-service.js';
import type { EmailService } from './ports/email-service.js';
import type { PasswordHasher } from './ports/password-hasher.js';
import type { AuthTokenRepository } from './ports/auth-token-repository.js';
import type { User } from '../domain/user.js';
import { isUserVerified } from '../domain/user.js';
import {
  generateVerificationToken,
  generateRecoveryToken,
} from '../domain/auth.js';

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  sessionToken: string;
  verificationToken?: string;
}

export interface AuthApplicationService {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
  verifyEmail(token: string): Promise<User>;
  resendVerification(email: string): Promise<void>;
  requestRecovery(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<User>;
  getAuthenticatedUser(sessionToken: string): Promise<User | null>;
  logout(sessionToken: string): Promise<void>;
  updateProfile(user: User): Promise<User>;
}

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function createAuthApplicationService(
  userRepo: UserRepository,
  bookRepo: BookRepository,
  sessionService: SessionService,
  emailService: EmailService,
  passwordHasher: PasswordHasher,
  authTokenRepo: AuthTokenRepository,
): AuthApplicationService {
  return {
    async register(input: RegisterInput): Promise<AuthResult> {
      const existing = await userRepo.findByEmail(input.email);
      if (existing) {
        throw new Error('Email already registered');
      }

      const passwordHash = await passwordHasher.hash(input.password);

      const user = await userRepo.create({
        email: input.email,
        passwordHash,
      });

      await bookRepo.create(user.id);

      const token = generateVerificationToken();
      await authTokenRepo.issue(
        user.id,
        'EMAIL_VERIFICATION',
        hashToken(token),
        new Date(Date.now() + 24 * 60 * 60 * 1000),
      );

      await emailService.sendVerificationEmail(user.email, token);

      const session = await sessionService.create(user.id);

      return {
        user,
        sessionToken: session.token,
        // Exposed for integration tests; not used by the SPA.
        verificationToken: token,
      };
    },

    async login(input: LoginInput): Promise<AuthResult> {
      const user = await userRepo.findByEmail(input.email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isValid = await passwordHasher.verify(user.passwordHash, input.password);
      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      const session = await sessionService.create(user.id);

      return {
        user,
        sessionToken: session.token,
      };
    },

    async verifyEmail(token: string): Promise<User> {
      const stored = await authTokenRepo.consume(
        hashToken(token),
        'EMAIL_VERIFICATION',
      );
      if (!stored) {
        throw new Error('Invalid or expired verification token');
      }

      const user = await userRepo.findById(stored.userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.verifiedAt = new Date();
      return userRepo.update(user);
    },

    async resendVerification(email: string): Promise<void> {
      const user = await userRepo.findByEmail(email);
      if (!user) {
        console.log(`[RESEND] No user found for email: ${email}`);
        return;
      }

      if (isUserVerified(user)) {
        console.log(`[RESEND] User ${email} already verified`);
        return;
      }

      const token = generateVerificationToken();
      await authTokenRepo.issue(
        user.id,
        'EMAIL_VERIFICATION',
        hashToken(token),
        new Date(Date.now() + 24 * 60 * 60 * 1000),
      );

      await emailService.sendVerificationEmail(user.email, token);
    },

    async requestRecovery(email: string): Promise<void> {
      const user = await userRepo.findByEmail(email);
      if (!user) {
        console.log(`[RECOVERY] No user found for email: ${email}`);
        return;
      }

      const token = generateRecoveryToken();
      await authTokenRepo.issue(
        user.id,
        'PASSWORD_RECOVERY',
        hashToken(token),
        new Date(Date.now() + 1 * 60 * 60 * 1000),
      );

      await emailService.sendRecoveryEmail(user.email, token);
    },

    async resetPassword(token: string, newPassword: string): Promise<User> {
      const stored = await authTokenRepo.consume(
        hashToken(token),
        'PASSWORD_RECOVERY',
      );
      if (!stored) {
        throw new Error('Invalid or expired recovery token');
      }

      const user = await userRepo.findById(stored.userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.passwordHash = await passwordHasher.hash(newPassword);
      const updated = await userRepo.update(user);

      await sessionService.deleteAllForUser(user.id);

      return updated;
    },

    async getAuthenticatedUser(sessionToken: string): Promise<User | null> {
      const session = await sessionService.findByToken(sessionToken);
      if (!session) return null;

      return userRepo.findById(session.userId);
    },

    async logout(sessionToken: string): Promise<void> {
      await sessionService.delete(sessionToken);
    },

    async updateProfile(user: User): Promise<User> {
      return userRepo.update(user);
    },
  };
}
