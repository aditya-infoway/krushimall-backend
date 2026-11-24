import express from "express";
import {
  createSparePartsPurchase,
  getSparePartsPurchases,
  getSparePartsPurchaseById,
  updateSparePartsPurchase,
  deleteSparePartsPurchase,
  verifySparePartsPurchase,
  getSparePartsPurchaseBillNo,
  updateSparePartsPurchaseItemStatus,
  getSparePartsInventory,
  getSparePartPurchaseHistory,
} from "../controllers/sparePartsPurchase.js";
import { verifyToken } from "../middleware/middleware.js";

const router = express.Router();

router.post("/", verifyToken, createSparePartsPurchase);
router.get("/", verifyToken, getSparePartsPurchases);
router.get("/bill-no", getSparePartsPurchaseBillNo);
router.get("/inventory", verifyToken, getSparePartsInventory);
router.get("/history/:sparePartId", verifyToken, getSparePartPurchaseHistory);
router.get("/:id", verifyToken, getSparePartsPurchaseById);
router.put("/:id", verifyToken, updateSparePartsPurchase);
router.delete("/:id", verifyToken, deleteSparePartsPurchase);
router.patch("/:id/verify", verifyToken, verifySparePartsPurchase);
router.patch(
  "/item/:id/status",
  verifyToken,
  updateSparePartsPurchaseItemStatus,
);

export default router;
