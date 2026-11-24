// import prisma from "../lib/prisma.js";

// export const generateQuotationNo = async () => {
//   const prefixMaster = await prisma.profilePrefix.findFirst({
//     where: {
//       prefixFor: "QUOTATION",
//     },
//   });

//   if (!prefixMaster) {
//     throw new Error("QUOTATION prefix not found");
//   }

//   const currentFY = await prisma.financialYear.findFirst({
//     orderBy: {
//       id: "desc",
//     },
//   });

//   if (!currentFY) {
//     throw new Error("Financial Year not found");
//   }

//   const [startYear, endYear] =
//     currentFY.financialYear.split("-");

//   const financialYear =
//     `${startYear.slice(-2)}-${endYear.slice(-2)}`;

//   const prefix = prefixMaster.prefix;

//   const lastLead = await prisma.lead.findFirst({
//     where: {
//       quotationNo: {
//         startsWith: `${prefix}/${financialYear}/`,
//       },
//     },
//     orderBy: {
//       id: "desc",
//     },
//   });

//   let nextNumber = 1;

//   if (lastLead?.quotationNo) {
//     const parts = lastLead.quotationNo.split("/");
//     nextNumber = Number(parts[2]) + 1;
//   }

//   return `${prefix}/${financialYear}/${String(
//     nextNumber
//   ).padStart(3, "0")}`;
// };

import prisma from "../lib/prisma.js";

export const generateQuotationNo = async () => {
  // Prefix optional hai: nahi mila to bhi chalega
  const prefixMaster = await prisma.profilePrefix.findFirst({
    where: { prefixFor: "QUOTATION" },
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

  // Is FY ke saare quotations, prefix ho ya na ho
  const leads = await prisma.lead.findMany({
    where: {
      OR: [
        { quotationNo: { startsWith: `${financialYear}/` } },
        { quotationNo: { contains: `/${financialYear}/` } },
      ],
    },
    select: { quotationNo: true },
  });

  // "QT/26-27/007" ya "26-27/001" dono se last number nikalo
  const numberRegex = new RegExp(`(?:^|/)${financialYear}/(\\d+)$`);

  let maxNumber = 0;

  for (const l of leads) {
    const match = String(l.quotationNo).match(numberRegex);
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