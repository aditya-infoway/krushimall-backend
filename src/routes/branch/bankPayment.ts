import { Router } from "express";
import * as BankPaymentController from "../../controllers/branch/bankPayment.js";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";

const router = Router();

router.get("/", verifyBranchToken, BankPaymentController.getBankPayments);

router.get(
  "/generate-voucher",
 
  BankPaymentController.getBankPaymentVoucher
);

router.get(
  "/export/excel",
  verifyBranchToken,
  BankPaymentController.exportBankPaymentExcel
);

router.get("/:id", verifyBranchToken, BankPaymentController.getBankPaymentById);

router.post("/", verifyBranchToken, BankPaymentController.createBankPayment);

router.put("/:id", verifyBranchToken, BankPaymentController.updateBankPayment);

router.delete("/:id", verifyBranchToken, BankPaymentController.deleteBankPayment);

export default router;