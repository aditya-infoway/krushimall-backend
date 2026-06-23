-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "followUpStatus" TEXT DEFAULT 'New';

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "expectedPurchaseDate" TIMESTAMP(3),
    "nextScheduledDate" TIMESTAMP(3),
    "callTime" TEXT,
    "callResponse" TEXT,
    "discussion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
