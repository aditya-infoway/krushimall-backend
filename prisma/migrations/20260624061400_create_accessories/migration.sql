-- CreateTable
CREATE TABLE "Accessory" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "codeNo" TEXT NOT NULL,
    "shortName" TEXT,
    "hsnCode" TEXT,
    "taxSlab" TEXT,
    "group" TEXT,
    "purchasePrice" DOUBLE PRECISION,
    "salesPrice" DOUBLE PRECISION,
    "mrp" DOUBLE PRECISION,
    "opStock" INTEGER NOT NULL DEFAULT 0,
    "showroomVariants" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accessory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Accessory_codeNo_key" ON "Accessory"("codeNo");
