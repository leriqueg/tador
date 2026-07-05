-- CreateTable
CREATE TABLE "apuntes" (
    "id" TEXT NOT NULL,
    "templateCode" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "concept" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "asientoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apuntes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "apuntes_asientoId_key" ON "apuntes"("asientoId");

-- AddForeignKey
ALTER TABLE "apuntes" ADD CONSTRAINT "apuntes_asientoId_fkey" FOREIGN KEY ("asientoId") REFERENCES "asientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apuntes" ADD CONSTRAINT "apuntes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
