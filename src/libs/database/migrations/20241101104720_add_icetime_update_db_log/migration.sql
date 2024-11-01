-- CreateTable
CREATE TABLE "RinkUpdateLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobName" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,

    CONSTRAINT "RinkUpdateLog_pkey" PRIMARY KEY ("id")
);
