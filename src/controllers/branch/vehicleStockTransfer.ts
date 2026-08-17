import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";

// ============================================================
// controllers/branch/vehicleStockTransfer.ts
//
// Branch panel only READS its own vehicle stock transfers.
// Create/Update stays in the Admin controller
// (controllers/vehicleStockTransfer.ts) — Branch never creates
// or edits a transfer, it only receives stock transferred to it.
// ============================================================

const getBranchId = (req: Request) => {
  return Number(
    (req as any).user?.branchId ??
      (req as any).branch?.id ??
      (req as any).branch?.branchId ??
      null
  );
};

// GET /branch-panel/stocktransfer
// One row per transferNo (grouped, first entry) + item count,
// scoped to the logged-in branch
export const getVehicleStockTransfersByBranch = async (
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

    const grouped = await prisma.vehicleStockTransfer.groupBy({
      by: ["transferNo"],
      where: {
        branchId,
      },
      _min: {
        id: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        transferNo: "desc",
      },
    });

    const data = await Promise.all(
      grouped.map(async (group) => {
        const first = await prisma.vehicleStockTransfer.findUnique({
          where: {
            id: group._min.id!,
          },
          select: {
            id: true,
            transferNo: true,
            transferDate: true,
            branchId: true,
            branch: {
              select: {
                id: true,
                branchCode: true,
                branchName: true,
              },
            },
            manager: {
              select: {
                id: true,
                accountName: true, // manager is on the Account model — was "employeeName" (wrong)
              },
            },
            grandTotal: true,
            status: true,
          },
        });

        return {
          ...first,
          itemCount: group._count.id,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("getVehicleStockTransfersByBranch ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch branch vehicle stock transfers.",
      error: error?.message || String(error),
    });
  }
};

// GET /branch-panel/stocktransfer/:id
// Full details of one transfer (all vehicles under that transferNo) —
// only if that transfer actually belongs to the logged-in branch
export const getVehicleStockTransferByIdForBranch = async (
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

    const id = Number(req.params.id);

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

    // Ownership check — branch can only view its own transfers
    if (Number(firstTransfer.branchId) !== branchId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this transfer.",
      });
    }

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
// PATCH /branch-panel/stocktransfer/verify/:id
// Toggles verification for a single vehicle row in the transfer.
// checked=true  -> status VERIFIED + inWardDate/inWardTime = now
// checked=false -> revert back to TRANSFER, clear inward date/time
export const verifyVehicleStockTransferItem = async (
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

    const id = Number(req.params.id);
    const { checked } = req.body as { checked: boolean };

    const vehicle = await prisma.vehicleStockTransfer.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Ownership check — branch can only verify its own transfer rows
    if (Number(vehicle.branchId) !== branchId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this vehicle.",
      });
    }

    const now = new Date();

    const updated = await prisma.vehicleStockTransfer.update({
      where: { id },
      data: checked
        ? {
            status: "VERIFIED",
            inWardDate: now,
            inWardTime: now,
          }
        : {
            status: "TRANSFER",
            inWardDate: null,
            inWardTime: null,
          },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("verifyVehicleStockTransferItem ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify vehicle.",
      error: error?.message || String(error),
    });
  }
};