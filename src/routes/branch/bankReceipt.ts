import { Router } from "express";
import * as BankReceiptController from "../../controllers/branch/bankReceipt.js";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";

const router = Router();

router.get("/", verifyBranchToken, BankReceiptController.getBankReceipt);

router.get(
  "/generate-voucher",
  
  BankReceiptController.getBankReceiptVoucher
);

router.get(
  "/export/excel",
  verifyBranchToken,
  BankReceiptController.exportBankReceiptExcel
);

router.get(
  "/:id/print",
  verifyBranchToken,
  BankReceiptController.printBankReceipt
);

router.get("/:id", verifyBranchToken, BankReceiptController.getBankReceiptById);

router.post("/", verifyBranchToken, BankReceiptController.createBankReceipt);

router.put("/:id", verifyBranchToken, BankReceiptController.updateBankReceipt);

router.delete("/:id", verifyBranchToken, BankReceiptController.deleteBankReceipt);

export default router;