// account.ts
import express from "express";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";
import * as AccountController from "../../../controllers/employee/storemanger/account.js";
const router = express.Router();
router.post("/", verifyEmployeeToken, AccountController.createAccount);
router.get("/", verifyEmployeeToken, AccountController.getAccounts);
router.get("/:id", verifyEmployeeToken, AccountController.getAccountById);
router.put("/:id", verifyEmployeeToken, AccountController.updateAccount);
router.delete("/:id", verifyEmployeeToken, AccountController.deleteAccount);
export default router;
//# sourceMappingURL=account.js.map