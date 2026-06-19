-- CreateTable
CREATE TABLE "Banker" (
    "id" SERIAL NOT NULL,
    "banker" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banker_pkey" PRIMARY KEY ("id")
);
