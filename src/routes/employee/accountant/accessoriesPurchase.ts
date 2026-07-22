import { Router } from "express";
import * as AccessoriesPurchaseController from "../../../controllers/employee/accountant/accessoriesPurchase.js";
import { verifyToken } from "../../../middleware/middleware.js";

const router = Router();

router.post(
  "/",
  verifyToken,
  AccessoriesPurchaseController.createAccessoriesPurchase
);

router.get(
  "/",
  verifyToken,
  AccessoriesPurchaseController.getAccessoriesPurchases
);

router.get(
  "/bill-no",
  verifyToken,
  AccessoriesPurchaseController.getAccessoriesPurchaseBillNo
);

router.get(
  "/:id",
  verifyToken,
  AccessoriesPurchaseController.getAccessoriesPurchaseById
);

router.put(
  "/:id",
  verifyToken,
  AccessoriesPurchaseController.updateAccessoriesPurchase
);

router.put(
  "/verify/:id",
  verifyToken,
  AccessoriesPurchaseController.verifyAccessoriesPurchase
);

router.put(
  "/item-status/:id",
  verifyToken,
  AccessoriesPurchaseController.updateAccessoriesPurchaseItemStatus
);

router.get(
  "/inventory",
  verifyToken,
  AccessoriesPurchaseController.getAccessoriesInventory
);

router.delete(
  "/:id",
  verifyToken,
  AccessoriesPurchaseController.deleteAccessoriesPurchase
);

export default router;