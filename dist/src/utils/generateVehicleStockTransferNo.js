import prisma from "../lib/prisma.js";
export const generateVehicleStockTransferNo = async () => {
    const prefixMaster = await prisma.profilePrefix.findFirst({
        where: {
            prefixFor: "VEHICLE_STOCK_TRANSFER",
        },
    });
    if (!prefixMaster) {
        throw new Error("Vehicle Stock Transfer prefix not found");
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
    const lastTransfer = await prisma.vehicleStockTransfer.findFirst({
        where: {
            transferNo: {
                startsWith: `${prefix}/${financialYear}/`,
            },
        },
        orderBy: {
            id: "desc",
        },
    });
    let nextNumber = 1;
    if (lastTransfer?.transferNo) {
        const parts = lastTransfer.transferNo.split("/");
        nextNumber = Number(parts[2]) + 1;
    }
    return `${prefix}/${financialYear}/${String(nextNumber).padStart(3, "0")}`;
};
//# sourceMappingURL=generateVehicleStockTransferNo.js.map