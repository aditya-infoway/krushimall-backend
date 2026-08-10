import { Router } from "express";
import * as CashPaymentController from "../../../controllers/employee/accountant/cashPayment.js";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";

const router = Router();

router.get("/", verifyEmployeeToken, CashPaymentController.getCashPayments);
router.get("/voucher", CashPaymentController.getCashPaymentVoucher);
router.get("/export", verifyEmployeeToken, CashPaymentController.exportCashPaymentExcel);
router.get("/:id", verifyEmployeeToken, CashPaymentController.getCashPaymentById);

router.post("/", verifyEmployeeToken, CashPaymentController.createCashPayment);

router.put("/:id", verifyEmployeeToken, CashPaymentController.updateCashPayment);

router.delete("/:id", verifyEmployeeToken, CashPaymentController.deleteCashPayment);

export default router;