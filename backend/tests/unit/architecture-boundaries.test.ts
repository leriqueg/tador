/**
 * Architecture boundary guards for Clean Architecture remediation.
 * Allowlists shrink as each remediation unit lands; never widen them.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC_ROOT = join(import.meta.dirname, '../../src');

/** Application files still allowed to import infrastructure / Prisma / argon2. */
const APPLICATION_ALLOWLIST = new Set<string>([]);

/** API files still allowed to import Prisma or infrastructure/database. */
const API_ALLOWLIST = new Set<string>([]);

const APPLICATION_FORBIDDEN =
  /from\s+['"][^'"]*(infrastructure\/|@prisma\/client|argon2)['"]|prisma\./;
const API_FORBIDDEN =
  /from\s+['"][^'"]*(infrastructure\/database|@prisma\/client)['"]|prisma\./;

function walkTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      files.push(...walkTsFiles(full));
    } else if (entry.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

function relSrc(abs: string): string {
  return relative(SRC_ROOT, abs).replace(/\\/g, '/');
}

describe('architecture boundaries', () => {
  it('application does not import infrastructure/Prisma/argon2 except allowlist', () => {
    const appDir = join(SRC_ROOT, 'application');
    const violations: string[] = [];

    for (const file of walkTsFiles(appDir)) {
      const rel = relSrc(file);
      if (APPLICATION_ALLOWLIST.has(rel)) continue;
      const source = readFileSync(file, 'utf8');
      if (APPLICATION_FORBIDDEN.test(source)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  it('api does not import Prisma/database except allowlist', () => {
    const apiDir = join(SRC_ROOT, 'api');
    const violations: string[] = [];

    for (const file of walkTsFiles(apiDir)) {
      const rel = relSrc(file);
      if (API_ALLOWLIST.has(rel)) continue;
      const source = readFileSync(file, 'utf8');
      if (API_FORBIDDEN.test(source)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  it('allowlists only contain files that currently violate', () => {
    for (const rel of APPLICATION_ALLOWLIST) {
      const source = readFileSync(join(SRC_ROOT, rel), 'utf8');
      expect(
        APPLICATION_FORBIDDEN.test(source),
        `${rel} is allowlisted but has no forbidden import`,
      ).toBe(true);
    }
    for (const rel of API_ALLOWLIST) {
      const source = readFileSync(join(SRC_ROOT, rel), 'utf8');
      expect(
        API_FORBIDDEN.test(source),
        `${rel} is allowlisted but has no forbidden import`,
      ).toBe(true);
    }
  });
});
