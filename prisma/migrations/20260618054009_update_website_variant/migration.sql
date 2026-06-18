/*
  Warnings:

  - The `launchYear` column on the `WebsiteVariant` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "WebsiteVariant" ADD COLUMN     "productName" TEXT,
DROP COLUMN "launchYear",
ADD COLUMN     "launchYear" TIMESTAMP(3);
