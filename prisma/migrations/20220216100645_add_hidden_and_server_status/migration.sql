-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ServerStatus" (
    "maintenance" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "ServerStatus_maintenance_key" ON "ServerStatus"("maintenance");
