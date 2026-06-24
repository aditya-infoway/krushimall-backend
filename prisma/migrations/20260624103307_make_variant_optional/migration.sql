-- DropForeignKey
ALTER TABLE "Colour" DROP CONSTRAINT "Colour_variantId_fkey";

-- AlterTable
ALTER TABLE "Colour" ALTER COLUMN "variantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Colour" ADD CONSTRAINT "Colour_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
