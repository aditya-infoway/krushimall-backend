-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "showroomVariantId" INTEGER;

-- AddForeignKey
ALTER TABLE "ShowroomVariantAccessory" ADD CONSTRAINT "ShowroomVariantAccessory_accessoryId_fkey" FOREIGN KEY ("accessoryId") REFERENCES "Accessory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_showroomVariantId_fkey" FOREIGN KEY ("showroomVariantId") REFERENCES "ShowroomVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
