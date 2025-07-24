-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "operatingHoursEnd" INTEGER NOT NULL DEFAULT 1320,
ADD COLUMN     "operatingHoursStart" INTEGER NOT NULL DEFAULT 480;
