/**
 * Tag application service — tenant-scoped CRUD.
 */

import type { TagRecord, TagRepository } from './ports/tag-repository.js';

export class TagNotFoundError extends Error {
  constructor(message = 'Tag not found') {
    super(message);
    this.name = 'TagNotFoundError';
  }
}

export interface TagApplicationService {
  list(userId: string): Promise<TagRecord[]>;
  create(userId: string, nombre: string): Promise<TagRecord>;
  update(userId: string, id: string, nombre: string): Promise<TagRecord>;
  delete(userId: string, id: string): Promise<void>;
}

export function createTagApplicationService(
  tags: TagRepository,
): TagApplicationService {
  return {
    list(userId) {
      return tags.listByUser(userId);
    },

    create(userId, nombre) {
      return tags.create(userId, nombre);
    },

    async update(userId, id, nombre) {
      const existing = await tags.findByIdForUser(id, userId);
      if (!existing) throw new TagNotFoundError();
      return tags.updateNombre(id, nombre);
    },

    async delete(userId, id) {
      const existing = await tags.findByIdForUser(id, userId);
      if (!existing) throw new TagNotFoundError();
      await tags.delete(id);
    },
  };
}
