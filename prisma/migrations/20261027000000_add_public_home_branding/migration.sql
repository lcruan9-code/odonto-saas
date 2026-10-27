-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN     "accentColor" TEXT DEFAULT '#3BBEB8',
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "ctaText" TEXT DEFAULT 'Agende sua Consulta',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "primaryColor" TEXT DEFAULT '#0A2B4E',
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "secondaryColor" TEXT DEFAULT '#007A8A';

-- AlterTable
ALTER TABLE "Dentist" ADD COLUMN     "publicBio" TEXT,
ADD COLUMN     "publicVisible" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Service_clinicId_idx" ON "Service"("clinicId");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

