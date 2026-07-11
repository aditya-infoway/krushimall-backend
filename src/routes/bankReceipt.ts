import { Router } from "express";
import {
  createBankReceipt,
  getBankReceipt,
  getBankReceiptById,
  updateBankReceipt,
  deleteBankReceipt,
  getBankReceiptVoucher,
  exportBankReceiptExcel
} from "../controllers/bankReceipt.js";
import { verifyToken } from "../middleware/middleware.js";

const router = Router();



// Generate Voucher No.
router.get("/voucher", verifyToken, getBankReceiptVoucher);

// Get All
router.get("/", verifyToken, getBankReceipt);

// Get By Id
router.get("/:id", verifyToken, getBankReceiptById);

// Create
router.post("/", verifyToken, createBankReceipt);

// Update
router.put("/:id", verifyToken, updateBankReceipt);

// Delete
router.delete("/:id", verifyToken, deleteBankReceipt);
router.get(
  "/export/excel",
  verifyToken,
  exportBankReceiptExcel
);
export default router;