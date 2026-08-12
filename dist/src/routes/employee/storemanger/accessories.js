import express from "express";
import { createAccessory, getAccessories, getAccessoriesHistory, updateAccessory, deleteAccessory, } from "../../../controllers/employee/storemanger/accessories.js";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";
const router = express.Router();
router.post("/", verifyEmployeeToken, createAccessory);
router.get("/", verifyEmployeeToken, getAccessories);
router.get("/history/:id", verifyEmployeeToken, getAccessoriesHistory);
router.put("/:id", verifyEmployeeToken, updateAccessory);
router.delete("/:id", verifyEmployeeToken, deleteAccessory);
export default router;
//# sourceMappingURL=accessories.js.map