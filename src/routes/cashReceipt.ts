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
router.get("/voucher",  getCashReceiptVoucher);
router.get("/:id",  getcashReceiptById);
router.post("/", verifyToken, createCashReceipt);
router.put("/:id", verifyToken, updateCashReceipt);
router.delete("/:id", verifyToken, deleteCashReceipt);
router.get(
  "/export/excel",
 
  exportCashReceiptExcel
);
router.get("/:id/print",  printCashReceipt);
export default router;