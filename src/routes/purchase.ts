import express from "express";
import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  deletePurchase,
  getPurchaseBillNo
} from "../controllers/purchase.js";

const router = express.Router();
router.get("/generate-bill-no", getPurchaseBillNo);
router.post("/", createPurchase);
router.get("/", getPurchases);
router.get("/:id", getPurchaseById);
router.delete("/:id", deletePurchase);

export default router;