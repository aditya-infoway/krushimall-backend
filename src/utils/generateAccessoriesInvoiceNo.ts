// // utils/generateAccessoriesInvoiceNo.ts

// import prisma from "../lib/prisma.js";

// export const generateAccessoriesInvoiceNo = async (): Promise<string> => {
//   const prefixMaster = await prisma.profilePrefix.findFirst({
//     where: {
//       prefixFor: "ACCESSORIES_INVOICE",
//     },
//   });

//   if (!prefixMaster) {
//     throw new Error("Accessories Invoice Prefix not found");
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

//   const lastInvoice = await prisma.order.findFirst({
//     where: {
//       invoiceNo: {
//         startsWith: `${prefixMaster.prefix}/${financialYear}/`,
//       },
//     },
//     orderBy: {
//       id: "desc",
//     },
//   });

//   let nextNumber = 1;

//   if (lastInvoice?.invoiceNo) {
//     nextNumber =
//       Number(lastInvoice.invoiceNo.split("/")[2]) + 1;
//   }

//   return `${prefixMaster.prefix}/${financialYear}/${String(
//     nextNumber
//   ).padStart(3, "0")}`;
// };


// utils/generateAccessoriesInvoiceNo.ts

import prisma from "../lib/prisma.js";

export const generateAccessoriesInvoiceNo = async (): Promise<string> => {
  // Prefix optional hai: nahi mila to bhi chalega
  const prefixMaster = await prisma.profilePrefix.findFirst({
    where: { prefixFor: "ACCESSORIES_INVOICE" },
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

  // Is FY ke saare invoices, prefix ho ya na ho
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { invoiceNo: { startsWith: `${financialYear}/` } },
        { invoiceNo: { contains: `/${financialYear}/` } },
      ],
    },
    select: { invoiceNo: true },
  });

  // "AI/26-27/007" ya "26-27/001" dono se last number nikalo
  const numberRegex = new RegExp(`(?:^|/)${financialYear}/(\\d+)$`);

  let maxNumber = 0;

  for (const o of orders) {
    const match = String(o.invoiceNo).match(numberRegex);
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