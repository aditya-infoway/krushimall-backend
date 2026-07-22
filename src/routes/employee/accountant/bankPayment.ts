import { Router } from "express";
import * as BankPaymentController from "../../../controllers/employee/accountant/bankPayment.js";
import { verifyToken } from "../../../middleware/middleware.js";

const router = Router();

router.get("/", verifyToken, BankPaymentController.getBankPayments);

router.get(
  "/generate-voucher",
  verifyToken,
  BankPaymentController.getBankPaymentVoucher
);

router.get(
  "/export/excel",
  verifyToken,
  BankPaymentController.exportBankPaymentExcel
);

router.get("/:id", verifyToken, BankPaymentController.getBankPaymentById);

router.post("/", verifyToken, BankPaymentController.createBankPayment);

router.put("/:id", verifyToken, BankPaymentController.updateBankPayment);

router.delete("/:id", verifyToken, BankPaymentController.deleteBankPayment);

export default router;