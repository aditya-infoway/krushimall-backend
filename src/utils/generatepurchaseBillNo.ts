import prisma from "../lib/prisma.js";

export const generateBillNo = async (
  prefixFor: string,
  modelName: keyof typeof prisma
) => {
  const prefixMaster = await prisma.profilePrefix.findFirst({
    where: {
      prefixFor: prefixFor.toUpperCase(),
    },
  });

  if (!prefixMaster) {
    throw new Error(`${prefixFor} prefix not found`);
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

  const model: any = prisma[modelName];

  const lastRecord = await model.findFirst({
    where: {
      billNo: {
        startsWith: `${prefix}/${financialYear}/`,
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  let nextNumber = 1;

  if (lastRecord?.billNo) {
    const parts = lastRecord.billNo.split("/");
    nextNumber = Number(parts[2]) + 1;
  }

  return `${prefix}/${financialYear}/${String(
    nextNumber
  ).padStart(3, "0")}`;
};