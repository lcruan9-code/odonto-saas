-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_clinicId_idx" ON "Asset"("clinicId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

