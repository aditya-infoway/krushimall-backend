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
export const generateBankPaymentVoucher = async (companyId, financialYearId) => {
    const prefixMaster = await prisma.profilePrefix.findFirst({
        where: {
            prefixFor: "BANK_PAYMENT",
        },
    });
    if (!prefixMaster) {
        throw new Error("Bank Payment prefix not found");
    }
    // CHANGED: session se aaya financialYearId use karo, DB se "latest" guess mat karo
    const currentFY = await prisma.financialYear.findUnique({
        where: { id: financialYearId },
    });
    if (!currentFY) {
        throw new Error("Financial Year not found");
    }
    const [startYear, endYear] = currentFY.financialYear.split("-");
    const fy = `${startYear.slice(-2)}-${endYear.slice(-2)}`;
    // CHANGED: transaction wrap - race condition me duplicate voucherNo se bachne ke liye
    return await prisma.$transaction(async (tx) => {
        const lastVoucher = await tx.bankPayment.findFirst({
            where: {
                companyId, // CHANGED: company-wise scoped
                financialYearId,
                voucherNo: {
                    startsWith: `${prefixMaster.prefix}/${fy}/`,
                },
            },
            orderBy: {
                id: "desc",
            },
        });
        let next = 1;
        if (lastVoucher) {
            next = Number(lastVoucher.voucherNo.split("/")[2]) + 1;
        }
        return `${prefixMaster.prefix}/${fy}/${String(next).padStart(3, "0")}`;
    });
};
//# sourceMappingURL=generateBankPaymentVoucher.js.map