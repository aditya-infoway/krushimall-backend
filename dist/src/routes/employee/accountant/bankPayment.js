import { Router } from "express";
import * as BankPaymentController from "../../../controllers/employee/accountant/bankPayment.js";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";
const router = Router();
router.get("/", verifyEmployeeToken, BankPaymentController.getBankPayments);
router.get("/generate-voucher", BankPaymentController.getBankPaymentVoucher);
router.get("/export/excel", verifyEmployeeToken, BankPaymentController.exportBankPaymentExcel);
router.get("/:id", verifyEmployeeToken, BankPaymentController.getBankPaymentById);
router.post("/", verifyEmployeeToken, BankPaymentController.createBankPayment);
router.put("/:id", verifyEmployeeToken, BankPaymentController.updateBankPayment);
router.delete("/:id", verifyEmployeeToken, BankPaymentController.deleteBankPayment);
export default router;
//# sourceMappingURL=bankPayment.js.map