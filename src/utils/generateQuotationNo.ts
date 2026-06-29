import prisma from "../lib/prisma.js";

export const generateQuotationNo = async () => {
  const prefixMaster = await prisma.profilePrefix.findFirst({
    where: {
      prefixFor: "QUOTATION",
    },
  });

  if (!prefixMaster) {
    throw new Error("QUOTATION prefix not found");
  }

  const currentFY = await prisma.financialYear.findFirst({
    orderBy: {
      id: "desc",
    },
  });

  if (!currentFY) {
    throw new Error("Financial Year not found");
  }

  const [startYear, endYear] =
    currentFY.financialYear.split("-");

  const financialYear =
    `${startYear.slice(-2)}-${endYear.slice(-2)}`;

  const prefix = prefixMaster.prefix;

  const lastLead = await prisma.lead.findFirst({
    where: {
      quotationNo: {
        startsWith: `${prefix}/${financialYear}/`,
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  let nextNumber = 1;

  if (lastLead?.quotationNo) {
    const parts = lastLead.quotationNo.split("/");
    nextNumber = Number(parts[2]) + 1;
  }

  return `${prefix}/${financialYear}/${String(
    nextNumber
  ).padStart(3, "0")}`;
};