-- CreateTable
CREATE TABLE "Tractor" (
    "id" SERIAL NOT NULL,
    "modelId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "colourId" INTEGER NOT NULL,
    "itemName" TEXT NOT NULL,
    "codeNo" TEXT NOT NULL,
    "shortName" TEXT,
    "hsnCode" TEXT,
    "taxSlab" TEXT,
    "listOfGroup" TEXT,
    "typeOfFuel" TEXT,
    "fuelCapacity" TEXT,
    "purchasePriceNoGST" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purchasePriceTaxable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tractor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tractor_codeNo_key" ON "Tractor"("codeNo");

-- AddForeignKey
ALTER TABLE "Tractor" ADD CONSTRAINT "Tractor_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tractor" ADD CONSTRAINT "Tractor_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tractor" ADD CONSTRAINT "Tractor_colourId_fkey" FOREIGN KEY ("colourId") REFERENCES "Colour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
