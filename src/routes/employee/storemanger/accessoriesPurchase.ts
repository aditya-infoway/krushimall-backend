import { Router } from "express";
import {
  createAccessoriesPurchase,
  getAccessoriesPurchases,
  getAccessoriesPurchaseById,
  updateAccessoriesPurchase,
  verifyAccessoriesPurchase,
  deleteAccessoriesPurchase,
  getAccessoriesPurchaseBillNo,
  updateAccessoriesPurchaseItemStatus,
  getAccessoriesInventory,
  getAccessoryPurchaseHistory,
} from "../../../controllers/employee/storemanger/accessoriesPurchase.js";



import { verifyToken } from "../../../middleware/middleware.js";


const router = Router();

router.post("/",verifyToken, createAccessoriesPurchase);

router.get("/",verifyToken, getAccessoriesPurchases);

router.get("/bill-no",verifyToken, getAccessoriesPurchaseBillNo);

router.get("/inventory",verifyToken, getAccessoriesInventory);

router.get("/:id",verifyToken, getAccessoriesPurchaseById);

router.get(
  "/history/:accessoryId",
  verifyToken,
  getAccessoryPurchaseHistory
);

router.put("/:id",verifyToken, updateAccessoriesPurchase);

router.put(
  "/item-status/:id",
  verifyToken,
  updateAccessoriesPurchaseItemStatus
);

router.put(
  "/verify/:id",
  verifyToken,
  verifyAccessoriesPurchase
);

router.delete("/:id",verifyToken, deleteAccessoriesPurchase);

export default router;