import prisma from "../lib/prisma.js";
export const generateContraVoucher = async (companyId, financialYearId) => {
    const prefixMaster = await prisma.profilePrefix.findFirst({
        where: {
            prefixFor: "CONTRA",
        },
    });
    if (!prefixMaster) {
        throw new Error("Contra prefix not found");
    }
    // Selected/session financial year
    const currentFY = await prisma.financialYear.findUnique({
        where: {
            id: financialYearId,
        },
    });
    if (!currentFY) {
        throw new Error("Financial Year not found");
    }
    const [startYear, endYear] = currentFY.financialYear.split("-");
    const financialYear = `${startYear.slice(-2)}-${endYear.slice(-2)}`;
    const prefix = prefixMaster.prefix;
    const lastVoucher = await prisma.contra.findFirst({
        where: {
            companyId,
            financialYearId,
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
//# sourceMappingURL=generateContraVoucher.js.map