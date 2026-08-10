import { Router } from "express";
import {
  getBankPayments,
  getBankPaymentById,
  getBankPaymentVoucher,
  createBankPayment,
  updateBankPayment,
  deleteBankPayment,
  exportBankPaymentExcel
} from "../controllers/bankPayment.js";
import { verifyToken } from "../middleware/middleware.js";

const router = Router();

// Voucher
router.get("/voucher",  getBankPaymentVoucher);

// CRUD
router.get("/", verifyToken, getBankPayments);

router.get("/:id", verifyToken, getBankPaymentById);

router.post("/", verifyToken, createBankPayment);

router.put("/:id", verifyToken, updateBankPayment);

router.delete("/:id", verifyToken, deleteBankPayment);
router.get(
  "/export/excel",
  verifyToken,
  exportBankPaymentExcel
);
export default router;