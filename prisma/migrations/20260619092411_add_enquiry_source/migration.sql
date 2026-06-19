-- CreateTable
CREATE TABLE "EnquirySource" (
    "id" SERIAL NOT NULL,
    "enquirySource" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnquirySource_pkey" PRIMARY KEY ("id")
);
