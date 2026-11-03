import { Request, Response } from "express";
import { getTractorInventoryRows } from "../../utils/tractorInventoryRows.js";

const getBranchId = (req: Request) => {
  return Number(
    (req as any).user?.branchId ??
      (req as any).branch?.id ??
      (req as any).branch?.branchId ??
      null,
  );
};

// Branch panel:
// - Jo vehicles kisi branch ko transfer nahi hui (sab dekh sakti hain)
// - Jo is branch ko transfer hui
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

    const data = await getTractorInventoryRows({
      branchId,
      mode: "forBranch",
    });

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