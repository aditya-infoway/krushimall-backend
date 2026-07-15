import express from "express";
import { verifyToken } from "../middleware/middleware.js";
import {
  getcashReceipt,
  getcashReceiptById,
  createCashReceipt,
  updateCashReceipt,
  deleteCashReceipt,
  getCashReceiptVoucher,
  exportCashReceiptExcel,
  printCashReceipt,
} from "../controllers/cashReceipt.js";

const router = express.Router();

router.get("/", verifyToken, getcashReceipt);
router.get("/voucher", verifyToken, getCashReceiptVoucher);
router.get("/:id", verifyToken, getcashReceiptById);
router.post("/", verifyToken, createCashReceipt);
router.put("/:id", verifyToken, updateCashReceipt);
router.delete("/:id", verifyToken, deleteCashReceipt);
router.get(
  "/export/excel",
  verifyToken,
  exportCashReceiptExcel
);
router.get("/:id/print", verifyToken, printCashReceipt);
export default router;