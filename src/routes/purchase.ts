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
  getTractorInventory,
  getPendingPurchasesForCashPayment,
  getModelWiseInventoryAnalysis,
  getInventoryDetails,
} from "../controllers/purchase.js";

import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";

const router = express.Router();

// ⚠️ Pehle ye 3 routes bina kisi middleware ke thi — bina login koi bhi
// company ka bill number/inventory data dekh sakta tha. Ab protected
// hain (verifyAnyToken -> read access sab role ko).
router.get("/generate-bill-no", verifyAnyToken, getPurchaseBillNo);
router.get("/model-analysis", verifyAnyToken, getModelWiseInventoryAnalysis);
router.get("/inventory-details", verifyAnyToken, getInventoryDetails);

// Generate Vehicle Serial No
router.get("/vehicle-serial-no", verifyToken, getVehicleSerialNo);

// Create Purchase
router.post("/", verifyToken, createPurchase);

// Get All Purchases
router.get("/", verifyToken, getPurchases);
router.get("/pending", verifyAnyToken, getPendingPurchasesForCashPayment);

// Fixed routes must remain before /:id
router.get("/tractor-inventory", verifyAnyToken, getTractorInventory);

router.put("/purchase-items/:id/inward", verifyToken, submitPurchaseItemInward);

router.put("/:id/verify", verifyToken, verifyPurchase);

router.put("/:id/transport", verifyToken, saveTransport);

router.get("/:id/transport", verifyToken, getTransport);

// Generic ID routes remain last
router.get("/:id", verifyToken, getPurchaseById);

router.put("/:id", verifyToken, updatePurchase);

router.delete("/:id", verifyToken, deletePurchase);

export default router;