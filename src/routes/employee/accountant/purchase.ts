import { Router } from "express";
import * as PurchaseController from "../../../controllers/employee/accountant/purchase.js";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";

const router = Router();

router.post("/", verifyEmployeeToken, PurchaseController.createPurchase);
router.get("/", verifyEmployeeToken, PurchaseController.getPurchases);
router.get(
  "/pending",
  verifyEmployeeToken,
  PurchaseController.getPendingPurchasesForCashPayment
);
router.get("/bill-no",  PurchaseController.getPurchaseBillNo);
router.get("/vehicle-sr-no",  PurchaseController.getVehicleSerialNo);
router.get("/inventory", verifyEmployeeToken, PurchaseController.getTractorInventory);

router.get("/:id", verifyEmployeeToken, PurchaseController.getPurchaseById);
router.put("/:id", verifyEmployeeToken, PurchaseController.updatePurchase);
router.delete("/:id", verifyEmployeeToken, PurchaseController.deletePurchase);

router.put("/:id/verify", verifyEmployeeToken, PurchaseController.verifyPurchase);
router.put(
  "/purchase-items/:id/inward",
  verifyEmployeeToken,
  PurchaseController.submitPurchaseItemInward
);

router.put("/:id/transport", verifyEmployeeToken, PurchaseController.saveTransport);
router.get("/:id/transport", verifyEmployeeToken, PurchaseController.getTransport);

export default router;