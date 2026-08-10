import { Router } from "express";
import * as CashReceiptController from "../../../controllers/employee/accountant/cashReceipt.js";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";

const router = Router();

router.get("/", verifyEmployeeToken, CashReceiptController.getcashReceipt);

router.get(
  "/generate-voucher",
  
  CashReceiptController.getCashReceiptVoucher
);

router.get(
  "/export/excel",
  verifyEmployeeToken,
  CashReceiptController.exportCashReceiptExcel
);

router.get(
"/:id/print",
  verifyEmployeeToken,
  CashReceiptController.printCashReceipt
);

router.get("/:id", verifyEmployeeToken, CashReceiptController.getcashReceiptById);

router.post("/", verifyEmployeeToken, CashReceiptController.createCashReceipt);

router.put("/:id", verifyEmployeeToken, CashReceiptController.updateCashReceipt);

router.delete("/:id", verifyEmployeeToken, CashReceiptController.deleteCashReceipt);

export default router;