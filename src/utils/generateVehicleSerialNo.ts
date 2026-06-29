import prisma from "../lib/prisma.js";

export const generateVehicleSerialNo = async () => {

  const all = await prisma.profilePrefix.findMany();
  // console.log("ALL PREFIXES:", all);

  const prefixMaster = await prisma.profilePrefix.findFirst({
    where: {
      prefixFor: "VEHICLE",
    },
  });

  // console.log("FOUND PREFIX:", prefixMaster);

  if (!prefixMaster) {
    throw new Error("Vehicle prefix not found");
  }

  const prefix = prefixMaster.prefix;

  const lastRecord = await prisma.purchaseItem.findFirst({
    where: {
      vehicleSrNo: {
        startsWith: `${prefix}/`,
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  let nextNumber = 1;

  if (lastRecord?.vehicleSrNo) {
    const parts = lastRecord.vehicleSrNo.split("/");
    nextNumber = Number(parts[1]) + 1;
  }

  return `${prefix}/${String(nextNumber).padStart(5, "0")}`;
};