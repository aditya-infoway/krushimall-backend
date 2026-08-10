import { Router } from "express";
import {
  createCashPayment,
  getCashPayments,
  getCashPaymentById,
  updateCashPayment,
  deleteCashPayment,
  getCashPaymentVoucher,
  exportCashPaymentExcel
} from "../controllers/cashPayment.js";
import { verifyToken } from "../middleware/middleware.js";
const router = Router();

// Generate Voucher No.
router.get("/generate-voucher", getCashPaymentVoucher);

// CRUD
router.post("/", verifyToken, createCashPayment);
router.get("/",  getCashPayments);
router.get("/:id",  getCashPaymentById);
router.put("/:id", verifyToken, updateCashPayment);
router.delete("/:id", verifyToken, deleteCashPayment);
router.get("/export/excel", exportCashPaymentExcel);
export default router;