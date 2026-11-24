// import prisma from "../lib/prisma.js";

// export const generateBankPaymentVoucher = async () => {
//   const prefixMaster = await prisma.profilePrefix.findFirst({
//     where: {
//       prefixFor: "BANK_PAYMENT",
//     },
//   });

//   if (!prefixMaster) {
//     throw new Error("Bank Payment prefix not found");
//   }

//   const currentFY = await prisma.financialYear.findFirst({
//     orderBy: {
//       id: "desc",
//     },
//   });

//   if (!currentFY) {
//     throw new Error("Financial Year not found");
//   }

//   const [startYear, endYear] = currentFY.financialYear.split("-");

//   const fy = `${startYear.slice(-2)}-${endYear.slice(-2)}`;

//   const lastVoucher = await prisma.bankPayment.findFirst({
//     where: {
//       voucherNo: {
//         startsWith: `${prefixMaster.prefix}/${fy}/`,
//       },
//     },
//     orderBy: {
//       id: "desc",
//     },
//   });

//   let next = 1;

//   if (lastVoucher) {
//     next = Number(lastVoucher.voucherNo.split("/")[2]) + 1;
//   }

//   return `${prefixMaster.prefix}/${fy}/${String(next).padStart(3, "0")}`;
// };




import prisma from "../lib/prisma.js";

export const generateBankPaymentVoucher = async (
  companyId: number,
  financialYearId: number,
) => {
  // Prefix optional hai: nahi mila to bhi chalega
  const prefixMaster = await prisma.profilePrefix.findFirst({
    where: { prefixFor: "BANK_PAYMENT" },
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

  const fy = `${startYear.slice(-2)}-${endYear.slice(-2)}`;

  // Race condition se duplicate voucherNo bachane ke liye transaction
  return await prisma.$transaction(async (tx) => {
    // Is company + FY ke saare vouchers, prefix ho ya na ho
    const vouchers = await tx.bankPayment.findMany({
      where: {
        companyId,
        financialYearId,
        OR: [
          { voucherNo: { startsWith: `${fy}/` } },
          { voucherNo: { contains: `/${fy}/` } },
        ],
      },
      select: { voucherNo: true },
    });

    // "BP/26-27/007" ya "26-27/001" dono se last number nikalo
    const numberRegex = new RegExp(`(?:^|/)${fy}/(\\d+)$`);

    let maxNumber = 0;

    for (const v of vouchers) {
      const match = String(v.voucherNo).match(numberRegex);
      if (match) {
        const n = Number(match[1]);
        if (n > maxNumber) maxNumber = n;
      }
    }

    const nextNumber = String(maxNumber + 1).padStart(3, "0");

    return prefix ? `${prefix}/${fy}/${nextNumber}` : `${fy}/${nextNumber}`;
  });
};


