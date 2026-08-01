-- AlterTable
CREATE TYPE "report_role" AS ENUM ('normal', 'contra');

-- AlterTable
ALTER TABLE "cuentas_globales" ADD COLUMN "deprecatedAt" TIMESTAMP(3),
ADD COLUMN "reportRole" "report_role" NOT NULL DEFAULT 'normal';
