/**
 * Port: user-owned tags.
 */

export interface TagRecord {
  id: string;
  userId: string;
  nombre: string;
  createdAt: Date;
}

export interface TagRepository {
  listByUser(userId: string): Promise<TagRecord[]>;
  create(userId: string, nombre: string): Promise<TagRecord>;
  findByIdForUser(id: string, userId: string): Promise<TagRecord | null>;
  updateNombre(id: string, nombre: string): Promise<TagRecord>;
  delete(id: string): Promise<void>;
}

export class TagConflictError extends Error {
  constructor(message = 'A tag with this name already exists') {
    super(message);
    this.name = 'TagConflictError';
  }
}
