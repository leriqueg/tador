import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPlantilla,
  loadPlantillas,
  resetPlantillaCache,
} from '../../src/plantillas/index.js';

describe('financial plantillas loader (T007)', () => {
  beforeEach(() => {
    resetPlantillaCache();
  });

  it('loads all four Sprint 009 financial templates', () => {
    const codes = [
      'comision_bancaria',
      'interes_tarjeta',
      'multa_financiera',
      'ganancia_inversion',
    ];
    const all = loadPlantillas();
    for (const code of codes) {
      expect(all.some((p) => p.code === code)).toBe(true);
      expect(getPlantilla(code)?.code).toBe(code);
    }
  });

  it('comision_bancaria debits 62010001 and credits bank group', () => {
    const tpl = getPlantilla('comision_bancaria');
    expect(tpl).toBeDefined();
    expect(tpl!.modes).toEqual(expect.arrayContaining(['hogar', 'pro']));
    expect(tpl!.lines[0]).toMatchObject({
      side: 'debit',
      groupCode: '62010001',
    });
    expect(tpl!.lines[1]).toMatchObject({
      side: 'credit',
      groupCode: '11120000',
    });
  });

  it('ganancia_inversion credits 41120002', () => {
    const tpl = getPlantilla('ganancia_inversion');
    expect(tpl!.modes).toEqual(['pro']);
    expect(tpl!.lines[1]).toMatchObject({
      side: 'credit',
      groupCode: '41120002',
    });
  });

  it('multa_financiera is PRO-only with multa expense line', () => {
    const tpl = getPlantilla('multa_financiera');
    expect(tpl!.modes).toEqual(['pro']);
    expect(tpl!.lines[0]).toMatchObject({
      side: 'debit',
      groupCode: '62010003',
    });
  });
});
