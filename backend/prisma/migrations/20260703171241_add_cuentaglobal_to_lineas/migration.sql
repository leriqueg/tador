-- DropForeignKey
ALTER TABLE "lineas_asiento" DROP CONSTRAINT "lineas_asiento_cuentaId_fkey";

-- AlterTable
ALTER TABLE "lineas_asiento" ADD COLUMN     "cuentaGlobalId" TEXT,
ALTER COLUMN "cuentaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "lineas_asiento" ADD CONSTRAINT "lineas_asiento_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas_usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_asiento" ADD CONSTRAINT "lineas_asiento_cuentaGlobalId_fkey" FOREIGN KEY ("cuentaGlobalId") REFERENCES "cuentas_globales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
