import { Router } from "express";

import {
  getVehicleStockTransfersByBranch,
  getVehicleStockTransferByIdForBranch,
  verifyVehicleStockTransferItem,
} from "../../controllers/branch/vehicleStockTransfer.js";

import { verifyBranchToken } from "../../middleware/branchMiddleware.js";

const router = Router();

// Verify a single vehicle row (checkbox) — status + inward date/time
router.patch(
  "/verify/:id",
  verifyBranchToken,
  verifyVehicleStockTransferItem
);

// Grouped list (one row per transferNo) — scoped to logged-in branch
router.get("/", verifyBranchToken, getVehicleStockTransfersByBranch);

// Full transfer details (all vehicles under a transferNo) — ownership checked
router.get("/:id", verifyBranchToken, getVehicleStockTransferByIdForBranch);

export default router;