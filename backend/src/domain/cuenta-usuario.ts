/**
 * CuentaUsuario domain entity.
 * Represents a user-created account: bank accounts, credit/debit cards,
 * digital wallets, or bridge/transfer accounts.
 */

export type TipoCuenta = 'bank' | 'card' | 'wallet' | 'bridge';

export interface CuentaUsuario {
  id: string;
  userId: string;
  globalId: string | null;
  entidadId: string | null;
  tipoCuenta: TipoCuenta;
  nombre: string;
  codigoPersonalizado: string | null;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}
