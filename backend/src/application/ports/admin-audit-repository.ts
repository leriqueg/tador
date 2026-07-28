/**
 * Port: append-only admin audit log (013).
 */

export interface AdminAuditAppendInput {
  operatorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  payloadBefore?: unknown;
  payloadAfter?: unknown;
  metadata?: unknown;
}

export interface AdminAuditLogEntry extends AdminAuditAppendInput {
  id: string;
  createdAt: Date;
}

export interface AdminAuditLogRepository {
  append(input: AdminAuditAppendInput): Promise<AdminAuditLogEntry>;
  list(query: {
    page?: number;
    pageSize?: number;
  }): Promise<{ entries: AdminAuditLogEntry[]; total: number }>;
}
