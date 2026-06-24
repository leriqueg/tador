-- CreateEnum
CREATE TYPE "tipo_cuenta" AS ENUM ('bank', 'card', 'wallet', 'bridge');

-- CreateEnum
CREATE TYPE "tipo_entidad" AS ENUM ('person', 'organization', 'bank', 'issuer');

-- CreateTable
CREATE TABLE "cuentas_globales" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "esPostable" BOOLEAN NOT NULL DEFAULT false,
    "legacyId" INTEGER,
    "legacyCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_globales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_usuario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "globalId" TEXT,
    "entidadId" TEXT,
    "tipoCuenta" "tipo_cuenta" NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigoPersonalizado" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entidades" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "tipo_entidad" NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activaciones_cuenta_global" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "globalId" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "nombreOverride" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activaciones_cuenta_global_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_globales_codigo_key" ON "cuentas_globales"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "entidades_userId_nombre_key" ON "entidades"("userId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tags_userId_nombre_key" ON "tags"("userId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "activaciones_cuenta_global_userId_globalId_key" ON "activaciones_cuenta_global"("userId", "globalId");

-- AddForeignKey
ALTER TABLE "cuentas_globales" ADD CONSTRAINT "cuentas_globales_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "cuentas_globales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_usuario" ADD CONSTRAINT "cuentas_usuario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_usuario" ADD CONSTRAINT "cuentas_usuario_globalId_fkey" FOREIGN KEY ("globalId") REFERENCES "cuentas_globales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_usuario" ADD CONSTRAINT "cuentas_usuario_entidadId_fkey" FOREIGN KEY ("entidadId") REFERENCES "entidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entidades" ADD CONSTRAINT "entidades_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activaciones_cuenta_global" ADD CONSTRAINT "activaciones_cuenta_global_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activaciones_cuenta_global" ADD CONSTRAINT "activaciones_cuenta_global_globalId_fkey" FOREIGN KEY ("globalId") REFERENCES "cuentas_globales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
