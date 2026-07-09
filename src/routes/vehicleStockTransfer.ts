import { Router } from "express";

import { verifyToken } from "../middleware/middleware.js";

import {
  createVehicleStockTransfer,
  getVehicleStockTransferNo,
  getVehicleStockTransfers
} from "../controllers/vehicleStockTransfer.js";

const router = Router();

// Generate Transfer Number
router.get(
  "/generate-transfer-no",
  verifyToken,
  getVehicleStockTransferNo
);
router.get("/", getVehicleStockTransfers);
// Create Vehicle Stock Transfer
router.post(
  "/",
  verifyToken,
  createVehicleStockTransfer
);

export default router;