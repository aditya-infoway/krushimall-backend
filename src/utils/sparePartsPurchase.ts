import prisma from "../lib/prisma.js";

export const generateSparePartsPurchaseBillNo = async (
  companyId: number,
  financialYearId: number,
): Promise<string> => {
  // Prefix optional hai: nahi mila to bhi chalega
  const prefixMaster = await prisma.profilePrefix.findFirst({
    where: { prefixFor: "SPARE_PARTS_PURCHASE" },
  });

  // If no prefix in DB, fallback to "SPP"
  const prefix = prefixMaster?.prefix?.trim() || "SPP";

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

  // Race condition se duplicate billNo bachane ke liye transaction
  return await prisma.$transaction(async (tx) => {
    // Is company + FY ke saare bills, prefix ho ya na ho
    const bills = await tx.sparePartsPurchase.findMany({
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

    // "SPP/26-27/007" ya "26-27/001" dono se last number nikalo
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