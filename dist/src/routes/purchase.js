import express from "express";
import { createPurchase, getPurchases, getPurchaseById, deletePurchase, getPurchaseBillNo, updatePurchase, verifyPurchase, submitPurchaseItemInward, getVehicleSerialNo, saveTransport, getTransport, getTractorInventory, getPendingPurchasesForCashPayment, getModelWiseInventoryAnalysis, getInventoryDetails } from "../controllers/purchase.js";
import { verifyToken } from "../middleware/middleware.js";
const router = express.Router();
// Generate Purchase Bill No
router.get("/generate-bill-no", getPurchaseBillNo);
// Generate Vehicle Serial No
router.get("/vehicle-serial-no", verifyToken, getVehicleSerialNo);
// Create Purchase
router.post("/", verifyToken, createPurchase);
// Get All Purchases
router.get("/", verifyToken, getPurchases);
router.get("/pending", verifyToken, getPendingPurchasesForCashPayment);
router.get("/model-analysis", getModelWiseInventoryAnalysis);
router.get("/inventory-details", getInventoryDetails);
// Fixed routes must remain before /:id
router.get("/tractor-inventory", verifyToken, getTractorInventory);
router.put("/purchase-items/:id/inward", verifyToken, submitPurchaseItemInward);
router.put("/:id/verify", verifyToken, verifyPurchase);
router.put("/:id/transport", verifyToken, saveTransport);
router.get("/:id/transport", verifyToken, getTransport);
// Generic ID routes remain last
router.get("/:id", verifyToken, getPurchaseById);
router.put("/:id", verifyToken, updatePurchase);
router.delete("/:id", verifyToken, deletePurchase);
export default router;
//# sourceMappingURL=purchase.js.map