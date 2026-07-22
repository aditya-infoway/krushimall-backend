import { Router } from "express";
import * as PurchaseController from "../../../controllers/employee/accountant/purchase.js";
import { verifyToken } from "../../../middleware/middleware.js";

const router = Router();

router.post("/", verifyToken, PurchaseController.createPurchase);
router.get("/", verifyToken, PurchaseController.getPurchases);
router.get("/bill-no", verifyToken, PurchaseController.getPurchaseBillNo);
router.get("/vehicle-sr-no", verifyToken, PurchaseController.getVehicleSerialNo);
router.get("/inventory", verifyToken, PurchaseController.getTractorInventory);

router.get("/:id", verifyToken, PurchaseController.getPurchaseById);
router.put("/:id", verifyToken, PurchaseController.updatePurchase);
router.delete("/:id", verifyToken, PurchaseController.deletePurchase);

router.put("/:id/verify", verifyToken, PurchaseController.verifyPurchase);
router.put(
  "/purchase-items/:id/inward",
  verifyToken,
  PurchaseController.submitPurchaseItemInward
);

router.put("/:id/transport", verifyToken, PurchaseController.saveTransport);
router.get("/:id/transport", verifyToken, PurchaseController.getTransport);

export default router;