// src/routes/implementPurchase.ts
import express from "express";
import {
  createImplementPurchase,
  getImplementPurchases,
  getImplementPurchaseById,
  updateImplementPurchase,
  deleteImplementPurchase,
  verifyImplementPurchase,
  getImplementPurchaseBillNo,
  updateImplementPurchaseItemStatus,
  getImplementPurchaseHistory,
  getImplementInventory
} from "../controllers/implementPurchase.js";
import { verifyToken } from "../middleware/middleware.js";

const router = express.Router();

router.post("/", verifyToken, createImplementPurchase);
router.get("/", verifyToken, getImplementPurchases);
router.get("/inventory", verifyToken, getImplementInventory);
router.get("/bill-no", verifyToken, getImplementPurchaseBillNo);
router.get(
  "/history/:implementId",
  verifyToken,
  getImplementPurchaseHistory,
);
router.get("/:id", verifyToken, getImplementPurchaseById);
router.put("/:id", verifyToken, updateImplementPurchase);
router.delete("/:id", verifyToken, deleteImplementPurchase);
router.patch("/:id/verify", verifyToken, verifyImplementPurchase);
router.patch(
  "/item/:id/status",
  verifyToken,
  updateImplementPurchaseItemStatus,
);

export default router;

// app/index me register karna:
// import implementPurchaseRoutes from "./routes/implementPurchase.js";
// app.use("/api/implement-purchase", implementPurchaseRoutes);