-- CreateTable
CREATE TABLE "EnquiryType" (
    "id" SERIAL NOT NULL,
    "enquiryType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnquiryType_pkey" PRIMARY KEY ("id")
);
