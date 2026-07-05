/**
 * Unit tests: Tag domain entity.
 *
 * Tag represents a simple user-owned tag for categorisation.
 * Tags are immutable after creation in the MVP (no updatedAt field).
 */

import { describe, it, expect } from 'vitest';
import { createTag } from '../../src/domain/tag.js';

describe('Tag', () => {
  it('should create a Tag with userId and nombre', () => {
    const tag = createTag('user-1', 'Important');

    expect(tag.userId).toBe('user-1');
    expect(tag.nombre).toBe('Important');
  });

  it('should set createdAt on creation', () => {
    const before = Date.now();
    const tag = createTag('user-1', 'Work');
    const after = Date.now();

    expect(tag.createdAt).toBeInstanceOf(Date);
    expect(tag.createdAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(tag.createdAt.getTime()).toBeLessThanOrEqual(after);
  });

  it('should not have an updatedAt field (inmutable in MVP)', () => {
    const tag = createTag('user-1', 'Inmutable');

    expect('updatedAt' in tag).toBe(false);
    expect((tag as Record<string, unknown>).updatedAt).toBeUndefined();
  });

  it('should allow empty string as nombre', () => {
    const tag = createTag('user-1', '');

    expect(tag.nombre).toBe('');
  });

  it('should have empty id assigned by repository', () => {
    const tag = createTag('user-1', 'Tag');

    expect(tag.id).toBe('');
  });
});
