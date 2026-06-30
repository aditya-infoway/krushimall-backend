import express from "express";
import {
  createAccessoriesPurchase,
  getAccessoriesPurchases,
  getAccessoriesPurchaseById,
  verifyAccessoriesPurchase,
  deleteAccessoriesPurchase,
  getAccessoriesPurchaseBillNo,
} from "../controllers/accessoriesPurchase.js";

const router = express.Router();

// Generate Bill No
router.get(
  "/generate-bill-no",
  getAccessoriesPurchaseBillNo
);

// Create Purchase
router.post(
  "/",
  createAccessoriesPurchase
);

// Get All Purchases
router.get(
  "/",
  getAccessoriesPurchases
);

// Get Purchase By Id
router.get(
  "/:id",
  getAccessoriesPurchaseById
);

// Verify Purchase
router.put(
  "/verify/:id",
  verifyAccessoriesPurchase
);

// Delete Purchase
router.delete(
  "/:id",
  deleteAccessoriesPurchase
);

export default router;