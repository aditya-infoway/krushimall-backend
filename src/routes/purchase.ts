import express from "express";
import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  deletePurchase,
  getPurchaseBillNo,
  updatePurchase,
  verifyPurchase,
  submitPurchaseItemInward,
  getVehicleSerialNo,
  saveTransport,
  getTransport,
  getTractorInventory
} from "../controllers/purchase.js";

const router = express.Router();
router.get("/generate-bill-no", getPurchaseBillNo);
router.get("/vehicle-serial-no", getVehicleSerialNo);

router.post("/", createPurchase);

router.get("/", getPurchases);

// Fixed routes FIRST
router.get("/tractor-inventory", getTractorInventory);

router.put("/purchase-items/:id/inward", submitPurchaseItemInward);

router.put("/:id/verify", verifyPurchase);

router.put("/:id/transport", saveTransport);
router.get("/:id/transport", getTransport);

// Generic :id route LAST
router.get("/:id", getPurchaseById);

router.put("/:id", updatePurchase);

router.delete("/:id", deletePurchase);
export default router;