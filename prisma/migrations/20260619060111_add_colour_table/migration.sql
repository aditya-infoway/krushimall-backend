-- CreateTable
CREATE TABLE "Colour" (
    "id" SERIAL NOT NULL,
    "modelId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "colourName" TEXT NOT NULL,
    "colourCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Colour_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Colour" ADD CONSTRAINT "Colour_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colour" ADD CONSTRAINT "Colour_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
