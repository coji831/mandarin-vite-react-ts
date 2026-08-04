-- CreateTable
CREATE TABLE "SeedCheckpoint" (
    "id" TEXT NOT NULL,
    "contentHash" CHAR(64) NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeedCheckpoint_pkey" PRIMARY KEY ("id")
);
