import { Router } from "express";
import {
  createCashPayment,
  getCashPayments,
  getCashPaymentById,
  updateCashPayment,
  deleteCashPayment,
  getCashPaymentVoucher,
} from "../controllers/cashPayment.js";
import { verifyToken } from "../middleware/middleware.js";
const router = Router();

// Generate Voucher No.
router.get("/generate-voucher", getCashPaymentVoucher);

// CRUD
router.post("/", verifyToken, createCashPayment);
router.get("/", verifyToken, getCashPayments);
router.get("/:id", verifyToken, getCashPaymentById);
router.put("/:id", verifyToken, updateCashPayment);
router.delete("/:id", verifyToken, deleteCashPayment);

export default router;