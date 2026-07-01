import express from "express";
import {
  createAccessoriesPurchase,
  getAccessoriesPurchases,
  getAccessoriesPurchaseById,
  verifyAccessoriesPurchase,
  deleteAccessoriesPurchase,
  getAccessoriesPurchaseBillNo,
  updateAccessoriesPurchase,
  updateAccessoriesPurchaseItemStatus
} from "../controllers/accessoriesPurchase.js";

const router = express.Router();

// Generate Bill No
router.get("/generate-bill-no", getAccessoriesPurchaseBillNo);

router.post("/", createAccessoriesPurchase);

router.get("/", getAccessoriesPurchases);

router.get("/:id", getAccessoriesPurchaseById);

router.put("/:id", updateAccessoriesPurchase);

router.put("/verify/:id", verifyAccessoriesPurchase);
router.put(
  "/item-status/:id",
  updateAccessoriesPurchaseItemStatus
);
router.delete("/:id", deleteAccessoriesPurchase);

export default router;