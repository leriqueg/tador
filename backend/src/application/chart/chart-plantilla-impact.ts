/**
 * Plantilla groupCode impact for chart mutations (014).
 */

import { getAllPlantillas } from '../../plantillas/index.js';

export interface PlantillaHit {
  code: string;
  groupCodes: string[];
}

export function findPlantillaHits(affectedCodigos: string[]): PlantillaHit[] {
  const affected = new Set(affectedCodigos);
  const hits: PlantillaHit[] = [];
  for (const p of getAllPlantillas()) {
    const codes: string[] = [];
    for (const line of p.lines) {
      if (line.groupCode) codes.push(line.groupCode);
      if (line.groupCodes) codes.push(...line.groupCodes);
    }
    if (codes.some((c) => affected.has(c))) {
      hits.push({ code: p.code, groupCodes: [...new Set(codes)] });
    }
  }
  return hits;
}
