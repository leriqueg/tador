ALTER TABLE "cuentas_usuario"
ADD COLUMN "enforceNonNegativeBalance" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "activaciones_cuenta_global"
ADD COLUMN "enforceNonNegativeBalance" BOOLEAN NOT NULL DEFAULT true;
