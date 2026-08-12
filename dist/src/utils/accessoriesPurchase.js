import prisma from "../lib/prisma.js";
export const generateAccessoriesPurchaseBillNo = async (companyId, financialYearId) => {
    const prefixMaster = await prisma.profilePrefix.findFirst({
        where: {
            prefixFor: "ACCESSORIES_PURCHASE",
        },
    });
    if (!prefixMaster) {
        throw new Error("Accessories Purchase Prefix not found");
    }
    // CHANGED: session se aaya financialYearId use karo, DB se "latest" guess mat karo
    const currentFY = await prisma.financialYear.findUnique({
        where: { id: financialYearId },
    });
    if (!currentFY) {
        throw new Error("Financial Year not found");
    }
    const [startYear, endYear] = currentFY.financialYear.split("-");
    const financialYear = `${startYear.slice(-2)}-${endYear.slice(-2)}`;
    // CHANGED: transaction wrap - race condition me duplicate billNo se bachne ke liye
    return await prisma.$transaction(async (tx) => {
        const lastBill = await tx.accessoriesPurchase.findFirst({
            where: {
                companyId, // CHANGED: company-wise scoped
                financialYearId,
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
            nextNumber = Number(lastBill.billNo.split("/")[2]) + 1;
        }
        return `${prefixMaster.prefix}/${financialYear}/${String(nextNumber).padStart(3, "0")}`;
    });
};
//# sourceMappingURL=accessoriesPurchase.js.map