/**
 * CuentaUsuario domain entity.
 * Represents a user-created account: bank accounts, credit/debit cards,
 * digital wallets, or bridge/transfer accounts.
 */

export type TipoCuenta = 'bank' | 'card' | 'wallet' | 'bridge' | 'incomeCategory' | 'expenseCategory';

export type CardNetwork = 'VISA' | 'MASTERCARD' | 'AMEX' | 'OTRO';

export interface CuentaUsuarioMetadata {
  network?: CardNetwork | string;
  lastFour?: string;
  cutoffDay?: number;
}

export interface CuentaUsuario {
  id: string;
  userId: string;
  codigo: string | null;
  globalId: string | null;
  entidadId: string | null;
  tipoCuenta: TipoCuenta;
  nombre: string;
  codigoPersonalizado: string | null;
  metadata: CuentaUsuarioMetadata | null;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}
