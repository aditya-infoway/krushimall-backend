import { Request, Response } from "express";
import { getTractorInventoryRows } from "../../../utils/tractorInventoryRows.js";

// Employee panel (admin jaisa): sabhi vehicles
// Optional ?branchId=X => sirf us branch ko transfer hui vehicles
export const getTractorInventory = async (req: Request, res: Response) => {
  try {
    const branchId = req.query.branchId ? Number(req.query.branchId) : null;

    const data = await getTractorInventoryRows({ branchId, mode: "all" });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("getTractorInventory (employee) ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tractor inventory.",
      error: error?.message || String(error),
    });
  }
};