import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPlantilla,
  loadPlantillas,
  resetPlantillaCache,
} from '../../src/plantillas/index.js';

describe('loan and card-debt plantillas', () => {
  beforeEach(() => {
    resetPlantillaCache();
  });

  it('loads prestamo_otorgado with CxC debit and liquid credit', () => {
    const tpl = getPlantilla('prestamo_otorgado');
    expect(tpl).toBeDefined();
    expect(tpl!.name).toBe('Prestar dinero');
    expect(tpl!.modes).toEqual(expect.arrayContaining(['hogar', 'pro']));
    expect(tpl!.lines[0]).toMatchObject({
      side: 'debit',
      groupCode: '11320000',
    });
    expect(tpl!.lines[1]).toMatchObject({
      side: 'credit',
      groupCodes: ['11110000', '11120000'],
    });
  });

  it('loads cobro_prestamo with liquid debit and CxC credit', () => {
    const tpl = getPlantilla('cobro_prestamo');
    expect(tpl).toBeDefined();
    expect(tpl!.name).toBe('Cobrar préstamo');
    expect(tpl!.lines[0]).toMatchObject({
      side: 'debit',
      groupCodes: ['11110000', '11120000'],
    });
    expect(tpl!.lines[1]).toMatchObject({
      side: 'credit',
      groupCode: '11320000',
    });
  });

  it('pago_tarjeta v2 accepts cash or bank as payment source', () => {
    const tpl = getPlantilla('pago_tarjeta');
    expect(tpl!.version).toBe(2);
    expect(tpl!.name).toBe('Pagar deuda de tarjeta');
    expect(tpl!.modes).toEqual(expect.arrayContaining(['hogar', 'pro']));
    expect(tpl!.lines[0]).toMatchObject({
      side: 'debit',
      groupCode: '21200000',
    });
    expect(tpl!.lines[1]).toMatchObject({
      side: 'credit',
      groupCodes: ['11110000', '11120000'],
    });
  });

  it('catalog includes the new loan templates', () => {
    const codes = loadPlantillas().map((p) => p.code);
    expect(codes).toEqual(expect.arrayContaining(['prestamo_otorgado', 'cobro_prestamo']));
  });
});
