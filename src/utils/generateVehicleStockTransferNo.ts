// import prisma from "../lib/prisma.js";

// export const generateVehicleStockTransferNo = async () => {
//   const prefixMaster = await prisma.profilePrefix.findFirst({
//     where: {
//       prefixFor: "VEHICLE_STOCK_TRANSFER",
//     },
//   });

//   if (!prefixMaster) {
//     throw new Error("Vehicle Stock Transfer prefix not found");
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

//   const financialYear = `${startYear.slice(-2)}-${endYear.slice(-2)}`;

//   const prefix = prefixMaster.prefix;

//   const lastTransfer = await prisma.vehicleStockTransfer.findFirst({
//     where: {
//       transferNo: {
//         startsWith: `${prefix}/${financialYear}/`,
//       },
//     },
//     orderBy: {
//       id: "desc",
//     },
//   });

//   let nextNumber = 1;

//   if (lastTransfer?.transferNo) {
//     const parts = lastTransfer.transferNo.split("/");
//     nextNumber = Number(parts[2]) + 1;
//   }

//   return `${prefix}/${financialYear}/${String(nextNumber).padStart(3, "0")}`;
// };



import prisma from "../lib/prisma.js";

export const generateVehicleStockTransferNo = async () => {
  // Prefix optional hai: nahi mila to bhi chalega
  const prefixMaster = await prisma.profilePrefix.findFirst({
    where: { prefixFor: "VEHICLE_STOCK_TRANSFER" },
  });

  const prefix = prefixMaster?.prefix?.trim() || "";

  const currentFY = await prisma.financialYear.findFirst({
    orderBy: { id: "desc" },
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

  const financialYear = `${startYear.slice(-2)}-${endYear.slice(-2)}`;

  // Is FY ke saare transfers, prefix ho ya na ho
  const transfers = await prisma.vehicleStockTransfer.findMany({
    where: {
      OR: [
        { transferNo: { startsWith: `${financialYear}/` } },
        { transferNo: { contains: `/${financialYear}/` } },
      ],
    },
    select: { transferNo: true },
  });

  // "VT/26-27/007" ya "26-27/001" dono se last number nikalo
  const numberRegex = new RegExp(`(?:^|/)${financialYear}/(\\d+)$`);

  let maxNumber = 0;

  for (const t of transfers) {
    const match = String(t.transferNo).match(numberRegex);
    if (match) {
      const n = Number(match[1]);
      if (n > maxNumber) maxNumber = n;
    }
  }

  const nextNumber = String(maxNumber + 1).padStart(3, "0");

  return prefix
    ? `${prefix}/${financialYear}/${nextNumber}`
    : `${financialYear}/${nextNumber}`;
};