import { Router } from "express";
import * as CashReceiptController from "../../controllers/branch/cashReceipt.js";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";

const router = Router();

router.get("/", verifyBranchToken, CashReceiptController.getcashReceipt);

router.get(
  "/generate-voucher",
  
  CashReceiptController.getCashReceiptVoucher
);

router.get(
  "/export/excel",
  verifyBranchToken,
  CashReceiptController.exportCashReceiptExcel
);

router.get(
"/:id/print",
  verifyBranchToken,
  CashReceiptController.printCashReceipt
);

router.get("/:id", verifyBranchToken, CashReceiptController.getcashReceiptById);

router.post("/", verifyBranchToken, CashReceiptController.createCashReceipt);

router.put("/:id", verifyBranchToken, CashReceiptController.updateCashReceipt);

router.delete("/:id", verifyBranchToken, CashReceiptController.deleteCashReceipt);

export default router;