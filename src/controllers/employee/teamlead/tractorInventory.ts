
import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";

// Admin panel: sabhi branches ka verified tractor inventory dekh sakta hai
// Optional query param ?branchId=X se ek specific branch tak filter kar sakte ho
export const getTractorInventory = async (
  req: Request,
  res: Response
) => {
  try {
    const { branchId } = req.query;

    const where: any = {
      status: "VERIFIED",
    };

    if (branchId) {
      where.branchId = Number(branchId);
    }

    const vehicles = await prisma.vehicleStockTransfer.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            branchCode: true,
            branchName: true,
          },
        },
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
    console.error("getAdminTractorInventory ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tractor inventory.",
      error: error?.message || String(error),
    });
  }
};