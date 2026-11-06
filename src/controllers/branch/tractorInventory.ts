import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";

const getBranchId = (req: Request) => {
  return Number(
    (req as any).user?.branchId ??
      (req as any).branch?.id ??
      (req as any).branch?.branchId ??
      null,
  );
};

const toISO = (d?: Date | null) => (d ? d.toISOString() : "");

// Branch panel Tractor Inventory:
// Sirf wahi vehicles jo admin ne is branch ko transfer ki
// aur is branch ne Stock Verify (status = VERIFIED) kar di.
export const getBranchTractorInventory = async (
  req: Request,
  res: Response,
) => {
  try {
    const branchId = getBranchId(req);

    if (!branchId) {
      return res.status(401).json({
        success: false,
        message: "Branch not authenticated.",
      });
    }

    const transfers = await prisma.vehicleStockTransfer.findMany({
      where: {
        branchId,
        status: "VERIFIED",
      },
      orderBy: {
        id: "desc",
      },
    });

    // Booked check: jis chassis ka order ban chuka hai
    const chassisList = transfers.map((t) => t.chassisNo).filter(Boolean);

    const bookedOrders = chassisList.length
      ? await prisma.order.findMany({
          where: {
            chassisNo: { in: chassisList },
          },
          select: { chassisNo: true },
        })
      : [];

    const bookedSet = new Set(bookedOrders.map((o) => o.chassisNo));

    const data = transfers.map((t) => ({
      id: `T-${t.id}`,
      source: "TRANSFER" as const,
      stock: t.stock === "Off" ? "Off" : "On",
      status: bookedSet.has(t.chassisNo) ? "Booked" : "Present",
      location: t.location || "",
      itemCode: t.itemCode || "",
      currentLocation: t.currentLocation || "",
      billNo: t.billNo || "",
      purchaseBillNo: t.purchaseBillNo || "",
      supplierName: t.supplierName || "",
      itemName: t.itemName || "",
      modelName: t.modelName || "",
      variantName: t.variantName || "",
      colour: t.colour || "",
      fuelType: t.fuelType || "",
      serialNo: t.serialNo || "",
      mfgDate: toISO(t.mfgDate),
      chassisNo: t.chassisNo || "",
      engineNo: t.engineNo || "",
      keyNumber: t.keyNumber || "",
      batteryMake: t.batteryMake || "",
      batteryNo: t.batteryNo || "",
      first1TyreNo: t.first1TyreNo || "",
      first2TyreNo: t.first2TyreNo || "",
      second1TyreNo: t.second1TyreNo || "",
      second2TyreNo: t.second2TyreNo || "",
      grnDate: toISO(t.grnDate),
      grnRecordDate: toISO(t.grnRecordDate),
      grnNo: t.grnNo || "",
      inWardDate: toISO(t.inWardDate),
      inWardTime: toISO(t.inWardTime),
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("getBranchTractorInventory ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tractor inventory.",
      error: error?.message || String(error),
    });
  }
};