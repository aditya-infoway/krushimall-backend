import express from "express";
import { createAccessoriesPurchase, getAccessoriesPurchases, getAccessoriesPurchaseById, verifyAccessoriesPurchase, deleteAccessoriesPurchase, getAccessoriesPurchaseBillNo, updateAccessoriesPurchase, updateAccessoriesPurchaseItemStatus, getAccessoriesInventory, getAccessoryPurchaseHistory } from "../controllers/accessoriesPurchase.js";
import { verifyToken } from "../middleware/middleware.js";
const router = express.Router();
// Generate Bill No
router.get("/generate-bill-no", getAccessoriesPurchaseBillNo);
// Create Accessories Purchase
router.post("/", verifyToken, createAccessoriesPurchase);
router.get("/accessories-inventory", verifyToken, getAccessoriesInventory);
// Get all
router.get("/", verifyToken, getAccessoriesPurchases);
router.get("/history/:accessoryId", verifyToken, getAccessoryPurchaseHistory);
// Verify
router.put("/verify/:id", verifyToken, verifyAccessoriesPurchase);
// Update item status
router.put("/item-status/:id", verifyToken, updateAccessoriesPurchaseItemStatus);
// Get by ID
router.get("/:id", verifyToken, getAccessoriesPurchaseById);
// Update
router.put("/:id", verifyToken, updateAccessoriesPurchase);
// Delete
router.delete("/:id", verifyToken, deleteAccessoriesPurchase);
export default router;
//# sourceMappingURL=accessoriesPurchase.js.map