import { Router } from "express";
import { verifyToken } from "../middleware/middleware.js";
import { createVehicleStockTransfer, getVehicleStockTransferNo, getVehicleStockTransfers, getVehicleStockTransferById, updateVehicleStockTransfer } from "../controllers/vehicleStockTransfer.js";
const router = Router();
// Generate Transfer Number
router.get("/generate-transfer-no", verifyToken, getVehicleStockTransferNo);
router.get("/", getVehicleStockTransfers);
// Create Vehicle Stock Transfer
router.post("/", verifyToken, createVehicleStockTransfer);
router.get("/:id", verifyToken, getVehicleStockTransferById);
router.put("/:id", verifyToken, updateVehicleStockTransfer);
export default router;
//# sourceMappingURL=vehicleStockTransfer.js.map