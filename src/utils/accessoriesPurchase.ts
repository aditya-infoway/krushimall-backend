import prisma from "../lib/prisma.js";

export const generateAccessoriesPurchaseBillNo =
  async (): Promise<string> => {
    const prefixMaster =
      await prisma.profilePrefix.findFirst({
        where: {
          prefixFor: "ACCESSORIES_PURCHASE",
        },
      });

    if (!prefixMaster) {
      throw new Error("Accessories Purchase Prefix not found");
    }

    const currentFY =
      await prisma.financialYear.findFirst({
        orderBy: { id: "desc" },
      });

    if (!currentFY) {
      throw new Error("Financial Year not found");
    }

    const [startYear, endYear] =
      currentFY.financialYear.split("-");

    const financialYear = `${startYear.slice(-2)}-${endYear.slice(-2)}`;

    const lastBill =
      await prisma.accessoriesPurchase.findFirst({
        where: {
          billNo: {
            startsWith: `${prefixMaster.prefix}/${financialYear}/`,
          },
        },
        orderBy: {
          id: "desc",
        },
      });

    let nextNumber = 1;

    if (lastBill?.billNo) {
      nextNumber =
        Number(lastBill.billNo.split("/")[2]) + 1;
    }

    return `${prefixMaster.prefix}/${financialYear}/${String(
      nextNumber
    ).padStart(3, "0")}`;
  };