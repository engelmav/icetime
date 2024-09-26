/*
  Warnings:

  - The values [CLINIC,OPEN_SKATE,STICK_TIME,OPEN_HOCKEY,SUBSTITUTE_REQUEST] on the enum `IceTimeTypeEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "IceTimeTypeEnum_new" AS ENUM ('Clinic', 'Open Skate', 'Stick Time', 'Open Hockey', 'Substitute Request');
ALTER TABLE "IceTime" ALTER COLUMN "type" TYPE "IceTimeTypeEnum_new" USING ("type"::text::"IceTimeTypeEnum_new");
ALTER TYPE "IceTimeTypeEnum" RENAME TO "IceTimeTypeEnum_old";
ALTER TYPE "IceTimeTypeEnum_new" RENAME TO "IceTimeTypeEnum";
DROP TYPE "IceTimeTypeEnum_old";
COMMIT;
