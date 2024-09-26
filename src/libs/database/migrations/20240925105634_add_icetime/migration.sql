-- CreateEnum
CREATE TYPE "IceTimeTypeEnum" AS ENUM ('CLINIC', 'OPEN_SKATE', 'STICK_TIME', 'OPEN_HOCKEY', 'SUBSTITUTE_REQUEST');

-- CreateTable
CREATE TABLE "IceTime" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "IceTimeTypeEnum" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "rink" TEXT NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "IceTime_pkey" PRIMARY KEY ("id")
);
