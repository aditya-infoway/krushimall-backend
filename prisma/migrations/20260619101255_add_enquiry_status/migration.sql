-- CreateTable
CREATE TABLE "EnquiryStatus" (
    "id" SERIAL NOT NULL,
    "enquiryStatus" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnquiryStatus_pkey" PRIMARY KEY ("id")
);
