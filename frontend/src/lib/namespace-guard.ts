import type { BookMode } from './api.ts';

/** Route segments that still exist unprefixed and must migrate to a mode namespace. */
const LEGACY_SEGMENTS = new Set([
  'dashboard',
  'entries',
  'finances',
  'accounts',
  'entities',
  'settings',
]);

function otherMode(mode: BookMode): BookMode {
  return mode === 'hogar' ? 'pro' : 'hogar';
}

/**
 * Pure resolver for US0 — namespace guard.
 *
 * Returns the path to redirect to, or null when no redirect is needed:
 * - Cross-namespace paths (`/hogar/*` while mode=pro, and vice versa) map to
 *   the equivalent path under the book's own namespace.
 * - Legacy unprefixed paths (pre-Sprint-07) map to `/${mode}/...`.
 */
export function resolveNamespaceRedirect(pathname: string, mode: BookMode): string | null {
  const foreign = otherMode(mode);
  const foreignPrefix = `/${foreign}`;

  if (pathname === foreignPrefix || pathname.startsWith(`${foreignPrefix}/`)) {
    return `/${mode}${pathname.slice(foreignPrefix.length)}`;
  }

  const segments = pathname.split('/').filter(Boolean);
  const [firstSegment] = segments;
  if (firstSegment && LEGACY_SEGMENTS.has(firstSegment)) {
    return `/${mode}/${segments.join('/')}`;
  }

  return null;
}
