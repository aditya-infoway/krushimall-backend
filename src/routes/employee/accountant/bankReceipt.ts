import { Router } from "express";
import * as BankReceiptController from "../../../controllers/employee/accountant/bankReceipt.js";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";

const router = Router();

router.get("/", verifyEmployeeToken, BankReceiptController.getBankReceipt);

router.get(
  "/generate-voucher",
  
  BankReceiptController.getBankReceiptVoucher
);

router.get(
  "/export/excel",
  verifyEmployeeToken,
  BankReceiptController.exportBankReceiptExcel
);

router.get(
  "/:id/print",
  verifyEmployeeToken,
  BankReceiptController.printBankReceipt
);

router.get("/:id", verifyEmployeeToken, BankReceiptController.getBankReceiptById);

router.post("/", verifyEmployeeToken, BankReceiptController.createBankReceipt);

router.put("/:id", verifyEmployeeToken, BankReceiptController.updateBankReceipt);

router.delete("/:id", verifyEmployeeToken, BankReceiptController.deleteBankReceipt);

export default router;