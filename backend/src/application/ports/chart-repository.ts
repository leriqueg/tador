/**
 * Port: chart structural mutations (014).
 */

import type { CuentaGlobal, ReportRole } from '../../domain/cuenta-global.js';
import type { CodeChange } from '../../domain/chart/cascade-recode.js';

export interface ChartUserAccountRow {
  id: string;
  userId: string;
  globalId: string | null;
  codigo: string | null;
}

export interface ChartRepository {
  listAll(): Promise<CuentaGlobal[]>;
  findById(id: string): Promise<CuentaGlobal | null>;
  findByCodigo(codigo: string): Promise<CuentaGlobal | null>;
  applyCodeChanges(changes: CodeChange[]): Promise<void>;
  listUserAccountsByGlobalIds(globalIds: string[]): Promise<ChartUserAccountRow[]>;
  updateUserCodigos(
    changes: Array<{ id: string; codigo: string }>,
  ): Promise<void>;
  create(data: {
    codigo: string;
    nombre: string;
    descripcion: string;
    esPostable: boolean;
    parentId: string | null;
    reportRole?: ReportRole;
  }): Promise<CuentaGlobal>;
  updateMeta(
    id: string,
    data: {
      nombre?: string;
      descripcion?: string;
      deprecatedAt?: Date | null;
      reportRole?: ReportRole;
      codigo?: string;
      parentId?: string | null;
      esPostable?: boolean;
    },
  ): Promise<CuentaGlobal>;
}
