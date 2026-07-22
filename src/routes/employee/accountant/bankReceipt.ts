import { Router } from "express";
import * as BankReceiptController from "../../../controllers/employee/accountant/bankReceipt.js";
import { verifyToken } from "../../../middleware/middleware.js";

const router = Router();

router.get("/", verifyToken, BankReceiptController.getBankReceipt);

router.get(
  "/generate-voucher",
  verifyToken,
  BankReceiptController.getBankReceiptVoucher
);

router.get(
  "/export/excel",
  verifyToken,
  BankReceiptController.exportBankReceiptExcel
);

router.get(
  "/:id/print",
  verifyToken,
  BankReceiptController.printBankReceipt
);

router.get("/:id", verifyToken, BankReceiptController.getBankReceiptById);

router.post("/", verifyToken, BankReceiptController.createBankReceipt);

router.put("/:id", verifyToken, BankReceiptController.updateBankReceipt);

router.delete("/:id", verifyToken, BankReceiptController.deleteBankReceipt);

export default router;