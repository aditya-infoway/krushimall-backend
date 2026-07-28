// utils/generateAccessoriesInvoiceNo.ts

import prisma from "../lib/prisma.js";

export const generateAccessoriesInvoiceNo = async (): Promise<string> => {
  const prefixMaster = await prisma.profilePrefix.findFirst({
    where: {
      prefixFor: "ACCESSORIES_INVOICE",
    },
  });

  if (!prefixMaster) {
    throw new Error("Accessories Invoice Prefix not found");
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

  const lastInvoice = await prisma.order.findFirst({
    where: {
      invoiceNo: {
        startsWith: `${prefixMaster.prefix}/${financialYear}/`,
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  let nextNumber = 1;

  if (lastInvoice?.invoiceNo) {
    nextNumber =
      Number(lastInvoice.invoiceNo.split("/")[2]) + 1;
  }

  return `${prefixMaster.prefix}/${financialYear}/${String(
    nextNumber
  ).padStart(3, "0")}`;
};