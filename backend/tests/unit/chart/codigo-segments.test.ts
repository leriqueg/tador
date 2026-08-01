import { describe, expect, it } from 'vitest';
import {
  buildCodigo,
  classDigit,
  isSameClass,
  nextFreeDdd,
  nextFreeGroupBbb,
  parseCodigo,
} from '../../../src/domain/chart/codigo-segments.js';

describe('codigo-segments', () => {
  it('parses and builds [A][BBB][C][DDD]', () => {
    const seg = parseCodigo('41010001');
    expect(seg).toEqual({
      classDigit: '4',
      bbb: '101',
      scope: '0',
      ddd: '001',
    });
    expect(buildCodigo(seg!)).toBe('41010001');
  });

  it('detects same class', () => {
    expect(isSameClass('41010001', '41020000')).toBe(true);
    expect(isSameClass('41010001', '61010001')).toBe(false);
    expect(classDigit('61120000')).toBe('6');
  });

  it('finds next free DDD', () => {
    const occupied = new Set(['41010001', '41010002']);
    expect(nextFreeDdd(occupied, '4', '101', '0')).toBe('003');
  });

  it('finds next free group BBB', () => {
    const occupied = new Set(['40000000', '41000000', '41010000']);
    // BBB 000,100,101 taken → next is 001 → 40010000
    expect(nextFreeGroupBbb(occupied, '4')).toBe('001');
  });
});
