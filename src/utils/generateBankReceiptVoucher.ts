import prisma from "../lib/prisma.js";

export const generateBankReceiptVoucher = async (
  companyId: number,
  financialYearId: number,
): Promise<string> => {
  // Prefix optional hai: nahi mila to bhi chalega
  const prefixMaster = await prisma.profilePrefix.findFirst({
    where: { prefixFor: "BANK_RECEIPT" },
  });

  const prefix = prefixMaster?.prefix?.trim() || "";

  // Selected session/FY
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

  // Is company + FY ke saare vouchers, prefix ho ya na ho
  const vouchers = await prisma.bankReceipt.findMany({
    where: {
      companyId,
      financialYearId,
      OR: [
        { voucherNo: { startsWith: `${financialYear}/` } },
        { voucherNo: { contains: `/${financialYear}/` } },
      ],
    },
    select: { voucherNo: true },
  });

  // "BR/26-27/007" ya "26-27/001" dono se last number nikalo
  const numberRegex = new RegExp(`(?:^|/)${financialYear}/(\\d+)$`);

  let maxNumber = 0;

  for (const v of vouchers) {
    const match = String(v.voucherNo).match(numberRegex);
    if (match) {
      const n = Number(match[1]);
      if (n > maxNumber) maxNumber = n;
    }
  }

  const nextNumber = String(maxNumber + 1).padStart(3, "0");

  return prefix
    ? `${prefix}/${financialYear}/${nextNumber}`
    : `${financialYear}/${nextNumber}`;
};