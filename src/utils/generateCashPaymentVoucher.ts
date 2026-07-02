import prisma from "../lib/prisma.js";

export const generateCashPaymentVoucher = async () => {
  const prefixMaster = await prisma.profilePrefix.findFirst({
    where: {
      prefixFor: "CASH_PAYMENT",
    },
  });

  if (!prefixMaster) {
    throw new Error("Cash Payment prefix not found");
  }

  const currentFY = await prisma.financialYear.findFirst({
    orderBy: {
      id: "desc",
    },
  });

  if (!currentFY) {
    throw new Error("Financial Year not found");
  }

  const [startYear, endYear] = currentFY.financialYear.split("-");

  const financialYear = `${startYear.slice(-2)}-${endYear.slice(-2)}`;

  const prefix = prefixMaster.prefix;

  const lastVoucher = await prisma.cashPayment.findFirst({
    where: {
      voucherNo: {
        startsWith: `${prefix}/${financialYear}/`,
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  let nextNumber = 1;

  if (lastVoucher?.voucherNo) {
    const parts = lastVoucher.voucherNo.split("/");
    nextNumber = Number(parts[2]) + 1;
  }

  return `${prefix}/${financialYear}/${String(nextNumber).padStart(3, "0")}`;
};