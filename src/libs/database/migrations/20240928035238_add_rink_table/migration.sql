-- CreateTable
CREATE TABLE "Rink" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "location" TEXT NOT NULL,

    CONSTRAINT "Rink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rink_name_key" ON "Rink"("name");

-- Insert existing unique rinks into the new Rink table
INSERT INTO "Rink" ("id", "createdAt", "updatedAt", "name", "location")
SELECT 
    gen_random_uuid(), 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP, 
    "rink", 
    "location"
FROM (SELECT DISTINCT "rink", "location" FROM "IceTime") AS unique_rinks;

-- AddColumn
ALTER TABLE "IceTime" ADD COLUMN "rinkId" TEXT;

-- UpdateData
UPDATE "IceTime" 
SET "rinkId" = "Rink"."id"
FROM "Rink"
WHERE "IceTime"."rink" = "Rink"."name";

-- AlterColumn
ALTER TABLE "IceTime" ALTER COLUMN "rinkId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "IceTime" ADD CONSTRAINT "IceTime_rinkId_fkey" FOREIGN KEY ("rinkId") REFERENCES "Rink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropColumn
ALTER TABLE "IceTime" DROP COLUMN "rink", DROP COLUMN "location";