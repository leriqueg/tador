/**
 * Tag domain entity.
 * Simple user-owned tags for categorisation. Immutable after creation in MVP.
 */

export interface Tag {
  id: string;
  userId: string;
  nombre: string;
  createdAt: Date;
}

export function createTag(userId: string, nombre: string): Tag {
  return {
    id: '', // assigned by repository
    userId,
    nombre,
    createdAt: new Date(),
  };
}
