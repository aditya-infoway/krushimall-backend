-- CreateTable
CREATE TABLE "ShowroomVariant" (
    "id" SERIAL NOT NULL,
    "modelId" INTEGER NOT NULL,
    "variantName" TEXT NOT NULL,
    "purPrice" DOUBLE PRECISION NOT NULL,
    "purTaxPercent" DOUBLE PRECISION NOT NULL,
    "exShowroomPrice" DOUBLE PRECISION NOT NULL,
    "exShowroomTaxPercent" DOUBLE PRECISION NOT NULL,
    "insurance" DOUBLE PRECISION NOT NULL,
    "insuranceTaxPercent" DOUBLE PRECISION NOT NULL,
    "rtoCharge" DOUBLE PRECISION NOT NULL,
    "rtoTaxType" TEXT NOT NULL,
    "rtoTaxPercent" DOUBLE PRECISION NOT NULL,
    "salesPrice" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShowroomVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowroomVariantAccessory" (
    "id" SERIAL NOT NULL,
    "showroomVariantId" INTEGER NOT NULL,
  "accessoryId" INTEGER NOT NULL,
  "qty" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "taxPercent" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShowroomVariantAccessory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ShowroomVariant" ADD CONSTRAINT "ShowroomVariant_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowroomVariantAccessory" ADD CONSTRAINT "ShowroomVariantAccessory_showroomVariantId_fkey" FOREIGN KEY ("showroomVariantId") REFERENCES "ShowroomVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
