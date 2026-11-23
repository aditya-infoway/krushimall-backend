import prisma from "../lib/prisma.js";

export const generateVehicleSerialNo = async (): Promise<string> => {
  // Prefix optional hai: nahi mila to bhi chalega
  const prefixMaster = await prisma.profilePrefix.findFirst({
    where: { prefixFor: "VEHICLE" },
  });

  const prefix = prefixMaster?.prefix?.trim() || "";

  // Latest Financial Year
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

  // Get all vehicle serial numbers for current FY
  const vehicles = await prisma.purchaseItem.findMany({
    where: {
      OR: [
        { vehicleSrNo: { startsWith: `${financialYear}/` } },
        { vehicleSrNo: { contains: `/${financialYear}/` } },
      ],
    },
    select: {
      vehicleSrNo: true,
    },
  });

  // "VEH/26-27/001" or "26-27/001"
  const numberRegex = new RegExp(
    `(?:^|/)${financialYear}/(\\d+)$`,
  );

  let maxNumber = 0;

  for (const vehicle of vehicles) {
    if (!vehicle.vehicleSrNo) continue;

    const match = vehicle.vehicleSrNo.match(numberRegex);

    if (match) {
      const n = Number(match[1]);

      if (n > maxNumber) {
        maxNumber = n;
      }
    }
  }

  const nextNumber = String(maxNumber + 1).padStart(3, "0");

  return prefix
    ? `${prefix}/${financialYear}/${nextNumber}`
    : `${financialYear}/${nextNumber}`;
};