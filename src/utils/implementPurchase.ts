// src/utils/implementPurchase.ts
import prisma from "../lib/prisma.js";

export const generateImplementPurchaseBillNo = async (
  companyId: number,
  financialYearId: number,
): Promise<string> => {
  // Prefix optional hai: ProfilePrefix me prefixFor = "IMPLEMENT_PURCHASE" add karoge to use hoga
  const prefixMaster = await prisma.profilePrefix.findFirst({
    where: { prefixFor: "IMPLEMENT_PURCHASE" },
  });

  const prefix = prefixMaster?.prefix?.trim() || "";

  const currentFY = await prisma.financialYear.findUnique({
    where: { id: financialYearId },
  });

  if (!currentFY) {
    throw new Error("Financial Year not found");
  }

  const [startYear, endYear] = String(currentFY.financialYear).split("-");

  if (!startYear || !endYear) {
    throw new Error(
      `Invalid financial year format: ${currentFY.financialYear}`,
    );
  }

  const financialYear = `${startYear.slice(-2)}-${endYear.slice(-2)}`;

  return await prisma.$transaction(async (tx) => {
    const bills = await tx.implementPurchase.findMany({
      where: {
        companyId,
        financialYearId,
        OR: [
          { billNo: { startsWith: `${financialYear}/` } },
          { billNo: { contains: `/${financialYear}/` } },
        ],
      },
      select: { billNo: true },
    });

    // "IMP/26-27/007" ya "26-27/001" dono se last number nikalo
    const numberRegex = new RegExp(`(?:^|/)${financialYear}/(\\d+)$`);

    let maxNumber = 0;

    for (const b of bills) {
      const match = String(b.billNo).match(numberRegex);
      if (match) {
        const n = Number(match[1]);
        if (n > maxNumber) maxNumber = n;
      }
    }

    const nextNumber = String(maxNumber + 1).padStart(3, "0");

    return prefix
      ? `${prefix}/${financialYear}/${nextNumber}`
      : `${financialYear}/${nextNumber}`;
  });
};