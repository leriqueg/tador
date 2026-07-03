-- CreateEnum
CREATE TYPE "asiento_tipo" AS ENUM ('manual', 'reversa');

-- CreateTable
CREATE TABLE "asientos" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "tipo" "asiento_tipo" NOT NULL,
    "asientoOriginalId" TEXT,
    "idempotencyKey" TEXT,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "anuladoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas_asiento" (
    "id" TEXT NOT NULL,
    "asientoId" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "debito" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "credito" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lineas_asiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asiento_versions" (
    "id" TEXT NOT NULL,
    "asientoId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "modifiedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asiento_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodos_contables" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "año" INTEGER NOT NULL,
    "abierto" BOOLEAN NOT NULL DEFAULT true,
    "cerradoAt" TIMESTAMP(3),
    "reabiertoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "periodos_contables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asientos_idempotencyKey_key" ON "asientos"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_contables_bookId_año_key" ON "periodos_contables"("bookId", "año");

-- AddForeignKey
ALTER TABLE "asientos" ADD CONSTRAINT "asientos_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asientos" ADD CONSTRAINT "asientos_asientoOriginalId_fkey" FOREIGN KEY ("asientoOriginalId") REFERENCES "asientos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_asiento" ADD CONSTRAINT "lineas_asiento_asientoId_fkey" FOREIGN KEY ("asientoId") REFERENCES "asientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_asiento" ADD CONSTRAINT "lineas_asiento_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas_usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asiento_versions" ADD CONSTRAINT "asiento_versions_asientoId_fkey" FOREIGN KEY ("asientoId") REFERENCES "asientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periodos_contables" ADD CONSTRAINT "periodos_contables_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
