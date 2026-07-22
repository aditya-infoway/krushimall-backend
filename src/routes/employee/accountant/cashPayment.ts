import { Router } from "express";
import * as CashPaymentController from "../../../controllers/employee/accountant/cashPayment.js";
import { verifyToken } from "../../../middleware/middleware.js";

const router = Router();

router.get("/", verifyToken, CashPaymentController.getCashPayments);
router.get("/voucher", verifyToken, CashPaymentController.getCashPaymentVoucher);
router.get("/export", verifyToken, CashPaymentController.exportCashPaymentExcel);
router.get("/:id", verifyToken, CashPaymentController.getCashPaymentById);

router.post("/", verifyToken, CashPaymentController.createCashPayment);

router.put("/:id", verifyToken, CashPaymentController.updateCashPayment);

router.delete("/:id", verifyToken, CashPaymentController.deleteCashPayment);

export default router;