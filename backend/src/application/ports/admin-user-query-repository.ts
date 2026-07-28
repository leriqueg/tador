/**
 * Port: admin user queries (cross-tenant reads for support) (013).
 */

export interface AdminUserListQuery {
  q?: string;
  blocked?: 'true' | 'false' | 'all';
  page?: number;
  pageSize?: number;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  fullName: string | null;
  verifiedAt: Date | null;
  blockedAt: Date | null;
  blockedReason: string | null;
  createdAt: Date;
}

export interface AdminUserDetail extends AdminUserListItem {
  sessionCount: number;
  bookId: string | null;
}

export interface AdminUserQueryRepository {
  list(
    query: AdminUserListQuery,
  ): Promise<{ users: AdminUserListItem[]; total: number }>;
  getDetail(id: string): Promise<AdminUserDetail | null>;
}
