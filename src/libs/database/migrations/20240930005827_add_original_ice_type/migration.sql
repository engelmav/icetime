-- AlterEnum
ALTER TYPE "IceTimeTypeEnum" ADD VALUE 'Other';

-- AlterTable
ALTER TABLE "IceTime" ADD COLUMN     "originalIceType" TEXT;
