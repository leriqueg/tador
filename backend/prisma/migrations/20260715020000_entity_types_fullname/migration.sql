-- Rename issuer → card_issuer; add wallet_platform; add users.fullName

ALTER TYPE "tipo_entidad" RENAME VALUE 'issuer' TO 'card_issuer';
ALTER TYPE "tipo_entidad" ADD VALUE IF NOT EXISTS 'wallet_platform';

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fullName" TEXT;
