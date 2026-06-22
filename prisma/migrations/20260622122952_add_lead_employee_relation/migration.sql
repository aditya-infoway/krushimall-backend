-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_executiveId_fkey" FOREIGN KEY ("executiveId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
