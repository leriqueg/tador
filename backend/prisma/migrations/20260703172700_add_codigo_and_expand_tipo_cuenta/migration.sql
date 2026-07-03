-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "tipo_cuenta" ADD VALUE 'incomeCategory';
ALTER TYPE "tipo_cuenta" ADD VALUE 'expenseCategory';

-- AlterTable
ALTER TABLE "cuentas_usuario" ADD COLUMN     "codigo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_usuario_userId_codigo_key" ON "cuentas_usuario"("userId", "codigo");

