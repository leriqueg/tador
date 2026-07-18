-- Add capabilities (Json string[]) to entidades — organization roles (Sprint 07).

ALTER TABLE "entidades" ADD COLUMN IF NOT EXISTS "capabilities" JSONB NOT NULL DEFAULT '[]';
