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



import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";


const router = Router();

router.post("/",verifyEmployeeToken, createAccessoriesPurchase);

router.get("/",verifyEmployeeToken, getAccessoriesPurchases);

router.get("/bill-no",verifyEmployeeToken, getAccessoriesPurchaseBillNo);

router.get("/inventory",verifyEmployeeToken, getAccessoriesInventory);

router.get("/:id",verifyEmployeeToken, getAccessoriesPurchaseById);

router.get(
  "/history/:accessoryId",
  verifyEmployeeToken,
  getAccessoryPurchaseHistory
);

router.put("/:id",verifyEmployeeToken, updateAccessoriesPurchase);

router.put(
  "/item-status/:id",
  verifyEmployeeToken,
  updateAccessoriesPurchaseItemStatus
);

router.put(
  "/verify/:id",
  verifyEmployeeToken,
  verifyAccessoriesPurchase
);

router.delete("/:id",verifyEmployeeToken, deleteAccessoriesPurchase);

export default router;