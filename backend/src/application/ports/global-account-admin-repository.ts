/**
 * Port: admin global chart persistence (013 US3).
 */

import type { CuentaGlobal } from '../../domain/cuenta-global.js';

export interface GlobalAccountDependencies {
  activaciones: number;
  lineas: number;
  children: number;
  cuentasUsuario: number;
}

export interface GlobalAccountAdminRepository {
  listAll(): Promise<CuentaGlobal[]>;
  findById(id: string): Promise<CuentaGlobal | null>;
  findByCodigo(codigo: string): Promise<CuentaGlobal | null>;
  create(data: {
    codigo: string;
    nombre: string;
    descripcion: string;
    esPostable: boolean;
    parentId: string | null;
  }): Promise<CuentaGlobal>;
  update(
    id: string,
    data: {
      nombre?: string;
      descripcion?: string;
      esPostable?: boolean;
      parentId?: string | null;
    },
  ): Promise<CuentaGlobal>;
  delete(id: string): Promise<void>;
  dependencyCounts(id: string): Promise<GlobalAccountDependencies>;
}
