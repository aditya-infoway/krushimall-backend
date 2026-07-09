import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { generateVehicleStockTransferNo } from "../utils/generateVehicleStockTransferNo.js";

export const createVehicleStockTransfer = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      companyId,
      financialYearId,
      transferDate,

      branchId,
      managerId,
      branchOpeningBalance,

      totalValue,
      freight,
      insurance,
      otherCharge,
      taxableValue,

      cgst,
      sgst,
      igst,

      grandTotal,

      vehicles,
    } = req.body;

    if (
      !companyId ||
      !financialYearId ||
      !transferDate ||
      !branchId ||
      !managerId ||
      !vehicles?.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const transferNo = await generateVehicleStockTransferNo();

    const role = (req as any).user?.role;
    const name = (req as any).user?.name;

    const createdTransfers = [];

    for (const item of vehicles) {
     const transfer = await prisma.vehicleStockTransfer.create({
  data: {
    transferNo,

    company: {
      connect: {
        id: Number(companyId),
      },
    },

    financialYear: {
      connect: {
        id: Number(financialYearId),
      },
    },

    branch: {
      connect: {
        id: Number(branchId),
      },
    },

    manager: {
      connect: {
        id: Number(managerId),
      },
    },


    transferDate: new Date(transferDate),

    branchOpeningBalance: Number(branchOpeningBalance) || 0,

    totalValue: Number(totalValue),
    freight: Number(freight || 0),
    insurance: Number(insurance || 0),
    otherCharge: Number(otherCharge || 0),
    taxableValue: Number(taxableValue),

    cgst: Number(cgst || 0),
    sgst: Number(sgst || 0),
    igst: Number(igst || 0),

    grandTotal: Number(grandTotal),

    itemName: item.itemName,
    itemCode: item.itemCode,

    modelName: item.model,
    variantName: item.variant,
    colour: item.colour,

    chassisNo: item.chassisNo,
    engineNo: item.engineNo,
    serialNo: item.serialNo,

    // ===== ADD THESE HERE =====
    supplierName: item.supplierName,
    billNo: item.billNo,
    purchaseBillNo: item.purchaseBillNo,

    stock: item.stock,
    currentLocation: item.currentLocation,

    inWardDate: item.inWardDate
      ? new Date(item.inWardDate)
      : null,

    inWardTime: item.inWardTime
      ? new Date(item.inWardTime)
      : null,

    ageDay: Number(item.ageDay || 0),
    // ==========================

    fuelType: item.fuelType,
    fuelCapacity: item.fuelCapacity,

    purchasePriceNoGST: Number(item.purchasePriceNoGST),
    purchasePriceTaxable: Number(item.purchasePriceTaxable),

    mfgDate: item.mfgDate
      ? new Date(item.mfgDate)
      : null,

    keyNumber: item.keyNumber,

    batteryMake: item.batteryMake,
    batteryNo: item.batteryNo,

    first1TyreNo: item.first1Tyer,
    first2TyreNo: item.first2Tyer,

    second1TyreNo: item.second1Tyer,
    second2TyreNo: item.second2Tyer,

    location: item.location,

    grnNo: item.grnNo,

    grnDate: item.grnDate
      ? new Date(item.grnDate)
      : null,

    grnRecordDate: item.grnRecordDate
      ? new Date(item.grnRecordDate)
      : null,

    status: "TRANSFER",

    createdBy: name,
    createdType: role,
  },
});

  

      createdTransfers.push(transfer);
    }

    return res.status(201).json({
      success: true,
      message: "Vehicle Stock Transfer created successfully.",
      transferNo,
      data: createdTransfers,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Vehicle Stock Transfer.",
    });
  }
};
export const getVehicleStockTransferNo = async (
  req: Request,
  res: Response
) => {
  try {
    const transferNo = await generateVehicleStockTransferNo();

    return res.status(200).json({
      success: true,
      transferNo,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate Vehicle Stock Transfer No",
    });
  }
};
export const getVehicleStockTransfers = async (
  req: Request,
  res: Response
) => {
  try {
    const transfers = await prisma.vehicleStockTransfer.groupBy({
      by: ["transferNo"],
      _min: {
        id: true,
      },
      orderBy: {
        transferNo: "desc",
      },
    });

    const data = await Promise.all(
      transfers.map(async (item) => {
        return prisma.vehicleStockTransfer.findUnique({
          where: {
            id: item._min.id!,
          },
          include: {
            company: true,
            financialYear: true,
            branch: true,
            manager: true,
          },
        });
      })
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle stock transfers.",
    });
  }
};
export const getVehicleStockTransferById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    // First record
    const firstTransfer = await prisma.vehicleStockTransfer.findUnique({
      where: { id },
      include: {
        company: true,
        financialYear: true,
        branch: true,
        manager: true,
      },
    });

    if (!firstTransfer) {
      return res.status(404).json({
        success: false,
        message: "Transfer not found",
      });
    }

    // All vehicles of same transfer number
    const vehicles = await prisma.vehicleStockTransfer.findMany({
      where: {
        transferNo: firstTransfer.transferNo,
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        ...firstTransfer,
        vehicles,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch transfer",
    });
  }
};
export const updateVehicleStockTransfer = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const {
      companyId,
      financialYearId,
      transferDate,
      branchId,
      managerId,
      branchOpeningBalance,
      totalValue,
      freight,
      insurance,
      otherCharge,
      taxableValue,
      cgst,
      sgst,
      igst,
      grandTotal,
      vehicles,
    } = req.body;

    const existing = await prisma.vehicleStockTransfer.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Transfer not found.",
      });
    }

    const transferNo = existing.transferNo;

    const role = (req as any).user?.role;
    const name = (req as any).user?.name;

    await prisma.$transaction(async (tx) => {
      // Remove old rows
      await tx.vehicleStockTransfer.deleteMany({
        where: {
          transferNo,
        },
      });

      // Insert new rows
      for (const item of vehicles) {
        await tx.vehicleStockTransfer.create({
          data: {
            transferNo,

            company: {
              connect: {
                id: Number(companyId),
              },
            },

            financialYear: {
              connect: {
                id: Number(financialYearId),
              },
            },

            branch: {
              connect: {
                id: Number(branchId),
              },
            },

            manager: {
              connect: {
                id: Number(managerId),
              },
            },

            transferDate: new Date(transferDate),

            branchOpeningBalance: Number(branchOpeningBalance),

            totalValue: Number(totalValue),
            freight: Number(freight || 0),
            insurance: Number(insurance || 0),
            otherCharge: Number(otherCharge || 0),
            taxableValue: Number(taxableValue),

            cgst: Number(cgst || 0),
            sgst: Number(sgst || 0),
            igst: Number(igst || 0),

            grandTotal: Number(grandTotal),

            itemName: item.itemName,
            itemCode: item.itemCode,

            modelName: item.modelName || item.model,
            variantName: item.variantName || item.variant,
            colour: item.colour,

            chassisNo: item.chassisNo,
            engineNo: item.engineNo,
            serialNo: item.serialNo,

            supplierName: item.supplierName,
            billNo: item.billNo,
            purchaseBillNo: item.purchaseBillNo,

            stock: item.stock,
            currentLocation: item.currentLocation,

            inWardDate: item.inWardDate
              ? new Date(item.inWardDate)
              : null,

            inWardTime: item.inWardTime
              ? new Date(item.inWardTime)
              : null,

            ageDay: Number(item.ageDay || 0),

            fuelType: item.fuelType,
            fuelCapacity: item.fuelCapacity,

            purchasePriceNoGST: Number(item.purchasePriceNoGST),
            purchasePriceTaxable: Number(item.purchasePriceTaxable),

            mfgDate: item.mfgDate
              ? new Date(item.mfgDate)
              : null,

            keyNumber: item.keyNumber,

            batteryMake: item.batteryMake,
            batteryNo: item.batteryNo,

            first1TyreNo: item.first1TyreNo || item.first1Tyer,
            first2TyreNo: item.first2TyreNo || item.first2Tyer,
            second1TyreNo: item.second1TyreNo || item.second1Tyer,
            second2TyreNo: item.second2TyreNo || item.second2Tyer,

            location: item.location,

            grnNo: item.grnNo,

            grnDate: item.grnDate
              ? new Date(item.grnDate)
              : null,

            grnRecordDate: item.grnRecordDate
              ? new Date(item.grnRecordDate)
              : null,

            status: "TRANSFER",

            createdBy: name,
            createdType: role,
          },
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: "Vehicle Stock Transfer updated successfully.",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update Vehicle Stock Transfer.",
    });
  }
};