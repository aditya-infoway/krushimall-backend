-- CreateTable
CREATE TABLE "ProfilePrefix" (
    "id" SERIAL NOT NULL,
    "prefixFor" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfilePrefix_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePrefix_prefixFor_key" ON "ProfilePrefix"("prefixFor");
