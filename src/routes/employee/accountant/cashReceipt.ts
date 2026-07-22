import { Router } from "express";
import * as CashReceiptController from "../../../controllers/employee/accountant/cashReceipt.js";
import { verifyToken } from "../../../middleware/middleware.js";

const router = Router();

router.get("/", verifyToken, CashReceiptController.getcashReceipt);

router.get(
  "/generate-voucher",
  verifyToken,
  CashReceiptController.getCashReceiptVoucher
);

router.get(
  "/export/excel",
  verifyToken,
  CashReceiptController.exportCashReceiptExcel
);

router.get(
"/:id/print",
  verifyToken,
  CashReceiptController.printCashReceipt
);

router.get("/:id", verifyToken, CashReceiptController.getcashReceiptById);

router.post("/", verifyToken, CashReceiptController.createCashReceipt);

router.put("/:id", verifyToken, CashReceiptController.updateCashReceipt);

router.delete("/:id", verifyToken, CashReceiptController.deleteCashReceipt);

export default router;