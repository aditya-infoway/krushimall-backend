import { Router } from "express";
import * as AccessoriesPurchaseController from "../../../controllers/employee/accountant/accessoriesPurchase.js";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";
const router = Router();
router.post("/", verifyEmployeeToken, AccessoriesPurchaseController.createAccessoriesPurchase);
router.get("/", verifyEmployeeToken, AccessoriesPurchaseController.getAccessoriesPurchases);
router.get("/bill-no", AccessoriesPurchaseController.getAccessoriesPurchaseBillNo);
router.get("/:id", verifyEmployeeToken, AccessoriesPurchaseController.getAccessoriesPurchaseById);
router.put("/:id", verifyEmployeeToken, AccessoriesPurchaseController.updateAccessoriesPurchase);
router.put("/verify/:id", verifyEmployeeToken, AccessoriesPurchaseController.verifyAccessoriesPurchase);
router.put("/item-status/:id", verifyEmployeeToken, AccessoriesPurchaseController.updateAccessoriesPurchaseItemStatus);
router.get("/inventory", verifyEmployeeToken, AccessoriesPurchaseController.getAccessoriesInventory);
router.delete("/:id", verifyEmployeeToken, AccessoriesPurchaseController.deleteAccessoriesPurchase);
export default router;
//# sourceMappingURL=accessoriesPurchase.js.map