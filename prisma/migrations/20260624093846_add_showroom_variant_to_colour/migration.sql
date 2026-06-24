-- AlterTable
ALTER TABLE "Colour" ADD COLUMN     "showroomVariantId" INTEGER;

-- AddForeignKey
ALTER TABLE "Colour" ADD CONSTRAINT "Colour_showroomVariantId_fkey" FOREIGN KEY ("showroomVariantId") REFERENCES "ShowroomVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
