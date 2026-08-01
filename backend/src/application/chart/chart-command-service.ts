/**
 * Chart command application service (014).
 */

import {
  isValidGlobalAccountCodigo,
  validateGlobalAccountCreate,
  type ReportRole,
} from '../../domain/cuenta-global.js';
import {
  planReparentCascade,
  type CodeChange,
} from '../../domain/chart/cascade-recode.js';
import { buildCodigo, nextFreeDdd, parseCodigo } from '../../domain/chart/codigo-segments.js';
import type { ChartRepository } from '../ports/chart-repository.js';
import type { AdminAuditService } from '../admin/admin-audit-service.js';
import { findPlantillaHits } from './chart-plantilla-impact.js';

export class ChartValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChartValidationError';
  }
}

export interface ChartAccountChangeDto {
  id: string;
  nombre: string;
  codigoBefore: string;
  codigoAfter: string;
  parentIdBefore: string | null;
  parentIdAfter: string | null;
}

export interface ChartUserChangeDto {
  id: string;
  userId: string;
  codigoBefore: string | null;
  codigoAfter: string | null;
}

export interface ChartCommandResult {
  dryRun: boolean;
  command: string;
  accountChanges: ChartAccountChangeDto[];
  userAccountChanges: ChartUserChangeDto[];
  plantillaHits: Array<{ code: string; groupCodes: string[] }>;
  warnings: string[];
}

function planUserCascades(
  codeChanges: CodeChange[],
  users: Array<{ id: string; userId: string; globalId: string | null; codigo: string | null }>,
): ChartUserChangeDto[] {
  const byGlobal = new Map(codeChanges.map((c) => [c.id, c]));
  const occupiedByUser = new Map<string, Set<string>>();
  const result: ChartUserChangeDto[] = [];

  for (const u of users) {
    if (!u.globalId) continue;
    const change = byGlobal.get(u.globalId);
    if (!change) continue;
    const seg = parseCodigo(change.codigoAfter);
    if (!seg) continue;
    let set = occupiedByUser.get(u.userId);
    if (!set) {
      set = new Set();
      occupiedByUser.set(u.userId, set);
    }
    const ddd = nextFreeDdd(set, seg.classDigit, seg.bbb, '1') ?? '001';
    const after = buildCodigo({
      classDigit: seg.classDigit,
      bbb: seg.bbb,
      scope: '1',
      ddd,
    });
    set.add(after);
    result.push({
      id: u.id,
      userId: u.userId,
      codigoBefore: u.codigo,
      codigoAfter: after,
    });
  }
  return result;
}

export interface ChartCommandService {
  reparent(input: {
    operatorId: string;
    accountId: string;
    newParentId: string;
    dryRun: boolean;
    cascadeUserCodigos?: boolean;
  }): Promise<ChartCommandResult>;
  create(input: {
    operatorId: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    esPostable: boolean;
    parentId?: string | null;
    reportRole?: ReportRole;
    dryRun: boolean;
  }): Promise<ChartCommandResult>;
  rename(input: {
    operatorId: string;
    accountId: string;
    nombre: string;
    descripcion?: string;
    reportRole?: ReportRole;
    dryRun: boolean;
  }): Promise<ChartCommandResult>;
  recode(input: {
    operatorId: string;
    accountId: string;
    newCodigo: string;
    dryRun: boolean;
    cascadeUserCodigos?: boolean;
  }): Promise<ChartCommandResult>;
  deprecate(input: {
    operatorId: string;
    accountId: string;
    dryRun: boolean;
  }): Promise<ChartCommandResult>;
}

export function createChartCommandService(
  repo: ChartRepository,
  audit: AdminAuditService,
): ChartCommandService {
  async function enrich(
    command: string,
    dryRun: boolean,
    changes: CodeChange[],
    cascadeUser: boolean,
    warnings: string[] = [],
  ): Promise<ChartCommandResult> {
    const all = await repo.listAll();
    const byId = new Map(all.map((a) => [a.id, a]));
    const accountChanges: ChartAccountChangeDto[] = changes.map((c) => ({
      id: c.id,
      nombre: byId.get(c.id)?.nombre ?? '',
      codigoBefore: c.codigoBefore,
      codigoAfter: c.codigoAfter,
      parentIdBefore: c.parentIdBefore,
      parentIdAfter: c.parentIdAfter,
    }));
    const codes = [
      ...changes.map((c) => c.codigoBefore),
      ...changes.map((c) => c.codigoAfter),
    ];
    const plantillaHits = findPlantillaHits(codes);
    const users = await repo.listUserAccountsByGlobalIds(changes.map((c) => c.id));
    const userAccountChanges = planUserCascades(changes, users);

    return {
      dryRun,
      command,
      accountChanges,
      userAccountChanges: cascadeUser || dryRun ? userAccountChanges : [],
      plantillaHits,
      warnings,
    };
  }

  return {
    async reparent(input) {
      const cascadeUser = input.cascadeUserCodigos !== false;
      const nodes = await repo.listAll();
      const plan = planReparentCascade(
        nodes.map((n) => ({
          id: n.id,
          parentId: n.parentId,
          codigo: n.codigo,
          esPostable: n.esPostable,
          nombre: n.nombre,
        })),
        input.accountId,
        input.newParentId,
      );
      if (!plan.ok) throw new ChartValidationError(plan.error);

      const preview = await enrich(
        'reparent',
        input.dryRun,
        plan.changes,
        cascadeUser,
      );
      if (input.dryRun) return preview;

      await repo.applyCodeChanges(plan.changes);
      if (cascadeUser && preview.userAccountChanges.length > 0) {
        await repo.updateUserCodigos(
          preview.userAccountChanges
            .filter((u) => u.codigoAfter)
            .map((u) => ({ id: u.id, codigo: u.codigoAfter! })),
        );
      }
      await audit.append({
        operatorId: input.operatorId,
        action: 'chart.reparent',
        targetType: 'CuentaGlobal',
        targetId: input.accountId,
        payloadAfter: preview,
      });
      return { ...preview, dryRun: false };
    },

    async create(input) {
      let parentEsPostable: boolean | null = null;
      if (input.parentId) {
        const parent = await repo.findById(input.parentId);
        if (!parent) throw new ChartValidationError('parent not found');
        parentEsPostable = parent.esPostable;
      }
      const err = validateGlobalAccountCreate({
        codigo: input.codigo,
        nombre: input.nombre,
        esPostable: input.esPostable,
        parentId: input.parentId ?? null,
        parentEsPostable,
      });
      if (err) throw new ChartValidationError(err);
      const existing = await repo.findByCodigo(input.codigo);
      if (existing) throw new ChartValidationError('codigo already exists');

      const change: CodeChange = {
        id: '(new)',
        codigoBefore: '',
        codigoAfter: input.codigo,
        parentIdBefore: null,
        parentIdAfter: input.parentId ?? null,
      };
      const preview: ChartCommandResult = {
        dryRun: input.dryRun,
        command: 'create',
        accountChanges: [
          {
            id: '(new)',
            nombre: input.nombre,
            codigoBefore: '',
            codigoAfter: input.codigo,
            parentIdBefore: null,
            parentIdAfter: input.parentId ?? null,
          },
        ],
        userAccountChanges: [],
        plantillaHits: findPlantillaHits([input.codigo]),
        warnings: [],
      };
      if (input.dryRun) return preview;

      const row = await repo.create({
        codigo: input.codigo,
        nombre: input.nombre.trim(),
        descripcion: input.descripcion?.trim() ?? '',
        esPostable: input.esPostable,
        parentId: input.parentId ?? null,
        reportRole: input.reportRole,
      });
      preview.accountChanges[0]!.id = row.id;
      await audit.append({
        operatorId: input.operatorId,
        action: 'chart.create',
        targetType: 'CuentaGlobal',
        targetId: row.id,
        payloadAfter: { ...preview, dryRun: false },
      });
      void change;
      return { ...preview, dryRun: false };
    },

    async rename(input) {
      const existing = await repo.findById(input.accountId);
      if (!existing) throw new ChartValidationError('Account not found');
      if (!input.nombre?.trim()) {
        throw new ChartValidationError('nombre is required');
      }
      const preview: ChartCommandResult = {
        dryRun: input.dryRun,
        command: 'rename',
        accountChanges: [
          {
            id: existing.id,
            nombre: input.nombre.trim(),
            codigoBefore: existing.codigo,
            codigoAfter: existing.codigo,
            parentIdBefore: existing.parentId,
            parentIdAfter: existing.parentId,
          },
        ],
        userAccountChanges: [],
        plantillaHits: [],
        warnings: [],
      };
      if (input.dryRun) return preview;

      await repo.updateMeta(existing.id, {
        nombre: input.nombre.trim(),
        descripcion: input.descripcion,
        reportRole: input.reportRole,
      });
      await audit.append({
        operatorId: input.operatorId,
        action: 'chart.rename',
        targetType: 'CuentaGlobal',
        targetId: existing.id,
        payloadBefore: { nombre: existing.nombre },
        payloadAfter: { nombre: input.nombre.trim(), reportRole: input.reportRole },
      });
      return { ...preview, dryRun: false };
    },

    async recode(input) {
      const cascadeUser = input.cascadeUserCodigos !== false;
      if (!isValidGlobalAccountCodigo(input.newCodigo)) {
        throw new ChartValidationError('codigo must be an 8-digit numeric code');
      }
      const existing = await repo.findById(input.accountId);
      if (!existing) throw new ChartValidationError('Account not found');
      const clash = await repo.findByCodigo(input.newCodigo);
      if (clash && clash.id !== existing.id) {
        throw new ChartValidationError('codigo already exists');
      }
      const from = parseCodigo(existing.codigo);
      const to = parseCodigo(input.newCodigo);
      if (!from || !to || from.classDigit !== to.classDigit) {
        throw new ChartValidationError('cross-class reparent is not allowed');
      }
      const change: CodeChange = {
        id: existing.id,
        codigoBefore: existing.codigo,
        codigoAfter: input.newCodigo,
        parentIdBefore: existing.parentId,
        parentIdAfter: existing.parentId,
      };
      const preview = await enrich('recode', input.dryRun, [change], cascadeUser);
      if (input.dryRun) return preview;
      await repo.applyCodeChanges([change]);
      if (cascadeUser && preview.userAccountChanges.length > 0) {
        await repo.updateUserCodigos(
          preview.userAccountChanges
            .filter((u) => u.codigoAfter)
            .map((u) => ({ id: u.id, codigo: u.codigoAfter! })),
        );
      }
      await audit.append({
        operatorId: input.operatorId,
        action: 'chart.recode',
        targetType: 'CuentaGlobal',
        targetId: existing.id,
        payloadAfter: preview,
      });
      return { ...preview, dryRun: false };
    },

    async deprecate(input) {
      const existing = await repo.findById(input.accountId);
      if (!existing) throw new ChartValidationError('Account not found');
      const preview: ChartCommandResult = {
        dryRun: input.dryRun,
        command: 'deprecate',
        accountChanges: [
          {
            id: existing.id,
            nombre: existing.nombre,
            codigoBefore: existing.codigo,
            codigoAfter: existing.codigo,
            parentIdBefore: existing.parentId,
            parentIdAfter: existing.parentId,
          },
        ],
        userAccountChanges: [],
        plantillaHits: findPlantillaHits([existing.codigo]),
        warnings: existing.deprecatedAt
          ? ['account already deprecated']
          : [],
      };
      if (input.dryRun) return preview;
      const at = existing.deprecatedAt ?? new Date();
      await repo.updateMeta(existing.id, { deprecatedAt: at });
      await audit.append({
        operatorId: input.operatorId,
        action: 'chart.deprecate',
        targetType: 'CuentaGlobal',
        targetId: existing.id,
        payloadAfter: { deprecatedAt: at.toISOString() },
      });
      return { ...preview, dryRun: false };
    },
  };
}
