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
  getVehicleSerialNo
} from "../controllers/purchase.js";

const router = express.Router();
router.get("/generate-bill-no", getPurchaseBillNo);

// 👇 Add here
router.get("/vehicle-serial-no", getVehicleSerialNo);

router.post("/", createPurchase);

router.put("/:id", updatePurchase);

router.put("/:id/verify", verifyPurchase);

router.put(
  "/purchase-items/:id/inward",
  submitPurchaseItemInward
);

router.get("/", getPurchases);

router.get("/:id", getPurchaseById);

router.delete("/:id", deletePurchase);
export default router;