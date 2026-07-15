/**
 * Auto-assign a codigo for a user account based on its parent CuentaGlobal.
 * Pattern [A][BBB][1][DDD] (8 digits).
 */

import { prisma } from '../infrastructure/database.js';

export async function autoAsignarCodigo(
  globalId: string | null,
  userId: string,
): Promise<string | null> {
  if (!globalId) return null;

  const parent = await prisma.cuentaGlobal.findUnique({
    where: { id: globalId },
    select: { codigo: true },
  });
  if (!parent) return null;

  const n1 = parent.codigo[0];
  const n2 = parent.codigo.substring(1, 4);
  const base = `${n1}${n2}1`;

  const existing = await prisma.cuentaUsuario.findFirst({
    where: {
      codigo: { startsWith: base },
      userId,
    },
    orderBy: { codigo: 'desc' },
    select: { codigo: true },
  });

  let nextN4 = 1;
  if (existing?.codigo) {
    const lastN4 = parseInt(existing.codigo.substring(7), 10);
    nextN4 = lastN4 + 1;
  }

  return `${base}${nextN4.toString().padStart(3, '0')}`;
}
