-- Add optional entity attribution on apuntes (Sprint 009 FR-009).
ALTER TABLE "apuntes" ADD COLUMN "entityId" TEXT;

ALTER TABLE "apuntes" ADD CONSTRAINT "apuntes_entityId_fkey"
  FOREIGN KEY ("entityId") REFERENCES "entidades"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "apuntes_entityId_idx" ON "apuntes"("entityId");
