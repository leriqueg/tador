/**
 * PeriodoAnual domain entity.
 * Controls whether entries in a given fiscal year can be modified.
 */

export type TipoEventoPeriodo = 'cierre' | 'reapertura';

export interface EventoPeriodo {
  tipo: TipoEventoPeriodo;
  userId: string;
  fecha: Date;
}

export interface PeriodoAnual {
  id: string;
  bookId: string;
  año: number;
  cerrado: boolean;
  cerradoEn: Date | null;
  reabiertoEn: Date | null;
  historia: EventoPeriodo[];
}
