// import prisma from "../lib/prisma.js";

// export const generateBillNo = async (
//   prefixFor: string,
//   modelName: keyof typeof prisma,
//   companyId: number,
//   financialYearId: number
// ) => {
//   const prefixMaster = await prisma.profilePrefix.findFirst({
//     where: {
//       prefixFor: prefixFor.toUpperCase(),
//     },
//   });

//   if (!prefixMaster) {
//     throw new Error(`${prefixFor} prefix not found`);
//   }

//   // CHANGED: session se aaya financialYearId use karo, DB se "latest" guess mat karo
//   const currentFY = await prisma.financialYear.findUnique({
//     where: { id: financialYearId },
//   });

//   if (!currentFY) {
//     throw new Error("Financial Year not found");
//   }

//   const [startYear, endYear] = currentFY.financialYear.split("-");
//   const financialYear = `${startYear.slice(-2)}-${endYear.slice(-2)}`;

//   const prefix = prefixMaster.prefix;
//   const model: any = prisma[modelName];

//   // CHANGED: transaction wrap - race condition me duplicate billNo se bachne ke liye
//   return await prisma.$transaction(async (tx) => {
//    const txModel: any = (tx as any)[modelName];

//     const lastRecord = await txModel.findFirst({
//       where: {
//         companyId, // CHANGED: company-wise scoped, cross-company mix nahi hoga
//         financialYearId,
//         billNo: {
//           startsWith: `${prefix}/${financialYear}/`,
//         },
//       },
//       orderBy: {
//         id: "desc",
//       },
//     });

//     let nextNumber = 1;

//     if (lastRecord?.billNo) {
//       const parts = lastRecord.billNo.split("/");
//       nextNumber = Number(parts[2]) + 1;
//     }

//     return `${prefix}/${financialYear}/${String(nextNumber).padStart(3, "0")}`;
//   });
// };



import prisma from "../lib/prisma.js";

export const generateBillNo = async (
  prefixFor: string,
  modelName: keyof typeof prisma,
  companyId: number,
  financialYearId: number,
) => {
  const prefixMaster = await prisma.profilePrefix.findFirst({
    where: { prefixFor: prefixFor.toUpperCase() },
  });

  const prefix = prefixMaster?.prefix?.trim() || "";

  const currentFY = await prisma.financialYear.findUnique({
    where: { id: financialYearId },
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

  return await prisma.$transaction(async (tx) => {
    const txModel: any = (tx as any)[modelName];

    // Is company + FY ke saare bills, prefix ho ya na ho
    const records = await txModel.findMany({
      where: {
        companyId,
        financialYearId,
        OR: [
          { billNo: { startsWith: `${financialYear}/` } },
          { billNo: { contains: `/${financialYear}/` } },
        ],
      },
      select: { billNo: true },
    });

    const numberRegex = new RegExp(`(?:^|/)${financialYear}/(\\d+)$`);

    let maxNumber = 0;

    for (const r of records) {
      const match = String(r.billNo).match(numberRegex);
      if (match) {
        const n = Number(match[1]);
        if (n > maxNumber) maxNumber = n;
      }
    }

    const nextNumber = String(maxNumber + 1).padStart(3, "0");

    return prefix
      ? `${prefix}/${financialYear}/${nextNumber}`
      : `${financialYear}/${nextNumber}`;
  });
};