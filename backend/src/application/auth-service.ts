/**
 * Application service for authentication flows.
 * Orchestrates registration, login, verification, and recovery.
 */

import type { UserRepository } from './ports/user-repository.js';
import type { BookRepository } from './ports/book-repository.js';
import type { SessionService } from './ports/session-service.js';
import type { EmailService } from './ports/email-service.js';
import type { PasswordHasher } from './ports/password-hasher.js';
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

export function createAuthApplicationService(
  userRepo: UserRepository,
  bookRepo: BookRepository,
  sessionService: SessionService,
  emailService: EmailService,
  passwordHasher: PasswordHasher,
): AuthApplicationService {
  // Simple in-memory token stores (replace with DB in production)
  const verificationTokens = new Map<string, { userId: string; expiresAt: Date }>();
  const recoveryTokens = new Map<string, { userId: string; expiresAt: Date }>();

  return {
    async register(input: RegisterInput): Promise<AuthResult> {
      // Check for duplicate email
      const existing = await userRepo.findByEmail(input.email);
      if (existing) {
        throw new Error('Email already registered');
      }

      // Hash password
      const passwordHash = await passwordHasher.hash(input.password);

      // Create user
      const user = await userRepo.create({
        email: input.email,
        passwordHash,
      });

      // Create book with default config
      await bookRepo.create(user.id);

      // Generate verification token
      const token = generateVerificationToken();
      verificationTokens.set(token, {
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      });

      // Send verification email
      await emailService.sendVerificationEmail(user.email, token);

      // Create session
      const session = await sessionService.create(user.id);

      return {
        user,
        sessionToken: session.token,
        verificationToken: token, // exposed for testing
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
      const stored = verificationTokens.get(token);
      if (!stored) {
        throw new Error('Invalid or expired verification token');
      }

      if (stored.expiresAt < new Date()) {
        verificationTokens.delete(token);
        throw new Error('Verification token has expired');
      }

      const user = await userRepo.findById(stored.userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.verifiedAt = new Date();
      const updated = await userRepo.update(user);
      verificationTokens.delete(token);

      return updated;
    },

    async resendVerification(email: string): Promise<void> {
      const user = await userRepo.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        console.log(`[RESEND] No user found for email: ${email}`);
        return;
      }

      if (isUserVerified(user)) {
        console.log(`[RESEND] User ${email} already verified`);
        return;
      }

      const token = generateVerificationToken();
      verificationTokens.set(token, {
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await emailService.sendVerificationEmail(user.email, token);
    },

    async requestRecovery(email: string): Promise<void> {
      const user = await userRepo.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists per edge case spec
        console.log(`[RECOVERY] No user found for email: ${email}`);
        return;
      }

      const token = generateRecoveryToken();
      recoveryTokens.set(token, {
        userId: user.id,
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1h
      });

      await emailService.sendRecoveryEmail(user.email, token);
    },

    async resetPassword(token: string, newPassword: string): Promise<User> {
      const stored = recoveryTokens.get(token);
      if (!stored) {
        throw new Error('Invalid or expired recovery token');
      }

      if (stored.expiresAt < new Date()) {
        recoveryTokens.delete(token);
        throw new Error('Recovery token has expired');
      }

      const user = await userRepo.findById(stored.userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.passwordHash = await passwordHasher.hash(newPassword);
      const updated = await userRepo.update(user);
      recoveryTokens.delete(token);

      // Invalidate all sessions for this user
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
