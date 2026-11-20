// import prisma from "../lib/prisma.js";

// export const generateCashPaymentVoucher = async (
//   companyId: number,
//   financialYearId: number
// ): Promise<string> => {
//   const prefixMaster = await prisma.profilePrefix.findFirst({
//     where: {
//       prefixFor: "CASH_PAYMENT",
//     },
//   });

//   if (!prefixMaster) {
//     throw new Error("Cash Payment prefix not found");
//   }

//   // Selected financial year/session
//   const currentFY = await prisma.financialYear.findUnique({
//     where: {
//       id: financialYearId,
//     },
//   });

//   if (!currentFY) {
//     throw new Error("Financial Year not found");
//   }

//   const [startYear, endYear] = currentFY.financialYear.split("-");

//   const financialYear = `${startYear.slice(-2)}-${endYear.slice(-2)}`;

//   const prefix = prefixMaster.prefix;

//   const lastVoucher = await prisma.cashPayment.findFirst({
//     where: {
//       companyId,
//       financialYearId,
//       voucherNo: {
//         startsWith: `${prefix}/${financialYear}/`,
//       },
//     },
//     orderBy: {
//       id: "desc",
//     },
//   });

//   let nextNumber = 1;

//   if (lastVoucher?.voucherNo) {
//     const parts = lastVoucher.voucherNo.split("/");

//     nextNumber = Number(parts[2]) + 1;
//   }

//   return `${prefix}/${financialYear}/${String(nextNumber).padStart(3, "0")}`;
// };




import prisma from "../lib/prisma.js";

export const generateCashPaymentVoucher = async (
  companyId: number,
  financialYearId: number,
): Promise<string> => {
  const prefixMaster = await prisma.profilePrefix.findFirst({
    where: { prefixFor: "CASH_PAYMENT" },
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

  // Is company + FY ke saare vouchers, prefix ho ya na ho
  const vouchers = await prisma.cashPayment.findMany({
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

  // "CP/26-27/007" ya "26-27/001" dono se last number nikalo
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