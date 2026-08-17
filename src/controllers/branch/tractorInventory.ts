// controllers/branch/tractorInventory.ts

import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";

const getBranchId = (req: Request) => {
  return Number(
    (req as any).user?.branchId ??
      (req as any).branch?.id ??
      (req as any).branch?.branchId ??
      null
  );
};

export const getBranchTractorInventory = async (
  req: Request,
  res: Response
) => {
  try {
    const branchId = getBranchId(req);

    if (!branchId) {
      return res.status(401).json({
        success: false,
        message: "Branch not authenticated.",
      });
    }

    const vehicles = await prisma.vehicleStockTransfer.findMany({
      where: {
        branchId,
        status: "VERIFIED",
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: vehicles,
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